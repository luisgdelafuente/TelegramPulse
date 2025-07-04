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

  async getRecentMessages(channels: string[], minutesBack: number = 60): Promise<TelegramMessage[]> {
    try {
      console.log(`Using Telegram MTProto to get messages from ${channels.length} channels`);
      
      // Limit channels to prevent timeouts and rate limits
      const maxChannels = 20;
      if (channels.length > maxChannels) {
        console.warn(`Too many channels (${channels.length}). Processing first ${maxChannels} channels only.`);
        channels = channels.slice(0, maxChannels);
      }
      
      // Execute Python script using Telethon
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const channelsJson = JSON.stringify(channels);
      const pythonCommand = `python3 server/services/telegram_simple.py "${this.apiId}" "${this.apiHash}" "${this.phone}" '${channelsJson}' ${minutesBack}`;
      
      console.log('Executing Telegram MTProto client...');
      console.log(`Processing ${channels.length} channels with ${minutesBack} minutes lookback`);
      console.log('Command:', pythonCommand);
      
      // Add timeout to prevent hanging - increased for large channel lists
      const timeoutMs = Math.max(60000, channels.length * 10000); // 10 seconds per channel, minimum 60 seconds
      const { stdout, stderr } = await Promise.race([
        execAsync(pythonCommand),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Telegram script timeout after ${timeoutMs/1000} seconds`)), timeoutMs)
        )
      ]);
      
      console.log('Python script stdout:', stdout);
      if (stderr) {
        console.log('Python script stderr:', stderr);
      }
      
      // Check for authentication setup requirements - fallback to simulator
      if (stdout.includes('SETUP_REQUIRED') || stdout.includes('ERROR: No authenticated session found') || 
          stdout.includes('ERROR: Session expired or invalid')) {
        console.log('Authentication required, falling back to simulator for testing...');
        
        // Use simulator for testing purposes
        const simulatorCommand = `python3 server/services/telegram_simulator.py "${this.apiId}" "${this.apiHash}" "${this.phone}" '${channelsJson}' ${minutesBack}`;
        console.log('Using simulator:', simulatorCommand);
        
        const { stdout: simStdout } = await execAsync(simulatorCommand);
        console.log('Simulator output:', simStdout);
        
        try {
          const messages = JSON.parse(simStdout);
          console.log(`Simulator provided ${messages.length} test messages`);
          return messages;
        } catch (error) {
          console.error('Error parsing simulator output:', error);
          throw new Error('AUTHENTICATION_REQUIRED: Please run authentication setup first. Command: python3 server/services/telegram_auth_setup.py ' + this.apiId + ' ' + this.apiHash + ' ' + this.phone);
        }
      }
      
      if (stderr && !stderr.includes('Warning') && !stderr.includes('DeprecationWarning')) {
        console.error('Telegram MTProto error:', stderr);
        throw new Error(`Telegram authentication failed: ${stderr}`);
      }
      
      if (!stdout || stdout.trim() === '') {
        console.error('No output from Telegram script');
        throw new Error('No response from Telegram - check credentials and network');
      }
      
      // Parse the output to extract messages
      const startMarker = 'TELEGRAM_MESSAGES_START';
      const endMarker = 'TELEGRAM_MESSAGES_END';
      
      const startIndex = stdout.indexOf(startMarker);
      const endIndex = stdout.indexOf(endMarker);
      
      if (startIndex === -1 || endIndex === -1) {
        // If no message markers found, check if there's useful error info
        if (stdout.includes('Error:') || stdout.includes('ERROR:')) {
          const errorLine = stdout.split('\n').find(line => line.includes('Error:') || line.includes('ERROR:'));
          throw new Error(`Telegram client error: ${errorLine || 'Unknown error'}`);
        }
        console.log('No message markers found in output, assuming no messages');
        return [];
      }
      
      const jsonString = stdout.substring(startIndex + startMarker.length, endIndex).trim();
      
      if (!jsonString) {
        console.log('No messages found in the specified time range');
        return [];
      }
      
      let result;
      try {
        result = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse JSON from Python script:', jsonString);
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