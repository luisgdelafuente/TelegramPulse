# Telegram Intelligence Aggregator - Technical Context

## Project Overview

A full-stack web application that aggregates and analyzes messages from public Telegram channels using AI to generate intelligence reports. The system uses Telegram MTProto API for message collection and OpenAI GPT-4o for analysis.

## Recent Work Summary (June 30 - July 1, 2025)

### Problems Solved

1. **API Key Persistence Issue**
   - **Problem**: API keys weren't showing in the admin panel, requiring re-entry each time
   - **Solution**: Added visual status indicators showing when keys are configured
   - **Implementation**: Modified admin panel to show placeholder bullets (••••••••) when keys exist
   - **Result**: Users now see green status when configured, yellow for first-time setup

2. **Slow Report Generation**
   - **Problem**: OpenAI analysis took too long (12+ seconds)
   - **Solution**: Optimized prompt and reduced token limit from 4000 to 1500
   - **Implementation**: Simplified system prompt and consolidated all messages into single batch
   - **Result**: Faster processing with more focused analysis

3. **Poor User Feedback**
   - **Problem**: No indication of progress during analysis
   - **Solution**: Added real-time progress indicators
   - **Implementation**: Shows different messages at each stage (0-30%, 30-70%, 70-90%, 90-100%)
   - **Result**: Users know exactly what's happening and estimated completion time

### Technical Architecture

#### Backend Services
- **Express.js Server**: RESTful API endpoints on port 5000
- **TelegramService**: Uses Python subprocess to run telegram_simple.py with Telethon
- **OpenAIService**: Processes messages with GPT-4o using consolidated text approach
- **Storage**: In-memory implementation with PostgreSQL interface ready

#### Frontend Components
- **AdminPanel**: Manages API configuration with visual status indicators
- **ExecutionPanel**: Shows real-time progress during analysis
- **StatisticsDashboard**: Displays usage metrics

#### Data Flow
1. API credentials loaded from .env file automatically
2. User initiates analysis through execution panel
3. Python script collects messages from all channels (60-minute window)
4. Messages consolidated into single text batch
5. OpenAI analyzes for global topics and events
6. Results displayed with topics and chronological events

### Key Technical Decisions

1. **MTProto over Bot API**: Allows reading public channels without admin access
2. **Python Subprocess**: Telethon requires Python, integrated via subprocess
3. **Consolidated Processing**: All channels processed together for efficiency
4. **In-Memory Storage**: Simplified persistence for current implementation
5. **Environment Variables**: Secure credential management

### Current Configuration

```javascript
// API endpoints
GET  /api/configuration     // Returns config with hasApiKeys flag
POST /api/configuration     // Updates config, preserves existing keys if empty
POST /api/configuration/test // Tests API connections
POST /api/analysis/start    // Initiates new analysis
GET  /api/analysis          // Gets latest analysis results
GET  /api/statistics        // Gets usage statistics
```

### Message Processing Flow

```python
# telegram_simple.py execution
python3 server/services/telegram_simple.py "API_ID" "API_HASH" "PHONE" '["@channel1","@channel2"]' 60

# Output format
TELEGRAM_MESSAGES_START
[{"id": 123, "text": "...", "date": 1751452531, "channel": "@channel", "url": "..."}]
TELEGRAM_MESSAGES_END
```

### OpenAI Integration

```javascript
// Optimized prompt structure
const consolidatedText = `Analyze the following ${messages.length} messages from the last 60 minutes. 
Find the most global and relevant topics and create a small briefing for each one.

JSON format:
{
  "topics": [{
    "topic": "topic name",
    "briefing": "concise summary",
    "keyPoints": ["key1", "key2"],
    "timeframe": "when this occurred"
  }],
  "events": [{
    "time": "HH:MM",
    "event": "what happened",
    "details": "brief details"
  }]
}

Messages:
1. [10:35] Message text...
2. [10:36] Message text...
`;
```

### Performance Metrics

- **Message Collection**: ~5-10 seconds for 2-7 channels
- **AI Analysis**: ~5-15 seconds depending on message volume
- **Total Process**: ~15-30 seconds end-to-end
- **Token Usage**: Limited to 1500 for faster responses

### Known Issues

1. **TypeScript Errors**: Multiple type safety issues in routes.ts and execution-panel.tsx
2. **Sequential Processing**: Channels processed one by one, not in parallel
3. **Session Management**: Requires manual Telegram authentication setup
4. **Error Handling**: Inconsistent error types across services

### Environment Setup

Required environment variables in .env:
```
TELEGRAM_API_ID=25392819
TELEGRAM_API_HASH=8032db8bcb4f2bde115c2d5fd6199832
TELEGRAM_PHONE=+34622025321
OPENAI_API_KEY=sk-proj-...
```

### Recent Test Results

- Successfully collected 4 messages from 2 channels (@Slavyangrad, @TheIslanderNews)
- Generated intelligence report with global topics
- Confirmed all optimizations working as expected
- Visual indicators properly showing API configuration status

## Summary

The application is fully operational with recent optimizations significantly improving performance and user experience. The main achievement was consolidating all message processing into a single batch and adding clear visual feedback throughout the analysis process. The system now provides a smooth, intuitive experience from configuration through report generation.