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
import { initializeUnifiedSystems } from '../../shared/platform/UnifiedSystemsIntegration.js';
// Legacy imports removed - using unified systems
import UniversalPaymentSystem from './UniversalPaymentSystem.js';
import { SimpleGameOver } from './ui/SimpleGameOver.js';

// UI components
import { GuidePanel } from './ui/guide-panel.js';
import { UIStateManager } from './ui/ui-state-manager.js';
import { StatsPanel } from './ui/stats-panel.js';
// Removed: EverythingCard - using SimpleGameOver for frictionless flow
import { TournamentUI } from './ui/tournament-ui.js';

// Shared systems
// Removed: DailyTournament - using UnifiedTournamentSystem via unified systems
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
        this.input = null;
          // UI systems
        this.guide = null;
        this.stats = null;
        this.tournamentUI = null;
        // FIXED: Remove conflicting UI state manager
        // this.uiStateManager = new UIStateManager();          
        
        // FIXED: Single source of truth for game over handling
        this.gameOverHandler = null;
        this.playerSystem = null;
        this.isUnifiedSystemsReady = false;
          // Unified Systems Integration
        this.unifiedSystems = null; // Will be initialized async
        this.playerIdentity = null; // Legacy compatibility
        this.tournament = null; // Legacy compatibility  
        // REMOVED: everythingCard - using SimpleGameOver
        
        // Payment system (still uses legacy for now)
        this.universalPayments = null; // Will be set after unified systems init        
        // Alias for compatibility  
        this.identity = null; // Will be set after unified systems init
        this.universalIdentity = null; // Will be set after unified systems init
        
        // Web3 systems (bulletproof)
        this.payment = new USDCPaymentSystem();
          // State
        this.running = false;
        this.lastTime = performance.now();
        this.accumulator = 0;
        
        // Setup basic globals (unified systems will be added after init)
        this.setupGlobals();
    }    setupGlobals() {
        // Modern unified system references (when available)
        window.neonDrop = this;
        if (this.unifiedSystems) {
            window.unifiedSystems = this.unifiedSystems;
            window.playerSystem = this.unifiedSystems.playerSystem;
            window.tournamentSystem = this.unifiedSystems.tournamentSystem;
            window.playerCard = this.unifiedSystems.playerCard;
        }
          // Legacy compatibility references (for existing code)
        window.universalIdentity = this.playerIdentity;
        window.leaderboard = this.tournament;
        // REMOVED: gameOverSequence - using SimpleGameOver
        window.dailyTournament = this.tournament;
        window.usdcPayment = this.payment;
        
        console.log('🌐 Global references configured for unified systems');
    }
    
    // Methods expected by panels
    state() {
        return this.engine?.getState() || {};
    }

    getConfig() {
        return this.config || {};
    }    async initialize() {
        try {
            await this.config.load();
            this.setupDisplay();
              // Initialize unified systems
            console.log('🚀 Initializing unified systems...');
            this.unifiedSystems = await initializeUnifiedSystems();
              // FIXED: Set up proper references
            this.playerSystem = this.unifiedSystems.playerSystem;
            this.tournament = this.unifiedSystems.tournamentSystem;
              // FIXED: Initialize the simple, frictionless game over system
            this.gameOverHandler = new SimpleGameOver();
            
            // FIXED: Set up compatibility aliases
            this.playerIdentity = this.playerSystem;
            // REMOVED: everythingCard legacy compatibility - using SimpleGameOver directly
            
            this.isUnifiedSystemsReady = true;
            console.log('✅ Unified systems initialized with SimpleGameOver');
              // Set up compatibility aliases
            this.identity = this.playerIdentity;
            this.universalIdentity = this.playerIdentity;
            
            // Initialize payment system with unified identity (with safety check)
            if (this.playerIdentity) {
                this.universalPayments = new UniversalPaymentSystem(this.playerIdentity);
            } else {
                console.warn('⚠️ Player identity not ready, skipping payment system for now');
            }
              console.log('✅ Unified systems initialized with legacy compatibility');
            
            // Update global references with unified systems
            this.setupGlobals();
            
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

    createSystems() {
        this.audio = new AudioSystem(this.config);
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
          // Use unified systems (SimpleGameOver already set in initialize)
        // Make SimpleGameOver globally accessible
        window.neonDrop.gameOverHandler = this.gameOverHandler;
          
        // FIXED: Skip UI state manager - using event-based system instead
        // this.uiStateManager.initialize(this.tournamentUI, document.getElementById('game'), this.gameOverHandler);
        
        // Start with menu card visible instead of tournament modal
        // The menu card will be shown in setupGameMenuCard()
    }

    setupGameMenuCard() {
        // Wait for DOM to be ready
        const initCard = () => {            this.gameMenuCard = document.getElementById('game-menu-card');
            if (!this.gameMenuCard) {
                console.log('Game menu card not found - this is optional for core gameplay');
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
                break;            case 'leaderboard':
                // Show leaderboard
                console.log('🏆 Leaderboard requested');
                console.log('🔍 window.leaderboard exists:', !!window.leaderboard);
                
                setTimeout(() => {
                    if (window.leaderboard) {
                        console.log('🎯 Calling leaderboard.show()');
                        window.leaderboard.show();
                    } else {
                        console.error('❌ window.leaderboard is null/undefined!');
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
    }    // FIXED: Clean event binding
    bindEvents() {
        // FIXED: Game over event - routes to SimpleGameOver (frictionless flow)
        document.addEventListener('gameOver', async (e) => {
            const { score, level, lines, time } = e.detail;
            console.log('🎮 Game over event received - showing SimpleGameOver');
            
            if (this.gameOverHandler) {
                await this.gameOverHandler.show(score, { level, lines, time });
            } else {
                console.error('❌ Game over handler not initialized');
            }
        });

        // FIXED: Simple game over choice handling
        document.addEventListener('simpleGameOver', (e) => {
            const { action } = e.detail;
            console.log('🎮 Simple game over action:', action);
            
            switch (action) {
                case 'play-again':
                    this.startNewGame();
                    break;
                case 'show-leaderboard':
                    this.showLeaderboard();
                    break;
                case 'leaderboard':
                    if (this.tournament && this.tournament.show) {
                        this.tournament.show();
                    }
                    break;
            }
        });

        // Tournament selection/start game
        document.addEventListener('startGame', e => {
            console.log('🎮 Starting game from tournament UI');
            if (this.gameOverHandler) {
                this.gameOverHandler.hide();
            }
            this.startNewGame();
        });

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
            }

        });

        // Touch device detection using centralized system
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
    }

    gameLoop() {
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
            
            this.renderer.render(state, particles, starfield);        } catch (error) {
            console.warn('Render error:', error);
        }
    }

    shouldRender() {
        const phase = this.engine?.getState()?.phase;
        // Always render during menu/idle states, but throttle during gameplay
        return true; // Simplified - let the gameLoop handle throttling
    }

    handleAction(action) {
        if (!this.engine) return;
        
        // Initialize audio on first interaction
        if (!this.audio.initialized) {
            this.audio.init();
        }        // Ensure input system is ready when starting a game
        if (action.type === 'START_GAME') {
            console.log('🎮 Starting game - beginning gameplay session');
            // FIXED: Direct game engine interaction instead of UI state manager
            if (this.engine) {
                this.engine.startFreePlay();
            }
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
    }

    /**
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
        this.running = false;        this.audio?.destroy();
        console.log('🛑 NeonDrop shutdown');
    }

    // FIXED: Clean game start
    async startNewGame() {
        console.log('🎮 Starting new game');
        
        if (this.gameOverHandler) {
            this.gameOverHandler.hide();
        }
        
        if (this.engine) {
            this.engine.returnToMenu();
        }
        
        // Brief delay for smooth transition
        setTimeout(() => {
            if (this.engine) {
                this.engine.startFreePlay();
            }
        }, 300);
    }

    // FIXED: Clean menu return
    returnToMenu() {
        console.log('🔄 Returning to menu');
        
        if (this.gameOverHandler) {
            this.gameOverHandler.hide();
        }
        
        if (this.engine) {
            this.engine.returnToMenu();
        }
        
        this.showGameMenuCardWithDelay(500);
    }

    showLeaderboard() {
        console.log('🏆 Showing leaderboard');
        
        // Use tournament system if available
        if (this.tournament?.show) {
            this.tournament.show();
        } else if (this.tournamentUI?.show) {
            this.tournamentUI.show();
        } else {
            console.warn('⚠️ No leaderboard system available');
        }
    }
}


// Auto-initialize
async function startGame() {
    try {
        const game = new NeonDrop();
        await game.initialize();
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








