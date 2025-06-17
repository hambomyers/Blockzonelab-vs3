/**
 * core/game-engine.js - Professional game engine with smooth transitions
 *
 * UPDATED: Now uses the new ScoringSystem
 */

import * as Physics from './physics-pure.js';
import { ParticleSystem } from '../gameplay/particles.js';
import { CONSTANTS, PIECE_DEFINITIONS, calculateGravityDelay } from '../config.js';
import { ScoringSystem } from '../gameplay/scoring.js';

/**
 * Game states enum - Now with transition states
 */
const GameState = {
    MENU: 'MENU',
    MENU_TO_COUNTDOWN: 'MENU_TO_COUNTDOWN',
    COUNTDOWN: 'COUNTDOWN',
    COUNTDOWN_TO_PLAYING: 'COUNTDOWN_TO_PLAYING',
    PLAYING: 'PLAYING',
    PLAYING_TO_PAUSE: 'PLAYING_TO_PAUSE',
    PAUSED: 'PAUSED',
    PAUSE_TO_PLAYING: 'PAUSE_TO_PLAYING',
    CLEARING: 'CLEARING',
    GAME_OVER_SEQUENCE: 'GAME_OVER_SEQUENCE',
    GAME_OVER: 'GAME_OVER',
    GAME_OVER_TO_MENU: 'GAME_OVER_TO_MENU'
};

/**
 * Professional Game Engine
 */
export class GameEngine {
    constructor(config, audioSystem = null, blockchain = null) {
        this.config = config;
        this.audio = audioSystem;
        this.blockchain = blockchain;

        // Core systems
        this.particleSystem = new ParticleSystem();
        this.rng = new ProfessionalRNG(Date.now());
        this.scoring = new ScoringSystem(config);

        // State management
        this.state = this.createInitialState();

        // Performance
        this.frameNumber = 0;

        // Input buffering
        this.inputBuffer = {
            action: null,
            timestamp: 0,
            bufferWindow: 100
        };

        // Transition system
        this.transitions = {
            active: false,
            type: null,
            startTime: 0,
            duration: 0,
            data: {}
        };

        // Time dilation for effects
        this.timeDilation = 1.0;
    }

    /**
     * Create clean initial state
     */
    createInitialState() {
        return {
            // Core game state
            gameState: GameState.MENU,
            board: Array(CONSTANTS.BOARD.HEIGHT).fill().map(() =>
                Array(CONSTANTS.BOARD.WIDTH).fill(null)
            ),

            // Lock state tracking
            isLocking: false,

            // Active piece
            currentPiece: null,
            currentPosition: { x: 0, y: 0 },

            // Shadow state
            shadowPosition: { x: 0, y: 0 },
            shadowValid: false,
            lastShadowKey: '',
            shadowY: 0,

            // Piece management
            nextPiece: null,
            heldPiece: null,
            canHold: true,

            // Scoring - Now managed by ScoringSystem
            score: 0,
            lines: 0,
            level: 1,
            combo: 0,

            // Timing
            lockTimer: 0,
            clearTimer: 0,
            gravitySpeed: 1000,
            gravityAccumulator: 0,

            // Game flow
            clearingLines: [],
            startTime: null,

            // Progression
            unlockedPieces: [...CONSTANTS.PIECES.STARTING],
            lastUnlockScore: 0,
            statistics: {
                piecesPlaced: 0,
                maxCombo: 0,
                floatUsed: 0
            },

            // Transition states
            transitionTimer: 0,
            gameOverSequencePhase: 0,

            // Game mode
            gameMode: 'practice', // or 'competitive'
            pendingRewards: false
        };
    }

    /**
     * Start transition
     */
    startTransition(type, duration, data = {}) {
        this.transitions = {
            active: true,
            type: type,
            startTime: Date.now(),
            duration: duration,
            data: data
        };
    }

    /**
     * Get transition progress (0-1)
     */
    getTransitionProgress() {
        if (!this.transitions.active) return 1;

        const elapsed = Date.now() - this.transitions.startTime;
        return Math.min(1, elapsed / this.transitions.duration);
    }

