# ShootingApp Server

WebSocket server for the ShootingApp iOS game.

## Features
- Real-time player connections
- Message broadcasting
- Session management
- Game state synchronization

## Requirements
- Node.js 14.0+
- npm or yarn

## Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/ShootingApp-Server.git
```

2. Install dependencies
```bash
npm install
```

3. Start the server
```bash
npm start
```

## Development
For development with auto-reload:
```bash
npm run dev
```

## Environment
The server runs on port 8182 by default. Configure through environment variables if needed.

## WebSocket Protocol
Messages follow this format:
```typescript
interface GameMessage {
    type: 'join' | 'shoot' | 'hit' | 'leave';
    playerId: string;
    data: {
        player?: Player;
        shotId?: string;
        hitPlayerId?: string;
    };
    timestamp: string;
}
```
