/**
 * UniversalPlayerIdentity.js - Next-Generation Player Identity System
 * 
 * Three-tier identity system for maximum accessibility and monetization:
 * 1. Anonymous Play - Instant access, localStorage persistence
 * 2. Social/Apple ID - Verified email, cross-device sync
 * 3. Web3 Wallet - Sonic Labs integration, crypto rewards
 * 
 * Seamless upgrade path: Anonymous → Social → Web3
 */

export class UniversalPlayerIdentity {
    constructor() {
        this.currentTier = this.detectTier();
        this.identity = null;
        this.migrationInProgress = false;
        
        // Backend integration
        this.cloudflareAPI = 'https://blockzone-identity.hambomyers.workers.dev';
        
        console.log(`🎭 Universal Player Identity initialized - Tier: ${this.currentTier}`);
    }

    /**
     * Detect current identity tier
     */
    detectTier() {
        if (this.hasSonicWallet()) return 'web3';
        if (this.hasAppleID()) return 'social';
        if (this.hasAnonymousProfile()) return 'anonymous';
        return 'new'; // First-time user
    }

    /**
     * Get current player identity with full profile
     */
    async getIdentity() {
        if (this.identity) return this.identity;

        switch (this.currentTier) {
            case 'web3':
                this.identity = await this.getWeb3Identity();
                break;
            case 'social':
                this.identity = await this.getSocialIdentity();
                break;
            case 'anonymous':
                this.identity = await this.getAnonymousIdentity();
                break;
            default:
                this.identity = await this.createNewAnonymousIdentity();
        }

        return this.identity;
    }

    /**
     * WEB3 TIER - Sonic Labs Wallet Integration
     */
    async getWeb3Identity() {
        const walletAddress = localStorage.getItem('sonic_wallet_address');
        const walletType = localStorage.getItem('sonic_wallet_type'); // MetaMask, Coinbase, etc.
        
        return {
            tier: 'web3',
            playerId: `web3_${walletAddress.slice(0, 8)}`,
            walletAddress: walletAddress,
            walletType: walletType,
            displayName: this.shortenAddress(walletAddress),
            avatar: this.generateWalletAvatar(walletAddress),
            verified: true,
            canEarnCrypto: true,
            canStake: true,
            
            // Gaming profile
            gamesPlayed: await this.getGamesPlayed(walletAddress),
            totalEarnings: await this.getTotalEarnings(walletAddress),
            stakingBalance: await this.getStakingBalance(walletAddress),
            
            // Privileges
            privileges: ['tournaments', 'leaderboards', 'rewards', 'staking', 'premium']
        };
    }

    /**
     * SOCIAL TIER - Apple ID / Email Integration
     */
    async getSocialIdentity() {
        const appleID = localStorage.getItem('apple_id_token');
        const email = localStorage.getItem('verified_email');
        const displayName = localStorage.getItem('social_display_name');
        
        return {
            tier: 'social',
            playerId: `social_${this.hashEmail(email)}`,
            email: email,
            displayName: displayName || this.generateDisplayName(),
            avatar: this.generateSocialAvatar(email),
            verified: true,
            canEarnCrypto: false,
            canStake: false,
            
            // Gaming profile
            gamesPlayed: await this.getGamesPlayed(email),
            deviceSync: true,
            
            // Privileges
            privileges: ['tournaments', 'leaderboards', 'premium', 'cloud_save']
        };
    }

    /**
     * ANONYMOUS TIER - localStorage Only
     */
    async getAnonymousIdentity() {
        const anonId = localStorage.getItem('anonymous_player_id');
        const displayName = localStorage.getItem('anonymous_display_name');
        
        return {
            tier: 'anonymous',
            playerId: anonId,
            displayName: displayName || 'Anonymous Player',
            avatar: this.generateAnonAvatar(anonId),
            verified: false,
            canEarnCrypto: false,
            canStake: false,
            
            // Gaming profile
            gamesPlayed: await this.getLocalGamesPlayed(),
            deviceOnly: true,
            
            // Privileges
            privileges: ['daily_challenges', 'practice_mode']
        };
    }

    /**
     * Create new anonymous identity for first-time users
     */
    async createNewAnonymousIdentity() {
        const anonId = this.generateAnonymousId();
        const displayName = `Player${anonId.slice(-4)}`;
        
        localStorage.setItem('anonymous_player_id', anonId);
        localStorage.setItem('anonymous_display_name', displayName);
        localStorage.setItem('identity_created', Date.now().toString());
        
        // Track new user for analytics
        await this.trackNewUser(anonId);
        
        this.currentTier = 'anonymous';
        return await this.getAnonymousIdentity();
    }

    /**
     * UPGRADE SYSTEM - Seamless tier progression
     */

    /**
     * Upgrade anonymous to social (Apple ID)
     */
    async upgradeToSocial(appleIDToken, email, displayName) {
        if (this.migrationInProgress) return false;
        this.migrationInProgress = true;

        try {
            // Migrate anonymous data to social account
            const anonymousData = await this.exportAnonymousData();
            
            // Store social credentials
            localStorage.setItem('apple_id_token', appleIDToken);
            localStorage.setItem('verified_email', email);
            localStorage.setItem('social_display_name', displayName);
            
            // Migrate data to cloud backend
            await this.migrateToSocial(anonymousData, email);
            
            // Update tier
            this.currentTier = 'social';
            this.identity = null; // Force refresh
            
            console.log('✅ Successfully upgraded to Social tier');
            return true;
            
        } catch (error) {
            console.error('❌ Social upgrade failed:', error);
            return false;
        } finally {
            this.migrationInProgress = false;
        }
    }