    /**
     * Main update loop
     */
    update(deltaTime) {
        this.frameNumber++;

        // Apply time dilation
        const dilatedTime = deltaTime * this.timeDilation;

        // State-specific updates
        switch (this.state.gameState) {
            case GameState.MENU_TO_COUNTDOWN:
                this.updateMenuTransition(deltaTime);
                break;

            case GameState.COUNTDOWN:
                this.updateCountdown(dilatedTime);
                break;

            case GameState.COUNTDOWN_TO_PLAYING:
                this.updateCountdownTransition(deltaTime);
                break;

            case GameState.PLAYING:
                this.updatePlaying(dilatedTime);
                break;

            case GameState.PLAYING_TO_PAUSE:
                this.updatePauseTransition(deltaTime);
                break;

            case GameState.PAUSED:
                // Do nothing
                break;

            case GameState.PAUSE_TO_PLAYING:
                this.updateUnpauseTransition(deltaTime);
                break;

            case GameState.CLEARING:
                this.updateClearing(dilatedTime);
                break;

            case GameState.GAME_OVER_SEQUENCE:
                this.updateGameOverSequence(deltaTime);
                break;

            case GameState.GAME_OVER:
                // Do nothing
                break;

            case GameState.GAME_OVER_TO_MENU:
                this.updateReturnToMenuTransition(deltaTime);
                break;
        }

        // Always update particles
        this.particleSystem.update(dilatedTime);
    }

    /**
     * Menu to countdown transition
     */
    updateMenuTransition(deltaTime) {
        const progress = this.getTransitionProgress();

        if (progress >= 1) {
            this.state.gameState = GameState.COUNTDOWN;
            this.transitions.active = false;
        }
    }

    /**
     * Update countdown
     */
    updateCountdown(deltaTime) {
        this.state.countdownTimer -= deltaTime;

        if (this.state.countdownTimer <= 0) {
            this.state.gameState = GameState.COUNTDOWN_TO_PLAYING;
            this.startTransition('countdown-end', 300);
        }
    }

    /**
     * Countdown to playing transition
     */
    updateCountdownTransition(deltaTime) {
        const progress = this.getTransitionProgress();

        if (progress >= 1) {
            this.state.gameState = GameState.PLAYING;
            this.transitions.active = false;
            this.processBufferedInput();
        }
    }

    /**
     * Pause transition
     */
    updatePauseTransition(deltaTime) {
        const progress = this.getTransitionProgress();

        if (progress >= 1) {
            this.state.gameState = GameState.PAUSED;
            this.transitions.active = false;
        }
    }

    /**
     * Unpause transition
     */
    updateUnpauseTransition(deltaTime) {
        const progress = this.getTransitionProgress();

        if (progress >= 1) {
            this.state.gameState = GameState.PLAYING;
            this.transitions.active = false;
        }
    }

    /**
     * Update clearing with time dilation
     */
    updateClearing(deltaTime) {
        // MUCH FASTER time dilation for tournament play
        if (this.state.clearTimer > CONSTANTS.TIMING.CLEAR_ANIMATION_TIME * 0.9) {
            // First 10% - quick slow to 50% speed
            this.timeDilation = 0.5;
        } else if (this.state.clearTimer < CONSTANTS.TIMING.CLEAR_ANIMATION_TIME * 0.1) {
            // Last 10% - quick speed back up
            this.timeDilation = 0.5 + (0.5 * (1 - this.state.clearTimer / (CONSTANTS.TIMING.CLEAR_ANIMATION_TIME * 0.1)));
        } else {
            // Middle 80% - normal speed (no slowdown)
            this.timeDilation = 1.0;
        }

        this.state.clearTimer -= deltaTime;

        if (this.state.clearTimer <= 0) {
            this.timeDilation = 1.0;
            this.finishClearing();
        }
    }

    /**
     * Clean game over - directly trigger our GameOverSequence
     */
    updateGameOverSequence(deltaTime) {
        // Skip the old complex animation - go straight to our professional game over
        this.state.gameState = GameState.GAME_OVER;
        this.transitions.active = false;
        this.timeDilation = 1.0;

        // Update stats
        const highScore = this.config.get('game.highScore') || 0;
        const isNewHighScore = this.state.score > highScore;
        if (isNewHighScore) {
            this.config.set('game.highScore', this.state.score);
        }

        this.config.incrementStat('game.gamesPlayed');        // Trigger professional state transition instead of direct sequence
        setTimeout(() => {
            // Dispatch custom event for state manager to handle
            const gameOverEvent = new CustomEvent('gameOver', {
                detail: {
                    score: this.state.score,
                    level: this.state.level,
                    lines: this.state.lines,
                    time: Date.now() - this.state.gameStartTime,
                    isNewHighScore: isNewHighScore
                }
            });
            document.dispatchEvent(gameOverEvent);
        }, 500); // Brief pause for the game to settle

        // Update additional stats
        this.config.incrementStat('game.totalScore', this.state.score);
        this.config.incrementStat('game.totalLines', this.state.lines);

        // Submit score to leaderboard system
        this.submitScoreToLeaderboard();
    }

