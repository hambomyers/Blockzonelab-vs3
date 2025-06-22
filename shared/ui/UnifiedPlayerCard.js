/**
 * UnifiedPlayerCard.js - Beautiful Universal Player UI Component
 * Consolidates EverythingCard, PlatformCard, and all UI templates/systems
 * Mobile-first responsive design with smooth animations
 */

export class UnifiedPlayerCard {
    constructor(playerSystem, tournamentSystem) {
        this.playerSystem = playerSystem;
        this.tournamentSystem = tournamentSystem;
        
        this.container = null;
        this.isVisible = false;
        this.currentState = 'hidden';
        this.animationInProgress = false;
        this.updateInterval = null;
        
        // UI state management
        this.states = {
            HIDDEN: 'hidden',
            WELCOME: 'welcome',
            GAME_RESULTS: 'game_results',
            PLAYER_DASHBOARD: 'player_dashboard',
            PAYMENT_MODAL: 'payment_modal',
            LEADERBOARD: 'leaderboard',
            LOADING: 'loading'
        };
        
        this.createContainer();
        this.bindEvents();
    }

    /**
     * Create main container element
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'unified-player-card-overlay';
        this.container.style.display = 'none';
        
        // Add base styles if not present
        this.injectBaseStyles();
        
        document.body.appendChild(this.container);
    }

    /**
     * Inject base CSS styles for the card
     */
    injectBaseStyles() {
        if (document.querySelector('#unified-card-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'unified-card-styles';
        style.textContent = `
            .unified-player-card-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(10px);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .unified-player-card-overlay.visible {
                opacity: 1;
            }
            
            .unified-card {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border-radius: 20px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 212, 255, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.2);
                color: white;
                font-family: 'Arial', sans-serif;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            
            .unified-card.visible {
                transform: scale(1);
            }
            
            .card-header {
                text-align: center;
                margin-bottom: 25px;
                border-bottom: 1px solid rgba(0, 212, 255, 0.3);
                padding-bottom: 20px;
            }
            
            .card-title {
                font-size: 28px;
                font-weight: bold;
                background: linear-gradient(45deg, #00d4ff, #ff6b35);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 0 0 10px 0;
            }
            
            .card-subtitle {
                font-size: 16px;
                color: #888;
                margin: 0;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            
            .stat-item {
                background: rgba(0, 212, 255, 0.1);
                border-radius: 10px;
                padding: 15px;
                text-align: center;
                border: 1px solid rgba(0, 212, 255, 0.2);
            }
            
            .stat-icon {
                font-size: 24px;
                margin-bottom: 8px;
                display: block;
            }
            
            .stat-label {
                font-size: 12px;
                color: #aaa;
                margin-bottom: 5px;
            }
            
            .stat-value {
                font-size: 18px;
                font-weight: bold;
                color: #00d4ff;
            }
            
            .button-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 12px;
                margin-top: 25px;
            }
            
            .card-button {
                background: linear-gradient(45deg, #00d4ff, #0099cc);
                color: white;
                border: none;
                border-radius: 12px;
                padding: 15px 20px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .card-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4);
            }
            
            .card-button.secondary {
                background: linear-gradient(45deg, #666, #888);
            }
            
            .card-button.primary {
                background: linear-gradient(45deg, #ff6b35, #f7931e);
            }
            
            .loading-spinner {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 40px;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(0, 212, 255, 0.3);
                border-top: 3px solid #00d4ff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 15px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .pricing-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            
            .pricing-tier {
                background: rgba(0, 212, 255, 0.1);
                border: 2px solid rgba(0, 212, 255, 0.2);
                border-radius: 15px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .pricing-tier:hover {
                border-color: #00d4ff;
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
            }
            
            .pricing-tier.featured {
                border-color: #ff6b35;
                background: rgba(255, 107, 53, 0.1);
            }
            
            .tier-badge {
                position: absolute;
                top: -10px;
                right: -10px;
                background: #ff6b35;
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 12px;
                font-weight: bold;
            }
            
            .tier-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #00d4ff;
            }
            
            .tier-price {
                font-size: 24px;
                font-weight: bold;
                color: #fff;
                margin-bottom: 8px;
            }
            
            .tier-desc {
                font-size: 14px;
                color: #aaa;
            }
            
            .leaderboard-list {
                max-height: 300px;
                overflow-y: auto;
                margin: 20px 0;
            }
            
            .leaderboard-item {
                display: flex;
                align-items: center;
                padding: 12px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                margin-bottom: 8px;
                transition: background 0.2s ease;
            }
            
            .leaderboard-item:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .leaderboard-rank {
                font-size: 18px;
                font-weight: bold;
                width: 40px;
                color: #00d4ff;
            }
            
            .leaderboard-name {
                flex: 1;
                margin-left: 15px;
                font-weight: bold;
            }
            
            .leaderboard-score {
                font-size: 16px;
                color: #ff6b35;
                font-weight: bold;
            }
            
            .player-info {
                background: rgba(0, 212, 255, 0.1);
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0;
                border: 1px solid rgba(0, 212, 255, 0.2);
            }
            
            .player-name {
                font-size: 22px;
                font-weight: bold;
                color: #00d4ff;
                margin-bottom: 8px;
            }
            
            .player-level {
                font-size: 16px;
                color: #ff6b35;
                margin-bottom: 15px;
            }
            
            .balance-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-top: 15px;
            }
            
            .balance-item {
                text-align: center;
                padding: 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
            }
            
            .balance-amount {
                font-size: 16px;
                font-weight: bold;
                color: #00d4ff;
            }
            
            .balance-currency {
                font-size: 12px;
                color: #aaa;
                margin-top: 5px;
            }
            
            /* Mobile optimizations */
            @media (max-width: 600px) {
                .unified-card {
                    width: 95%;
                    padding: 20px;
                    margin: 10px;
                }
                
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .button-grid {
                    grid-template-columns: 1fr;
                }
                
                .pricing-grid {
                    grid-template-columns: 1fr;
                }
                
                .card-title {
                    font-size: 24px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Close on overlay click
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.hide();
            }
        });
        
        // Listen to player system events
        if (this.playerSystem) {
            this.playerSystem.on('player:level-up', (data) => {
                this.showNotification(`🎉 Level Up! You're now level ${data.newLevel}!`);
            });
            
            this.playerSystem.on('player:achievement-unlocked', (data) => {
                this.showNotification(`🏆 Achievement: ${data.achievement.id}`);
            });
        }
        
