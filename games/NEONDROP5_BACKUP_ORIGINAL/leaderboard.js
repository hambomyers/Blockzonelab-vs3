/**
 * leaderboard.js - Professional Leaderboard System
 *
 * This is what AAA games use BEFORE blockchain
 * - Works without wallets
 * - Validates scores server-side
 * - Ready to upgrade to blockchain later
 */

export class LeaderboardSystem {
    constructor() {
        // Update this to your actual backend URL when ready
        // For now, let's make it work without backend
        this.API_URL = window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api'
            : 'https://leaderboard.hambomyers.workers.dev/api';
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
    }

    /**
     * Submit score with anti-cheat proof
     */
    async submitScore(scoreData) {
        // scoreData comes from our scoring.js system
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
     */
    async getLeaderboard(period = 'daily', limit = 100) {
        const cacheKey = `${period}-${limit}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const response = await fetch(
                `${this.API_URL}/leaderboard?period=${period}&limit=${limit}`
            );

            const data = await response.json();

            // Transform for display
            const leaderboard = data.scores.map((entry, index) => ({
                rank: index + 1,
                displayName: entry.display_name || `Player ${entry.player_id.slice(0, 6)}`,
                score: entry.score,
                metrics: entry.metrics,
                isMe: entry.player_id === this.getPlayerId(),
                player_id: entry.player_id, // Add player_id for compatibility
                // Future: will have wallet address here
                wallet: entry.wallet_address || null
            }));

            // Cache it
            this.cache.set(cacheKey, {
                data: leaderboard,
                timestamp: Date.now()
            });

            return leaderboard;

        } catch (error) {
            // Failed to fetch leaderboard - return empty array
            return [];
        }
    }

    /**
     * Alias for getLeaderboard - used by game-over-sequence.js
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
