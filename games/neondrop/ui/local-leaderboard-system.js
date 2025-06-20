/**
 * Local Leaderboard System - Mirrors Cloudflare KV Structure
 * Designed for seamless backend integration later
 */

export class LocalLeaderboardSystem {
    constructor() {
        this.storagePrefix = 'neon_drop_';
        this.maxEntries = 100; // Keep top 100 locally
        
        // Initialize if first time
        this.initializeStorage();
    }

    initializeStorage() {
        const keys = ['players', 'scores', 'tournaments', 'sessions', 'rewards'];
        
        keys.forEach(key => {
            if (!localStorage.getItem(this.storagePrefix + key)) {
                localStorage.setItem(this.storagePrefix + key, JSON.stringify([]));
            }
        });
    }

    // ===================================
    // PLAYER MANAGEMENT (matches KV PLAYERS)
    // ===================================

    async getPlayer(playerId) {
        const players = this.getStorageData('players');
        return players.find(p => p.id === playerId) || null;
    }

    async createPlayer(playerData) {
        const players = this.getStorageData('players');
        
        const newPlayer = {
            id: playerData.id || this.generatePlayerId(),
            displayName: playerData.displayName || 'Anonymous Player',
            tier: playerData.tier || 'anonymous',
            email: playerData.email || null,
            walletAddress: playerData.walletAddress || null,
            avatar: playerData.avatar || this.generateAvatar(),
            stats: {
                gamesPlayed: 0,
                totalScore: 0,
                bestScore: 0,
                averageScore: 0,
                totalEarnings: 0,
                lastPlayed: null
            },
            created: Date.now(),
            updated: Date.now()
        };

        players.push(newPlayer);
        this.setStorageData('players', players);
        
        return newPlayer;
    }

    async updatePlayerStats(playerId, newScore) {
        const players = this.getStorageData('players');
        const playerIndex = players.findIndex(p => p.id === playerId);
        
        if (playerIndex === -1) return null;

        const player = players[playerIndex];
        player.stats.gamesPlayed += 1;
        player.stats.totalScore += newScore;
        player.stats.bestScore = Math.max(player.stats.bestScore, newScore);
        player.stats.averageScore = Math.round(player.stats.totalScore / player.stats.gamesPlayed);
        player.stats.lastPlayed = Date.now();
        player.updated = Date.now();

        players[playerIndex] = player;
        this.setStorageData('players', players);

        return player;
    }

    // ===================================
    // SCORE MANAGEMENT (matches KV SCORES)
    // ===================================

    async submitScore(scoreData) {
        const scores = this.getStorageData('scores');
        
        const newScore = {
            id: this.generateScoreId(),
            playerId: scoreData.playerId,
            playerName: scoreData.playerName || 'Anonymous',
            score: scoreData.score,
            timestamp: Date.now(),
            gameVersion: '1.0',
            metrics: {
                duration: scoreData.duration || 0,
                moves: scoreData.moves || 0,
                efficiency: scoreData.efficiency || 0
            },
            verified: true
        };

        scores.push(newScore);
        
        // Keep only top scores to manage storage
        scores.sort((a, b) => b.score - a.score);
        if (scores.length > this.maxEntries) {
            scores.splice(this.maxEntries);
        }

        this.setStorageData('scores', scores);

        // Update player stats
        await this.updatePlayerStats(scoreData.playerId, scoreData.score);

        return newScore;
    }

    async getLeaderboard(limit = 20) {
        const scores = this.getStorageData('scores');
        
        // Group by player and get best score for each
        const playerBests = {};
        scores.forEach(score => {
            if (!playerBests[score.playerId] || score.score > playerBests[score.playerId].score) {
                playerBests[score.playerId] = score;
            }
        });

        // Convert to array and sort
        const leaderboard = Object.values(playerBests)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((score, index) => ({
                rank: index + 1,
                ...score
            }));

        return leaderboard;
    }

    async getPlayerRank(playerId) {
        const leaderboard = await this.getLeaderboard(this.maxEntries);
        const playerEntry = leaderboard.find(entry => entry.playerId === playerId);
        
        return playerEntry ? playerEntry.rank : null;
    }

