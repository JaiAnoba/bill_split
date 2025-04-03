const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const axios = require('axios');
const {
  execShellCommand,
  readJsonFile,
  writeJsonFile,
  CONFIG_FILE,
} = require('./utils');
const { buildBackendUrl, buildSshHost } = require('./urls');
const {
  isAuthenticated,
  IDENTITY_FILE_PATH,
  updateSshConfig,
} = require('./auth');
const os = require('os');
const { exec } = require('child_process');
const { installRequiredPackages } = require('./toolchain');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const checkUserAuthentication = async () => {
  const credentials = await isAuthenticated();

  if (!credentials) {
    console.log(
      'You are not logged in. Please run "npx tempo auth login" first.',
    );
    process.exit(1);
  }

  return { credentials };
};

const assertCanvasIdAccess = async (canvasId, authToken) => {
  console.log(`Checking if user has access to canvas ${canvasId}...`);
  const backendUrl = buildBackendUrl();

  try {
    const res = await axios.get(
      `${backendUrl}/canvases/${canvasId}/devServer/devServerStatus`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
  } catch (error) {
    // We only care about 403 errors because that indicates the user does not have access to the canvasId.
    if (
      error.response &&
      (error.response.status === 403 || error.response.status === 401)
    ) {
      console.log('You do not have access to this canvas.');
      process.exit(1);
    }
  } finally {
    return true;
  }
};

const checkExistingDirectory = async (canvasDir) => {
  try {
    await fs.access(canvasDir);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question(
        'A directory for this canvas already exists. Do you want to overwrite it? (y/n): ',
        resolve,
      );
    });

    rl.close();

    if (answer.toLowerCase() !== 'y') {
      console.log('Operation cancelled.');
      process.exit(0);
    }
  } catch (error) {
    // Directory doesn't exist, which is fine
  }
};

const ensureSshContainerExists = async (canvasId, authToken) => {
  const backendUrl = buildBackendUrl();
  const URL = `${backendUrl}/canvases/${canvasId}/createSshContainer`;
  const publicSshKey = await fs.readFile(`${IDENTITY_FILE_PATH}.pub`, 'utf8');
  const PAYLOAD = { publicSshKey };

  try {
    const response = await axios.post(URL, PAYLOAD, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const { dockerContainerName, sshPort, devServerCommands, serverPort } =
      response.data;

    const config = await readJsonFile(CONFIG_FILE, {
      fallback: {},
    });

    config.container_name = dockerContainerName;
    config.port = sshPort;
    config.tempo_canvas_id = canvasId;
    config.dev_server_port = serverPort;
    config.install = devServerCommands[0];
    config.run = devServerCommands[devServerCommands.length - 1];

    await writeJsonFile(CONFIG_FILE, config);

    return { dockerContainerName, sshPort };
  } catch (error) {
    throw new Error(`Error launching SSH server: ${error}`);
  }
};
const syncRemoteToLocal = async () => {
  const config = await readJsonFile(CONFIG_FILE, {
    fallback: {},
  });

  const dockerContainerName = config.container_name;
  const sshPort = config.port;

  // Check if the value is empty and set to "PROD" if it is
  const TEMPO_ENV = process.env.TEMPO_ENV || 'PROD';

  // Local directory and remote server details
  const LOCAL_DIR = process.cwd();

  let SSH_REMOTE;
  if (TEMPO_ENV === 'PROD') {
    SSH_REMOTE = `root@ssh-${dockerContainerName}.dev.tempolabs.ai`;
  } else if (TEMPO_ENV === 'STAGING') {
    SSH_REMOTE = `root@ssh-${dockerContainerName}.staging-dev.tempolabs.ai`;
  } else {
    SSH_REMOTE = 'root@localhost';
  }

  const SSH_COMMAND = `ssh -o StrictHostKeyChecking=no -p ${sshPort}`;

  // Sync from remote to local using rsync directly
  console.log('Syncing remote to local...');
  const RSYNC_COMMAND = `rsync -zuPrc --del -e "${SSH_COMMAND}" --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude 'tempo.local.json' ${SSH_REMOTE}:/app/ ${LOCAL_DIR}/`;

  // Execute rsync command
  await execShellCommand(RSYNC_COMMAND);
};

const setupWorkspace = async (canvasId) => {
  const canvasName = `canvas-${canvasId}`;
  const canvasDir = path.join(process.cwd(), canvasName);
  await checkExistingDirectory(canvasDir);

  console.log(`Creating workspace in ${canvasName}/`);
  await fs.mkdir(canvasDir, { recursive: true });
  process.chdir(canvasDir);
};

const installModules = async () => {
  console.log('Installing node modules...');
  const config = await readJsonFile(CONFIG_FILE, {
    fallback: {},
  });

  if (!config.install) {
    console.log('No install command found in tempo.local.json');
    process.exit(1);
  }

  await execShellCommand(config.install);
};

// Function to check if VSCode is installed
const checkVscodeInstalled = async () => {
  return new Promise((resolve, reject) => {
    exec('code --version', (error, stdout, stderr) => {
      if (error || stderr) {
        console.log('VSCode is not installed or not available in PATH.');
        return resolve(false);
      }
      console.log('VSCode is installed.');
      resolve(true);
    });
  });
};

// Function to open VSCode in the current project directory
const openVscode = async () => {
  const isVscodeInstalled = await checkVscodeInstalled();

  if (!isVscodeInstalled) {
    console.log('Skipping VSCode opening since it is not installed.');
    return;
  }

  try {
    console.log('Opening project in VSCode...');
    await execShellCommand('code .');
    console.log('VSCode opened successfully.');
  } catch (error) {
    console.log('Failed to open VSCode:', error.message);
  }
};

const executeRunScript = async () => {
  await execShellCommand(`sh ${path.join(__dirname, 'run.sh')}`);
};

const cleanup = async () => {
  console.log('\nDisconnecting from SSH server...');
  console.log('Shutting off development server...');
  console.log('Tempo CLI disconnected.');
  process.exit(0);
};

const connect = async ({ canvasId }) => {
  if (!UUID_REGEX.test(canvasId)) {
    console.log('connect: invalid canvasId');
    process.exit(1);
  }

  process.on('SIGINT', () => cleanup());
  process.on('SIGTERM', () => cleanup());

  try {
    await installRequiredPackages();
    const { credentials } = await checkUserAuthentication();
    await assertCanvasIdAccess(canvasId, credentials.authToken);
    console.log(`Connecting to canvas ${canvasId}...`);

    await setupWorkspace(canvasId);

    const { dockerContainerName } = await ensureSshContainerExists(
      canvasId,
      credentials.authToken,
    );

    const sshHost = await buildSshHost(
      dockerContainerName,
      process.env.TEMPO_ENV || 'PROD',
    );
    await updateSshConfig(sshHost);
    await syncRemoteToLocal();
    await installModules();
    await openVscode();
    await executeRunScript();
  } catch (error) {
    console.error('An error occurred:', error.message);
    process.exit(1);
  } finally {
    console.log('Tempo disconnected.');
  }
};

module.exports = { connect };
