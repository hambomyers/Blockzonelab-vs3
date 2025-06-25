/**
 * BLOCKZONE LAB - Leaderboard & Backend API (Modularized)
 *
 * This backend is being refactored for AAA maintainability and scalability.
 *
 * === Modular Structure (to be implemented) ===
 * - /api/scores: Score submission, validation, anti-cheat, proof
 * - /api/leaderboard: Real-time leaderboard queries (cycle-based, friend challenges, etc.)
 * - /api/players: Registration, profile (with username#last4), stats, upgrades
 * - /api/sessions: Session creation, upgrade, validation
 * - /api/rewards: Prize calculation and distribution (QUARTERS, USDC, badges)
 * - /api/challenges: Viral challenge link creation, tracking, resolution
 * - /api/payments: Payment hooks (Apple Pay, USDC, etc.)
 * - /api/analytics: Usage and growth tracking
 *
 * === KV Schema (planned) ===
 * - player:{wallet}         Player profile (displayName, wallet, username#last4, stats, rewards)
 * - score:{scoreId}         Individual score record
 * - leaderboard:{game}:{period}  Leaderboard for each game/cycle
 * - challenge:{challengeId} Friend challenge data
 * - session:{sessionId}     Session/auth data
 * - reward:{rewardId}       Reward payout record
 *
 * === TODO: Implement modules below in order ===
 * [ ] 1. Modularize /api/scores (score submission, validation, anti-cheat)
 * [ ] 2. Modularize /api/leaderboard (cycle, friend challenge, player rank)
 * [ ] 3. Modularize /api/players (registration, username#last4, profile)
 * [ ] 4. Modularize /api/sessions (session management)
 * [ ] 5. Modularize /api/rewards (prize calculation/distribution)
 * [ ] 6. Modularize /api/challenges (viral links)
 * [ ] 7. Modularize /api/payments (Apple Pay, USDC)
 * [ ] 8. Modularize /api/analytics (growth tracking)
 *
 * === NOTE ===
 * Do not duplicate logic. All new features must use these modules for consistency and future-proofing.
 */
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
      return new Response(null, { status: 204, headers });
    }

    try {
      if (url.pathname === '/api/scores' && request.method === 'POST') {
        return await handleApiScores(request, env, headers);
      }
      if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
        return await handleApiLeaderboard(request, env, headers);
      }

      if (url.pathname === '/api/leaderboard/large' && request.method === 'GET') {
        return handleGetLargeLeaderboard(request, env, headers);
      }

      if (url.pathname.startsWith('/api/players/') && url.pathname.endsWith('/stats')) {
        return await handleApiPlayerStats(request, env, headers);
      }

      if (url.pathname === '/api/players/register' && request.method === 'POST') {
        return await handleApiPlayerRegistration(request, env, headers);
      }

      if (url.pathname.startsWith('/api/players/') && url.pathname.endsWith('/profile') && request.method === 'PUT') {
        return await handleApiPlayerProfileUpdate(request, env, headers);
      }

      if (url.pathname === '/api/admin/clear-leaderboard' && request.method === 'POST') {
        return handleClearLeaderboard(request, env, headers);
      }

      if (url.pathname === '/api/tournaments/current' && request.method === 'GET') {
        return handleGetCurrentTournament(request, env, headers);
      }

      if (url.pathname.startsWith('/api/tournaments/') && url.pathname.endsWith('/join') && request.method === 'POST') {
        return handleJoinTournament(request, env, headers);
      }

      if (url.pathname.startsWith('/api/tournaments/') && !url.pathname.endsWith('/join') && request.method === 'GET') {
        return handleGetTournament(request, env, headers);
      }

      if (url.pathname === '/api/sessions' && request.method === 'POST') {
        return await handleApiSessionData(request, env, headers);
      }

      if (url.pathname === '/api/auth/session' && request.method === 'POST') {
        return await handleApiSession(request, env, headers);
      }

      if (url.pathname === '/api/auth/upgrade' && request.method === 'POST') {
        return await handleApiSessionUpgrade(request, env, headers);
      }

      if (url.pathname.startsWith('/api/rewards')) {
        return await handleApiRewards(request, env, headers);
      }

      if (url.pathname.startsWith('/api/challenges')) {
        return await handleApiChallenges(request, env, headers);
      }

      if (url.pathname.startsWith('/api/payments')) {
        return await handleApiPayments(request, env, headers);
      }

      if (url.pathname.startsWith('/api/analytics')) {
        return await handleApiAnalytics(request, env, headers);
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

// --- Modular Handler: /api/scores ---
async function handleApiScores(request, env, headers) {
  // All score submission, validation, anti-cheat, and proof logic goes here
  // (moved from robustHandleSubmitScore)
  let data;
  try {
    data = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ verified: false, reason: 'Invalid JSON' }), { status: 400, headers });
  }
  const { score, replay_hash, metrics, player_id, timestamp, entry_fee = 0.25 } = data;
  if (!player_id || typeof score !== 'number') {
    return new Response(JSON.stringify({ verified: false, reason: 'Missing player_id or score' }), { status: 400, headers });
  }
  
  // Pay-per-attempt validation
  const paymentValidation = await validatePayment(env, player_id, entry_fee);
  if (!paymentValidation.valid) {
    return new Response(JSON.stringify({ 
      verified: false, 
      reason: 'Payment required',
      required_fee: entry_fee,
      error: paymentValidation.error 
    }), { status: 402, headers }); // 402 Payment Required
  }
  
  // Ensure player profile exists
  await ensurePlayerProfile(env, player_id, metrics?.player_name || 'Anonymous');
  
  // Add entry fee to current prize pool
  await addToCurrentPrizePool(env, entry_fee);
  
  // Check for duplicate player_id (optional, can be relaxed)
  // ...existing logic for replay_hash...
  const scoreId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const scoreData = {
    id: scoreId,
    player_id,
    score,
    replay_hash,
    metrics,
    timestamp: timestamp || Date.now(),
    verified: true,
    entry_fee: entry_fee,
    transaction_id: paymentValidation.transaction_id
  };
  await Promise.all([
    env.SCORES.put(`replay:${replay_hash}`, JSON.stringify(scoreData)),
    env.SCORES.put(`score:${scoreId}`, JSON.stringify(scoreData)),
    updatePlayerHighScore(env, player_id, score),
    updateCycleLeaderboard(env, player_id, score),
    updateLeaderboard(env, 'weekly', player_id, score),
    updateLeaderboard(env, 'all', player_id, score)
  ]);
  
  // Fix: Calculate rank using current cycle instead of 'daily'
  const currentCycleKey = getCurrentCycleKey();
  const rank = await calculateRank(env, score, currentCycleKey);
  
  return new Response(JSON.stringify({
    verified: true,
    score_id: scoreId,
    rank: rank,
    is_high_score: await isNewHighScore(env, player_id, score),
    entry_fee: entry_fee,
    transaction_id: paymentValidation.transaction_id,
    current_prize_pool: await getCurrentPrizePoolAmount(env)
  }), { headers });
}

