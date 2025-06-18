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
        this.container.className = 'elegant-leaderboard-overlay';        this.container.innerHTML = `
            <div class="elegant-leaderboard-backdrop">
                <div class="elegant-leaderboard-card">
                    <!-- Personal Stats Section - Top Priority -->
                    <div class="personal-stats-section">
                        <div class="personal-stats-grid">
                            <div class="personal-welcome">
                                <h3>Welcome back, Player!</h3>
                                <p>Your performance and global standings</p>
                            </div>
                            <div class="personal-rank-card">
                                <p class="personal-rank-label">Your Rank</p>
                                <div class="personal-rank-value" id="personal-rank">--</div>
                            </div>
                            <div class="personal-score-card">
                                <p class="personal-score-label">Best Score</p>
                                <div class="personal-score-value" id="personal-score">--</div>
                            </div>
                        </div>
                    </div>

                    <!-- Main Header -->
                    <div class="leaderboard-header">
                        <h2 class="leaderboard-title">Global Leaderboard</h2>
                        <p class="leaderboard-subtitle">Top players worldwide • Updated in real-time</p>
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
                            <p>Loading global scores...</p>
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

                    <!-- Beautiful Navigation Actions - Bottom Priority -->
                    <div class="leaderboard-actions">
                        <button class="action-btn secondary" id="back-to-main">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H6m0 0l6 6m-6-6l6-6"/>
                            </svg>
                            Back to Main
                        </button>
                        <button class="action-btn tertiary" id="view-challenges">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Challenges
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
        });        // Actions
        this.container.querySelector('#back-to-main')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide();
            // Navigate back to main site
            window.location.href = '/';
        });

        this.container.querySelector('#view-challenges')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide();
            // Show challenges (future feature)
            console.log('🎯 Challenges feature coming soon!');
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
        }        pageEntries.forEach((entry, index) => {
            const globalRank = startIndex + index + 1;
            const scoreRow = document.createElement('div');
            scoreRow.className = 'score-row';
            
            // Highlight player's score if it matches
            if (this.playerScore && entry.score === this.playerScore) {
                scoreRow.classList.add('current-player');
            }

            scoreRow.innerHTML = `
                <div class="rank">${this.getRankDisplay(globalRank)}</div>
                <div class="player-name">${this.formatPlayerName(entry.player_name || 'Anonymous')}</div>
                <div class="score">${this.formatScore(entry.score)}</div>
                <div class="date">${this.formatDate(entry.timestamp)}</div>
            `;

            scoresContainer.appendChild(scoreRow);
        });
    }    getRankDisplay(rank) {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
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
    }    updatePlayerStatus() {
        const personalRankEl = this.container.querySelector('#personal-rank');
        const personalScoreEl = this.container.querySelector('#personal-score');

        // Add loading animation
        const showLoading = (element) => {
            element.style.opacity = '0.5';
            element.textContent = '...';
        };

        const hideLoading = (element, value, isHighlight = false) => {
            element.style.opacity = '1';
            element.textContent = value;
            
            // Add highlight animation for achievements
            if (isHighlight) {
                element.style.animation = 'statusHighlight 2s ease-out';
                setTimeout(() => {
                    element.style.animation = '';
                }, 2000);
            }
        };

        // Show loading state
        showLoading(personalRankEl);
        showLoading(personalScoreEl);

        setTimeout(() => {
            if (this.playerScore && this.playerScore > 0) {
                // Find player in leaderboard
                const playerEntry = this.allEntries.find(entry => entry.score === this.playerScore);
                
                if (playerEntry) {
                    const rank = this.allEntries.indexOf(playerEntry) + 1;
                    let rankText = `#${rank}`;
                    let isTopRank = false;
                    
                    // Add special formatting for top ranks
                    if (rank === 1) {
                        rankText = '👑 #1';
                        isTopRank = true;
                    } else if (rank === 2) {
                        rankText = '🥈 #2';
                        isTopRank = true;
                    } else if (rank === 3) {
                        rankText = '🥉 #3';
                        isTopRank = true;
                    } else if (rank <= 10) {
                        rankText = `⭐ #${rank}`;
                    }
                    
                    hideLoading(personalRankEl, rankText, isTopRank);
                    hideLoading(personalScoreEl, this.formatScore(this.playerScore), this.playerScore >= 10000);
                    
                } else {
                    // Player not in current leaderboard period
                    const totalEntries = this.allEntries.length;
                    hideLoading(personalRankEl, totalEntries > 0 ? `#${totalEntries + 1}+` : '--');
                    hideLoading(personalScoreEl, this.formatScore(this.playerScore));
                }
            } else {
                // No score yet
                hideLoading(personalRankEl, '--');
                hideLoading(personalScoreEl, '--');
            }
        }, 300); // Small delay for smooth loading animation
    }    updatePagination() {
        const totalPages = Math.ceil(this.totalEntries / this.pageSize);
        const paginationEl = this.container.querySelector('#pagination');
        
        if (!paginationEl || totalPages <= 1) {
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
