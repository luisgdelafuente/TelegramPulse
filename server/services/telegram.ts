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
      
      console.log('Executing Telegram MTProto client...');
      const { stdout, stderr } = await execAsync(pythonCommand);
      
      if (stderr && !stderr.includes('Warning')) {
        console.error('Telegram MTProto error:', stderr);
        return [];
      }
      
      const result = JSON.parse(stdout);
      
      if (result.error) {
        console.error('Telegram client error:', result.error);
        return [];
      }
      
      // result should be an array of TelegramMessage objects
      const messages: TelegramMessage[] = Array.isArray(result) ? result : [];
      console.log(`Retrieved ${messages.length} messages from Telegram`);
      
      return messages;
    } catch (error) {
      console.error('Failed to get messages from Telegram:', error);
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Validate MTProto credentials format
      if (!this.apiId || !this.apiHash || !this.phone) {
        console.log('Missing Telegram MTProto credentials');
        return false;
      }

      // Validate API ID is numeric
      if (!/^\d+$/.test(this.apiId)) {
        console.log('Invalid API ID format - must be numeric');
        return false;
      }

      // Validate API Hash format (alphanumeric string from my.telegram.org)
      if (this.apiHash.length < 16 || !/^[a-f0-9]+$/i.test(this.apiHash)) {
        console.log('Invalid API Hash format - must be hexadecimal string from my.telegram.org');
        return false;
      }

      // Validate phone number format
      if (!/^\+?[1-9]\d{1,14}$/.test(this.phone)) {
        console.log('Invalid phone number format');
        return false;
      }

      console.log('Telegram MTProto credentials validation passed');
      return true;
    } catch (error) {
      console.error('Telegram credential validation failed:', error);
      return false;
    }
  }
}