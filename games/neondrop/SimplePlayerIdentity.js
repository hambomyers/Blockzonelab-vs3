/**
 * Simple Player Identity - Lightweight Username System
 * 
 * Phase 1: Just usernames for leaderboard
 * Phase 2: Username#wallet (last 4 digits) for crypto learning
 */

export class SimplePlayerIdentity {
    constructor() {
        this.username = localStorage.getItem('neonDrop_username') || null;
        this.wallet = null;
        this.displayName = this.username;
    }

    /**
     * Get or prompt for username
     */
    async getUsername() {
        if (this.username) return this.username;
        
        // Simple prompt for username
        this.username = prompt('Enter your username for the leaderboard:') || 'Anonymous';
        localStorage.setItem('neonDrop_username', this.username);
        this.updateDisplayName();
        return this.username;
    }

    /**
     * Connect wallet (Phase 2) - append last 4 digits
     */
    async connectWallet() {
        if (!window.ethereum) {
            alert('Install MetaMask to unlock crypto features!');
            return false;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.wallet = accounts[0];
            this.updateDisplayName();
            return true;
        } catch (error) {
            console.error('Wallet connection failed:', error);
            return false;
        }
    }

    /**
     * Update display name based on wallet status
     */
    updateDisplayName() {
        if (this.wallet && this.username) {
            const last4 = this.wallet.slice(-4);
            this.displayName = `${this.username}#${last4}`;
        } else {
            this.displayName = this.username || 'Anonymous';
        }
    }

    /**
     * Get display name for leaderboard
     */
    getDisplayName() {
        return this.displayName || 'Anonymous';
    }

    /**
     * Check if wallet is connected
     */
    hasWallet() {
        return !!this.wallet;
    }

    /**
     * Simple player data for leaderboard
     */
    getPlayerData() {
        return {
            username: this.username,
            displayName: this.getDisplayName(),
            hasWallet: this.hasWallet(),
            wallet: this.wallet
        };
    }
}
