/**
 * UnifiedTournamentSystem.js - Complete Tournament & Leaderboard Management
 * Consolidates all scattered tournament and leaderboard logic
 */

export class UnifiedTournamentSystem {
    constructor(options = {}) {
        this.apiClient = options.apiClient;
        this.storageBackend = options.storageBackend || 'cloudflare-kv';
        this.autoStartTournaments = options.autoStartTournaments !== false;
        
        this.currentTournament = null;
        this.leaderboardCache = [];
        this.playerStatsCache = new Map();
        this.eventListeners = new Map();
        
        this.init();
    }

    /**
     * Initialize the tournament system
     */
    async init() {
        console.log('🏆 Initializing Unified Tournament System');
        
        // Load current tournament
        await this.loadCurrentTournament();
        
        // Start auto-tournament management
        if (this.autoStartTournaments) {
            this.startTournamentScheduler();
        }
        
        console.log('✅ Tournament system ready');
    }

    /**
     * Load or create current tournament
     */
    async loadCurrentTournament() {
        try {
            // Try to load existing tournament for today
            const tournamentId = this.generateDailyTournamentId();
            this.currentTournament = await this.loadTournament(tournamentId);
            
            if (!this.currentTournament) {
                // Create new daily tournament
                this.currentTournament = await this.createDailyTournament();
            }
            
            // Load leaderboard
            await this.refreshLeaderboard();
            
        } catch (error) {
            console.error('Failed to load tournament:', error);
            // Create fallback tournament
            this.currentTournament = this.createFallbackTournament();
        }
    }

