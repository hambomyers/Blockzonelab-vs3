// shared/platform/systems/UnifiedIdentity.js
/**
 * Unified Player Identity System
 * Handles free and paid players, wallet connections, and anti-abuse protection
 */

export class UnifiedIdentity {
  constructor(config = {}) {
    this.config = {
      enableAntiAbuse: true,
      enableFreeGames: true,
      maxFreeGamesPerDay: 1,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      ...config
    };
    
    this.currentPlayer = null;
    this.isInitialized = false;
    this.eventListeners = new Map();
    
    // Bind methods to preserve context
    this.initialize = this.initialize.bind(this);
    this.createFreePlayer = this.createFreePlayer.bind(this);
    this.connectWallet = this.connectWallet.bind(this);
  }

  /**
   * Initialize the identity system
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Unified Identity System...');
      
      // Load cached player data if available
      await this.loadCachedPlayer();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      console.log('✅ Unified Identity System ready');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize identity system:', error);
      throw new Error(`Identity initialization failed: ${error.message}`);
    }
  }

  /**
   * Create a new free player (no wallet required)
   */
  async createFreePlayer(deviceData = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🆕 Creating new free player...');
      
      const playerId = this.generatePlayerId();
      const deviceFingerprint = await this.generateDeviceFingerprint(deviceData);
      
      const player = {
        id: playerId,
        type: 'free',
        deviceFingerprint,
        createdAt: Date.now(),
        lastSeen: Date.now(),
        stats: {
          gamesPlayed: 0,
          totalScore: 0,
          bestScore: 0
        },
        freeGames: {
          available: this.config.maxFreeGamesPerDay,
          used: 0,
          lastReset: Date.now()
        }
      };
      
      // Store player data
      await this.storePlayer(player);
      this.currentPlayer = player;
      
      this.emit('playerCreated', player);
      console.log('✅ Free player created:', playerId);
      
      return player;
    } catch (error) {
      console.error('❌ Failed to create free player:', error);
      throw new Error(`Free player creation failed: ${error.message}`);
    }
  }

  /**
   * Connect wallet and upgrade to paid player
   */
  async connectWallet(walletAddress) {
    try {
      if (!walletAddress || typeof walletAddress !== 'string') {
        throw new Error('Valid wallet address required');
      }

      console.log('🔗 Connecting wallet:', walletAddress);
      
      if (!this.currentPlayer) {
        throw new Error('No active player session');
      }

      // Upgrade current player to paid status
      const upgradedPlayer = {
        ...this.currentPlayer,
        type: 'paid',
        walletAddress,
        connectedAt: Date.now()
      };
      
      await this.storePlayer(upgradedPlayer);
      this.currentPlayer = upgradedPlayer;
      
      this.emit('walletConnected', upgradedPlayer);
      console.log('✅ Wallet connected successfully');
      
      return upgradedPlayer;
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      throw new Error(`Wallet connection failed: ${error.message}`);
    }
  }

  /**
   * Check if player can play a free game
   */
  canPlayFreeGame() {
    if (!this.currentPlayer) {
      return false;
    }

    const { freeGames } = this.currentPlayer;
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Reset daily free games if needed
    if (now - freeGames.lastReset > dayInMs) {
      freeGames.available = this.config.maxFreeGamesPerDay;
      freeGames.used = 0;
      freeGames.lastReset = now;
    }
    
    return freeGames.available > 0;
  }

  /**
   * Use a free game credit
   */
  async useFreeGame() {
    if (!this.canPlayFreeGame()) {
      throw new Error('No free games available');
    }

    this.currentPlayer.freeGames.available--;
    this.currentPlayer.freeGames.used++;
    
    await this.storePlayer(this.currentPlayer);
    this.emit('freeGameUsed', this.currentPlayer);
    
    return this.currentPlayer.freeGames;
  }

  /**
   * Get current player
   */
  getCurrentPlayer() {
    return this.currentPlayer;
  }

  /**
   * Check if player is authenticated
   */
  isAuthenticated() {
    return this.currentPlayer !== null;
  }

  /**
   * Check if player has wallet connected
   */
  hasWallet() {
    return this.currentPlayer && this.currentPlayer.walletAddress;
  }

  /**
   * Generate unique player ID
   */
  generatePlayerId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `player_${timestamp}_${random}`;
  }

  /**
   * Generate device fingerprint for anonymous tracking
   */
  async generateDeviceFingerprint(deviceData) {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: Date.now(),
      ...deviceData
    };
    
    return btoa(JSON.stringify(fingerprint));
  }

  /**
   * Load cached player data from localStorage
   */
  async loadCachedPlayer() {
    try {
      const cached = localStorage.getItem('blockzone_player');
      if (cached) {
        this.currentPlayer = JSON.parse(cached);
        console.log('📂 Loaded cached player:', this.currentPlayer.id);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cached player:', error);
    }
  }

  /**
   * Store player data to localStorage
   */
  async storePlayer(player) {
    try {
      localStorage.setItem('blockzone_player', JSON.stringify(player));
    } catch (error) {
      console.warn('⚠️ Failed to store player data:', error);
    }
  }

  /**
   * Simple event emitter
   */
  emit(event, data) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Add event listener
   */
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(listener);
  }

  /**
   * Remove event listener
   */
  off(event, listener) {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
}