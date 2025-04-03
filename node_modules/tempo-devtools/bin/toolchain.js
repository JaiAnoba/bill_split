const shell = require('shelljs');
const os = require('os');
const { execShellCommand } = require('./utils');

// ==================== OS Package Installation ====================

async function installOnDebian() {
  await execShellCommand('sudo apt update');
  await execShellCommand('sudo apt install -y rsync fswatch jq awk netcat');
}

async function installOnFedora() {
  await execShellCommand('sudo yum update');
  await execShellCommand('sudo yum install -y rsync fswatch jq awk netcat');
}

async function installOnMac() {
  if (!shell.which('brew')) {
    console.log('Homebrew not found. Installing Homebrew...');
    await execShellCommand(
      '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
    );
  }
  await execShellCommand('brew install rsync fswatch jq awk netcat');
}

function adviseWindowsUsers() {
  const message = `
    It seems you're using Windows. This script does not support Windows directly.
    We recommend using Windows Subsystem for Linux (WSL) for a Linux-like environment.
    Alternatively, you can manually install the tools using resources like Cygwin or Git Bash.
    `;
  console.log(message);
}

const installRequiredPackages = async () => {
  console.log('Installing required packages..');
  const platform = os.platform();
  if (platform === 'darwin') await installOnMac();
  else if (platform === 'linux') {
    const distro = await execShellCommand('source /etc/os-release && echo $ID');
    if (distro === 'ubuntu' || distro === 'debian') await installOnDebian();
    else if (distro === 'fedora' || distro === 'rhel') await installOnFedora();
    else
      console.log(
        'Unsupported Linux distribution. Please install rsync, fswatch, and jq manually.',
      );
  } else {
    adviseWindowsUsers();
  }
};

module.exports = { installRequiredPackages };
