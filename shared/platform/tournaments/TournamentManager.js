/**
 * TournamentManager.js - Tournament Lifecycle Management
 * 
 * PHASE 2: TOURNAMENT MANAGEMENT CONSOLIDATION
 * 
 * Migrates and enhances functionality from:
 * - shared/tournaments/daily-tournament.js (tournament logic)
 * 
 * Features:
 * - Daily/weekly/seasonal tournament support
 * - Automated tournament creation and management
 * - Prize distribution system
 * - Tournament scheduling and lifecycle
 * - Real-time tournament status updates
 * - Anti-cheat integration
 */

import { EventEmitter } from '../../utils/EventEmitter.js';

export class TournamentManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            apiBase: config.apiBase || 'https://blockzone-api.hambomyers.workers.dev/api',
            defaultPrizePool: config.defaultPrizePool || 100,
            prizeDistribution: config.prizeDistribution || [0.5, 0.3, 0.2], // Top 3 split
            maxParticipants: config.maxParticipants || 1000,
            enableAutoCreate: config.enableAutoCreate !== false,
            enablePrizeDistribution: config.enablePrizeDistribution !== false,
            timezone: config.timezone || 'UTC',
            ...config
        };

        // Tournament state management
        this.activeTournaments = new Map();
        this.tournamentHistory = new Map();
        this.scheduledTournaments = new Map();
        
        // Scheduling system
        this.scheduler = new TournamentScheduler(this);
        this.timers = new Map();
        
        // Prize pool tracking
        this.prizePools = new Map();
        this.pendingDistributions = new Map();
        
        // Performance metrics
        this.metrics = {
            tournamentsCreated: 0,
            tournamentsCompleted: 0,
            totalPrizesDistributed: 0,
            averageParticipants: 0
        };
        
        // Initialize system
        this.initialize();
    }

    /**
     * Initialize tournament manager
     */
    async initialize() {
        try {
            console.log('🏆 Initializing TournamentManager...');
            
            // Load active tournaments from storage
            await this.loadActiveTournaments();
            
            // Start scheduler if auto-create is enabled
            if (this.config.enableAutoCreate) {
                this.scheduler.start();
            }
            
            // Set up periodic maintenance
            this.startPeriodicMaintenance();
            
            this.emit('initialized');
            console.log('✅ TournamentManager initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize TournamentManager:', error);
            this.emit('error', { type: 'initialization', error });
        }
    }

    /**
     * Create a new tournament
     * @param {Object} config - Tournament configuration
     * @returns {Promise<Object>} Created tournament
     */
    async createTournament(config) {
        try {
            const tournament = {
                id: config.id || this.generateTournamentId(config.type),
                type: config.type || 'daily',
                gameId: config.gameId || 'neon_drop',
                name: config.name || this.generateTournamentName(config.type),
                description: config.description || '',
                
                // Timing
                startTime: config.startTime || Date.now(),
                endTime: config.endTime || this.calculateEndTime(config.type, config.startTime),
                duration: config.duration || this.getDefaultDuration(config.type),
                
                // Entry and prizes
                entryFee: config.entryFee || 0,
                prizePool: config.prizePool || this.config.defaultPrizePool,
                maxParticipants: config.maxParticipants || this.config.maxParticipants,
                
                // Distribution
                prizeDistribution: config.prizeDistribution || this.config.prizeDistribution,
                
                // State
                status: 'scheduled',
                participants: 0,
                participantIds: new Set(),
                scores: [],
                
                // Metadata
                created: Date.now(),
                createdBy: config.createdBy || 'system',
                version: '2.0'
            };

            // Validate tournament configuration
            this.validateTournamentConfig(tournament);
            
            // Store tournament
            this.activeTournaments.set(tournament.id, tournament);
            
            // Schedule tournament start if needed
            if (tournament.status === 'scheduled' && tournament.startTime > Date.now()) {
                this.scheduleTournamentStart(tournament);
            } else if (tournament.startTime <= Date.now()) {
                // Start immediately
                await this.startTournament(tournament.id);
            }
            
            // Update metrics
            this.metrics.tournamentsCreated++;
            
            this.emit('tournamentCreated', tournament);
            console.log(`🏆 Tournament created: ${tournament.id} (${tournament.name})`);
            
            return tournament;
            
        } catch (error) {
            console.error('❌ Failed to create tournament:', error);
            throw error;
        }
    }

    /**
     * Start a tournament
     * @param {string} tournamentId - Tournament identifier
     */
    async startTournament(tournamentId) {
        try {
            const tournament = this.activeTournaments.get(tournamentId);
            if (!tournament) {
                throw new Error(`Tournament not found: ${tournamentId}`);
            }
            
            if (tournament.status !== 'scheduled') {
                throw new Error(`Tournament cannot be started: ${tournament.status}`);
            }
            
            console.log(`🚀 Starting tournament: ${tournamentId}`);
            
            // Update tournament status
            tournament.status = 'active';
            tournament.actualStartTime = Date.now();
            
            // Schedule tournament end
            this.scheduleTournamentEnd(tournament);
            
            // Start periodic status updates
            this.startTournamentMonitoring(tournament);
            
            this.emit('tournamentStarted', tournament);
            console.log(`✅ Tournament started: ${tournament.name}`);
            
        } catch (error) {
            console.error(`❌ Failed to start tournament ${tournamentId}:`, error);
            this.emit('error', { type: 'tournamentStart', tournamentId, error });
        }
    }

    /**
     * End a tournament
     * @param {string} tournamentId - Tournament identifier
     */
    async endTournament(tournamentId) {
        try {
            const tournament = this.activeTournaments.get(tournamentId);
            if (!tournament) {
                throw new Error(`Tournament not found: ${tournamentId}`);
            }
            
            if (tournament.status !== 'active') {
                console.warn(`⚠️ Tournament not active, current status: ${tournament.status}`);
            }
            
            console.log(`🏁 Ending tournament: ${tournamentId}`);
            
            // Update tournament status
            tournament.status = 'ended';
            tournament.actualEndTime = Date.now();
            
            // Stop monitoring
            this.stopTournamentMonitoring(tournamentId);
            
            // Calculate final rankings
            const finalRankings = await this.calculateFinalRankings(tournament);
            tournament.finalRankings = finalRankings;
            
            // Distribute prizes if enabled
            if (this.config.enablePrizeDistribution && tournament.prizePool > 0) {
                await this.distributePrizes(tournamentId);
            }
            
            // Move to history
            this.tournamentHistory.set(tournamentId, tournament);
            this.activeTournaments.delete(tournamentId);
            
            // Update metrics
            this.metrics.tournamentsCompleted++;
            this.metrics.averageParticipants = (
                (this.metrics.averageParticipants * (this.metrics.tournamentsCompleted - 1) + tournament.participants) /
                this.metrics.tournamentsCompleted
            );
            
            this.emit('tournamentEnded', tournament);
            console.log(`✅ Tournament ended: ${tournament.name} (${tournament.participants} participants)`);
            
            return tournament;
            
        } catch (error) {
            console.error(`❌ Failed to end tournament ${tournamentId}:`, error);
            this.emit('error', { type: 'tournamentEnd', tournamentId, error });
            throw error;
        }
    }

    /**
     * Join a tournament
     * @param {string} tournamentId - Tournament identifier
     * @param {string} playerId - Player identifier
     * @param {number} entryFee - Entry fee amount
     * @returns {Promise<Object>} Join result
     */
    async joinTournament(tournamentId, playerId, entryFee = null) {
        try {
            const tournament = this.activeTournaments.get(tournamentId);
            if (!tournament) {
                throw new Error(`Tournament not found: ${tournamentId}`);
            }
            
            if (tournament.status !== 'active' && tournament.status !== 'scheduled') {
                throw new Error(`Tournament not available for joining: ${tournament.status}`);
            }
            
            if (tournament.participantIds.has(playerId)) {
                throw new Error('Player already joined this tournament');
            }
            
            if (tournament.participants >= tournament.maxParticipants) {
                throw new Error('Tournament is full');
            }
            
            // Validate entry fee
            const requiredFee = tournament.entryFee;
            if (requiredFee > 0 && (entryFee === null || entryFee < requiredFee)) {
                throw new Error(`Entry fee required: $${requiredFee}`);
            }
            
            console.log(`🎫 Player ${playerId} joining tournament ${tournamentId}`);
            
            // Add player to tournament
            tournament.participantIds.add(playerId);
            tournament.participants++;
            
            // Update prize pool with entry fee
            if (entryFee && entryFee > 0) {
                const prizeContribution = entryFee * 0.9; // 90% goes to prize pool
                tournament.prizePool += prizeContribution;
                
                // Track prize pool
                if (!this.prizePools.has(tournamentId)) {
                    this.prizePools.set(tournamentId, 0);
                }
                this.prizePools.set(tournamentId, this.prizePools.get(tournamentId) + prizeContribution);
            }
            
            const result = {
                success: true,
                tournamentId,
                playerId,
                entryFee: entryFee || 0,
                prizePool: tournament.prizePool,
                participants: tournament.participants,
                timeRemaining: this.calculateTimeRemaining(tournament)
            };
            
            this.emit('playerJoined', { tournament, playerId, entryFee });
            
            return result;
            
        } catch (error) {
            console.error(`❌ Failed to join tournament ${tournamentId}:`, error);
            throw error;
        }
    }

    /**
     * Submit score to tournament
     * @param {string} tournamentId - Tournament identifier
     * @param {string} playerId - Player identifier
     * @param {number} score - Player score
     * @param {Object} metadata - Additional score metadata
     * @returns {Promise<Object>} Submission result
     */
    async submitScore(tournamentId, playerId, score, metadata = {}) {
        try {
            const tournament = this.activeTournaments.get(tournamentId);
            if (!tournament) {
                throw new Error(`Tournament not found: ${tournamentId}`);
            }
            
            if (tournament.status !== 'active') {
                throw new Error(`Tournament not active: ${tournament.status}`);
            }
            
            if (!tournament.participantIds.has(playerId)) {
                throw new Error('Player not registered for this tournament');
            }
            
            // Validate score
            if (typeof score !== 'number' || score < 0) {
                throw new Error('Invalid score value');
            }
            
            // Create score entry
            const scoreEntry = {
                tournamentId,
                playerId,
                score,
                metadata,
                timestamp: Date.now(),
                replayHash: this.generateReplayHash(score, metadata)
            };
            
            // Check for existing score and update if better
            const existingScoreIndex = tournament.scores.findIndex(s => s.playerId === playerId);
            if (existingScoreIndex >= 0) {
                const existingScore = tournament.scores[existingScoreIndex];
                if (score > existingScore.score) {
                    tournament.scores[existingScoreIndex] = scoreEntry;
                    console.log(`📈 Updated score for ${playerId}: ${existingScore.score} → ${score}`);
                } else {
                    console.log(`📊 Score not better for ${playerId}: ${score} (current: ${existingScore.score})`);
                    return {
                        verified: true,
                        rank: this.calculatePlayerRank(tournament, playerId),
                        score: existingScore.score,
                        isNewHighScore: false
                    };
                }
            } else {
                tournament.scores.push(scoreEntry);
            }
            
            // Calculate current rank
            const rank = this.calculatePlayerRank(tournament, playerId);
            
            const result = {
                verified: true,
                rank,
                score,
                isNewHighScore: existingScoreIndex >= 0 ? score > tournament.scores[existingScoreIndex]?.score : true,
                totalParticipants: tournament.participants
            };
            
            this.emit('scoreSubmitted', {
                tournament,
                playerId,
                score,
                rank,
                metadata
            });
            
            return result;
            
        } catch (error) {
            console.error(`❌ Failed to submit score to tournament ${tournamentId}:`, error);
            throw error;
        }
    }

    /**
     * Get tournament leaderboard
     * @param {string} tournamentId - Tournament identifier
     * @param {number} limit - Number of entries to return
     * @returns {Promise<Array>} Leaderboard entries
     */
    async getTournamentLeaderboard(tournamentId, limit = 100) {
        try {
            const tournament = this.activeTournaments.get(tournamentId) || this.tournamentHistory.get(tournamentId);
            if (!tournament) {
                throw new Error(`Tournament not found: ${tournamentId}`);
            }
            
            // Sort scores by score descending
            const sortedScores = [...tournament.scores]
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
            
            // Add rank to each entry
            return sortedScores.map((score, index) => ({
                ...score,
                rank: index + 1
            }));
            
        } catch (error) {
            console.error(`❌ Failed to get tournament leaderboard ${tournamentId}:`, error);
            return [];
        }
    }

    /**
     * Distribute prizes to tournament winners
     * @param {string} tournamentId - Tournament identifier
     */
    async distributePrizes(tournamentId) {
        try {
            const tournament = this.tournamentHistory.get(tournamentId) || this.activeTournaments.get(tournamentId);
            if (!tournament) {
                throw new Error(`Tournament not found: ${tournamentId}`);
            }
            
            if (tournament.prizePool <= 0) {
                console.log(`💰 No prize pool for tournament ${tournamentId}`);
                return;
            }
            
            console.log(`💰 Distributing prizes for tournament ${tournamentId} (Pool: $${tournament.prizePool})`);
            
            // Get top players based on final rankings
            const winners = tournament.finalRankings || await this.calculateFinalRankings(tournament);
            const prizeDistribution = tournament.prizeDistribution;
            const totalPrizePool = tournament.prizePool;
            
            const distributions = [];
            
            for (let i = 0; i < Math.min(winners.length, prizeDistribution.length); i++) {
                const winner = winners[i];
                const prizeAmount = totalPrizePool * prizeDistribution[i];
                
                if (prizeAmount > 0) {
                    distributions.push({
                        playerId: winner.playerId,
                        rank: i + 1,
                        prizeAmount,
                        tournamentId
                    });
                    
                    console.log(`🏆 Prize ${i + 1}: ${winner.playerId} - $${prizeAmount.toFixed(2)}`);
                }
            }
            
            // Process prize distributions
            for (const distribution of distributions) {
                await this.processPrizeDistribution(distribution);
            }
            
            // Track total distributed
            const totalDistributed = distributions.reduce((sum, d) => sum + d.prizeAmount, 0);
            this.metrics.totalPrizesDistributed += totalDistributed;
            
            // Store distribution record
            this.pendingDistributions.set(tournamentId, {
                tournamentId,
                distributions,
                totalAmount: totalDistributed,
                processedAt: Date.now()
            });
            
            this.emit('prizesDistributed', {
                tournamentId,
                distributions,
                totalAmount: totalDistributed
            });
            
            console.log(`✅ Prizes distributed for ${tournamentId}: $${totalDistributed.toFixed(2)}`);
            
        } catch (error) {
            console.error(`❌ Failed to distribute prizes for tournament ${tournamentId}:`, error);
            this.emit('error', { type: 'prizeDistribution', tournamentId, error });
        }
    }

    /**
     * Schedule recurring tournaments
     */
    async scheduleRecurringTournaments() {
        try {
            console.log('📅 Scheduling recurring tournaments...');
            
            // Schedule daily tournaments
            await this.createTournament({
                type: 'daily',
                name: 'Daily Neon Drop Championship',
                gameId: 'neon_drop',
                entryFee: 5,
                prizePool: 100
            });
            
            // Schedule weekly tournaments (on Sundays)
            const now = new Date();
            const nextSunday = new Date(now);
            nextSunday.setDate(now.getDate() + (7 - now.getDay()));
            nextSunday.setHours(20, 0, 0, 0); // 8 PM
            
            await this.createTournament({
                type: 'weekly',
                name: 'Weekly Championship',
                gameId: 'neon_drop',
                startTime: nextSunday.getTime(),
                entryFee: 20,
                prizePool: 500
            });
            
            console.log('✅ Recurring tournaments scheduled');
            
        } catch (error) {
            console.error('❌ Failed to schedule recurring tournaments:', error);
        }
    }

    // ========================
    // INTERNAL METHODS
    // ========================

    /**
     * Load active tournaments from storage
     */
    async loadActiveTournaments() {
        try {
            // In a real implementation, this would load from a database
            // For now, we'll just initialize with empty state
            console.log('📚 Loading active tournaments from storage...');
            
            // Check for any tournaments that should have ended
            for (const [id, tournament] of this.activeTournaments) {
                if (tournament.status === 'active' && Date.now() > tournament.endTime) {
                    await this.endTournament(id);
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to load active tournaments:', error);
        }
    }

    /**
     * Generate tournament ID
     */
    generateTournamentId(type = 'tournament') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 6);
        return `${type}_${timestamp}_${random}`;
    }

    /**
     * Generate tournament name
     */
    generateTournamentName(type) {
        const names = {
            daily: 'Daily Championship',
            weekly: 'Weekly Tournament',
            monthly: 'Monthly Championship',
            seasonal: 'Seasonal Competition'
        };
        
        const baseName = names[type] || 'Tournament';
        const date = new Date().toLocaleDateString();
        return `${baseName} - ${date}`;
    }

    /**
     * Calculate tournament end time
     */
    calculateEndTime(type, startTime = Date.now()) {
        const durations = {
            daily: 24 * 60 * 60 * 1000,   // 24 hours
            weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
            monthly: 30 * 24 * 60 * 60 * 1000, // 30 days
            seasonal: 90 * 24 * 60 * 60 * 1000  // 90 days
        };
        
        return startTime + (durations[type] || durations.daily);
    }

    /**
     * Get default tournament duration
     */
    getDefaultDuration(type) {
        const durations = {
            daily: 24 * 60 * 60 * 1000,
            weekly: 7 * 24 * 60 * 60 * 1000,
            monthly: 30 * 24 * 60 * 60 * 1000,
            seasonal: 90 * 24 * 60 * 60 * 1000
        };
        
        return durations[type] || durations.daily;
    }

    /**
     * Validate tournament configuration
     */
    validateTournamentConfig(tournament) {
        if (!tournament.id || !tournament.type || !tournament.gameId) {
            throw new Error('Tournament must have id, type, and gameId');
        }
        
        if (tournament.startTime >= tournament.endTime) {
            throw new Error('Tournament end time must be after start time');
        }
        
        if (tournament.maxParticipants < 1) {
            throw new Error('Tournament must allow at least 1 participant');
        }
        
        if (tournament.entryFee < 0 || tournament.prizePool < 0) {
            throw new Error('Entry fee and prize pool must be non-negative');
        }
    }

    /**
     * Schedule tournament start
     */
    scheduleTournamentStart(tournament) {
        const delay = tournament.startTime - Date.now();
        if (delay > 0) {
            const timerId = setTimeout(() => {
                this.startTournament(tournament.id);
            }, delay);
            
            this.timers.set(`start_${tournament.id}`, timerId);
            console.log(`⏰ Tournament ${tournament.id} scheduled to start in ${Math.round(delay / 1000)}s`);
        }
    }

    /**
     * Schedule tournament end
     */
    scheduleTournamentEnd(tournament) {
        const delay = tournament.endTime - Date.now();
        if (delay > 0) {
            const timerId = setTimeout(() => {
                this.endTournament(tournament.id);
            }, delay);
            
            this.timers.set(`end_${tournament.id}`, timerId);
            console.log(`⏰ Tournament ${tournament.id} scheduled to end in ${Math.round(delay / 1000)}s`);
        }
    }

    /**
     * Start tournament monitoring
     */
    startTournamentMonitoring(tournament) {
        const intervalId = setInterval(() => {
            this.updateTournamentStatus(tournament);
        }, 1000); // Update every second
        
        this.timers.set(`monitor_${tournament.id}`, intervalId);
    }

    /**
     * Stop tournament monitoring
     */
    stopTournamentMonitoring(tournamentId) {
        const intervalId = this.timers.get(`monitor_${tournamentId}`);
        if (intervalId) {
            clearInterval(intervalId);
            this.timers.delete(`monitor_${tournamentId}`);
        }
    }

    /**
     * Update tournament status
     */
    updateTournamentStatus(tournament) {
        const timeRemaining = this.calculateTimeRemaining(tournament);
        tournament.timeRemaining = timeRemaining;
        
        this.emit('statusUpdate', tournament);
    }

    /**
     * Calculate time remaining
     */
    calculateTimeRemaining(tournament) {
        const now = Date.now();
        const endTime = tournament.endTime;
        
        if (now >= endTime) {
            return '00:00:00';
        }
        
        const timeLeft = endTime - now;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Calculate player rank in tournament
     */
    calculatePlayerRank(tournament, playerId) {
        const sortedScores = [...tournament.scores].sort((a, b) => b.score - a.score);
        const playerIndex = sortedScores.findIndex(s => s.playerId === playerId);
        return playerIndex >= 0 ? playerIndex + 1 : null;
    }

    /**
     * Calculate final tournament rankings
     */
    async calculateFinalRankings(tournament) {
        const sortedScores = [...tournament.scores].sort((a, b) => b.score - a.score);
        return sortedScores.map((score, index) => ({
            ...score,
            rank: index + 1
        }));
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
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Process individual prize distribution
     */
    async processPrizeDistribution(distribution) {
        try {
            // In a real implementation, this would integrate with payment systems
            // For now, just log and emit event
            console.log(`💳 Processing prize: ${distribution.playerId} - $${distribution.prizeAmount}`);
            
            this.emit('prizeProcessed', distribution);
            
        } catch (error) {
            console.error('❌ Failed to process prize distribution:', error);
            throw error;
        }
    }

    /**
     * Start periodic maintenance
     */
    startPeriodicMaintenance() {
        // Clean up old timers and completed tournaments every hour
        setInterval(() => {
            this.performMaintenance();
        }, 60 * 60 * 1000); // 1 hour
    }

    /**
     * Perform maintenance tasks
     */
    performMaintenance() {
        console.log('🧹 Performing tournament maintenance...');
        
        // Clean up expired timers
        for (const [key, timerId] of this.timers) {
            if (typeof timerId === 'number') {
                // Check if timer is still valid (this is a simplified check)
                const [action, tournamentId] = key.split('_');
                const tournament = this.activeTournaments.get(tournamentId);
                
                if (!tournament || tournament.status === 'ended') {
                    clearTimeout(timerId);
                    this.timers.delete(key);
                }
            }
        }
        
        // Archive old completed tournaments
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        for (const [id, tournament] of this.tournamentHistory) {
            if (tournament.actualEndTime && tournament.actualEndTime < oneWeekAgo) {
                this.tournamentHistory.delete(id);
            }
        }
        
        console.log('✅ Tournament maintenance completed');
    }

    /**
     * Get tournament manager metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeTournaments: this.activeTournaments.size,
            historicalTournaments: this.tournamentHistory.size,
            scheduledTimers: this.timers.size,
            pendingDistributions: this.pendingDistributions.size
        };
    }

    /**
     * Get tournament info
     * @param {string} tournamentId - Tournament identifier
     * @returns {Object} Tournament info
     */
    getTournamentInfo(tournamentId) {
        const tournament = this.activeTournaments.get(tournamentId) || this.tournamentHistory.get(tournamentId);
        if (!tournament) {
            return null;
        }
        
        return {
            id: tournament.id,
            name: tournament.name,
            type: tournament.type,
            status: tournament.status,
            participants: tournament.participants,
            prizePool: tournament.prizePool,
            timeRemaining: tournament.timeRemaining || this.calculateTimeRemaining(tournament),
            startTime: tournament.startTime,
            endTime: tournament.endTime
        };
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        console.log('🧹 Destroying TournamentManager...');
        
        // Clear all timers
        for (const [key, timerId] of this.timers) {
            if (typeof timerId === 'number') {
                clearTimeout(timerId);
            } else {
                clearInterval(timerId);
            }
        }
        this.timers.clear();
        
        // Stop scheduler
        if (this.scheduler) {
            this.scheduler.stop();
        }
        
        // Clear state
        this.activeTournaments.clear();
        this.tournamentHistory.clear();
        this.scheduledTournaments.clear();
        this.prizePools.clear();
        this.pendingDistributions.clear();
        
        // Remove all listeners
        this.removeAllListeners();
        
        console.log('✅ TournamentManager destroyed');
    }
}

/**
 * Tournament Scheduler - Handles automatic tournament creation
 */
class TournamentScheduler {
    constructor(tournamentManager) {
        this.manager = tournamentManager;
        this.isRunning = false;
        this.intervals = new Map();
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('📅 Starting tournament scheduler...');
        
        // Schedule daily tournaments (every day at midnight UTC)
        this.intervals.set('daily', setInterval(() => {
            this.createDailyTournament();
        }, 24 * 60 * 60 * 1000)); // 24 hours
        
        // Schedule weekly tournaments (every Sunday at 8 PM UTC)
        this.scheduleWeeklyTournaments();
        
        // Create initial tournaments if none exist
        this.createInitialTournaments();
    }

    stop() {
        this.isRunning = false;
        
        for (const [key, intervalId] of this.intervals) {
            clearInterval(intervalId);
        }
        this.intervals.clear();
        
        console.log('⏹️ Tournament scheduler stopped');
    }

    async createDailyTournament() {
        try {
            await this.manager.createTournament({
                type: 'daily',
                name: `Daily Championship ${new Date().toLocaleDateString()}`,
                gameId: 'neon_drop',
                entryFee: 5,
                prizePool: 100
            });
        } catch (error) {
            console.error('❌ Failed to create daily tournament:', error);
        }
    }

    scheduleWeeklyTournaments() {
        // Calculate next Sunday at 8 PM UTC
        const now = new Date();
        const nextSunday = new Date(now);
        nextSunday.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()));
        nextSunday.setUTCHours(20, 0, 0, 0);
        
        const msUntilSunday = nextSunday.getTime() - now.getTime();
        
        setTimeout(() => {
            this.createWeeklyTournament();
            
            // Set up recurring weekly tournaments
            this.intervals.set('weekly', setInterval(() => {
                this.createWeeklyTournament();
            }, 7 * 24 * 60 * 60 * 1000)); // 7 days
            
        }, msUntilSunday);
    }

    async createWeeklyTournament() {
        try {
            await this.manager.createTournament({
                type: 'weekly',
                name: `Weekly Championship ${new Date().toLocaleDateString()}`,
                gameId: 'neon_drop',
                entryFee: 20,
                prizePool: 500
            });
        } catch (error) {
            console.error('❌ Failed to create weekly tournament:', error);
        }
    }

    async createInitialTournaments() {
        // Create a daily tournament if none exists
        const hasDaily = Array.from(this.manager.activeTournaments.values())
            .some(t => t.type === 'daily' && t.status === 'active');
        
        if (!hasDaily) {
            await this.createDailyTournament();
        }
    }
}

// Default export for compatibility
export default TournamentManager;