    /**
     * Return to menu transition
     */
    updateReturnToMenuTransition(deltaTime) {
        const progress = this.getTransitionProgress();

        if (progress >= 1) {
            this.state = this.createInitialState();
            this.particleSystem.clear();
            this.transitions.active = false;
        }
    }

    /**
     * Handle input action
     */
    handleInput(action) {
        // Track all inputs for scoring metrics
        if (this.state.gameState === GameState.PLAYING) {
            this.scoring.inputMade();
        }

        // Check if we should buffer the input
        if (this.shouldBufferInput(action)) {
            this.inputBuffer.action = action;
            this.inputBuffer.timestamp = Date.now();
            return;
        }

        // Process the action
        this.processInputAction(action);
    }

    /**
     * Check if input should be buffered
     */
    shouldBufferInput(action) {
        // Buffer during these states
        const bufferStates = [
            GameState.CLEARING,
            GameState.COUNTDOWN,
            GameState.MENU_TO_COUNTDOWN,
            GameState.COUNTDOWN_TO_PLAYING
        ];
        const isBufferState = bufferStates.includes(this.state.gameState);

        // Buffer during late lock phase
        const isLateLock = this.state.gameState === GameState.PLAYING &&
                          this.state.isLocking &&
                          this.state.lockTimer < 150;

        // These actions can be buffered
        const bufferableActions = ['MOVE', 'ROTATE', 'HARD_DROP', 'HOLD', 'UP_PRESSED'];
        const isBufferable = bufferableActions.includes(action.type);

        return (isBufferState || isLateLock) && isBufferable;
    }

    /**
     * Process buffered input if any
     */
    processBufferedInput() {
        if (!this.inputBuffer.action) return;

        const now = Date.now();
        const age = now - this.inputBuffer.timestamp;

        // Check if buffer is still valid
        if (age > this.inputBuffer.bufferWindow) {
            this.inputBuffer.action = null;
            return;
        }

        // Try to execute buffered action
        if (this.state.gameState === GameState.PLAYING) {
            this.processInputAction(this.inputBuffer.action);
            this.inputBuffer.action = null;
        }
    }

    /**
     * Actually process an input action
     */
    processInputAction(action) {
        switch (action.type) {
            case 'START_GAME':
                if (this.state.gameState === GameState.MENU) {
                    this.startGame();
                }
                break;

            case 'MOVE':
                if (this.state.gameState === GameState.PLAYING) {
                    this.movePiece(action.dx, action.dy);
                }
                break;

            case 'ROTATE':
                if (this.state.gameState === GameState.PLAYING) {
                    this.rotatePiece(action.direction);
                }
                break;

            case 'HARD_DROP':
                if (this.state.gameState === GameState.PLAYING) {
                    this.hardDrop();
                }
                break;

            case 'HOLD':
                if (this.state.gameState === GameState.PLAYING) {
                    this.holdPiece();
                }
                break;

            case 'PAUSE':
                this.togglePause();
                break;

            case 'UP_PRESSED':
                if (this.state.gameState === GameState.PLAYING) {
                    this.handleUpPress();
                }
                break;

            case 'RETURN_TO_MENU':
                if (this.state.gameState === GameState.GAME_OVER) {
                    this.state.gameState = GameState.GAME_OVER_TO_MENU;
                    this.startTransition('fade-out', 300);
                }
                break;
        }
    }

    /**
     * Start new game
     */
    startGame(mode = 'practice') {
        this.state.gameMode = mode;
        this.state.rewardEligible = mode === 'competitive';

        if (this.blockchain) {
            this.blockchain.trackGameStart({
                mode: mode,
                entryFee: mode === 'competitive' ? 0.25 : 0,
                timestamp: Date.now()
            });
        }

        this.state = this.createInitialState();
        this.state.gameState = GameState.MENU_TO_COUNTDOWN;
        this.state.countdownTimer = 3000;
        this.state.startTime = Date.now();

        // Start menu transition
        this.startTransition('menu-fade', 300);

        // Clear input buffer
        this.inputBuffer.action = null;

        // Pre-generate pieces
        this.state.currentPiece = this.generatePiece();
        this.state.nextPiece = this.generatePiece();
        this.state.currentPosition = {
            x: this.state.currentPiece.spawn.x,
            y: this.state.currentPiece.spawn.y
        };

        // Initialize blockchain session
        if (this.blockchain) {
            this.blockchain.startGameSession({
                seed: this.rng.seed
            });
        }

        this.particleSystem.clear();

        // Start scoring system
        this.scoring.startGame();
    }

