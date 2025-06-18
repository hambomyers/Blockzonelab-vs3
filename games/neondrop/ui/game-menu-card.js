/**
 * game-menu-card.js - Elegant Playing Card Menu System
 * A beautiful, compact card that sits below the NEON DROP title
 */

export class GameMenuCard {
    constructor() {
        this.container = null;
        this.isVisible = true;
        this.tournament = null;
        
        this.gameOptions = [
            { 
                id: 'tournament', 
                title: 'Tournament', 
                subtitle: '$2.50 Entry • Winner Takes All',
                icon: '🏆',
                price: '$2.50',
                status: 'live',
                action: 'joinTournament'
            },
            { 
                id: 'practice', 
                title: 'Free Play', 
                subtitle: 'Practice Mode • No Entry Fee',
                icon: '🎮',
                price: 'FREE',
                status: 'available',
                action: 'startPractice'
            },
            { 
                id: 'leaderboard', 
                title: 'Leaderboard', 
                subtitle: 'Top Players Today',
                icon: '📊',
                price: null,
                status: 'view',
                action: 'showLeaderboard'
            }
        ];
        
        this.setupCard();
        this.setupEventListeners();
        this.startAutoUpdate();
    }

    setupCard() {
        // Create elegant playing card container
        this.container = document.createElement('div');
        this.container.className = 'game-menu-card';
        this.container.innerHTML = `
            <div class="card-inner">
                <!-- Card Header with Tournament Status -->
                <div class="card-header">
                    <div class="tournament-status">
                        <span class="live-dot"></span>
                        <span class="prize-pool" id="tournamentPrize">$200+ Pool</span>
                        <span class="timer" id="tournamentTimer">4h 23m</span>
                    </div>
                </div>

                <!-- Main Game Options -->
                <div class="card-options">
                    ${this.gameOptions.map((option, index) => `
                        <button class="game-option ${option.status}" data-action="${option.action}" data-index="${index}">
                            <div class="option-icon">${option.icon}</div>
                            <div class="option-info">
                                <div class="option-title">${option.title}</div>
                                <div class="option-subtitle">${option.subtitle}</div>
                            </div>
                            ${option.price ? `<div class="option-price ${option.price === 'FREE' ? 'free' : ''}">${option.price}</div>` : ''}
                            <div class="option-status-indicator"></div>
                        </button>
                    `).join('')}
                </div>

                <!-- Quick Stats Footer -->
                <div class="card-footer">
                    <div class="quick-stats">
                        <span class="stat">Best: <strong id="playerBest">---</strong></span>
                        <span class="stat">Rank: <strong id="playerRank">#---</strong></span>
                        <span class="back-link">← <a href="/games/" class="subtle-link">All Games</a></span>
                    </div>
                </div>
            </div>
        `;

        // Insert card right after the game title
        const gameTitle = document.querySelector('h1') || document.querySelector('.game-title') || document.querySelector('#gameTitle');
        if (gameTitle && gameTitle.parentNode) {
            gameTitle.parentNode.insertBefore(this.container, gameTitle.nextSibling);
        } else {
            // Fallback: add to main content area
            const gameContainer = document.querySelector('#gameContainer') || document.querySelector('main') || document.body;
            gameContainer.appendChild(this.container);
        }
    }

    setupEventListeners() {
        // Button click handlers
        this.container.addEventListener('click', (e) => {
            const button = e.target.closest('.game-option');
            if (button) {
                const action = button.dataset.action;
                this.executeAction(action);
            }
        });

        // Hover effects
        this.container.addEventListener('mouseenter', () => {
            this.container.classList.add('hovered');
        });
        
        this.container.addEventListener('mouseleave', () => {
            this.container.classList.remove('hovered');
        });

        // Keyboard shortcuts (1, 2, 3 for quick access)
        document.addEventListener('keydown', (e) => {
            if (e.key === '1') this.executeAction('joinTournament');
            if (e.key === '2') this.executeAction('startPractice');
            if (e.key === '3') this.executeAction('showLeaderboard');
        });
    }

    executeAction(action) {
        console.log(`🎮 Executing action: ${action}`);
        
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
            default:
                console.warn('Unknown action:', action);
        }
    }

    // Action handlers
    joinTournament() {
        console.log('🏆 Joining tournament...');
        this.addGlowEffect('tournament');
        this.hide();
        // Trigger tournament join event
        document.dispatchEvent(new CustomEvent('joinTournament'));
    }

    startPracticeMode() {
        console.log('🎮 Starting practice mode...');
        this.addGlowEffect('practice');
        this.hide();
        // Trigger start game event
        document.dispatchEvent(new CustomEvent('startGame', { detail: { mode: 'practice' } }));
    }

    showLeaderboard() {
        console.log('📊 Showing leaderboard...');
        this.addGlowEffect('leaderboard');
        // Trigger leaderboard event
        if (window.leaderboardUI) {
            window.leaderboardUI.show();
        }
    }

    addGlowEffect(optionId) {
        const option = this.container.querySelector(`[data-action*="${optionId}"]`);
        if (option) {
            option.classList.add('activated');
            setTimeout(() => option.classList.remove('activated'), 300);
        }
    }

    // Data updates
    updateTournamentInfo() {
        if (this.tournament) {
            const prizeEl = this.container.querySelector('#tournamentPrize');
            const timerEl = this.container.querySelector('#tournamentTimer');
            
            if (prizeEl && this.tournament.getPrizePool) {
                prizeEl.textContent = `$${this.tournament.getPrizePool()}+ Pool`;
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
        
        const scoreEl = this.container.querySelector('#playerBest');
        const rankEl = this.container.querySelector('#playerRank');
        
        if (scoreEl) scoreEl.textContent = parseInt(bestScore).toLocaleString();
        if (rankEl) rankEl.textContent = rank.startsWith('#') ? rank : `#${rank}`;
    }

    startAutoUpdate() {
        // Update tournament and player info every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateTournamentInfo();
            this.updatePlayerStats();
        }, 30000);
        
        // Initial update
        setTimeout(() => {
            this.updateTournamentInfo();
            this.updatePlayerStats();
        }, 1000);
    }

    show() {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.container.classList.add('visible');
        this.updateTournamentInfo();
        this.updatePlayerStats();
    }

    hide() {
        this.isVisible = false;
        this.container.classList.remove('visible');
        this.container.classList.add('hidden');
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
