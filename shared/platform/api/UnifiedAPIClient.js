// shared/platform/api/UnifiedAPIClient.js
/**
 * Unified API Client
 * Handles all HTTP requests with retry logic, error handling, and authentication
 */

export class UnifiedAPIClient {
  constructor(baseURL = '', options = {}) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.options = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableLogging: true,
      ...options
    };
    
    this.authToken = null;
    this.interceptors = {
      request: [],
      response: []
    };
    
    // Bind methods
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.delete = this.delete.bind(this);
  }

  /**
   * Set authentication token
   */
  setAuthToken(token) {
    this.authToken = token;
    this.log('🔐 Auth token set');
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.authToken = null;
    this.log('🔓 Auth token cleared');
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const url = this.buildURL(endpoint, params);
    return await this.request(url, {
      method: 'GET'
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    const url = this.buildURL(endpoint);
    return await this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    const url = this.buildURL(endpoint);
    return await this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    const url = this.buildURL(endpoint);
    return await this.request(url, {
      method: 'DELETE'
    });
  }

  /**
   * Core request method with retry logic
   */
  async request(url, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        this.log(`📡 ${options.method || 'GET'} ${url} (attempt ${attempt})`);
        
        const response = await this.executeRequest(url, options);
        
        this.log(`✅ ${response.status} ${url}`);
        return response;
      } catch (error) {
        lastError = error;
        
        this.log(`❌ ${url} failed (attempt ${attempt}): ${error.message}`);
        
        if (attempt < this.options.retryAttempts && this.shouldRetry(error)) {
          const delay = this.calculateRetryDelay(attempt);
          this.log(`⏳ Retrying in ${delay}ms...`);
          await this.delay(delay);
        } else {
          break;
        }
      }
    }
    
    throw new Error(`Request failed after ${this.options.retryAttempts} attempts: ${lastError.message}`);
  }

  /**
   * Execute the actual HTTP request
   */
  async executeRequest(url, options) {
    const requestConfig = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers
      },
      signal: this.createAbortSignal(),
      ...options
    };

    // Apply request interceptors
    const finalConfig = await this.applyRequestInterceptors(requestConfig);
    
    // Execute fetch
    const response = await fetch(url, finalConfig);
    
    // Check for HTTP errors
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Parse response
    const data = await this.parseResponse(response);
    
    // Apply response interceptors
    const finalResponse = await this.applyResponseInterceptors({
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      url: response.url
    });
    
    return finalResponse;
  }

  /**
   * Build full URL with query parameters
   */
  buildURL(endpoint, params = {}) {
    let url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    const queryString = this.buildQueryString(params);
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
    
    return url;
  }

  /**
   * Build query string from parameters
   */
  buildQueryString(params) {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }
    
    return Object.entries(params)
      .filter(([key, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    if (!this.authToken) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${this.authToken}`
    };
  }

  /**
   * Create abort signal for timeout
   */
  createAbortSignal() {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), this.options.timeout);
    return controller.signal;
  }

  /**
   * Parse response based on content type
   */
  async parseResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return await response.json();
    } else if (contentType.includes('text/')) {
      return await response.text();
    } else {
      return await response.blob();
    }
  }

  /**
   * Determine if request should be retried
   */
  shouldRetry(error) {
    // Retry on network errors and 5xx status codes
    return (
      error.name === 'TypeError' || // Network error
      error.name === 'AbortError' || // Timeout
      (error.message && error.message.includes('HTTP 5')) // 5xx errors
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt) {
    return this.options.retryDelay * Math.pow(2, attempt - 1);
  }

  /**
   * Apply request interceptors
   */
  async applyRequestInterceptors(config) {
    let finalConfig = { ...config };
    
    for (const interceptor of this.interceptors.request) {
      try {
        finalConfig = await interceptor(finalConfig);
      } catch (error) {
        this.log(`⚠️ Request interceptor error: ${error.message}`);
      }
    }
    
    return finalConfig;
  }

  /**
   * Apply response interceptors
   */
  async applyResponseInterceptors(response) {
    let finalResponse = { ...response };
    
    for (const interceptor of this.interceptors.response) {
      try {
        finalResponse = await interceptor(finalResponse);
      } catch (error) {
        this.log(`⚠️ Response interceptor error: ${error.message}`);
      }
    }
    
    return finalResponse;
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.interceptors.request.push(interceptor);
    }
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.interceptors.response.push(interceptor);
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logging utility
   */
  log(message) {
    if (this.options.enableLogging) {
      console.log(`[API] ${message}`);
    }
  }

  // Convenience methods for common endpoints
  
  /**
   * Submit game score
   */
  async submitScore(gameId, playerId, score, metadata = {}) {
    return await this.post('/api/scores', {
      gameId,
      playerId,
      score,
      metadata,
      timestamp: Date.now()
    });
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(gameId, limit = 100) {
    return await this.get('/api/leaderboard', {
      gameId,
      limit
    });
  }

  /**
   * Get tournament data
   */
  async getTournament(tournamentId) {
    return await this.get(`/api/tournaments/${tournamentId}`);
  }

  /**
   * Join tournament
   */
  async joinTournament(tournamentId, playerId, entryFee = 0) {
    return await this.post(`/api/tournaments/${tournamentId}/join`, {
      playerId,
      entryFee,
      timestamp: Date.now()
    });
  }

  /**
   * Get player profile
   */
  async getPlayerProfile(playerId) {
    return await this.get(`/api/players/${playerId}`);
  }

  /**
   * Update player profile
   */
  async updatePlayerProfile(playerId, profileData) {
    return await this.put(`/api/players/${playerId}`, profileData);
  }

  /**
   * Process payment
   */
  async processPayment(paymentData) {
    return await this.post('/api/payments', {
      ...paymentData,
      timestamp: Date.now()
    });
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(playerId) {
    return await this.get('/api/payments/history', {
      playerId
    });
  }
}