    /**
     * Main game update
     */
    updatePlaying(deltaTime) {
        if (!this.state.currentPiece) {
            this.gameOver();
            return;
        }

        // Update spawn fade effect
        if (this.state.isSpawning) {
            this.state.spawnTimer += deltaTime;
            if (this.state.spawnTimer >= CONSTANTS.TIMING.SPAWN_FADE_TIME) {
                this.state.isSpawning = false;
                this.state.spawnTimer = 0;
            }
        }

        // Update gravity
        this.state.gravitySpeed = calculateGravityDelay(
            this.state.startTime,
            this.state.score,
            this.state.level
        );

        // Update shadow position
        this.updateShadow();

        // Only accumulate gravity if not at shadow position
        if (this.state.currentPosition.y < this.state.shadowPosition.y) {
            // Accumulate gravity for smooth movement
            this.state.gravityAccumulator += deltaTime;

            // Check if piece should drop
            if (this.state.gravityAccumulator >= this.state.gravitySpeed) {
                this.state.gravityAccumulator -= this.state.gravitySpeed;

                // Try to move down
                if (!this.movePiece(0, 1)) {
                    this.state.gravityAccumulator = 0;
                }
            }
        } else if (!this.state.isLocking) {
            // At shadow position but not locking yet
            this.startLocking();
        }

        // Update lock timer if locking
        if (this.state.lockTimer > 0) {
            this.updateLocking(deltaTime);
        }
    }

    /**
     * Update shadow
     */
    updateShadow() {
        if (!this.state.currentPiece) return;

        // Only recalculate if something changed
        const stateKey = `${this.state.currentPosition.x},${this.state.currentPosition.y},${this.state.currentPiece.rotation}`;
        if (this.state.lastShadowKey === stateKey && this.state.shadowValid) {
            return;
        }

        // Calculate shadow position
        const shadowX = this.state.currentPosition.x;
        let shadowY = this.state.currentPosition.y;

        // Use stable shadow calculation
        const tempPiece = {
            ...this.state.currentPiece,
            gridX: shadowX,
            gridY: shadowY
        };

        shadowY = Physics.calculateStableShadow(
            this.state.board,
            tempPiece,
            shadowX,
            this.state.currentPosition.y
        );

        // Update state
        this.state.shadowPosition = { x: shadowX, y: shadowY };
        this.state.shadowValid = true;
        this.state.lastShadowKey = stateKey;

        // For backwards compatibility
        this.state.shadowY = shadowY;
    }

    /**
     * Move piece
     */
    movePiece(dx, dy) {
        if (!this.state.currentPiece) return false;

        const newX = this.state.currentPosition.x + dx;
        const newY = this.state.currentPosition.y + dy;

        const tempPiece = {
            ...this.state.currentPiece,
            gridX: newX,
            gridY: newY
        };

        if (Physics.canPieceFitAt(this.state.board, tempPiece, newX, newY)) {
            this.state.currentPosition.x = newX;
            this.state.currentPosition.y = newY;

            // Invalidate shadow when piece moves
            this.state.shadowValid = false;

            // Reset drop timer on vertical movement
            if (dy > 0) {
                this.state.gravityAccumulator = 0;
                // Use new scoring system
                const points = this.scoring.softDrop(dy);
                this.state.score = this.scoring.score;
            }

            // Reset lock timer if we can still fall
            if (this.state.lockTimer > 0) {
                const canFall = Physics.canPieceFitAt(
                    this.state.board,
                    tempPiece,
                    newX,
                    newY + 1
                );

                if (canFall) {
                    this.state.lockTimer = 0;
                    this.state.isLocking = false;
                }
            }

            // Audio feedback - only for horizontal moves
            if (this.audio && dx !== 0) {
                this.audio.playSound('move');
            }
            // Remove sound for vertical movement - let the land sound handle it

            return true;
        }

        // Special FLOAT diagonal movement
        if (this.state.currentPiece.type === 'FLOAT' && dx !== 0 && dy === 0) {
            tempPiece.gridY += 1;

            if (Physics.canPieceFitAt(this.state.board, tempPiece, newX, newY + 1)) {
                this.state.currentPosition.x = newX;
                this.state.currentPosition.y = newY + 1;

                // Invalidate shadow
                this.state.shadowValid = false;

                if (this.audio) {
                    this.audio.playSound('move');
                }

                return true;
            }
        }

        return false;
    }