// Get current prize pool amount
async function getCurrentPrizePoolAmount(env, game = 'neon_drop') {
  const poolKey = getCurrentPrizePoolKey(game);
  return parseFloat(await env.SCORES.get(poolKey)) || 0;
}

// Enhanced payment validation
async function validatePayment(env, playerId, entryFee) {
  // TODO: Implement actual payment validation with your payment system
  // For now, simulate successful payment validation
  
  // Check if player has sufficient balance (placeholder)
  const playerProfile = await env.PLAYERS.get(`profile:${playerId}`, 'json');
  if (!playerProfile) {
    return {
      valid: false,
      error: 'Player profile not found'
    };
  }
  
  // Simulate payment processing
  // In production, this would:
  // 1. Check player's wallet/balance
  // 2. Process payment (QUARTERS, USDC, etc.)
  // 3. Return transaction details
  
  const transactionId = `tx_${Date.now()}_${playerId}`;
  
  // Store payment record
  const paymentRecord = {
    id: transactionId,
    player_id: playerId,
    amount: entryFee,
    timestamp: Date.now(),
    status: 'completed',
    type: 'entry_fee'
  };
  
  await env.SCORES.put(`payment:${transactionId}`, JSON.stringify(paymentRecord));
  
  return {
    valid: true,
    amount: entryFee,
    transaction_id: transactionId
  };
}

