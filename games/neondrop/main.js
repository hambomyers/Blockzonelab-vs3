/**
 * NeonDrop - Optimized Main Controller
 * Clean, bulletproof, 25% smaller than previous versions
 */

// Core game systems
import { GameEngine } from './core/game-engine.js';
import { Renderer } from './core/renderer.js';
import { InputController } from './core/input-controller.js';
import { AudioSystem } from './core/audio-system.js';
import { ViewportManager } from './core/viewport-manager.js';

// Game configuration and identity
import { Config } from './config.js';
import { SimplePlayerIdentity } from './SimplePlayerIdentity.js';
import UniversalPaymentSystem from './UniversalPaymentSystem.js';

// UI components
import { GuidePanel } from './ui/guide-panel.js';
import { UIStateManager } from './ui/ui-state-manager.js';
import { StatsPanel } from './ui/stats-panel.js';
import { GameOverSequence } from './ui/game-over-sequence.js';
import { LeaderboardSystem } from './ui/leaderboard.js';
import { ElegantLeaderboardUI } from './ui/elegant-leaderboard-ui.js';
import { TournamentUI } from './ui/tournament-ui.js';

// Shared systems
import { DailyTournament } from '../../shared/tournaments/daily-tournament.js';
import { USDCPaymentSystem } from '../../shared/economics/usdc-payment.js';

class NeonDrop {
    constructor() {
        // Core config & viewport
        this.config = new Config();
        this.viewport = new ViewportManager();
        
        // Game systems (null until initialized)
        this.engine = null;
        this.renderer = null;
        this.audio = null;
        this.input = null;        // UI systems
        this.guide = null;
        this.stats = null;
        this.tournamentUI = null;
        this.uiStateManager = new UIStateManager();        // Simple identity system (username + optional wallet)
        this.playerIdentity = new SimplePlayerIdentity();
        
        // Payment system
        this.universalPayments = new UniversalPaymentSystem(this.playerIdentity);
        
        // Alias for compatibility
        this.identity = this.playerIdentity;
        this.universalIdentity = this.playerIdentity; // Keep for existing code
        this.leaderboard = new LeaderboardSystem();
        
        // Web3 systems (bulletproof)
        this.tournament = new DailyTournament();
        this.payment = new USDCPaymentSystem();
        
        // State
        this.running = false;
        this.lastTime = performance.now();
        this.accumulator = 0;
        
        // Global access for UI systems
        this.setupGlobals();
    }    setupGlobals() {
        // Set up the complete global API that panels expect
        window.neonDrop = this;  // Panels expect the game instance directly
        window.leaderboard = this.leaderboard;
        window.leaderboardUI = new ElegantLeaderboardUI(this.leaderboard);
        window.gameOverSequence = new GameOverSequence();
        window.dailyTournament = this.tournament;
        window.usdcPayment = this.payment;
    }
    
    // Methods expected by panels
    state() {
        return this.engine?.getState() || {};
    }    getConfig() {
        return this.config || {};
    }    async initialize() {
        try {
            await this.config.load();
            this.setupDisplay();
            this.createSystems();
            this.setupUI();
            this.cleanupOldUI(); // Remove any old tournament UI elements
            this.setupGameMenuCard(); // Add our elegant menu card
            this.bindEvents();
            this.startLoop();
            
            // Background initialization
            this.initBackgroundSystems();
        } catch (error) {
            console.error('❌ Init failed:', error);
            this.showError('Game failed to load. Please refresh.');
        }
    }

    setupDisplay() {
        const game = document.getElementById('game');
        const bg = document.getElementById('bg');
        
        if (!game || !bg) throw new Error('Canvas elements missing');
        
        const dims = this.viewport.calculateOptimalDimensions(innerWidth, innerHeight);
        
        game.width = dims.canvasWidth;
        game.height = dims.canvasHeight;
        bg.width = innerWidth;
        bg.height = innerHeight;
          this.renderer = new Renderer(game, bg, this.config, dims);
        this.renderer.viewportManager = this.viewport;
        
        // Check if renderer has zones for panel positioning
        console.log('🔍 Renderer dimensions after creation:', {
            hasZones: !!this.renderer.dimensions?.zones,
            zones: this.renderer.dimensions?.zones,
            dims: this.renderer.dimensions
        });
    }

