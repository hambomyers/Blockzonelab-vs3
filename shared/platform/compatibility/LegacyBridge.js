/**
 * DISABLED: Legacy bridge system replaced by UnifiedSystemsIntegration
 * 
 * This file has been disabled as it's replaced by the new unified systems.
 * All functionality is now handled by UnifiedSystemsIntegration.js
 * 
 * Original purpose: Legacy Bridge Pattern for Consolidated Systems
 * Replacement: shared/platform/UnifiedSystemsIntegration.js
 */

/*
// DISABLED - All code commented out to prevent execution
// The entire LegacyBridge system has been replaced

/**
 * Safe dynamic import helper
 */
async function safeImport(modulePath, fallbackClass = null) {
  try {
    const module = await import(modulePath);
    return module.default || module[Object.keys(module)[0]];
  } catch (error) {
    console.warn(`Failed to import ${modulePath}:`, error);
    if (fallbackClass) {
      console.log(`Using fallback for ${modulePath}`);
      return fallbackClass;
    }
    return null;
  }
}

/**
 * Mock classes for safe fallbacks
 */
class MockIdentitySystem {
  constructor() {
    console.log('🔄 Using mock identity system');
    this.currentPlayer = null;
  }
  
  async initialize() { return { success: true }; }
  async authenticate(data) { 
    this.currentPlayer = { id: 'mock_' + Date.now(), ...data };
    return this.currentPlayer;
  }
  async createFreePlayer(data) { return this.authenticate(data); }
  async connectWallet(address) { 
    if (this.currentPlayer) {
      this.currentPlayer.walletAddress = address;
    }
    return this.currentPlayer;
  }
  getCurrentPlayer() { return this.currentPlayer; }
  isAuthenticated() { return !!this.currentPlayer; }
}

class MockPaymentSystem {
  constructor() {
    console.log('💳 Using mock payment system');
  }
  
  async initialize() { return { success: true }; }
  async processPayment(amount, method, metadata) {
    console.log('Mock payment:', { amount, method, metadata });
    return { success: true, transactionId: 'mock_' + Date.now() };
  }
  async getBalance(playerId, currency) { return 1000; }
  async validatePaymentMethod(method, address) { return true; }
}

class MockLeaderboardSystem {
  constructor() {
    console.log('🏆 Using mock leaderboard system');
    this.scores = [];
  }
  
  async createTournament(gameId, config) {
    return { id: 'mock_tournament_' + Date.now(), gameId, config };
  }
  async submitScore(tournamentId, playerId, score, metadata) {
    this.scores.push({ tournamentId, playerId, score, metadata, timestamp: Date.now() });
    return { success: true, rank: this.scores.length };
  }
  async getTournamentLeaderboard(tournamentId, limit) {
    return this.scores
      .filter(s => s.tournamentId === tournamentId)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  async addScore(playerId, score) { return this.submitScore('default', playerId, score, {}); }
  async getTopPlayers(limit) { return this.getTournamentLeaderboard('default', limit); }
  show() { console.log('Leaderboard show'); }
  hide() { console.log('Leaderboard hide'); }
  update(data) { console.log('Leaderboard update:', data); }
}

class MockAPIClient {
  constructor(baseURL) {
    console.log('🌐 Using mock API client for:', baseURL);
    this.baseURL = baseURL;
    this.authToken = null;
  }
  
  async get(endpoint, params) {
    console.log('Mock GET:', endpoint, params);
    return { success: true, data: {} };
  }
  async post(endpoint, data) {
    console.log('Mock POST:', endpoint, data);
    return { success: true, data: {} };
  }
  async put(endpoint, data) {
    console.log('Mock PUT:', endpoint, data);
    return { success: true, data: {} };
  }
  async delete(endpoint) {
    console.log('Mock DELETE:', endpoint);
    return { success: true };
  }
  setAuthToken(token) {
    this.authToken = token;
  }
}

/**
 * Identity Bridge - Transitions between old and new identity systems
 */
export class IdentityBridge {
  constructor(config = {}) {
    this.useUnified = config.useUnified === true;
    this.fallbackEnabled = config.fallbackEnabled !== false;
    this.legacy = null;
    this.unified = null;
    
    console.log(`🔗 IdentityBridge initialized - Target: ${this.useUnified ? 'Unified' : 'Legacy'} system`);
  }
  
