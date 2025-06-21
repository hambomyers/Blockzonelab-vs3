/**
 * Unified Identity System
 * Consolidates all scattered identity systems into a single, robust architecture
 * Part of BlockZone Lab's Phase 1 consolidation plan
 */

import { ImportPaths } from '../../utils/ImportPaths.js';
import { EventEmitter } from '../../utils/EventEmitter.js';
import { deviceFingerprinter } from '../security/DeviceFingerprinter.js';
import { antiAbuseManager } from '../security/AntiAbuseManager.js';
import { freeGameManager } from './FreeGameManager.js';

class UnifiedIdentity extends EventEmitter {
    constructor() {
        super();
        
        this.currentPlayer = null;
        this.identityTier = null;
        this.initializationPromise = null;
        this.migrationInProgress = false;
        
        // Identity tiers in order of progression
        this.tiers = {
            FREE: 'free',        // Anonymous free player with anti-abuse protection
            SOCIAL: 'social',    // Verified email/social login
            WEB3: 'web3'        // Connected wallet with crypto features
        };
        
        // Feature permissions by tier
        this.tierFeatures = {
            [this.tiers.FREE]: [
                'play_free_games',
                'view_leaderboards',
                'basic_achievements'
            ],
            [this.tiers.SOCIAL]: [
                'play_free_games',
                'view_leaderboards', 
                'basic_achievements',
                'cloud_save',
                'cross_device_sync',
                'enhanced_tournaments'
            ],
            [this.tiers.WEB3]: [
                'play_free_games',
                'view_leaderboards',
                'basic_achievements', 
                'cloud_save',
                'cross_device_sync',
                'enhanced_tournaments',
                'crypto_rewards',
                'nft_integration',
                'staking',
                'premium_tournaments'
            ]
        };
        
        this.storage = {
            localStorage: window.localStorage,
            sessionStorage: window.sessionStorage
        };
        
        this.api = {
            baseUrl: 'https://blockzone-identity-api.hambomyers.workers.dev',
            timeout: 10000
        };
    }

