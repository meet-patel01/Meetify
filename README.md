# Meetify - Video Conferencing Platform

A comprehensive web-based video conferencing platform built for educational use with features like:
- HD video calls and screen sharing
- Real-time chat messaging
- Lecture notes auto-capture
- Resource hub for study materials
- Feedback system

## Features

### Core Video Conferencing
- High-quality video and audio calls
- Screen sharing capabilities
- Real-time chat during meetings
- Participant management

### Educational Features
- **Resource Hub**: Upload and share study materials with tagging
- **Lecture Notes Auto-capture**: Real-time note taking during meetings
- **Feedback System**: Collect ratings, suggestions, and bug reports

## Tech Stack

- **Frontend**: React + TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket for chat, WebRTC for video calls
- **Deployment**: Vercel-ready

## Quick Start

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your database URL and session secret.

4. Push database schema:
   ```bash
   npm run db:push
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

### Render Deployment

#### Option 1: Using render.yaml (Recommended)
1. Connect your repository to Render
2. Render will automatically detect the `render.yaml` file
3. It will create both the web service and PostgreSQL database
4. Deploy automatically!

#### Option 2: Manual Setup
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A random secret key for sessions
   - `NODE_ENV`: `production`
6. Create a PostgreSQL database and connect it

### Vercel Deployment (Alternative)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A random secret key for sessions
   - `NODE_ENV`: `production`

3. Deploy! Vercel will automatically build and deploy your app.

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (required)
- `SESSION_SECRET`: Session encryption secret (required)
- `NODE_ENV`: Environment mode (development/production)

## Database Schema

The app uses PostgreSQL with the following main tables:
- `users`: User profiles and authentication
- `rooms`: Meeting rooms with unique codes
- `messages`: Chat messages in meetings
- `lecture_notes`: Auto-captured and manual meeting notes
- `resources`: Study materials with tags
- `feedback`: User feedback and ratings

## API Endpoints

### Authentication
- `POST /api/login` - Simple email-based login
- `POST /api/logout` - Logout user

### Rooms & Meetings
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms` - Create new meeting room
- `POST /api/rooms/join` - Join existing room

### Features
- `GET/POST /api/rooms/:id/notes` - Manage lecture notes
- `GET/POST /api/resources` - Manage study resources
- `GET/POST /api/feedback` - Handle user feedback

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details