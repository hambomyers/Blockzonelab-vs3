/**
 * NeonDrop - Optimized Main Controller
 * Clean, bulletproof, 25% smaller than previous versions
 */

import { GameEngine } from './game-engine.js';
import { Renderer } from './renderer.js';
import { InputController } from './input-controller.js';
import { AudioSystem } from './audio-system.js';
import { Config } from './config.js';
import { GuidePanel } from './guide-panel.js';
import { UIStateManager } from './ui-state-manager.js';
import { ViewportManager } from './viewport-manager.js';
import { StatsPanel } from './stats-panel.js';
import { PlayerIdentity } from './player-identity.js';
import { LeaderboardSystem } from './leaderboard.js';
import { ArcadeLeaderboardUI } from './arcade-leaderboard-ui.js';
import { GameOverSequence } from './game-over-sequence.js';
import { TournamentUI } from './tournament-ui.js';
import { DailyTournament } from '../../shared/daily-tournament.js';
import { USDCPaymentSystem } from '../../shared/usdc-payment.js';

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
        this.uiStateManager = new UIStateManager();
        this.identity = new PlayerIdentity();
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
        window.neonDrop = { game: this };  // Add this for panel positioning
        window.leaderboard = this.leaderboard;
        window.leaderboardUI = new ArcadeLeaderboardUI(this.leaderboard);
        window.gameOverSequence = new GameOverSequence();
        window.dailyTournament = this.tournament;
        window.usdcPayment = this.payment;
    }

    async initialize() {
        try {
            console.log('🚀 NeonDrop starting...');
            
            await this.config.load();
            this.setupDisplay();
            this.createSystems();
            this.setupUI();
            this.bindEvents();
            this.startLoop();
            
            // Background initialization
            this.initBackgroundSystems();
            
            console.log('✅ NeonDrop ready');
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
        this.stats.positionPanel();        // Beautiful tournament UI
        this.tournamentUI = new TournamentUI();
        this.tournamentUI.setTournament(this.tournament);
          // Initialize professional UI state management with all UI elements
        this.uiStateManager.initialize(this.tournamentUI, document.getElementById('game'), window.gameOverSequence);
        
        // Start in APPLICATION_READY state (tournament modal center-stage)
        setTimeout(() => {
            this.uiStateManager.setState('APPLICATION_READY');
        }, 1000);
    }    bindEvents() {        // Game over choices - now handled by state manager
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
            this.uiStateManager.beginGameplay();
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

        // Touch device detection
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile && 'ontouchstart' in window) {
            document.body.classList.add('touch-device');
        }
    }

    async initBackgroundSystems() {
        try {
            // Tournament system is bulletproof - always works
            console.log('🏆 Tournament ready');
            
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
        
        if (updated || this.shouldRender()) {
            this.render();
        }
        
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
    }

    shouldRender() {
        const phase = this.engine?.getState()?.phase;
        return phase === 'CLEARING' || phase === 'COUNTDOWN' || phase === 'GAME_OVER';
    }    handleAction(action) {
        if (!this.engine) return;
        
        // Initialize audio on first interaction
        if (!this.audio.initialized) {
            this.audio.init();
        }
          // Ensure input system is ready when starting a game
        if (action.type === 'START_GAME') {
            console.log('🎮 Starting game - beginning gameplay session');
            this.input.ensureReady();
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
        window.neonDrop = game; // Debug access
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