  async initialize() {
    try {
      if (this.useUnified) {
        console.log('🔗 IdentityBridge: Attempting to load unified identity system');
        const UnifiedIdentity = await safeImport('../systems/UnifiedIdentity.js', MockIdentitySystem);
        if (UnifiedIdentity && UnifiedIdentity !== MockIdentitySystem) {
          this.unified = new UnifiedIdentity();
          await this.unified.initialize();
          console.log('✅ IdentityBridge: Unified system loaded successfully');
          return { success: true, system: 'unified' };
        }
      }
    } catch (error) {
      console.warn('🔗 IdentityBridge: Unified system failed, falling back:', error);
      if (this.fallbackEnabled) {
        this.useUnified = false;
      }
    }
      try {
      console.log('🔗 IdentityBridge: Loading legacy identity system');
      const LegacyIdentity = await safeImport('../systems/UniversalIdentity.js', MockIdentitySystem);
      this.legacy = new LegacyIdentity();
      await this.legacy.initialize();
      console.log('✅ IdentityBridge: Legacy system loaded successfully');
      return { success: true, system: 'legacy' };
    } catch (error) {
      console.warn('🔗 IdentityBridge: Legacy system failed, using mock:', error);
      this.legacy = new MockIdentitySystem();
      await this.legacy.initialize();
      return { success: true, system: 'mock' };
    }
  }
  
  async authenticate(data) {
    const system = this.useUnified ? this.unified : this.legacy;
    if (!system) {
      throw new Error('No identity system available');
    }
    
    try {
      if (this.useUnified && system.createFreePlayer) {
        return await system.createFreePlayer(data);
      } else if (system.authenticate) {
        return await system.authenticate(data);
      } else {
        throw new Error('No authentication method available');
      }
    } catch (error) {
      if (this.fallbackEnabled && this.useUnified && this.legacy) {
        console.warn('🔗 Falling back to legacy authentication:', error);
        this.useUnified = false;
        return await this.legacy.authenticate(data);
      }
      throw error;
    }
  }
  
  async connectWallet(address) {
    const system = this.useUnified ? this.unified : this.legacy;
    if (!system) {
      throw new Error('No identity system available');
    }
    
    try {
      return await system.connectWallet(address);
    } catch (error) {
      if (this.fallbackEnabled && this.useUnified && this.legacy) {
        console.warn('🔗 Falling back to legacy wallet connection:', error);
        this.useUnified = false;
        return await this.legacy.connectWallet(address);
      }
      throw error;
    }
  }
  
  getCurrentPlayer() {
    const system = this.useUnified ? this.unified : this.legacy;
    return system ? system.getCurrentPlayer() : null;
  }
  
  isAuthenticated() {
    const system = this.useUnified ? this.unified : this.legacy;
    return system ? system.isAuthenticated() : false;
  }
}

/**
 * Payment Bridge - Transitions between old and new payment systems
 */
export class PaymentBridge {
  constructor(config = {}) {
    this.useUnified = config.useUnified === true;
    this.fallbackEnabled = config.fallbackEnabled !== false;
    this.legacy = null;
    this.unified = null;
    
    console.log(`💳 PaymentBridge initialized - Target: ${this.useUnified ? 'Unified' : 'Legacy'} system`);
  }
  
  async initialize() {
    try {
      if (this.useUnified) {
        console.log('💳 PaymentBridge: Attempting to load unified payment system');
        const UnifiedPayments = await safeImport('../systems/UniversalPayments.js', MockPaymentSystem);
        if (UnifiedPayments && UnifiedPayments !== MockPaymentSystem) {
          this.unified = new UnifiedPayments();
          await this.unified.initialize();
          console.log('✅ PaymentBridge: Unified system loaded successfully');
          return { success: true, system: 'unified' };
        }
      }
    } catch (error) {
      console.warn('💳 PaymentBridge: Unified system failed, falling back:', error);
      if (this.fallbackEnabled) {
        this.useUnified = false;
      }
    }
    
    try {
      console.log('💳 PaymentBridge: Loading legacy payment system');
      const LegacyPayments = await safeImport('../../../games/neondrop/UniversalPaymentSystem.js', MockPaymentSystem);
      this.legacy = new LegacyPayments();
      await this.legacy.initialize();
      console.log('✅ PaymentBridge: Legacy system loaded successfully');
      return { success: true, system: 'legacy' };
    } catch (error) {
      console.warn('💳 PaymentBridge: Legacy system failed, using mock:', error);
      this.legacy = new MockPaymentSystem();
      await this.legacy.initialize();
      return { success: true, system: 'mock' };
    }
  }
  
