const ethers = require('ethers');
const crypto = require('crypto');

class WalletManager {
    constructor() {
        this.walletSessions = new Map();
        this.playerWallets = new Map();
        this.nonces = new Map();
    }

    generateNonce(clientId) {
        const nonce = crypto.randomBytes(32).toString('hex');
        this.nonces.set(clientId, nonce);
        return nonce;
    }

    verifySignature(address, signature, clientId) {
        const nonce = this.nonces.get(clientId);
        if (!nonce) return false;

        try {
            const message = `Sign this message to authenticate: ${nonce}`;
            const recoveredAddress = ethers.verifyMessage(message, signature);
            return recoveredAddress.toLowerCase() === address.toLowerCase();
        } catch (error) {
            console.error('Signature verification failed:', error);
            return false;
        }
    }

    associateWalletWithPlayer(clientId, address) {
        this.playerWallets.set(clientId, address);
        this.walletSessions.set(address, {
            clientId,
            connectedAt: new Date(),
            lastActive: new Date()
        });
    }

    getPlayerWallet(clientId) {
        return this.playerWallets.get(clientId);
    }

    removeSession(clientId) {
        const address = this.playerWallets.get(clientId);
        if (address) {
            this.walletSessions.delete(address);
            this.playerWallets.delete(clientId);
        }
        this.nonces.delete(clientId);
    }
}

module.exports = WalletManager;