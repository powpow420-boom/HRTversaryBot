import 'dotenv/config';
import express from 'express';
import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import {
  DEFAULT_DATE_FORMAT,
  getTimezoneAutocompleteChoices,
  getTimezoneLabelWithOffset,
  isSupportedDateFormat,
  isValidTimezone,
  normalizeDateInput,
  resolveDateFormat,
  SUPPORTED_DATE_FORMATS,
} from './utils.js';
import { createTable } from './repository/databaseCheck.js';
import { getUserAnniversary, databaseSave } from './repository/databaseFunctions.js';
import { updateUserAnniversary } from './repository/databaseFunctions.js';
import { startAnniversaryChecker, runManualAnniversaryCheck } from './anniversaryChecker.js';

// Create an express app
const app = express();

// Initialize database
await createTable();

// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

// Simple route to verify server is running
app.get('/', (req, res) => {
  res.send('Discord bot server is running! 🤖');
});

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
    const commandName = data?.name;

    if (commandName === 'add_hrtversary' || commandName === 'change_hrtversary') {
      const focusedOption = data.options?.find((option) => option.focused === true);

      if (focusedOption?.name === 'timezone') {
        const choices = getTimezoneAutocompleteChoices(focusedOption.value ?? '', 25);

        return res.send({
          type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
          data: {
            choices,
          },
        });
      }
    }

    return res.send({
      type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
      data: {
        choices: [],
      },
    });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (name === 'show_hrtversary') {
      // Send a message into the channel where command was triggered from
      const userId = req.body.member.user.id || req.body.user.id;
      const guildId = req.body.guild_id;

      try {
        const anniversaryData = await getUserAnniversary(userId, guildId);

        if (anniversaryData) {
          const dateFormat = anniversaryData.dateFormat || DEFAULT_DATE_FORMAT;
          const timezoneWithOffset = getTimezoneLabelWithOffset(anniversaryData.timezone);
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `🏳️‍⚧️ **Your HRTversary Information** 💉\n\n` +
                       `📅 HRT Start Date: ${anniversaryData.anniversaryDate}\n` +
                       `🗓️ Date Format: ${dateFormat}\n` +
                       `🌍 Timezone: ${timezoneWithOffset}\n` +
                       `👤 User ID: ${anniversaryData.userId}`,
            },
          });
        } else {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `You have not set your HRTversary date yet. Use /add_hrtversary to set it!`,
            },
          });
        }
      }
      catch (error) {
        console.error('Error fetching HRTversary data:', error);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `An error occurred while fetching your HRTversary information.`,
          },
        });
      }
    }

    if (name === 'add_hrtversary') {
      const userId = req.body.member?.user?.id || req.body.user?.id;
      const guildId = req.body.guild_id;
      const channelId = req.body.channel_id;
      const dateInput = data.options.find(opt => opt.name === 'date')?.value;
      const timezone = data.options.find(opt => opt.name === 'timezone')?.value;
      const rawDateFormat = data.options.find(opt => opt.name === 'date_format')?.value;

      if (!rawDateFormat) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `❌ date_format is required. Supported formats: ${SUPPORTED_DATE_FORMATS.join(', ')}`,
          },
        });
      }

      const dateFormat = resolveDateFormat(rawDateFormat);

      if (!isSupportedDateFormat(dateFormat)) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `❌ Invalid date_format. Supported formats: ${SUPPORTED_DATE_FORMATS.join(', ')}`,
          },
        });
      }

      const normalizedDate = normalizeDateInput(dateInput, dateFormat);

      if (!normalizedDate) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `❌ Invalid date for format ${dateFormat}.`,
          },
        });
      }

      if (!isValidTimezone(timezone)) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `❌ Invalid timezone. Please pick a valid timezone from the command options.`,
          },
        });
      }

      try {
        // Check if user already has an HRTversary
        const existingAnniversary = await getUserAnniversary(userId, guildId);
        
        if (existingAnniversary) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `❌ You already have an HRTversary set!\n\n` +
                       `📅 Current date: ${existingAnniversary.anniversaryDate}\n` +
                       `🗓️ Date format: ${existingAnniversary.dateFormat || DEFAULT_DATE_FORMAT}\n` +
                       `🌍 Timezone: ${existingAnniversary.timezone}\n\n` +
                       `Use /change_hrtversary to update it, or /show_hrtversary to view it.`,
            },
          });
        }

        // Save to database
        const timezoneWithOffset = getTimezoneLabelWithOffset(timezone);
        const userData = {
          userId: userId,
          anniversaryDate: normalizedDate,
          timezone: timezone,
          dateFormat: dateFormat,
          guildId: guildId,
          channelId: channelId
        };

        await databaseSave(userData);

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `✅ 🏳️‍⚧️ **HRTversary Set!** 💉\n\n` +
              `📅 HRT Start Date: ${normalizedDate}\n` +
              `🗓️ Date Format: ${dateFormat}\n` +
                     `🌍 Timezone: ${timezoneWithOffset}\n\n` +
                     `I'll announce your HRTversary in this channel every year! 💖`,
          },
        });
      } catch (error) {
        console.error('Error saving HRTversary:', error);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `❌ Error saving your HRTversary. Please try again.`,
          },
        });
      }
    }

    if (name === 'change_hrtversary') {
      const userId = req.body.member?.user?.id || req.body.user?.id;
      const guildId = req.body.guild_id;
      const channelId = req.body.channel_id;
      const dateInput = data.options.find(opt => opt.name === 'date')?.value;
      const timezone = data.options.find(opt => opt.name === 'timezone')?.value;
      const rawDateFormat = data.options.find(opt => opt.name === 'date_format')?.value;

      if (!rawDateFormat) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `❌ date_format is required. Supported formats: ${SUPPORTED_DATE_FORMATS.join(', ')}`,
          },
        });
      }

      if (!isValidTimezone(timezone)) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `❌ Invalid timezone. Please pick a valid timezone from the command options.`,
          },
        });
      }

      try {
        const existingAnniversary = await getUserAnniversary(userId, guildId);
        const dateFormat = resolveDateFormat(rawDateFormat);

        if (!isSupportedDateFormat(dateFormat)) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `❌ Invalid date_format. Supported formats: ${SUPPORTED_DATE_FORMATS.join(', ')}`,
            },
          });
        }

        const normalizedDate = normalizeDateInput(dateInput, dateFormat);
        const timezoneWithOffset = getTimezoneLabelWithOffset(timezone);

        if (!normalizedDate) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `❌ Invalid date for format ${dateFormat}.`,
            },
          });
        }

        // Update in database
        await updateUserAnniversary(userId, guildId, normalizedDate, timezone, dateFormat, channelId);

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `✅ 🏳️‍⚧️ **HRTversary Updated!** 💉\n\n` +
                     `📅 New HRT Start Date: ${normalizedDate}\n` +
                     `🗓️ Date Format: ${dateFormat}\n` +
                     `🌍 Timezone: ${timezoneWithOffset}\n\n` +
                     `Your HRTversary has been updated! 💖`,
          },
        });
      } catch (error) {
        console.error('Error updating HRTversary:', error);
        
        if (error.message === 'No anniversary found for this user') {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `❌ You haven't set an HRTversary yet! Use /add_hrtversary first.`,
            },
          });
        }
        
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `❌ Error updating your HRTversary. Please try again.`,
          },
        });
      }
    }

    if (name === 'verify_timezone') {
      const userId = req.body.member?.user?.id || req.body.user?.id;
      const guildId = req.body.guild_id;

      try {
        const userData = await getUserAnniversary(userId, guildId);

        if (!userData) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `❌ You haven't set an HRTversary yet. Use /add_hrtversary first.`,
            }
          });
        }

        const timezoneCheck = isValidTimezone(userData.timezone);

        if (timezoneCheck === true) {
          const timezoneWithOffset = getTimezoneLabelWithOffset(userData.timezone);
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `✅ Chosen timezone "${timezoneWithOffset}" is valid`
            }
          });
        }
        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data:{
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `❌ Chosen timezone "${userData.timezone}" is not valid please change it `
            }
          });

      } catch (err){
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `❌ Error checking your timezone. Please try again.`,
          },
        });
      }
    }

    if (name === 'check_anniversary') {
      try {
        await runManualAnniversaryCheck();

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `✅ Manual anniversary check completed.`,
          },
        });
      } catch (error) {
        console.error('Error running manual anniversary check:', error);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `❌ Failed to run manual anniversary check.`,
          },
        });
      }
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
  
  // Start the anniversary checker
  startAnniversaryChecker();
});