    /**
     * Initialize the unified identity system
     * This is the main entry point for all identity operations
     */
    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._doInitialize();
        return this.initializationPromise;
    }

    /**
     * Internal initialization logic
     * @private
     */
    async _doInitialize() {
        try {
            // Step 1: Generate device fingerprint for anti-abuse
            const deviceFingerprint = await deviceFingerprinter.generateFingerprint();
            
            // Step 2: Detect existing identity tier
            this.identityTier = await this.detectIdentityTier();
            
            // Step 3: Load or create player identity
            this.currentPlayer = await this.loadPlayerIdentity(deviceFingerprint);
            
            // Step 4: Validate with anti-abuse system
            const validation = await this.validatePlayerAccess(deviceFingerprint);
            this.currentPlayer.securityStatus = validation;
            
            // Step 5: Check free game eligibility
            if (this.identityTier === this.tiers.FREE) {
                const freeGameStatus = await freeGameManager.checkFreeGameEligibility(
                    this.currentPlayer.playerId, 
                    validation
                );
                this.currentPlayer.freeGameStatus = freeGameStatus;
            }

            // Step 6: Emit initialization complete event
            this.emit('identityInitialized', {
                player: this.currentPlayer,
                tier: this.identityTier,
                features: this.getAvailableFeatures()
            });

            return this.currentPlayer;

        } catch (error) {
            console.error('Identity initialization failed:', error);
            
            // Fallback to minimal anonymous identity
            this.currentPlayer = await this.createFallbackIdentity();
            this.identityTier = this.tiers.FREE;
            
            this.emit('identityInitializationFailed', { error, fallback: this.currentPlayer });
            
            return this.currentPlayer;
        }
    }

    /**
     * Detect the player's current identity tier
     * @private
     */
    async detectIdentityTier() {
        // Check for Web3 wallet connection
        if (await this.hasWeb3Wallet()) {
            return this.tiers.WEB3;
        }
        
        // Check for social login (email, Apple ID, etc.)
        if (await this.hasSocialLogin()) {
            return this.tiers.SOCIAL;
        }
        
        // Default to free tier
        return this.tiers.FREE;
    }

    /**
     * Load player identity based on detected tier
     * @private
     */
    async loadPlayerIdentity(deviceFingerprint) {
        switch (this.identityTier) {
            case this.tiers.WEB3:
                return await this.loadWeb3Identity(deviceFingerprint);
            
            case this.tiers.SOCIAL:
                return await this.loadSocialIdentity(deviceFingerprint);
            
            case this.tiers.FREE:
            default:
                return await this.loadFreeIdentity(deviceFingerprint);
        }
    }

    /**
     * Load or create free tier identity
     * @private
     */
    async loadFreeIdentity(deviceFingerprint) {
        const existingId = this.storage.localStorage.getItem('bz_free_player_id');
        
        if (existingId) {
            // Load existing free player
            return await this.loadExistingFreePlayer(existingId, deviceFingerprint);
        } else {
            // Create new free player
            return await this.createNewFreePlayer(deviceFingerprint);
        }
    }

    /**
     * Create new free player with anti-abuse protection
     * @private
     */
    async createNewFreePlayer(deviceFingerprint) {
        const playerId = this.generatePlayerId('free');
        const displayName = `Player${playerId.slice(-4)}`;
        
        const player = {
            playerId,
            tier: this.tiers.FREE,
            displayName,
            avatar: this.generateAvatar(playerId),
            deviceFingerprint,
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
            
            // Free tier specific
            isAnonymous: true,
            verified: false,
            
            // Gaming profile
            gamesPlayed: 0,
            achievements: [],
            stats: {},
            
            // Features available
            features: this.tierFeatures[this.tiers.FREE],
            
            // Security
            securityStatus: null, // Will be populated by validation
            
            // Free game tracking
            freeGameStatus: null // Will be populated by free game manager
        };

        // Save to storage
        this.storage.localStorage.setItem('bz_free_player_id', playerId);
        this.storage.localStorage.setItem('bz_player_data', JSON.stringify(player));
        this.storage.localStorage.setItem('bz_identity_tier', this.tiers.FREE);

        // Register with backend if available
        try {
            await this.registerPlayerWithBackend(player);
        } catch (error) {
            console.warn('Could not register player with backend:', error);
        }

        return player;
    }

    /**
     * Load existing free player
     * @private
     */
    async loadExistingFreePlayer(playerId, deviceFingerprint) {
        try {
            const storedData = this.storage.localStorage.getItem('bz_player_data');
            let player = storedData ? JSON.parse(storedData) : null;
            
            if (!player || player.playerId !== playerId) {
                // Data inconsistency, create new player
                return await this.createNewFreePlayer(deviceFingerprint);
            }

            // Update last active time
            player.lastActiveAt = Date.now();
            
            // Update device fingerprint if it has changed
            if (player.deviceFingerprint !== deviceFingerprint) {
                player.deviceFingerprint = deviceFingerprint;
                player.deviceUpdatedAt = Date.now();
            }

            // Ensure features are current
            player.features = this.tierFeatures[this.tiers.FREE];

            // Save updated data
            this.storage.localStorage.setItem('bz_player_data', JSON.stringify(player));

            return player;

        } catch (error) {
            console.warn('Failed to load existing free player, creating new:', error);
            return await this.createNewFreePlayer(deviceFingerprint);
        }
    }

    /**
     * Load social tier identity (email, Apple ID, etc.)
     * @private
     */
    async loadSocialIdentity(deviceFingerprint) {
        // This would integrate with social login providers
        // For now, return upgraded version of free identity
        const freePlayer = await this.loadFreeIdentity(deviceFingerprint);
        
        return {
            ...freePlayer,
            tier: this.tiers.SOCIAL,
            verified: true,
            isAnonymous: false,
            features: this.tierFeatures[this.tiers.SOCIAL],
            // Add social-specific fields
            email: this.getSocialEmail(),
            socialProvider: this.getSocialProvider(),
            cloudSyncEnabled: true
        };
    }

    /**
     * Load Web3 tier identity (connected wallet)
     * @private
     */
    async loadWeb3Identity(deviceFingerprint) {
        const walletAddress = await this.getConnectedWallet();
        const socialPlayer = await this.loadSocialIdentity(deviceFingerprint);
        
        return {
            ...socialPlayer,
            tier: this.tiers.WEB3,
            walletAddress,
            features: this.tierFeatures[this.tiers.WEB3],
            // Add Web3-specific fields
            sonicLabsConnected: true,
            cryptoRewardsEnabled: true,
            stakingEnabled: true,
            nftCollectionEnabled: true
        };
    }

    /**
     * Validate player access with anti-abuse system
     * @private
     */
    async validatePlayerAccess(deviceFingerprint) {
        try {
            const ipAddress = await this.getClientIP();
            const additionalData = {
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                // Add behavioral data if available
                mouseMovements: this.getRecentMouseMovements(),
                keystrokes: this.getRecentKeystrokes()
            };

            return await antiAbuseManager.validateNewPlayer(
                deviceFingerprint, 
                ipAddress, 
                additionalData
            );

        } catch (error) {
            console.warn('Anti-abuse validation failed:', error);
            
            // Return permissive validation on error
            return {
                allowed: true,
                riskLevel: 'UNKNOWN',
                riskScore: 0.5,
                message: 'Security validation unavailable',
                restrictions: ['monitoring_only']
            };
        }
    }

    /**
     * Get current player identity
     */
    async getPlayer() {
        if (!this.currentPlayer) {
            await this.initialize();
        }
        return this.currentPlayer;
    }

    /**
     * Get player's available features
     */
    getAvailableFeatures() {
        if (!this.identityTier) return [];
        return this.tierFeatures[this.identityTier] || [];
    }

    /**
     * Check if player has a specific feature
     */
    hasFeature(featureName) {
        const features = this.getAvailableFeatures();
        return features.includes(featureName);
    }

    /**
     * Upgrade player to next tier
     */
    async upgradeToSocialTier(socialData) {
        if (this.identityTier !== this.tiers.FREE) {
            throw new Error('Can only upgrade from free tier');
        }

        this.migrationInProgress = true;

        try {
            // Update current player data
            this.currentPlayer = {
                ...this.currentPlayer,
                tier: this.tiers.SOCIAL,
                verified: true,
                isAnonymous: false,
                features: this.tierFeatures[this.tiers.SOCIAL],
                ...socialData,
                upgradedToSocialAt: Date.now()
            };

            this.identityTier = this.tiers.SOCIAL;

            // Save to storage
            this.storage.localStorage.setItem('bz_identity_tier', this.tiers.SOCIAL);
            this.storage.localStorage.setItem('bz_player_data', JSON.stringify(this.currentPlayer));

            // Track conversion
            await freeGameManager.trackConversion(
                this.currentPlayer.playerId,
                null, // No wallet yet
                { trigger: 'social_upgrade', ...socialData }
            );

            this.emit('tierUpgraded', {
                from: this.tiers.FREE,
                to: this.tiers.SOCIAL,
                player: this.currentPlayer
            });

            return this.currentPlayer;

        } finally {
            this.migrationInProgress = false;
        }
    }

    /**
     * Upgrade player to Web3 tier
     */
    async upgradeToWeb3Tier(walletAddress) {
        if (this.identityTier === this.tiers.WEB3) {
            throw new Error('Already at Web3 tier');
        }

        this.migrationInProgress = true;

        try {
            const previousTier = this.identityTier;

            // Update current player data
            this.currentPlayer = {
                ...this.currentPlayer,
                tier: this.tiers.WEB3,
                walletAddress,
                features: this.tierFeatures[this.tiers.WEB3],
                sonicLabsConnected: true,
                cryptoRewardsEnabled: true,
                upgradedToWeb3At: Date.now()
            };

            this.identityTier = this.tiers.WEB3;

            // Save to storage
            this.storage.localStorage.setItem('bz_identity_tier', this.tiers.WEB3);
            this.storage.localStorage.setItem('bz_player_data', JSON.stringify(this.currentPlayer));

            // Track conversion with wallet
            await freeGameManager.trackConversion(
                this.currentPlayer.playerId,
                walletAddress,
                { trigger: 'web3_upgrade', previousTier }
            );

            this.emit('tierUpgraded', {
                from: previousTier,
                to: this.tiers.WEB3,
                player: this.currentPlayer,
                walletAddress
            });

            return this.currentPlayer;

        } finally {
            this.migrationInProgress = false;
        }
    }

    /**
     * Consume free game (if eligible)
     */
    async consumeFreeGame(gameType = 'neondrop') {
        if (!this.hasFeature('play_free_games')) {
            throw new Error('Free games not available for this tier');
        }

        if (!this.currentPlayer.freeGameStatus?.eligible) {
            throw new Error('Not eligible for free games');
        }

        return await freeGameManager.consumeFreeGameCredit(
            this.currentPlayer.playerId,
            gameType
        );
    }

    /**
     * Update player stats after game
     */
    async updateGameStats(gameType, stats) {
        if (!this.currentPlayer) return;

        this.currentPlayer.gamesPlayed += 1;
        this.currentPlayer.lastActiveAt = Date.now();
        
        if (!this.currentPlayer.stats[gameType]) {
            this.currentPlayer.stats[gameType] = {};
        }
        
        Object.assign(this.currentPlayer.stats[gameType], stats);

        // Save to storage
        this.storage.localStorage.setItem('bz_player_data', JSON.stringify(this.currentPlayer));

        // Update reputation if applicable
        if (stats.completed && !stats.cheated) {
            antiAbuseManager.updateDeviceReputation(
                this.currentPlayer.deviceFingerprint,
                'positive'
            );
        }

        this.emit('gameStatsUpdated', {
            player: this.currentPlayer,
            gameType,
            stats
        });
    }

    // Helper methods for tier detection
    async hasWeb3Wallet() {
        return !!(window.ethereum && await this.getConnectedWallet());
    }

    async hasSocialLogin() {
        return !!(this.getSocialEmail() || this.getSocialProvider());
    }

    async getConnectedWallet() {
        if (!window.ethereum) return null;
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            return accounts[0] || null;
        } catch (error) {
            return null;
        }
    }

    getSocialEmail() {
        return this.storage.localStorage.getItem('bz_social_email');
    }

    getSocialProvider() {
        return this.storage.localStorage.getItem('bz_social_provider');
    }

    // Utility methods
    generatePlayerId(tier) {
        const prefix = tier.charAt(0).toUpperCase();
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix}${timestamp}${random}`;
    }

    generateAvatar(playerId) {
        // Generate consistent avatar based on player ID
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        const index = playerId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return {
            backgroundColor: colors[index % colors.length],
            initials: playerId.slice(-2).toUpperCase()
        };
    }

    async createFallbackIdentity() {
        return {
            playerId: 'fallback_' + Date.now(),
            tier: this.tiers.FREE,
            displayName: 'Guest Player',
            avatar: { backgroundColor: '#CCCCCC', initials: 'GP' },
            isAnonymous: true,
            verified: false,
            features: ['play_free_games'],
            securityStatus: { allowed: true, riskLevel: 'UNKNOWN' },
            freeGameStatus: { eligible: false, reason: 'system_error' }
        };
    }

    // Placeholder methods for integration points
    async getClientIP() {
        // This would typically be provided by the backend
        return 'unknown';
    }

    getRecentMouseMovements() {
        // This would track mouse movements for behavioral analysis
        return [];
    }

    getRecentKeystrokes() {
        // This would track keystroke patterns for behavioral analysis
        return [];
    }

    async registerPlayerWithBackend(player) {
        // This would register the player with the backend API
        try {
            const response = await fetch(`${this.api.baseUrl}/players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(player),
                signal: AbortSignal.timeout(this.api.timeout)
            });
            return await response.json();
        } catch (error) {
            throw new Error(`Backend registration failed: ${error.message}`);
        }
    }
}

// Export singleton instance
export const unifiedIdentity = new UnifiedIdentity();
