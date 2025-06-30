/* ==========================================================================
   BLOCKZONE LAB - API CONFIGURATION
   Centralized API endpoints and configuration
   ========================================================================== */

export const API_CONFIG = {
  // Production API endpoints (temporarily disabled until backend is deployed)
  WORKER_URL: 'https://api.blockzonelab.com',
  
  // Fallback for when backend is not available
  FALLBACK_MODE: true, // Set to true to disable API calls temporarily
  
  // API version
  API_VERSION: 'v1',
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      VALIDATE: '/api/auth/validate',
      SESSION: '/api/auth/session',
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout'
    },
    PLAYERS: {
      REGISTER: '/api/players/register',
      PROFILE: '/api/players/profile',
      UPDATE: '/api/players/update',
      STATS: '/api/players/stats'
    },
    SCORES: {
      SUBMIT: '/api/scores/submit',
      LEADERBOARD: '/api/scores/leaderboard',
      DAILY: '/api/scores/daily',
      HISTORY: '/api/scores/history'
    },
    TOURNAMENTS: {
      CREATE: '/api/tournaments/create',
      JOIN: '/api/tournaments/join',
      STATUS: '/api/tournaments/status',
      RESULTS: '/api/tournaments/results'
    },
    CHALLENGES: {
      CREATE: '/api/challenges/create',
      ACCEPT: '/api/challenges/accept',
      STATUS: '/api/challenges/status',
      COMPLETE: '/api/challenges/complete'
    }
  },
  
  // Request configuration
  REQUEST_CONFIG: {
    TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 second
  },
  
  // Default parameters
  DEFAULT_PARAMS: {
    game: 'neon_drop',
    period: 'daily',
    limit: 100
  }
};

export default API_CONFIG;
