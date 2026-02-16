import 'dotenv/config';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

const SHOW_ANNIVERSARY_USER_COMMAND = {
  name: 'show_hrtversary',
  description: 'Show your HRT anniversary information',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
}

const ADD_ANNIVERSARY_COMMAND = {
  name: 'add_hrtversary',
  description: 'Set your HRT anniversary date',
  options: [
    {
      type: 3,
      name: 'date',
      description: 'Your HRT start date (DD/MM/YYYY)',
      required: true,
    },
    {
      type: 3,
      name: 'timezone',
      description: 'Your timezone (e.g., America/New_York, Europe/London, Asia/Tokyo)',
      required: true,
      autocomplete: true,
    },
  ],
  type: 1,
  integration_types: [0],
  contexts: [0],
}

const CHANGE_ANNIVERSARY_COMMAND = {
  name: 'change_hrtversary',
  description: 'Update your HRT anniversary date',
  options: [
    {
      type: 3,
      name: 'date',
      description: 'Your new HRT start date (DD/MM/YYYY)',
      required: true,
    },
    {
      type: 3,
      name: 'timezone',
      description: 'Your timezone (e.g., America/New_York, Europe/London, Asia/Tokyo)',
      required: true,
      autocomplete: true,
    },
  ],
  type: 1,
  integration_types: [0],
  contexts: [0],
}

const VERIFY_TIMEZONE_COMMAND = {
  name: 'verify_timezone',
  description: 'Verify selected timezone for HRT anniversary',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
}

const CHECK_ANNIVERSARY_COMMAND = {
  name: 'check_anniversary',
  description: 'Manually run the anniversary check now',
  type: 1,
  integration_types: [0],
  contexts: [0],
}

const ALL_COMMANDS = [SHOW_ANNIVERSARY_USER_COMMAND, ADD_ANNIVERSARY_COMMAND, CHANGE_ANNIVERSARY_COMMAND, VERIFY_TIMEZONE_COMMAND, CHECK_ANNIVERSARY_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
