export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    
    // Route requests
    try {
      if (url.pathname === '/api/scores' && request.method === 'POST') {
        return handleSubmitScore(request, env, headers);
      }
      
      if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
        return handleGetLeaderboard(request, env, headers);
      }
      
      // NEW: Large leaderboard endpoint for 1000+ players
      if (url.pathname === '/api/leaderboard/large' && request.method === 'GET') {
        return handleGetLargeLeaderboard(request, env, headers);
      }
      
      if (url.pathname.startsWith('/api/players/') && url.pathname.endsWith('/stats')) {
        return handleGetPlayerStats(request, env, headers);
      }
      
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers
      });
    }
  }
};

// Submit score
async function handleSubmitScore(request, env, headers) {
  const data = await request.json();
  const { score, replay_hash, metrics, player_id, timestamp } = data;
  
  // Validate score
  const validation = validateScore(score, metrics);
  if (!validation.valid) {
    return new Response(JSON.stringify({ 
      verified: false, 
      reason: validation.reason 
    }), { status: 400, headers });
  }
  
  // Check for duplicate
  const existing = await env.SCORES.get(`replay:${replay_hash}`);
  if (existing) {
    return new Response(JSON.stringify({ 
      verified: false, 
      reason: 'Duplicate submission' 
    }), { status: 400, headers });
  }
  
  // Generate score ID
  const scoreId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Store score data
  const scoreData = {
    id: scoreId,
    player_id,
    score,
    replay_hash,
    metrics,
    timestamp: timestamp || Date.now(),
    verified: true
  };
  
  // Save to KV
  await Promise.all([
    env.SCORES.put(`replay:${replay_hash}`, JSON.stringify(scoreData)),
    env.SCORES.put(`score:${scoreId}`, JSON.stringify(scoreData)),
    updatePlayerHighScore(env, player_id, score),
    updateLeaderboard(env, 'daily', player_id, score),
    updateLeaderboard(env, 'weekly', player_id, score),
    updateLeaderboard(env, 'all', player_id, score)
  ]);
  
  // Calculate rank
  const rank = await calculateRank(env, score, 'daily');
  
  return new Response(JSON.stringify({
    verified: true,
    score_id: scoreId,
    rank: rank,
    is_high_score: await isNewHighScore(env, player_id, score)
  }), { headers });
}

// Get leaderboard (standard, up to 100 entries)
async function handleGetLeaderboard(request, env, headers) {
  const url = new URL(request.url);
  const period = url.searchParams.get('period') || 'daily';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 100);
  const game = url.searchParams.get('game') || 'neon_drop';
  
  const leaderboardKey = `leaderboard:${game}:${period}`;
  const data = await env.SCORES.get(leaderboardKey, 'json') || { scores: [] };
  
  const scores = data.scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  
  return new Response(JSON.stringify({
    period,
    game,
    scores,
    total_players: data.scores.length,
    updated_at: new Date().toISOString()
  }), { headers });
}

// NEW: Get large leaderboard (up to 1000 entries)
async function handleGetLargeLeaderboard(request, env, headers) {
  const url = new URL(request.url);
  const period = url.searchParams.get('period') || 'daily';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '1000'), 1000);
  const game = url.searchParams.get('game') || 'neon_drop';
  
  const leaderboardKey = `leaderboard:${game}:${period}`;
  const data = await env.SCORES.get(leaderboardKey, 'json') || { scores: [] };
  
  const scores = data.scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  
  return new Response(JSON.stringify({
    period,
    game,
    scores,
    total_players: data.scores.length,
    page_size: limit,
    updated_at: new Date().toISOString()
  }), { headers });
}

// Get player stats
async function handleGetPlayerStats(request, env, headers) {
  const url = new URL(request.url);
  const playerId = url.pathname.split('/')[3];
  
  const playerData = await env.SCORES.get(`player:${playerId}`, 'json') || {
    high_score: 0,
    games_played: 0,
    total_score: 0
  };
  
  const rank = await calculateRank(env, playerData.high_score, 'daily');
  
  return new Response(JSON.stringify({
    ...playerData,
    avg_score: playerData.games_played > 0 
      ? Math.floor(playerData.total_score / playerData.games_played) 
      : 0,
    current_rank: rank
  }), { headers });
}

// Helper functions
function validateScore(score, metrics) {
  if (metrics.apm > 300) {
    return { valid: false, reason: 'APM too high' };
  }
  
  if (metrics.pps > 3.5) {
    return { valid: false, reason: 'PPS too high' };
  }
  
  const maxScorePerSecond = 150;
  const maxPossibleScore = (metrics.gameTime / 1000) * maxScorePerSecond;
  
  if (score > maxPossibleScore) {
    return { valid: false, reason: 'Score impossible for duration' };
  }
  
  return { valid: true };
}

async function updatePlayerHighScore(env, playerId, score) {
  const key = `player:${playerId}`;
  const existing = await env.SCORES.get(key, 'json') || {
    high_score: 0,
    games_played: 0,
    total_score: 0,
    display_name: `Player ${playerId.slice(0, 6)}`
  };
  
  existing.games_played++;
  existing.total_score += score;
  
  if (score > existing.high_score) {
    existing.high_score = score;
  }
  
  await env.SCORES.put(key, JSON.stringify(existing));
}

async function updateLeaderboard(env, period, playerId, score, game = 'neon_drop') {
  const key = `leaderboard:${game}:${period}`;
  const leaderboard = await env.SCORES.get(key, 'json') || { scores: [] };
  
  // Remove player's previous entry
  leaderboard.scores = leaderboard.scores.filter(s => s.player_id !== playerId);
  
  const playerData = await env.SCORES.get(`player:${playerId}`, 'json');
  leaderboard.scores.push({
    player_id: playerId,
    display_name: playerData?.display_name || `Player ${playerId.slice(0, 6)}`,
    score: score,
    timestamp: Date.now()
  });
  
  // Sort and keep top 1000
  leaderboard.scores.sort((a, b) => b.score - a.score);
  leaderboard.scores = leaderboard.scores.slice(0, 1000);
  
  await env.SCORES.put(key, JSON.stringify(leaderboard));
}

async function calculateRank(env, score, period, game = 'neon_drop') {
  const leaderboard = await env.SCORES.get(`leaderboard:${game}:${period}`, 'json') || { scores: [] };
  return leaderboard.scores.filter(s => s.score > score).length + 1;
}

async function isNewHighScore(env, playerId, score) {
  const playerData = await env.SCORES.get(`player:${playerId}`, 'json');
  return !playerData || score > (playerData.high_score || 0);
}

// Weekly leaderboard cleanup (run via cron trigger)
export async function cleanupWeeklyLeaderboards(env) {
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  const weeklyData = await env.SCORES.get('leaderboard:neon_drop:weekly', 'json');
  if (weeklyData) {
    weeklyData.scores = weeklyData.scores.filter(score => score.timestamp > oneWeekAgo);
    await env.SCORES.put('leaderboard:neon_drop:weekly', JSON.stringify(weeklyData));
  }
}

// Daily leaderboard cleanup (run via cron trigger)
export async function cleanupDailyLeaderboards(env) {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  const dailyData = await env.SCORES.get('leaderboard:neon_drop:daily', 'json');
  if (dailyData) {
    dailyData.scores = dailyData.scores.filter(score => score.timestamp > oneDayAgo);
    await env.SCORES.put('leaderboard:neon_drop:daily', JSON.stringify(dailyData));
  }
}
