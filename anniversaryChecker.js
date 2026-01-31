import cron from 'node-cron';
import moment from 'moment-timezone';
import { getAllAnniversaries } from './repository/databaseFunctions.js';
import { DiscordRequest } from './utils.js';

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
      const { user_id, anniversary_date, timezone, guild_id, channel_id } = anniversary;
      
      // Get current date/time in user's timezone
      const now = moment.tz(timezone);
      const currentDate = now.format('DD/MM');
      
      // Parse anniversary date (DD/MM/YYYY) and get DD/MM
      const [day, month] = anniversary_date.split('/');
      const anniversaryDayMonth = `${day}/${month}`;
      
      // Check if today is the anniversary
      if (currentDate === anniversaryDayMonth) {
        // Check if we're in the announcement hour (e.g., between 9-10 AM in their timezone)
        const currentHour = now.hour();
        
        if (currentHour === 9) { // Send at 9 AM in their timezone
          await sendAnniversaryMessage(user_id, anniversary_date, channel_id);
        }
      }
    }
  } catch (error) {
    console.error('Error checking anniversaries:', error);
  }
}

async function sendAnniversaryMessage(userId, anniversaryDate, channelId) {
  try {
    const [day, month, year] = anniversaryDate.split('/');
    const startYear = parseInt(year);
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
    
    console.log(`✅ Sent HRTversary message for user ${userId} in channel ${channelId}`);
  } catch (error) {
    console.error('Error sending HRTversary message:', error);
  }
}
