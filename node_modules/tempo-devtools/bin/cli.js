#!/usr/bin/env node

const { connect } = require('./connect');
const { local } = require('./local');
const { login, logout } = require('./auth');
const [command, ...args] = process.argv.slice(2);

const HELP_MESSAGE = `
  Usage: npx tempo <command> [options]

  Commands:
    auth <login|logout>         Authenticate with the system
      - login                   Log into your account
      - logout                  Log out from your account

    local (or run-local)        Run the application locally

    connect <canvasId> (or connect-cloud)
                                Connect to a specific canvas by providing the canvasId

  Options:
    help                        Display this help message and exit

  Examples:
    npx tempo auth login        Log into your account
    npx tempo local             Run the application locally
    npx tempo connect abc123    Connect to canvas with ID 'abc123'

  For more information on each command, use npx tempo <command> --help.
`;

switch (command) {
  case 'help':
    console.log(HELP_MESSAGE);
    break;
  case 'auth':
    if (args.length != 1 || (args[0] !== 'login' && args[0] !== 'logout')) {
      console.log(`Usage: npx tempo auth login|logout`);
      process.exit(1);
    }

    if (args[0] === 'login') {
      login();
    } else if (args[0] === 'logout') {
      logout();
    }

    break;
  case 'local':
  case 'run-local':
    local();
    break;
  case 'connect':
  case 'connect-cloud':
    if (args.length != 1) {
      console.log(`Usage: npx tempo connect <canvasId>`);
      process.exit(1);
    }

    connect({
      canvasId: args[0],
    });

    break;
  default:
    console.log(`Unknown command: ${command}`);
    process.exit(1);
}
