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

// 2-Player mode
import { twoPlayerEngine } from './core/TwoPlayerEngine.js';

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

    getConfig() {
        return this.config || {};
    }    async initialize() {
        console.log('🎮 Initializing NeonDrop...');
        
        // Initialize core systems
        this.setupCoreSystems();
        
        // Initialize UI
        this.setupUI();
        
        // Initialize 2-player engine
        this.setupTwoPlayerMode();
        
        // Initialize payment system
        this.setupPaymentSystem();
        
        // Clean up any old UI elements
        this.cleanupOldUI();
        
        // Start the game loop
        this.startGameLoop();
        
        console.log('✅ NeonDrop initialized successfully');
    }

    setupCoreSystems() {
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
          
        // FIXED: Skip UI state manager - using event-based system instead
        // this.uiStateManager.initialize(this.tournamentUI, document.getElementById('game'), this.gameOverHandler);
        
        // Start with menu card visible instead of tournament modal
        // The menu card will be shown in setupGameMenuCard()
    }

    setupTwoPlayerMode() {
        // Initialize 2-player engine with game containers
        const gameContainer = document.getElementById('gameContainer');
        const singlePlayerContainer = document.getElementById('gameContainer');
        
        if (gameContainer) {
            twoPlayerEngine.initialize(gameContainer, singlePlayerContainer);
        }
    }

    setupPaymentSystem() {
        // Implementation of setupPaymentSystem method
    }

    startGameLoop() {
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








