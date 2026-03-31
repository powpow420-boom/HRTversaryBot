import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

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
      name: 'date_format',
      description: 'Date format: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY',
      required: true,
    },
    {
      type: 3,
      name: 'date',
      description: 'Your HRT start date (must match date_format)',
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
      name: 'date_format',
      description: 'Date format: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY',
      required: true,
    },
    {
      type: 3,
      name: 'date',
      description: 'Your new HRT start date (must match date_format)',
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
