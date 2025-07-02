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

### Current Status - PENDING BUG FIXES AND OPTIMIZATIONS
- Basic end-to-end functionality achieved but requires fixes
- Authentication system using MTProto session management with persistent sessions
- Data collection from multiple Telegram channels works but UI feedback issues
- OpenAI GPT-4o generating reports but format needs adjustment
- Web interface exists but needs reorganization and bug fixes
- Several critical issues pending resolution (see Pending Tasks section)

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
- July 02, 2025. STATUS UPDATE: Changed status to "pending bug fixes and optimizations" per user requirements
- July 02, 2025. TASK DOCUMENTATION: Documented 6 pending tasks for first phase completion
- July 02, 2025. TASK 1 COMPLETED: App organization into Admin and Home sections with navigation
- July 02, 2025. TASK 2 PARTIAL: Admin panel enhanced with prompt template and time window fields, but configuration not fully working
```

## Pending Tasks for First Phase Completion

### 1. App Organization into Admin and Home Sections ✓ COMPLETED
- **Current**: ~~All functionality in single interface~~ Split into proper sections
- **Required**: ~~Split into 2 main sections~~ DONE:
  - **Admin**: API configuration and settings management ✓
  - **Home**: Report generation and viewing ✓
- **Implementation**: ~~Add navigation between sections~~ Navigation component created ✓

### 2. Admin Panel Enhancements ⚠️ NOT WORKING
- **Current**: Fields added but configuration not being used by system
- **Required**: Fix actual usage of configured settings:
  - OpenAI prompt template for report generation ❌ (hardcoded prompt still used)
  - Time window parameter ❌ (system ignores configured value)
  - Configuration saving/loading mechanism ❌ (backend not properly using stored values)
- **Implementation**: ⚠️ INCOMPLETE - UI exists but backend ignores the settings

### 3. Fix API Data Loading from Environment ⚠️ USABILITY ISSUES
- **Issue**: Poor user experience with credential display and configuration
- **Problems**:
  - Shows placeholder "••••••••" values to users while actual values displayed in separate diagnostic block
  - Hardcoded 60-minute timeout still present (not using configured timeWindowMinutes)
  - Confusing dual display of stored vs environment values
  - Users see "unknown values" in main fields but actual values in debug section
- **Impact**: Terrible usability, users confused about what values are actually being used
- **Required**: Single, clear display showing actual values being used by the system
- **Status**: DEFERRED - needs complete redesign of credential display system

### 4. Fix Progress Indicators During Analysis ✓ COMPLETED
- **Issue**: ~~Crawling takes too long without proper progress feedback~~ FIXED
- **Solution Implemented**:
  - Enhanced progress bar with percentage display (10% → 20% → 50% → 70% → 90% → 100%)
  - Added visual step indicators: Conectar → Recopilar → Analizar → Completar
  - Improved real-time polling from 2 seconds to 1 second for faster updates
  - Visual steps turn green with checkmarks as they complete
  - Added detailed console logging for backend progress tracking
- **Status**: WORKING - Real-time progress updates functioning properly during analysis

### 5. Remove "Eventos Temporales" Section from Reports ✓ COMPLETED
- **Issue**: ~~Reports show both topics and temporal events sections~~ FIXED
- **Solution**: Removed "Eventos Temporales" section from both execution panel components
- **Result**: Reports now only show "Temas Principales" (topics-based organization)
- **Status**: WORKING - Events section no longer displayed in intelligence reports

### 6. Fix Non-Functional Export and Share Buttons ✓ COMPLETED
- **Issue**: ~~Buttons displayed but not implemented~~ FIXED
- **Solution Implemented**:
  - Export button: Downloads report as structured JSON file with timestamp
  - Share button: Copies formatted report text to clipboard with emojis and structure
  - Both include proper error handling and success notifications
  - Export includes metadata (messages collected, channels processed, export timestamp)
- **Status**: WORKING - Both export and share functionality operational

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

## Main Challenges Ahead

### 1. Scalability
- **Sequential Processing**: Channels processed one by one, not in parallel
- **Token Limits**: May truncate analysis for high-volume periods
- **Solution**: Implement parallel processing and message chunking strategies

### 2. Authentication & Security
- **Manual Setup**: MTProto requires manual authentication setup
- **Plain Text Keys**: API keys stored unencrypted in .env
- **Solution**: Web-based auth flow and proper secret management

### 3. Data Persistence & Analytics
- **In-Memory Storage**: Data loss on server restart
- **No Historical Analysis**: Cannot track trends over time
- **Solution**: Ensure PostgreSQL persistence and time-series analytics

### 4. Performance & Features
- **No Scheduling**: Manual triggering required for each analysis
- **Limited Discovery**: Users must know channel names
- **Solution**: Cron-based scheduling and channel search features

## Development Roadmap

### Phase 1: Stability & Security (1-2 weeks)
- Implement proper PostgreSQL migrations
- Add encryption for stored API keys
- Create automated backup system
- Add comprehensive error logging

### Phase 2: Performance (2-3 weeks)
- Implement parallel channel processing
- Add Redis caching layer
- Create background job processing
- Optimize OpenAI prompt engineering

### Phase 3: Features (3-4 weeks)
- Add scheduled report generation
- Implement historical trend analysis
- Create channel discovery tools
- Add export capabilities (PDF, CSV)

### Phase 4: Scale (4-6 weeks)
- Implement horizontal scaling
- Add multi-tenant support
- Create API for third-party integrations
- Implement advanced analytics dashboard

## Technical Debt
- TypeScript errors in routes.ts and execution-panel.tsx
- Python subprocess integration is fragile
- Inconsistent error handling across services
- No automated test suite

## Performance Metrics
- **Message Collection**: ~5-10 seconds for 2-7 channels
- **AI Analysis**: ~5-15 seconds depending on message volume
- **Total Process**: ~15-30 seconds end-to-end
- **Token Usage**: Limited to 1500 for faster responses

## User Preferences

```
Preferred communication style: Simple, everyday language.
```