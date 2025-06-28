/**
 * Challenge Manager - Friend Challenges and Viral Sharing
 * Phase 2: Platform Infrastructure
 */

import { CloudflareKV } from '../platform/cloudflare-kv.js';
import { RealTimeManager } from '../platform/realtime-manager.js';

/**
 * Challenge Manager - Handles friend challenges and viral sharing
 */
export class ChallengeManager {
    constructor() {
        this.activeChallenges = new Map();
        this.challengeLinks = new Map();
        this.pendingChallenges = new Map();
        
        // Infrastructure
        this.kv = new CloudflareKV();
        this.realtime = new RealTimeManager();
        
        // Configuration
        this.config = {
            defaultDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
            challengeFees: {
                quick: 1.00,      // $1 Quick Challenge
                highRoller: 5.00  // $5 High Roller Challenge
            },
            prizeDistribution: {
                winner: 0.85,     // 85% to winner
                platform: 0.15    // 15% platform fee
            },
            maxParticipants: 10,
            minParticipants: 2
        };
        
        // Background services
        this.backgroundInterval = null;
        this.isRunning = false;
        
        console.log('🔗 Challenge Manager initialized');
    }

    /**
     * Initialize the challenge manager
     */
    async initialize() {
        try {
            console.log('🔄 Initializing Challenge Manager...');
            
            // Load active challenges from storage
            await this.loadActiveChallenges();
            
            // Load pending challenges
            await this.loadPendingChallenges();
            
            // Start background services
            this.startBackgroundServices();
            
            console.log('✅ Challenge Manager ready');
        } catch (error) {
            console.error('❌ Failed to initialize Challenge Manager:', error);
            throw error;
        }
    }

    /**
     * Create a new friend challenge
     */
    async createChallenge(creatorId, gameId, fee, duration = null) {
        try {
            // Validate fee amount
            const validFees = Object.values(this.config.challengeFees);
            if (!validFees.includes(fee)) {
                throw new Error('Invalid challenge fee amount');
            }
            
            const challengeId = this.generateChallengeId();
            const startTime = Date.now();
            const endTime = startTime + (duration || this.config.defaultDuration);
            
            const challenge = {
                id: challengeId,
                creatorId: creatorId,
                gameId: gameId,
                fee: fee,
                startTime: startTime,
                endTime: endTime,
                duration: duration || this.config.defaultDuration,
                status: 'pending',
                participants: [creatorId],
                scores: new Map(),
                prizePool: fee,
                winner: null,
                createdAt: Date.now(),
                shareableLink: this.generateShareableLink(challengeId)
            };
            
            // Store challenge
            await this.kv.set(`challenge:${challengeId}`, challenge);
            
            // Add to pending challenges
            this.pendingChallenges.set(challengeId, challenge);
            
            // Set up real-time updates
            this.realtime.createChannel(`challenge:${challengeId}`);
            
            // Store shareable link
            this.challengeLinks.set(challengeId, challenge.shareableLink);
            
            console.log(`🔗 Created challenge: ${challengeId} by user ${creatorId}`);
            
            return challenge;
        } catch (error) {
            console.error('❌ Failed to create challenge:', error);
            throw error;
        }
    }

