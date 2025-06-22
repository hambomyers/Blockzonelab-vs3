/**
 * UnifiedPlayerSystem.js - Complete Player Identity & Session Management
 * Consolidates all scattered player management into one robust system
 */

export class UnifiedPlayerSystem {
    constructor(options = {}) {
        this.apiClient = options.apiClient;
        this.storageBackend = options.storageBackend || 'cloudflare-kv';
        this.enableCrypto = options.enableCrypto !== false;
        
        this.player = null;
        this.session = null;
        this.eventListeners = new Map();
        
        this.init();
    }

    /**
     * Initialize the player system
     */
    async init() {
        console.log('🎮 Initializing Unified Player System');
        
        // Load existing session
        await this.loadSession();
        
        // Initialize crypto connections if enabled
        if (this.enableCrypto) {
            await this.initializeCrypto();
        }
        
        console.log('✅ Player system ready');
    }

    /**
     * Load existing player session from storage
     */
    async loadSession() {
        try {
            const sessionData = localStorage.getItem('blockzone-session');
            if (sessionData) {
                this.session = JSON.parse(sessionData);
                if (this.session.playerId) {
                    this.player = await this.loadPlayer(this.session.playerId);
                }
            }
        } catch (error) {
            console.warn('Failed to load session:', error);
            this.session = null;
        }
    }

    /**
     * Load player data by ID
     */
    async loadPlayer(playerId) {
        try {
            if (this.apiClient) {
                return await this.apiClient.getPlayer(playerId);
            } else {
                // Fallback to localStorage
                const playerData = localStorage.getItem(`blockzone-player-${playerId}`);
                return playerData ? JSON.parse(playerData) : null;
            }
        } catch (error) {
            console.error('Failed to load player:', error);
            return null;
        }
    }

    /**
     * Create new player with optional custom data
     */
    async createPlayer(playerData = {}) {
        const newPlayer = {
            id: this.generatePlayerId(),
            displayName: playerData.displayName || `Player${Math.floor(Math.random() * 10000)}`,
            email: playerData.email || null,
            walletAddress: playerData.walletAddress || null,
            createdAt: Date.now(),
            lastSeen: Date.now(),
            
            // Game stats
            level: 1,
            experience: 0,
            totalGamesPlayed: 0,
            
            // Balances
            balances: {
                quarters: 0,
                usdc: 0,
                freeCredits: 5 // Starting credits
            },
            
            // Game-specific stats storage
            stats: new Map(),
            
            // Achievements and progress
            achievements: [],
            unlockedFeatures: ['free-play'],
            
            // Settings
            settings: {
                notifications: true,
                soundEnabled: true,
                theme: 'dark',
                ...playerData.settings
            },
            
            // Custom fields from playerData
            ...playerData
        };
        
        // Save player
        await this.savePlayer(newPlayer);
        
        // Create session
        this.session = {
            playerId: newPlayer.id,
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            lastActivity: Date.now()
        };
        
        this.player = newPlayer;
        await this.saveSession();
        
        this.emit('player:created', { player: newPlayer });
        console.log('✅ Player created:', newPlayer.displayName);
        
        return newPlayer;
    }

    /**
     * Get current player
     */
    async getPlayer() {
        if (!this.player && this.session?.playerId) {
            this.player = await this.loadPlayer(this.session.playerId);
        }
        return this.player;
    }

    /**
     * Update player data
     */
    async updatePlayer(updates) {
        if (!this.player) {
            throw new Error('No active player to update');
        }
        
        const oldLevel = this.player.level;
        
        // Merge updates
        Object.assign(this.player, updates);
        this.player.lastSeen = Date.now();
        
        // Check for level up
        if (updates.experience !== undefined) {
            const newLevel = Math.floor(this.player.experience / 100) + 1;
            if (newLevel > oldLevel) {
                this.player.level = newLevel;
                this.emit('player:level-up', { 
                    player: this.player, 
                    oldLevel, 
                    newLevel 
                });
            }
        }
        
        await this.savePlayer(this.player);
        this.emit('player:updated', { player: this.player, updates });
        
        return this.player;
    }

    /**
     * Add experience points
     */
    async addExperience(amount) {
        const player = await this.getPlayer();
        if (!player) return;
        
        return await this.updatePlayer({
            experience: player.experience + amount
        });
    }

    /**
     * Update player balance
     */
    async updateBalance(currency, amount) {
        const player = await this.getPlayer();
        if (!player) throw new Error('No active player');
        
        if (!player.balances[currency]) {
            player.balances[currency] = 0;
        }
        
        player.balances[currency] += amount;
        
        // Prevent negative balances (except for debt tracking)
        if (player.balances[currency] < 0 && currency !== 'debt') {
            player.balances[currency] = 0;
        }
        
        await this.savePlayer(player);
        this.emit('player:balance-updated', { 
            player, 
            currency, 
            amount, 
            newBalance: player.balances[currency] 
        });
        
        return player.balances[currency];
    }

