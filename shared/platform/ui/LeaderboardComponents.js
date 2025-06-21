/**
 * LeaderboardComponents.js - Unified UI Components for Leaderboards
 * 
 * PHASE 2: UI COMPONENT CONSOLIDATION
 * 
 * Consolidates functionality from:
 * - shared/ui/TournamentLeaderboard.js (base UI component)
 * - games/neondrop/ui/TournamentLeaderboard.js (game-specific features)
 * 
 * Features:
 * - Responsive, mobile-first design
 * - Real-time update animations
 * - Tournament type switching (daily/weekly/seasonal)
 * - Player profile integration
 * - Optimistic UI updates
 * - Cross-game compatibility
 */

import { EventEmitter } from '../../utils/EventEmitter.js';

export class UnifiedLeaderboardUI extends EventEmitter {
    constructor(container, options = {}) {
        super();
        
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        if (!this.container) {
            throw new Error('LeaderboardUI requires a valid container element');
        }

        this.options = {
            // Display options
            maxEntries: options.maxEntries || 10,
            showRankIcons: options.showRankIcons !== false,
            showPlayerAvatars: options.showPlayerAvatars !== false,
            showScoreAnimations: options.showScoreAnimations !== false,
            
            // Tournament options
            enableTournamentSwitching: options.enableTournamentSwitching !== false,
            defaultTournament: options.defaultTournament || 'daily',
            
            // Real-time options
            enableRealtime: options.enableRealtime !== false,
            optimisticUpdates: options.optimisticUpdates !== false,
            
            // Theme options
            theme: options.theme || 'neon',
            showTimeRemaining: options.showTimeRemaining !== false,
            
            // Interaction options
            enablePlayerProfiles: options.enablePlayerProfiles !== false,
            enableScoreHistory: options.enableScoreHistory !== false,
            
            ...options
        };

        // State management
        this.currentTournament = this.options.defaultTournament;
        this.leaderboardData = [];
        this.isVisible = false;
        this.isLoading = false;
        this.lastUpdate = null;
        
        // Real-time components (lazy loaded)
        this.socket = null;
        this.leaderboard = null;
        
        // Animation state
        this.animatingEntries = new Set();
        this.pendingUpdates = new Map();
        
        // Performance tracking
        this.metrics = {
            renderTime: 0,
            updatesProcessed: 0,
            animationsPlayed: 0
        };
        
        // Initialize UI
        this.initialize();
    }

    /**
     * Initialize the leaderboard UI
     */
    async initialize() {
        try {
            console.log('🎨 Initializing UnifiedLeaderboardUI...');
            
            // Create UI structure
            this.createUIStructure();
            
            // Apply theme
            this.applyTheme();
            
            // Set up event handlers
            this.setupEventHandlers();
            
            // Initialize real-time components if enabled
            if (this.options.enableRealtime) {
                await this.initializeRealtime();
            }
            
            // Load initial data
            await this.loadTournamentData(this.currentTournament);
            
            this.emit('initialized');
            console.log('✅ UnifiedLeaderboardUI initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize LeaderboardUI:', error);
            this.emit('error', { type: 'initialization', error });
        }
    }

