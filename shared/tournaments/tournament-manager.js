/**
 * Tournament Manager - Championship Cycles and Prize Distribution
 * Phase 2: Platform Infrastructure
 */

import { CloudflareKV } from '../platform/cloudflare-kv.js';
import { RealTimeManager } from '../platform/realtime-manager.js';

/**
 * Tournament Manager - Handles championship cycles and prize distribution
 */
export class TournamentManager {
    constructor() {
        this.activeChampionships = new Map();
        this.scheduledChampionships = [];
        this.prizePools = new Map();
        this.leaderboards = new Map();
        
        // Infrastructure
        this.kv = new CloudflareKV();
        this.realtime = new RealTimeManager();
        
        // Configuration
        this.config = {
            defaultDuration: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
            defaultEntryFee: 0.25, // USDC.E
            prizeDistribution: {
                first: 0.50,   // 50% to 1st place
                second: 0.30,  // 30% to 2nd place
                third: 0.10    // 10% to 3rd place
            },
            maxParticipants: 1000,
            minParticipants: 2
        };
        
        // Background services
        this.backgroundInterval = null;
        this.isRunning = false;
        
        console.log('🏆 Tournament Manager initialized');
    }

    /**
     * Initialize the tournament manager
     */
    async initialize() {
        try {
            console.log('🔄 Initializing Tournament Manager...');
            
            // Load active championships from storage
            await this.loadActiveChampionships();
            
            // Load scheduled championships
            await this.loadScheduledChampionships();
            
            // Start background services
            this.startBackgroundServices();
            
            console.log('✅ Tournament Manager ready');
        } catch (error) {
            console.error('❌ Failed to initialize Tournament Manager:', error);
            throw error;
        }
    }

    /**
     * Create a new championship tournament
     */
    async createChampionship(duration = null, entryFee = null, gameId = 'neondrop') {
        try {
            const championshipId = this.generateChampionshipId();
            const startTime = Date.now();
            const endTime = startTime + (duration || this.config.defaultDuration);
            const fee = entryFee || this.config.defaultEntryFee;
            
            const championship = {
                id: championshipId,
                gameId: gameId,
                startTime: startTime,
                endTime: endTime,
                duration: duration || this.config.defaultDuration,
                entryFee: fee,
                status: 'scheduled',
                participants: [],
                scores: new Map(),
                prizePool: 0,
                winners: [],
                createdAt: Date.now()
            };
            
            // Store championship
            await this.kv.set(`championship:${championshipId}`, championship);
            
            // Add to scheduled championships
            this.scheduledChampionships.push(championship);
            
            // Set up real-time updates
            this.realtime.createChannel(`championship:${championshipId}`);
            
            console.log(`🏆 Created championship: ${championshipId}`);
            
            return championship;
        } catch (error) {
            console.error('❌ Failed to create championship:', error);
            throw error;
        }
    }

    /**
     * Start a championship tournament
     */
    async startChampionship(championshipId) {
        try {
            const championship = await this.getChampionship(championshipId);
            if (!championship) {
                throw new Error('Championship not found');
            }
            
            if (championship.status !== 'scheduled') {
                throw new Error('Championship cannot be started');
            }
            
            // Update status
            championship.status = 'active';
            championship.startTime = Date.now();
            championship.endTime = championship.startTime + championship.duration;
            
            // Store updated championship
            await this.kv.set(`championship:${championshipId}`, championship);
            
            // Move to active championships
            this.activeChampionships.set(championshipId, championship);
            this.scheduledChampionships = this.scheduledChampionships.filter(c => c.id !== championshipId);
            
            // Initialize leaderboard
            this.leaderboards.set(championshipId, []);
            
            // Broadcast start event
            this.realtime.broadcast(`championship:${championshipId}`, {
                type: 'championship:started',
                championship: championship
            });
            
            console.log(`🎯 Championship started: ${championshipId}`);
            
            return championship;
        } catch (error) {
            console.error(`❌ Failed to start championship ${championshipId}:`, error);
            throw error;
        }
    }

