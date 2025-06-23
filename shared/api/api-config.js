/* ==========================================================================
   BLOCKZONE LAB - API CONFIGURATION
   Centralized API endpoints and configuration
   ========================================================================== */

export const API_CONFIG = {
  // Main Cloudflare Worker API
  WORKER_URL: 'https://blockzone-api.hambomyers.workers.dev/api',
  
  // Endpoints
  ENDPOINTS: {
    LEADERBOARD: '/leaderboard',
    SCORES: '/scores',
    PLAYERS: '/players',
    TOURNAMENTS: '/tournaments'
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
