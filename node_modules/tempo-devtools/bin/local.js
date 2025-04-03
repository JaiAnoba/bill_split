const axios = require('axios');
const prompt = require('prompt-sync')({ sigint: true });
const readline = require('readline');
const shell = require('shelljs');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { exec } = require('child_process');
const {
  CONFIG_FILE,
  writeJsonFile,
  readJsonFile,
  execShellCommand,
} = require('./utils');
const { installRequiredPackages } = require('./toolchain');
const {
  isAuthenticated,
  IDENTITY_FILE_PATH,
  updateSshConfig,
} = require('./auth');
const { buildBackendUrl, buildSshHost } = require('./urls');

// ==================== Setup SSH Server ============================================

async function launchSshServer(backendUrl, canvasId, authToken) {
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

    console.log('Launch Container Response:', response.data);
    const { dockerContainerName, sshPort } = response.data;

    const config = await readJsonFile(CONFIG_FILE);
    config.container_name = dockerContainerName;
    config.port = sshPort;
    await writeJsonFile(CONFIG_FILE, config);

    return { dockerContainerName, sshPort };
  } catch (error) {
    throw new Error(`Error launching SSH server: ${error}`);
  }
}

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

// ==================== Tempo Authentication & Configuration ====================

async function linkNewProject(config, backend, token) {
  const URL = `${backend}/projects/linkLocal`;

  let repoName = path.basename(process.cwd());

  try {
    repoName = await execShellCommand('git remote get-url origin');
    repoName = repoName.split('/').slice(-2).join('/').replace('.git', '');
  } catch (error) {
    console.log('Using current directory name as repo name.');
  }

  const PAYLOAD = {
    framework: 'NEXT_JS',
    nodeVersion: '18',
    devServerPort: config.dev_server_port,
    customRunCommand: config.run,
    repoName,
    repoPath: repoName,
  };

  const response = await axios.post(URL, PAYLOAD, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const projectId = response.data.project?.id;
  const canvasId = response.data.canvas?.id;

  config.tempo_project_id = projectId;
  config.tempo_canvas_id = canvasId;
}

async function handleConfiguration(credentials) {
  // Read or initialize the configuration file
  let config;
  try {
    config = await readJsonFile(CONFIG_FILE);
  } catch (error) {
    console.log('Config file not found. Please enter the required values.');
    config = {};
  }

  // Set defaults or prompt for missing values
  config.run =
    config.run ||
    prompt('Enter the dev server run command (e.g., npm run dev): ');
  config.dev_server_port =
    config.dev_server_port || prompt('Enter the dev server port: ');

  // If canvas ID is missing, create a new project and canvas
  if (!config.tempo_canvas_id) {
    await linkNewProject(config, buildBackendUrl(), credentials.authToken);
  }

  if (!config.user_id) {
    config.user_id = credentials.userId;
  }

  await writeJsonFile(CONFIG_FILE, config);
  return { config };
}

const executeRunScript = async () => {
  await execShellCommand(`sh ${path.join(__dirname, 'run.sh')}`);
};

async function local() {
  let serverProcess;
  try {
    await installRequiredPackages();

    const { credentials } = await checkUserAuthentication();
    const { config } = await handleConfiguration(credentials);
    const { dockerContainerName } = await launchSshServer(
      buildBackendUrl(),
      config.tempo_canvas_id,
      credentials.authToken,
    );
    const sshHost = await buildSshHost(
      dockerContainerName,
      process.env.TEMPO_ENV || 'PROD',
    );
    await updateSshConfig(sshHost);

    await executeRunScript();
  } catch (error) {
    console.log(error);
    console.error(`An error occurred: ${error.message}`);
  } finally {
    // Kill the server process
    serverProcess.kill();
  }
}

module.exports = { local };