    /**
     * Join a championship tournament
     */
    async joinChampionship(championshipId, userId) {
        try {
            const championship = await this.getChampionship(championshipId);
            if (!championship) {
                throw new Error('Championship not found');
            }
            
            if (championship.status !== 'active') {
                throw new Error('Championship is not active');
            }
            
            if (championship.participants.includes(userId)) {
                throw new Error('User already joined championship');
            }
            
            if (championship.participants.length >= this.config.maxParticipants) {
                throw new Error('Championship is full');
            }
            
            // Add participant
            championship.participants.push(userId);
            championship.scores.set(userId, 0);
            
            // Update prize pool
            championship.prizePool += championship.entryFee;
            
            // Store updated championship
            await this.kv.set(`championship:${championshipId}`, championship);
            
            // Update leaderboard
            await this.updateLeaderboard(championshipId);
            
            // Broadcast join event
            this.realtime.broadcast(`championship:${championshipId}`, {
                type: 'participant:joined',
                userId: userId,
                participantCount: championship.participants.length,
                prizePool: championship.prizePool
            });
            
            console.log(`🎯 User ${userId} joined championship ${championshipId}`);
            
            return { success: true, participantCount: championship.participants.length };
        } catch (error) {
            console.error(`❌ Failed to join championship:`, error);
            throw error;
        }
    }

    /**
     * Update a participant's score
     */
    async updateScore(championshipId, userId, score) {
        try {
            const championship = await this.getChampionship(championshipId);
            if (!championship) {
                throw new Error('Championship not found');
            }
            
            if (championship.status !== 'active') {
                throw new Error('Championship is not active');
            }
            
            if (!championship.participants.includes(userId)) {
                throw new Error('User not participating in championship');
            }
            
            // Update score (keep highest score)
            const currentScore = championship.scores.get(userId) || 0;
            if (score > currentScore) {
                championship.scores.set(userId, score);
                
                // Store updated championship
                await this.kv.set(`championship:${championshipId}`, championship);
                
                // Update leaderboard
                await this.updateLeaderboard(championshipId);
                
                // Broadcast score update
                this.realtime.broadcast(`championship:${championshipId}`, {
                    type: 'score:updated',
                    userId: userId,
                    score: score,
                    leaderboard: this.leaderboards.get(championshipId)
                });
                
                console.log(`📊 Score updated: ${userId} - ${score} in championship ${championshipId}`);
            }
            
            return { success: true, score: score };
        } catch (error) {
            console.error(`❌ Failed to update score:`, error);
            throw error;
        }
    }

    /**
     * End a championship tournament
     */
    async endChampionship(championshipId) {
        try {
            const championship = await this.getChampionship(championshipId);
            if (!championship) {
                throw new Error('Championship not found');
            }
            
            if (championship.status !== 'active') {
                throw new Error('Championship is not active');
            }
            
            // Update status
            championship.status = 'ended';
            championship.endTime = Date.now();
            
            // Determine winners
            const winners = this.determineWinners(championship);
            championship.winners = winners;
            
            // Store updated championship
            await this.kv.set(`championship:${championshipId}`, championship);
            
            // Remove from active championships
            this.activeChampionships.delete(championshipId);
            
            // Broadcast end event
            this.realtime.broadcast(`championship:${championshipId}`, {
                type: 'championship:ended',
                championship: championship,
                winners: winners
            });
            
            console.log(`🏆 Championship ended: ${championshipId}`);
            
            return { championship, winners };
        } catch (error) {
            console.error(`❌ Failed to end championship ${championshipId}:`, error);
            throw error;
        }
    }

    /**
     * Get championship details
     */
    async getChampionship(championshipId) {
        try {
            // Check active championships first
            if (this.activeChampionships.has(championshipId)) {
                return this.activeChampionships.get(championshipId);
            }
            
            // Load from storage
            const championship = await this.kv.get(`championship:${championshipId}`);
            return championship;
        } catch (error) {
            console.error(`❌ Failed to get championship ${championshipId}:`, error);
            return null;
        }
    }

