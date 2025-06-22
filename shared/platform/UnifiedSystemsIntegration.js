/**
 * UnifiedSystemsIntegration.js - Complete Integration Helper
 * Drop-in replacement for all legacy systems in BlockZone Lab
 * Seamlessly connects new unified systems to existing codebase
 */

import { UnifiedPlayerSystem } from './systems/UnifiedPlayerSystem.js';
import { UnifiedTournamentSystem } from './systems/UnifiedTournamentSystem.js';
import { UnifiedPlayerCard } from '../ui/UnifiedPlayerCard.js';

export class UnifiedSystemsIntegration {
    constructor(config = {}) {
        this.config = {
            enableLogging: true,
            enableLegacySupport: true,
            enableAutoMigration: true,
            ...config
        };
        
        // Initialize unified systems
        this.playerSystem = new UnifiedPlayerSystem(this.config.player);
        this.tournamentSystem = new UnifiedTournamentSystem(this.config.tournament);
        this.playerCard = new UnifiedPlayerCard(this.playerSystem, this.tournamentSystem);
        
        // Legacy compatibility layer
        this.legacyMappings = new Map();
        this.isInitialized = false;
        
        // Event tracking
        this.events = {
            initialization: [],
            playerEvents: [],
            tournamentEvents: [],
            uiEvents: []
        };
        
        this.log('🚀 Unified Systems Integration initialized');
    }

    /**
     * Initialize all unified systems and set up legacy compatibility
     */
    async initialize() {
        try {
            this.log('🔄 Initializing unified systems...');
            
            // Initialize core systems
            await this.playerSystem.initialize();
            await this.tournamentSystem.initialize();
            
            // Set up legacy compatibility
            this.setupLegacyCompatibility();
            
            // Set up global references for existing code
            this.setupGlobalReferences();
            
            // Set up event bridging
            this.setupEventBridging();
            
            // Migrate existing data if needed
            if (this.config.enableAutoMigration) {
                await this.migrateExistingData();
            }
            
            this.isInitialized = true;
            this.log('✅ Unified systems fully initialized');
            
            return {
                success: true,
                playerSystem: this.playerSystem,
                tournamentSystem: this.tournamentSystem,
                playerCard: this.playerCard
            };
        } catch (error) {
            this.log('❌ Failed to initialize unified systems:', error);
            throw new Error(`Unified systems initialization failed: ${error.message}`);
        }
    }

    /**
     * Set up cross-system event handlers
     */
    setupEventHandlers() {
        // Player card events
        document.addEventListener('card:start-game', () => {
            this.startGame();
        });
        
        document.addEventListener('card:play-again', () => {
            this.startGame();
        });
        
        document.addEventListener('card:connect-wallet', () => {
            this.connectWallet();
        });
        
        // Player system events
        this.playerSystem.on('player:created', (data) => {
            console.log('🎮 New player created:', data.player.displayName);
        });
        
        this.playerSystem.on('player:level-up', (data) => {
            console.log(`🎉 Level up! ${data.player.displayName} is now level ${data.newLevel}`);
        });
        
        // Tournament system events
        this.tournamentSystem.on('tournament:score-submitted', (data) => {
            console.log(`📊 Score submitted: ${data.score} (Rank #${data.rank})`);
        });
        
        this.tournamentSystem.on('tournament:leaderboard-updated', (data) => {
            console.log('🏆 Leaderboard updated');
        });
    }

    /**
     * Start a new game
     */
    async startGame() {
        try {
            const player = await this.playerSystem.getPlayer();
            if (!player) {
                await this.playerCard.showWelcome();
                return;
            }
            
            // Check if player can play (has credits, etc.)
            const canPlay = await this.checkGameAccess(player);
            if (!canPlay) {
                await this.playerCard.showPaymentModal();
                return;
            }
            
            // Initialize game state
            this.gameState = {
                isPlaying: true,
                currentScore: 0,
                gameStartTime: Date.now()
            };
            
            // Update player activity
            await this.playerSystem.updateActivity();
            
            // Increment games played
            await this.playerSystem.updatePlayer({
                totalGamesPlayed: player.totalGamesPlayed + 1
            });
            
            // Hide player card
            await this.playerCard.hide();
            
            // Start actual game logic (this would be game-specific)
            this.runGameLoop();
            
        } catch (error) {
            console.error('Failed to start game:', error);
            alert('Failed to start game. Please try again.');
        }
    }