// --- Robust Handlers ---
async function robustHandleSubmitScore(request, env, headers) {
  let data;
  try {
    data = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ verified: false, reason: 'Invalid JSON' }), { status: 400, headers });
  }
  const { score, replay_hash, metrics, player_id, timestamp } = data;
  if (!player_id || typeof score !== 'number') {
    return new Response(JSON.stringify({ verified: false, reason: 'Missing player_id or score' }), { status: 400, headers });
  }
  // Ensure player profile exists
  await ensurePlayerProfile(env, player_id, metrics?.player_name || 'Anonymous');
  // Check for duplicate player_id (optional, can be relaxed)
  // ...existing logic for replay_hash...
  const scoreId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const scoreData = {
    id: scoreId,
    player_id,
    score,
    replay_hash,
    metrics,
    timestamp: timestamp || Date.now(),
    verified: true
  };
  await Promise.all([
    env.SCORES.put(`replay:${replay_hash}`, JSON.stringify(scoreData)),
    env.SCORES.put(`score:${scoreId}`, JSON.stringify(scoreData)),
    updatePlayerHighScore(env, player_id, score),
    updateCycleLeaderboard(env, player_id, score),
    updateLeaderboard(env, 'weekly', player_id, score),
    updateLeaderboard(env, 'all', player_id, score)
  ]);
  const rank = await calculateRank(env, score, 'daily');
  return new Response(JSON.stringify({
    verified: true,
    score_id: scoreId,
    rank: rank,
    is_high_score: await isNewHighScore(env, player_id, score)
  }), { headers });
}

