const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 8182 });
const players = new Map();

wss.on('connection', (ws) => {
    const clientId = uuidv4();
    players.set(clientId, ws);

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            console.log(parsedMessage);
            broadcastMessage(parsedMessage, clientId);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        players.delete(clientId);
        const leaveMessage = {
            type: 'leave',
            playerId: clientId,
            data: {},
            timestamp: new Date().toISOString()
        };
        broadcastMessage(leaveMessage, clientId);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        players.delete(clientId);
    });
});

function broadcastMessage(message, senderId) {
    const messageString = JSON.stringify(message);
    players.forEach((client, id) => {
        if (client.readyState === WebSocket.OPEN && id !== senderId) {
            client.send(messageString);
        }
    });
}

console.log('Game server running on ws://onedayvpn.com:8182');