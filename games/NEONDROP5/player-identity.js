export class PlayerIdentity {
    constructor() {
        this.mode = this.detectMode();
        this.identity = null;
    }

    detectMode() {
        if (localStorage.getItem('sonic_wallet')) return 'wallet';
        if (localStorage.getItem('neon_drop_username')) return 'username';
        return 'anonymous';
    }

    async getIdentity() {
        switch (this.mode) {
            case 'wallet':
                return {
                    type: 'wallet',
                    id: localStorage.getItem('sonic_wallet'),
                    displayName: this.shortenAddress(localStorage.getItem('sonic_wallet')),
                    verified: true
                };

            case 'username':
                return {
                    type: 'username',
                    id: localStorage.getItem('neon_player_id'),
                    displayName: localStorage.getItem('neon_drop_username'),
                    verified: false
                };

            default:
                return {
                    type: 'anonymous',
                    id: this.generateAnonId(),
                    displayName: 'Anonymous Player',
                    verified: false
                };
        }
    }

    async upgradeToWallet(walletAddress) {
        localStorage.setItem('sonic_wallet', walletAddress);
        this.mode = 'wallet';
        await this.migrateScoresToWallet(walletAddress);
    }

    shortenAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    generateAnonId() {
        return 'anon_' + Math.random().toString(36).substr(2, 9);
    }
}