    /**
     * Handle up key - FLOAT or rotate
     */
    handleUpPress() {
        if (this.state.currentPiece.type === 'FLOAT' &&
            (this.state.currentPiece.upMovesUsed || 0) < CONSTANTS.PIECES.FLOAT_MAX_UP_MOVES) {

            if (this.movePiece(0, -1)) {
                this.state.currentPiece.upMovesUsed =
                    (this.state.currentPiece.upMovesUsed || 0) + 1;
                this.state.statistics.floatUsed++;
            } else if (this.audio) {
                this.audio.playSound('invalid');
            }
        } else {
            this.rotatePiece(1);
        }
    }

    /**
     * Rotate piece
     */
    rotatePiece(direction) {
        if (!this.state.currentPiece) return false;

        const currentPiece = {
            ...this.state.currentPiece,
            gridX: this.state.currentPosition.x,
            gridY: this.state.currentPosition.y
        };

        const result = Physics.tryRotation(this.state.board, currentPiece, direction);

        if (result.success) {
            this.state.currentPiece = {
                ...result.piece,
                upMovesUsed: this.state.currentPiece.upMovesUsed
            };
            this.state.currentPosition.x = result.piece.gridX;
            this.state.currentPosition.y = result.piece.gridY;

            // Invalidate shadow when piece rotates
            this.state.shadowValid = false;

            if (this.audio) {
                this.audio.playSound('rotate');
            }

            // Reset lock timer if needed
            if (this.state.lockTimer > 0) {
                this.state.lockTimer = 0;
                this.state.isLocking = false;
            }

            return true;
        }

        if (this.audio) {
            this.audio.playSound('invalid');
        }

        return false;
    }

    /**
     * Hard drop
     */
    hardDrop() {
        if (!this.state.currentPiece) return;

        const dropDistance = this.state.shadowPosition.y - this.state.currentPosition.y;

        if (dropDistance > 0) {
            this.state.currentPosition.y = this.state.shadowPosition.y;
            const points = this.scoring.hardDrop(dropDistance);
            this.state.score = this.scoring.score;
        }

        // Play the land sound for hard drop
        if (this.audio && this.state.currentPosition.y > this.state.currentPiece.spawn.y) {
            this.audio.playSound('land');
        }

        // Immediately lock the piece
        this.lockPiece();
    }

    /**
     * Start locking
     */
    startLocking() {
        // Only play sound if we've fallen at least one row
        if (this.audio && this.state.currentPosition.y > this.state.currentPiece.spawn.y) {
            this.audio.playSound('land');
        }

        // Use centralized lock delay logic
        const lockDelay = CONSTANTS.TIMING.getLockDelay(
            this.state.currentPiece.type,
            this.state.currentPosition.y
        );

        this.state.lockTimer = lockDelay;
        this.state.isLocking = true;
    }

    /**
     * Update locking
     */
    updateLocking(deltaTime) {
        this.state.lockTimer -= deltaTime;

        if (this.state.lockTimer <= 0) {
            this.lockPiece();
        }
    }

