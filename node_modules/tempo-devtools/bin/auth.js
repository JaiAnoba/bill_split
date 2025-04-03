// auth.js
const path = require('path');
const shell = require('shelljs');
const fs = require('fs').promises;
const os = require('os');
const { execShellCommand } = require('./utils');

function startNodeServerForAuth(scriptPath) {
  return new Promise((resolve, reject) => {
    const serverProcess = shell.exec(`node "${scriptPath}"`, (error) => {
      if (error) reject(error);
    });

    resolve(serverProcess);
  });
}

// Wait for credentials file and read
async function waitForCredentialsAndRead() {
  // Update the credentials path to point to the new location
  const homeDir = os.homedir();
  const credentialsDir = path.join(homeDir, '.tempo');
  const credentialsPath = path.join(credentialsDir, 'credentials.txt');

  while (true) {
    try {
      await fs.access(credentialsPath);
      const credentialsContent = await fs.readFile(credentialsPath, 'utf8');
      const credentials = JSON.parse(credentialsContent);
      await fs.unlink(credentialsPath); // Delete after reading
      return credentials;
    } catch {
      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

const IDENTITY_FILE_PATH = path.join(os.homedir(), '.ssh', 'tempo_id_rsa');

async function createSSHKeyIfNotExist() {
  try {
    await fs.access(IDENTITY_FILE_PATH);
    console.log('SSH key already exists.');
  } catch {
    console.log('SSH key does not exist. Creating new one...');
    await execShellCommand(
      `ssh-keygen -t rsa -b 2048 -f "${IDENTITY_FILE_PATH}" -q -N ""`,
    );
  }

  return IDENTITY_FILE_PATH;
}

function isHostWithRootUserPresent(sshConfig, hostName, userName) {
  // Split the config into lines
  const lines = sshConfig.split('\n');

  let currentHost = '';

  for (let line of lines) {
    // Trim whitespace
    line = line.trim();

    // Check if the line starts with "Host " to find a new host entry
    if (line.startsWith('Host ')) {
      // Extract the host name
      currentHost = line.substring(5).trim();
      continue;
    }

    // Check if the line starts with "User " to find the user entry
    if (line.startsWith('User ')) {
      // Extract the user name
      const currentUser = line.substring(5).trim();

      // Check if the current host matches the provided host and has the right user
      if (currentHost === hostName && currentUser === userName) {
        return true;
      }
    }
  }

  // No matches found
  return false;
}

async function updateSshConfig(sshHost) {
  const sshConfigEntry = `
      Host ${sshHost}
          HostName ${sshHost}
          User root
          StrictHostKeyChecking no
          UserKnownHostsFile /dev/null
          IdentityFile ${IDENTITY_FILE_PATH}
        `;
  const sshConfigFilePath = path.join(os.homedir(), '.ssh', 'config');
  try {
    // Check if the SSH config file already exists and has the entry
    const existingConfig = await fs.readFile(sshConfigFilePath, 'utf8');
    if (!isHostWithRootUserPresent(existingConfig, sshHost, 'root')) {
      await fs.appendFile(sshConfigFilePath, sshConfigEntry);
      console.log('SSH config entry added.');
    } else {
      console.log('SSH config entry already exists.');
    }
  } catch (error) {
    // The SSH config file does not exist or other error
    if (error.code === 'ENOENT') {
      await fs.writeFile(sshConfigFilePath, sshConfigEntry);
      console.log('SSH config file created and entry added.');
    } else {
      throw error;
    }
  }
}

function buildLoginUrl() {
  const tempoEnv = process.env.TEMPO_ENV || 'PROD'; // Default to 'PROD' if not set

  const LOGIN_URLS = {
    DEV: 'http://localhost:3050/localLogin',
    STAGING: 'https://staging.tempolabs.ai/localLogin',
    PROD: 'https://app.tempolabs.ai/localLogin',
  };

  return LOGIN_URLS[tempoEnv.toUpperCase()] || LOGIN_URLS['PROD'];
}

async function login() {
  let serverProcess;
  try {
    const LOGIN_URL = buildLoginUrl();
    const serverScriptPath = path.join(__dirname, 'server-script.js');
    serverProcess = await startNodeServerForAuth(serverScriptPath);

    shell.exec(`open "${LOGIN_URL}"`);

    const credentials = await waitForCredentialsAndRead();

    // Save credentials to a file
    const homeDir = os.homedir();
    const tempoDir = path.join(homeDir, '.tempo');
    await fs.mkdir(tempoDir, { recursive: true });
    await fs.writeFile(
      path.join(tempoDir, 'auth.json'),
      JSON.stringify(credentials),
      'utf8',
    );

    await createSSHKeyIfNotExist();

    console.log('Authentication successful. You can now run "npx tempo setup"');
  } catch (error) {
    console.error(`Authentication failed: ${error.message}`);
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

async function logout() {
  const homeDir = os.homedir();
  const tempoDir = path.join(homeDir, '.tempo');
  const credentialsPath = path.join(tempoDir, 'auth.json');

  try {
    // Check if the file exists
    await fs.access(credentialsPath);
    await fs.unlink(credentialsPath);
    console.log('You have been logged out.');
  } catch (error) {
    // Handle error if the file does not exist or cannot be accessed
    if (error.code === 'ENOENT') {
      console.log('You are not logged in.');
    } else {
      console.error(`Error logging out: ${error.message}`);
    }
  }
}

async function isAuthenticated() {
  const homeDir = os.homedir();
  const tempoDir = path.join(homeDir, '.tempo');
  const credentialsPath = path.join(tempoDir, 'auth.json');
  try {
    await fs.access(credentialsPath);
    const credentialsContent = await fs.readFile(credentialsPath, 'utf8');
    const credentials = JSON.parse(credentialsContent);

    return credentials;
  } catch {
    return null;
  }
}

module.exports = {
  login,
  logout,
  isAuthenticated,
  IDENTITY_FILE_PATH,
  createSSHKeyIfNotExist,
  updateSshConfig,
};