    /**
     * Get active championships
     */
    getActiveChampionships() {
        return Array.from(this.activeChampionships.values());
    }

    /**
     * Get championship leaderboard
     */
    getLeaderboard(championshipId) {
        return this.leaderboards.get(championshipId) || [];
    }

    /**
     * Subscribe to championship updates
     */
    subscribeToChampionship(championshipId, callback) {
        return this.realtime.subscribe(`championship:${championshipId}`, callback);
    }

    /**
     * Start background services
     */
    startBackgroundServices() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.backgroundInterval = setInterval(() => {
            this.processBackgroundTasks();
        }, 30000); // Check every 30 seconds
        
        console.log('🔄 Tournament background services started');
    }

    /**
     * Stop background services
     */
    stopBackgroundServices() {
        if (this.backgroundInterval) {
            clearInterval(this.backgroundInterval);
            this.backgroundInterval = null;
        }
        this.isRunning = false;
        console.log('⏹️ Tournament background services stopped');
    }

    /**
     * Private methods
     */
    generateChampionshipId() {
        return `champ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async loadActiveChampionships() {
        try {
            const championships = await this.kv.list('championship:*');
            for (const [key, championship] of championships) {
                if (championship.status === 'active') {
                    this.activeChampionships.set(championship.id, championship);
                }
            }
            console.log(`📋 Loaded ${this.activeChampionships.size} active championships`);
        } catch (error) {
            console.error('❌ Failed to load active championships:', error);
        }
    }

    async loadScheduledChampionships() {
        try {
            const championships = await this.kv.list('championship:*');
            this.scheduledChampionships = championships
                .filter(([key, championship]) => championship.status === 'scheduled')
                .map(([key, championship]) => championship);
            console.log(`📋 Loaded ${this.scheduledChampionships.length} scheduled championships`);
        } catch (error) {
            console.error('❌ Failed to load scheduled championships:', error);
        }
    }

    async updateLeaderboard(championshipId) {
        const championship = await this.getChampionship(championshipId);
        if (!championship) return;
        
        // Create leaderboard from scores
        const leaderboard = Array.from(championship.scores.entries())
            .map(([userId, score]) => ({ userId, score }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Top 10
        
        this.leaderboards.set(championshipId, leaderboard);
    }

    determineWinners(championship) {
        const participants = Array.from(championship.scores.entries())
            .map(([userId, score]) => ({ userId, score }))
            .sort((a, b) => b.score - a.score);
        
        const winners = [];
        const prizePool = championship.prizePool;
        
        // First place
        if (participants.length > 0) {
            winners.push({
                position: 1,
                userId: participants[0].userId,
                score: participants[0].score,
                prize: prizePool * this.config.prizeDistribution.first
            });
        }
        
        // Second place
        if (participants.length > 1) {
            winners.push({
                position: 2,
                userId: participants[1].userId,
                score: participants[1].score,
                prize: prizePool * this.config.prizeDistribution.second
            });
        }
        
        // Third place
        if (participants.length > 2) {
            winners.push({
                position: 3,
                userId: participants[2].userId,
                score: participants[2].score,
                prize: prizePool * this.config.prizeDistribution.third
            });
        }
        
        return winners;
    }

    async processBackgroundTasks() {
        const now = Date.now();
        
        // Check for championships that need to start
        for (const championship of this.scheduledChampionships) {
            if (championship.startTime <= now) {
                await this.startChampionship(championship.id);
            }
        }
        
        // Check for championships that need to end
        for (const [championshipId, championship] of this.activeChampionships) {
            if (championship.endTime <= now) {
                await this.endChampionship(championshipId);
            }
        }
    }
}

// Export singleton instance
export const tournamentManager = new TournamentManager(); 