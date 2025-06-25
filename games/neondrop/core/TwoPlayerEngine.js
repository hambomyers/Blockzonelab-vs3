/**
 * TwoPlayerEngine - BlockZone Lab
 * Desktop-only 2-player mode with clean split-screen games
 */

import { GameEngine } from './game-engine.js';
import { Renderer } from './renderer.js';
import { InputController } from './input-controller.js';

export class TwoPlayerEngine {
    constructor() {
        this.isEnabled = false;
        this.player1 = null;
        this.player2 = null;
        this.gameContainer = null;
        this.singlePlayerContainer = null;
        this.twoPlayerContainer = null;
        
        this.setupEventListeners();
    }

    /**
     * Initialize 2-player mode
     */
    initialize(gameContainer, singlePlayerContainer) {
        this.gameContainer = gameContainer;
        this.singlePlayerContainer = singlePlayerContainer;
        
        // Check if 2-player mode is enabled
        const savedState = localStorage.getItem('neondrop_two_player_mode');
        if (savedState === 'true') {
            this.enableTwoPlayerMode();
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for toggle changes from guide panel
        document.addEventListener('twoPlayerModeChange', (e) => {
            if (e.detail.enabled) {
                this.enableTwoPlayerMode();
            } else {
                this.disableTwoPlayerMode();
            }
        });
    }

    /**
     * Enable 2-player mode
     */
    enableTwoPlayerMode() {
        if (this.isEnabled) return;
        
        this.isEnabled = true;
        console.log('🎮 Enabling desktop 2-player mode...');
        
        // Hide single player container
        if (this.singlePlayerContainer) {
            this.singlePlayerContainer.style.display = 'none';
        }
        
        // Hide any existing game elements
        const existingGame = document.getElementById('game');
        const existingBg = document.getElementById('bg');
        if (existingGame) existingGame.style.display = 'none';
        if (existingBg) existingBg.style.display = 'none';
        
        // Hide ALL UI elements for clean 2-player experience
        this.hideAllUIElements();
        
        // Create clean 2-player layout
        this.createCleanTwoPlayerLayout();
        
        // Initialize both game instances with desktop config
        this.initializeDesktopGameInstances();
        
        // Start both games
        this.startBothGames();
    }

    /**
     * Disable 2-player mode
     */
    disableTwoPlayerMode() {
        if (!this.isEnabled) return;
        
        this.isEnabled = false;
        console.log('🎮 Disabling 2-player mode...');
        
        // Clean up 2-player instances
        this.cleanupGameInstances();
        
        // Show single player container
        if (this.singlePlayerContainer) {
            this.singlePlayerContainer.style.display = 'block';
        }
        
        // Show existing game elements
        const existingGame = document.getElementById('game');
        const existingBg = document.getElementById('bg');
        if (existingGame) existingGame.style.display = 'block';
        if (existingBg) existingBg.style.display = 'block';
        
        // Show UI elements again
        this.showAllUIElements();
        
        // Remove 2-player layout
        this.removeTwoPlayerLayout();
    }

    /**
     * Hide ALL UI elements for clean 2-player experience
     */
    hideAllUIElements() {
        // Hide all panels and UI elements
        const elementsToHide = [
            '.guide-panel',
            '.stats-panel',
            '.guide-mobile-button',
            '.two-player-toggle-container',
            '.tournament-ui',
            '.mobile-controls',
            '.touch-controls',
            '.phone-controls',
            '.mobile-guide',
            '.stats-panel',
            '.leaderboard-panel'
        ];
        
        elementsToHide.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.display = 'none';
            });
        });
        
        // Hide any elements with mobile-related classes
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const className = el.className || '';
            if (className.includes('mobile') || className.includes('phone') || className.includes('touch')) {
                el.style.display = 'none';
            }
        });
    }

    /**
     * Show UI elements when returning to single player
     */
    showAllUIElements() {
        // Show guide panel
        const guidePanel = document.querySelector('.guide-panel');
        if (guidePanel) guidePanel.style.display = 'flex';
        
        // Show stats panel
        const statsPanel = document.querySelector('.stats-panel');
        if (statsPanel) statsPanel.style.display = 'flex';
        
        // Show 2-player toggle button
        const toggleContainer = document.querySelector('.two-player-toggle-container');
        if (toggleContainer) toggleContainer.style.display = 'flex';
    }

    /**
     * Create clean 2-player layout
     */
    createCleanTwoPlayerLayout() {
        // Create container for 2-player mode
        this.twoPlayerContainer = document.createElement('div');
        this.twoPlayerContainer.className = 'two-player-container';
        this.twoPlayerContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            background: #000;
            z-index: 1000;
        `;
        
        // Create player 1 container (left side)
        this.player1Container = document.createElement('div');
        this.player1Container.className = 'player-container player-1';
        this.player1Container.style.cssText = `
            flex: 1;
            position: relative;
            border-right: 2px solid #00d4ff;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #001122 0%, #002244 100%);
        `;
        
        // Create player 2 container (right side)
        this.player2Container = document.createElement('div');
        this.player2Container.className = 'player-container player-2';
        this.player2Container.style.cssText = `
            flex: 1;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #220011 0%, #440022 100%);
        `;
        
        // Add player labels
        this.addCleanPlayerLabels();
        
        // Add exit button
        this.addExitButton();
        
        // Add containers to main container
        this.twoPlayerContainer.appendChild(this.player1Container);
        this.twoPlayerContainer.appendChild(this.player2Container);
        
        // Add to body
        document.body.appendChild(this.twoPlayerContainer);
    }

    /**
     * Add clean player labels
     */
    addCleanPlayerLabels() {
        // Player 1 label
        const player1Label = document.createElement('div');
        player1Label.className = 'player-label player-1-label';
        player1Label.innerHTML = `
            <div class="label-content">
                <span class="player-name">PLAYER 1</span>
                <span class="player-controls">WASD + Space</span>
            </div>
        `;
        player1Label.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 100;
            background: rgba(0, 212, 255, 0.2);
            border: 2px solid #00d4ff;
            border-radius: 8px;
            padding: 12px 16px;
            color: white;
            font-size: 14px;
            font-weight: 700;
            text-align: center;
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
        `;
        
        // Player 2 label
        const player2Label = document.createElement('div');
        player2Label.className = 'player-label player-2-label';
        player2Label.innerHTML = `
            <div class="label-content">
                <span class="player-name">PLAYER 2</span>
                <span class="player-controls">Arrow Keys + Enter</span>
            </div>
        `;
        player2Label.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 100;
            background: rgba(255, 107, 107, 0.2);
            border: 2px solid #ff6b6b;
            border-radius: 8px;
            padding: 12px 16px;
            color: white;
            font-size: 14px;
            font-weight: 700;
            text-align: center;
            box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
        `;
        
        this.player1Container.appendChild(player1Label);
        this.player2Container.appendChild(player2Label);
    }

    /**
     * Add exit button
     */
    addExitButton() {
        const exitButton = document.createElement('button');
        exitButton.className = 'exit-2player-btn';
        exitButton.innerHTML = 'Exit 2-Player';
        exitButton.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            background: rgba(255, 107, 107, 0.2);
            border: 2px solid #ff6b6b;
            border-radius: 8px;
            padding: 12px 24px;
            color: white;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
        `;
        
        exitButton.addEventListener('mouseenter', () => {
            exitButton.style.background = 'rgba(255, 107, 107, 0.4)';
            exitButton.style.transform = 'translateX(-50%) scale(1.05)';
        });
        
        exitButton.addEventListener('mouseleave', () => {
            exitButton.style.background = 'rgba(255, 107, 107, 0.2)';
            exitButton.style.transform = 'translateX(-50%) scale(1)';
        });
        
        exitButton.addEventListener('click', () => {
            this.disableTwoPlayerMode();
        });
        
        this.twoPlayerContainer.appendChild(exitButton);
    }

    /**
     * Initialize desktop game instances
     */
    initializeDesktopGameInstances() {
        // Create player 1 game
        this.player1 = this.createDesktopGameInstance(this.player1Container, 'player1');
        
        // Create player 2 game
        this.player2 = this.createDesktopGameInstance(this.player2Container, 'player2');
    }

    /**
     * Create a desktop-only game instance
     */
    createDesktopGameInstance(container, playerId) {
        // Create canvas elements
        const bgCanvas = document.createElement('canvas');
        const gameCanvas = document.createElement('canvas');
        
        bgCanvas.id = `bg-${playerId}`;
        gameCanvas.id = `game-${playerId}`;
        
        // Calculate optimal size for desktop
        const containerWidth = container.clientWidth - 40; // Account for padding
        const containerHeight = container.clientHeight - 120; // Account for labels and padding
        const gameSize = Math.min(containerWidth, containerHeight);
        
        // Set canvas sizes
        bgCanvas.width = gameSize;
        bgCanvas.height = gameSize;
        gameCanvas.width = gameSize;
        gameCanvas.height = gameSize;
        
        // Set canvas styles for desktop
        [bgCanvas, gameCanvas].forEach(canvas => {
            canvas.style.cssText = `
                width: ${gameSize}px;
                height: ${gameSize}px;
                display: block;
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                image-rendering: pixelated;
                image-rendering: -moz-crisp-edges;
                image-rendering: crisp-edges;
                box-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
            `;
        });
        
        // Add to container
        container.appendChild(bgCanvas);
        container.appendChild(gameCanvas);
        
        // Create desktop-only config
        const desktopConfig = {
            get: (key) => {
                const defaults = {
                    'game.tickRate': 16.67,
                    'graphics.starfield': false,
                    'audio.enabled': true,
                    'mobile.enabled': false,
                    'touch.enabled': false
                };
                return defaults[key] || null;
            },
            load: () => Promise.resolve()
        };
        
        // Create game engine with desktop config
        const gameEngine = new GameEngine(desktopConfig, null, null);
        gameEngine.playerId = playerId;
        
        // Create renderer with desktop dimensions
        const renderer = new Renderer(gameCanvas, bgCanvas, desktopConfig, {
            canvasWidth: gameSize,
            canvasHeight: gameSize,
            blockSize: Math.floor(gameSize / 20) // Scale block size to canvas
        });
        
        // Create desktop-only input controller
        const inputController = this.createDesktopInputController(playerId);
        
        // Initialize game
        gameEngine.initialize(renderer, inputController);
        
        return {
            engine: gameEngine,
            renderer: renderer,
            inputController: inputController,
            container: container,
            bgCanvas: bgCanvas,
            gameCanvas: gameCanvas
        };
    }

    /**
     * Create desktop-only input controller
     */
    createDesktopInputController(playerId) {
        const inputController = new InputController();
        
        if (playerId === 'player1') {
            // Player 1: WASD + Space
            inputController.setKeyMap({
                left: ['KeyA'],
                right: ['KeyD'],
                down: ['KeyS'],
                up: ['KeyW'],
                rotate: ['KeyW'],
                hardDrop: ['Space'],
                hold: ['KeyC'],
                pause: ['KeyP', 'Escape']
            });
        } else {
            // Player 2: Arrow Keys + Enter
            inputController.setKeyMap({
                left: ['ArrowLeft'],
                right: ['ArrowRight'],
                down: ['ArrowDown'],
                up: ['ArrowUp'],
                rotate: ['ArrowUp'],
                hardDrop: ['Enter'],
                hold: ['ShiftRight'],
                pause: ['KeyP', 'Escape']
            });
        }
        
        return inputController;
    }

    /**
     * Start both games
     */
    startBothGames() {
        if (this.player1) {
            this.player1.engine.startGame('practice');
        }
        if (this.player2) {
            this.player2.engine.startGame('practice');
        }
    }

    /**
     * Cleanup game instances
     */
    cleanupGameInstances() {
        if (this.player1) {
            this.player1.engine.destroy();
            this.player1 = null;
        }
        if (this.player2) {
            this.player2.engine.destroy();
            this.player2 = null;
        }
    }

    /**
     * Remove 2-player layout
     */
    removeTwoPlayerLayout() {
        if (this.twoPlayerContainer) {
            this.twoPlayerContainer.remove();
            this.twoPlayerContainer = null;
        }
    }

    /**
     * Get current scores for comparison
     */
    getScores() {
        const score1 = this.player1?.engine?.scoring?.score || 0;
        const score2 = this.player2?.engine?.scoring?.score || 0;
        
        return {
            player1: score1,
            player2: score2,
            winner: score1 > score2 ? 'player1' : score2 > score1 ? 'player2' : 'tie'
        };
    }

    /**
     * Check if either player has game over
     */
    checkGameOver() {
        const gameOver1 = this.player1?.engine?.state?.gameState === 'GAME_OVER';
        const gameOver2 = this.player2?.engine?.state?.gameState === 'GAME_OVER';
        
        if (gameOver1 || gameOver2) {
            this.showGameOverResults();
        }
    }

    /**
     * Show game over results
     */
    showGameOverResults() {
        const scores = this.getScores();
        
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'two-player-results';
        resultsContainer.innerHTML = `
            <div class="results-content">
                <h2>Game Over!</h2>
                <div class="score-comparison">
                    <div class="player-score ${scores.winner === 'player1' ? 'winner' : ''}">
                        <span class="player-name">Player 1</span>
                        <span class="score">${scores.player1.toLocaleString()}</span>
                    </div>
                    <div class="vs">VS</div>
                    <div class="player-score ${scores.winner === 'player2' ? 'winner' : ''}">
                        <span class="player-name">Player 2</span>
                        <span class="score">${scores.player2.toLocaleString()}</span>
                    </div>
                </div>
                <div class="winner-announcement">
                    ${scores.winner === 'tie' ? 'It\'s a tie!' : `${scores.winner === 'player1' ? 'Player 1' : 'Player 2'} wins!`}
                </div>
                <div class="results-actions">
                    <button class="play-again-btn">Play Again</button>
                    <button class="exit-btn">Exit 2-Player</button>
                </div>
            </div>
        `;
        
        resultsContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;
        
        document.body.appendChild(resultsContainer);
        
        // Add event listeners
        const playAgainBtn = resultsContainer.querySelector('.play-again-btn');
        const exitBtn = resultsContainer.querySelector('.exit-btn');
        
        playAgainBtn.addEventListener('click', () => {
            resultsContainer.remove();
            this.startBothGames();
        });
        
        exitBtn.addEventListener('click', () => {
            resultsContainer.remove();
            this.disableTwoPlayerMode();
        });
    }

    /**
     * Destroy 2-player engine
     */
    destroy() {
        this.disableTwoPlayerMode();
    }
}

// Export singleton instance
export const twoPlayerEngine = new TwoPlayerEngine(); 