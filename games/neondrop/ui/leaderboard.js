/**
 * leaderboard.js - Professional Leaderboard System for Sonic Labs Integration
 *
 * Scalable leaderboard system that works:
 * - Without wallets (anonymous play)
 * - With Sonic Labs wallet integration
 * - Ready for cross-game leaderboards
 */

export class LeaderboardSystem {
    constructor() {
        // Backend endpoints - ready for Sonic Labs integration
        this.API_URL = this.getAPIEndpoint();
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
        
        // Player identity - will integrate with Sonic Labs wallet
        this.playerId = this.getPlayerId();
        this.isWalletConnected = false; // Future: detect Sonic Labs wallet
    }

    /**
     * Get the appropriate API endpoint based on environment
     */
    getAPIEndpoint() {
        const hostname = window.location.hostname;
        
        // Always use your Cloudflare Worker for now
        return 'https://blockzone-api.hambomyers.workers.dev/api';
    }

    /**
     * Submit score with anti-cheat proof
     */
    async submitScore(scoreData) {
        // scoreData comes from our gameplay/scoring.js system
        const submission = {
            score: scoreData.score,
            replay_hash: scoreData.finalHash,
            metrics: {
                apm: scoreData.metrics.apm,
                pps: scoreData.metrics.pps,
                time: scoreData.metrics.gameTime
            },
            // Anonymous player ID (stored in localStorage)
            player_id: this.getPlayerId(),
            timestamp: Date.now()
        };

        try {
            const response = await fetch(`${this.API_URL}/scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submission)
            });

            const result = await response.json();

            if (result.verified) {
                return {
                    success: true,
                    rank: result.rank,
                    percentile: result.percentile,
                    isHighScore: result.is_high_score
                };
            } else {
                // Server rejected score as suspicious - fail silently
                return { success: false, reason: result.reason };
            }

        } catch (error) {
            // Score submission failed - store offline for later sync
            this.storeOfflineScore(submission);
            return { success: false, offline: true };
        }
    }

    /**
     * Get leaderboard (cached for performance)
     * Supports up to 1000 entries for competitive gaming
     */
    async getLeaderboard(period = 'daily', limit = 1000) {
        const cacheKey = `${period}-${limit}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            // For large requests, use different endpoint optimizations
            const endpoint = limit > 100 
                ? `${this.API_URL}/leaderboard/large`
                : `${this.API_URL}/leaderboard`;
                
            const response = await fetch(
                `${endpoint}?period=${period}&limit=${limit}&game=neon_drop`
            );

            const data = await response.json();

            // Transform for display
            const leaderboard = data.scores.map((entry, index) => ({
                rank: index + 1,
                displayName: entry.display_name || `Player ${entry.player_id.slice(0, 6)}`,
                score: entry.score,
                metrics: entry.metrics,
                isMe: entry.player_id === this.getPlayerId(),
                player_id: entry.player_id,
                // Future Sonic Labs integration
                wallet: entry.wallet_address || null,
                sonicAddress: entry.sonic_address || null
            }));

            // Cache large requests for longer (5 minutes vs 30 seconds)
            const cacheTime = limit > 100 ? 300000 : this.cacheTimeout;
            this.cache.set(cacheKey, {
                data: leaderboard,
                timestamp: Date.now()
            });

            return leaderboard;

        } catch (error) {
            // Backend unavailable - return empty leaderboard
            console.log('Backend unavailable, returning empty leaderboard');
            return [];
        }
    }

    /**
     * Alias for getLeaderboard - used by ui/game-over-sequence.js
     */
    async getTopScores(limit = 10) {
        // Try to get from stored local scores first
        const stored = localStorage.getItem('neondrop5-scores');
        if (stored) {
            try {
                const scores = JSON.parse(stored);
                return scores.sort((a, b) => b.score - a.score).slice(0, limit);
            } catch (e) {
                // Fall through to server request
            }
        }

        // Fallback to server leaderboard
        return await this.getLeaderboard('daily', limit);
    }

    /**
     * Get player stats
     */
    async getMyStats() {
        const playerId = this.getPlayerId();

        try {
            const response = await fetch(`${this.API_URL}/players/${playerId}/stats`);
            const stats = await response.json();

            return {
                highScore: stats.high_score,
                gamesPlayed: stats.games_played,
                currentRank: stats.current_rank,
                percentile: stats.percentile,
                avgScore: stats.avg_score,
                bestMetrics: stats.best_metrics
            };

        } catch (error) {
            // Failed to fetch stats - return null
            return null;
        }
    }

    /**
     * Anonymous player ID (upgrades to wallet later)
     */
    getPlayerId() {
        let playerId = localStorage.getItem('neon_player_id');

        if (!playerId) {
            // Generate anonymous ID
            playerId = 'anon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('neon_player_id', playerId);
        }

        return playerId;
    }

    /**
     * Store score offline to sync later
     */
    storeOfflineScore(submission) {
        const offline = JSON.parse(localStorage.getItem('offline_scores') || '[]');
        offline.push(submission);

        // Keep only last 10 scores
        if (offline.length > 10) {
            offline.shift();
        }

        localStorage.setItem('offline_scores', JSON.stringify(offline));
    }

    /**
     * Sync offline scores when connection returns
     */
    async syncOfflineScores() {
        const offline = JSON.parse(localStorage.getItem('offline_scores') || '[]');

        if (offline.length === 0) return;

        for (const score of offline) {
            await this.submitScore(score);
        }

        localStorage.removeItem('offline_scores');
    }

    /**
     * Future: Upgrade anonymous account to wallet
     */
    async upgradeToWallet(walletAddress) {
        const playerId = this.getPlayerId();

        try {
            const response = await fetch(`${this.API_URL}/players/${playerId}/upgrade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet_address: walletAddress })
            });

            const result = await response.json();

            if (result.success) {
                // All anonymous scores now linked to wallet
                localStorage.setItem('wallet_linked', 'true');
                return true;
            }

        } catch (error) {
            // Failed to link wallet - return false
        }

        return false;
    }

    /**
     * Generate mock leaderboard data for development
     */
    getMockLeaderboard(limit = 100) {
        const mockPlayers = [
            'HAMBO', 'CRYPTOKING', 'TETRISGOD', 'SONICFAN', 'BLOCKMASTER',
            'NEONLORD', 'PUZZLEPRO', 'GAMEHERO', 'CHAMPION', 'LEGEND',
            'DROPKING', 'STACKPRO', 'LINEKING', 'GEOMANCER', 'CODEWIZ',
            'PIXELGOD', 'SYNTHWAVE', 'CYBERPUNK', 'MATRICES', 'GRIDLORD',
            'TETRAMAX', 'BLOCKZONE', 'NEONDROP', 'GLOWMASTER', 'LUMINARY'
        ];

        const mockData = [];
        const playerCount = Math.min(limit, 1000);
        
        for (let i = 0; i < playerCount; i++) {
            const baseScore = 50000 - (i * 500) + Math.floor(Math.random() * 1000);
            const score = Math.max(baseScore, 100);
            
            mockData.push({
                rank: i + 1,
                displayName: mockPlayers[i % mockPlayers.length] + (i >= mockPlayers.length ? (Math.floor(i / mockPlayers.length) + 1).toString() : ''),
                score: score,
                metrics: {
                    apm: Math.floor(Math.random() * 150) + 50,
                    pps: Math.floor(Math.random() * 5) + 1,
                    gameTime: Math.floor(Math.random() * 600000) + 60000
                },
                isMe: i === 0 && this.playerScore, // Make first entry the player if they just played
                player_id: `mock_player_${i}`,
                wallet: null,
                sonicAddress: null
            });
        }

        // If player just played, insert their score at the right position
        if (this.playerScore) {
            const playerEntry = {
                rank: 1,
                displayName: localStorage.getItem('neon_drop_username') || 'YOU',
                score: this.playerScore,
                metrics: { apm: 100, pps: 2, gameTime: 120000 },
                isMe: true,
                player_id: this.getPlayerId(),
                wallet: null,
                sonicAddress: null
            };

            // Insert player at correct rank position
            mockData.push(playerEntry);
            mockData.sort((a, b) => b.score - a.score);
            
            // Update ranks
            mockData.forEach((entry, index) => {
                entry.rank = index + 1;
            });
            
            // Keep only the requested limit
            mockData.splice(limit);
        }

        return mockData;
    }    /**
     * Get scores for the elegant leaderboard UI
     */
    async getScores(period = 'daily', limit = 50) {
        try {
            const leaderboard = await this.getLeaderboard(period, limit);
            
            // Transform to expected format for elegant leaderboard
            return leaderboard.map((entry, index) => ({
                player_name: entry.displayName || `Player ${index + 1}`,
                score: entry.score || 0,
                timestamp: Date.now() - (index * 3600000), // Mock timestamps
                rank: entry.rank || index + 1
            }));
        } catch (error) {
            console.error('Failed to get scores:', error);
            // Return mock data for development/demo
            return this.getMockScores();
        }
    }

    /**
     * Mock scores for development and when API is unavailable
     */
    getMockScores() {
        const mockPlayers = [
            'NeonMaster', 'BlockChain', 'TetrisKing', 'CyberDrop', 'QuantumFall',
            'CodeBreaker', 'PixelPro', 'GameGuru', 'HighScore', 'TopPlayer'
        ];
        
        return mockPlayers.map((name, index) => ({
            player_name: name,
            score: Math.floor(Math.random() * 50000) + 10000 - (index * 2000),
            timestamp: Date.now() - (index * 3600000),
            rank: index + 1
        })).sort((a, b) => b.score - a.score);
    }

}

/**
 * Server-side validation (what your backend should do)
 *
 * async function validateScore(submission) {
 *     // 1. Check metrics are reasonable
 *     if (submission.metrics.apm > 300) return false; // Too fast
 *     if (submission.metrics.pps > 3.5) return false; // Inhuman
 *
 *     // 2. Check score matches time played
 *     const maxScorePerSecond = 100; // Adjust based on your game
 *     const maxPossibleScore = submission.metrics.time * maxScorePerSecond;
 *     if (submission.score > maxPossibleScore) return false;
 *
 *     // 3. Check replay hash is unique (prevent replay attacks)
 *     if (await db.replayExists(submission.replay_hash)) return false;
 *
 *     // 4. Statistical analysis
 *     const avgScoreForTime = await getAverageScoreForDuration(submission.metrics.time);
 *     const deviation = submission.score / avgScoreForTime;
 *     if (deviation > 3) return false; // 3x better than average is suspicious
 *
 *     return true;
 * }
 */