    /**
     * Create the UI structure
     */
    createUIStructure() {
        this.container.className = `leaderboard-container ${this.options.theme}-theme`;
        
        this.container.innerHTML = `
            <div class="leaderboard-header">
                <div class="tournament-selector">
                    <button class="tournament-tab active" data-tournament="daily">
                        <span class="tab-icon">📅</span>
                        <span class="tab-label">Daily</span>
                    </button>
                    <button class="tournament-tab" data-tournament="weekly">
                        <span class="tab-icon">📊</span>
                        <span class="tab-label">Weekly</span>
                    </button>
                    <button class="tournament-tab" data-tournament="all-time">
                        <span class="tab-icon">🏆</span>
                        <span class="tab-label">All-Time</span>
                    </button>
                </div>
                
                <div class="tournament-info">
                    <div class="prize-pool">
                        <span class="prize-label">Prize Pool</span>
                        <span class="prize-amount">$0</span>
                    </div>
                    <div class="time-remaining" ${!this.options.showTimeRemaining ? 'style="display: none;"' : ''}>
                        <span class="time-label">Time Left</span>
                        <span class="time-value">--:--:--</span>
                    </div>
                </div>
            </div>
            
            <div class="leaderboard-body">
                <div class="loading-indicator" style="display: none;">
                    <div class="loading-spinner"></div>
                    <span class="loading-text">Loading leaderboard...</span>
                </div>
                
                <div class="error-message" style="display: none;">
                    <span class="error-icon">⚠️</span>
                    <span class="error-text">Failed to load leaderboard</span>
                    <button class="retry-button">Retry</button>
                </div>
                
                <div class="leaderboard-list">
                    <div class="leaderboard-entry leaderboard-header-row">
                        <div class="rank-column">Rank</div>
                        <div class="player-column">Player</div>
                        <div class="score-column">Score</div>
                        <div class="actions-column">Actions</div>
                    </div>
                </div>
                
                <div class="leaderboard-footer">
                    <div class="player-stats">
                        <span class="player-rank">Your Rank: --</span>
                        <span class="player-score">Your Score: --</span>
                    </div>
                    <div class="leaderboard-actions">
                        <button class="refresh-button">🔄 Refresh</button>
                        <button class="expand-button">📊 View Full</button>
                    </div>
                </div>
            </div>
            
            <div class="realtime-indicator ${this.options.enableRealtime ? '' : 'hidden'}">
                <span class="realtime-status offline">🔴 Offline</span>
                <span class="update-count">0 updates</span>
            </div>
        `;
        
        // Cache important elements
        this.elements = {
            header: this.container.querySelector('.leaderboard-header'),
            tournamentTabs: this.container.querySelectorAll('.tournament-tab'),
            prizeAmount: this.container.querySelector('.prize-amount'),
            timeValue: this.container.querySelector('.time-value'),
            body: this.container.querySelector('.leaderboard-body'),
            loading: this.container.querySelector('.loading-indicator'),
            error: this.container.querySelector('.error-message'),
            list: this.container.querySelector('.leaderboard-list'),
            footer: this.container.querySelector('.leaderboard-footer'),
            playerRank: this.container.querySelector('.player-rank'),
            playerScore: this.container.querySelector('.player-score'),
            realtimeStatus: this.container.querySelector('.realtime-status'),
            updateCount: this.container.querySelector('.update-count')
        };
    }

    /**
     * Apply theme styling
     */
    applyTheme() {
        const themes = {
            neon: {
                primary: '#00ffff',
                secondary: '#ff00ff',
                background: '#0a0a0a',
                surface: '#1a1a2e',
                text: '#ffffff',
                accent: '#ffd700'
            },
            classic: {
                primary: '#007bff',
                secondary: '#6c757d',
                background: '#ffffff',
                surface: '#f8f9fa',
                text: '#212529',
                accent: '#28a745'
            },
            dark: {
                primary: '#bb86fc',
                secondary: '#03dac6',
                background: '#121212',
                surface: '#1e1e1e',
                text: '#ffffff',
                accent: '#cf6679'
            }
        };
        
        const themeColors = themes[this.options.theme] || themes.neon;
        
        // Apply CSS custom properties
        for (const [property, value] of Object.entries(themeColors)) {
            this.container.style.setProperty(`--leaderboard-${property}`, value);
        }
    }

