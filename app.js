import 'dotenv/config';
import express from 'express';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji, DiscordRequest } from './utils.js';
import { getShuffledOptions, getResult } from './game.js';
import { createTable } from './repository/databaseCheck.js';
import { getUserAnniversary, databaseSave } from './repository/databaseFunctions.js';
import { updateUserAnniversary } from './repository/databaseFunctions.js';
import { startAnniversaryChecker } from './anniversaryChecker.js';

// Create an express app
const app = express();

// Initialize database
await createTable();

// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

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

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" command
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              // Fetches a random emoji to send from a helper function
              content: `hello world ${getRandomEmoji()}`
            }
          ]
        },
      });
    }

    if (name === 'show_hrtversary') {
      // Send a message into the channel where command was triggered from
      const userId = req.body.member.user.id || req.body.user.id;

      try {
        const anniversaryData = await getUserAnniversary(userId);

        if (anniversaryData) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `🏳️‍⚧️ **Your HRTversary Information** 💉\n\n` +
                       `📅 HRT Start Date: ${anniversaryData.anniversaryDate}\n` +
                       `🌍 Timezone: ${anniversaryData.timezone}\n` +
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

      // Validate date format (DD/MM/YYYY)
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const dateMatch = dateInput.match(dateRegex);

      if (!dateMatch) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `❌ Invalid date format. Please use DD/MM/YYYY (e.g., 25/12/2020)`,
          },
        });
      }

      try {
        // Check if user already has an HRTversary
        const existingAnniversary = await getUserAnniversary(userId);
        
        if (existingAnniversary) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.EPHEMERAL,
              content: `❌ You already have an HRTversary set!\n\n` +
                       `📅 Current date: ${existingAnniversary.anniversaryDate}\n` +
                       `🌍 Timezone: ${existingAnniversary.timezone}\n\n` +
                       `Use /change_hrtversary to update it, or /show_hrtversary to view it.`,
            },
          });
        }

        // Save to database
        const userData = {
          userId: userId,
          anniversaryDate: dateInput,
          timezone: timezone,
          guildId: guildId,
          channelId: channelId
        };

        await databaseSave(userData);

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `✅ 🏳️‍⚧️ **HRTversary Set!** 💉\n\n` +
                     `📅 HRT Start Date: ${dateInput}\n` +
                     `🌍 Timezone: ${timezone}\n\n` +
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
      const channelId = req.body.channel_id;
      const dateInput = data.options.find(opt => opt.name === 'date')?.value;
      const timezone = data.options.find(opt => opt.name === 'timezone')?.value;

      // Validate date format (DD/MM/YYYY)
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const dateMatch = dateInput.match(dateRegex);

      if (!dateMatch) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `❌ Invalid date format. Please use DD/MM/YYYY (e.g., 25/12/2020)`,
          },
        });
      }

      try {
        // Update in database
        await updateUserAnniversary(userId, dateInput, timezone, channelId);

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.EPHEMERAL,
            content: `✅ 🏳️‍⚧️ **HRTversary Updated!** 💉\n\n` +
                     `📅 New HRT Start Date: ${dateInput}\n` +
                     `🌍 Timezone: ${timezone}\n\n` +
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
