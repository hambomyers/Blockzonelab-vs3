/**
 * Tournament Manager Worker - Cloudflare Worker
 * Handles live tournament data, leaderboards, and prize distribution
 * Real-time API for BlockZone tournament system
 */

// KV Bindings (set in wrangler.toml):
// TOURNAMENTS - tournament data and leaderboards
// PLAYERS - player profiles and stats
// PRIZE_POOLS - prize pool tracking and distribution

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // CORS headers for all responses
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };
        
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }
        
        try {
            // Tournament API Routes
            if (path === '/api/tournament/current') {
                return await getCurrentTournament(env, corsHeaders);
            }
            
            if (path === '/api/tournament/leaderboard') {
                return await getTournamentLeaderboard(env, corsHeaders);
            }
            
            if (path === '/api/tournament/submit-score' && request.method === 'POST') {
                return await submitScore(request, env, corsHeaders);
            }
            
            if (path === '/api/tournament/enter' && request.method === 'POST') {
                return await enterTournament(request, env, corsHeaders);
            }
            
            if (path === '/api/tournament/distribute-prizes' && request.method === 'POST') {
                return await distributePrizes(env, corsHeaders);
            }
            
            // Player API Routes
            if (path === '/api/player/profile' && request.method === 'GET') {
                return await getPlayerProfile(request, env, corsHeaders);
            }
            
            return new Response('Not Found', { status: 404, headers: corsHeaders });
            
        } catch (error) {
            console.error('Worker error:', error);
            return new Response(
                JSON.stringify({ error: 'Internal server error' }), 
                { 
                    status: 500, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }
    }
};

async function getCurrentTournament(env, corsHeaders) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const tournamentKey = `tournament:${today}`;
    
    let tournament = await env.TOURNAMENTS.get(tournamentKey, { type: 'json' });
    
    if (!tournament) {
        // Create new tournament for today
        tournament = await createDailyTournament(env, today);
    }
    
    // Calculate time until reset (12pm EST = 5pm UTC)
    const now = new Date();
    const resetTime = new Date();
    resetTime.setUTCHours(17, 0, 0, 0); // 12pm EST = 5pm UTC
    
    if (now > resetTime) {
        resetTime.setDate(resetTime.getDate() + 1);
    }
    
    const timeUntilReset = resetTime - now;
    const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    const response = {
        ...tournament,
        countdown: `Resets in ${hours}h ${minutes}m`,
        timeUntilReset: timeUntilReset
    };
    
    return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}

