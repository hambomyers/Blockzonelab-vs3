/* Centralized API Client for BlockZone Lab */

import { API_CONFIG } from './api-config.js';

class APIClient {
    constructor() {
        this.baseUrl = API_CONFIG.WORKER_URL;
        this.timeout = API_CONFIG.REQUEST_CONFIG.TIMEOUT;
        this.retryAttempts = API_CONFIG.REQUEST_CONFIG.RETRY_ATTEMPTS;
        this.retryDelay = API_CONFIG.REQUEST_CONFIG.RETRY_DELAY;
    }

    // Make API request with CORS error handling
    async request(endpoint, options = {}) {
        // Check if fallback mode is enabled
        if (API_CONFIG.FALLBACK_MODE) {
            console.log('⚠️ API calls disabled (FALLBACK_MODE enabled), skipping request to:', endpoint);
            throw new Error('API_UNAVAILABLE');
        }

        const url = `${this.baseUrl}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: this.timeout
        };

        const requestOptions = { ...defaultOptions, ...options };

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, requestOptions);
                
                if (response.ok) {
                    return await response.json();
                } else {
                    console.warn(`⚠️ API request failed (attempt ${attempt}/${this.retryAttempts}):`, response.status, response.statusText);
                }
            } catch (error) {
                console.warn(`⚠️ API request failed (attempt ${attempt}/${this.retryAttempts}):`, error.message);
                
                // If it's a CORS error or network error, don't retry
                if (error.name === 'TypeError' || error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
                    console.warn('⚠️ CORS/Network error detected, skipping retries');
                    throw new Error('API_UNAVAILABLE');
                }
                
                // Wait before retrying
                if (attempt < this.retryAttempts) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                }
            }
        }
        
        throw new Error('API_REQUEST_FAILED');
    }

    // Check if API is available
    async isAvailable() {
        try {
            await this.request('/api/health', { method: 'GET' });
            return true;
        } catch (error) {
            return false;
        }
    }

    // Auth endpoints
    async validateSession(sessionId) {
        return this.request('/api/auth/validate', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId })
        });
    }

    async createSession(deviceInfo) {
        return this.request('/api/auth/session', {
            method: 'POST',
            body: JSON.stringify({ device_info: deviceInfo })
        });
    }

    async upgradeSession(upgradeData) {
        return this.request('/api/auth/upgrade', {
            method: 'POST',
            body: JSON.stringify(upgradeData)
        });
    }

    // Player endpoints
    async registerPlayer(playerData) {
        return this.request('/api/players/register', {
            method: 'POST',
            body: JSON.stringify(playerData)
        });
    }

    async getPlayerProfile(playerId) {
        return this.request(`/api/players/profile/${playerId}`, {
            method: 'GET'
        });
    }

    // Score endpoints
    async submitScore(scoreData) {
        return this.request('/api/scores/submit', {
            method: 'POST',
            body: JSON.stringify(scoreData)
        });
    }

    async getLeaderboard(game, period = 'daily', limit = 100) {
        return this.request(`/api/scores/leaderboard?game=${game}&period=${period}&limit=${limit}`, {
            method: 'GET'
        });
    }

    // Tournament endpoints
    async createTournament(tournamentData) {
        return this.request('/api/tournaments/create', {
            method: 'POST',
            body: JSON.stringify(tournamentData)
        });
    }

    async joinTournament(tournamentId, playerId) {
        return this.request('/api/tournaments/join', {
            method: 'POST',
            body: JSON.stringify({ tournament_id: tournamentId, player_id: playerId })
        });
    }

    // Challenge endpoints
    async createChallenge(challengeData) {
        return this.request('/api/challenges/create', {
            method: 'POST',
            body: JSON.stringify(challengeData)
        });
    }

    async acceptChallenge(challengeId, playerId) {
        return this.request('/api/challenges/accept', {
            method: 'POST',
            body: JSON.stringify({ challenge_id: challengeId, player_id: playerId })
        });
    }
}

// Create singleton instance
const apiClient = new APIClient();

export default apiClient;