    /**
     * Lock piece
     */
    lockPiece() {
        if (!this.state.currentPiece) return;

        const finalPiece = {
            ...this.state.currentPiece,
            gridX: this.state.currentPosition.x,
            gridY: this.state.currentPosition.y
        };

        // Record the action before placing
        if (this.blockchain) {
            this.blockchain.recordAction({
                type: 'lock',
                piece: this.state.currentPiece.type,
                x: this.state.currentPosition.x,
                y: this.state.currentPosition.y
            }, this.frameNumber);
        }

        // Always place piece on board first
        this.state.board = Physics.placePiece(this.state.board, finalPiece);

        // Trigger edge pulse if piece is near edge
        if (window.neonDrop?.game?.renderer?.addEdgePulse) {
            window.neonDrop.game.renderer.addEdgePulse(finalPiece);
        }

        // Update stats
        this.state.statistics.piecesPlaced++;
        this.scoring.piecePlaced();

        // Check if piece is above board (topped out)
        let aboveBoard = false;
        for (let y = 0; y < finalPiece.shape.length; y++) {
            for (let x = 0; x < finalPiece.shape[y].length; x++) {
                if (finalPiece.shape[y][x] && finalPiece.gridY + y < 0) {
                    aboveBoard = true;
                    break;
                }
            }
            if (aboveBoard) break;
        }

        // If topped out, trigger game over
        if (aboveBoard) {
            this.gameOver();
            return;
        }

        // Check for cleared lines
        const clearedLines = Physics.findClearedLines(this.state.board);

        if (clearedLines.length > 0) {
            this.startClearing(clearedLines);
        } else {
            // NO LINES CLEARED - PIECE JUST LOCKED
            // This is where combo should break!
            this.spawnNextPiece();

            // Update combo state from scoring system
            this.scoring.lineClear(0, this.state.board);
            const scoringState = this.scoring.getState();
            this.state.combo = scoringState.combo; // Will be 0

            // Play lock sound only if the piece was visible when it locked
            // This prevents the staccato pop from pieces locking at the top
            if (this.audio && this.state.currentPosition.y >= 0) {
                this.audio.playSound('lock');
            }
        }

        // Reset timers
        this.state.lockTimer = 0;
        this.state.gravityAccumulator = 0;
        this.state.isLocking = false;
    }

    /**
     * Start clearing
     */
    startClearing(lines) {
        this.state.gameState = GameState.CLEARING;
        this.state.clearingLines = lines;
        this.state.clearTimer = CONSTANTS.TIMING.CLEAR_ANIMATION_TIME;

        if (this.audio) {
            this.audio.playSound('clear', { lines: lines.length });
        }

        if (this.config.get('graphics.particles')) {
            this.particleSystem.createLineExplosion(lines, this.state.board);
        }
    }

    /**
     * Finish clearing
     */
    finishClearing() {
        const linesCleared = this.state.clearingLines.length;

        // Remove lines
        this.state.board = Physics.removeClearedLines(
            this.state.board,
            this.state.clearingLines
        );

        // Use new scoring system
        const scoreResult = this.scoring.lineClear(linesCleared, this.state.board);

        // Update state from scoring system
        const scoringState = this.scoring.getState();
        this.state.score = scoringState.score;
        this.state.lines = scoringState.lines;
        this.state.level = scoringState.level;
        this.state.combo = scoringState.combo;

        // Track max combo
        this.state.statistics.maxCombo = Math.max(
            this.state.statistics.maxCombo,
            this.state.combo
        );
          // Show special message if any
        if (scoreResult.message) {
            // Add to UI notifications when system is ready
        }

        // Check level up
        if (scoringState.level > this.state.level) {
            if (this.audio) {
                this.audio.playSound('levelup');
            }
        }

        // Check unlocks
        this.checkUnlocks();

        // Clear state
        this.state.clearingLines = [];
        this.state.gameState = GameState.PLAYING;

        // Spawn next piece
        this.spawnNextPiece();

        // Process any buffered input after clearing
        this.processBufferedInput();
    }

    /**
     * Spawn next piece
     */
    spawnNextPiece() {
        this.state.currentPiece = this.state.nextPiece;
        this.state.nextPiece = this.generatePiece();
        this.state.currentPosition = {
            x: this.state.currentPiece.spawn.x,
            y: this.state.currentPiece.spawn.y
        };
        this.state.canHold = true;

        // Initialize spawn fade effect
        this.state.spawnTimer = 0;
        this.state.isSpawning = true;
        this.state.pieceSpawnTime = Date.now(); // Track when piece spawned

        // Mark shadow as invalid for new piece
        this.state.shadowValid = false;

        // Check if piece can spawn
        const tempPiece = {
            ...this.state.currentPiece,
            gridX: this.state.currentPosition.x,
            gridY: this.state.currentPosition.y
        };

        if (!Physics.canPieceFitAt(
            this.state.board,
            tempPiece,
            this.state.currentPosition.x,
            this.state.currentPosition.y
        )) {
            this.gameOver();
        }
    }