    /**
     * Accept a friend challenge
     */
    async acceptChallenge(challengeId, challengerId) {
        try {
            const challenge = await this.getChallenge(challengeId);
            if (!challenge) {
                throw new Error('Challenge not found');
            }
            
            if (challenge.status !== 'pending') {
                throw new Error('Challenge is not available for acceptance');
            }
            
            if (challenge.participants.includes(challengerId)) {
                throw new Error('User already participating in challenge');
            }
            
            if (challenge.participants.length >= this.config.maxParticipants) {
                throw new Error('Challenge is full');
            }
            
            // Add participant
            challenge.participants.push(challengerId);
            challenge.scores.set(challengerId, 0);
            
            // Update prize pool
            challenge.prizePool += challenge.fee;
            
            // If we have minimum participants, activate the challenge
            if (challenge.participants.length >= this.config.minParticipants) {
                challenge.status = 'active';
                challenge.startTime = Date.now();
                challenge.endTime = challenge.startTime + challenge.duration;
                
                // Move to active challenges
                this.activeChallenges.set(challengeId, challenge);
                this.pendingChallenges.delete(challengeId);
            }
            
            // Store updated challenge
            await this.kv.set(`challenge:${challengeId}`, challenge);
            
            // Broadcast acceptance event
            this.realtime.broadcast(`challenge:${challengeId}`, {
                type: 'challenge:accepted',
                challengerId: challengerId,
                participantCount: challenge.participants.length,
                prizePool: challenge.prizePool,
                status: challenge.status
            });
            
            console.log(`🎯 User ${challengerId} accepted challenge ${challengeId}`);
            
            return { success: true, participantCount: challenge.participants.length, status: challenge.status };
        } catch (error) {
            console.error(`❌ Failed to accept challenge:`, error);
            throw error;
        }
    }

    /**
     * Update a participant's score
     */
    async updateScore(challengeId, userId, score) {
        try {
            const challenge = await this.getChallenge(challengeId);
            if (!challenge) {
                throw new Error('Challenge not found');
            }
            
            if (challenge.status !== 'active') {
                throw new Error('Challenge is not active');
            }
            
            if (!challenge.participants.includes(userId)) {
                throw new Error('User not participating in challenge');
            }
            
            // Update score (keep highest score)
            const currentScore = challenge.scores.get(userId) || 0;
            if (score > currentScore) {
                challenge.scores.set(userId, score);
                
                // Store updated challenge
                await this.kv.set(`challenge:${challengeId}`, challenge);
                
                // Broadcast score update
                this.realtime.broadcast(`challenge:${challengeId}`, {
                    type: 'score:updated',
                    userId: userId,
                    score: score,
                    leaderboard: this.getChallengeLeaderboard(challengeId)
                });
                
                console.log(`📊 Score updated: ${userId} - ${score} in challenge ${challengeId}`);
            }
            
            return { success: true, score: score };
        } catch (error) {
            console.error(`❌ Failed to update score:`, error);
            throw error;
        }
    }

    /**
     * Resolve a challenge and determine winner
     */
    async resolveChallenge(challengeId) {
        try {
            const challenge = await this.getChallenge(challengeId);
            if (!challenge) {
                throw new Error('Challenge not found');
            }
            
            if (challenge.status !== 'active') {
                throw new Error('Challenge is not active');
            }
            
            // Determine winner
            const participants = Array.from(challenge.scores.entries())
                .map(([userId, score]) => ({ userId, score }))
                .sort((a, b) => b.score - a.score);
            
            if (participants.length === 0) {
                throw new Error('No participants with scores');
            }
            
            const winner = participants[0];
            const winnerPrize = challenge.prizePool * this.config.prizeDistribution.winner;
            const platformFee = challenge.prizePool * this.config.prizeDistribution.platform;
            
            // Update challenge
            challenge.status = 'resolved';
            challenge.winner = {
                userId: winner.userId,
                score: winner.score,
                prize: winnerPrize
            };
            challenge.endTime = Date.now();
            
            // Store updated challenge
            await this.kv.set(`challenge:${challengeId}`, challenge);
            
            // Remove from active challenges
            this.activeChallenges.delete(challengeId);
            
            // Broadcast resolution event
            this.realtime.broadcast(`challenge:${challengeId}`, {
                type: 'challenge:resolved',
                challenge: challenge,
                winner: challenge.winner
            });
            
            console.log(`🏆 Challenge resolved: ${challengeId} - Winner: ${winner.userId}`);
            
            return { challenge, winner: challenge.winner };
        } catch (error) {
            console.error(`❌ Failed to resolve challenge ${challengeId}:`, error);
            throw error;
        }
    }

