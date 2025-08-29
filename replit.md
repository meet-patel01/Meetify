# replit.md

## Overview

This is a full-stack video conferencing application built for college students called "Meetify". The application enables real-time video calls with features like chat, screen sharing, and participant management. It uses a modern web stack with React on the frontend, Express.js on the backend, PostgreSQL for data persistence, and WebSocket/WebRTC for real-time communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React with TypeScript, built using Vite
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket for signaling, WebRTC for peer-to-peer video/audio
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Authentication**: Replit Auth with OpenID Connect

## Key Components

### Frontend Architecture (`client/`)
- **React SPA**: Single-page application using Wouter for routing
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite with TypeScript support
- **New Features**: Resource hub, lecture notes auto-capture, feedback system

### Backend Architecture (`server/`)
- **Express Server**: RESTful API with middleware for logging and error handling
- **Database Layer**: Drizzle ORM with connection pooling via Neon serverless
- **Authentication**: Passport.js with OpenID Connect strategy for Replit Auth
- **Session Management**: Express sessions stored in PostgreSQL
- **WebSocket Server**: Real-time communication for chat and WebRTC signaling

### Database Schema (`shared/schema.ts`)
- **Users**: User profiles from Replit Auth (id, email, name, profile image)
- **Rooms**: Meeting rooms with unique codes and host information
- **Messages**: Chat messages linked to rooms and users
- **Room Participants**: Junction table for room membership
- **Sessions**: Session storage table for authentication
- **Lecture Notes**: Auto-captured and manual notes from meetings
- **Resources**: Study materials and educational content with tags
- **Feedback**: User ratings, suggestions, and bug reports

### Shared Code (`shared/`)
- **Schema Definitions**: Drizzle schemas with Zod validation
- **Type Definitions**: Shared TypeScript interfaces
- **Validation**: Input validation schemas using drizzle-zod

## Data Flow

### Authentication Flow
1. User clicks "Get Started" → redirected to Replit OAuth
2. Successful auth → user data stored/updated in database
3. Session created and stored in PostgreSQL
4. Frontend receives user data via `/api/auth/user` endpoint

### Meeting Creation Flow
1. Authenticated user creates room via POST `/api/rooms`
2. Unique room code generated, user becomes host
3. Host automatically added as participant
4. Room data returned to frontend

### Meeting Join Flow
1. User navigates to `/meeting/:roomId`
2. WebSocket connection established
3. Local media stream initialized (camera/microphone)
4. WebRTC peer connections established with other participants
5. Real-time chat enabled through WebSocket

### Real-time Communication
- **WebSocket**: Used for chat messages, participant updates, and WebRTC signaling
- **WebRTC**: Peer-to-peer connections for audio/video streams
- **STUN Servers**: Google's STUN servers for NAT traversal

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **express**: Web server framework
- **passport**: Authentication middleware
- **ws**: WebSocket implementation
- **@tanstack/react-query**: Data fetching and caching
- **wouter**: Lightweight React router

### UI Dependencies
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Dependencies
- **typescript**: Type checking
- **vite**: Build tool and dev server
- **tsx**: TypeScript execution
- **esbuild**: Production bundling

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR at `client/`
- **Backend**: tsx with nodemon-like watching at `server/`
- **Database**: Neon serverless PostgreSQL
- **Environment**: Replit development environment with live preview

### Production Build
1. Frontend built with `vite build` → outputs to `dist/public/`
2. Backend built with `esbuild` → outputs to `dist/index.js`
3. Single Node.js process serves both static files and API
4. Database migrations applied with `drizzle-kit push`

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPLIT_DOMAINS`: Allowed domains for OAuth
- `ISSUER_URL`: OAuth issuer URL (defaults to Replit)
- `REPL_ID`: Replit application identifier

The application is designed to run seamlessly in the Replit environment with built-in authentication, but can be adapted for other deployment platforms by replacing the auth system.

## Recent Changes (January 23, 2025)

✓ **Render Deployment Ready**:
  - Replaced Replit Auth with simple email-based authentication
  - Added render.yaml configuration for automatic deployment
  - Created simpleAuth.ts for session-based authentication
  - Updated landing page with login modal
  - Added README.md with deployment instructions
  - Supports both Render and Vercel deployment

✓ **Authentication System**:
  - Simple email + name login (no password required)
  - Session-based authentication using express-session
  - Works with any PostgreSQL database
  - Vercel-compatible deployment

## Previous Changes (January 22, 2025)

✓ Added comprehensive feature system including:
  - Resource Hub: Upload and share study materials with tagging
  - Lecture Notes Auto-capture: Real-time note taking during meetings
  - Feedback System: Ratings, suggestions, and bug reporting
  - Enhanced meeting interface with new sidebar features

✓ Database schema expanded with new tables:
  - lecture_notes: Store meeting notes with auto-capture
  - resources: Educational materials with tags and metadata
  - feedback: User feedback collection system

✓ New UI components created:
  - LectureNotesSidebar: Auto-capture and manage meeting notes
  - FeedbackModal: Collect user ratings and feedback
  - Resources page: Browse and manage study materials
  - Enhanced home dashboard with new feature cards

✓ API routes implemented for all new features:
  - /api/rooms/:id/notes (GET, POST)
  - /api/notes/:id (DELETE)
  - /api/resources (GET, POST)
  - /api/resources/:id (DELETE)
  - /api/feedback (GET, POST)