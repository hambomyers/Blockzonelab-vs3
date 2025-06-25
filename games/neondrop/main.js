/**
 * NeonDrop - Elegant Main Controller  
 * Pure, simple, elegant - focused on the beautiful neon drop experience
 */

// Core game systems
import { GameEngine } from './core/game-engine.js';
import { Renderer } from './core/renderer.js';
import { InputController } from './core/input-controller.js';
import { AudioSystem } from './core/audio-system.js';
import { ViewportManager } from './core/viewport-manager.js';

// Game configuration and elegant game over
import { Config } from './config.js';
import { SimpleGameOver } from './ui/SimpleGameOver.js'; // Pure elegance

// Essential UI components
import { GuidePanel } from './ui/guide-panel.js';
import { UIStateManager } from './ui/ui-state-manager.js';
import { StatsPanel } from './ui/stats-panel.js';
import { TournamentUI } from './ui/tournament-ui.js';

// Payment systems (simplified)
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
        this.uiStateManager = new UIStateManager();
        
        // Elegant game over system
        this.gameOverHandler = null;
          // Payment systems
        this.payment = new USDCPaymentSystem();
        
        // State
        this.running = false;
        this.lastTime = performance.now();
        this.accumulator = 0;
        
        // Setup globals
        window.neonDrop = this;
        console.log('🌐 NeonDrop initialized - Ready for elegant experience');
    }

    // Methods expected by panels
    state() {
        return this.engine && this.engine.getState ? this.engine.getState() : {};
    }

    async initialize() {
        try {
            await this.config.load();
            this.setupDisplay();
            
            // Enhanced: Initialize SimpleGameOver (includes UnifiedPlayerSystem)
            console.log('🚀 Initializing enhanced game over system...');
            this.gameOverHandler = new SimpleGameOver();
            
            // Wait for systems to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            this.isGameOverReady = true;
            
            console.log('✅ SimpleGameOver system initialized');
            
            this.createSystems();
            this.setupUI();
            this.cleanupOldUI();
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
    }

    setupUI() {
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
    }

    cleanupOldUI() {
        // Remove any old tournament panels
        const oldTournamentPanel = document.getElementById('tournament-panel');
        if (oldTournamentPanel) {
            oldTournamentPanel.remove();
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
            elements.forEach(el => el.remove());
        });
        
        // Remove any old style elements that might conflict
        const oldStyles = document.querySelectorAll('style[data-legacy]');
        oldStyles.forEach(style => style.remove());
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
        // REMOVED: showGameMenuCardWithDelay(1000); - unused menu system
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
        
        // REMOVED: showGameMenuCardWithDelay(500); - unused menu system
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

    getConfig() {
        return this.config || {};
    }

    bindEvents() {
        // FIXED: Game over event - routes to SimpleGameOver (frictionless flow)
        document.addEventListener('gameOver', async (e) => {
            const { score, level, lines, time } = e.detail;
            console.log('🎮 Game over event received');
            
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
    }

    async initBackgroundSystems() {
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
}


// Auto-initialize
async function startGame() {
    try {
        const game = new NeonDrop();
        await game.initialize();
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








