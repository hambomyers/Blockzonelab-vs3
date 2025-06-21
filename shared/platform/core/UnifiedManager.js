/**
 * Unified Manager - Central Coordinator
 * Orchestrates all unified systems for seamless player experience
 * Part of BlockZone Lab's Phase 1 consolidation plan
 */

import { ImportPaths } from '../../utils/ImportPaths.js';
import { EventEmitter } from '../../utils/EventEmitter.js';
import { unifiedIdentity } from '../systems/UnifiedIdentity.js';
import { freeGameManager } from '../systems/FreeGameManager.js';
import { antiAbuseManager } from '../security/AntiAbuseManager.js';
import { deviceFingerprinter } from '../security/DeviceFingerprinter.js';

class UnifiedManager extends EventEmitter {
    constructor() {
        super();
        
        this.initialized = false;
        this.systems = {
            identity: unifiedIdentity,
            freeGames: freeGameManager,
            antiAbuse: antiAbuseManager,
            deviceFingerprinter: deviceFingerprinter
        };
        
        this.player = null;
        this.systemStatus = {
            identity: 'pending',
            freeGames: 'pending',
            security: 'pending',
            overall: 'pending'
        };
        
        this.setupEventListeners();
    }

    /**
     * Initialize all unified systems
     * This is the main entry point for the entire platform
     */
    async initialize() {
        if (this.initialized) {
            return { success: true, player: this.player };
        }

        try {
            this.emit('initializationStarted');
            
            // Step 1: Initialize identity system (includes security and free games)
            this.systemStatus.identity = 'initializing';
            this.player = await this.systems.identity.initialize();
            this.systemStatus.identity = 'ready';
            
            // Step 2: Verify system integration
            await this.verifySystemIntegration();
            
            // Step 3: Set up periodic maintenance
            this.setupMaintenanceTasks();
            
            this.initialized = true;
            this.systemStatus.overall = 'ready';
            
            this.emit('initializationComplete', {
                player: this.player,
                systemStatus: this.systemStatus
            });
            
            return {
                success: true,
                player: this.player,
                systems: this.systemStatus
            };

        } catch (error) {
            console.error('Unified system initialization failed:', error);
            
            this.systemStatus.overall = 'error';
            
            this.emit('initializationFailed', { error, systemStatus: this.systemStatus });
            
            return {
                success: false,
                error: error.message,
                systems: this.systemStatus
            };
        }
    }

    /**
     * Get current player with full context
     */
    async getPlayer() {
        if (!this.initialized) {
            const result = await this.initialize();
            if (!result.success) {
                throw new Error(`System initialization failed: ${result.error}`);
            }
        }
        
        return this.player;
    }

    /**
     * Start a new game with full validation and tracking
     */
    async startGame(gameType = 'neondrop', gameOptions = {}) {
        try {
            const player = await this.getPlayer();
            
            // Check if player can start this game
            const eligibility = await this.checkGameEligibility(gameType, gameOptions);
            
            if (!eligibility.canPlay) {
                return {
                    success: false,
                    reason: eligibility.reason,
                    message: eligibility.message,
                    retryAfter: eligibility.retryAfter
                };
            }

            // Consume credits if this is a free game
            let creditResult = null;
            if (eligibility.isFreeGame) {
                creditResult = await this.systems.identity.consumeFreeGame(gameType);
                if (!creditResult.success) {
                    return {
                        success: false,
                        reason: creditResult.reason,
                        message: creditResult.message
                    };
                }
            }

            // Record game start
            const gameSession = {
                sessionId: this.generateSessionId(),
                gameType,
                playerId: player.playerId,
                startedAt: Date.now(),
                gameOptions,
                isFreeGame: eligibility.isFreeGame,
                creditUsed: creditResult?.creditUsed
            };

            this.emit('gameStarted', {
                player,
                gameSession,
                eligibility
            });

            return {
                success: true,
                gameSession,
                player,
                showConversionPrompt: creditResult?.showConversionPrompt || false,
                remainingFreeGames: creditResult?.remainingCredits || 0
            };

        } catch (error) {
            console.error('Failed to start game:', error);
            
            return {
                success: false,
                reason: 'system_error',
                message: 'Unable to start game. Please try again.'
            };
        }
    }

