# Telegram Intelligence Aggregator

## Overview

This is a full-stack web application that aggregates and analyzes public Telegram channels using AI to generate detailed intelligence reports. The application is built with a modern tech stack featuring React on the frontend, Express.js on the backend, and PostgreSQL for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API endpoints
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: Hot module replacement via Vite integration

### Data Layer
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod for runtime type validation
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Database Schema
- **Configurations**: Stores API keys (Telegram and OpenAI) and channel lists
- **Analyses**: Tracks analysis jobs with status, progress, and results
- **Statistics**: Maintains usage metrics and system statistics

### External Service Integrations
- **Telegram MTProto API**: Using Telethon for accessing public channels without admin permissions
- **OpenAI API**: GPT-4o model for generating intelligence reports
- **Neon Database**: Serverless PostgreSQL hosting (with in-memory fallback)

### Core Services
- **TelegramService**: Handles channel message retrieval
- **OpenAIService**: Processes messages and generates structured intelligence reports
- **Storage Layer**: Abstracts database operations with in-memory fallback

### Frontend Components
- **AdminPanel**: Configuration management for API keys and channels
- **ExecutionPanel**: Analysis execution and progress monitoring
- **StatisticsDashboard**: System usage metrics display

## Data Flow

1. **Configuration**: API credentials auto-loaded from environment variables, visual status indicators in admin panel
2. **Analysis Initiation**: User clicks button, real-time progress indicators show each step
3. **Message Collection**: All channels processed in single batch (60 minutes window) using MTProto
4. **AI Processing**: Consolidated text sent to OpenAI GPT-4o for efficient analysis
5. **Report Generation**: Global topics and briefings without source tracking or relevancy scores
6. **Results Display**: Topics with concise summaries and key points, plus chronological events

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Query)
- Express.js with TypeScript support
- Drizzle ORM with PostgreSQL driver

### UI and Styling
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Lucide React for iconography

### External APIs
- Telegram Bot API for message retrieval
- OpenAI API for AI-powered analysis
- Neon PostgreSQL for data persistence

### Development Tools
- Vite for build tooling and development server
- ESBuild for production bundling
- TypeScript for type safety

## Deployment Strategy

### Development Mode
- Vite dev server with HMR for frontend
- TSX for TypeScript execution in development
- Concurrent frontend and backend development

### Production Build
- Vite builds optimized frontend bundle to `dist/public`
- ESBuild bundles backend to `dist/index.js`
- Static file serving from Express for SPA deployment

### Environment Configuration
- Environment variables for database connection
- API keys managed through configuration interface
- Development/production mode detection

### Database Management
- Drizzle migrations for schema evolution
- PostgreSQL connection via environment variables
- Fallback to in-memory storage for development

## Technical Issues Encountered

### MTProto Authentication Problems
1. **Incomplete Credential Requirements**: Initial implementation only used API ID and Hash, but Telegram MTProto requires additional configuration
2. **Server Selection**: my.telegram.org shows Test and Production server configurations that may be required
3. **Public Keys**: FCM credentials and MTProto server public keys are shown in the API dashboard
4. **Authentication Flow**: MTProto requires phone verification code on first use, which our current implementation doesn't handle

### Solution Implemented
1. **Interactive Authentication Setup**: Created `telegram_auth_setup.py` for one-time SMS verification
2. **Session Management**: Implemented persistent session storage using Telethon session files
3. **Clear Error Handling**: System now detects missing authentication and provides setup instructions
4. **Automated Script**: Added `setup_telegram_auth.sh` for streamlined authentication process

### Current Status - FULLY OPERATIONAL & OPTIMIZED
- Complete end-to-end functionality confirmed working
- Authentication system using MTProto session management with persistent sessions
- Real-time data collection from multiple Telegram channels in single batch
- OpenAI GPT-4o generating consolidated intelligence reports (1500 token limit for speed)
- Web interface with enhanced UX:
  - Visual API key status indicators (green when configured, yellow for first setup)
  - Real-time progress indicators with estimated completion times
  - Channels can be updated without re-entering API credentials
- Frontend-backend API integration fully functional
- Optimized report generation: all messages processed together, no per-channel analysis
- 60-minute time window for message collection implemented system-wide

## Changelog

```
Changelog:
- June 29, 2025. Initial setup
- June 29, 2025. Updated OpenAI service to generate consolidated intelligence reports (not per-channel analysis)
- June 29, 2025. Modified frontend to display new consolidated report format with trends, events, correlations
- June 29, 2025. Added proper intelligence analysis structure focusing on cross-channel patterns
- June 30, 2025. Identified MTProto authentication complexity - requires server config and verification code handling
- June 30, 2025. MILESTONE: Complete end-to-end functionality achieved
- June 30, 2025. Fixed frontend-backend API endpoint mismatches for full web interface functionality
- June 30, 2025. Confirmed real-time Telegram data collection (3 messages from @Slavyangrad and @TheIslanderNews)
- June 30, 2025. Validated OpenAI GPT-4o analysis generating structured intelligence reports in 12.23 seconds
- June 30, 2025. DEPLOYMENT: Changed time window from 20 to 60 minutes for broader data collection
- June 30, 2025. DEPLOYMENT: Added automatic credential loading from .env file for seamless operation
- June 30, 2025. FINAL UPDATE: Modified OpenAI prompt to generate telegraphic, technical briefings only
- June 30, 2025. FINAL UPDATE: Removed all sentiment analysis and confidence scoring from reports
- June 30, 2025. FINAL UPDATE: Updated frontend to display topics and events sections with proper metadata
- June 30, 2025. FINAL UPDATE: Fixed all JSX syntax errors and component structure issues
- June 30, 2025. FINAL UPDATE: Confirmed 13 messages collected and processed into technical intelligence report
- June 30, 2025. OPTIMIZATION: Fixed API key persistence issue - admin panel now shows visual status when keys are configured
- June 30, 2025. OPTIMIZATION: Improved report generation speed by reducing token limit and simplifying prompts
- June 30, 2025. OPTIMIZATION: Implemented consolidated text batch processing for all channels at once
- June 30, 2025. OPTIMIZATION: Added real-time progress indicators with estimated completion times
- June 30, 2025. OPTIMIZATION: Enhanced UX with clear visual feedback for API configuration status
- July 01, 2025. VALIDATION: Confirmed system working with 4 messages from 2 channels processed successfully
- July 01, 2025. DOCUMENTATION: Updated replit.md to reflect current optimized state and architectural improvements
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```