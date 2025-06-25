/**
 * TwoPlayerEngine - BlockZone Lab
 * Manages dual game instances for local 2-player mode
 */

import { GameEngine } from './game-engine.js';
import { Renderer } from './renderer.js';
import { InputController } from './input-controller.js';

export class TwoPlayerEngine {
    constructor() {
        this.isEnabled = false;
        this.player1 = null;
        this.player2 = null;
        this.renderer = null;
        this.inputController = null;
        this.gameContainer = null;
        this.singlePlayerContainer = null;
        
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
        console.log('🎮 Enabling 2-player mode...');
        
        // Hide single player container
        if (this.singlePlayerContainer) {
            this.singlePlayerContainer.style.display = 'none';
        }
        
        // Hide any existing game elements
        const existingGame = document.getElementById('game');
        const existingBg = document.getElementById('bg');
        if (existingGame) existingGame.style.display = 'none';
        if (existingBg) existingBg.style.display = 'none';
        
        // Hide guide panels and UI elements for clean 2-player experience
        this.hideUIElements();
        
        // Create 2-player layout
        this.createTwoPlayerLayout();
        
        // Initialize both game instances
        this.initializeGameInstances();
        
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
        this.showUIElements();
        
        // Remove 2-player layout
        this.removeTwoPlayerLayout();
    }

    /**
     * Hide UI elements for clean 2-player experience
     */
    hideUIElements() {
        // Hide guide panel
        const guidePanel = document.querySelector('.guide-panel');
        if (guidePanel) guidePanel.style.display = 'none';
        
        // Hide stats panel
        const statsPanel = document.querySelector('.stats-panel');
        if (statsPanel) statsPanel.style.display = 'none';
        
        // Hide mobile guide button
        const guideButton = document.querySelector('.guide-mobile-button');
        if (guideButton) guideButton.style.display = 'none';
        
        // Hide 2-player toggle button
        const toggleContainer = document.querySelector('.two-player-toggle-container');
        if (toggleContainer) toggleContainer.style.display = 'none';
    }

    /**
     * Show UI elements when returning to single player
     */
    showUIElements() {
        // Show guide panel
        const guidePanel = document.querySelector('.guide-panel');
        if (guidePanel) guidePanel.style.display = 'flex';
        
        // Show stats panel
        const statsPanel = document.querySelector('.stats-panel');
        if (statsPanel) statsPanel.style.display = 'flex';
        
        // Show mobile guide button
        const guideButton = document.querySelector('.guide-mobile-button');
        if (guideButton) guideButton.style.display = 'block';
        
        // Show 2-player toggle button
        const toggleContainer = document.querySelector('.two-player-toggle-container');
        if (toggleContainer) toggleContainer.style.display = 'flex';
    }

    /**
     * Create 2-player layout
     */
    createTwoPlayerLayout() {
        // Create container for 2-player mode
        this.twoPlayerContainer = document.createElement('div');
        this.twoPlayerContainer.className = 'two-player-container';
        this.twoPlayerContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            background: #000;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        // Create player 1 container (left side)
        this.player1Container = document.createElement('div');
        this.player1Container.className = 'player-container player-1';
        this.player1Container.style.cssText = `
            flex: 1;
            position: relative;
            border-right: 2px solid #00d4ff;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 10px;
        `;
        
        // Create player 2 container (right side)
        this.player2Container = document.createElement('div');
        this.player2Container.className = 'player-container player-2';
        this.player2Container.style.cssText = `
            flex: 1;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 10px;
        `;
        
        // Add player labels
        this.addPlayerLabels();
        
        // Assemble layout
        this.twoPlayerContainer.appendChild(this.player1Container);
        this.twoPlayerContainer.appendChild(this.player2Container);
        
        // Add to game container
        if (this.gameContainer) {
            this.gameContainer.appendChild(this.twoPlayerContainer);
        }
    }

