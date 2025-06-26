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

// Configuration
import { Config } from './config.js';

// UI Systems
import { UIStateManager } from './ui/ui-state-manager.js';
import { GuidePanel } from './ui/guide-panel.js';
import { StatsPanel } from './ui/stats-panel.js';
import { TournamentUI } from './ui/tournament-ui.js';
import { SimpleGameOver } from './ui/SimpleGameOver.js'; // Re-enabled for money-involved gaming
// DISABLED: Using frosted glass effect in renderer instead
// import { SimpleGameOver } from './ui/SimpleGameOver.js'; // Pure elegance

// Gameplay systems
import { ParticleSystem } from './gameplay/particles.js';
import { ScoringSystem } from './gameplay/scoring.js';
import { ChicletRenderer } from './gameplay/chiclet.js';
import { createStarfieldRenderer } from './gameplay/starfield.js';

// Shared systems
import { sessionManager } from '../../shared/platform/session.js';
import { USDCPaymentSystem } from '../../shared/economics/usdc-payment.js';
import { PrizeCalculator } from '../../shared/economics/prize-calculator.js';
import { ReferralTracker } from '../../shared/components/ReferralTracker.js';
import { ViralStatusSystem } from '../../shared/components/ViralStatusSystem.js';
import { StyleSelector } from '../../shared/components/StyleSelector.js';

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
        this.lastTime = 0;
        this.accumulator = 0;
        this.isGameOverReady = false;
        
        // Setup globals
        window.neonDrop = this;
        console.log('🌐 NeonDrop initialized - Ready for elegant experience');
    }

    // Methods expected by panels
    state() {
        return this.engine && this.engine.getState ? this.engine.getState() : {};
    }

    async initialize() {
        console.log('🌐 NeonDrop initializing...');
        
        // Initialize core systems
        await this.setupDisplay();
        this.createSystems();
        this.setupUI();
        this.cleanupOldUI();
        
        // FIXED: Initialize SimpleGameOver with better error handling
        try {
            this.gameOverHandler = new SimpleGameOver();
            console.log('✅ SimpleGameOver system initialized');
            
            // Make globally accessible
            window.neonDrop.gameOverHandler = this.gameOverHandler;
        } catch (error) {
            console.error('❌ Failed to initialize SimpleGameOver:', error);
            this.gameOverHandler = null;
        }
        
        // Initialize background systems
        await this.initBackgroundSystems();
        
        // Start the game loop
        this.startLoop();
        
        // Bind events last
        this.bindEvents();
        
        console.log('🎮 NeonDrop ready');
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
            console.error('❌ Update error:', error);
            // Don't let update errors crash the game loop
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
            console.warn('⚠️ Render error:', error);
            // Don't let render errors crash the game loop
        }
    }

    shouldRender() {
        const phase = this.engine?.getState()?.phase;
        // Always render during menu/idle states, but throttle during gameplay
        return true; // Simplified - let the gameLoop handle throttling
    }

    // FIXED: Handle action with proper game over state checking
    handleAction(action) {
        if (!this.engine) return;
        
        // Initialize audio on first interaction
        if (!this.audio.initialized) {
            this.audio.init();
        }
        
        // Ensure input system is ready when starting a game
        if (action.type === 'START_GAME') {
            console.log('🎮 Starting game - beginning gameplay session');
            
            // Reset game over state before starting
            if (this.engine.gameOverTriggered) {
                console.log('🔄 Resetting game over state before new game');
                this.engine.gameOverTriggered = false;
            }
            
            // FIXED: Direct game engine interaction
            if (this.engine) {
                this.engine.startFreePlay();
            }
            return;
        }
        
        // Pass action to engine
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

    // FIXED: Clean game start with proper state reset
    async startNewGame() {
        console.log('🎮 Starting new game');
        
        // NEW: Check lockout system before starting
        if (this.engine && !this.engine.canStartNewGame()) {
            console.log('🚫 New game blocked by lockout system');
            return;
        }
        
        // Hide game over UI if active
        if (this.gameOverHandler && this.gameOverHandler.isVisible) {
            this.gameOverHandler.hide();
        }
        
        // Reset engine state completely
        if (this.engine) {
            // Reset the game over flag
            this.engine.gameOverTriggered = false;
            
            // Return to menu first to clear state
            this.engine.returnToMenu();
            
            // Brief delay for clean state transition
            setTimeout(() => {
                if (this.engine) {
                    this.engine.startFreePlay();
                    console.log('🎮 Game started successfully');
                }
            }, 100);
        }
    }

    // FIXED: Clean menu return
    returnToMenu() {
        console.log('🔄 Returning to menu');
        
        // Hide game over UI if active
        if (this.gameOverHandler && this.gameOverHandler.isVisible) {
            this.gameOverHandler.hide();
        }
        
        if (this.engine) {
            // Reset the game over flag
            this.engine.gameOverTriggered = false;
            this.engine.returnToMenu();
        }
    }

    // FIXED: Show leaderboard with error handling
    showLeaderboard() {
        console.log('🏆 Showing leaderboard');
        
        try {
            // Use tournament system if available
            if (this.tournament?.show) {
                this.tournament.show();
            } else if (this.tournamentUI?.show) {
                this.tournamentUI.show();
            } else if (this.gameOverHandler?.showLeaderboard) {
                // Fallback to SimpleGameOver leaderboard
                this.gameOverHandler.showLeaderboard();
            } else {
                console.warn('⚠️ No leaderboard system available');
            }
        } catch (error) {
            console.error('❌ Failed to show leaderboard:', error);
        }
    }

    getConfig() {
        return this.config || {};
    }

    bindEvents() {
        // FIXED: Game over event - ensure proper score passing
        document.addEventListener('gameOver', async (e) => {
            const { score, level, lines, time } = e.detail;
            console.log('🎮 Game over event received - Score:', score);
            
            // FIXED: Ensure we have the actual score from the engine
            let actualScore = score || this.engine?.getState()?.score || 0;
            
            // Additional validation - get score directly from engine if event score is 0
            if (actualScore === 0 && this.engine) {
                const engineState = this.engine.getState();
                const engineScore = engineState.score || 0;
                console.log('🎮 Engine state score:', engineScore);
                
                if (engineScore > 0) {
                    actualScore = engineScore;
                }
            }
            
            console.log('🎮 Final score for game over:', actualScore);
            
            if (this.gameOverHandler) {
                try {
                    await this.gameOverHandler.show(actualScore, { level, lines, time });
                    console.log('✅ SimpleGameOver shown successfully');
                } catch (error) {
                    console.error('❌ Failed to show SimpleGameOver:', error);
                    // Enhanced game over screen should always work - no fallback needed
                    console.log('🎮 Enhanced game over screen should handle this');
                }
            } else {
                console.error('❌ Game over handler not initialized');
                console.log('🎮 Game over handler should be initialized');
            }
        });

        // Simple game over choice handling
        document.addEventListener('simpleGameOver', (e) => {
            const { action } = e.detail;
            console.log('🎮 Game over action:', action);
            
            switch (action) {
                case 'play-again':
                    this.startNewGame();
                    break;
                case 'show-leaderboard':
                case 'leaderboard':
                    this.showLeaderboard();
                    break;
            }
        });

        // Tournament selection/start game
        document.addEventListener('startGame', e => {
            console.log('🎮 Starting game from UI');
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
            
            // FIXED: Handle SPACE key for game over continue - check lockout system
            const gameState = this.engine?.getState();
            if (e.key === ' ' && gameState && 
                (gameState.phase === 'GAME_OVER' || gameState.phase === 'GAME_OVER_SEQUENCE')) {
                e.preventDefault();
                
                // NEW: Check if new game can be started (lockout system)
                if (this.engine && this.engine.canStartNewGame()) {
                    console.log('🎮 Starting new game after lockout period');
                    this.startNewGame();
                } else {
                    console.log('🚫 New game blocked by lockout system');
                }
            }
        });

        // Touch device detection
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