// --- Modular Handler: /api/leaderboard ---
async function handleApiLeaderboard(request, env, headers) {
  // All leaderboard query logic goes here (moved from robustHandleGetLeaderboard)
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'daily';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 100);
    const game = url.searchParams.get('game') || 'neon_drop';
    const leaderboardKey = getCurrentCycleKey(game);
    const data = await env.SCORES.get(leaderboardKey, 'json') || { scores: [] };
    
    // Get current cycle info
    const now = new Date();
    const hour = now.getHours();
    const cycle = hour < 12 ? 'am' : 'pm';
    const cycleEnd = new Date(now);
    cycleEnd.setHours(hour < 12 ? 12 : 24, 0, 0, 0); // Next cycle starts at 12:00 or 00:00
    
    // Normalize entries
    const scores = (data.scores || [])
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry, index) => ({
        player_id: entry.player_id,
        display_name: entry.display_name || entry.playerName || 'Anonymous',
        score: entry.score || 0,
        timestamp: entry.timestamp || Date.now(),
        rank: index + 1
      }));
    return new Response(JSON.stringify({
      period: 'current-cycle',
      cycle: cycle,
      cycle_end: cycleEnd.toISOString(),
      game,
      scores,
      total_players: scores.length,
      updated_at: new Date().toISOString()
    }), { headers });
  } catch (e) {
    // Always return CORS headers and a valid JSON structure
    return new Response(JSON.stringify({ period: 'current-cycle', game: 'neon_drop', scores: [], total_players: 0, updated_at: new Date().toISOString(), error: e.message }), { status: 200, headers });
  }
}

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
  }  // Store the replay hash to prevent actual duplicates, but don't reject submissions
  // since replay_hash includes timestamp, each submission should be unique
  const existing = await env.SCORES.get(`replay:${replay_hash}`);
  if (existing) {
    console.log('Duplicate replay_hash detected, but allowing submission:', replay_hash);
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
  };  // Save to KV and ensure player profile exists FIRST
  await ensurePlayerProfile(env, player_id, metrics.player_name || 'Anonymous');
  
  await Promise.all([
    env.SCORES.put(`replay:${replay_hash}`, JSON.stringify(scoreData)),
    env.SCORES.put(`score:${scoreId}`, JSON.stringify(scoreData)),
    updatePlayerHighScore(env, player_id, score),
    updateCycleLeaderboard(env, player_id, score),
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

  const leaderboardKey = getCurrentCycleKey(game);
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

  const leaderboardKey = getCurrentCycleKey(game);
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
    display_name: 'Anonymous',
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

// --- Modular Handlers: /api/players ---
async function handleApiPlayerRegistration(request, env, headers) {
  // Player registration logic (moved from handlePlayerRegistration)
  return await handlePlayerRegistration(request, env, headers);
}

async function handleApiPlayerProfileUpdate(request, env, headers) {
  // Player profile update logic (moved from handleUpdatePlayerProfile)
  return await handleUpdatePlayerProfile(request, env, headers);
}

async function handleApiPlayerStats(request, env, headers) {
  // Player stats logic (moved from handleGetPlayerStats)
  return await handleGetPlayerStats(request, env, headers);
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
    display_name: display_name || 'Anonymous',
    tier: tier || 'anonymous',
    email: email || null,
    wallet_address: wallet_address || null,
    created_at: Date.now(),
    last_activity: Date.now(),
    current_high_score: 0,
    streak: 0,
    streak_updated: Date.now(),
    payment_history: []
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

// TOURNAMENT ENDPOINTS (Basic implementation)
async function handleGetCurrentTournament(request, env, headers) {
  // Simple daily tournament - always active
  const today = new Date().toDateString();
  const tournamentId = `daily_${today.replace(/\s/g, '_')}`;
  
  return new Response(JSON.stringify({
    id: tournamentId,
    name: "Daily Championship",
    type: "daily",
    status: "active",
    entry_fee: 0, // Free for now
    prize_pool: 0, // Calculated dynamically
    max_players: 1000,
    current_players: 0, // TODO: Get from leaderboard
    start_time: new Date().setHours(0,0,0,0),
    end_time: new Date().setHours(23,59,59,999),
    rules: {
      max_attempts: 0, // Unlimited
      scoring: "highest_score"
    }
  }), { headers });
}

async function handleJoinTournament(request, env, headers) {
  const url = new URL(request.url);
  const tournamentId = url.pathname.split('/')[3];
  const data = await request.json();
  const { player_id } = data;

  // For daily tournaments, joining is automatic on first score
  return new Response(JSON.stringify({
    success: true,
    tournament_id: tournamentId,
    player_id: player_id,
    joined_at: Date.now(),
    message: "Successfully joined daily tournament"
  }), { headers });
}

async function handleGetTournament(request, env, headers) {
  const url = new URL(request.url);
  const tournamentId = url.pathname.split('/')[3];
  
  // Get tournament leaderboard
  const leaderboard = await env.SCORES.get('leaderboard:neon_drop:daily', 'json') || { scores: [] };
  
  return new Response(JSON.stringify({
    id: tournamentId,
    name: "Daily Championship",
    status: "active",
    leaderboard: leaderboard.scores.slice(0, 10), // Top 10
    total_players: leaderboard.scores.length,
    prize_distribution: {
      "1st": "50%",
      "2nd": "25%", 
      "3rd": "15%",
      "4th": "10%"
    }
  }), { headers });
}

// --- Modular Handlers: /api/sessions ---
async function handleApiSession(request, env, headers) {
  // Session creation/validation logic (moved from handleSession)
  return await handleSession(request, env, headers);
}

async function handleApiSessionUpgrade(request, env, headers) {
  // Session upgrade logic (moved from handleUpgradeSession)
  return await handleUpgradeSession(request, env, headers);
}

async function handleApiSessionData(request, env, headers) {
  // Session data logic (moved from handleSessionData)
  return await handleSessionData(request, env, headers);
}

// SESSION TRACKING
async function handleSessionData(request, env, headers) {
  const data = await request.json();
  const { player_id, session_id, game_data, timestamp } = data;

  // Store session data for analytics
  const sessionKey = `session:${session_id}`;
  const sessionData = {
    player_id,
    session_id,
    game_data,
    timestamp: timestamp || Date.now(),
    stored_at: Date.now()
  };

  await env.SESSIONS.put(sessionKey, JSON.stringify(sessionData));

  return new Response(JSON.stringify({
    success: true,
    session_id: session_id
  }), { headers });
}

// --- SESSION/AUTH HANDLERS (PHASE 1 SCAFFOLD) ---
// Modular, extensible session/auth system for BlockZone Lab
// Supports: anonymous, email/social, wallet-based sessions
// Uses new KV schema (see docs/kv-schema.md)

async function handleSession(request, env, headers) {
  // POST /api/auth/session
  // Creates or resumes a session (anonymous by default)
  // Body: { device_info, player_id (optional) }
  const data = await request.json();
  let { device_info, player_id } = data;
  let session_id = crypto.randomUUID();
  let is_new = true;

  // If player_id provided, try to resume session
  if (player_id) {
    // Look up player profile
    const profile = await env.PLAYERS.get(`profile:${player_id}`, 'json');
    if (profile) {
      // Resume session
      session_id = `${player_id}-${Date.now()}`;
      is_new = false;
    }
  } else {
    // Create anonymous player profile
    player_id = `anon_${session_id}`;
    await env.PLAYERS.put(`profile:${player_id}`, JSON.stringify({
      player_id,
      display_name: 'Anonymous',
      tier: 'anonymous',
      created_at: Date.now(),
      last_activity: Date.now(),
      current_high_score: 0,
      streak: 0,
      streak_updated: Date.now(),
      payment_history: []
    }));
  }

  // Store session in SESSIONS KV
  await env.SESSIONS.put(`session:${session_id}`, JSON.stringify({
    player_id,
    session_id,
    device_info: device_info || {},
    timestamp: Date.now(),
    stored_at: Date.now()
  }));

  // Return session info
  return new Response(JSON.stringify({
    success: true,
    session_id,
    player_id,
    is_new
  }), { headers });
}

async function handleUpgradeSession(request, env, headers) {
  // POST /api/auth/upgrade
  // Upgrades an anonymous session to email/social or wallet
  // Body: { session_id, upgrade_type, wallet_address, email, display_name, signature }
  const data = await request.json();
  const { session_id, upgrade_type, wallet_address, email, display_name, signature } = data;

  // Validate session
  const session = await env.SESSIONS.get(`session:${session_id}`, 'json');
  if (!session) {
    return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404, headers });
  }

  let player_id = session.player_id;
  let profile = await env.PLAYERS.get(`profile:${player_id}`, 'json');
  if (!profile) {
    return new Response(JSON.stringify({ error: 'Player profile not found' }), { status: 404, headers });
  }

  // Upgrade logic
  if (upgrade_type === 'wallet' && wallet_address) {
    // TODO: Verify wallet signature (Web3)
    // For now, accept as valid
    profile.wallet_address = wallet_address;
    profile.tier = 'web3';
    if (display_name) profile.display_name = display_name;
    await env.PLAYERS.put(`profile:${player_id}`, JSON.stringify(profile));
    await env.PLAYERS.put(`wallet:${wallet_address}`, player_id);
  } else if (upgrade_type === 'email' && email) {
    profile.email = email;
    profile.tier = 'social';
    if (display_name) profile.display_name = display_name;
    await env.PLAYERS.put(`profile:${player_id}`, JSON.stringify(profile));
    await env.PLAYERS.put(`email:${email}`, player_id);
  } else {
    return new Response(JSON.stringify({ error: 'Invalid upgrade type or missing info' }), { status: 400, headers });
  }

  // Return upgraded profile
  return new Response(JSON.stringify({
    success: true,
    player_id,
    profile
  }), { headers });
}
// --- END SESSION/AUTH HANDLERS SCAFFOLD ---

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
    player_id: playerId,    display_name: 'Anonymous',
    tier: 'anonymous',
    created_at: Date.now()
  };

  // Update last activity and high score in profile
  playerProfile.last_activity = Date.now();
  playerProfile.current_high_score = existing.high_score;
  
  // Store updated profile in PLAYERS namespace
  await env.PLAYERS.put(profileKey, JSON.stringify(playerProfile));
}

