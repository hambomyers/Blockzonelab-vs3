/**
 * game-menu-overlay.js - Beautiful game menu overlay system
 * Appears elegantly over/below the NEON DROP title with all options
 */

export class GameMenuOverlay {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.tournament = null;
        this.selectedOption = 0;
        this.options = [
            { id: 'tournament', label: '🏆 Join Tournament', description: '$2.50 USDC • Winner Takes All', action: 'joinTournament' },
            { id: 'practice', label: '🎮 Practice Mode', description: 'Free play • No rewards', action: 'startPractice' },
            { id: 'leaderboard', label: '📊 Leaderboard', description: 'View top players', action: 'showLeaderboard' },
            { id: 'challenges', label: '⚡ Daily Challenges', description: 'Special objectives • Bonus rewards', action: 'showChallenges' },
            { id: 'academy', label: '📚 Academy', description: 'Learn blockchain & DeFi', action: 'goToAcademy' }
        ];
          this.setupOverlay();
        this.setupEventListeners();
        this.startAutoUpdate();
    }

    setupOverlay() {
        // Create main overlay container
        this.container = document.createElement('div');
        this.container.className = 'game-menu-overlay';
        this.container.innerHTML = `
            <div class="menu-backdrop"></div>
            <div class="menu-content">
                <!-- Tournament Status Banner -->
                <div class="tournament-status-banner">
                    <div class="tournament-live-indicator"></div>
                    <div class="tournament-info-compact">
                        <span class="tournament-prize" id="tournamentPrize">$200+ Prize Pool</span>
                        <span class="tournament-timer" id="tournamentTimerCompact">Reset in 4h 23m</span>
                    </div>
                </div>

                <!-- Main Menu Options -->
                <div class="menu-options-container">
                    ${this.options.map((option, index) => `
                        <div class="menu-option ${index === 0 ? 'selected' : ''}" data-index="${index}" data-action="${option.action}">
                            <div class="option-icon">${option.label.split(' ')[0]}</div>
                            <div class="option-content">
                                <div class="option-title">${option.label.substring(option.label.indexOf(' ') + 1)}</div>
                                <div class="option-description">${option.description}</div>
                            </div>
                            <div class="option-arrow">▶</div>
                        </div>
                    `).join('')}
                </div>

                <!-- Current Player Stats -->
                <div class="player-stats-compact">
                    <div class="stat-item">
                        <span class="stat-label">Best Score</span>
                        <span class="stat-value" id="playerBestScore">---</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Rank</span>
                        <span class="stat-value" id="playerRank">#---</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Tournaments Won</span>
                        <span class="stat-value" id="tournamentsWon">---</span>
                    </div>
                </div>

                <!-- Controls hint -->
                <div class="controls-hint">
                    Use ↑↓ arrows to navigate • ENTER to select • ESC to start practice
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        
        // Initially hidden
        this.container.style.opacity = '0';
        this.container.style.pointerEvents = 'none';
    }

    setupEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateUp();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateDown();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.selectCurrentOption();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.startPracticeMode();
                    break;
            }
        });

        // Mouse interactions
        this.container.addEventListener('click', (e) => {
            const option = e.target.closest('.menu-option');
            if (option) {
                const index = parseInt(option.dataset.index);
                this.selectOption(index);
                this.selectCurrentOption();
            }
        });

        // Hover effects
        this.container.addEventListener('mouseover', (e) => {
            const option = e.target.closest('.menu-option');
            if (option) {
                const index = parseInt(option.dataset.index);
                this.selectOption(index);
            }
        });
    }

    navigateUp() {
        this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
        this.updateSelection();
        this.playSelectionSound();
    }

    navigateDown() {
        this.selectedOption = (this.selectedOption + 1) % this.options.length;
        this.updateSelection();
        this.playSelectionSound();
    }

    selectOption(index) {
        this.selectedOption = index;
        this.updateSelection();
    }

    updateSelection() {
        const options = this.container.querySelectorAll('.menu-option');
        options.forEach((option, index) => {
            option.classList.toggle('selected', index === this.selectedOption);
        });
    }

    selectCurrentOption() {
        const action = this.options[this.selectedOption].action;
        this.playConfirmSound();
        
        switch(action) {
            case 'joinTournament':
                this.joinTournament();
                break;
            case 'startPractice':
                this.startPracticeMode();
                break;
            case 'showLeaderboard':
                this.showLeaderboard();
                break;
            case 'showChallenges':
                this.showChallenges();
                break;
            case 'goToAcademy':
                this.goToAcademy();
                break;
        }
    }

    // Action handlers
    joinTournament() {
        console.log('🏆 Joining tournament...');
        this.hide();
        // Trigger tournament join event
        document.dispatchEvent(new CustomEvent('joinTournament'));
    }

    startPracticeMode() {
        console.log('🎮 Starting practice mode...');
        this.hide();
        // Trigger start game event
        document.dispatchEvent(new CustomEvent('startGame', { detail: { mode: 'practice' } }));
    }

    showLeaderboard() {
        console.log('📊 Showing leaderboard...');
        this.hide();
        // Trigger leaderboard event
        if (window.leaderboardUI) {
            window.leaderboardUI.show();
        }
    }

    showChallenges() {
        console.log('⚡ Showing challenges...');
        // TODO: Implement challenges system
        alert('🚧 Challenges system coming soon!');
    }

    goToAcademy() {
        console.log('📚 Going to academy...');
        window.open('/academy', '_blank');
    }

    // Display methods
    show() {
        this.isVisible = true;
        this.updateTournamentInfo();
        this.updatePlayerStats();
        
        this.container.style.display = 'flex';
        this.container.style.pointerEvents = 'auto';
        
        // Smooth fade in
        requestAnimationFrame(() => {
            this.container.style.transition = 'opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            this.container.style.opacity = '1';
        });
        
        this.playMenuOpenSound();
    }

    hide() {
        this.isVisible = false;
        this.container.style.opacity = '0';
        this.container.style.pointerEvents = 'none';
        
        setTimeout(() => {
            this.container.style.display = 'none';
        }, 500);
    }

    // Data updates
    updateTournamentInfo() {
        if (this.tournament) {
            const prizeEl = this.container.querySelector('#tournamentPrize');
            const timerEl = this.container.querySelector('#tournamentTimerCompact');
            
            if (prizeEl && this.tournament.getPrizePool) {
                prizeEl.textContent = `$${this.tournament.getPrizePool()}+ Prize Pool`;
            }
            
            if (timerEl && this.tournament.getTimeUntilReset) {
                timerEl.textContent = this.tournament.getTimeUntilReset();
            }
        }
    }

    updatePlayerStats() {
        // Update with actual player data when available
        const bestScore = localStorage.getItem('neonDrop_bestScore') || '0';
        const rank = localStorage.getItem('neonDrop_rank') || '---';
        const tournamentsWon = localStorage.getItem('neonDrop_tournamentsWon') || '0';
        
        const scoreEl = this.container.querySelector('#playerBestScore');
        const rankEl = this.container.querySelector('#playerRank');
        const wonEl = this.container.querySelector('#tournamentsWon');
        
        if (scoreEl) scoreEl.textContent = parseInt(bestScore).toLocaleString();
        if (rankEl) rankEl.textContent = rank.startsWith('#') ? rank : `#${rank}`;
        if (wonEl) wonEl.textContent = tournamentsWon;
    }

    // Audio feedback
    playSelectionSound() {
        if (window.neonDrop?.audio) {
            window.neonDrop.audio.playSound('menuMove');
        }
    }

    playConfirmSound() {
        if (window.neonDrop?.audio) {
            window.neonDrop.audio.playSound('menuSelect');
        }
    }

    playMenuOpenSound() {
        if (window.neonDrop?.audio) {
            window.neonDrop.audio.playSound('menuOpen');
        }
    }

    // Setters for external integration
    setTournament(tournament) {
        this.tournament = tournament;
        this.updateTournamentInfo();
    }

    // Auto-update tournament info
    startAutoUpdate() {
        setInterval(() => {
            if (this.isVisible) {
                this.updateTournamentInfo();
            }
        }, 5000);
    }
}