    // ===================================
    // TOURNAMENTS (matches KV TOURNAMENTS)
    // ===================================

    async getDailyTournament() {
        const today = this.getTodayString();
        const tournaments = this.getStorageData('tournaments');
        
        let tournament = tournaments.find(t => t.date === today);
        
        if (!tournament) {
            tournament = {
                id: `daily_${today}`,
                date: today,
                name: `Daily Challenge - ${new Date().toLocaleDateString()}`,
                entries: [],
                prizePool: 1000,
                status: 'active',
                startTime: new Date().setHours(0, 0, 0, 0),
                endTime: new Date().setHours(23, 59, 59, 999)
            };
            
            tournaments.push(tournament);
            this.setStorageData('tournaments', tournaments);
        }

        return tournament;
    }

    // ===================================
    // REWARDS (matches KV REWARDS)
    // ===================================

    async calculateRewards(score, rank) {
        const baseReward = Math.floor(score / 10);
        let multiplier = 1;

        // Rank bonuses
        if (rank === 1) multiplier = 3;
        else if (rank <= 3) multiplier = 2.5;
        else if (rank <= 10) multiplier = 2;
        else if (rank <= 50) multiplier = 1.5;

        // Score bonuses
        if (score > 2000) multiplier *= 1.5;
        else if (score > 1000) multiplier *= 1.2;

        const totalReward = Math.floor(baseReward * multiplier);

        return {
            baseReward,
            multiplier,
            totalReward,
            reason: this.getRewardReason(rank, score)
        };
    }

    getRewardReason(rank, score) {
        if (rank === 1) return '🏆 First Place Bonus!';
        if (rank <= 3) return '🥉 Top 3 Bonus!';
        if (rank <= 10) return '🌟 Top 10 Bonus!';
        if (score > 2000) return '💎 High Score Bonus!';
        if (score > 1000) return '⭐ Good Score Bonus!';
        return '🎮 Participation Reward';
    }

    // ===================================
    // UTILITY METHODS
    // ===================================

    getStorageData(key) {
        try {
            const data = localStorage.getItem(this.storagePrefix + key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`Error reading ${key}:`, error);
            return [];
        }
    }

    setStorageData(key, data) {
        try {
            localStorage.setItem(this.storagePrefix + key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
        }
    }

    generatePlayerId() {
        return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateScoreId() {
        return `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateAvatar() {
        const avatars = ['🎮', '🚀', '⭐', '💎', '🎯', '🌟', '🔥', '⚡', '🎲', '🏆'];
        return avatars[Math.floor(Math.random() * avatars.length)];
    }

    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    // ===================================
    // CURRENT PLAYER MANAGEMENT
    // ===================================

    async getCurrentPlayer() {
        let playerId = localStorage.getItem(this.storagePrefix + 'current_player_id');
        
        if (!playerId) {
            // Create new anonymous player
            const newPlayer = await this.createPlayer({
                displayName: this.generateAnonymousName()
            });
            playerId = newPlayer.id;
            localStorage.setItem(this.storagePrefix + 'current_player_id', playerId);
        }

        return await this.getPlayer(playerId);
    }

    generateAnonymousName() {
        const adjectives = ['Swift', 'Bold', 'Epic', 'Neon', 'Cyber', 'Ultra', 'Mega', 'Super'];
        const nouns = ['Player', 'Gamer', 'Ace', 'Pro', 'Master', 'Legend', 'Hero', 'Champion'];
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 1000);
        
        return `${adj}${noun}${num}`;
    }

    // ===================================
    // EXPORT DATA (for future backend sync)
    // ===================================

    exportAllData() {
        return {
            players: this.getStorageData('players'),
            scores: this.getStorageData('scores'),
            tournaments: this.getStorageData('tournaments'),
            sessions: this.getStorageData('sessions'),
            rewards: this.getStorageData('rewards'),
            exported: Date.now()
        };
    }

    // Clear all data (for testing)
    clearAllData() {
        const keys = ['players', 'scores', 'tournaments', 'sessions', 'rewards', 'current_player_id'];
        keys.forEach(key => {
            localStorage.removeItem(this.storagePrefix + key);
        });
        this.initializeStorage();
    }
}
