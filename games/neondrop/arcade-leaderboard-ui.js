/**
 * arcade-leaderboard-ui.js - Full-screen arcade-style leaderboard
 * Shows player name and score properly
 */

export class ArcadeLeaderboardUI {
    constructor(leaderboardSystem) {
        this.leaderboard = leaderboardSystem;
        this.container = null;
        this.isVisible = false;
        this.currentPeriod = 'daily';
        this.playerRank = null;
        this.playerScore = null;
        
        // Pagination settings for large leaderboards
        this.currentPage = 0;
        this.pageSize = 50; // Show 50 entries per page
        this.maxEntries = 1000; // Support up to 1000 players
        this.totalEntries = 0;
        this.allEntries = [];

        this.setupUI();
        this.setupEventListeners();
    }

    setupUI() {
        // Create full-screen container
        this.container = document.createElement('div');
        this.container.className = 'arcade-leaderboard-overlay';
        this.container.innerHTML = `
            <div class="arcade-leaderboard-content">
                <!-- Scanline effect for retro feel -->
                <div class="scanlines"></div>

                <!-- Header -->
                <div class="arcade-header">
                    <div class="arcade-title">HIGH SCORES</div>
                    <div class="arcade-subtitle">NEON DROP CHAMPIONS</div>
                </div>

                <!-- Period selector -->
                <div class="period-selector">
                    <div class="period-option active" data-period="daily">TODAY</div>
                    <div class="period-option" data-period="weekly">THIS WEEK</div>
                    <div class="period-option" data-period="all">ALL TIME</div>
                </div>

                <!-- Pagination info -->
                <div class="leaderboard-info">
                    <div class="total-players">Total Players: <span id="total-count">--</span></div>
                    <div class="page-info">Page <span id="current-page">1</span> of <span id="total-pages">1</span></div>
                </div>

                <!-- Scores list -->
                <div class="scores-container">
                    <div class="loading-text">LOADING...</div>
                </div>

                <!-- Pagination controls -->
                <div class="pagination-controls">
                    <button class="page-btn" id="first-page">⟪ FIRST</button>
                    <button class="page-btn" id="prev-page">← PREV</button>
                    <button class="page-btn" id="next-page">NEXT →</button>
                    <button class="page-btn" id="last-page">LAST ⟫</button>
                </div>

                <!-- Player stats -->
                <div class="player-stats">
                    <div class="your-rank">YOUR RANK: <span id="player-rank">--</span></div>
                    <div class="your-score">YOUR SCORE: <span id="player-score">--</span></div>
                </div>

                <!-- Continue prompt -->
                <div class="continue-prompt">
                    <div class="blink">PRESS SPACE TO CONTINUE</div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.hide();
    }

    setupEventListeners() {
        // Period switching
        this.container.querySelectorAll('.period-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.switchPeriod(e.target.dataset.period);
            });
        });

        // Pagination controls
        this.container.querySelector('#first-page')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.goToPage(0);
        });

        this.container.querySelector('#prev-page')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.currentPage > 0) this.goToPage(this.currentPage - 1);
        });

        this.container.querySelector('#next-page')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const maxPage = Math.ceil(this.totalEntries / this.pageSize) - 1;
            if (this.currentPage < maxPage) this.goToPage(this.currentPage + 1);
        });

        this.container.querySelector('#last-page')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const maxPage = Math.ceil(this.totalEntries / this.pageSize) - 1;
            this.goToPage(maxPage);
        });

        // Dismiss on any key or click - PROFESSIONAL EVENT HANDLING
        this.dismissHandler = (e) => {
            if (this.isVisible && (e.type === 'click' || e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
                e.preventDefault();
                e.stopPropagation();
                this.hide();
            }
        };

        // Store reference for proper cleanup
        this.keydownHandler = this.dismissHandler;
        this.clickHandler = this.dismissHandler;
    }

    async show(playerScore = null) {
        console.log('ArcadeLeaderboardUI.show called with score:', playerScore);
        this.playerScore = playerScore;
        this.currentPeriod = 'daily';
        this.updatePeriodSelector();

        // PROFESSIONAL EVENT MANAGEMENT: Register handlers when showing
        document.addEventListener('keydown', this.keydownHandler);
        this.container.addEventListener('click', this.clickHandler);

        console.log('Setting container display to flex');
        this.container.style.display = 'flex';
        console.log('Container display set, adding visible class...');
        requestAnimationFrame(() => {
            this.container.classList.add('visible');
            console.log('Visible class added to leaderboard');
        });

        this.isVisible = true;
        console.log('Loading leaderboard data...');
        await this.loadLeaderboard(this.currentPeriod);
        console.log('Leaderboard data loaded');

        if (window.neonDrop?.audio) {
            window.neonDrop.audio.playSound('leaderboard');
        }
        console.log('ArcadeLeaderboardUI.show completed');
    }

    hide() {
        // PROFESSIONAL EVENT MANAGEMENT: Remove handlers when hiding
        document.removeEventListener('keydown', this.keydownHandler);
        this.container.removeEventListener('click', this.clickHandler);
        
        this.container.classList.remove('visible');
        setTimeout(() => {
            this.container.style.display = 'none';
            // Clear any game canvas filters
            const gameCanvas = document.getElementById("game");
            if (gameCanvas) {
                gameCanvas.style.filter = "none";
                gameCanvas.style.opacity = "1";
            }
        }, 300);
        this.isVisible = false;
        document.getElementById('game')?.focus();
    }

    async loadLeaderboard(period) {
        const scoresContainer = this.container.querySelector('.scores-container');
        scoresContainer.innerHTML = '<div class="loading-text">LOADING...</div>';

        try {
            // Get player info
            const playerName = localStorage.getItem('neon_drop_username') || 'ANONYMOUS';
            const playerId = this.leaderboard.getPlayerId();

            // Get large leaderboard data (up to 1000 entries)
            let entries = await this.leaderboard.getLeaderboard(period, this.maxEntries);
            this.allEntries = entries;
            this.totalEntries = entries.length;

            // If player just played, add their score to the list
            if (this.playerScore) {
                // Remove player if already in list
                entries = entries.filter(e => e.player_id !== playerId);

                // Add player's new score
                const playerEntry = {
                    player_id: playerId,
                    displayName: playerName,
                    score: this.playerScore,
                    isMe: true
                };

                // Insert at correct position
                entries.push(playerEntry);
                entries.sort((a, b) => b.score - a.score);
                entries = entries.slice(0, this.maxEntries);

                // Update ranks
                entries.forEach((entry, index) => {
                    entry.rank = index + 1;
                });

                this.allEntries = entries;
                this.totalEntries = entries.length;
            }

            // Find player's rank in the full list
            const playerEntry = this.allEntries.find(e => e.player_id === playerId);
            if (playerEntry) {
                this.playerRank = playerEntry.rank;
                this.container.querySelector('#player-rank').textContent = `#${playerEntry.rank}`;
                
                // Auto-navigate to player's page if they just played
                if (this.playerScore) {
                    const playerPage = Math.floor((playerEntry.rank - 1) / this.pageSize);
                    this.currentPage = playerPage;
                }
            } else {
                this.container.querySelector('#player-rank').textContent = 'UNRANKED';
            }