    /**
     * Hold piece
     */
    holdPiece() {
        if (!this.state.currentPiece || !this.state.canHold) {
            if (this.audio) {
                this.audio.playSound('invalid');
            }
            return;
        }

        const held = this.state.currentPiece;

        if (this.state.heldPiece) {
            this.state.currentPiece = this.state.heldPiece;
        } else {
            this.state.currentPiece = this.state.nextPiece;
            this.state.nextPiece = this.generatePiece();
        }

        this.state.heldPiece = this.createPiece(held.type);
        this.state.currentPosition = {
            x: this.state.currentPiece.spawn.x,
            y: this.state.currentPiece.spawn.y
        };
        this.state.canHold = false;

        // Invalidate shadow for new piece
        this.state.shadowValid = false;

        // Reset lock state
        this.state.lockTimer = 0;
        this.state.isLocking = false;
        this.state.gravityAccumulator = 0;

        if (this.audio) {
            this.audio.playSound('hold');
        }
    }

    /**
     * Generate piece
     */
    generatePiece() {
        const available = this.state.unlockedPieces;

        // FLOAT chance
        if (available.includes('FLOAT') && this.rng.random() < CONSTANTS.PIECES.FLOAT_CHANCE) {
            return this.createPiece('FLOAT');
        }

        // Weighted selection
        const weights = available.map(type => {
            const isSpecial = CONSTANTS.PIECES.SPECIAL.includes(type);
            return isSpecial ? CONSTANTS.PIECES.SPECIAL_WEIGHT : 1.0;
        });

        const type = this.rng.weightedChoice(available, weights);
        return this.createPiece(type);
    }

    /**
     * Create piece
     */
    createPiece(type) {
        const def = PIECE_DEFINITIONS[type];
        if (!def) throw new Error(`Unknown piece type: ${type}`);

        return {
            type,
            shape: def.shape,
            color: def.color,
            spawn: def.spawn,
            rotation: 0,
            upMovesUsed: 0,
            variant: Math.floor(this.rng.random() * 100)
        };
    }

    /**
     * Check unlocks
     */
    checkUnlocks() {
        const thresholds = CONSTANTS.PIECES.UNLOCK_THRESHOLDS;

        for (const [piece, threshold] of Object.entries(thresholds)) {
            if (!this.state.unlockedPieces.includes(piece) &&
                this.state.score >= threshold) {

                this.state.unlockedPieces.push(piece);
                this.state.lastUnlockScore = threshold;

                if (this.audio) {
                    this.audio.playSound('levelup');
                }

                break;
            }
        }
    }

    /**
     * Toggle pause
     */
    togglePause() {
        if (this.state.gameState === GameState.PLAYING) {
            this.state.gameState = GameState.PLAYING_TO_PAUSE;
            this.startTransition('pause', 200);

            if (this.audio) {
                this.audio.playSound('pause');
            }
        } else if (this.state.gameState === GameState.PAUSED) {
            this.state.gameState = GameState.PAUSE_TO_PLAYING;
            this.startTransition('unpause', 200);

            if (this.audio) {
                this.audio.playSound('pause');
            }
        }
    }

    /**
     * Game over
     */
    async gameOver() { // Add 'async' here
        // Prevent multiple game overs
        if (this.state.gameState === GameState.GAME_OVER_SEQUENCE ||
            this.state.gameState === GameState.GAME_OVER) return;

        this.state.gameState = GameState.GAME_OVER_SEQUENCE;
        this.state.gameOverSequencePhase = 0;
        this.startTransition('game-over-slow', 1000);

        if (this.audio) {
            this.audio.playSound('gameover');
        }        // Get final score proof from scoring system
        const scoreProof = this.scoring.generateProof();

        // Generate and submit proof if blockchain is connected
        if (this.blockchain && this.blockchain.isTracking()) {
            const proof = this.blockchain.generateProof(this.state);
            proof.scoring = scoreProof; // Add scoring proof

            // Optional: Auto-submit high scores
            if (this.state.score > 1000) { // Minimum score threshold
                this.blockchain.submitScore(this.state.score, proof)
                    .then(receipt => {
                        // Score submitted to blockchain successfully
                    })
                    .catch(err => {
                        // Score submission failed silently
                    });
            }
        }        // Trigger professional state transition instead of direct game over sequence
        setTimeout(() => {
            // Dispatch custom event for state manager to handle
            const gameOverEvent = new CustomEvent('gameOver', {
                detail: {
                    score: this.state.score,
                    level: this.state.level,
                    lines: this.state.linesCleared,
                    time: this.state.gameTime
                }
            });
            document.dispatchEvent(gameOverEvent);
        }, 1500);
    }