    /**
     * Upgrade social/anonymous to Web3 (Sonic Labs)
     */
    async upgradeToWeb3(walletAddress, walletType) {
        if (this.migrationInProgress) return false;
        this.migrationInProgress = true;

        try {
            // Migrate existing data to Web3 account
            const existingData = await this.exportCurrentData();
            
            // Store Web3 credentials
            localStorage.setItem('sonic_wallet_address', walletAddress);
            localStorage.setItem('sonic_wallet_type', walletType);
            
            // Migrate data to blockchain/backend
            await this.migrateToWeb3(existingData, walletAddress);
            
            // Update tier
            this.currentTier = 'web3';
            this.identity = null; // Force refresh
            
            console.log('✅ Successfully upgraded to Web3 tier');
            return true;
            
        } catch (error) {
            console.error('❌ Web3 upgrade failed:', error);
            return false;
        } finally {
            this.migrationInProgress = false;
        }
    }

    /**
     * PAYMENT INTEGRATION HELPERS
     */

    /**
     * Check if user can make payments
     */
    canMakePayments() {
        return this.currentTier === 'social' || this.currentTier === 'web3';
    }

    /**
     * Get available payment methods for current tier
     */
    getAvailablePaymentMethods() {
        switch (this.currentTier) {
            case 'web3':
                return ['apple_pay', 'quarters', 'sonic_labs', 'crypto'];
            case 'social':
                return ['apple_pay', 'quarters'];
            case 'anonymous':
                return ['upgrade_required'];
            default:
                return [];
        }
    }

    /**
     * UTILITY METHODS
     */

    hasSonicWallet() {
        return !!localStorage.getItem('sonic_wallet_address');
    }

    hasAppleID() {
        return !!localStorage.getItem('apple_id_token');
    }

    hasAnonymousProfile() {
        return !!localStorage.getItem('anonymous_player_id');
    }

    shortenAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    generateAnonymousId() {
        return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateDisplayName() {
        const adjectives = ['Swift', 'Cyber', 'Neon', 'Quantum', 'Digital', 'Pixel'];
        const nouns = ['Player', 'Gamer', 'Master', 'Pro', 'Champion', 'Hero'];
        return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}`;
    }

    generateWalletAvatar(address) {
        // Generate unique avatar based on wallet address
        return `https://api.blockzoneavatars.com/wallet/${address}`;
    }

    generateSocialAvatar(email) {
        // Generate avatar based on email hash
        const hash = this.hashEmail(email);
        return `https://api.blockzoneavatars.com/social/${hash}`;
    }

    generateAnonAvatar(id) {
        // Generate anonymous avatar
        return `https://api.blockzoneavatars.com/anon/${id}`;
    }

    hashEmail(email) {
        // Simple hash for email (in production, use proper hashing)
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            const char = email.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * DATA MIGRATION METHODS
     */

    async exportAnonymousData() {
        return {
            scores: JSON.parse(localStorage.getItem('local_scores') || '[]'),
            achievements: JSON.parse(localStorage.getItem('local_achievements') || '[]'),
            settings: JSON.parse(localStorage.getItem('game_settings') || '{}'),
            playTime: localStorage.getItem('total_play_time') || '0'
        };
    }

    async exportCurrentData() {
        if (this.currentTier === 'social') {
            return await this.exportSocialData();
        } else {
            return await this.exportAnonymousData();
        }
    }

    async migrateToSocial(data, email) {
        // Migrate to Cloudflare Workers backend
        const response = await fetch(`${this.cloudflareAPI}/migrate/social`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, data })
        });
        
        if (!response.ok) {
            throw new Error('Migration to social tier failed');
        }
    }

    async migrateToWeb3(data, walletAddress) {
        // Migrate to blockchain + backend
        const response = await fetch(`${this.cloudflareAPI}/migrate/web3`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, data })
        });
        
        if (!response.ok) {
            throw new Error('Migration to Web3 tier failed');
        }
    }

    /**
     * ANALYTICS METHODS
     */

    async trackNewUser(playerId) {
        try {
            await fetch(`${this.cloudflareAPI}/analytics/new_user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    referrer: document.referrer
                })
            });
        } catch (error) {
            console.log('Analytics tracking failed:', error);
        }
    }

    /**
     * GAME DATA METHODS
     */

    async getGamesPlayed(identifier) {
        // Implementation depends on backend
        return [];
    }

    async getTotalEarnings(walletAddress) {
        // Query Sonic Labs contracts
        return 0;
    }

    async getStakingBalance(walletAddress) {
        // Query staking contracts
        return 0;
    }

    async getLocalGamesPlayed() {
        return JSON.parse(localStorage.getItem('local_games_played') || '[]');
    }
}

// Global singleton instance
window.UniversalPlayerIdentity = new UniversalPlayerIdentity();
