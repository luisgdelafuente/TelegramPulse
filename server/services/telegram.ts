export interface TelegramMessage {
  id: number;
  text: string;
  date: number;
  channel: string;
  url?: string;
}

export class TelegramService {
  private apiId: string;
  private apiHash: string;
  private phone: string;

  constructor(apiId: string, apiHash: string, phone: string) {
    this.apiId = apiId;
    this.apiHash = apiHash;
    this.phone = phone;
  }

  async getRecentMessages(channels: string[], minutesBack: number = 20): Promise<TelegramMessage[]> {
    try {
      console.log(`Using Telegram MTProto to get messages from ${channels.length} channels`);
      
      // Execute Python script using Telethon
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const channelsJson = JSON.stringify(channels);
      const pythonCommand = `python3 server/services/telegram_client.py "${this.apiId}" "${this.apiHash}" "${this.phone}" '${channelsJson}' ${minutesBack}`;
      
      console.log("Executing Telegram client...");
      const { stdout, stderr } = await execAsync(pythonCommand);
      
      if (stderr) {
        console.error("Python script error:", stderr);
        throw new Error(`Telegram client error: ${stderr}`);
      }
      
      const messages = JSON.parse(stdout);
      console.log(`Successfully retrieved ${messages.length} messages from Telegram`);
      
      return messages;
      
    } catch (error) {
      console.error("Error getting messages from Telegram:", error);
      throw error;
    }
  }

  private async getChannelMessages(channel: string, sinceTimestamp: number): Promise<TelegramMessage[]> {
    // Clean channel name (remove @ if present)
    const cleanChannel = channel.startsWith('@') ? channel.slice(1) : channel;
    
    try {
      console.log(`Attempting to get messages from ${cleanChannel} since ${new Date(sinceTimestamp * 1000).toISOString()}`);
      
      // For public channels, we need to use a different approach
      // The bot needs to be added to the channel as an administrator to read messages
      // Let's first try to get chat info to see if we have access
      const chatInfoResponse = await fetch(`https://api.telegram.org/bot${this.apiKey}/getChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: `@${cleanChannel}`,
        }),
      });

      if (!chatInfoResponse.ok) {
        console.log(`Cannot access channel info for ${cleanChannel}. Bot may not have access.`);
        return [];
      }

      const chatData = await chatInfoResponse.json();
      if (!chatData.ok) {
        console.log(`Telegram API error for ${cleanChannel}: ${chatData.description}`);
        return [];
      }

      const chatId = chatData.result.id;
      const chatType = chatData.result.type;
      
      console.log(`Channel ${cleanChannel} (ID: ${chatId}, Type: ${chatType})`);

      // Check if we can get chat administrators to see if our bot is an admin
      try {
        const adminsResponse = await fetch(`https://api.telegram.org/bot${this.apiKey}/getChatAdministrators`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: `@${cleanChannel}`,
          }),
        });

        if (adminsResponse.ok) {
          const adminsData = await adminsResponse.json();
          if (adminsData.ok) {
            const botInfo = await this.getBotInfo();
            const isBotAdmin = adminsData.result.some((admin: any) => admin.user.id === botInfo?.id);
            
            if (!isBotAdmin) {
              console.log(`Bot is not an administrator of ${cleanChannel}. Cannot read message history.`);
              return [];
            }
            console.log(`Bot is administrator of ${cleanChannel}. Proceeding to get messages.`);
          }
        }
      } catch (adminError) {
        console.log(`Could not check admin status for ${cleanChannel}:`, adminError);
      }

      // Try to get updates that might contain channel posts
      const updatesResponse = await fetch(`https://api.telegram.org/bot${this.apiKey}/getUpdates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 100,
          allowed_updates: ['channel_post', 'edited_channel_post'],
        }),
      });

      if (!updatesResponse.ok) {
        console.log(`Failed to get updates: ${updatesResponse.status}`);
        return [];
      }

      const updatesData = await updatesResponse.json();
      if (!updatesData.ok) {
        console.log(`Telegram API error: ${updatesData.description}`);
        return [];
      }

      const messages: TelegramMessage[] = [];
      const now = Math.floor(Date.now() / 1000);
      
      console.log(`Processing ${updatesData.result?.length || 0} updates, looking for channel ${cleanChannel} (ID: ${chatId})`);
      
      for (const update of updatesData.result || []) {
        if (update.channel_post && update.channel_post.chat) {
          const message = update.channel_post;
          const messageChannelId = message.chat.id;
          const messageAge = now - message.date;
          const minutesOld = messageAge / 60;
          
          console.log(`Found channel post from ${message.chat.username || message.chat.title} (ID: ${messageChannelId}), ${minutesOld.toFixed(1)} minutes old`);
          
          // Check if this message is from our target channel and within time range
          if (messageChannelId === chatId && message.date >= sinceTimestamp && message.text) {
            messages.push({
              id: message.message_id,
              text: message.text,
              date: message.date,
              channel: cleanChannel,
              url: `https://t.me/${cleanChannel}/${message.message_id}`,
            });
            console.log(`✓ Added message from ${cleanChannel}: ${message.text.substring(0, 100)}...`);
          }
        }
      }

      console.log(`Found ${messages.length} recent messages from ${cleanChannel} in the last ${(now - sinceTimestamp) / 60} minutes`);
      return messages;

    } catch (error) {
      console.error(`Failed to fetch messages from ${cleanChannel}:`, error);
      return [];
    }
  }

  private async getBotInfo(): Promise<any> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.apiKey}/getMe`);
      const data = await response.json();
      return data.ok ? data.result : null;
    } catch (error) {
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.apiKey}/getMe`);
      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      return false;
    }
  }
}
