const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Map();
const players = new Map();

console.log('Starting server...');

wss.on('connection', (ws, req) => {
    console.log(`New connection from ${req.socket.remoteAddress}`);
    let playerId = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            playerId = data.playerId;
            
            if (!clients.has(playerId)) {
                console.log(`Registering new player: ${playerId}`);
                clients.set(playerId, ws);
                players.set(playerId, data.data?.player);
            }

            console.log('\nMessage received:', {
                type: data.type,
                from: playerId
            });
            console.log('Current clients:', Array.from(clients.keys()));

            switch (data.type) {
                case 'shoot':
                    console.log(`Broadcasting shot from ${playerId} to other players`);
                    broadcastToAll(data, playerId);
                    break;
                case 'hit':
                case 'hitConfirmed':
                case 'kill':
                    const targetId = data.targetPlayerId;
                    console.log(`Sending ${data.type} to target: ${targetId}`);
                    if (targetId && clients.has(targetId)) {
                        clients.get(targetId).send(JSON.stringify(data));
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        if (playerId) {
            console.log(`Player disconnected: ${playerId}`);
            clients.delete(playerId);
            players.delete(playerId);
            
            broadcastToAll({
                type: 'leave',
                playerId: playerId,
                data: { player: null },
                timestamp: new Date().toISOString()
            }, playerId);
        }
    });
});

function broadcastToAll(message, senderId) {
    const messageStr = JSON.stringify(message);
    console.log('\nBroadcasting message:');
    console.log('Sender:', senderId);
    console.log('Message type:', message.type);
    console.log('All clients:', Array.from(clients.keys()));
    
    let sentCount = 0;
    clients.forEach((ws, id) => {
        if (id !== senderId) {
            console.log(`Sending to: ${id}`);
            ws.send(messageStr);
            sentCount++;
        } else {
            console.log(`Skipping sender: ${id}`);
        }
    });
    console.log(`Message sent to ${sentCount} clients`);
}

const WS_PORT = process.env.WS_PORT || 8182;
const HEALTH_PORT = process.env.HEALTH_PORT || 8183;

server.listen(WS_PORT, () => {
    console.log(`WebSocket server running on port ${WS_PORT}`);
});

http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Health check OK');
}).listen(HEALTH_PORT);

process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});