async function updateCycleLeaderboard(env, playerId, score, game = 'neon_drop') {
  const key = getCurrentCycleKey(game);
  const leaderboard = await env.SCORES.get(key, 'json') || { scores: [] };
  // Remove player's previous entry
  leaderboard.scores = leaderboard.scores.filter(s => s.player_id !== playerId);
  // Get player profile from PLAYERS namespace for display name
  let playerProfile;
  try {
    playerProfile = await env.PLAYERS.get(`profile:${playerId}`, 'json');
  } catch (error) {
    playerProfile = null;
  }
  const displayName = playerProfile?.display_name || 'Anonymous';
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

async function updateLeaderboard(env, period, playerId, score, game = 'neon_drop') {
  const key = `leaderboard:${game}:${period}`;
  const leaderboard = await env.SCORES.get(key, 'json') || { scores: [] };
  // Remove player's previous entry
  leaderboard.scores = leaderboard.scores.filter(s => s.player_id !== playerId);
  
  // Get player profile from PLAYERS namespace for display name
  let playerProfile;
  try {
    playerProfile = await env.PLAYERS.get(`profile:${playerId}`, 'json');
  } catch (error) {
    console.warn('Could not fetch player profile:', error);
    playerProfile = null;
  }
  const displayName = playerProfile?.display_name || 'Anonymous';
  
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

async function ensurePlayerProfile(env, playerId, displayName) {
  const profileKey = `profile:${playerId}`;
  
  // Get existing profile or create new one
  const existing = await env.PLAYERS.get(profileKey, 'json');
  
  if (existing) {
    // Update display name if provided and different
    if (displayName && displayName !== 'Anonymous' && displayName !== existing.display_name) {
      existing.display_name = displayName;
      existing.last_activity = Date.now();
      await env.PLAYERS.put(profileKey, JSON.stringify(existing));
    }
  } else {
    // Create new profile
    const newProfile = {
      player_id: playerId,      display_name: displayName || 'Anonymous',
      tier: 'anonymous',
      created_at: Date.now(),
      last_activity: Date.now(),
      current_high_score: 0
    };
    await env.PLAYERS.put(profileKey, JSON.stringify(newProfile));
  }
}

// --- Modular Handler: /api/rewards ---
async function handleApiRewards(request, env, headers) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    if (path === '/api/rewards/calculate-cycle' && request.method === 'POST') {
      // Calculate and distribute prizes for a completed cycle
      const data = await request.json();
      const { game = 'neon_drop', cycleKey } = data;
      
      return await calculateCyclePrizes(env, game, cycleKey, headers);
    }
    
    if (path === '/api/rewards/current-pool' && request.method === 'GET') {
      // Get current prize pool for the active cycle
      const game = url.searchParams.get('game') || 'neon_drop';
      return await getCurrentPrizePool(env, game, headers);
    }
    
    if (path === '/api/rewards/bounty-boss' && request.method === 'GET') {
      // Get current Bounty Boss score and jackpot
      return await getBountyBossInfo(env, headers);
    }
    
    return new Response(JSON.stringify({ 
      status: 'rewards endpoint active',
      available_endpoints: ['/calculate-cycle', '/current-pool', '/bounty-boss']
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers 
    });
  }
}

// Calculate prizes for a completed cycle
async function calculateCyclePrizes(env, game, cycleKey, headers) {
  try {
    // Get the leaderboard for this cycle
    const leaderboard = await env.SCORES.get(cycleKey, 'json') || { scores: [] };
    const prizePoolKey = cycleKey.replace('leaderboard:', 'prizepool:');
    const totalRevenue = parseFloat(await env.SCORES.get(prizePoolKey)) || 0;
    
    if (leaderboard.scores.length === 0) {
      return new Response(JSON.stringify({ 
        status: 'no_players', 
        message: 'No players in this cycle' 
      }), { headers });
    }
    
    // Use PrizeCalculator for hyperbolic distribution
    const { PrizeCalculator } = await import('/shared/economics/prize-calculator.js');
    const calculator = new PrizeCalculator();
    const prizeCalculation = calculator.calculatePrizes(totalRevenue);
    
    // Create payout records for top 5 players
    const payouts = [];
    for (let i = 0; i < Math.min(5, leaderboard.scores.length); i++) {
      const player = leaderboard.scores[i];
      const prize = prizeCalculation.prizes[i];
      
      const payoutRecord = {
        id: `payout_${Date.now()}_${i}`,
        player_id: player.player_id,
        cycle_key: cycleKey,
        position: i + 1,
        prize_amount: prize,
        timestamp: Date.now(),
        status: 'pending' // Will be 'paid' when sent to wallet
      };
      
      // Store in REWARDS namespace
      await env.REWARDS.put(`payout:${payoutRecord.id}`, JSON.stringify(payoutRecord));
      payouts.push(payoutRecord);
    }
    
    // Check if this is Saturday (Bounty Boss day)
    const cycleDate = new Date(cycleKey.split(':')[2]); // Extract date from cycle key
    const isSaturday = cycleDate.getDay() === 6; // 6 = Saturday
    
    if (isSaturday) {
      await handleBountyBossCycle(env, leaderboard, cycleKey, headers);
    }
    
    return new Response(JSON.stringify({
      status: 'prizes_calculated',
      cycle_key: cycleKey,
      total_revenue: totalRevenue,
      prize_calculation: prizeCalculation,
      payouts: payouts,
      is_saturday: isSaturday
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers 
    });
  }
}

// Get current prize pool
async function getCurrentPrizePool(env, game, headers) {
  const poolKey = getCurrentPrizePoolKey(game);
  const currentPool = parseFloat(await env.SCORES.get(poolKey)) || 0;
  
  return new Response(JSON.stringify({
    current_pool: currentPool,
    pool_key: poolKey,
    updated_at: new Date().toISOString()
  }), { headers });
}

// Bounty Boss logic
async function getBountyBossInfo(env, headers) {
  const bountyScore = parseFloat(await env.SCORES.get('bountyboss:score')) || 0;
  const jackpot = parseFloat(await env.SCORES.get('jackpot:saturday')) || 0;
  
  return new Response(JSON.stringify({
    bounty_score: bountyScore,
    current_jackpot: jackpot,
    updated_at: new Date().toISOString()
  }), { headers });
}

// Handle Saturday Bounty Boss cycle
async function handleBountyBossCycle(env, leaderboard, cycleKey, headers) {
  const bountyScore = parseFloat(await env.SCORES.get('bountyboss:score')) || 0;
  const jackpot = parseFloat(await env.SCORES.get('jackpot:saturday')) || 0;
  
  // Check if anyone beat the Bounty Boss
  const topScore = leaderboard.scores[0]?.score || 0;
  
  if (topScore > bountyScore) {
    // Someone beat the Bounty Boss - they win the jackpot!
    const winner = leaderboard.scores[0];
    
    const jackpotPayout = {
      id: `jackpot_${Date.now()}`,
      player_id: winner.player_id,
      cycle_key: cycleKey,
      position: 'bounty_boss_winner',
      prize_amount: jackpot,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    await env.REWARDS.put(`payout:${jackpotPayout.id}`, JSON.stringify(jackpotPayout));
    
    // Reset jackpot to 0
    await env.SCORES.put('jackpot:saturday', '0');
    
    // Set new Bounty Boss score
    await env.SCORES.put('bountyboss:score', topScore.toString());
    
    return jackpotPayout;
  } else {
    // No one beat the Bounty Boss - jackpot rolls over
    // Add 10% of this cycle's revenue to the jackpot
    const cycleRevenue = parseFloat(await env.SCORES.get(cycleKey.replace('leaderboard:', 'prizepool:'))) || 0;
    const jackpotContribution = cycleRevenue * 0.1;
    const newJackpot = jackpot + jackpotContribution;
    
    await env.SCORES.put('jackpot:saturday', newJackpot.toString());
    
    return null; // No winner this week
  }
}

// --- Modular Handler: /api/challenges ---
async function handleApiChallenges(request, env, headers) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    if (path === '/api/challenges/create' && request.method === 'POST') {
      // Create a new friend challenge
      const data = await request.json();
      const { challenger_id, entry_fee = 5.00, game = 'neon_drop', expires_in = 86400000 } = data; // 24 hours default
      
      const challengeId = `challenge_${Date.now()}_${challenger_id}`;
      const challenge = {
        id: challengeId,
        challenger_id,
        entry_fee,
        game,
        created_at: Date.now(),
        expires_at: Date.now() + expires_in,
        status: 'active',
        participants: [challenger_id],
        leaderboard: []
      };
      
      await env.SCORES.put(`challenge:${challengeId}`, JSON.stringify(challenge));
      
      return new Response(JSON.stringify({
        success: true,
        challenge_id: challengeId,
        share_url: `/challenge/${challengeId}`,
        challenge
      }), { headers });
    }
    
    if (path.startsWith('/api/challenges/') && path.endsWith('/join') && request.method === 'POST') {
      // Join an existing challenge
      const challengeId = url.pathname.split('/')[3];
      const data = await request.json();
      const { player_id } = data;
      
      const challenge = await env.SCORES.get(`challenge:${challengeId}`, 'json');
      if (!challenge || challenge.status !== 'active') {
        return new Response(JSON.stringify({ error: 'Challenge not found or expired' }), { status: 404, headers });
      }
      
      if (challenge.participants.includes(player_id)) {
        return new Response(JSON.stringify({ error: 'Already joined this challenge' }), { status: 400, headers });
      }
      
      challenge.participants.push(player_id);
      await env.SCORES.put(`challenge:${challengeId}`, JSON.stringify(challenge));
      
      return new Response(JSON.stringify({
        success: true,
        challenge_id: challengeId,
        participant_count: challenge.participants.length
      }), { headers });
    }
    
    if (path.startsWith('/api/challenges/') && request.method === 'GET') {
      // Get challenge details
      const challengeId = url.pathname.split('/')[3];
      const challenge = await env.SCORES.get(`challenge:${challengeId}`, 'json');
      
      if (!challenge) {
        return new Response(JSON.stringify({ error: 'Challenge not found' }), { status: 404, headers });
      }
      
      return new Response(JSON.stringify(challenge), { headers });
    }
    
    return new Response(JSON.stringify({ 
      status: 'challenges endpoint active',
      available_endpoints: ['/create', '/{id}/join', '/{id}']
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

// --- Modular Handler: /api/payments ---
async function handleApiPayments(request, env, headers) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    if (path === '/api/payments/apple-pay/validate' && request.method === 'POST') {
      // Apple Pay merchant validation
      const data = await request.json();
      // TODO: Implement actual Apple Pay validation
      return new Response(JSON.stringify({ 
        success: true,
        merchant_id: 'your_merchant_id',
        domain_verification: 'verified'
      }), { headers });
    }
    
    if (path === '/api/payments/usdc/transfer' && request.method === 'POST') {
      // USDC transfer for entry fees or prizes
      const data = await request.json();
      const { from_wallet, to_wallet, amount, type = 'entry_fee' } = data;
      
      // TODO: Implement actual USDC transfer logic
      const transactionId = `usdc_${Date.now()}_${from_wallet}`;
      
      const transferRecord = {
        id: transactionId,
        from_wallet,
        to_wallet,
        amount,
        type,
        timestamp: Date.now(),
        status: 'completed'
      };
      
      await env.SCORES.put(`transfer:${transactionId}`, JSON.stringify(transferRecord));
      
      return new Response(JSON.stringify({
        success: true,
        transaction_id: transactionId,
        amount,
        status: 'completed'
      }), { headers });
    }
    
    return new Response(JSON.stringify({ 
      status: 'payments endpoint active',
      available_endpoints: ['/apple-pay/validate', '/usdc/transfer']
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

// --- Modular Handler: /api/analytics ---
async function handleApiAnalytics(request, env, headers) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    if (path === '/api/analytics/new-user' && request.method === 'POST') {
      // Track new user registration
      const data = await request.json();
      const { player_id, source = 'direct', referrer = null } = data;
      
      const analyticsRecord = {
        event: 'new_user',
        player_id,
        source,
        referrer,
        timestamp: Date.now()
      };
      
      await env.SCORES.put(`analytics:${Date.now()}_${player_id}`, JSON.stringify(analyticsRecord));
      
      return new Response(JSON.stringify({ success: true }), { headers });
    }
    
    if (path === '/api/analytics/game-play' && request.method === 'POST') {
      // Track game play events
      const data = await request.json();
      const { player_id, game = 'neon_drop', score, duration } = data;
      
      const playRecord = {
        event: 'game_play',
        player_id,
        game,
        score,
        duration,
        timestamp: Date.now()
      };
      
      await env.SCORES.put(`analytics:${Date.now()}_${player_id}`, JSON.stringify(playRecord));
      
      return new Response(JSON.stringify({ success: true }), { headers });
    }
    
    return new Response(JSON.stringify({ 
      status: 'analytics endpoint active',
      available_endpoints: ['/new-user', '/game-play']
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

// --- Utility: Get current AM/PM cycle key ---
function getCurrentCycleKey(game = 'neon_drop') {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = now.getHours();
  const cycle = hour < 12 ? 'am' : 'pm';
  return `leaderboard:${game}:${year}-${month}-${day}-${cycle}`;
}

// --- Utility: Get current prize pool key ---
function getCurrentPrizePoolKey(game = 'neon_drop') {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = now.getHours();
  const cycle = hour < 12 ? 'am' : 'pm';
  return `prizepool:${game}:${year}-${month}-${day}-${cycle}`;
}

// --- Update prize pool tracking (scaffold) ---
async function addToCurrentPrizePool(env, amount, game = 'neon_drop') {
  const key = getCurrentPrizePoolKey(game);
  let pool = parseFloat(await env.SCORES.get(key)) || 0;
  pool += amount;
  await env.SCORES.put(key, pool.toString());
}

// --- Enhanced leaderboard response with cycle info and prize previews ---
