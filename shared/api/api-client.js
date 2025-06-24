/* Centralized API Client for BlockZone Lab */

import { UnifiedAPIClient } from '../platform/api/UnifiedAPIClient.js';
import API_CONFIG from './api-config.js';

// Pre-configured API client instance
export const apiClient = new UnifiedAPIClient(API_CONFIG.WORKER_URL);

// Usage:
// import { apiClient } from './api-client.js';
// await apiClient.get('/api/leaderboard');
// await apiClient.post('/api/scores', { ... });

export { UnifiedAPIClient };
