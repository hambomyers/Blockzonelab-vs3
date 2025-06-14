-- schema.sql - Database schema for Neon Drop leaderboard
--
-- Run this in PostgreSQL to set up your database

-- Players table (anonymous first, wallet later)
CREATE TABLE players (
    id VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    wallet_address VARCHAR(42) UNIQUE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Scores table (all game submissions)
CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(50) NOT NULL REFERENCES players(id),
    score INTEGER NOT NULL,
    replay_hash VARCHAR(64) UNIQUE NOT NULL,

    -- Metrics for validation
    apm INTEGER NOT NULL,
    pps DECIMAL(4,2) NOT NULL,
    game_time INTEGER NOT NULL,

    -- Meta
    timestamp BIGINT NOT NULL,
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Indexes for performance
    INDEX idx_score (score DESC),
    INDEX idx_timestamp (timestamp DESC),
    INDEX idx_player_score (player_id, score DESC)
);

-- Future: Tournament scores
CREATE TABLE tournament_scores (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    player_id VARCHAR(50) NOT NULL REFERENCES players(id),
    score INTEGER NOT NULL,
    entry_fee DECIMAL(10,2),
    prize_won DECIMAL(10,2),
    blockchain_tx VARCHAR(66),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Statistics cache (updated by triggers)
CREATE TABLE score_statistics (
    period VARCHAR(20) PRIMARY KEY,
    mean_score DECIMAL(10,2),
    stddev_score DECIMAL(10,2),
    total_games INTEGER,
    unique_players INTEGER,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Function to update statistics
CREATE OR REPLACE FUNCTION update_score_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily stats
    INSERT INTO score_statistics (period, mean_score, stddev_score, total_games, unique_players)
    SELECT
        'daily',
        AVG(score),
        STDDEV(score),
        COUNT(*),
        COUNT(DISTINCT player_id)
    FROM scores
    WHERE timestamp > EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours') * 1000
    ON CONFLICT (period)
    DO UPDATE SET
        mean_score = EXCLUDED.mean_score,
        stddev_score = EXCLUDED.stddev_score,
        total_games = EXCLUDED.total_games,
        unique_players = EXCLUDED.unique_players,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats on new scores
CREATE TRIGGER update_stats_on_score
AFTER INSERT ON scores
FOR EACH STATEMENT
EXECUTE FUNCTION update_score_statistics();

-- Views for easy querying
CREATE VIEW daily_leaderboard AS
SELECT
    ROW_NUMBER() OVER (ORDER BY MAX(s.score) DESC) as rank,
    p.id as player_id,
    p.display_name,
    p.wallet_address,
    p.verified,
    MAX(s.score) as high_score,
    COUNT(s.id) as games_today,
    AVG(s.apm)::INT as avg_apm,
    AVG(s.pps)::DECIMAL(4,2) as avg_pps
FROM scores s
JOIN players p ON s.player_id = p.id
WHERE s.timestamp > EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours') * 1000
GROUP BY p.id, p.display_name, p.wallet_address, p.verified
ORDER BY high_score DESC;

-- Indexes for performance
CREATE INDEX idx_scores_player_timestamp ON scores(player_id, timestamp DESC);
CREATE INDEX idx_scores_verified ON scores(verified) WHERE verified = TRUE;
