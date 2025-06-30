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
      console.log('Command:', pythonCommand);
      
      // Add timeout to prevent hanging
      const { stdout, stderr } = await Promise.race([
        execAsync(pythonCommand),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Telegram script timeout after 60 seconds')), 60000)
        )
      ]);
      
      console.log('Python script stdout:', stdout);
      if (stderr) {
        console.log('Python script stderr:', stderr);
      }
      
      if (stderr && !stderr.includes('Warning') && !stderr.includes('DeprecationWarning')) {
        console.error('Telegram MTProto error:', stderr);
        throw new Error(`Telegram authentication failed: ${stderr}`);
      }
      
      if (!stdout || stdout.trim() === '') {
        console.error('No output from Telegram script');
        throw new Error('No response from Telegram - check credentials and network');
      }
      
      let result;
      try {
        result = JSON.parse(stdout);
      } catch (parseError) {
        console.error('Failed to parse JSON from Python script:', stdout);
        throw new Error('Invalid response format from Telegram script');
      }
      
      if (result.error) {
        console.error('Telegram client error:', result.error);
        throw new Error(`Telegram error: ${result.error}`);
      }
      
      // result should be an array of TelegramMessage objects
      const messages: TelegramMessage[] = Array.isArray(result) ? result : [];
      console.log(`Retrieved ${messages.length} messages from Telegram`);
      
      return messages;
    } catch (error) {
      console.error('Failed to get messages from Telegram:', error);
      throw error; // Re-throw to let the caller handle it
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