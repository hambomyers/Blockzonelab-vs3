/**
 * UnifiedLeaderboard.js - Unified Cross-Game Leaderboard System
 * 
 * PHASE 2: LEADERBOARD CONSOLIDATION
 * 
 * Consolidates functionality from:
 * - shared/ui/TournamentLeaderboard.js (UI components)
 * - games/neondrop/ui/TournamentLeaderboard.js (game-specific UI)
 * - shared/tournaments/daily-tournament.js (tournament logic)
 * - worker/leaderboard.js (backend worker)
 * 
 * Features:
 * - Real-time leaderboard updates via WebSocket
 * - Cross-game compatible scoring
 * - Tournament lifecycle management
 * - Anti-cheat score validation
 * - Scalable to 1000+ concurrent players
 */

import { EventEmitter } from '../../utils/EventEmitter.js';
import { IMPORT_PATHS } from '../../utils/ImportPaths.js';

export class UnifiedLeaderboard extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Core configuration
        this.config = {
            apiBase: config.apiBase || 'https://blockzone-api.hambomyers.workers.dev/api',
            maxPlayers: config.maxPlayers || 1000,
            updateInterval: config.updateInterval || 1000, // 1 second
            enableRealtime: config.enableRealtime !== false,
            enableAntiCheat: config.enableAntiCheat !== false,
            ...config
        };

        // Core state management
        this.tournaments = new Map();
        this.players = new Map();
        this.leaderboards = new Map();
        this.subscriptions = new Map();
        
        // Real-time components (lazy loaded)
        this.realtimeSocket = null;
        this.storage = null;
        
        // Tournament timers and intervals
        this.updateInterval = null;
        this.activePolling = new Set();
        
        // Performance tracking
        this.metrics = {
            scoresSubmitted: 0,
            leaderboardRequests: 0,
            realtimeUpdates: 0,
            averageLatency: 0
        };
        
        // Initialize system
        this.initialize();
    }

    /**
     * Initialize the leaderboard system
     */
    async initialize() {
        try {
            console.log('🏆 Initializing UnifiedLeaderboard system...');
            
            // Load real-time components if enabled
            if (this.config.enableRealtime) {
                await this.initializeRealtime();
            }
            
            // Initialize storage layer
            await this.initializeStorage();
            
            // Start periodic updates
            this.startPeriodicUpdates();
            
            this.emit('initialized', { config: this.config });
            console.log('✅ UnifiedLeaderboard system initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize UnifiedLeaderboard:', error);
            this.emit('error', { type: 'initialization', error });
        }
    }

    /**
     * Initialize real-time WebSocket components
     */
    async initializeRealtime() {
        try {
            // Dynamically import LeaderboardSocket to avoid circular dependencies
            const { LeaderboardSocket } = await import('../realtime/LeaderboardSocket.js');
            this.realtimeSocket = new LeaderboardSocket({
                leaderboard: this,
                ...this.config.realtime
            });
            
            // Set up real-time event handlers
            this.realtimeSocket.on('scoreUpdate', this.handleRealtimeScoreUpdate.bind(this));
            this.realtimeSocket.on('rankingChange', this.handleRankingChange.bind(this));
            this.realtimeSocket.on('tournamentUpdate', this.handleTournamentUpdate.bind(this));
            
        } catch (error) {
            console.warn('⚠️ Real-time components not available, falling back to polling:', error);
            this.config.enableRealtime = false;
        }
    }

    /**
     * Initialize storage layer
     */
    async initializeStorage() {
        try {
            // For now, use a simple in-memory storage with localStorage backup
            this.storage = new LeaderboardStorage({
                useLocalStorage: true,
                prefix: 'blockzone_leaderboard_'
            });
            
        } catch (error) {
            console.warn('⚠️ Storage layer initialization failed, using memory-only:', error);
            this.storage = new Map(); // Fallback to simple Map
        }
    }

    /**
     * Add a score to the leaderboard
     * @param {string} gameId - Game identifier
     * @param {string} playerId - Player identifier
     * @param {number} score - Score value
     * @param {Object} metadata - Additional game metadata
     * @returns {Promise<Object>} Result with verification status and rank
     */
    async addScore(gameId, playerId, score, metadata = {}) {
        const startTime = performance.now();
        
        try {
            console.log(`🏆 Adding score: ${gameId}/${playerId} = ${score}`);
            
            // Validate score input
            const validation = this.validateScore(gameId, score, metadata);
            if (!validation.valid) {
                throw new Error(`Score validation failed: ${validation.reason}`);
            }

            // Generate replay hash for anti-cheat
            const replayHash = this.generateReplayHash(score, metadata);
            
            // Check for duplicates
            if (await this.isDuplicateSubmission(replayHash)) {
                throw new Error('Duplicate score submission detected');
            }

            // Submit to backend
            const result = await this.submitScoreToBackend({
                gameId,
                playerId,
                score,
                metadata,
                replayHash,
                timestamp: Date.now()
            });

            // Update local cache
            await this.updateLocalLeaderboard(gameId, playerId, score, result.rank);
            
            // Broadcast real-time update
            if (this.config.enableRealtime && this.realtimeSocket) {
                this.realtimeSocket.broadcastScoreUpdate(gameId, {
                    playerId,
                    score,
                    rank: result.rank,
                    isNewHighScore: result.isNewHighScore
                });
            }

            // Update metrics
            this.metrics.scoresSubmitted++;
            this.metrics.averageLatency = (this.metrics.averageLatency + (performance.now() - startTime)) / 2;
            
            // Emit events
            this.emit('scoreSubmitted', {
                gameId,
                playerId,
                score,
                rank: result.rank,
                isNewHighScore: result.isNewHighScore
            });

            return result;
            
        } catch (error) {
            console.error('❌ Failed to add score:', error);
            this.emit('error', { type: 'scoreSubmission', error, gameId, playerId });
            throw error;
        }
    }

    /**
     * Get tournament leaderboard
     * @param {string} tournamentId - Tournament identifier
     * @param {number} limit - Maximum number of entries
     * @returns {Promise<Array>} Leaderboard entries
     */
    async getTournamentLeaderboard(tournamentId, limit = 100) {
        try {
            const startTime = performance.now();
            
            // Check cache first
            const cacheKey = `leaderboard:${tournamentId}:${limit}`;
            let leaderboard = this.leaderboards.get(cacheKey);
            
            if (!leaderboard || this.isCacheExpired(cacheKey)) {
                // Fetch from backend
                leaderboard = await this.fetchLeaderboardFromBackend(tournamentId, limit);
                
                // Cache with timestamp
                this.leaderboards.set(cacheKey, {
                    data: leaderboard,
                    timestamp: Date.now(),
                    ttl: 30000 // 30 seconds cache
                });
            } else {
                leaderboard = leaderboard.data;
            }

            // Update metrics
            this.metrics.leaderboardRequests++;
            const latency = performance.now() - startTime;
            this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;

            return leaderboard;
            
        } catch (error) {
            console.error('❌ Failed to get tournament leaderboard:', error);
            this.emit('error', { type: 'leaderboardFetch', error, tournamentId });
            return [];
        }
    }

    /**
     * Get player rank in tournament
     * @param {string} playerId - Player identifier
     * @param {string} tournamentId - Tournament identifier
     * @returns {Promise<number>} Player rank (1-based)
     */
    async getPlayerRank(playerId, tournamentId) {
        try {
            const leaderboard = await this.getTournamentLeaderboard(tournamentId, 1000);
            const playerEntry = leaderboard.find(entry => entry.playerId === playerId);
            return playerEntry ? playerEntry.rank : null;
            
        } catch (error) {
            console.error('❌ Failed to get player rank:', error);
            return null;
        }
    }

    /**
     * Create a new tournament
     * @param {Object} config - Tournament configuration
     * @returns {Promise<Object>} Tournament details
     */
    async createTournament(config) {
        try {
            const tournament = {
                id: config.id || this.generateTournamentId(),
                gameId: config.gameId,
                type: config.type || 'daily',
                name: config.name,
                description: config.description,
                prizePool: config.prizePool || 0,
                entryFee: config.entryFee || 0,
                maxParticipants: config.maxParticipants || 1000,
                startTime: config.startTime || Date.now(),
                endTime: config.endTime || (Date.now() + (24 * 60 * 60 * 1000)), // 24 hours
                status: 'active',
                participants: 0,
                created: Date.now()
            };

            // Store tournament
            this.tournaments.set(tournament.id, tournament);
            
            // Start tournament monitoring
            this.startTournamentMonitoring(tournament.id);
            
            this.emit('tournamentCreated', tournament);
            console.log(`🏆 Tournament created: ${tournament.id} (${tournament.name})`);
            
            return tournament;
            
        } catch (error) {
            console.error('❌ Failed to create tournament:', error);
            throw error;
        }
    }

    /**
     * Update real-time data
     * @param {Object} data - Update data
     */
    async updateRealtime(data) {
        try {
            if (!this.config.enableRealtime || !this.realtimeSocket) {
                console.warn('⚠️ Real-time updates not available');
                return;
            }

            this.realtimeSocket.broadcast(data);
            this.metrics.realtimeUpdates++;
            
        } catch (error) {
            console.error('❌ Failed to send real-time update:', error);
        }
    }

    /**
     * Subscribe to tournament updates
     * @param {string} tournamentId - Tournament identifier
     * @param {Function} callback - Update callback
     */
    subscribe(tournamentId, callback) {
        if (!this.subscriptions.has(tournamentId)) {
            this.subscriptions.set(tournamentId, new Set());
        }
        
        this.subscriptions.get(tournamentId).add(callback);
        
        // Set up real-time subscription if available
        if (this.config.enableRealtime && this.realtimeSocket) {
            this.realtimeSocket.subscribe(tournamentId, callback);
        }
    }

    /**
     * Unsubscribe from tournament updates
     * @param {string} tournamentId - Tournament identifier
     * @param {Function} callback - Update callback
     */
    unsubscribe(tournamentId, callback) {
        const callbacks = this.subscriptions.get(tournamentId);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.subscriptions.delete(tournamentId);
            }
        }
        
        // Remove real-time subscription if available
        if (this.config.enableRealtime && this.realtimeSocket) {
            this.realtimeSocket.unsubscribe(tournamentId, callback);
        }
    }

    // ========================
    // INTERNAL METHODS
    // ========================

    /**
     * Validate score submission
     */
    validateScore(gameId, score, metadata) {
        // Basic validation
        if (typeof score !== 'number' || score < 0) {
            return { valid: false, reason: 'Invalid score value' };
        }

        if (score > 1000000) {
            return { valid: false, reason: 'Score too high' };
        }

        // Game-specific validation could be added here
        switch (gameId) {
            case 'neon_drop':
                // Neon Drop specific validation
                if (metadata.duration && metadata.duration < 10000) {
                    return { valid: false, reason: 'Game duration too short' };
                }
                break;
        }

        return { valid: true };
    }

    /**
     * Generate replay hash for anti-cheat
     */
    generateReplayHash(score, metadata) {
        const data = `${score}-${metadata?.duration || 0}-${Date.now()}-${Math.random()}`;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Check for duplicate submissions
     */
    async isDuplicateSubmission(replayHash) {
        try {
            // Check with backend
            const response = await fetch(`${this.config.apiBase}/scores/check/${replayHash}`);
            const result = await response.json();
            return result.exists;
        } catch (error) {
            console.warn('⚠️ Could not check for duplicates, allowing submission:', error);
            return false;
        }
    }

    /**
     * Submit score to backend
     */
    async submitScoreToBackend(scoreData) {
        const response = await fetch(`${this.config.apiBase}/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                score: scoreData.score,
                metrics: scoreData.metadata,
                player_id: scoreData.playerId,
                game_id: scoreData.gameId,
                timestamp: scoreData.timestamp,
                replay_hash: scoreData.replayHash
            })
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Fetch leaderboard from backend
     */
    async fetchLeaderboardFromBackend(tournamentId, limit) {
        const response = await fetch(
            `${this.config.apiBase}/leaderboard?tournament=${tournamentId}&limit=${limit}`
        );
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }
        
        const result = await response.json();
        return result.scores || [];
    }

    /**
     * Update local leaderboard cache
     */
    async updateLocalLeaderboard(gameId, playerId, score, rank) {
        // Update player entry
        this.players.set(playerId, {
            playerId,
            gameId,
            score,
            rank,
            lastUpdate: Date.now()
        });

        // Invalidate relevant caches
        for (const [key] of this.leaderboards) {
            if (key.includes(gameId)) {
                this.leaderboards.delete(key);
            }
        }
    }

    /**
     * Check if cache is expired
     */
    isCacheExpired(cacheKey) {
        const cache = this.leaderboards.get(cacheKey);
        if (!cache) return true;
        
        return (Date.now() - cache.timestamp) > cache.ttl;
    }

    /**
     * Generate unique tournament ID
     */
    generateTournamentId() {
        return `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Start periodic updates for real-time data
     */
    startPeriodicUpdates() {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(() => {
            this.refreshActiveData();
        }, this.config.updateInterval);
        
        console.log(`🔄 Started periodic updates (${this.config.updateInterval}ms)`);
    }

    /**
     * Stop periodic updates
     */
    stopPeriodicUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏹️ Stopped periodic updates');
        }
    }

    /**
     * Refresh active tournament data
     */
    async refreshActiveData() {
        try {
            // Refresh active tournaments
            for (const [tournamentId, tournament] of this.tournaments) {
                if (tournament.status === 'active') {
                    await this.refreshTournamentStatus(tournamentId);
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to refresh active data:', error);
        }
    }

    /**
     * Refresh tournament status
     */
    async refreshTournamentStatus(tournamentId) {
        try {
            const tournament = this.tournaments.get(tournamentId);
            if (!tournament) return;

            // Calculate time remaining
            const timeLeft = tournament.endTime - Date.now();
            if (timeLeft <= 0) {
                tournament.status = 'ended';
                this.emit('tournamentEnded', tournament);
                return;
            }

            // Update time remaining
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            tournament.timeRemaining = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Emit status update
            this.emit('statusUpdate', tournament);
            
            // Notify subscribers
            const callbacks = this.subscriptions.get(tournamentId);
            if (callbacks) {
                callbacks.forEach(callback => {
                    try {
                        callback({ type: 'statusUpdate', tournament });
                    } catch (error) {
                        console.error('❌ Subscriber callback error:', error);
                    }
                });
            }
            
        } catch (error) {
            console.error(`❌ Failed to refresh tournament ${tournamentId}:`, error);
        }
    }

    /**
     * Start monitoring tournament
     */
    startTournamentMonitoring(tournamentId) {
        if (!this.activePolling.has(tournamentId)) {
            this.activePolling.add(tournamentId);
            console.log(`🔍 Started monitoring tournament: ${tournamentId}`);
        }
    }

    /**
     * Handle real-time score updates
     */
    handleRealtimeScoreUpdate(data) {
        this.emit('realtimeScoreUpdate', data);
        
        // Update local cache
        this.updateLocalLeaderboard(data.gameId, data.playerId, data.score, data.rank);
        
        // Notify subscribers
        const callbacks = this.subscriptions.get(data.tournamentId);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback({ type: 'scoreUpdate', data });
                } catch (error) {
                    console.error('❌ Real-time callback error:', error);
                }
            });
        }
    }

    /**
     * Handle ranking changes
     */
    handleRankingChange(data) {
        this.emit('rankingChange', data);
    }

    /**
     * Handle tournament updates
     */
    handleTournamentUpdate(data) {
        this.emit('tournamentUpdate', data);
    }

    /**
     * Get system metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeTournaments: this.tournaments.size,
            cachedPlayers: this.players.size,
            cachedLeaderboards: this.leaderboards.size,
            activeSubscriptions: this.subscriptions.size,
            uptime: Date.now() - (this.initTime || Date.now())
        };
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        console.log('🧹 Destroying UnifiedLeaderboard system...');
        
        // Stop all timers
        this.stopPeriodicUpdates();
        
        // Clear all caches
        this.tournaments.clear();
        this.players.clear();
        this.leaderboards.clear();
        this.subscriptions.clear();
        this.activePolling.clear();
        
        // Cleanup real-time connection
        if (this.realtimeSocket) {
            this.realtimeSocket.destroy();
            this.realtimeSocket = null;
        }
        
        // Remove all event listeners
        this.removeAllListeners();
        
        console.log('✅ UnifiedLeaderboard system destroyed');
    }
}

/**
 * Simple in-memory storage with localStorage backup
 */
