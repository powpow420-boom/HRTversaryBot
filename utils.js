import 'dotenv/config';
import timezones from './repository/Timezones.json' with { type: 'json' };
import moment from 'moment-timezone';

const timezoneSet = new Set(timezones);
export const DEFAULT_DATE_FORMAT = 'DD/MM/YYYY';
export const SUPPORTED_DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'];

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
    },
    ...options
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}

export function isValidTimezone(timezone) {
  if (typeof timezone !== 'string') {
    return false;
  }

  return timezoneSet.has(timezone.trim());
}

function formatGmtOffset(offsetMinutes) {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteOffset / 60);
  const minutes = absoluteOffset % 60;
  return `GMT${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getTimezoneLabelWithOffset(timezone) {
  if (!isValidTimezone(timezone)) {
    return timezone;
  }

  const offsetMinutes = moment.tz(timezone).utcOffset();
  const gmtOffset = formatGmtOffset(offsetMinutes);
  return `${timezone} (${gmtOffset})`;
}

export function getTimezoneAutocompleteChoices(input = '', limit = 25) {
  const normalizedInput = input.toLowerCase().trim();

  return timezones
    .map((timezone) => ({
      timezone,
      label: getTimezoneLabelWithOffset(timezone),
    }))
    .filter(({ timezone, label }) => (
      timezone.toLowerCase().includes(normalizedInput) ||
      label.toLowerCase().includes(normalizedInput)
    ))
    .slice(0, limit)
    .map(({ timezone, label }) => ({
      name: label,
      value: timezone,
    }));
}

export function resolveDateFormat(dateFormat) {
  if (typeof dateFormat !== 'string' || dateFormat.trim().length === 0) {
    return DEFAULT_DATE_FORMAT;
  }

  return dateFormat.trim().toUpperCase();
}

export function isSupportedDateFormat(dateFormat) {
  const normalizedFormat = resolveDateFormat(dateFormat);
  return SUPPORTED_DATE_FORMATS.includes(normalizedFormat);
}

export function normalizeDateInput(dateInput, dateFormat) {
  const normalizedFormat = resolveDateFormat(dateFormat);
  const parsedDate = moment(dateInput, normalizedFormat, true);

  if (!parsedDate.isValid()) {
    return null;
  }

  return parsedDate.format(normalizedFormat);
}