        // Listen to tournament system events
        if (this.tournamentSystem) {
            this.tournamentSystem.on('tournament:score-submitted', (data) => {
                if (this.currentState === this.states.GAME_RESULTS) {
                    this.updateGameResults(data);
                }
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isVisible && e.key === 'Escape') {
                this.hide();
            }
        });
    }

    // =============================================================================
    // MAIN CARD STATES
    // =============================================================================

    /**
     * Show welcome screen for new players
     */
    async showWelcome() {
        await this.setState(this.states.WELCOME);
        
        this.container.innerHTML = `
            <div class="unified-card">
                <div class="card-header">
                    <h2 class="card-title">🎮 Welcome to BlockZone!</h2>
                    <p class="card-subtitle">Create your player identity</p>
                </div>
                
                <div class="welcome-content">
                    <div class="welcome-benefits">
                        <div class="stat-item">
                            <span class="stat-icon">🏆</span>
                            <div class="stat-label">Tournament Ready</div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">📱</span>
                            <div class="stat-label">Cross-Device</div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">💰</span>
                            <div class="stat-label">Crypto Payments</div>
                        </div>
                    </div>
                    
                    <div class="identity-form">
                        <input type="text" id="playerNameInput" placeholder="Choose your name (3+ chars)" maxlength="20" 
                               style="width: 100%; padding: 15px; border-radius: 10px; border: 1px solid rgba(0,212,255,0.3); 
                                      background: rgba(0,0,0,0.3); color: white; font-size: 16px; margin-bottom: 20px;">
                    </div>
                    
                    <div class="button-grid">
                        <button class="card-button primary" id="createPlayerBtn" disabled>
                            ✨ Create Player
                        </button>
                        <button class="card-button secondary" id="skipBtn">
                            ⏭️ Play as Guest
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.bindWelcomeEvents();
    }

    /**
     * Show game results after gameplay
     */
    async showGameResults(score, gameStats = {}) {
        await this.setState(this.states.GAME_RESULTS);
        
        const player = await this.playerSystem.getPlayer();
        const tournament = this.tournamentSystem.getCurrentTournament();
        
        // Submit score to tournament
        let tournamentResult = null;
        try {
            tournamentResult = await this.tournamentSystem.submitScore(player.id, score, {
                playerName: player.displayName,
                gameData: gameStats
            });
        } catch (error) {
            console.warn('Failed to submit tournament score:', error);
        }
        
        this.container.innerHTML = `
            <div class="unified-card">
                <div class="card-header">
                    <h2 class="card-title">🏆 Game Results</h2>
                    <p class="card-subtitle">${tournament?.id || 'Practice Game'}</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-icon">🎮</span>
                        <div class="stat-label">Your Score</div>
                        <div class="stat-value">${score.toLocaleString()}</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">🏅</span>
                        <div class="stat-label">Tournament Rank</div>
                        <div class="stat-value">#${tournamentResult?.rank || '?'}</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">👑</span>
                        <div class="stat-label">Personal Best</div>
                        <div class="stat-value">${tournamentResult?.bestScore?.toLocaleString() || score.toLocaleString()}</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">👥</span>
                        <div class="stat-label">Total Players</div>
                        <div class="stat-value">${tournamentResult?.totalPlayers || 1}</div>
                    </div>
                </div>
                
                <div class="player-info" id="gameResultsInfo">
                    <div class="player-name">${player.displayName}</div>
                    <div class="player-level">Level ${player.level} • ${player.experience % 100}/100 XP</div>
                    ${tournamentResult?.isNewBest ? '<div style="color: #ff6b35; font-weight: bold;">🎉 New Personal Best!</div>' : ''}
                </div>
                
                <div class="button-grid">
                    <button class="card-button primary" id="playAgainBtn">
                        🎮 Play Again
                    </button>
                    <button class="card-button secondary" id="leaderboardBtn">
                        🏆 Leaderboard
                    </button>
                    <button class="card-button secondary" id="dashboardBtn">
                        📊 Dashboard
                    </button>
                </div>
            </div>
        `;
        
        this.bindGameResultsEvents();
    }

    /**
     * Show player dashboard with stats and options
     */
    async showPlayerDashboard() {
        await this.setState(this.states.PLAYER_DASHBOARD);
        
        const player = await this.playerSystem.getPlayer();
        const tournament = this.tournamentSystem.getCurrentTournament();
        const playerStats = this.tournamentSystem.getPlayerStats(player.id);
        
        this.container.innerHTML = `
            <div class="unified-card">
                <div class="card-header">
                    <h2 class="card-title">📊 Player Dashboard</h2>
                    <p class="card-subtitle">${player.displayName}</p>
                </div>
                
                <div class="player-info">
                    <div class="player-name">${player.displayName}</div>
                    <div class="player-level">Level ${player.level} • ${player.experience % 100}/100 XP</div>
                    
                    <div class="balance-grid">
                        <div class="balance-item">
                            <div class="balance-amount">${player.balances.quarters}</div>
                            <div class="balance-currency">QUARTERS</div>
                        </div>
                        <div class="balance-item">
                            <div class="balance-amount">${player.balances.usdc}</div>
                            <div class="balance-currency">USDC</div>
                        </div>
                        <div class="balance-item">
                            <div class="balance-amount">${player.balances.freeCredits}</div>
                            <div class="balance-currency">Free Credits</div>
                        </div>
                    </div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-icon">🎮</span>
                        <div class="stat-label">Games Played</div>
                        <div class="stat-value">${player.totalGamesPlayed}</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">🏅</span>
                        <div class="stat-label">Current Rank</div>
                        <div class="stat-value">#${playerStats?.rank || '?'}</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">👑</span>
                        <div class="stat-label">Best Score</div>
                        <div class="stat-value">${playerStats?.bestScore?.toLocaleString() || '0'}</div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">🏆</span>
                        <div class="stat-label">Achievements</div>
                        <div class="stat-value">${player.stats.get('globalStats')?.achievements?.length || 0}</div>
                    </div>
                </div>
                
                <div class="button-grid">
                    <button class="card-button primary" id="playGameBtn">
                        🎮 Play Game
                    </button>
                    <button class="card-button secondary" id="leaderboardBtn">
                        🏆 Leaderboard
                    </button>
                    <button class="card-button secondary" id="settingsBtn">
                        ⚙️ Settings
                    </button>
                    <button class="card-button secondary" id="walletBtn">
                        ${player.walletAddress ? '🔗 Wallet Connected' : '🔗 Connect Wallet'}
                    </button>
                </div>
            </div>
        `;
        
        this.bindDashboardEvents();
    }

    /**
     * Show payment options modal
     */
    async showPaymentModal() {
        await this.setState(this.states.PAYMENT_MODAL);
        
        this.container.innerHTML = `
            <div class="unified-card">
                <div class="card-header">
                    <h2 class="card-title">💰 Game Access</h2>
                    <p class="card-subtitle">Choose your payment option</p>
                </div>
                
                <div class="pricing-grid">
                    <div class="pricing-tier" data-tier="single">
                        <div class="tier-title">Single Game</div>
                        <div class="tier-price">$0.25</div>
                        <div class="tier-desc">One tournament entry</div>
                    </div>
                    
                    <div class="pricing-tier featured" data-tier="daily">
                        <div class="tier-badge">Popular</div>
                        <div class="tier-title">All Day Pass</div>
                        <div class="tier-price">$3.00</div>
                        <div class="tier-desc">Unlimited today</div>
                    </div>
                    
                    <div class="pricing-tier" data-tier="monthly">
                        <div class="tier-title">Monthly Pass</div>
                        <div class="tier-price">$10.00</div>
                        <div class="tier-desc">30 days unlimited</div>
                    </div>
                </div>
                
                <div class="button-grid">
                    <button class="card-button secondary" id="cancelPaymentBtn">
                        Maybe Later
                    </button>
                </div>
            </div>
        `;
        
        this.bindPaymentEvents();
    }    /**
     * Show tournament leaderboard
     */
    async showLeaderboard() {
        await this.setState(this.states.LEADERBOARD);
        
        const tournament = this.tournamentSystem.getCurrentTournament();
        const leaderboard = this.tournamentSystem.getLeaderboard(20);
        const player = await this.playerSystem.getPlayer();
        const playerId = player?.id || 'anonymous';
        const playerStats = player ? this.tournamentSystem.getPlayerStats(player.id) : null;
        
        this.container.innerHTML = `
            <div class="unified-card">
                <div class="card-header">
                    <h2 class="card-title">🏆 Tournament Leaderboard</h2>
                    <p class="card-subtitle">${tournament?.id || 'No Active Tournament'}</p>
                </div>
                
                ${playerStats ? `
                    <div class="player-info">
                        <div class="player-name">Your Position</div>
                        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
                            <div class="stat-item">
                                <span class="stat-icon">🏅</span>
                                <div class="stat-label">Rank</div>
                                <div class="stat-value">#${playerStats.rank}</div>
                            </div>
                            <div class="stat-item">
                                <span class="stat-icon">👑</span>
                                <div class="stat-label">Best Score</div>
                                <div class="stat-value">${playerStats.bestScore.toLocaleString()}</div>
                            </div>
                            <div class="stat-item">
                                <span class="stat-icon">🎮</span>
                                <div class="stat-label">Games</div>
                                <div class="stat-value">${playerStats.totalGames}</div>
                            </div>
                        </div>
                    </div>
                ` : ''}
                  <div class="leaderboard-list">
                    ${leaderboard.map(entry => `
                        <div class="leaderboard-item ${entry.playerId === playerId ? 'current-player' : ''}" 
                             style="${entry.playerId === playerId ? 'background: rgba(0,212,255,0.2); border: 1px solid #00d4ff;' : ''}">
                            <div class="leaderboard-rank">#${entry.rank}</div>
                            <div class="leaderboard-name">${entry.playerName}</div>
                            <div class="leaderboard-score">${entry.score.toLocaleString()}</div>
                        </div>
                    `).join('')}
                    
                    ${leaderboard.length === 0 ? `
                        <div style="text-align: center; color: #888; padding: 20px;">
                            No scores yet. Be the first to play!
                        </div>
                    ` : ''}
                </div>
                
                <div class="button-grid">
                    <button class="card-button primary" id="playGameBtn">
                        🎮 Play Game
                    </button>
                    <button class="card-button secondary" id="refreshBtn">
                        🔄 Refresh
                    </button>
                    <button class="card-button secondary" id="dashboardBtn">
                        📊 Dashboard
                    </button>
                </div>
            </div>
        `;
        
        this.bindLeaderboardEvents();
    }

    /**
     * Show loading state
     */
    async showLoading(message = 'Loading...') {
        await this.setState(this.states.LOADING);
        
        this.container.innerHTML = `
            <div class="unified-card">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            </div>
        `;
    }

    // =============================================================================
    // EVENT BINDING METHODS
    // =============================================================================

    bindWelcomeEvents() {
        const nameInput = this.container.querySelector('#playerNameInput');
        const createBtn = this.container.querySelector('#createPlayerBtn');
        const skipBtn = this.container.querySelector('#skipBtn');
        
        nameInput?.addEventListener('input', (e) => {
            const name = e.target.value.trim();
            createBtn.disabled = name.length < 3;
        });
        
        createBtn?.addEventListener('click', async () => {
            const name = nameInput.value.trim();
            if (name.length >= 3) {
                await this.showLoading('Creating player...');
                try {
                    await this.playerSystem.createPlayer({ displayName: name });
                    await this.showPlayerDashboard();
                } catch (error) {
                    console.error('Failed to create player:', error);
                    alert('Failed to create player. Please try again.');
                }
            }
        });
        
        skipBtn?.addEventListener('click', async () => {
            await this.showLoading('Setting up guest session...');
            try {
                await this.playerSystem.createPlayer();
                await this.showPlayerDashboard();
            } catch (error) {
                console.error('Failed to create guest player:', error);
                alert('Failed to start session. Please try again.');
            }
        });
        
        // Focus input
        setTimeout(() => nameInput?.focus(), 500);
    }

    bindGameResultsEvents() {
        this.container.querySelector('#playAgainBtn')?.addEventListener('click', () => {
            this.hide();
            this.emit('card:play-again');
        });
        
        this.container.querySelector('#leaderboardBtn')?.addEventListener('click', () => {
            this.showLeaderboard();
        });
        
        this.container.querySelector('#dashboardBtn')?.addEventListener('click', () => {
            this.showPlayerDashboard();
        });
    }

    bindDashboardEvents() {
        this.container.querySelector('#playGameBtn')?.addEventListener('click', () => {
            this.hide();
            this.emit('card:start-game');
        });
        
        this.container.querySelector('#leaderboardBtn')?.addEventListener('click', () => {
            this.showLeaderboard();
        });
        
        this.container.querySelector('#walletBtn')?.addEventListener('click', async () => {
            const player = await this.playerSystem.getPlayer();
            if (!player.walletAddress) {
                this.emit('card:connect-wallet');
            } else {
                this.showNotification('Wallet already connected!');
            }
        });
        
        this.container.querySelector('#settingsBtn')?.addEventListener('click', () => {
            this.showNotification('Settings coming soon!');
        });
    }

    bindPaymentEvents() {
        this.container.querySelectorAll('.pricing-tier').forEach(tier => {
            tier.addEventListener('click', () => {
                const tierType = tier.dataset.tier;
                this.processPurchase(tierType);
            });
        });
        
        this.container.querySelector('#cancelPaymentBtn')?.addEventListener('click', () => {
            this.hide();
        });
    }

    bindLeaderboardEvents() {
        this.container.querySelector('#playGameBtn')?.addEventListener('click', () => {
            this.hide();
            this.emit('card:start-game');
        });
        
        this.container.querySelector('#refreshBtn')?.addEventListener('click', () => {
            this.showLeaderboard(); // Refresh the leaderboard
        });
        
        this.container.querySelector('#dashboardBtn')?.addEventListener('click', () => {
            this.showPlayerDashboard();
        });
    }

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    /**
     * Set card state with animation
     */
    async setState(newState) {
        if (this.animationInProgress) return;
        
        this.animationInProgress = true;
        this.currentState = newState;
        
        if (newState === this.states.HIDDEN) {
            await this.hide();
        } else {
            await this.show();
        }
        
        this.animationInProgress = false;
    }

    /**
     * Show the card with animation
     */
    async show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.container.style.display = 'flex';
        
        // Force reflow
        this.container.offsetHeight;
        
        this.container.classList.add('visible');
        const card = this.container.querySelector('.unified-card');
        if (card) {
            card.classList.add('visible');
        }
        
        // Start auto-updates for dynamic content
        this.startAutoUpdates();
    }

    /**
     * Hide the card with animation
     */
    async hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.container.classList.remove('visible');
        
        const card = this.container.querySelector('.unified-card');
        if (card) {
            card.classList.remove('visible');
        }
        
        setTimeout(() => {
            this.container.style.display = 'none';
            this.currentState = this.states.HIDDEN;
        }, 300);
        
        // Stop auto-updates
        this.stopAutoUpdates();
        
        this.emit('card:hidden');
    }

    /**
     * Process purchase selection
     */
    async processPurchase(tier) {
        await this.showLoading('Processing payment...');
        
        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const player = await this.playerSystem.getPlayer();
            const amounts = { single: 0.25, daily: 3.00, monthly: 10.00 };
            
            await this.playerSystem.processPayment({
                amount: amounts[tier],
                currency: 'usdc',
                description: `${tier} game access`,
                metadata: { tier }
            });
            
            this.showNotification(`✅ Payment successful! ${tier} access activated.`);
            this.hide();
            this.emit('card:start-game');
        } catch (error) {
            console.error('Payment failed:', error);
            this.showNotification('❌ Payment failed. Please try again.');
            await this.showPaymentModal();
        }
    }

    /**
     * Show notification toast
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 212, 255, 0.4);
            z-index: 10000;
            font-weight: bold;
            animation: slideIn 0.3s ease;
        `;
        
        // Add animation styles if not present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Start auto-updates for real-time data
     */
    startAutoUpdates() {
        this.stopAutoUpdates(); // Clear any existing interval
        
        this.updateInterval = setInterval(() => {
            if (this.currentState === this.states.LEADERBOARD) {
                // Auto-refresh leaderboard every 30 seconds
                this.showLeaderboard();
            }
        }, 30000);
    }

    /**
     * Stop auto-updates
     */
    stopAutoUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update game results display with new data
     */
    updateGameResults(data) {
        const infoElement = this.container.querySelector('#gameResultsInfo');
        if (infoElement && data.isNewBest) {
            infoElement.innerHTML += '<div style="color: #ff6b35; font-weight: bold; animation: pulse 1s;">🎉 New Personal Best!</div>';
        }
    }

    /**
     * Event emitter
     */
    emit(event, data) {
        document.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.stopAutoUpdates();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        console.log('🛑 Unified Player Card destroyed');
    }
}

export default UnifiedPlayerCard;
