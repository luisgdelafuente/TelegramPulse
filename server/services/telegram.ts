export interface TelegramMessage {
  id: number;
  text: string;
  date: number;
  channel: string;
  url?: string;
}

export class TelegramService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getRecentMessages(channels: string[], minutesBack: number = 20): Promise<TelegramMessage[]> {
    const messages: TelegramMessage[] = [];
    const cutoffTime = Math.floor(Date.now() / 1000) - (minutesBack * 60);

    for (const channel of channels) {
      try {
        const channelMessages = await this.getChannelMessages(channel, cutoffTime);
        messages.push(...channelMessages);
      } catch (error) {
        console.error(`Error fetching messages from ${channel}:`, error);
        // Continue with other channels even if one fails
      }
    }

    return messages;
  }

  private async getChannelMessages(channel: string, sinceTimestamp: number): Promise<TelegramMessage[]> {
    // Clean channel name (remove @ if present)
    const cleanChannel = channel.startsWith('@') ? channel.slice(1) : channel;
    
    try {
      // Using Telegram Bot API to get channel messages
      const response = await fetch(`https://api.telegram.org/bot${this.apiKey}/getUpdates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: `@${cleanChannel}`,
          limit: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`);
      }

      const messages: TelegramMessage[] = [];
      
      for (const update of data.result || []) {
        if (update.channel_post && update.channel_post.date >= sinceTimestamp) {
          const message = update.channel_post;
          if (message.text) {
            messages.push({
              id: message.message_id,
              text: message.text,
              date: message.date,
              channel: cleanChannel,
              url: `https://t.me/${cleanChannel}/${message.message_id}`,
            });
          }
        }
      }

      return messages;
    } catch (error) {
      console.error(`Failed to fetch messages from ${cleanChannel}:`, error);
      throw error;
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