async function getTournamentLeaderboard(env, corsHeaders) {
    const today = new Date().toISOString().split('T')[0];
    const leaderboardKey = `leaderboard:${today}`;
    
    const leaderboard = await env.TOURNAMENTS.get(leaderboardKey, { type: 'json' }) || [];
    
    // Calculate prize distribution (hyperbolic curve)
    const leaderboardWithPrizes = leaderboard.map((entry, index) => {
        const prize = calculatePrize(index + 1, leaderboard.length);
        return { ...entry, prize };
    });
    
    return new Response(
        JSON.stringify({
            leaderboard: leaderboardWithPrizes,
            totalPlayers: leaderboard.length,
            lastUpdated: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}

async function submitScore(request, env, corsHeaders) {
    const { playerId, playerName, score, walletAddress } = await request.json();
    
    if (!playerId || !playerName || typeof score !== 'number') {
        return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    const today = new Date().toISOString().split('T')[0];
    const leaderboardKey = `leaderboard:${today}`;
    
    // Get current leaderboard
    let leaderboard = await env.TOURNAMENTS.get(leaderboardKey, { type: 'json' }) || [];
    
    // Find existing player entry
    const existingIndex = leaderboard.findIndex(entry => entry.playerId === playerId);
    
    const newEntry = {
        playerId,
        playerName,
        score,
        walletAddress,
        timestamp: new Date().toISOString(),
        rank: 0 // Will be calculated after sorting
    };
    
    if (existingIndex >= 0) {
        // Update existing entry if new score is higher
        if (score > leaderboard[existingIndex].score) {
            leaderboard[existingIndex] = newEntry;
        }
    } else {
        // Add new entry
        leaderboard.push(newEntry);
    }
    
    // Sort by score (descending) and assign ranks
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
    });
    
    // Keep only top 100 entries
    leaderboard = leaderboard.slice(0, 100);
    
    // Save updated leaderboard
    await env.TOURNAMENTS.put(leaderboardKey, JSON.stringify(leaderboard));
    
    // Update tournament entry count
    const tournamentKey = `tournament:${today}`;
    const tournament = await env.TOURNAMENTS.get(tournamentKey, { type: 'json' }) || {};
    tournament.entries = leaderboard.length;
    tournament.prizePool = calculateTotalPrizePool(leaderboard.length);
    await env.TOURNAMENTS.put(tournamentKey, JSON.stringify(tournament));
    
    return new Response(
        JSON.stringify({
            success: true,
            newRank: newEntry.rank,
            totalPlayers: leaderboard.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}

async function enterTournament(request, env, corsHeaders) {
    const { playerId, playerName, walletAddress, paymentType } = await request.json();
    
    // Validate payment (future: integrate with USDC.E smart contract)
    if (paymentType === 'quarter') {
        // Validate $0.25 USDC.E payment
    } else if (paymentType === 'roll') {
        // Validate Roll of Quarters subscription
    } else if (paymentType === 'free') {
        // Validate 1 free game daily limit
    }
    
    const today = new Date().toISOString().split('T')[0];
    const entryKey = `entry:${today}:${playerId}`;
    
    // Check if player already entered today
    const existingEntry = await env.TOURNAMENTS.get(entryKey);
    if (existingEntry && paymentType === 'free') {
        return new Response(
            JSON.stringify({ error: 'Free game already used today' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    // Record tournament entry
    const entry = {
        playerId,
        playerName,
        walletAddress,
        paymentType,
        timestamp: new Date().toISOString()
    };
    
    await env.TOURNAMENTS.put(entryKey, JSON.stringify(entry));
    
    return new Response(
        JSON.stringify({ success: true, message: 'Tournament entry confirmed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}

async function createDailyTournament(env, date) {
    const tournament = {
        date,
        status: 'active',
        startTime: `${date}T17:00:00Z`, // 12pm EST
        endTime: `${date}T17:00:00Z`, // Next day 12pm EST
        prizePool: 0,
        entries: 0,
        created: new Date().toISOString()
    };
    
    await env.TOURNAMENTS.put(`tournament:${date}`, JSON.stringify(tournament));
    return tournament;
}

function calculatePrize(rank, totalPlayers) {
    if (rank > 25) return 0; // Only top 25 get prizes
    
    const totalPrizePool = calculateTotalPrizePool(totalPlayers);
    
    // Hyperbolic distribution - heavily weighted toward top ranks
    const weights = Array.from({ length: 25 }, (_, i) => 1 / Math.pow(i + 1, 1.5));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    const rankWeight = weights[rank - 1] || 0;
    const prize = (rankWeight / totalWeight) * totalPrizePool * 0.9; // 90% to players, 10% platform fee
    
    return Math.max(prize, 0.25); // Minimum $0.25 prize
}

function calculateTotalPrizePool(entryCount) {
    // Estimate based on payment mix: 70% quarters ($0.25), 30% free
    return entryCount * 0.25 * 0.7; // Simplified calculation
}

async function distributePrizes(env, corsHeaders) {
    // This would be called by a scheduled worker at 12pm EST daily
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().split('T')[0];
    
    const leaderboardKey = `leaderboard:${date}`;
    const leaderboard = await env.TOURNAMENTS.get(leaderboardKey, { type: 'json' }) || [];
    
    const winners = leaderboard.slice(0, 25); // Top 25 winners
    
    // Here you would integrate with Sonic Labs USDC.E smart contract
    // to automatically distribute prizes to winner wallet addresses
    
    const distribution = winners.map(winner => ({
        playerId: winner.playerId,
        walletAddress: winner.walletAddress,
        prize: calculatePrize(winner.rank, leaderboard.length),
        rank: winner.rank
    }));
    
    // Record distribution
    await env.TOURNAMENTS.put(`distribution:${date}`, JSON.stringify(distribution));
    
    return new Response(
        JSON.stringify({ success: true, distributed: distribution.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}

async function getPlayerProfile(request, env, corsHeaders) {
    const url = new URL(request.url);
    const playerId = url.searchParams.get('playerId');
    
    if (!playerId) {
        return new Response(
            JSON.stringify({ error: 'Missing playerId parameter' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    const profile = await env.PLAYERS.get(`player:${playerId}`, { type: 'json' });
    
    if (!profile) {
        return new Response(
            JSON.stringify({ error: 'Player not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    return new Response(
        JSON.stringify(profile),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}