            // Show player's score
            if (this.playerScore) {
                this.container.querySelector('#player-score').textContent = this.playerScore.toLocaleString();
            }

            // Update pagination info
            this.updatePaginationInfo();

            // Render current page
            this.renderCurrentPage();

            // Celebrate if in top 100
            if (this.playerRank && this.playerRank <= 100) {
                this.celebrateHighScore();
            }

        } catch (error) {
            // Failed to load leaderboard - show offline message
            scoresContainer.innerHTML = '<div class="error">CONNECTION ERROR</div>';
        }
    }

    switchPeriod(period) {
        this.currentPeriod = period;
        this.currentPage = 0; // Reset to first page when switching periods
        this.updatePeriodSelector();
        this.loadLeaderboard(period);
    }

    updatePeriodSelector() {
        this.container.querySelectorAll('.period-option').forEach(option => {
            option.classList.toggle('active', option.dataset.period === this.currentPeriod);
        });
    }

    formatName(name) {
        return name.toUpperCase().substring(0, 10).padEnd(10, ' ');
    }

    celebrateHighScore() {
        this.container.classList.add('celebrating');
        if (window.neonDrop?.audio) {
            window.neonDrop.audio.playSound('highscore');
        }
        setTimeout(() => {
            this.container.classList.remove('celebrating');
        }, 3000);
    }

    goToPage(pageNumber) {
        this.currentPage = Math.max(0, Math.min(pageNumber, Math.ceil(this.totalEntries / this.pageSize) - 1));
        this.updatePaginationInfo();
        this.renderCurrentPage();
    }

    updatePaginationInfo() {
        const totalPages = Math.ceil(this.totalEntries / this.pageSize);
        
        this.container.querySelector('#total-count').textContent = this.totalEntries.toLocaleString();
        this.container.querySelector('#current-page').textContent = (this.currentPage + 1).toString();
        this.container.querySelector('#total-pages').textContent = totalPages.toString();

        // Update button states
        const firstBtn = this.container.querySelector('#first-page');
        const prevBtn = this.container.querySelector('#prev-page');
        const nextBtn = this.container.querySelector('#next-page');
        const lastBtn = this.container.querySelector('#last-page');

        if (firstBtn) firstBtn.disabled = this.currentPage === 0;
        if (prevBtn) prevBtn.disabled = this.currentPage === 0;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages - 1;
        if (lastBtn) lastBtn.disabled = this.currentPage >= totalPages - 1;
    }

    renderCurrentPage() {
        const scoresContainer = this.container.querySelector('.scores-container');
        const playerId = this.leaderboard.getPlayerId();
        
        const startIndex = this.currentPage * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.totalEntries);
        const pageEntries = this.allEntries.slice(startIndex, endIndex);

        scoresContainer.innerHTML = pageEntries.map((entry) => {
            const isPlayer = entry.player_id === playerId || entry.isMe;
            const isNewHighScore = isPlayer && this.playerScore && entry.score === this.playerScore;

            return `
                <div class="score-entry ${isPlayer ? 'player-score' : ''} ${isNewHighScore ? 'new-high-score' : ''}">
                    <div class="rank">${String(entry.rank).padStart(3, '0')}</div>
                    <div class="name">${this.formatName(entry.displayName || 'ANONYMOUS')}</div>
                    <div class="score">${String(entry.score).padStart(8, '0')}</div>
                    ${isNewHighScore ? '<div class="new-badge">NEW!</div>' : ''}
                </div>
            `;
        }).join('');
    }
}