    /**
     * Create new daily tournament
     */
    async createDailyTournament() {
        const today = new Date();
        const tournamentId = this.generateDailyTournamentId();
        
        const tournament = {
            id: tournamentId,
            type: 'daily',
            name: `Daily Challenge - ${today.toLocaleDateString()}`,
            description: 'Compete for the daily high score!',
            startTime: this.getDayStart(today),
            endTime: this.getDayEnd(today),
            status: 'active',
            
            // Prize configuration
            prizePool: {
                type: 'fixed',
                amounts: {
                    1: 10, // 1st place gets 10 USDC
                    2: 5,  // 2nd place gets 5 USDC
                    3: 2   // 3rd place gets 2 USDC
                }
            },
            
            // Entry requirements
            entryFee: 0.25, // USDC
            freeEntriesPerDay: 1,
            
            // Game settings
            gameConfig: {
                maxAttempts: null, // Unlimited
                timeLimit: null,   // No time limit per game
                difficultyMultiplier: 1.0
            },
            
            // Stats
            totalPlayers: 0,
            totalGames: 0,
            highestScore: 0,
            
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        await this.saveTournament(tournament);
        console.log(`🎯 Created daily tournament: ${tournament.name}`);
        
        return tournament;
    }

    /**
     * Submit score to current tournament
     */
    async submitScore(playerId, score, metadata = {}) {
        if (!this.currentTournament) {
            throw new Error('No active tournament');
        }
        
        if (this.currentTournament.status !== 'active') {
            throw new Error('Tournament is not active');
        }
        
        const tournament = this.currentTournament;
        const now = Date.now();
        
        // Check if tournament is still valid
        if (now > tournament.endTime) {
            await this.endTournament();
            throw new Error('Tournament has ended');
        }
        
        // Create score entry
        const scoreEntry = {
            id: this.generateScoreId(),
            tournamentId: tournament.id,
            playerId,
            playerName: metadata.playerName || `Player-${playerId.slice(-4)}`,
            score,
            submittedAt: now,
            gameData: metadata.gameData || {},
            isVerified: true // In a real system, this would be validated
        };
        
        // Save score
        await this.saveScore(scoreEntry);
        
        // Update tournament stats
        tournament.totalGames++;
        if (score > tournament.highestScore) {
            tournament.highestScore = score;
        }
        tournament.updatedAt = now;
        
        await this.saveTournament(tournament);
        
        // Update leaderboard
        await this.refreshLeaderboard();
        
        // Get player's new ranking
        const playerStats = this.getPlayerStats(playerId);
        
        const result = {
            tournamentId: tournament.id,
            scoreId: scoreEntry.id,
            score,
            rank: playerStats?.rank || null,
            isNewBest: playerStats ? score > playerStats.previousBest : true,
            bestScore: playerStats?.bestScore || score,
            totalPlayers: this.leaderboardCache.length,
            ...playerStats
        };
        
        this.emit('tournament:score-submitted', result);
        console.log(`📊 Score submitted: ${score} (Rank #${result.rank})`);
        
        return result;
    }

    /**
     * Get current leaderboard
     */
    getLeaderboard(limit = 10) {
        return this.leaderboardCache.slice(0, limit);
    }

    /**
     * Get player statistics for current tournament
     */
    getPlayerStats(playerId) {
        return this.playerStatsCache.get(playerId) || null;
    }

    /**
     * Refresh leaderboard from storage
     */
    async refreshLeaderboard() {
        if (!this.currentTournament) return;
        
        try {
            // Load all scores for current tournament
            const scores = await this.loadTournamentScores(this.currentTournament.id);
            
            // Group by player and find best scores
            const playerBestScores = new Map();
            const playerGameCounts = new Map();
            
            scores.forEach(score => {
                const currentBest = playerBestScores.get(score.playerId);
                if (!currentBest || score.score > currentBest.score) {
                    playerBestScores.set(score.playerId, score);
                }
                
                const gameCount = playerGameCounts.get(score.playerId) || 0;
                playerGameCounts.set(score.playerId, gameCount + 1);
            });
            
            // Create leaderboard entries
            const leaderboardEntries = Array.from(playerBestScores.values())
                .sort((a, b) => b.score - a.score)
                .map((entry, index) => ({
                    rank: index + 1,
                    playerId: entry.playerId,
                    playerName: entry.playerName,
                    score: entry.score,
                    submittedAt: entry.submittedAt,
                    totalGames: playerGameCounts.get(entry.playerId) || 1
                }));
            
            this.leaderboardCache = leaderboardEntries;
            
            // Update player stats cache
            this.playerStatsCache.clear();
            leaderboardEntries.forEach(entry => {
                const previousBest = this.playerStatsCache.get(entry.playerId)?.bestScore || 0;
                this.playerStatsCache.set(entry.playerId, {
                    rank: entry.rank,
                    bestScore: entry.score,
                    previousBest,
                    totalGames: entry.totalGames,
                    lastPlayed: entry.submittedAt
                });
            });
            
            // Update tournament total players
            if (this.currentTournament.totalPlayers !== leaderboardEntries.length) {
                this.currentTournament.totalPlayers = leaderboardEntries.length;
                await this.saveTournament(this.currentTournament);
            }
            
            this.emit('tournament:leaderboard-updated', {
                tournament: this.currentTournament,
                leaderboard: this.leaderboardCache
            });
            
        } catch (error) {
            console.error('Failed to refresh leaderboard:', error);
        }
    }

    /**
     * Get current tournament
     */
    getCurrentTournament() {
        return this.currentTournament;
    }

    /**
     * End current tournament and award prizes
     */
    async endTournament() {
        if (!this.currentTournament || this.currentTournament.status !== 'active') {
            return;
        }
        
        const tournament = this.currentTournament;
        tournament.status = 'ended';
        tournament.endedAt = Date.now();
        
        // Award prizes to top players
        const winners = this.leaderboardCache.slice(0, 3);
        const prizeResults = [];
        
        for (const winner of winners) {
            const prizeAmount = tournament.prizePool.amounts[winner.rank];
            if (prizeAmount) {
                prizeResults.push({
                    rank: winner.rank,
                    playerId: winner.playerId,
                    playerName: winner.playerName,
                    score: winner.score,
                    prize: prizeAmount
                });
                
                // In a real system, this would credit the player's account
                console.log(`🏆 Prize awarded: ${winner.playerName} - Rank #${winner.rank} - ${prizeAmount} USDC`);
            }
        }
        
        tournament.winners = prizeResults;
        await this.saveTournament(tournament);
        
        this.emit('tournament:ended', {
            tournament,
            winners: prizeResults
        });
        
        console.log(`🏁 Tournament ended: ${tournament.name}`);
        
        // Start new tournament if auto-start is enabled
        if (this.autoStartTournaments) {
            setTimeout(() => this.loadCurrentTournament(), 1000);
        }
    }

    /**
     * Start tournament scheduler for automatic daily tournaments
     */
    startTournamentScheduler() {
        // Check every hour for new tournament needs
        setInterval(async () => {
            if (!this.currentTournament || Date.now() > this.currentTournament.endTime) {
                await this.loadCurrentTournament();
            }
        }, 60 * 60 * 1000); // 1 hour
        
        console.log('⏰ Tournament scheduler started');
    }

    /**
     * Load tournament by ID
     */
    async loadTournament(tournamentId) {
        try {
            if (this.apiClient) {
                return await this.apiClient.getTournament(tournamentId);
            } else {
                // Fallback to localStorage
                const data = localStorage.getItem(`tournament-${tournamentId}`);
                return data ? JSON.parse(data) : null;
            }
        } catch (error) {
            console.error('Failed to load tournament:', error);
            return null;
        }
    }

    /**
     * Save tournament to storage
     */
    async saveTournament(tournament) {
        try {
            if (this.apiClient) {
                await this.apiClient.saveTournament(tournament);
            } else {
                // Fallback to localStorage
                localStorage.setItem(`tournament-${tournament.id}`, JSON.stringify(tournament));
            }
        } catch (error) {
            console.error('Failed to save tournament:', error);
            throw error;
        }
    }

    /**
     * Load all scores for a tournament
     */
    async loadTournamentScores(tournamentId) {
        try {
            if (this.apiClient) {
                return await this.apiClient.getTournamentScores(tournamentId);
            } else {
                // Fallback to localStorage
                const scores = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(`score-${tournamentId}-`)) {
                        const scoreData = localStorage.getItem(key);
                        if (scoreData) {
                            scores.push(JSON.parse(scoreData));
                        }
                    }
                }
                return scores.sort((a, b) => b.submittedAt - a.submittedAt);
            }
        } catch (error) {
            console.error('Failed to load tournament scores:', error);
            return [];
        }
    }

    /**
     * Save score to storage
     */
    async saveScore(score) {
        try {
            if (this.apiClient) {
                await this.apiClient.saveScore(score);
            } else {
                // Fallback to localStorage
                localStorage.setItem(`score-${score.tournamentId}-${score.id}`, JSON.stringify(score));
            }
        } catch (error) {
            console.error('Failed to save score:', error);
            throw error;
        }
    }

    /**
     * Create fallback tournament for offline mode
     */
    createFallbackTournament() {
        return {
            id: 'fallback-' + Date.now(),
            type: 'practice',
            name: 'Practice Mode',
            description: 'Play without tournament features',
            startTime: Date.now(),
            endTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            status: 'active',
            prizePool: { type: 'none' },
            entryFee: 0,
            freeEntriesPerDay: 999,
            gameConfig: {},
            totalPlayers: 0,
            totalGames: 0,
            highestScore: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    /**
     * Generate daily tournament ID based on date
     */
    generateDailyTournamentId() {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
        return `daily-${dateString}`;
    }

    /**
     * Generate unique score ID
     */
    generateScoreId() {
        return 'score_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get start of day timestamp
     */
    getDayStart(date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        return start.getTime();
    }

    /**
     * Get end of day timestamp
     */
    getDayEnd(date) {
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return end.getTime();
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
        
        // Also emit as DOM event for global listening
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent(`tournament:${event}`, { detail: data }));
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.eventListeners.clear();
        this.playerStatsCache.clear();
        this.leaderboardCache = [];
        console.log('🛑 Unified Tournament System destroyed');
    }
}

export default UnifiedTournamentSystem;
