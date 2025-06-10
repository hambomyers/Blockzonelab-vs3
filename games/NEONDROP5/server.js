/**
 * server.js - Professional Game Backend
 *
 * npm install express cors helmet compression dotenv
 * npm install pg redis
 * npm install jsonwebtoken bcrypt
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Pool } from 'pg';
import Redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security & middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(compression());
app.use(express.json());

// Database connection
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Redis for caching (optional but recommended)
const redis = Redis.createClient({
    url: process.env.REDIS_URL
});
redis.connect();

// Rate limiting
const rateLimit = new Map();

function rateLimitMiddleware(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const limit = 100; // 100 requests
    const window = 60000; // per minute

    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, []);
    }

    const requests = rateLimit.get(ip).filter(time => now - time < window);

    if (requests.length >= limit) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    requests.push(now);
    rateLimit.set(ip, requests);
    next();
}

app.use(rateLimitMiddleware);

// ============ SCORE SUBMISSION ============
app.post('/api/scores', async (req, res) => {
    try {
        const { score, replay_hash, metrics, player_id, timestamp } = req.body;

        // Validate score
        const validation = await validateScore({ score, metrics, replay_hash });
        if (!validation.valid) {
            return res.status(400).json({
                verified: false,
                reason: validation.reason
            });
        }

        // Check for duplicate replay hash
        const duplicate = await db.query(
            'SELECT id FROM scores WHERE replay_hash = $1',
            [replay_hash]
        );

        if (duplicate.rows.length > 0) {
            return res.status(400).json({
                verified: false,
                reason: 'Duplicate submission'
            });
        }

        // Insert score
        const result = await db.query(
            `INSERT INTO scores
             (player_id, score, replay_hash, apm, pps, game_time, timestamp, verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [player_id, score, replay_hash, metrics.apm, metrics.pps,
             metrics.gameTime, timestamp, true]
        );

        // Calculate rank
        const rank = await calculateRank(score, 'daily');
        const percentile = await calculatePercentile(score, 'daily');

        // Check if it's a new high score for player
        const highScore = await db.query(
            'SELECT MAX(score) as high_score FROM scores WHERE player_id = $1',
            [player_id]
        );

        const isHighScore = score > (highScore.rows[0]?.high_score || 0);

        // Clear leaderboard cache
        await redis.del('leaderboard:daily:100');
        await redis.del('leaderboard:weekly:100');
        await redis.del('leaderboard:all:100');

        res.json({
            verified: true,
            score_id: result.rows[0].id,
            rank: rank,
            percentile: percentile,
            is_high_score: isHighScore
        });

    } catch (error) {
        // console.error('Score submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============ LEADERBOARD ============
app.get('/api/leaderboard', async (req, res) => {
    try {
        const { period = 'daily', limit = 100 } = req.query;

        // Check cache first
        const cacheKey = `leaderboard:${period}:${limit}`;
        const cached = await redis.get(cacheKey);

        if (cached) {
            return res.json(JSON.parse(cached));
        }

        // Get date range
        let dateFilter = '';
        const now = new Date();

        switch (period) {
            case 'daily':
                dateFilter = `WHERE s.timestamp > NOW() - INTERVAL '24 hours'`;
                break;
            case 'weekly':
                dateFilter = `WHERE s.timestamp > NOW() - INTERVAL '7 days'`;
                break;
            case 'all':
                dateFilter = '';
                break;
        }

        // Query leaderboard
        const result = await db.query(
            `SELECT
                s.player_id,
                p.display_name,
                p.wallet_address,
                s.score,
                s.apm,
                s.pps,
                s.game_time,
                s.timestamp,
                ROW_NUMBER() OVER (ORDER BY s.score DESC) as rank
             FROM scores s
             JOIN players p ON s.player_id = p.id
             ${dateFilter}
             ORDER BY s.score DESC
             LIMIT $1`,
            [limit]
        );

        const leaderboard = {
            period: period,
            updated_at: now.toISOString(),
            scores: result.rows
        };

        // Cache for 30 seconds
        await redis.setex(cacheKey, 30, JSON.stringify(leaderboard));

        res.json(leaderboard);

    } catch (error) {
        // console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============ PLAYER STATS ============
app.get('/api/players/:playerId/stats', async (req, res) => {
    try {
        const { playerId } = req.params;

        // Ensure player exists
        await ensurePlayerExists(playerId);

        // Get stats
        const stats = await db.query(
            `SELECT
                COUNT(*) as games_played,
                MAX(score) as high_score,
                AVG(score)::INT as avg_score,
                MAX(apm) as best_apm,
                MAX(pps) as best_pps
             FROM scores
             WHERE player_id = $1`,
            [playerId]
        );

        // Get current rank
        const rank = await db.query(
            `WITH ranked_scores AS (
                SELECT player_id, MAX(score) as best_score
                FROM scores
                WHERE timestamp > NOW() - INTERVAL '24 hours'
                GROUP BY player_id
             )
             SELECT COUNT(*) + 1 as rank
             FROM ranked_scores
             WHERE best_score > (
                SELECT MAX(score)
                FROM scores
                WHERE player_id = $1
                AND timestamp > NOW() - INTERVAL '24 hours'
             )`,
            [playerId]
        );

        const totalPlayers = await db.query(
            `SELECT COUNT(DISTINCT player_id) as total
             FROM scores
             WHERE timestamp > NOW() - INTERVAL '24 hours'`
        );

        const percentile = Math.round(
            (1 - rank.rows[0].rank / totalPlayers.rows[0].total) * 100
        );

        res.json({
            ...stats.rows[0],
            current_rank: rank.rows[0].rank,
            percentile: percentile,
            best_metrics: {
                apm: stats.rows[0].best_apm,
                pps: stats.rows[0].best_pps
            }
        });

    } catch (error) {
        // console.error('Player stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============ WALLET UPGRADE ============
app.post('/api/players/:playerId/upgrade', async (req, res) => {
    try {
        const { playerId } = req.params;
        const { wallet_address } = req.body;

        // Verify wallet signature here in production
        // const isValid = await verifyWalletSignature(wallet_address, signature);

        // Update player
        await db.query(
            `UPDATE players
             SET wallet_address = $1, verified = true
             WHERE id = $2`,
            [wallet_address, playerId]
        );

        res.json({ success: true });

    } catch (error) {
        // console.error('Wallet upgrade error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============ VALIDATION FUNCTIONS ============
async function validateScore({ score, metrics, replay_hash }) {
    // 1. Check APM (Actions Per Minute)
    if (metrics.apm > 300) {
        return { valid: false, reason: 'APM too high (bot detected)' };
    }

    // 2. Check PPS (Pieces Per Second)
    if (metrics.pps > 3.5) {
        return { valid: false, reason: 'PPS too high (bot detected)' };
    }

    // 3. Check score vs time ratio
    const maxScorePerSecond = 150; // Adjust based on your game
    const maxPossibleScore = metrics.gameTime * maxScorePerSecond;

    if (score > maxPossibleScore) {
        return { valid: false, reason: 'Score impossible for game duration' };
    }

    // 4. Check minimum game time
    if (metrics.gameTime < 10) {
        return { valid: false, reason: 'Game too short' };
    }

    // 5. Statistical anomaly detection
    const stats = await getScoreStatistics();
    const zScore = (score - stats.mean) / stats.stddev;

    if (zScore > 4) {
        return { valid: false, reason: 'Statistical anomaly detected' };
    }

    return { valid: true };
}

async function calculateRank(score, period) {
    let dateFilter = '';

    switch (period) {
        case 'daily':
            dateFilter = `AND timestamp > NOW() - INTERVAL '24 hours'`;
            break;
        case 'weekly':
            dateFilter = `AND timestamp > NOW() - INTERVAL '7 days'`;
            break;
    }

    const result = await db.query(
        `SELECT COUNT(*) + 1 as rank
         FROM scores
         WHERE score > $1 ${dateFilter}`,
        [score]
    );

    return result.rows[0].rank;
}

async function calculatePercentile(score, period) {
    let dateFilter = '';

    switch (period) {
        case 'daily':
            dateFilter = `WHERE timestamp > NOW() - INTERVAL '24 hours'`;
            break;
        case 'weekly':
            dateFilter = `WHERE timestamp > NOW() - INTERVAL '7 days'`;
            break;
    }

    const result = await db.query(
        `SELECT
            COUNT(CASE WHEN score <= $1 THEN 1 END)::FLOAT / COUNT(*) * 100 as percentile
         FROM scores ${dateFilter}`,
        [score]
    );

    return Math.round(result.rows[0].percentile);
}

async function getScoreStatistics() {
    // Cache these stats for performance
    const cached = await redis.get('score_stats');
    if (cached) return JSON.parse(cached);

    const result = await db.query(
        `SELECT
            AVG(score) as mean,
            STDDEV(score) as stddev
         FROM scores
         WHERE timestamp > NOW() - INTERVAL '30 days'`
    );

    const stats = {
        mean: parseFloat(result.rows[0].mean),
        stddev: parseFloat(result.rows[0].stddev)
    };

    await redis.setex('score_stats', 3600, JSON.stringify(stats));
    return stats;
}

async function ensurePlayerExists(playerId) {
    const exists = await db.query(
        'SELECT id FROM players WHERE id = $1',
        [playerId]
    );

    if (exists.rows.length === 0) {
        await db.query(
            'INSERT INTO players (id, display_name) VALUES ($1, $2)',
            [playerId, `Player ${playerId.slice(0, 6)}`]
        );
    }
}

// ============ START SERVER ============
app.listen(PORT, () => {
    // console.log(`🚀 Leaderboard server running on port ${PORT}`);
});