    /**
     * Set up event handlers
     */
    setupEventHandlers() {
        // Tournament tab switching
        this.elements.tournamentTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tournament = tab.dataset.tournament;
                this.switchTournament(tournament);
            });
        });
        
        // Refresh button
        const refreshButton = this.container.querySelector('.refresh-button');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.refreshLeaderboard();
            });
        }
        
        // Expand button
        const expandButton = this.container.querySelector('.expand-button');
        if (expandButton) {
            expandButton.addEventListener('click', () => {
                this.showFullLeaderboard();
            });
        }
        
        // Retry button
        const retryButton = this.container.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.loadTournamentData(this.currentTournament);
            });
        }
        
        // Player profile clicks (if enabled)
        if (this.options.enablePlayerProfiles) {
            this.elements.list.addEventListener('click', (e) => {
                const playerElement = e.target.closest('.player-info');
                if (playerElement) {
                    const playerId = playerElement.dataset.playerId;
                    this.showPlayerProfile(playerId);
                }
            });
        }
    }

    /**
     * Initialize real-time components
     */
    async initializeRealtime() {
        try {
            // Dynamically import components to avoid circular dependencies
            const [{ LeaderboardSocket }, { UnifiedLeaderboard }] = await Promise.all([
                import('../realtime/LeaderboardSocket.js'),
                import('../systems/UnifiedLeaderboard.js')
            ]);
            
            // Initialize socket connection
            this.socket = new LeaderboardSocket({
                enableOptimisticUpdates: this.options.optimisticUpdates
            });
            
            // Initialize leaderboard system
            this.leaderboard = new UnifiedLeaderboard({
                enableRealtime: true
            });
            
            // Set up real-time event handlers
            this.socket.on('connected', () => {
                this.updateRealtimeStatus('online');
            });
            
            this.socket.on('disconnected', () => {
                this.updateRealtimeStatus('offline');
            });
            
            this.socket.on('scoreUpdate', (data) => {
                this.handleRealtimeScoreUpdate(data);
            });
            
            this.socket.on('rankingChange', (data) => {
                this.handleRankingChange(data);
            });
            
            this.socket.on('optimisticUpdate', (data) => {
                if (this.options.optimisticUpdates) {
                    this.handleOptimisticUpdate(data);
                }
            });
            
            this.socket.on('optimisticRollback', (data) => {
                this.handleOptimisticRollback(data);
            });
            
        } catch (error) {
            console.warn('⚠️ Real-time components not available:', error);
            this.options.enableRealtime = false;
        }
    }

    /**
     * Load tournament data
     * @param {string} tournamentId - Tournament identifier
     */
    async loadTournamentData(tournamentId) {
        this.showLoading(true);
        this.hideError();
        
        try {
            console.log(`📊 Loading tournament data: ${tournamentId}`);
            
            // Get leaderboard data
            let leaderboardData = [];
            if (this.leaderboard) {
                leaderboardData = await this.leaderboard.getTournamentLeaderboard(tournamentId, this.options.maxEntries);
            } else {
                // Fallback to API call
                leaderboardData = await this.fetchLeaderboardFromAPI(tournamentId);
            }
            
            // Get tournament info
            const tournamentInfo = await this.fetchTournamentInfo(tournamentId);
            
            // Update UI
            this.updateTournamentInfo(tournamentInfo);
            this.renderLeaderboard(leaderboardData);
            
            // Subscribe to real-time updates
            if (this.socket && this.socket.isConnected) {
                this.socket.subscribe(tournamentId, this.handleRealtimeUpdate.bind(this));
            }
            
            this.lastUpdate = Date.now();
            this.emit('dataLoaded', { tournamentId, data: leaderboardData });
            
        } catch (error) {
            console.error('❌ Failed to load tournament data:', error);
            this.showError('Failed to load leaderboard data');
            this.emit('error', { type: 'dataLoading', error });
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Fetch leaderboard from API (fallback)
     */
    async fetchLeaderboardFromAPI(tournamentId) {
        const response = await fetch(`/api/leaderboard?tournament=${tournamentId}&limit=${this.options.maxEntries}`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const result = await response.json();
        return result.scores || [];
    }

    /**
     * Fetch tournament info from API
     */
    async fetchTournamentInfo(tournamentId) {
        try {
            const response = await fetch(`/api/tournaments/${tournamentId}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch tournament info:', error);
        }
        
        // Return default info
        return {
            id: tournamentId,
            name: tournamentId.charAt(0).toUpperCase() + tournamentId.slice(1),
            prizePool: 0,
            timeRemaining: '00:00:00'
        };
    }

    /**
     * Render leaderboard data
     * @param {Array} data - Leaderboard entries
     * @param {boolean} animate - Whether to animate the update
     */
    render(data, animate = false) {
        this.renderLeaderboard(data, animate);
    }

    /**
     * Render leaderboard entries
     */
    renderLeaderboard(data, animate = false) {
        const startTime = performance.now();
        
        this.leaderboardData = data;
        
        // Clear existing entries (except header)
        const existingEntries = this.elements.list.querySelectorAll('.leaderboard-entry:not(.leaderboard-header-row)');
        existingEntries.forEach(entry => entry.remove());
        
        // Render new entries
        data.forEach((entry, index) => {
            const entryElement = this.createLeaderboardEntry(entry, index + 1);
            this.elements.list.appendChild(entryElement);
            
            // Add entrance animation
            if (animate) {
                this.animateEntryEntrance(entryElement, index);
            }
        });
        
        // Update player stats
        this.updatePlayerStats();
        
        // Track performance
        this.metrics.renderTime = performance.now() - startTime;
        console.log(`🎨 Rendered ${data.length} entries in ${this.metrics.renderTime.toFixed(2)}ms`);
    }

    /**
     * Create a leaderboard entry element
     */
    createLeaderboardEntry(entry, rank) {
        const entryDiv = document.createElement('div');
        entryDiv.className = `leaderboard-entry rank-${rank}`;
        entryDiv.dataset.playerId = entry.playerId || entry.player_id;
        
        // Rank display with icons for top 3
        const rankDisplay = rank <= 3 && this.options.showRankIcons
            ? this.getRankIcon(rank)
            : `#${rank}`;
        
        // Player avatar
        const avatarHtml = this.options.showPlayerAvatars
            ? `<img class="player-avatar" src="${entry.avatar || '/assets/icons/default-avatar.svg'}" alt="${entry.playerName}" loading="lazy">`
            : '';
        
        entryDiv.innerHTML = `
            <div class="rank-column">
                <span class="rank-display">${rankDisplay}</span>
                <span class="rank-change ${this.getRankChangeClass(entry.rankChange || 0)}">${this.getRankChangeIcon(entry.rankChange || 0)}</span>
            </div>
            <div class="player-column">
                <div class="player-info" data-player-id="${entry.playerId || entry.player_id}">
                    ${avatarHtml}
                    <div class="player-details">
                        <span class="player-name">${entry.playerName || entry.player_name || `Player ${entry.playerId}`}</span>
                        <span class="player-stats">${entry.gamesPlayed || 0} games</span>
                    </div>
                </div>
            </div>
            <div class="score-column">
                <span class="score-value" data-score="${entry.score}">${this.formatScore(entry.score)}</span>
                <span class="score-time">${this.formatTimeAgo(entry.timestamp || Date.now())}</span>
            </div>
            <div class="actions-column">
                <button class="view-profile-btn" ${!this.options.enablePlayerProfiles ? 'style="display: none;"' : ''} title="View Profile">👤</button>
                <button class="view-replay-btn" ${!this.options.enableScoreHistory ? 'style="display: none;"' : ''} title="View Replay">📹</button>
            </div>
        `;
        
        return entryDiv;
    }

    /**
     * Get rank icon for top 3 positions
     */
    getRankIcon(rank) {
        const icons = {
            1: '🥇',
            2: '🥈',
            3: '🥉'
        };
        return icons[rank] || `#${rank}`;
    }

    /**
     * Get rank change class
     */
    getRankChangeClass(change) {
        if (change > 0) return 'rank-up';
        if (change < 0) return 'rank-down';
        return 'rank-same';
    }

    /**
     * Get rank change icon
     */
    getRankChangeIcon(change) {
        if (change > 0) return '↗️';
        if (change < 0) return '↘️';
        return '➡️';
    }

    /**
     * Format score for display
     */
    formatScore(score) {
        if (score >= 1000000) {
            return `${(score / 1000000).toFixed(1)}M`;
        }
        if (score >= 1000) {
            return `${(score / 1000).toFixed(1)}K`;
        }
        return score.toLocaleString();
    }

    /**
     * Format time ago
     */
    formatTimeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    /**
     * Update score for a specific player with animation
     * @param {string} playerId - Player identifier
     * @param {number} newScore - New score value
     * @param {boolean} animate - Whether to animate the update
     */
    updateScore(playerId, newScore, animate = true) {
        const entryElement = this.elements.list.querySelector(`[data-player-id="${playerId}"]`);
        if (!entryElement) return;
        
        const scoreElement = entryElement.querySelector('.score-value');
        if (!scoreElement) return;
        
        const oldScore = parseInt(scoreElement.dataset.score);
        
        if (animate && this.options.showScoreAnimations) {
            this.animateScoreUpdate(scoreElement, oldScore, newScore);
        } else {
            scoreElement.textContent = this.formatScore(newScore);
            scoreElement.dataset.score = newScore;
        }
        
        // Update timestamp
        const timeElement = entryElement.querySelector('.score-time');
        if (timeElement) {
            timeElement.textContent = this.formatTimeAgo(Date.now());
        }
    }

    /**
     * Switch tournament view
     * @param {string} tournamentId - Tournament identifier
     */
    async switchTournament(tournamentId) {
        if (tournamentId === this.currentTournament) return;
        
        console.log(`🔄 Switching to tournament: ${tournamentId}`);
        
        // Update tab states
        this.elements.tournamentTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tournament === tournamentId);
        });
        
        // Unsubscribe from current tournament
        if (this.socket && this.currentTournament) {
            this.socket.unsubscribe(this.currentTournament, this.handleRealtimeUpdate.bind(this));
        }
        
        this.currentTournament = tournamentId;
        
        // Load new tournament data
        await this.loadTournamentData(tournamentId);
        
        this.emit('tournamentSwitched', { tournamentId });
    }

    /**
     * Show player profile
     * @param {string} playerId - Player identifier
     */
    showPlayerProfile(playerId) {
        console.log(`👤 Showing profile for player: ${playerId}`);
        this.emit('playerProfileRequested', { playerId });
        
        // Implementation would show a modal or navigate to profile page
        // For now, just emit the event for parent components to handle
    }

    /**
     * Show loading state
     */
    showLoading(show = true) {
        this.isLoading = show;
        this.elements.loading.style.display = show ? 'flex' : 'none';
        this.elements.list.style.opacity = show ? '0.5' : '1';
    }

    /**
     * Show error state
     */
    showError(message) {
        this.elements.error.style.display = 'flex';
        this.elements.error.querySelector('.error-text').textContent = message;
    }

    /**
     * Hide error state
     */
    hideError() {
        this.elements.error.style.display = 'none';
    }

    /**
     * Update tournament info display
     */
    updateTournamentInfo(info) {
        if (info.prizePool !== undefined) {
            this.elements.prizeAmount.textContent = `$${info.prizePool}`;
        }
        
        if (info.timeRemaining) {
            this.elements.timeValue.textContent = info.timeRemaining;
        }
    }

    /**
     * Update player stats
     */
    updatePlayerStats() {
        // This would be implemented based on current player data
        // For now, just update with placeholder
        this.elements.playerRank.textContent = 'Your Rank: --';
        this.elements.playerScore.textContent = 'Your Score: --';
    }

    /**
     * Update real-time status indicator
     */
    updateRealtimeStatus(status) {
        const statusElement = this.elements.realtimeStatus;
        if (!statusElement) return;
        
        statusElement.className = `realtime-status ${status}`;
        statusElement.textContent = status === 'online' ? '🟢 Live' : '🔴 Offline';
    }

    /**
     * Refresh leaderboard data
     */
    async refreshLeaderboard() {
        console.log('🔄 Refreshing leaderboard...');
        await this.loadTournamentData(this.currentTournament);
    }

    /**
     * Show full leaderboard
     */
    showFullLeaderboard() {
        console.log('📊 Showing full leaderboard...');
        this.emit('fullLeaderboardRequested', { tournamentId: this.currentTournament });
    }

    /**
     * Handle real-time updates
     */
    handleRealtimeUpdate(data) {
        console.log('⚡ Real-time update received:', data);
        
        switch (data.type) {
            case 'scoreUpdate':
                this.handleRealtimeScoreUpdate(data);
                break;
            case 'rankingChange':
                this.handleRankingChange(data);
                break;
            case 'tournamentUpdate':
                this.handleTournamentUpdate(data);
                break;
        }
        
        // Update metrics
        this.metrics.updatesProcessed++;
        if (this.elements.updateCount) {
            this.elements.updateCount.textContent = `${this.metrics.updatesProcessed} updates`;
        }
    }

    /**
     * Handle real-time score updates
     */
    handleRealtimeScoreUpdate(data) {
        const { playerData } = data;
        
        if (playerData.playerId) {
            this.updateScore(playerData.playerId, playerData.score, true);
        }
        
        this.emit('scoreUpdate', data);
    }

    /**
     * Handle ranking changes
     */
    handleRankingChange(data) {
        console.log('📈 Ranking change:', data);
        
        // Refresh leaderboard to get updated rankings
        this.refreshLeaderboard();
        
        this.emit('rankingChange', data);
    }

    /**
     * Handle tournament updates
     */
    handleTournamentUpdate(data) {
        if (data.tournament) {
            this.updateTournamentInfo(data.tournament);
        }
        
        this.emit('tournamentUpdate', data);
    }

    /**
     * Handle optimistic updates
     */
    handleOptimisticUpdate(data) {
        console.log('🚀 Optimistic update:', data);
        
        // Apply update immediately with visual indication
        if (data.playerData) {
            this.updateScore(data.playerData.playerId, data.playerData.score, true);
            
            // Add optimistic indicator
            const entryElement = this.elements.list.querySelector(`[data-player-id="${data.playerData.playerId}"]`);
            if (entryElement) {
                entryElement.classList.add('optimistic-update');
            }
        }
    }

    /**
     * Handle optimistic update rollback
     */
    handleOptimisticRollback(data) {
        console.warn('⏪ Rolling back optimistic update:', data);
        
        // Remove optimistic indicators and refresh
        this.elements.list.querySelectorAll('.optimistic-update').forEach(element => {
            element.classList.remove('optimistic-update');
        });
        
        // Refresh to get correct data
        this.refreshLeaderboard();
    }

    /**
     * Animate entry entrance
     */
    animateEntryEntrance(element, index) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            
            this.metrics.animationsPlayed++;
        }, index * 50); // Stagger animations
    }

    /**
     * Animate score update
     */
    animateScoreUpdate(scoreElement, oldScore, newScore) {
        const startTime = performance.now();
        const duration = 1000; // 1 second animation
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out animation
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentScore = Math.round(oldScore + (newScore - oldScore) * easeProgress);
            
            scoreElement.textContent = this.formatScore(currentScore);
            scoreElement.dataset.score = currentScore;
            
            // Add pulse effect
            const pulseIntensity = Math.sin(progress * Math.PI);
            scoreElement.style.transform = `scale(${1 + pulseIntensity * 0.1})`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                scoreElement.style.transform = 'scale(1)';
                this.metrics.animationsPlayed++;
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Show/hide the leaderboard
     */
    show() {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.container.classList.add('visible');
        
        // Trigger entrance animations
        const entries = this.elements.list.querySelectorAll('.leaderboard-entry:not(.leaderboard-header-row)');
        entries.forEach((entry, index) => {
            this.animateEntryEntrance(entry, index);
        });
        
        this.emit('shown');
        console.log('👁️ Leaderboard shown');
    }

    /**
     * Hide the leaderboard
     */
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.container.classList.remove('visible');
        
        this.emit('hidden');
        console.log('👁️ Leaderboard hidden');
    }

    /**
     * Get UI metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            isVisible: this.isVisible,
            currentTournament: this.currentTournament,
            entriesDisplayed: this.leaderboardData.length,
            lastUpdate: this.lastUpdate
        };
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        console.log('🧹 Destroying UnifiedLeaderboardUI...');
        
        // Unsubscribe from real-time updates
        if (this.socket && this.currentTournament) {
            this.socket.unsubscribe(this.currentTournament, this.handleRealtimeUpdate.bind(this));
        }
        
        // Remove event listeners
        this.removeAllListeners();
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        console.log('✅ UnifiedLeaderboardUI destroyed');
    }
}

// Export additional UI helper components

export class LeaderboardModal extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = options;
        this.isOpen = false;
        this.createModal();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'leaderboard-modal';
        this.modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Full Leaderboard</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div id="modal-leaderboard-container"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        
        // Set up event handlers
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.close());
        this.modal.querySelector('.modal-backdrop').addEventListener('click', () => this.close());
    }

    open(leaderboardData) {
        this.isOpen = true;
        this.modal.style.display = 'block';
        
        // Initialize leaderboard in modal
        const container = this.modal.querySelector('#modal-leaderboard-container');
        this.leaderboard = new UnifiedLeaderboardUI(container, {
            maxEntries: 100,
            enableTournamentSwitching: false,
            ...this.options
        });
        
        this.leaderboard.render(leaderboardData);
        this.emit('opened');
    }

    close() {
        this.isOpen = false;
        this.modal.style.display = 'none';
        
        if (this.leaderboard) {
            this.leaderboard.destroy();
            this.leaderboard = null;
        }
        
        this.emit('closed');
    }

    destroy() {
        this.close();
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
    }
}

// Default exports for compatibility
export default UnifiedLeaderboardUI;
