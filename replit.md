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
- **Telegram Bot API**: For fetching messages from public channels
- **OpenAI API**: GPT-4o model for generating intelligence reports
- **Neon Database**: Serverless PostgreSQL hosting

### Core Services
- **TelegramService**: Handles channel message retrieval
- **OpenAIService**: Processes messages and generates structured intelligence reports
- **Storage Layer**: Abstracts database operations with in-memory fallback

### Frontend Components
- **AdminPanel**: Configuration management for API keys and channels
- **ExecutionPanel**: Analysis execution and progress monitoring
- **StatisticsDashboard**: System usage metrics display

## Data Flow

1. **Configuration**: Users input Telegram and OpenAI API keys plus target channels
2. **Analysis Initiation**: System starts collecting messages from configured channels
3. **Message Collection**: Recent messages (20 minutes) are fetched from each channel
4. **AI Processing**: OpenAI GPT-4o analyzes collected messages for intelligence insights
5. **Report Generation**: Structured intelligence reports are generated and stored
6. **Results Display**: Reports are presented to users with download/sharing options

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

## Changelog

```
Changelog:
- June 29, 2025. Initial setup
- June 29, 2025. Updated OpenAI service to generate consolidated intelligence reports (not per-channel analysis)
- June 29, 2025. Modified frontend to display new consolidated report format with trends, events, correlations
- June 29, 2025. Added proper intelligence analysis structure focusing on cross-channel patterns
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```