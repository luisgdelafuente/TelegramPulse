import OpenAI from "openai";
import type { TelegramMessage } from "./telegram";

export interface IntelligenceReport {
  executiveSummary: string;
  mainTrends: Array<{
    title: string;
    description: string;
    impact: string;
    sources: number;
  }>;
  highImpactEvents: Array<{
    timestamp: string;
    event: string;
    description: string;
    crossChannelConfirmation: boolean;
  }>;
  correlations: Array<{
    pattern: string;
    description: string;
    significance: string;
  }>;
  sentimentAnalysis: {
    overall: "positive" | "neutral" | "negative";
    confidence: number;
    breakdown: string;
  };
  recommendations: string[];
  confidence: number;
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
            content: "You are an expert intelligence analyst. Analyze the provided Telegram messages and generate a comprehensive intelligence report in JSON format. Focus on identifying trends, patterns, and actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 4000,
      });

      const analysisResult = JSON.parse(response.choices[0].message.content || "{}");
      
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // Structure the response according to our interface
      const report: IntelligenceReport = {
        executiveSummary: analysisResult.executiveSummary || "No summary available",
        mainTrends: analysisResult.mainTrends || [],
        highImpactEvents: analysisResult.highImpactEvents || [],
        correlations: analysisResult.correlations || [],
        sentimentAnalysis: analysisResult.sentimentAnalysis || {
          overall: "neutral",
          confidence: 50,
          breakdown: "No sentiment data available"
        },
        recommendations: analysisResult.recommendations || [],
        confidence: Math.max(0, Math.min(100, analysisResult.confidence || 75)),
        metadata: {
          totalMessages: messages.length,
          channelsAnalyzed: Object.keys(messagesByChannel).length,
          timeRange: this.getTimeRange(messages),
          processingTime: `${processingTime}s`,
          model: "gpt-4o",
        }
      };

      return report;
    } catch (error) {
      console.error("OpenAI analysis failed:", error);
      throw new Error(`Failed to generate intelligence report: ${error.message}`);
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
    
    let prompt = `You are an expert intelligence analyst. Analyze the following ${totalMessages} Telegram messages from ${channelCount} public channels collected in the last 60 minutes.

CRITICAL: Generate a CONSOLIDATED intelligence report that aggregates all information across channels. Do NOT separate analysis by individual channels.

Required JSON format:
{
  "executiveSummary": "Consolidated overview of all key findings across all sources",
  "mainTrends": [
    {
      "title": "Primary trend title",
      "description": "Detailed cross-channel analysis of this trend", 
      "impact": "Assessment of significance and potential impact",
      "sources": "Number of channels reporting this trend"
    }
  ],
  "highImpactEvents": [
    {
      "timestamp": "HH:MM format",
      "event": "Brief event title",
      "description": "Detailed description with cross-channel validation",
      "crossChannelConfirmation": "true/false - if multiple channels reported this"
    }
  ],
  "correlations": [
    {
      "pattern": "Correlation pattern identified",
      "description": "How different pieces of information connect across channels",
      "significance": "Why this correlation matters"
    }
  ],
  "sentimentAnalysis": {
    "overall": "positive/neutral/negative",
    "confidence": "0-100 confidence score",
    "breakdown": "Detailed sentiment analysis across all content"
  },
  "recommendations": [
    "Strategic recommendation based on consolidated analysis",
    "Actionable insight derived from cross-channel patterns"
  ],
  "confidence": "1-100 overall confidence in the consolidated analysis"
}

ALL MESSAGES (analyze as one consolidated dataset):

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

    prompt += `\nAnalysis Requirements:
1. AGGREGATE all information - do not separate by channel
2. IDENTIFY cross-channel patterns and correlations
3. PRIORITIZE events by impact and cross-source validation
4. CORRELATE timestamps to identify event sequences
5. SYNTHESIZE insights from the complete dataset
6. FOCUS on intelligence value, not channel-by-channel summaries

Generate a professional consolidated intelligence assessment.`;

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