    /**
     * Complete a game with stats and rewards
     */
    async completeGame(gameSession, gameStats) {
        try {
            const player = await this.getPlayer();
            
            // Validate game session
            if (!gameSession || !gameSession.sessionId) {
                throw new Error('Invalid game session');
            }

            // Update player stats
            await this.systems.identity.updateGameStats(gameSession.gameType, {
                ...gameStats,
                sessionDuration: Date.now() - gameSession.startedAt,
                completed: true
            });

            // Process rewards if applicable
            const rewards = await this.processGameRewards(gameSession, gameStats);

            // Check for tier upgrade opportunities
            const upgradePrompt = await this.checkUpgradeOpportunities(player, gameStats);

            this.emit('gameCompleted', {
                player,
                gameSession,
                gameStats,
                rewards,
                upgradePrompt
            });

            return {
                success: true,
                rewards,
                upgradePrompt,
                player: await this.systems.identity.getPlayer() // Get updated player data
            };

        } catch (error) {
            console.error('Failed to complete game:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Upgrade player to next tier
     */
    async upgradePlayer(upgradeType, upgradeData = {}) {
        try {
            const player = await this.getPlayer();
            
            let upgradedPlayer;
            
            switch (upgradeType) {
                case 'social':
                    if (player.tier !== 'free') {
                        throw new Error('Can only upgrade from free tier to social');
                    }
                    upgradedPlayer = await this.systems.identity.upgradeToSocialTier(upgradeData);
                    break;
                    
                case 'web3':
                    if (!upgradeData.walletAddress) {
                        throw new Error('Wallet address required for Web3 upgrade');
                    }
                    upgradedPlayer = await this.systems.identity.upgradeToWeb3Tier(upgradeData.walletAddress);
                    break;
                    
                default:
                    throw new Error(`Unknown upgrade type: ${upgradeType}`);
            }

            this.player = upgradedPlayer;

            this.emit('playerUpgraded', {
                upgradeType,
                player: upgradedPlayer,
                upgradeData
            });

            return {
                success: true,
                player: upgradedPlayer
            };

        } catch (error) {
            console.error('Player upgrade failed:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get comprehensive player status
     */
    async getPlayerStatus() {
        const player = await this.getPlayer();
        const freeGameStatus = this.systems.freeGames.getPlayerStatus(player.playerId);
        const securityMetrics = this.systems.antiAbuse.getSecurityMetrics();
        
        return {
            player,
            freeGames: freeGameStatus,
            security: {
                deviceFingerprint: player.deviceFingerprint,
                securityStatus: player.securityStatus,
                riskLevel: player.securityStatus?.riskLevel || 'UNKNOWN'
            },
            system: {
                initialized: this.initialized,
                status: this.systemStatus,
                metrics: securityMetrics
            },
            features: this.systems.identity.getAvailableFeatures(),
            upgradeOpportunities: await this.getUpgradeOpportunities(player)
        };
    }

    /**
     * Check game eligibility
     * @private
     */
    async checkGameEligibility(gameType, gameOptions) {
        const player = await this.getPlayer();
        
        // Check if player has play_free_games feature
        const canPlayFree = this.systems.identity.hasFeature('play_free_games');
        
        // Check security status
        if (player.securityStatus && !player.securityStatus.allowed) {
            return {
                canPlay: false,
                reason: 'security_restriction',
                message: player.securityStatus.message,
                retryAfter: player.securityStatus.retryAfter
            };
        }

        // For free games, check eligibility
        if (gameOptions.isFreeGame !== false && canPlayFree) {
            const freeGameStatus = await this.systems.freeGames.checkFreeGameEligibility(
                player.playerId,
                player.securityStatus
            );
            
            return {
                canPlay: freeGameStatus.eligible,
                isFreeGame: true,
                reason: freeGameStatus.reason,
                message: freeGameStatus.message,
                retryAfter: freeGameStatus.retryAfter
            };
        }

        // For paid games (Web3 tier)
        if (gameOptions.requiresPayment && !this.systems.identity.hasFeature('crypto_rewards')) {
            return {
                canPlay: false,
                reason: 'tier_upgrade_required',
                message: 'Connect your wallet to play paid games with crypto rewards!'
            };
        }

        return {
            canPlay: true,
            isFreeGame: false,
            reason: 'eligible'
        };
    }

    /**
     * Process game rewards
     * @private
     */
    async processGameRewards(gameSession, gameStats) {
        const rewards = {
            experience: 0,
            achievements: [],
            tokens: 0,
            nfts: []
        };

        // Basic experience for completing game
        rewards.experience += 10;
        
        if (gameStats.score) {
            rewards.experience += Math.floor(gameStats.score / 100);
        }

        // Special rewards for Web3 players
        if (this.player.tier === 'web3' && gameSession.isFreeGame === false) {
            // Crypto rewards logic would go here
            rewards.tokens = Math.floor(gameStats.score / 1000);
        }

        return rewards;
    }

    /**
     * Check upgrade opportunities
     * @private
     */
    async checkUpgradeOpportunities(player, gameStats) {
        if (player.tier === 'free' && player.gamesPlayed >= 1) {
            return {
                available: true,
                type: 'social',
                title: 'Unlock Cloud Save & Cross-Device Play!',
                description: 'Sign in to save your progress and play on any device.',
                benefits: ['Cloud save', 'Cross-device sync', 'Enhanced tournaments']
            };
        }

        if (player.tier === 'social' && gameStats.score > 5000) {
            return {
                available: true,
                type: 'web3',
                title: 'Unlock Crypto Rewards!',
                description: 'Connect your wallet to earn USDC and exclusive NFTs.',
                benefits: ['Crypto rewards', 'NFT collection', 'Premium tournaments', 'Staking']
            };
        }

        return { available: false };
    }

    /**
     * Get available upgrade opportunities
     * @private
     */
    async getUpgradeOpportunities(player) {
        const opportunities = [];

        if (player.tier === 'free') {
            opportunities.push({
                type: 'social',
                title: 'Sign In for Cloud Save',
                description: 'Never lose your progress again',
                priority: 'medium'
            });
        }

        if (player.tier !== 'web3') {
            opportunities.push({
                type: 'web3',
                title: 'Connect Wallet for Crypto Rewards',
                description: 'Earn USDC and exclusive NFTs',
                priority: player.gamesPlayed > 3 ? 'high' : 'low'
            });
        }

        return opportunities;
    }

    /**
     * Setup event listeners for system coordination
     * @private
     */
    setupEventListeners() {
        // Forward important events from subsystems
        this.systems.identity.on('tierUpgraded', (data) => {
            this.emit('playerTierUpgraded', data);
        });

        this.systems.freeGames.on('freeGameUsed', (data) => {
            this.emit('freeGameConsumed', data);
        });

        this.systems.freeGames.on('playerConverted', (data) => {
            this.emit('playerConvertedToPaid', data);
        });
    }

    /**
     * Setup periodic maintenance tasks
     * @private
     */
    setupMaintenanceTasks() {
        // Clean up expired data every hour
        setInterval(() => {
            try {
                this.systems.antiAbuse.saveToStorage();
                this.systems.freeGames.saveToStorage();
            } catch (error) {
                console.warn('Maintenance task failed:', error);
            }
        }, 3600000); // 1 hour
    }

    /**
     * Verify system integration
     * @private
     */
    async verifySystemIntegration() {
        // Ensure all systems are properly connected
        const checks = [
            () => this.systems.identity.currentPlayer !== null,
            () => this.systems.freeGames.playerCredits !== null,
            () => this.systems.antiAbuse.ipCache !== null
        ];

        for (const check of checks) {
            if (!check()) {
                throw new Error('System integration verification failed');
            }
        }
        
        this.systemStatus.freeGames = 'ready';
        this.systemStatus.security = 'ready';
    }

    /**
     * Generate unique session ID
     * @private
     */
    generateSessionId() {
        return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Get system health status
     */
    getSystemHealth() {
        return {
            overall: this.systemStatus.overall,
            systems: this.systemStatus,
            initialized: this.initialized,
            playerCount: this.systems.freeGames.playerCredits?.size || 0,
            securityMetrics: this.systems.antiAbuse.getSecurityMetrics()
        };
    }
}

// Export singleton instance
export const unifiedManager = new UnifiedManager();
