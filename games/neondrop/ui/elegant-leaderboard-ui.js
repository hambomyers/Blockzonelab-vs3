/**
 * elegant-leaderboard-ui.js - Professional & Elegant Leaderboard
 * Matches the sophisticated style of our game menu card
 */

export class ElegantLeaderboardUI {
    constructor(leaderboardSystem) {
        this.leaderboard = leaderboardSystem;
        this.container = null;
        this.isVisible = false;
        this.currentPeriod = 'daily';
        this.playerRank = null;
        this.playerScore = null;
        
        // Pagination settings
        this.currentPage = 0;
        this.pageSize = 10; // Show 10 entries for cleaner look
        this.totalEntries = 0;
        this.allEntries = [];

        this.setupUI();
        this.setupEventListeners();
    }

    setupUI() {
        this.container = document.createElement('div');
        this.container.className = 'elegant-leaderboard-overlay';
        this.container.innerHTML = `
            <div class="elegant-leaderboard-backdrop">
                <div class="elegant-leaderboard-card">
                    <!-- Header -->
                    <div class="leaderboard-header">
                        <h2 class="leaderboard-title">High Scores</h2>
                        <p class="leaderboard-subtitle">Top Neon Drop players</p>
                    </div>

                    <!-- Period Selector -->
                    <div class="period-tabs">
                        <button class="period-tab active" data-period="daily">Today</button>
                        <button class="period-tab" data-period="weekly">This Week</button>
                        <button class="period-tab" data-period="all">All Time</button>
                    </div>

                    <!-- Scores Table -->
                    <div class="scores-table-container">
                        <div class="loading-state">
                            <div class="loading-spinner"></div>
                            <p>Loading scores...</p>
                        </div>
                        
                        <div class="scores-table" style="display: none;">
                            <div class="table-header">
                                <div class="rank-col">Rank</div>
                                <div class="player-col">Player</div>
                                <div class="score-col">Score</div>
                                <div class="time-col">Date</div>
                            </div>
                            <div class="table-body" id="scores-list">
                                <!-- Scores will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Player Status -->
                    <div class="player-status">
                        <div class="status-item">
                            <span class="status-label">Your Rank:</span>
                            <span class="status-value" id="player-rank">--</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Your Best:</span>
                            <span class="status-value" id="player-score">--</span>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <div class="pagination" id="pagination" style="display: none;">
                        <button class="page-btn" id="prev-page" disabled>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15,18 9,12 15,6"></polyline>
                            </svg>
                            Previous
                        </button>
                        <span class="page-info">
                            Page <span id="current-page">1</span> of <span id="total-pages">1</span>
                        </span>
                        <button class="page-btn" id="next-page" disabled>
                            Next
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9,18 15,12 9,6"></polyline>
                            </svg>
                        </button>
                    </div>

                    <!-- Actions -->
                    <div class="leaderboard-actions">
                        <button class="action-btn secondary" id="close-leaderboard">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Close
                        </button>
                        <button class="action-btn primary" id="play-again">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5,3 19,12 5,21"></polygon>
                            </svg>
                            Play Again
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.hide();
    }

    setupEventListeners() {
        // Period switching
        this.container.querySelectorAll('.period-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                this.switchPeriod(e.target.dataset.period);
            });
        });

        // Pagination
        this.container.querySelector('#prev-page')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.currentPage > 0) {
                this.goToPage(this.currentPage - 1);
            }
        });

        this.container.querySelector('#next-page')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const totalPages = Math.ceil(this.totalEntries / this.pageSize);
            if (this.currentPage < totalPages - 1) {
                this.goToPage(this.currentPage + 1);
            }
        });

        // Actions
        this.container.querySelector('#close-leaderboard')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide();
        });

        this.container.querySelector('#play-again')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide();
            document.dispatchEvent(new CustomEvent('gameOverChoice', { 
                detail: { action: 'play-again' } 
            }));
        });

        // Close on backdrop click
        this.container.querySelector('.elegant-leaderboard-backdrop')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('elegant-leaderboard-backdrop')) {
                this.hide();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    async show(playerScore = null) {
        this.playerScore = playerScore;
        this.isVisible = true;
        this.container.style.display = 'flex';
        
        // Elegant entrance animation
        requestAnimationFrame(() => {
            this.container.classList.add('visible');
        });

        await this.loadScores();
    }

    hide() {
        this.isVisible = false;
        this.container.classList.remove('visible');
        
        setTimeout(() => {
            this.container.style.display = 'none';
        }, 300);

        // Dispatch dismissed event
        document.dispatchEvent(new CustomEvent('leaderboardDismissed'));
    }

    switchPeriod(period) {
        this.currentPeriod = period;
        this.currentPage = 0;

        // Update tab states
        this.container.querySelectorAll('.period-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.period === period);
        });

        this.loadScores();
    }

    async loadScores() {
        this.showLoading();

        try {
            const scores = await this.leaderboard.getScores(this.currentPeriod);
            this.allEntries = scores || [];
            this.totalEntries = this.allEntries.length;
            
            this.displayScores();
            this.updatePlayerStatus();
            this.updatePagination();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to load scores:', error);
            this.showError('Failed to load scores');
        }
    }

    showLoading() {
        this.container.querySelector('.loading-state').style.display = 'flex';
        this.container.querySelector('.scores-table').style.display = 'none';
    }

    hideLoading() {
        this.container.querySelector('.loading-state').style.display = 'none';
        this.container.querySelector('.scores-table').style.display = 'block';
    }

    showError(message) {
        this.container.querySelector('.loading-state').innerHTML = `
            <div class="error-icon">⚠️</div>
            <p>${message}</p>
        `;
    }

    displayScores() {
        const startIndex = this.currentPage * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageEntries = this.allEntries.slice(startIndex, endIndex);

        const scoresContainer = this.container.querySelector('#scores-list');
        scoresContainer.innerHTML = '';

        if (pageEntries.length === 0) {
            scoresContainer.innerHTML = `
                <div class="empty-state">
                    <p>No scores yet for this period</p>
                    <p class="empty-subtitle">Be the first to set a record!</p>
                </div>
            `;
            return;
        }

        pageEntries.forEach((entry, index) => {
            const globalRank = startIndex + index + 1;
            const scoreRow = document.createElement('div');
            scoreRow.className = 'score-row';
            
            // Highlight player's score if it matches
            if (this.playerScore && entry.score === this.playerScore) {
                scoreRow.classList.add('player-score');
            }

            // Special styling for top 3
            if (globalRank <= 3) {
                scoreRow.classList.add(`rank-${globalRank}`);
            }

            scoreRow.innerHTML = `
                <div class="rank-col">
                    ${globalRank <= 3 ? this.getRankMedal(globalRank) : `#${globalRank}`}
                </div>
                <div class="player-col">
                    ${this.formatPlayerName(entry.player_name || 'Anonymous')}
                </div>
                <div class="score-col">
                    ${this.formatScore(entry.score)}
                </div>
                <div class="time-col">
                    ${this.formatDate(entry.timestamp)}
                </div>
            `;

            scoresContainer.appendChild(scoreRow);
        });
    }

    getRankMedal(rank) {
        const medals = ['🥇', '🥈', '🥉'];
        return medals[rank - 1] || `#${rank}`;
    }