    /**
     * Check if player has access to play games
     */
    async checkGameAccess(player) {
        const tournament = this.tournamentSystem.getCurrentTournament();
        
        // Free credits check
        if (player.balances.freeCredits > 0) {
            return true;
        }
        
        // Paid access check
        if (tournament && tournament.entryFee > 0) {
            return player.balances.usdc >= tournament.entryFee ||
                   player.balances.quarters >= tournament.entryFee;
        }
        
        return false;
    }

    /**
     * End current game and submit score
     */
    async endGame(finalScore) {
        if (!this.gameState.isPlaying) return;
        
        this.gameState.isPlaying = false;
        this.gameState.currentScore = finalScore;
        
        try {
            const player = await this.playerSystem.getPlayer();
            const gameStats = {
                duration: Date.now() - this.gameState.gameStartTime,
                finalScore
            };
            
            // Award experience based on score
            const xpGained = Math.floor(finalScore / 100);
            if (xpGained > 0) {
                await this.playerSystem.addExperience(xpGained);
            }
            
            // Deduct game cost
            if (player.balances.freeCredits > 0) {
                await this.playerSystem.updateBalance('freeCredits', -1);
            } else {
                const tournament = this.tournamentSystem.getCurrentTournament();
                if (tournament && tournament.entryFee > 0) {
                    await this.playerSystem.updateBalance('usdc', -tournament.entryFee);
                }
            }
            
            // Submit to tournament
            let tournamentResult = null;
            try {
                tournamentResult = await this.tournamentSystem.submitScore(
                    player.id, 
                    finalScore, 
                    {
                        playerName: player.displayName,
                        gameData: gameStats
                    }
                );
            } catch (error) {
                console.warn('Failed to submit tournament score:', error);
            }
            
            // Update player game stats
            await this.playerSystem.setGameStats('neondrop', {
                lastScore: finalScore,
                gamesPlayed: (await this.playerSystem.getGameStats('neondrop'))?.gamesPlayed + 1 || 1,
                totalScore: (await this.playerSystem.getGameStats('neondrop'))?.totalScore + finalScore || finalScore
            });
            
            // Show game results
            await this.playerCard.showGameResults(finalScore, gameStats);
            
        } catch (error) {
            console.error('Failed to end game properly:', error);
            // Show results anyway
            await this.playerCard.showGameResults(finalScore);
        }
    }

    /**
     * Placeholder game loop (replace with actual game logic)
     */
    runGameLoop() {
        console.log('🎮 Game started! Implement your game logic here.');
        
        // Example: Simulate a game that lasts 30 seconds
        const gameTimer = setTimeout(async () => {
            const randomScore = Math.floor(Math.random() * 10000);
            await this.endGame(randomScore);
        }, 30000);
        
        // In a real game, you'd clear this timer when the game ends naturally
        this.gameState.gameTimer = gameTimer;
    }

    /**
     * Connect wallet functionality
     */
    async connectWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                if (accounts.length > 0) {
                    await this.playerSystem.connectWallet(accounts[0]);
                    this.playerCard.showNotification('✅ Wallet connected successfully!');
                } else {
                    throw new Error('No accounts available');
                }
            } else {
                throw new Error('No Web3 wallet detected');
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.playerCard.showNotification('❌ Failed to connect wallet');
        }
    }

    /**
     * Show player dashboard
     */
    async showDashboard() {
        await this.playerCard.showPlayerDashboard();
    }

    /**
     * Show leaderboard
     */
    async showLeaderboard() {
        await this.playerCard.showLeaderboard();
    }

    /**
     * Get current player
     */
    async getPlayer() {
        return await this.playerSystem.getPlayer();
    }

    /**
     * Get current tournament
     */
    getCurrentTournament() {
        return this.tournamentSystem.getCurrentTournament();
    }

    /**
     * Cleanup all systems
     */
    destroy() {
        if (this.gameState.gameTimer) {
            clearTimeout(this.gameState.gameTimer);
        }
        
        if (this.playerCard) {
            this.playerCard.destroy();
        }
        
        if (this.playerSystem) {
            this.playerSystem.destroy();
        }
        
        if (this.tournamentSystem) {
            this.tournamentSystem.destroy();
        }
        
        console.log('🛑 Unified Systems Integration destroyed');
    }
}

export default UnifiedSystemsIntegration;
