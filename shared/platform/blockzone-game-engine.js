/**
 * BlockZone Game Engine v2.0
 * Enhanced platform infrastructure for gaming and educational content
 * Phase 2: Platform Infrastructure
 */

// Core engine systems
import { TournamentManager } from '../tournaments/tournament-manager.js';
import { ChallengeManager } from '../tournaments/challenge-manager.js';
import { UserManager } from './user-manager.js';
import { AnalyticsEngine } from './analytics-engine.js';
import { PaymentProcessor } from '../economics/payment-processor.js';

// Game registry and management
import { GameRegistry } from './game-registry.js';
import { SessionManager } from './session-manager.js';

// Web3 integration
import { Web3Manager } from '../web3/web3-manager.js';
import { SmartContractManager } from '../web3/smart-contract-manager.js';

/**
 * BlockZone Game Engine - Core Platform Infrastructure
 * Manages all games, tournaments, challenges, users, and analytics
 */
export class BlockZoneGameEngine {
    constructor() {
        // Core systems
        this.games = new GameRegistry();
        this.tournaments = new TournamentManager();
        this.challenges = new ChallengeManager();
        this.users = new UserManager();
        this.analytics = new AnalyticsEngine();
        this.payments = new PaymentProcessor();
        
        // Platform systems
        this.sessions = new SessionManager();
        this.web3 = new Web3Manager();
        this.contracts = new SmartContractManager();
        
        // State management
        this.isInitialized = false;
        this.currentUser = null;
        this.activeGame = null;
        this.platformConfig = {
            tournamentEntryFee: 0.25, // USDC.E
            challengeFees: {
                quick: 1.00,
                highRoller: 5.00
            },
            prizeDistribution: {
                championship: 0.90, // 90% to winners
                challenge: 0.85,    // 85% to winner
                platform: 0.10      // 10% platform fee
            }
        };
        
        // Event system
        this.eventListeners = new Map();
        
        console.log('🚀 BlockZone Game Engine v2.0 initialized');
    }

    /**
     * Initialize the game engine
     */
    async initialize() {
        try {
            console.log('🔄 Initializing BlockZone Game Engine...');
            
            // Initialize core systems
            await this.users.initialize();
            await this.web3.initialize();
            await this.contracts.initialize();
            await this.analytics.initialize();
            
            // Register default games
            await this.registerDefaultGames();
            
            // Start background services
            this.startBackgroundServices();
            
            this.isInitialized = true;
            console.log('✅ BlockZone Game Engine ready');
            
            // Emit initialization event
            this.emit('engine:initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize BlockZone Game Engine:', error);
            throw error;
        }
    }

    /**
     * Register a new game with the platform
     */
    async registerGame(gameId, gameConfig) {
        try {
            const game = await this.games.register(gameId, gameConfig);
            console.log(`🎮 Registered game: ${gameId}`);
            
            // Set up game-specific systems
            await this.setupGameSystems(game);
            
            // Emit game registration event
            this.emit('game:registered', { gameId, game });
            
            return game;
        } catch (error) {
            console.error(`❌ Failed to register game ${gameId}:`, error);
            throw error;
        }
    }

    /**
     * Start a game session
     */
    async startGame(gameId, userId, options = {}) {
        try {
            // Validate game exists
            const game = this.games.get(gameId);
            if (!game) {
                throw new Error(`Game ${gameId} not found`);
            }

            // Create or resume session
            const session = await this.sessions.createSession(gameId, userId, options);
            
            // Initialize game instance
            const gameInstance = await game.createInstance(session);
            
            // Track analytics
            this.analytics.trackGameStart(gameId, userId, options);
            
            // Set as active game
            this.activeGame = gameInstance;
            
            console.log(`🎮 Started game session: ${gameId} for user ${userId}`);
            
            // Emit game start event
            this.emit('game:started', { gameId, userId, session, gameInstance });
            
            return gameInstance;
        } catch (error) {
            console.error(`❌ Failed to start game ${gameId}:`, error);
            throw error;
        }
    }

