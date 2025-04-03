const fs = require('fs').promises;
const path = require('path');
const shell = require('shelljs');

const CONFIG_FILE = 'tempo.local.json';

// ==================== SHELL COMMAND FUNCTIONS ====================

async function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    shell.exec(cmd, { silent: false }, (code, stdout, stderr) => {
      if (code !== 0) reject(new Error(stderr));
      resolve(stdout.trim());
    });
  });
}

// ==================== FILE SYSTEM FUNCTIONS ====================

async function readJsonFile(filePath, options = {}) {
  const { fallback } = options;
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (fallback) {
      return fallback;
    }

    throw new Error(`Error reading JSON file: ${error.message}`);
  }
}

async function writeJsonFile(filePath, jsonObject) {
  try {
    const content = JSON.stringify(jsonObject, null, 4);
    await fs.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Error writing JSON file: ${error.message}`);
  }
}

module.exports = {
  execShellCommand,
  readJsonFile,
  writeJsonFile,
  CONFIG_FILE,
};
