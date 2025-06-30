import OpenAI from "openai";
import type { TelegramMessage } from "./telegram";

export interface IntelligenceReport {
  topics: Array<{
    topic: string;
    briefing: string;
    keyPoints: string[];
    timeframe: string;
    sources: string;
  }>;
  events: Array<{
    time: string;
    event: string;
    details: string;
  }>;
  metadata: {
    totalMessages: number;
    channelsAnalyzed: number;
    timeRange: string;
    processingTime: string;
    model: string;
  };
}

export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateIntelligenceReport(messages: TelegramMessage[]): Promise<IntelligenceReport> {
    if (messages.length === 0) {
      throw new Error("No messages to analyze");
    }

    const startTime = Date.now();
    
    // Group messages by channel
    const messagesByChannel = this.groupMessagesByChannel(messages);
    
    // Create analysis prompt
    const prompt = this.createAnalysisPrompt(messagesByChannel);

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an intelligence analyst. Generate a concise technical report in JSON format. Focus only on key topics and events."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000,  // Reduced for faster response
      });

      const analysisResult = JSON.parse(response.choices[0].message.content || "{}");
      
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // Structure the response according to our interface
      const report: IntelligenceReport = {
        topics: analysisResult.topics || [],
        events: analysisResult.events || [],
        metadata: {
          totalMessages: messages.length,
          channelsAnalyzed: Object.keys(messagesByChannel).length,
          timeRange: this.getTimeRange(messages),
          processingTime: `${processingTime}s`,
          model: "gpt-4o"
        }
      };

      return report;
    } catch (error) {
      console.error("OpenAI analysis failed:", error);
      throw new Error(`Failed to generate intelligence report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private groupMessagesByChannel(messages: TelegramMessage[]): Record<string, TelegramMessage[]> {
    return messages.reduce((acc, message) => {
      if (!acc[message.channel]) {
        acc[message.channel] = [];
      }
      acc[message.channel].push(message);
      return acc;
    }, {} as Record<string, TelegramMessage[]>);
  }

  private createAnalysisPrompt(messagesByChannel: Record<string, TelegramMessage[]>): string {
    const totalMessages = Object.values(messagesByChannel).reduce((sum, msgs) => sum + msgs.length, 0);
    const channelCount = Object.keys(messagesByChannel).length;
    
    let prompt = `Analyze these Telegram messages. Create a brief technical report.

JSON format:
{
  "topics": [{
    "topic": "topic name",
    "briefing": "technical summary",
    "keyPoints": ["key1", "key2"],
    "timeframe": "time period",
    "sources": "channel count"
  }],
  "events": [{
    "time": "HH:MM",
    "event": "what",
    "details": "brief details"
  }]
}

Messages:
`;

    // Flatten all messages with timestamps for chronological analysis
    const allMessages: Array<{msg: TelegramMessage, channel: string}> = [];
    for (const [channel, messages] of Object.entries(messagesByChannel)) {
      messages.forEach(msg => allMessages.push({msg, channel}));
    }
    
    // Sort by timestamp for chronological analysis
    allMessages.sort((a, b) => a.msg.date - b.msg.date);

    allMessages.forEach((item, index) => {
      const date = new Date(item.msg.date * 1000);
      const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      prompt += `${index + 1}. [${timeStr}] [@${item.channel}] ${item.msg.text.substring(0, 400)}${item.msg.text.length > 400 ? '...' : ''}\n`;
    });

    prompt += `\nProvide technical briefings grouped by topics only.`;

    return prompt;
  }

  private getTimeRange(messages: TelegramMessage[]): string {
    if (messages.length === 0) return "No messages";
    
    const timestamps = messages.map(m => m.date);
    const earliest = Math.min(...timestamps);
    const latest = Math.max(...timestamps);
    
    const earliestDate = new Date(earliest * 1000);
    const latestDate = new Date(latest * 1000);
    
    return `${earliestDate.toISOString()} - ${latestDate.toISOString()}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.openai.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }
}