    /**
     * Submit a game score
     */
    async submitScore(gameId, userId, score, proof = null) {
        try {
            // Validate score
            if (typeof score !== 'number' || score < 0) {
                throw new Error('Invalid score');
            }

            // Record score in session
            const session = this.sessions.getCurrentSession();
            if (!session) {
                throw new Error('No active game session');
            }

            // Validate score with game engine
            const game = this.games.get(gameId);
            const isValidScore = await game.validateScore(score, proof);
            if (!isValidScore) {
                throw new Error('Score validation failed');
            }

            // Record score
            await this.sessions.recordScore(session.id, score, proof);
            
            // Track analytics
            this.analytics.trackScore(gameId, userId, score);
            
            // Check for tournament/challenge participation
            await this.checkTournamentParticipation(gameId, userId, score);
            await this.checkChallengeParticipation(gameId, userId, score);
            
            console.log(`📊 Score submitted: ${score} for game ${gameId}`);
            
            // Emit score submission event
            this.emit('score:submitted', { gameId, userId, score, proof });
            
            return { success: true, score, sessionId: session.id };
        } catch (error) {
            console.error(`❌ Failed to submit score:`, error);
            throw error;
        }
    }

    /**
     * Create a championship tournament
     */
    async createChampionship(duration, entryFee = null) {
        try {
            const fee = entryFee || this.platformConfig.tournamentEntryFee;
            const championship = await this.tournaments.createChampionship(duration, fee);
            
            console.log(`🏆 Created championship: ${championship.id}`);
            
            // Emit championship creation event
            this.emit('championship:created', championship);
            
            return championship;
        } catch (error) {
            console.error('❌ Failed to create championship:', error);
            throw error;
        }
    }

    /**
     * Join a championship tournament
     */
    async joinChampionship(championshipId, userId) {
        try {
            // Process entry fee payment
            const championship = this.tournaments.get(championshipId);
            const payment = await this.payments.processEntryFee(userId, championship.entryFee);
            
            // Register user for championship
            await this.tournaments.joinChampionship(championshipId, userId);
            
            // Track analytics
            this.analytics.trackChampionshipJoin(championshipId, userId);
            
            console.log(`🎯 User ${userId} joined championship ${championshipId}`);
            
            // Emit championship join event
            this.emit('championship:joined', { championshipId, userId, payment });
            
            return { success: true, championshipId, payment };
        } catch (error) {
            console.error(`❌ Failed to join championship:`, error);
            throw error;
        }
    }

    /**
     * Create a friend challenge
     */
    async createChallenge(creatorId, gameId, fee, duration = 24) {
        try {
            // Validate fee amount
            const validFees = Object.values(this.platformConfig.challengeFees);
            if (!validFees.includes(fee)) {
                throw new Error('Invalid challenge fee amount');
            }

            // Process challenge creation fee
            const payment = await this.payments.processChallengeFee(creatorId, fee);
            
            // Create challenge
            const challenge = await this.challenges.createChallenge(creatorId, gameId, fee, duration);
            
            // Generate shareable link
            const challengeLink = this.challenges.generateShareableLink(challenge.id);
            
            console.log(`🔗 Created challenge: ${challenge.id} by user ${creatorId}`);
            
            // Track analytics
            this.analytics.trackChallengeCreation(creatorId, gameId, fee);
            
            // Emit challenge creation event
            this.emit('challenge:created', { challenge, challengeLink, payment });
            
            return { challenge, challengeLink, payment };
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
            const challenge = this.challenges.get(challengeId);
            if (!challenge) {
                throw new Error('Challenge not found');
            }

            // Process challenge acceptance fee
            const payment = await this.payments.processChallengeFee(challengerId, challenge.fee);
            
            // Accept challenge
            await this.challenges.acceptChallenge(challengeId, challengerId);
            
            console.log(`🎯 User ${challengerId} accepted challenge ${challengeId}`);
            
            // Track analytics
            this.analytics.trackChallengeAcceptance(challengeId, challengerId);
            
            // Emit challenge acceptance event
            this.emit('challenge:accepted', { challengeId, challengerId, payment });
            
            return { success: true, challengeId, payment };
        } catch (error) {
            console.error(`❌ Failed to accept challenge:`, error);
            throw error;
        }
    }

