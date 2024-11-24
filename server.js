const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const WalletManager = require('./walletManager');

const wss = new WebSocket.Server({ port: 8182 });
const players = new Map();
const walletManager = new WalletManager();

wss.on('connection', (ws) => {
    const clientId = uuidv4();
    players.set(clientId, ws);

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            console.log(parsedMessage)
            
            if (parsedMessage.messageType === 'wallet') {
                handleWalletMessage(parsedMessage, clientId, ws);
            } else {
                handleGameMessage(parsedMessage, clientId);
            }
            
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        handleDisconnect(clientId);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        handleDisconnect(clientId);
    });
});

function handleWalletMessage(message, clientId, ws) {
    console.log('Wallet message received:', message);
    
    switch (message.type) {
        case 'wallet_connect':
            const nonce = walletManager.generateNonce(clientId);
            ws.send(JSON.stringify({
                messageType: 'wallet',
                type: 'wallet_challenge',
                data: { 
                    nonce,
                    message: `Sign this message to authenticate: ${nonce}`
                },
                timestamp: new Date().toISOString()
            }));
            break;
            
        case 'wallet_sign':
            const { address, signature } = message.data;
            const isValid = walletManager.verifySignature(address, signature, clientId);
            
            if (isValid) {
                walletManager.associateWalletWithPlayer(clientId, address);
                
                ws.send(JSON.stringify({
                    messageType: 'wallet',
                    type: 'wallet_authenticated',
                    data: {
                        address,
                        status: 'authenticated'
                    },
                    timestamp: new Date().toISOString()
                }));
                
                broadcastMessage({
                    messageType: 'wallet',
                    type: 'player_wallet_connected',
                    data: {
                        playerId: clientId,
                        address
                    },
                    timestamp: new Date().toISOString()
                }, clientId);
            } else {
                ws.send(JSON.stringify({
                    messageType: 'wallet',
                    type: 'wallet_auth_failed',
                    data: {
                        reason: 'Invalid signature'
                    },
                    timestamp: new Date().toISOString()
                }));
            }
            break;
            
        case 'wallet_disconnect':
            walletManager.removeSession(clientId);
            ws.send(JSON.stringify({
                messageType: 'wallet',
                type: 'wallet_disconnected',
                data: {
                    status: 'disconnected'
                },
                timestamp: new Date().toISOString()
            }));
            break;
    }
}

function handleGameMessage(message, clientId) {
    const walletAddress = walletManager.getPlayerWallet(clientId);
    if (walletAddress) {
        message.walletAddress = walletAddress;
    }
    
    if (message.targetPlayerId) {
        // Direct message to specific player
        const targetWs = players.get(message.targetPlayerId);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify(message));
        }
    } else {
        // Broadcast to all other players
        broadcastMessage(message, clientId);
    }
}

function handleDisconnect(clientId) {
    walletManager.removeSession(clientId);
    players.delete(clientId);
    
    const leaveMessage = {
        type: 'leave',
        playerId: clientId,
        data: {},
        timestamp: new Date().toISOString()
    };
    broadcastMessage(leaveMessage, clientId);
}

function broadcastMessage(message, senderId) {
    const messageString = JSON.stringify(message);
    players.forEach((client, id) => {
        if (client.readyState === WebSocket.OPEN && id !== senderId) {
            client.send(messageString);
        }
    });
}

console.log('Game server running on ws://onedayvpn.com:8182');