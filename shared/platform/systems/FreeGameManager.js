/**
 * Free Game Management System
 * Handles free daily game allocation and progression to paid games
 * Part of BlockZone Lab's unified identity consolidation
 */

import { ImportPaths } from '../../utils/ImportPaths.js';
import { EventEmitter } from '../../utils/EventEmitter.js';

class FreeGameManager extends EventEmitter {
    constructor() {
        super();
        
        this.freeGameLimits = {
            dailyAllocation: 1,
            maxPendingCredits: 3,
            creditExpiryHours: 24
        };
        
        this.playerCredits = new Map();
        this.usageHistory = new Map();
        this.conversionTracking = new Map();
        
        this.initializeFromStorage();
    }

    /**
     * Check if player is eligible for free game
     * @param {string} playerId - Player identifier (device fingerprint or wallet)
     * @param {Object} validationData - Anti-abuse validation results
     * @returns {Promise<Object>} Eligibility status and details
     */
    async checkFreeGameEligibility(playerId, validationData = {}) {
        try {
            const playerData = this.getPlayerData(playerId);
            const now = Date.now();
            
            // Check anti-abuse validation first
            if (validationData.riskLevel === 'CRITICAL' || !validationData.allowed) {
                return {
                    eligible: false,
                    reason: 'security_restriction',
                    message: validationData.message || 'Access temporarily restricted',
                    retryAfter: validationData.retryAfter
                };
            }

            // Check daily allocation
            const todayUsage = this.getTodayUsage(playerId);
            if (todayUsage >= this.freeGameLimits.dailyAllocation) {
                const resetTime = this.getNextResetTime();
                return {
                    eligible: false,
                    reason: 'daily_limit_reached',
                    message: 'You\'ve used your free game for today! Come back tomorrow for another.',
                    retryAfter: resetTime - now,
                    nextFreeGame: new Date(resetTime).toLocaleString()
                };
            }

            // Check if player has pending credits
            const availableCredits = this.getAvailableCredits(playerId);
            if (availableCredits > 0) {
                return {
                    eligible: true,
                    reason: 'existing_credits',
                    message: `You have ${availableCredits} free game${availableCredits > 1 ? 's' : ''} available!`,
                    creditsAvailable: availableCredits,
                    isNewAllocation: false
                };
            }

            // Grant new daily free game
            this.allocateDailyCredit(playerId);
            
            return {
                eligible: true,
                reason: 'daily_allocation',
                message: 'Welcome! You have 1 free game today!',
                creditsAvailable: 1,
                isNewAllocation: true,
                conversionPrompt: this.shouldShowConversionPrompt(playerId)
            };

        } catch (error) {
            console.error('Free game eligibility check failed:', error);
            
            return {
                eligible: false,
                reason: 'system_error',
                message: 'Unable to check free game status. Please try again.',
                retryAfter: 60000 // 1 minute
            };
        }
    }

    /**
     * Consume a free game credit
     * @param {string} playerId - Player identifier
     * @param {string} gameType - Type of game being played
     * @returns {Promise<Object>} Consumption result
     */
    async consumeFreeGameCredit(playerId, gameType = 'neondrop') {
        try {
            const playerData = this.getPlayerData(playerId);
            const availableCredits = this.getAvailableCredits(playerId);
            
            if (availableCredits === 0) {
                return {
                    success: false,
                    reason: 'no_credits',
                    message: 'No free games available'
                };
            }

            // Find and consume the oldest credit
            const credits = playerData.credits || [];
            const validCredits = credits.filter(credit => !credit.used && !this.isCreditExpired(credit));
            
            if (validCredits.length === 0) {
                return {
                    success: false,
                    reason: 'no_valid_credits',
                    message: 'No valid free games available'
                };
            }

            // Consume the credit
            const creditToUse = validCredits[0];
            creditToUse.used = true;
            creditToUse.usedAt = Date.now();
            creditToUse.gameType = gameType;

            // Record usage
            this.recordGameUsage(playerId, {
                creditId: creditToUse.id,
                gameType,
                timestamp: Date.now(),
                source: creditToUse.source
            });

            this.saveToStorage();
            
            // Emit event for analytics
            this.emit('freeGameUsed', {
                playerId,
                gameType,
                creditSource: creditToUse.source,
                remainingCredits: this.getAvailableCredits(playerId)
            });

            return {
                success: true,
                remainingCredits: this.getAvailableCredits(playerId),
                creditUsed: creditToUse,
                showConversionPrompt: this.shouldShowConversionPrompt(playerId, 'post_game')
            };

        } catch (error) {
            console.error('Failed to consume free game credit:', error);
            
            return {
                success: false,
                reason: 'system_error',
                message: 'Unable to start free game. Please try again.'
            };
        }
    }

