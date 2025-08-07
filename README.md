# Chat Application - Offline-First Full Stack

A real-time chat app that works seamlessly offline and syncs when you're back online. Built with modern web technologies and comprehensive test coverage.

## Quick Start

### � One-Command Setup

```bash
docker-compose up --build
```

That's it! The app will be running at:
- **Chat App**: http://localhost:3000
- **API**: http://localhost:3001
- **Database**: localhost:5432

### �️ Development Setup

If you prefer running things separately:

```bash
# Start the database
docker-compose up postgres -d

# Run the server (Terminal 1)
cd server && npm install && npm run db:push && npm run dev

# Run the client (Terminal 2)
cd client && npm install && npm run dev
```

## What Makes This Special

**Offline-First Design**: The app works perfectly without internet. Create groups, send messages, and everything syncs automatically when you're back online.

**Smart Conflict Resolution**: Uses Last-Writer-Wins strategy - when you're online, changes go to the server first for consistency across all users.

**Real-World Ready**: Includes comprehensive test coverage, proper error handling, and production considerations.

## Key Features

- 📱 **Works Offline**: Full functionality without internet connection
- 🔄 **Auto-Sync**: Seamless synchronization every 5 seconds when online
- 👥 **Multi-User**: Create groups, invite users, real-time messaging
- 🎯 **Smart Conflicts**: Last-Writer-Wins with server-first priority
- 📱 **Responsive**: Works great on mobile and desktop
- 🧪 **Well-Tested**: 29 comprehensive tests covering all functionality

## Tradeoffs & Future Improvements

**Architectural Tradeoffs:**
- Last-Writer-Wins chosen over CRDT for simplicity, sacrificing some concurrent edit scenarios
- In-memory rate limiting for development speed, not suitable for multi-instance production
- Polling-based sync instead of WebSockets to reduce complexity and connection management
- Hard deletes with cascade constraints rather than soft deletes for simpler data model

**Future Improvements:**
- Implement WebSocket connections for real-time updates without polling overhead
- Add optimistic UI updates with rollback capability for better perceived performance
- Introduce message threading and reactions for richer chat functionality
- Implement user presence indicators and typing status for enhanced UX

## How It Works

**Tech Stack:**
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + Prisma
- **Database**: PostgreSQL with IndexedDB for offline storage

**Offline-First Architecture:**

When you're **online**, changes go to the server first, then sync to all users. This keeps everyone in sync.

When you're **offline**, everything gets stored locally in your browser. Once you're back online, it automatically syncs up with the server.

**Smart Sync Features:**
- Handles network failures gracefully with exponential backoff
- Prevents duplicate messages with idempotent operations
- Automatically detects and recovers from database resets

## Testing

I've included comprehensive tests to ensure everything works reliably:

```bash
# Backend tests (23 tests)
cd server && npm test

# Frontend tests (6 tests)
cd client && npm test

# Coverage report
cd server && npm run test:coverage
```

**What's Tested:**
- All API endpoints with validation and error handling
- Complete offline-to-online sync workflows
- Concurrent user operations and data consistency
- Edge cases like network failures and database resets

## Production Notes

**Rate Limiting**: Currently uses in-memory rate limiting. For production with multiple servers, consider Redis-based rate limiting.

**Logging**: Uses a structured logging interface that can easily be swapped with Winston or other production logging solutions.

---

*Built as a technical demonstration of offline-first architecture, real-time synchronization, and comprehensive testing practices.*