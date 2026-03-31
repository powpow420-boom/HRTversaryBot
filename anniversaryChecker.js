import cron from 'node-cron';
import moment from 'moment-timezone';
import { getAllAnniversaries } from './repository/databaseFunctions.js';
import { DEFAULT_DATE_FORMAT, DiscordRequest, resolveDateFormat } from './utils.js';

// Check anniversaries every hour
export function startAnniversaryChecker() {
  console.log('�️‍⚧️ HRTversary checker started!');
  
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('Checking for HRTversaries...');
    await checkAnniversaries();
  });

  // Also check on startup
  checkAnniversaries();
}

async function checkAnniversaries() {
  try {
    const anniversaries = await getAllAnniversaries();
    
    for (const anniversary of anniversaries) {
      const { user_id, anniversary_date, timezone, guild_id, channel_id, date_format } = anniversary;
      const dateFormat = resolveDateFormat(date_format || DEFAULT_DATE_FORMAT);
      
      // Get current date/time in user's timezone
      const now = moment.tz(timezone);
      const currentDate = now.format('MM-DD');
      
      // Parse anniversary date using user's preferred format.
      const parsedAnniversary = moment(anniversary_date, dateFormat, true);

      if (!parsedAnniversary.isValid()) {
        console.error(`Skipping invalid anniversary date for user ${user_id}. date=${anniversary_date}, format=${dateFormat}`);
        continue;
      }

      const anniversaryDayMonth = parsedAnniversary.format('MM-DD');
      
      // Check if today is the anniversary
      if (currentDate === anniversaryDayMonth) {
        // Check if we're in the announcement hour (e.g., between 9-10 AM in their timezone)
        const currentHour = now.hour();
        
        if (currentHour === 9) { // Send at 9 AM in their timezone
          await sendAnniversaryMessage(user_id, anniversary_date, dateFormat, guild_id, channel_id);
        }
      }
    }
  } catch (error) {
    console.error('Error checking anniversaries:', error);
  }
}

export async function runManualAnniversaryCheck() {
  await checkAnniversaries();
}

async function canSendAnnouncement(userId, guildId, channelId) {
  try {
    const channelResponse = await DiscordRequest(`channels/${channelId}`, {
      method: 'GET',
    });

    const channel = await channelResponse.json();

    if (!channel?.guild_id || channel.guild_id !== guildId) {
      return false;
    }

    await DiscordRequest(`guilds/${guildId}/members/${userId}`, {
      method: 'GET',
    });

    return true;
  } catch (error) {
    return false;
  }
}

async function sendAnniversaryMessage(userId, anniversaryDate, dateFormat, guildId, channelId) {
  try {
    const allowedToSend = await canSendAnnouncement(userId, guildId, channelId);

    if (!allowedToSend) {
      console.log(`⏭️ Skipping announcement for user ${userId} in guild ${guildId} (user not in guild or channel mismatch).`);
      return;
    }

    const parsedAnniversary = moment(anniversaryDate, dateFormat, true);

    if (!parsedAnniversary.isValid()) {
      console.error(`Cannot send announcement with invalid date for user ${userId}. date=${anniversaryDate}, format=${dateFormat}`);
      return;
    }

    const startYear = parsedAnniversary.year();
    const currentYear = new Date().getFullYear();
    const yearsOnHRT = currentYear - startYear;
    
    const message = {
      content: `🏳️‍⚧️ 💉 **HAPPY HRTVERSARY!** 💉 🏳️‍⚧️\n\n@everyone\n\n🎉 Today marks **${yearsOnHRT} year${yearsOnHRT !== 1 ? 's' : ''}** since <@${userId}> started their HRT journey! 🎉\n\nStarted: ${anniversaryDate}\n\nLet's celebrate this amazing milestone! You're valid, you're loved, and you're amazing! 💖✨🌈`
    };

    const endpoint = `channels/${channelId}/messages`;
    
    await DiscordRequest(endpoint, {
      method: 'POST',
      body: message
    });
    
    console.log(`✅ Sent HRTversary message for user ${userId} in guild ${guildId} channel ${channelId}`);
  } catch (error) {
    console.error('Error sending HRTversary message:', error);
  }
}