    /**
     * Get challenge details
     */
    async getChallenge(challengeId) {
        try {
            // Check active challenges first
            if (this.activeChallenges.has(challengeId)) {
                return this.activeChallenges.get(challengeId);
            }
            
            // Check pending challenges
            if (this.pendingChallenges.has(challengeId)) {
                return this.pendingChallenges.get(challengeId);
            }
            
            // Load from storage
            const challenge = await this.kv.get(`challenge:${challengeId}`);
            return challenge;
        } catch (error) {
            console.error(`❌ Failed to get challenge ${challengeId}:`, error);
            return null;
        }
    }

    /**
     * Get challenge by shareable link
     */
    async getChallengeByLink(link) {
        try {
            const challengeId = this.extractChallengeIdFromLink(link);
            if (!challengeId) {
                return null;
            }
            
            return await this.getChallenge(challengeId);
        } catch (error) {
            console.error(`❌ Failed to get challenge by link:`, error);
            return null;
        }
    }

    /**
     * Get active challenges
     */
    getActiveChallenges() {
        return Array.from(this.activeChallenges.values());
    }

    /**
     * Get pending challenges
     */
    getPendingChallenges() {
        return Array.from(this.pendingChallenges.values());
    }

    /**
     * Get challenge leaderboard
     */
    getChallengeLeaderboard(challengeId) {
        const challenge = this.activeChallenges.get(challengeId);
        if (!challenge) return [];
        
        return Array.from(challenge.scores.entries())
            .map(([userId, score]) => ({ userId, score }))
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Generate shareable link
     */
    generateShareableLink(challengeId) {
        const baseUrl = window.location.origin;
        return `${baseUrl}/challenge/${challengeId}`;
    }

    /**
     * Extract challenge ID from link
     */
    extractChallengeIdFromLink(link) {
        const match = link.match(/\/challenge\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    }

    /**
     * Subscribe to challenge updates
     */
    subscribeToChallenge(challengeId, callback) {
        return this.realtime.subscribe(`challenge:${challengeId}`, callback);
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
        
        console.log('🔄 Challenge background services started');
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
        console.log('⏹️ Challenge background services stopped');
    }

    /**
     * Private methods
     */
    generateChallengeId() {
        return `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async loadActiveChallenges() {
        try {
            const challenges = await this.kv.list('challenge:*');
            for (const [key, challenge] of challenges) {
                if (challenge.status === 'active') {
                    this.activeChallenges.set(challenge.id, challenge);
                }
            }
            console.log(`📋 Loaded ${this.activeChallenges.size} active challenges`);
        } catch (error) {
            console.error('❌ Failed to load active challenges:', error);
        }
    }

    async loadPendingChallenges() {
        try {
            const challenges = await this.kv.list('challenge:*');
            for (const [key, challenge] of challenges) {
                if (challenge.status === 'pending') {
                    this.pendingChallenges.set(challenge.id, challenge);
                }
            }
            console.log(`📋 Loaded ${this.pendingChallenges.size} pending challenges`);
        } catch (error) {
            console.error('❌ Failed to load pending challenges:', error);
        }
    }

    async processBackgroundTasks() {
        const now = Date.now();
        
        // Check for challenges that need to be resolved
        for (const [challengeId, challenge] of this.activeChallenges) {
            if (challenge.endTime <= now) {
                await this.resolveChallenge(challengeId);
            }
        }
        
        // Clean up expired pending challenges
        for (const [challengeId, challenge] of this.pendingChallenges) {
            if (challenge.createdAt + (7 * 24 * 60 * 60 * 1000) <= now) { // 7 days
                challenge.status = 'expired';
                await this.kv.set(`challenge:${challengeId}`, challenge);
                this.pendingChallenges.delete(challengeId);
                console.log(`⏰ Challenge ${challengeId} expired`);
            }
        }
    }
}

// Export singleton instance
export const challengeManager = new ChallengeManager(); 