    createSystems() {        this.audio = new AudioSystem(this.config);
        this.engine = new GameEngine(this.config, this.audio, null);
        this.input = new InputController(
            action => this.handleAction(action),
            () => this.engine.getState(),
            this.config,
            () => this.tournamentUI ? this.tournamentUI.isVisible : false
        );
    }    setupUI() {
        this.guide = new GuidePanel();
        this.guide.positionPanel();
        
        this.stats = new StatsPanel();
        this.stats.positionPanel();
          // Beautiful tournament UI (keep for tournament mode)
        this.tournamentUI = new TournamentUI();
        this.tournamentUI.setTournament(this.tournament);
        
        // Create game over sequence
        this.gameOverSequence = new GameOverSequence();
          
        // Initialize professional UI state management with all UI elements
        this.uiStateManager.initialize(this.tournamentUI, document.getElementById('game'), this.gameOverSequence);
        
        // Start with menu card visible instead of tournament modal
        // The menu card will be shown in setupGameMenuCard()
    }    setupGameMenuCard() {
        // Wait for DOM to be ready
        const initCard = () => {
            this.gameMenuCard = document.getElementById('game-menu-card');
            if (!this.gameMenuCard) {
                console.error('Game menu card not found');
                return;
            }

            // Add event listeners for menu buttons
            const modeButtons = this.gameMenuCard.querySelectorAll('.game-mode-btn');
            const backButton = this.gameMenuCard.querySelector('.back-btn');

            modeButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const mode = e.currentTarget.dataset.mode;
                    this.handleMenuChoice(mode);
                });
            });

            if (backButton) {
                backButton.addEventListener('click', () => {
                    window.location.href = '/games/';
                });
            }

            // Show the menu card initially
            this.showGameMenuCard();
        };        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initCard);
        } else {
            initCard();
        }
    }

    /**
     * Clean up any old/legacy UI elements that might still exist
     */
    cleanupOldUI() {
        console.log('🧹 Cleaning up old UI elements...');
        
        // Remove any old tournament panels
        const oldTournamentPanel = document.getElementById('tournament-panel');
        if (oldTournamentPanel) {
            oldTournamentPanel.remove();
            console.log('🗑️ Removed old tournament panel');
        }
        
        // Remove any old overlay elements
        const overlaySelectors = [
            '.game-menu-overlay',
            '.tournament-overlay', 
            '.modal-overlay',
            '#gameMenuOverlay',
            '#tournamentOverlay'
        ];
        
        overlaySelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.remove();
                console.log(`🗑️ Removed legacy element: ${selector}`);
            });
        });
        
        // Remove any old style elements that might conflict
        const oldStyles = document.querySelectorAll('style[data-legacy]');
        oldStyles.forEach(style => style.remove());
        
        console.log('✅ Old UI cleanup complete');
    }

    handleMenuChoice(mode) {
        console.log('🎮 Menu choice:', mode);
        
        // Hide the menu card with elegant animation
        this.hideGameMenuCard();
        
        // Handle different game modes
        switch (mode) {
            case 'tournament':
                // Start tournament mode (existing functionality)
                setTimeout(() => {
                    if (this.tournamentUI) {
                        this.tournamentUI.show();
                    }
                }, 300);
                break;
                
            case 'free':
                // Start free play mode
                setTimeout(() => {
                    this.startFreePlay();
                }, 300);
                break;
                  case 'leaderboard':
                // Show leaderboard
                console.log('🏆 Leaderboard requested');
                console.log('🔍 window.leaderboardUI exists:', !!window.leaderboardUI);
                console.log('🔍 window.leaderboard exists:', !!window.leaderboard);
                
                setTimeout(() => {
                    if (window.leaderboardUI) {
                        console.log('🎯 Calling leaderboardUI.show()');
                        window.leaderboardUI.show();
                    } else {
                        console.error('❌ window.leaderboardUI is null/undefined!');
                        alert('Leaderboard system not initialized!');
                    }
                }, 300);
                break;
        }
    }

    startFreePlay() {
        console.log('🎮 Starting free play mode');
        // Start the game engine directly for free play
        if (this.engine) {
            this.engine.startFreePlay();
        }
        // Hide UI panels for clean gameplay
        this.uiStateManager.setState('GAME_ACTIVE');
    }

    showGameMenuCard() {
        if (this.gameMenuCard) {
            this.gameMenuCard.classList.remove('hidden');
        }
    }

    hideGameMenuCard() {
        if (this.gameMenuCard) {
            this.gameMenuCard.classList.add('hidden');
        }
    }

    // Called from game over and other return-to-menu scenarios
    showGameMenuCardWithDelay(delay = 1000) {
        setTimeout(() => {
            this.showGameMenuCard();
        }, delay);
    }bindEvents() {        // Game over choices - now handled by state manager
        document.addEventListener('gameOverChoice', e => {
            const { action, score } = e.detail;
            console.log('🎮 Game over choice received:', action);
            
            switch (action) {
                case 'leaderboard': 
                    window.leaderboardUI.show(score); 
                    break;                case 'play-again': 
                    this.returnToMenuViaStateManager();
                    break;
                case 'menu': 
                    this.returnToMenuViaStateManager();
                    break;
            }
        });// Game over state transition - move to results modal
        document.addEventListener('gameOver', e => {
            const { score, level, lines, time } = e.detail;
            console.log('🎮 Game over event received - transitioning to results modal');
            console.log('📊 Score:', score, 'Level:', level, 'Lines:', lines, 'Time:', time);
            this.uiStateManager.setState('RESULTS_MODAL', { score, level, lines, time });
        });        // Leaderboard dismissed - return to tournament modal
        document.addEventListener('leaderboardDismissed', e => {
            console.log('🏆 Leaderboard dismissed, returning to tournament modal');
            this.returnToMenuViaStateManager();
        });// Tournament selection/start game
        document.addEventListener('startGame', e => {
            console.log('🎮 Starting game from tournament UI');
            this.uiStateManager.beginGameplay();        });

        // Window resize (debounced)
        let resizeTimer;
        addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.handleResize(), 100);
        });

        // Auto-pause when hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.engine?.getState().phase === 'PLAYING') {
                this.engine.handleInput({ type: 'PAUSE' });
            }
        });

        // Prevent unwanted navigation
        addEventListener('keydown', e => {
            if ((e.key === 'Backspace' || e.key === ' ') && e.target === document.body) {
                e.preventDefault();
            }        });        // Touch device detection using centralized system
        if (window.BlockZoneMobile?.needsMobileControls()) {
            document.body.classList.add('touch-device');
        }
    }async initBackgroundSystems() {
        try {
            // Tournament system is bulletproof - always works
            console.log('🏆 Tournament ready');
            
            // Start tournament status updates
            if (this.tournament?.startPeriodicUpdates) {
                this.tournament.startPeriodicUpdates();
                console.log('📊 Tournament updates started');
            }
            
            // Payment system in demo mode by default
            if (this.payment?.initialize) {
                await this.payment.initialize();
                console.log('💰 Payment ready');
            }
        } catch (error) {
            console.log('🎮 Running in demo mode');
        }
    }

    startLoop() {
        this.running = true;
        this.render(); // Initial render
        requestAnimationFrame(() => this.gameLoop());
    }    gameLoop() {
        if (!this.running) return;
        
        const now = performance.now();
        const delta = Math.min(now - this.lastTime, 100);
        this.lastTime = now;
        
        this.accumulator += delta;
        const tickRate = this.config.get('game.tickRate');
        
        let updated = false;
        while (this.accumulator >= tickRate) {
            this.update(tickRate);
            this.accumulator -= tickRate;
            updated = true;
        }
          // Throttle rendering to prevent racing
        if (updated || this.shouldRender()) {
            this.render();
        }
        
        // Use only requestAnimationFrame for smooth 60fps
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        try {
            this.engine?.tick(deltaTime);
        } catch (error) {
            console.warn('Update error:', error);
        }
    }

    render() {
        if (!this.engine || !this.renderer) return;
        
        try {
            const state = this.engine.getState();
            const particles = this.engine.getParticles();
            const starfield = {
                enabled: this.config.get('graphics.starfield') || false,
                brightness: 1.0,
                stars: []
            };
            
            this.renderer.render(state, particles, starfield);
        } catch (error) {
            console.warn('Render error:', error);
        }
    }    shouldRender() {
        const phase = this.engine?.getState()?.phase;
        // Always render during menu/idle states, but throttle during gameplay
        return true; // Simplified - let the gameLoop handle throttling
    }handleAction(action) {
        if (!this.engine) return;
        
        // Initialize audio on first interaction
        if (!this.audio.initialized) {
            this.audio.init();
        }        // Ensure input system is ready when starting a game
        if (action.type === 'START_GAME') {
            console.log('🎮 Starting game - beginning gameplay session');
            // Input controller is already initialized, no need for ensureReady
            this.uiStateManager.beginGameplay();
        }
        
        this.engine.handleInput(action);
    }

    handleResize() {
        if (!this.renderer || !this.viewport) return;
        
        const dims = this.viewport.calculateOptimalDimensions(innerWidth, innerHeight);
        const game = document.getElementById('game');
        const bg = document.getElementById('bg');
        
        if (game && bg) {
            game.width = dims.canvasWidth;
            game.height = dims.canvasHeight;
            bg.width = innerWidth;
            bg.height = innerHeight;
            
            // Update renderer dimensions
            this.renderer.dimensions = dims;
            
            // Reposition panels
            if (this.guide) this.guide.positionPanel();
            if (this.stats) this.stats.positionPanel();
        }
    }

    showError(message) {
        const error = document.createElement('div');
        error.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(255,0,0,0.9); color: white; padding: 20px;
            border-radius: 10px; font-size: 18px; z-index: 10000; text-align: center;
        `;
        error.textContent = message;
        document.body.appendChild(error);
        
        setTimeout(() => error.remove(), 5000);
    }    /**
     * Professional return to menu - handles full system reset via state manager
     */
    returnToMenuViaStateManager() {
        console.log('🔄 Professional return to menu via state manager');
        
        // Reset game engine to clean state
        if (this.engine) {
            this.engine.returnToMenu();
        }
        
        // Let state manager handle the UI transitions
        this.uiStateManager.returnToMenu();
        
        // Show the elegant menu card after a brief delay
        this.showGameMenuCardWithDelay(1000);
    }

    destroy() {
        this.running = false;
        this.audio?.destroy();
        console.log('🛑 NeonDrop shutdown');
    }
}


// Auto-initialize
function startGame() {
    try {
        const game = new NeonDrop();
        game.initialize();
        // Global reference is set in setupGlobals()
    } catch (error) {
        console.error('Failed to start NeonDrop:', error);
    }
}

// Start when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGame);
} else {
    startGame();
}

// Cleanup on exit
addEventListener('beforeunload', () => window.neonDrop?.destroy());








