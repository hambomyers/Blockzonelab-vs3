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

                <!-- Scores list -->
                <div class="scores-container">
                    <div class="loading-text">LOADING...</div>
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

        // Dismiss on any key or click
        const dismissHandler = (e) => {
            if (this.isVisible && (e.type === 'click' || e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
                e.preventDefault();
                this.hide();
            }
        };

        document.addEventListener('keydown', dismissHandler);
        this.container.addEventListener('click', dismissHandler);
    }

    async show(playerScore = null) {
        this.playerScore = playerScore;
        this.currentPeriod = 'daily';
        this.updatePeriodSelector();

        this.container.style.display = 'flex';
        requestAnimationFrame(() => {
            this.container.classList.add('visible');
        });

        this.isVisible = true;
        await this.loadLeaderboard(this.currentPeriod);

        if (window.neonDrop?.audio) {
            window.neonDrop.audio.playSound('leaderboard');
        }
    }

    hide() {
        this.container.classList.remove('visible');
        setTimeout(() => {
            this.container.style.display = 'none';
        ; const gameCanvas = document.getElementById("game"); if (gameCanvas) { gameCanvas.style.filter = "none"; gameCanvas.style.opacity = "1"; }}, 300);
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

            // Get leaderboard data
            let entries = await this.leaderboard.getLeaderboard(period, 10);

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
                entries = entries.slice(0, 10);

                // Update ranks
                entries.forEach((entry, index) => {
                    entry.rank = index + 1;
                });
            }

            // Find player's rank
            const playerEntry = entries.find(e => e.player_id === playerId);
            if (playerEntry) {
                this.playerRank = playerEntry.rank;
                this.container.querySelector('#player-rank').textContent = `#${playerEntry.rank}`;
            } else {
                this.container.querySelector('#player-rank').textContent = 'UNRANKED';
            }

            // Show player's score
            if (this.playerScore) {
                this.container.querySelector('#player-score').textContent = this.playerScore.toLocaleString();
            }

            // Render leaderboard
            scoresContainer.innerHTML = entries.map((entry, index) => {
                const isPlayer = entry.player_id === playerId || entry.isMe;
                const isNewHighScore = isPlayer && this.playerScore && entry.score === this.playerScore;

                return `
                    <div class="score-entry ${isPlayer ? 'player-score' : ''} ${isNewHighScore ? 'new-high-score' : ''}">
                        <div class="rank">${String(entry.rank).padStart(2, '0')}</div>
                        <div class="name">${this.formatName(entry.displayName || 'ANONYMOUS')}</div>
                        <div class="score">${String(entry.score).padStart(8, '0')}</div>
                        ${isNewHighScore ? '<div class="new-badge">NEW!</div>' : ''}
                    </div>
                `;
            }).join('');

            // Celebrate if in top 10
            if (this.playerRank && this.playerRank <= 10) {
                this.celebrateHighScore();
            }

        } catch (error) {
            // Failed to load leaderboard - show offline message
            scoresContainer.innerHTML = '<div class="error">CONNECTION ERROR</div>';
        }
    }

    switchPeriod(period) {
        this.currentPeriod = period;
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
}