    formatPlayerName(name) {
        return name.length > 12 ? name.substring(0, 12) + '...' : name;
    }

    formatScore(score) {
        return score.toLocaleString();
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffHours = (now - date) / (1000 * 60 * 60);

        if (diffHours < 1) {
            return 'Just now';
        } else if (diffHours < 24) {
            return `${Math.floor(diffHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    updatePlayerStatus() {
        const playerRankEl = this.container.querySelector('#player-rank');
        const playerScoreEl = this.container.querySelector('#player-score');

        if (this.playerScore) {
            const playerEntry = this.allEntries.find(entry => entry.score === this.playerScore);
            if (playerEntry) {
                const rank = this.allEntries.indexOf(playerEntry) + 1;
                playerRankEl.textContent = `#${rank}`;
                playerScoreEl.textContent = this.formatScore(this.playerScore);
            } else {
                playerRankEl.textContent = 'Not ranked';
                playerScoreEl.textContent = this.formatScore(this.playerScore);
            }
        } else {
            playerRankEl.textContent = '--';
            playerScoreEl.textContent = '--';
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.totalEntries / this.pageSize);
        const paginationEl = this.container.querySelector('#pagination');
        
        if (totalPages <= 1) {
            paginationEl.style.display = 'none';
            return;
        }

        paginationEl.style.display = 'flex';
        
        this.container.querySelector('#current-page').textContent = this.currentPage + 1;
        this.container.querySelector('#total-pages').textContent = totalPages;
        
        this.container.querySelector('#prev-page').disabled = this.currentPage === 0;
        this.container.querySelector('#next-page').disabled = this.currentPage === totalPages - 1;
    }

    goToPage(page) {
        this.currentPage = page;
        this.displayScores();
        this.updatePagination();
    }
}