    /**
     * Submit score to leaderboard system
     */
    async submitScoreToLeaderboard() {
        if (!window.leaderboard) return;

        try {
            // Get final score proof from scoring system
            const scoreProof = this.scoring.generateProof();
            
            // Also store locally as fallback
            this.storeScoreLocally(scoreProof.score);
            
            // Submit to leaderboard system
            const result = await window.leaderboard.submitScore(scoreProof);
            
            if (result.success) {
                // Score submitted successfully - store rank and percentile info if needed
                this.state.lastSubmissionResult = result;
            } else {
                // Score submission failed silently
            }
        } catch (error) {
            // Error storing score locally - fail silently
        }
    }

    /**
     * Store score locally as fallback
     */
    storeScoreLocally(score) {
        try {
            const playerName = localStorage.getItem('neon_drop_username') || 'Anonymous';
            const scoreEntry = {
                score: score,
                name: playerName,
                timestamp: Date.now()
            };

            // Get existing scores
            const stored = localStorage.getItem('neondrop5-scores');
            let scores = [];
            if (stored) {
                scores = JSON.parse(stored);
            }

            // Add new score
            scores.push(scoreEntry);
            
            // Keep only top 100 scores
            scores.sort((a, b) => b.score - a.score);
            scores = scores.slice(0, 100);

            // Store back
            localStorage.setItem('neondrop5-scores', JSON.stringify(scores));
        } catch (error) {
            // Error storing score locally - fail silently
        }
    }

    /**
     * Get state for rendering
     */
    getState() {
        // Determine phase for renderer compatibility
        let phase = this.state.gameState;

        // Add locking sub-state
        if (phase === GameState.PLAYING && this.state.isLocking) {
            phase = 'LOCKING';
        }

        // Map internal state to expected format
        return {
            phase: phase,
            board: this.state.board,

            current: this.state.currentPiece ? {
                ...this.state.currentPiece,
                gridX: this.state.currentPosition.x,
                gridY: this.state.currentPosition.y,
                rotation: this.state.currentPiece.rotation || 0
            } : null,

            shadowY: this.state.shadowPosition.y,
            next: this.state.nextPiece,
            hold: this.state.heldPiece,
            canHold: this.state.canHold,

            score: this.state.score,
            lines: this.state.lines,
            level: this.state.level,
            combo: this.state.combo,

            countdownTimer: this.state.countdownTimer || 0,
            lockTimer: this.state.lockTimer,
            clearingLines: this.state.clearingLines,

            startTime: this.state.startTime,
            frameCount: this.frameNumber,

            maxCombo: this.state.statistics.maxCombo,
            pieces: this.state.statistics.piecesPlaced,

            isNewHighScore: this.state.score > (this.config.get('game.highScore') || 0),
            displayHighScore: Math.max(
                this.state.score,
                this.config.get('game.highScore') || 0
            ),

            lastUnlockScore: this.state.lastUnlockScore || 0,
            unlockedPieces: this.state.unlockedPieces,

            // Timing info for smooth rendering
            gravityAccumulator: this.state.gravityAccumulator,
            currentGravityDelay: this.state.gravitySpeed,

            // Locking state
            isLocking: this.state.isLocking,

            // Input buffer state
            hasBufferedInput: this.inputBuffer.action !== null,

            // Transition info
            transition: this.transitions.active ? {
                type: this.transitions.type,
                progress: this.getTransitionProgress(),
                data: this.transitions.data
            } : null,

            // Time dilation
            timeDilation: this.timeDilation,

            // Performance metrics from scoring system
            metrics: this.scoring.getPerformanceMetrics()
        };
    }

    /**
     * Get particles
     */
    getParticles() {
        return this.particleSystem.getParticles();
    }

    /**
     * Return to menu
     */
    returnToMenu() {
        this.state = this.createInitialState();
        this.particleSystem.clear();
    }

    /**
     * Tick for main loop
     */
    tick(deltaTime) {
        this.update(deltaTime);
    }
}

/**
 * Professional RNG with better distribution
 */
class ProfessionalRNG {
    constructor(seed) {
        this.seed = seed;
        this.state = seed;
    }

    random() {
        // Xorshift for better distribution
        this.state ^= this.state << 13;
        this.state ^= this.state >> 17;
        this.state ^= this.state << 5;
        return (this.state >>> 0) / 4294967296;
    }

    weightedChoice(choices, weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let r = this.random() * total;

        for (let i = 0; i < choices.length; i++) {
            r -= weights[i];
            if (r <= 0) return choices[i];
        }

        return choices[choices.length - 1];
    }
}