  async processPayment(amount, method, metadata) {
    const system = this.useUnified ? this.unified : this.legacy;
    if (!system) {
      throw new Error('No payment system available');
    }
    
    try {
      return await system.processPayment(amount, method, metadata);
    } catch (error) {
      if (this.fallbackEnabled && this.useUnified && this.legacy) {
        console.warn('💳 Falling back to legacy payment processing:', error);
        this.useUnified = false;
        return await this.legacy.processPayment(amount, method, metadata);
      }
      throw error;
    }
  }
  
  async getBalance(playerId, currency) {
    const system = this.useUnified ? this.unified : this.legacy;
    if (!system) return 0;
    
    try {
      return await system.getBalance(playerId, currency);
    } catch (error) {
      if (this.fallbackEnabled && this.useUnified && this.legacy) {
        console.warn('💳 Falling back to legacy balance check:', error);
        this.useUnified = false;
        return await this.legacy.getBalance(playerId, currency);
      }
      return 0;
    }
  }
  
  async validatePaymentMethod(method, address) {
    const system = this.useUnified ? this.unified : this.legacy;
    if (!system) return false;
    
    try {
      return await system.validatePaymentMethod(method, address);
    } catch (error) {
      if (this.fallbackEnabled && this.useUnified && this.legacy) {
        console.warn('💳 Falling back to legacy validation:', error);
        this.useUnified = false;
        return await this.legacy.validatePaymentMethod(method, address);
      }
      return false;
    }
  }
}

/**
 * Leaderboard Bridge - Transitions between old and new leaderboard systems
 */
export class LeaderboardBridge {
  constructor(config = {}) {
    this.useUnified = config.useUnified === true;
    this.fallbackEnabled = config.fallbackEnabled !== false;
    this.legacySystem = null;
    this.unifiedSystem = null;
    this.unifiedUI = null;
    
    console.log(`🏆 LeaderboardBridge initialized - Target: ${this.useUnified ? 'Unified' : 'Legacy'} system`);
  }
  
  async initialize() {
    try {
      if (this.useUnified) {
        console.log('🏆 LeaderboardBridge: Attempting to load unified leaderboard system');
        const [UnifiedLeaderboard, LeaderboardComponents] = await Promise.all([
          safeImport('../systems/UnifiedLeaderboard.js', MockLeaderboardSystem),
          safeImport('../ui/LeaderboardComponents.js', MockLeaderboardSystem)
        ]);
        
        if (UnifiedLeaderboard && UnifiedLeaderboard !== MockLeaderboardSystem) {
          this.unifiedSystem = new UnifiedLeaderboard();
          this.unifiedUI = LeaderboardComponents ? new LeaderboardComponents() : this.unifiedSystem;
          console.log('✅ LeaderboardBridge: Unified system loaded successfully');
          return { success: true, system: 'unified' };
        }
      }
    } catch (error) {
      console.warn('🏆 LeaderboardBridge: Unified system failed, falling back:', error);
      if (this.fallbackEnabled) {
        this.useUnified = false;
      }    }
    
    try {
      console.log('🏆 LeaderboardBridge: TournamentLeaderboard removed, using mock system');
      // const LegacyLeaderboard = await safeImport('../../ui/TournamentLeaderboard.js', MockLeaderboardSystem);
      this.legacySystem = new MockLeaderboardSystem();
      console.log('✅ LeaderboardBridge: Using mock system (TournamentLeaderboard stub removed)');
      return { success: true, system: 'mock' };
    } catch (error) {
      console.warn('🏆 LeaderboardBridge: Mock system fallback:', error);
      this.legacySystem = new MockLeaderboardSystem();
      return { success: true, system: 'mock' };
    }
  }
  
  async createTournament(gameId, config) {
    const system = this.useUnified ? this.unifiedSystem : this.legacySystem;
    if (!system) {
      throw new Error('No leaderboard system available');
    }
    
    try {
      return await system.createTournament(gameId, config);
    } catch (error) {
      if (this.fallbackEnabled && this.useUnified && this.legacySystem) {
        console.warn('🏆 Falling back to legacy tournament creation:', error);
        this.useUnified = false;
        return await this.legacySystem.createTournament(gameId, config);
      }
      throw error;
    }
  }
  
  async submitScore(tournamentId, playerId, score, metadata) {
    const system = this.useUnified ? this.unifiedSystem : this.legacySystem;
    if (!system) {
      throw new Error('No leaderboard system available');
    }
    
    try {
      if (this.useUnified && system.submitScore) {
        return await system.submitScore(tournamentId, playerId, score, metadata);
      } else if (system.addScore) {
        return await system.addScore(playerId, score);
      } else {
        throw new Error('No score submission method available');
      }
    } catch (error) {
      if (this.fallbackEnabled && this.useUnified && this.legacySystem) {
        console.warn('🏆 Falling back to legacy score submission:', error);
        this.useUnified = false;
        return await this.legacySystem.addScore(playerId, score);
      }
      throw error;
    }
  }
  