    /**
     * Add player labels
     */
    addPlayerLabels() {
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
            top: 10px;
            left: 10px;
            z-index: 100;
            background: rgba(0, 212, 255, 0.2);
            border: 1px solid #00d4ff;
            border-radius: 6px;
            padding: 8px 12px;
            color: white;
            font-size: 12px;
            font-weight: 600;
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
            top: 10px;
            right: 10px;
            z-index: 100;
            background: rgba(255, 107, 107, 0.2);
            border: 1px solid #ff6b6b;
            border-radius: 6px;
            padding: 8px 12px;
            color: white;
            font-size: 12px;
            font-weight: 600;
        `;
        
        // Exit button
        const exitButton = document.createElement('button');
        exitButton.className = 'exit-2player-btn';
        exitButton.innerHTML = 'Exit 2-Player';
        exitButton.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            background: rgba(255, 107, 107, 0.2);
            border: 1px solid #ff6b6b;
            border-radius: 6px;
            padding: 8px 16px;
            color: white;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        exitButton.addEventListener('click', () => {
            this.disableTwoPlayerMode();
        });
        
        this.player1Container.appendChild(player1Label);
        this.player2Container.appendChild(player2Label);
        this.twoPlayerContainer.appendChild(exitButton);
    }

    /**
     * Initialize game instances
     */
    initializeGameInstances() {
        // Create player 1 game
        this.player1 = this.createGameInstance(this.player1Container, 'player1');
        
        // Create player 2 game
        this.player2 = this.createGameInstance(this.player2Container, 'player2');
    }

    /**
     * Create a game instance
     */
    createGameInstance(container, playerId) {
        // Create canvas elements
        const bgCanvas = document.createElement('canvas');
        const gameCanvas = document.createElement('canvas');
        
        bgCanvas.id = `bg-${playerId}`;
        gameCanvas.id = `game-${playerId}`;
        
        // Calculate 75% size for 2-player mode
        const containerWidth = container.clientWidth - 20; // Account for padding
        const containerHeight = container.clientHeight - 60; // Account for label and padding
        const gameSize = Math.min(containerWidth, containerHeight) * 0.75;
        
        // Set canvas sizes
        bgCanvas.width = gameSize;
        bgCanvas.height = gameSize;
        gameCanvas.width = gameSize;
        gameCanvas.height = gameSize;
        
        // Set canvas styles
        [bgCanvas, gameCanvas].forEach(canvas => {
            canvas.style.cssText = `
                width: ${gameSize}px;
                height: ${gameSize}px;
                display: block;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                image-rendering: pixelated;
                image-rendering: -moz-crisp-edges;
                image-rendering: crisp-edges;
            `;
        });
        
        // Add to container
        container.appendChild(bgCanvas);
        container.appendChild(gameCanvas);
        
        // Create game engine with proper config
        const config = {
            get: (key) => {
                const defaults = {
                    'game.tickRate': 16.67,
                    'graphics.starfield': false,
                    'audio.enabled': true
                };
                return defaults[key] || null;
            },
            load: () => Promise.resolve()
        };
        
        const gameEngine = new GameEngine(config, null, null);
        gameEngine.playerId = playerId;
        
        // Create renderer with custom dimensions
        const renderer = new Renderer(gameCanvas, bgCanvas, config, {
            canvasWidth: gameSize,
            canvasHeight: gameSize,
            blockSize: Math.floor(gameSize / 20) // Scale block size to canvas
        });
        
        // Create input controller with player-specific controls
        const inputController = new InputController();
        this.setupPlayerControls(inputController, playerId);
        
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
     * Setup player-specific controls
     */
    setupPlayerControls(inputController, playerId) {
        if (playerId === 'player1') {
            // Player 1: WASD + Space
            inputController.setKeyMap({
                left: ['KeyA', 'ArrowLeft'],
                right: ['KeyD', 'ArrowRight'],
                down: ['KeyS', 'ArrowDown'],
                up: ['KeyW'],
                rotate: ['KeyW'],
                hardDrop: ['Space'],
                hold: ['KeyC', 'ShiftLeft'],
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
            z-index: 1000;
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
        this.setupEventListeners = null;
    }
}

// Export singleton instance
export const twoPlayerEngine = new TwoPlayerEngine(); 