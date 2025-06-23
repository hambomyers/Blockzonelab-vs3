/* ==========================================================================
   BLOCKZONE LAB - API CONFIGURATION
   Centralized API endpoints and configuration
   ========================================================================== */

export const API_CONFIG = {
  // Main Cloudflare Worker API
  WORKER_URL: 'https://blockzone-api.hambomyers.workers.dev',
    // Endpoints
  ENDPOINTS: {
    LEADERBOARD: '/api/leaderboard',
    SCORES: '/api/scores', 
    PLAYERS: '/api/players',
    TOURNAMENTS: '/api/tournaments'
  },
  
  // Request configuration
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json'
  },
  
  // Default parameters
  DEFAULT_PARAMS: {
    game: 'neon_drop',
    period: 'daily',
    limit: 100
  }
};

export default API_CONFIG;