    /**
     * Process payment (charges player balance or initiates payment flow)
     */
    async processPayment(paymentData) {
        const player = await this.getPlayer();
        if (!player) throw new Error('No active player');
        
        const { amount, currency = 'usdc', description, metadata = {} } = paymentData;
        
        // Check if player has sufficient balance
        if (player.balances[currency] >= amount) {
            // Deduct from balance
            await this.updateBalance(currency, -amount);
            
            this.emit('player:payment-processed', {
                player,
                amount,
                currency,
                method: 'balance',
                description,
                metadata
            });
            
            return { success: true, method: 'balance' };
        }
        
        // If crypto enabled, initiate crypto payment
        if (this.enableCrypto && currency === 'usdc') {
            return await this.initiateCryptoPayment(paymentData);
        }
        
        // Fallback to external payment (Apple Pay, etc.)
        return await this.initiateExternalPayment(paymentData);
    }

    /**
     * Connect wallet address to player
     */
    async connectWallet(walletAddress) {
        const player = await this.getPlayer();
        if (!player) throw new Error('No active player');
        
        await this.updatePlayer({ walletAddress });
        this.emit('player:wallet-connected', { player, walletAddress });
        
        console.log('🔗 Wallet connected:', walletAddress);
        return true;
    }

    /**
     * Unlock achievement
     */
    async unlockAchievement(achievementId) {
        const player = await this.getPlayer();
        if (!player) return;
        
        if (!player.achievements.includes(achievementId)) {
            player.achievements.push(achievementId);
            await this.savePlayer(player);
            
            this.emit('player:achievement-unlocked', {
                player,
                achievement: { id: achievementId }
            });
            
            // Award XP for achievement
            await this.addExperience(50);
        }
    }

    /**
     * Store game-specific stats
     */
    async setGameStats(gameId, stats) {
        const player = await this.getPlayer();
        if (!player) return;
        
        if (!player.stats) {
            player.stats = new Map();
        }
        
        player.stats.set(gameId, {
            ...player.stats.get(gameId),
            ...stats,
            lastUpdated: Date.now()
        });
        
        await this.savePlayer(player);
        return player.stats.get(gameId);
    }

    /**
     * Get game-specific stats
     */
    async getGameStats(gameId) {
        const player = await this.getPlayer();
        if (!player || !player.stats) return null;
        
        return player.stats.get(gameId) || null;
    }

    /**
     * Update last activity timestamp
     */
    async updateActivity() {
        if (this.session) {
            this.session.lastActivity = Date.now();
            await this.saveSession();
        }
        
        if (this.player) {
            this.player.lastSeen = Date.now();
            await this.savePlayer(this.player);
        }
    }

    /**
     * Log out current player
     */
    async logout() {
        if (this.player) {
            this.emit('player:logout', { player: this.player });
        }
        
        this.player = null;
        this.session = null;
        
        // Clear local storage
        localStorage.removeItem('blockzone-session');
        
        console.log('👋 Player logged out');
    }

    /**
     * Save player to storage
     */
    async savePlayer(player) {
        try {
            if (this.apiClient) {
                await this.apiClient.savePlayer(player);
            } else {
                // Fallback to localStorage
                const playerData = { ...player };
                // Convert Map to object for JSON serialization
                if (playerData.stats instanceof Map) {
                    playerData.stats = Object.fromEntries(playerData.stats);
                }
                localStorage.setItem(`blockzone-player-${player.id}`, JSON.stringify(playerData));
            }
        } catch (error) {
            console.error('Failed to save player:', error);
            throw error;
        }
    }

    /**
     * Save session to storage
     */
    async saveSession() {
        if (this.session) {
            localStorage.setItem('blockzone-session', JSON.stringify(this.session));
        }
    }

    /**
     * Initialize crypto wallet integration
     */
    async initializeCrypto() {
        // Initialize web3 connection if available
        if (typeof window !== 'undefined' && window.ethereum) {
            console.log('🔗 Web3 detected, crypto payments available');
        }
    }

    /**
     * Initiate crypto payment flow
     */
    async initiateCryptoPayment(paymentData) {
        // This would integrate with Sonic/Ethereum wallet
        console.log('💰 Initiating crypto payment:', paymentData);
        
        // Placeholder - implement actual crypto payment logic
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, method: 'crypto', txHash: 'mock_tx_hash' });
            }, 2000);
        });
    }

    /**
     * Initiate external payment (Apple Pay, etc.)
     */
    async initiateExternalPayment(paymentData) {
        console.log('💳 Initiating external payment:', paymentData);
        
        // Placeholder - implement Apple Pay, Google Pay, etc.
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, method: 'external', reference: 'mock_ref' });
            }, 1500);
        });
    }

    /**
     * Generate unique player ID
     */
    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
        
        // Also emit as DOM event for global listening
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent(`player:${event}`, { detail: data }));
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.eventListeners.clear();
        console.log('🛑 Unified Player System destroyed');
    }
}

export default UnifiedPlayerSystem;