    /**
     * Resolve a challenge and distribute prizes
     */
    async resolveChallenge(challengeId, winnerId) {
        try {
            const challenge = this.challenges.get(challengeId);
            if (!challenge) {
                throw new Error('Challenge not found');
            }

            // Calculate prize distribution
            const totalPool = challenge.fee * challenge.participants.length;
            const winnerPrize = totalPool * this.platformConfig.prizeDistribution.challenge;
            const platformFee = totalPool * this.platformConfig.prizeDistribution.platform;

            // Process prize distribution
            const payout = await this.payments.distributeChallengePrizes(
                challengeId, 
                winnerId, 
                winnerPrize, 
                platformFee
            );

            // Mark challenge as resolved
            await this.challenges.resolveChallenge(challengeId, winnerId);
            
            console.log(`🏆 Challenge ${challengeId} resolved - Winner: ${winnerId}`);
            
            // Track analytics
            this.analytics.trackChallengeResolution(challengeId, winnerId, winnerPrize);
            
            // Emit challenge resolution event
            this.emit('challenge:resolved', { challengeId, winnerId, payout });
            
            return { success: true, winnerId, payout };
        } catch (error) {
            console.error(`❌ Failed to resolve challenge:`, error);
            throw error;
        }
    }

    /**
     * Get user profile and statistics
     */
    async getUserProfile(userId) {
        try {
            const profile = await this.users.getProfile(userId);
            const stats = await this.analytics.getUserStats(userId);
            const achievements = await this.users.getAchievements(userId);
            
            return {
                profile,
                stats,
                achievements
            };
        } catch (error) {
            console.error(`❌ Failed to get user profile:`, error);
            throw error;
        }
    }

    /**
     * Get platform analytics
     */
    async getPlatformAnalytics() {
        try {
            const analytics = await this.analytics.getPlatformStats();
            return analytics;
        } catch (error) {
            console.error('❌ Failed to get platform analytics:', error);
            throw error;
        }
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
    }

    /**
     * Private methods
     */
    async registerDefaultGames() {
        // Register Neon Drop game
        await this.registerGame('neondrop', {
            name: 'Neon Drop',
            version: '2.0',
            entryPoint: '/games/neondrop/',
            config: {
                tickRate: 16.67, // 60fps
                maxScore: 999999,
                antiCheat: true
            }
        });

        // Future games can be registered here
        console.log('🎮 Default games registered');
    }

    async setupGameSystems(game) {
        // Set up game-specific analytics
        await this.analytics.setupGameTracking(game.id);
        
        // Set up game-specific payment processing
        await this.payments.setupGamePayments(game.id);
        
        console.log(`⚙️ Game systems configured for ${game.id}`);
    }

    async checkTournamentParticipation(gameId, userId, score) {
        const activeChampionships = this.tournaments.getActiveChampionships();
        
        for (const championship of activeChampionships) {
            if (championship.gameId === gameId && championship.participants.includes(userId)) {
                await this.tournaments.updateScore(championship.id, userId, score);
            }
        }
    }

    async checkChallengeParticipation(gameId, userId, score) {
        const activeChallenges = this.challenges.getActiveChallenges();
        
        for (const challenge of activeChallenges) {
            if (challenge.gameId === gameId && challenge.participants.includes(userId)) {
                await this.challenges.updateScore(challenge.id, userId, score);
            }
        }
    }

    startBackgroundServices() {
        // Start tournament management
        this.tournaments.startBackgroundServices();
        
        // Start challenge management
        this.challenges.startBackgroundServices();
        
        // Start analytics collection
        this.analytics.startBackgroundServices();
        
        console.log('🔄 Background services started');
    }
}

// Export singleton instance
export const blockzoneEngine = new BlockZoneGameEngine();

// Make globally accessible
window.blockzoneEngine = blockzoneEngine; 