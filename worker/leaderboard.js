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
    }    // Route requests
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

      // NEW: Player registration endpoint
      if (url.pathname === '/api/players/register' && request.method === 'POST') {
        return handlePlayerRegistration(request, env, headers);
      }

      // NEW: Player profile update endpoint
      if (url.pathname.startsWith('/api/players/') && url.pathname.endsWith('/profile') && request.method === 'PUT') {
        return handleUpdatePlayerProfile(request, env, headers);
      }

      // NEW: Admin endpoint to clear all leaderboard data
      if (url.pathname === '/api/admin/clear-leaderboard' && request.method === 'POST') {
        return handleClearLeaderboard(request, env, headers);
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

  // Get player profile from PLAYERS namespace
  const playerProfile = await env.PLAYERS.get(`profile:${playerId}`, 'json') || {
    player_id: playerId,
    display_name: `Player ${playerId.slice(0, 6)}`,
    tier: 'anonymous',
    created_at: Date.now()
  };

  // Get player stats from SCORES namespace
  const playerStats = await env.SCORES.get(`player:${playerId}`, 'json') || {
    high_score: 0,
    games_played: 0,
    total_score: 0
  };

  const rank = await calculateRank(env, playerStats.high_score, 'daily');

  return new Response(JSON.stringify({
    ...playerProfile,
    ...playerStats,
    avg_score: playerStats.games_played > 0
      ? Math.floor(playerStats.total_score / playerStats.games_played)
      : 0,
    current_rank: rank
  }), { headers });
}

// NEW: Player registration
async function handlePlayerRegistration(request, env, headers) {
  const data = await request.json();
  const { player_id, display_name, tier, email, wallet_address } = data;

  if (!player_id) {
    return new Response(JSON.stringify({ error: 'player_id is required' }), {
      status: 400,
      headers
    });
  }

  const profileKey = `profile:${player_id}`;
  
  // Check if player already exists
  const existingProfile = await env.PLAYERS.get(profileKey, 'json');
  if (existingProfile) {
    return new Response(JSON.stringify({ error: 'Player already exists' }), {
      status: 409,
      headers
    });
  }

  // Create new player profile
  const newProfile = {
    player_id,
    display_name: display_name || `Player ${player_id.slice(0, 6)}`,
    tier: tier || 'anonymous',
    email: email || null,
    wallet_address: wallet_address || null,
    created_at: Date.now(),
    last_activity: Date.now(),
    current_high_score: 0,
    verified: tier === 'social' || tier === 'web3'
  };

  // Store in PLAYERS namespace
  await env.PLAYERS.put(profileKey, JSON.stringify(newProfile));

  // Also store player ID index for lookups
  if (email) {
    await env.PLAYERS.put(`email:${email}`, player_id);
  }
  if (wallet_address) {
    await env.PLAYERS.put(`wallet:${wallet_address}`, player_id);
  }

  return new Response(JSON.stringify({
    success: true,
    player: newProfile
  }), { headers });
}

// NEW: Update player profile
async function handleUpdatePlayerProfile(request, env, headers) {
  const url = new URL(request.url);
  const playerId = url.pathname.split('/')[3];
  const data = await request.json();

  const profileKey = `profile:${playerId}`;
  const existingProfile = await env.PLAYERS.get(profileKey, 'json');
  
  if (!existingProfile) {
    return new Response(JSON.stringify({ error: 'Player not found' }), {
      status: 404,
      headers
    });
  }

  // Update allowed fields
  const updatedProfile = {
    ...existingProfile,
    last_activity: Date.now()
  };

  if (data.display_name) updatedProfile.display_name = data.display_name;
  if (data.email) updatedProfile.email = data.email;
  if (data.wallet_address) updatedProfile.wallet_address = data.wallet_address;
  if (data.tier) updatedProfile.tier = data.tier;

  // Store updated profile
  await env.PLAYERS.put(profileKey, JSON.stringify(updatedProfile));

  // Update indexes if needed
  if (data.email && data.email !== existingProfile.email) {
    await env.PLAYERS.put(`email:${data.email}`, playerId);
    if (existingProfile.email) {
      await env.PLAYERS.delete(`email:${existingProfile.email}`);
    }
  }

  if (data.wallet_address && data.wallet_address !== existingProfile.wallet_address) {
    await env.PLAYERS.put(`wallet:${data.wallet_address}`, playerId);
    if (existingProfile.wallet_address) {
      await env.PLAYERS.delete(`wallet:${existingProfile.wallet_address}`);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    player: updatedProfile  }), { headers });
}

// Admin function to clear all leaderboard data
async function handleClearLeaderboard(request, env, headers) {
  try {
    console.log('🧹 ADMIN: Clearing all leaderboard data from KV...');
    
    // Clear all leaderboard data
    const leaderboardKeys = [
      'leaderboard:neon_drop:daily',
      'leaderboard:neon_drop:weekly',
      'leaderboard:neon_drop:monthly',
      'leaderboard:neon_drop:all-time'
    ];
    
    // Reset each leaderboard to empty
    for (const key of leaderboardKeys) {
      await env.SCORES.put(key, JSON.stringify({ scores: [] }));
    }
    
    // Note: We're not clearing individual player scores/profiles
    // Only clearing the aggregated leaderboards
    
    console.log('✅ All leaderboards cleared successfully');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'All leaderboard data cleared successfully',
      cleared: leaderboardKeys
    }), { headers });
    
  } catch (error) {
    console.error('❌ Failed to clear leaderboard data:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers });
  }
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
  
  // Get existing stats from SCORES namespace
  const existing = await env.SCORES.get(key, 'json') || {
    high_score: 0,
    games_played: 0,
    total_score: 0
  };

  existing.games_played++;
  existing.total_score += score;

  if (score > existing.high_score) {
    existing.high_score = score;
  }

  // Update stats in SCORES namespace
  await env.SCORES.put(key, JSON.stringify(existing));

  // Get or create player profile in PLAYERS namespace
  const profileKey = `profile:${playerId}`;
  const playerProfile = await env.PLAYERS.get(profileKey, 'json') || {
    player_id: playerId,
    display_name: `Player ${playerId.slice(0, 6)}`,
    tier: 'anonymous',
    created_at: Date.now()
  };

  // Update last activity and high score in profile
  playerProfile.last_activity = Date.now();
  playerProfile.current_high_score = existing.high_score;
  
  // Store updated profile in PLAYERS namespace
  await env.PLAYERS.put(profileKey, JSON.stringify(playerProfile));
}

async function updateLeaderboard(env, period, playerId, score, game = 'neon_drop') {
  const key = `leaderboard:${game}:${period}`;
  const leaderboard = await env.SCORES.get(key, 'json') || { scores: [] };

  // Remove player's previous entry
  leaderboard.scores = leaderboard.scores.filter(s => s.player_id !== playerId);

  // Get player profile from PLAYERS namespace for display name
  const playerProfile = await env.PLAYERS.get(`profile:${playerId}`, 'json');
  const displayName = playerProfile?.display_name || `Player ${playerId.slice(0, 6)}`;
  
  leaderboard.scores.push({
    player_id: playerId,
    display_name: displayName,
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