  async getTournamentLeaderboard(tournamentId, limit) {
    const system = this.useUnified ? this.unifiedSystem : this.legacySystem;
    if (!system) return [];
    
    try {
      if (this.useUnified && system.getTournamentLeaderboard) {
        return await system.getTournamentLeaderboard(tournamentId, limit);
      } else if (system.getTopPlayers) {
        return await system.getTopPlayers(limit);
      } else {
        return [];
      }
    } catch (error) {
      if (this.fallbackEnabled && this.useUnified && this.legacySystem) {
        console.warn('🏆 Falling back to legacy leaderboard fetch:', error);
        this.useUnified = false;
        return await this.legacySystem.getTopPlayers(limit);
      }
      return [];
    }
  }
  
  show() {
    const ui = this.useUnified ? this.unifiedUI : this.legacySystem;
    if (ui && ui.show) ui.show();
  }
  
  hide() {
    const ui = this.useUnified ? this.unifiedUI : this.legacySystem;
    if (ui && ui.hide) ui.hide();
  }
  
  update(data) {
    const ui = this.useUnified ? this.unifiedUI : this.legacySystem;
    if (ui && ui.update) ui.update(data);
  }
}

/**
 * API Bridge - Transitions between old and new API clients
 */
export class APIBridge {
  constructor(baseURL, config = {}) {
    this.baseURL = baseURL;
    this.useUnified = config.useUnified === true;
    this.fallbackEnabled = config.fallbackEnabled !== false;
    this.legacyAPI = null;
    this.unifiedAPI = null;
    
    console.log(`🌐 APIBridge initialized - Target: ${this.useUnified ? 'Unified' : 'Legacy'} API client`);
  }
  
  async initialize() {
    try {
      if (this.useUnified) {
        console.log('🌐 APIBridge: Attempting to load unified API client');
        const UnifiedAPIClient = await safeImport('../api/UnifiedAPIClient.js', MockAPIClient);
        if (UnifiedAPIClient && UnifiedAPIClient !== MockAPIClient) {
          this.unifiedAPI = new UnifiedAPIClient(this.baseURL);
          console.log('✅ APIBridge: Unified API client loaded successfully');
          return { success: true, system: 'unified' };
        }
      }
    } catch (error) {
      console.warn('🌐 APIBridge: Unified API client failed, falling back:', error);
      if (this.fallbackEnabled) {
        this.useUnified = false;
      }
    }
    
    try {
      console.log('🌐 APIBridge: Loading legacy API client');
      const LegacyAPI = await safeImport('../../api/robust-api-client.js', MockAPIClient);
      this.legacyAPI = new LegacyAPI(this.baseURL);
      console.log('✅ APIBridge: Legacy API client loaded successfully');
      return { success: true, system: 'legacy' };
    } catch (error) {
      console.warn('🌐 APIBridge: Legacy API client failed, using mock:', error);
      this.legacyAPI = new MockAPIClient(this.baseURL);
      return { success: true, system: 'mock' };
    }
  }
  
  async get(endpoint, params) {
    const api = this.useUnified ? this.unifiedAPI : this.legacyAPI;
    if (!api) {
      throw new Error('No API client available');
    }
    
    try {
      return await api.get(endpoint, params);
    } catch (error) {
      if (this.fallbackEnabled && this.useUnified && this.legacyAPI) {
        console.warn('🌐 Falling back to legacy GET:', error);
        this.useUnified = false;
        return await this.legacyAPI.get(endpoint, params);
      }
      throw error;
    }
  }
  
  async post(endpoint, data) {
    const api = this.useUnified ? this.unifiedAPI : this.legacyAPI;
    if (!api) {
      throw new Error('No API client available');
    }
    
    try {
      return await api.post(endpoint, data);
    } catch (error) {
      if (this.fallbackEnabled && this.useUnified && this.legacyAPI) {
        console.warn('🌐 Falling back to legacy POST:', error);
        this.useUnified = false;
        return await this.legacyAPI.post(endpoint, data);
      }
      throw error;
    }
  }
  
  async put(endpoint, data) {
    const api = this.useUnified ? this.unifiedAPI : this.legacyAPI;
    if (!api) return { success: false };
    
    try {
      return await api.put(endpoint, data);
    } catch (error) {
      if (this.fallbackEnabled && this.useUnified && this.legacyAPI) {
        console.warn('🌐 Falling back to legacy PUT:', error);
        this.useUnified = false;
        return await this.legacyAPI.put(endpoint, data);
      }
      return { success: false, error: error.message };
    }
  }
  