    /**
     * Track conversion from free to paid player
     * @param {string} playerId - Player identifier
     * @param {string} walletAddress - Connected wallet address
     * @param {Object} conversionData - Additional conversion context
     */
    async trackConversion(playerId, walletAddress, conversionData = {}) {
        try {
            const playerData = this.getPlayerData(playerId);
            const conversionRecord = {
                timestamp: Date.now(),
                walletAddress,
                gamesPlayedBefore: this.getTotalGamesPlayed(playerId),
                daysSinceFirstGame: this.getDaysSinceFirstGame(playerId),
                conversionTrigger: conversionData.trigger || 'manual',
                ...conversionData
            };

            // Update player data
            playerData.converted = true;
            playerData.conversionData = conversionRecord;
            playerData.walletAddress = walletAddress;

            this.conversionTracking.set(playerId, conversionRecord);
            this.saveToStorage();

            // Emit conversion event
            this.emit('playerConverted', {
                playerId,
                walletAddress,
                conversionData: conversionRecord
            });

            // Grant conversion bonus if applicable
            if (conversionData.grantBonus) {
                this.grantConversionBonus(playerId);
            }

            return {
                success: true,
                conversionRecord
            };

        } catch (error) {
            console.error('Failed to track conversion:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get player's free game status and history
     * @param {string} playerId - Player identifier
     */
    getPlayerStatus(playerId) {
        const playerData = this.getPlayerData(playerId);
        const availableCredits = this.getAvailableCredits(playerId);
        const todayUsage = this.getTodayUsage(playerId);
        const totalGames = this.getTotalGamesPlayed(playerId);
        
        return {
            playerId,
            converted: playerData.converted || false,
            walletAddress: playerData.walletAddress,
            availableCredits,
            dailyUsage: todayUsage,
            dailyLimit: this.freeGameLimits.dailyAllocation,
            totalGamesPlayed: totalGames,
            firstGameDate: playerData.firstGame,
            lastGameDate: playerData.lastGame,
            nextFreeGame: todayUsage >= this.freeGameLimits.dailyAllocation ? 
                new Date(this.getNextResetTime()).toLocaleString() : 'Available now',
            conversionEligible: this.isConversionEligible(playerId)
        };
    }

    /**
     * Grant special promotional credits
     * @param {string} playerId - Player identifier
     * @param {number} amount - Number of credits to grant
     * @param {string} reason - Reason for the grant
     */
    grantPromotionalCredits(playerId, amount, reason = 'promotion') {
        const playerData = this.getPlayerData(playerId);
        
        for (let i = 0; i < amount; i++) {
            const credit = {
                id: this.generateCreditId(),
                source: 'promotional',
                reason,
                grantedAt: Date.now(),
                expiresAt: Date.now() + (this.freeGameLimits.creditExpiryHours * 3600000),
                used: false
            };
            
            if (!playerData.credits) playerData.credits = [];
            playerData.credits.push(credit);
        }

        this.saveToStorage();
        
        this.emit('creditsGranted', {
            playerId,
            amount,
            reason,
            totalCredits: this.getAvailableCredits(playerId)
        });
    }

    /**
     * Get player data, create if doesn't exist
     * @private
     */
    getPlayerData(playerId) {
        if (!this.playerCredits.has(playerId)) {
            const playerData = {
                playerId,
                firstGame: null,
                lastGame: null,
                credits: [],
                converted: false,
                createdAt: Date.now()
            };
            this.playerCredits.set(playerId, playerData);
        }
        return this.playerCredits.get(playerId);
    }

    /**
     * Get today's usage count for player
     * @private
     */
    getTodayUsage(playerId) {
        const usage = this.usageHistory.get(playerId) || [];
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        return usage.filter(game => game.timestamp >= todayStart.getTime()).length;
    }

    /**
     * Get available credits count
     * @private
     */
    getAvailableCredits(playerId) {
        const playerData = this.getPlayerData(playerId);
        const credits = playerData.credits || [];
        
        return credits.filter(credit => 
            !credit.used && !this.isCreditExpired(credit)
        ).length;
    }

    /**
     * Check if credit is expired
     * @private
     */
    isCreditExpired(credit) {
        return credit.expiresAt && Date.now() > credit.expiresAt;
    }

    /**
     * Allocate daily free game credit
     * @private
     */
    allocateDailyCredit(playerId) {
        const playerData = this.getPlayerData(playerId);
        
        const credit = {
            id: this.generateCreditId(),
            source: 'daily_allocation',
            grantedAt: Date.now(),
            expiresAt: Date.now() + (this.freeGameLimits.creditExpiryHours * 3600000),
            used: false
        };
        
        if (!playerData.credits) playerData.credits = [];
        playerData.credits.push(credit);
        
        if (!playerData.firstGame) {
            playerData.firstGame = Date.now();
        }
        
        this.saveToStorage();
    }

    /**
     * Record game usage
     * @private
     */
    recordGameUsage(playerId, gameData) {
        const usage = this.usageHistory.get(playerId) || [];
        usage.push(gameData);
        this.usageHistory.set(playerId, usage);
        
        // Update player's last game time
        const playerData = this.getPlayerData(playerId);
        playerData.lastGame = Date.now();
    }

    /**
     * Get next daily reset time (midnight)
     * @private
     */
    getNextResetTime() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
    }

    /**
     * Check if should show conversion prompt
     * @private
     */
    shouldShowConversionPrompt(playerId, context = 'eligibility_check') {
        const playerData = this.getPlayerData(playerId);
        
        if (playerData.converted) return false;
        
        const totalGames = this.getTotalGamesPlayed(playerId);
        const daysSinceFirst = this.getDaysSinceFirstGame(playerId);
        
        // Show prompt based on engagement
        if (context === 'post_game') {
            return totalGames >= 1; // Show after any free game
        } else if (context === 'eligibility_check') {
            return totalGames >= 2 || daysSinceFirst >= 1; // Show to returning players
        }
        
        return false;
    }

    /**
     * Check if player is eligible for conversion incentives
     * @private
     */
    isConversionEligible(playerId) {
        const playerData = this.getPlayerData(playerId);
        
        if (playerData.converted) return false;
        
        const totalGames = this.getTotalGamesPlayed(playerId);
        const daysSinceFirst = this.getDaysSinceFirstGame(playerId);
        
        return totalGames >= 1 && daysSinceFirst >= 0;
    }

    /**
     * Get total games played by player
     * @private
     */
    getTotalGamesPlayed(playerId) {
        const usage = this.usageHistory.get(playerId) || [];
        return usage.length;
    }

    /**
     * Get days since first game
     * @private
     */
    getDaysSinceFirstGame(playerId) {
        const playerData = this.getPlayerData(playerId);
        if (!playerData.firstGame) return 0;
        
        const diffMs = Date.now() - playerData.firstGame;
        return Math.floor(diffMs / (24 * 60 * 60 * 1000));
    }

    /**
     * Grant conversion bonus
     * @private
     */
    grantConversionBonus(playerId) {
        // This could grant special rewards, tokens, or other incentives
        this.emit('conversionBonusGranted', { playerId });
    }

    /**
     * Generate unique credit ID
     * @private
     */
    generateCreditId() {
        return 'credit_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Initialize from localStorage
     * @private
     */
    initializeFromStorage() {
        try {
            const stored = localStorage.getItem('bz_freegames_data');
            if (stored) {
                const data = JSON.parse(stored);
                
                if (data.playerCredits) {
                    this.playerCredits = new Map(data.playerCredits);
                }
                if (data.usageHistory) {
                    this.usageHistory = new Map(data.usageHistory);
                }
                if (data.conversionTracking) {
                    this.conversionTracking = new Map(data.conversionTracking);
                }
                
                // Clean up expired credits
                this.cleanupExpiredCredits();
            }
        } catch (error) {
            console.warn('Could not load free games data from storage:', error);
        }
    }

    /**
     * Save to localStorage
     */
    saveToStorage() {
        try {
            const data = {
                playerCredits: Array.from(this.playerCredits.entries()),
                usageHistory: Array.from(this.usageHistory.entries()),
                conversionTracking: Array.from(this.conversionTracking.entries()),
                timestamp: Date.now()
            };
            localStorage.setItem('bz_freegames_data', JSON.stringify(data));
        } catch (error) {
            console.warn('Could not save free games data to storage:', error);
        }
    }

    /**
     * Clean up expired credits
     * @private
     */
    cleanupExpiredCredits() {
        for (const [playerId, playerData] of this.playerCredits.entries()) {
            if (playerData.credits) {
                playerData.credits = playerData.credits.filter(credit => 
                    !this.isCreditExpired(credit)
                );
            }
        }
    }

    /**
     * Get system metrics
     */
    getSystemMetrics() {
        const totalPlayers = this.playerCredits.size;
        const convertedPlayers = Array.from(this.playerCredits.values())
            .filter(player => player.converted).length;
        
        const totalCreditsIssued = Array.from(this.playerCredits.values())
            .reduce((sum, player) => sum + (player.credits?.length || 0), 0);
        
        const totalGamesPlayed = Array.from(this.usageHistory.values())
            .reduce((sum, usage) => sum + usage.length, 0);
        
        const conversionRate = totalPlayers > 0 ? 
            (convertedPlayers / totalPlayers * 100).toFixed(2) : 0;

        return {
            totalPlayers,
            convertedPlayers,
            conversionRate: `${conversionRate}%`,
            totalCreditsIssued,
            totalGamesPlayed,
            avgGamesPerPlayer: totalPlayers > 0 ? 
                (totalGamesPlayed / totalPlayers).toFixed(2) : 0
        };
    }
}

// Export singleton instance
export const freeGameManager = new FreeGameManager();