class LeaderboardStorage {
    constructor(config = {}) {
        this.config = config;
        this.cache = new Map();
        this.useLocalStorage = config.useLocalStorage && typeof localStorage !== 'undefined';
        this.prefix = config.prefix || 'leaderboard_';
    }

    async get(key) {
        // Try cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        // Try localStorage
        if (this.useLocalStorage) {
            try {
                const stored = localStorage.getItem(this.prefix + key);
                if (stored) {
                    const data = JSON.parse(stored);
                    this.cache.set(key, data);
                    return data;
                }
            } catch (error) {
                console.warn('⚠️ Failed to read from localStorage:', error);
            }
        }

        return null;
    }

    async set(key, value) {
        // Update cache
        this.cache.set(key, value);

        // Update localStorage
        if (this.useLocalStorage) {
            try {
                localStorage.setItem(this.prefix + key, JSON.stringify(value));
            } catch (error) {
                console.warn('⚠️ Failed to write to localStorage:', error);
            }
        }
    }

    async delete(key) {
        this.cache.delete(key);

        if (this.useLocalStorage) {
            try {
                localStorage.removeItem(this.prefix + key);
            } catch (error) {
                console.warn('⚠️ Failed to delete from localStorage:', error);
            }
        }
    }

    clear() {
        this.cache.clear();

        if (this.useLocalStorage) {
            try {
                const keys = Object.keys(localStorage);
                for (const key of keys) {
                    if (key.startsWith(this.prefix)) {
                        localStorage.removeItem(key);
                    }
                }
            } catch (error) {
                console.warn('⚠️ Failed to clear localStorage:', error);
            }
        }
    }
}

// Default export for compatibility
export default UnifiedLeaderboard;