  async delete(endpoint) {
    const api = this.useUnified ? this.unifiedAPI : this.legacyAPI;
    if (!api) return { success: false };
    
    try {
      return await api.delete(endpoint);
    } catch (error) {
      if (this.fallbackEnabled && this.useUnified && this.legacyAPI) {
        console.warn('🌐 Falling back to legacy DELETE:', error);
        this.useUnified = false;
        return await this.legacyAPI.delete(endpoint);
      }
      return { success: false, error: error.message };
    }
  }
  
  setAuthToken(token) {
    if (this.unifiedAPI && this.unifiedAPI.setAuthToken) {
      this.unifiedAPI.setAuthToken(token);
    }
    if (this.legacyAPI && this.legacyAPI.setAuthToken) {
      this.legacyAPI.setAuthToken(token);
    }
  }
}

/**
 * Master Bridge Controller - Manages all system bridges
 */
export class LegacyBridge {
  constructor(config = {}) {
    this.config = config;
    this.identity = new IdentityBridge(config.identity || {});
    this.payments = new PaymentBridge(config.payments || {});
    this.leaderboard = new LeaderboardBridge(config.leaderboard || {});
    this.api = new APIBridge(config.apiBaseURL || 'https://api.blockzonelab.com', config.api || {});
    
    // Feature flags
    this.enableUnifiedSystems = config.enableUnifiedSystems !== false;
    this.enableFallback = config.enableFallback !== false;
    
    console.log('🌉 LegacyBridge master controller initialized');
    console.log('🌉 Feature flags:', {
      enableUnifiedSystems: this.enableUnifiedSystems,
      enableFallback: this.enableFallback
    });
  }
  
  async initialize() {
    console.log('🌉 LegacyBridge: Initializing all bridge systems...');
    
    const results = await Promise.allSettled([
      this.identity.initialize(),
      this.payments.initialize(),
      this.leaderboard.initialize(),
      this.api.initialize()
    ]);
    
    const failures = results.filter(result => result.status === 'rejected');
    const successes = results.filter(result => result.status === 'fulfilled');
    
    if (failures.length > 0) {
      console.warn('🌉 LegacyBridge: Some systems failed to initialize:', failures.map(f => f.reason));
    }
    
    console.log('🌉 LegacyBridge: Bridge initialization complete');
    console.log(`✅ ${successes.length} systems initialized successfully`);
    console.log(`⚠️ ${failures.length} systems failed or fell back`);
    
    return {
      success: true,
      initialized: successes.length,
      failures: failures.length,
      systems: {
        identity: this.identity,
        payments: this.payments,
        leaderboard: this.leaderboard,
        api: this.api
      }
    };
  }
  
  // Convenience methods for switching systems
  enableUnifiedMode() {
    console.log('🌉 LegacyBridge: Switching to unified mode');
    this.identity.useUnified = true;
    this.payments.useUnified = true;
    this.leaderboard.useUnified = true;
    this.api.useUnified = true;
  }
  
  enableLegacyMode() {
    console.log('🌉 LegacyBridge: Switching to legacy mode');
    this.identity.useUnified = false;
    this.payments.useUnified = false;
    this.leaderboard.useUnified = false;
    this.api.useUnified = false;
  }
  
  getSystemStatus() {
    return {
      identity: {
        using: this.identity.useUnified ? 'unified' : 'legacy',
        fallbackEnabled: this.identity.fallbackEnabled,
        available: !!(this.identity.unified || this.identity.legacy)
      },
      payments: {
        using: this.payments.useUnified ? 'unified' : 'legacy',
        fallbackEnabled: this.payments.fallbackEnabled,
        available: !!(this.payments.unified || this.payments.legacy)
      },
      leaderboard: {
        using: this.leaderboard.useUnified ? 'unified' : 'legacy',
        fallbackEnabled: this.leaderboard.fallbackEnabled,
        available: !!(this.leaderboard.unifiedSystem || this.leaderboard.legacySystem)
      },
      api: {        using: this.api.useUnified ? 'unified' : 'legacy',
        fallbackEnabled: this.api.fallbackEnabled,
        available: !!(this.api.unifiedAPI || this.api.legacyAPI)
      }
    };
  }
}

// Export individual bridges and master controller
export default LegacyBridge;

// END DISABLED CODE */

// Replacement functionality is in UnifiedSystemsIntegration.js