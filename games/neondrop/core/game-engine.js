/**
 * core/game-engine.js - FIXED: Proper spawn zone and game over sequence
 * 
 * Key Fixes:
 * 1. Fixed canSpawnPiece() to properly handle negative Y spawn positions
 * 2. Improved game over sequence integration with SimpleGameOver UI
 * 3. Reduced excessive logging
 * 4. Fixed death piece blinking logic
 */

import * as Physics from './physics-pure.js';
import { ParticleSystem } from '../gameplay/particles.js';
import { CONSTANTS, calculateGravityDelay } from '../config.js';
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
 * Professional Game Engine - FIXED VERSION
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

        // Deterministic replay system
        this.inputLog = [];
        this.gameLog = {
            seed: this.rng.seed,
            startTime: Date.now(),
            inputs: [],
            stateSnapshots: [],
            finalScore: 0,
            finalState: null,
            frameStates: [],
            stateChanges: []
        };

        // 7-Bag Randomizer
        this.bagRandomizer = {
            currentBag: [],
            nextBag: [],
            bagHistory: [],
            bagCount: 0
        };

        // Previous game state for audit trail
        this.previousGameState = null;

        // FIXED: Game over state tracking
        this.gameOverTriggered = false;
        
        // NEW: Game over lockout system
        this.gameOverLockout = {
            active: false,
            startTime: 0,
            duration: 3000, // 3 seconds minimum lockout
            canStartNewGame: false
        };
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
                floatUsed: 0,
                linesCleared: 0,
                tetrises: 0,
                playTime: 0
            },

            // Transition states
            transitionTimer: 0,
            gameOverSequencePhase: 0,

            // FIXED: Game over tracking
            gameOverStartTime: null,
            deathPieceBlinkStart: null,

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

        // REDUCED: Log frame for deterministic replay only every 5 seconds instead of every second
        if (this.frameNumber % 300 === 0) { 
            this.logFrameState();
        }
        
        // Apply time dilation
        const dilatedTime = deltaTime * this.timeDilation;

        // Update based on game state
        switch (this.state.gameState) {
            case GameState.MENU:
                break;

            case GameState.MENU_TO_COUNTDOWN:
                this.updateMenuTransition(dilatedTime);
                break;

            case GameState.COUNTDOWN:
                this.updateCountdown(dilatedTime);
                break;

            case GameState.COUNTDOWN_TO_PLAYING:
                this.updateCountdownTransition(dilatedTime);
                break;

            case GameState.PLAYING:
                // CRITICAL: Extra check to prevent race condition
                if (!this.gameOverTriggered) {
                    this.updatePlaying(dilatedTime);
                }
                break;

            case GameState.PLAYING_TO_PAUSE:
                this.updatePauseTransition(dilatedTime);
                break;

            case GameState.PAUSED:
                break;

            case GameState.PAUSE_TO_PLAYING:
                this.updateUnpauseTransition(dilatedTime);
                break;

            case GameState.CLEARING:
                // CRITICAL: Extra check to prevent race condition
                if (!this.gameOverTriggered) {
                    this.updateClearing(dilatedTime);
                }
                break;

            case GameState.GAME_OVER_SEQUENCE:
                this.updateGameOverSequence(dilatedTime);
                break;

            case GameState.GAME_OVER:
                break;

            case GameState.GAME_OVER_TO_MENU:
                this.updateReturnToMenuTransition(dilatedTime);
                break;
        }

        // REDUCED: Only log important state changes
        if (this.previousGameState !== this.state.gameState && 
            (this.state.gameState === GameState.GAME_OVER_SEQUENCE || 
             this.state.gameState === GameState.PLAYING ||
             this.state.gameState === GameState.MENU)) {
            this.logStateChange(this.previousGameState, this.state.gameState);
            this.previousGameState = this.state.gameState;
        }

        // Always update particles
        this.particleSystem.update(dilatedTime);
    }

    /**
     * REDUCED: Log frame state for deterministic replay (money game requirement)
     */
    logFrameState() {
        const frameLog = {
            frame: this.frameNumber,
            timestamp: Date.now(),
            gameState: this.state.gameState,
            score: this.state.score,
            level: this.state.level,
            lines: this.state.lines,
            currentPiece: this.state.currentPiece?.type || null,
            nextPiece: this.state.nextPiece?.type || null,
            boardTopRows: this.state.board.slice(0, 3).map(row => 
                row.map(cell => cell ? cell.type : null)
            )
        };
        
        this.gameLog.frameStates.push(frameLog);
        
        // Keep only last 200 frames to prevent memory issues (reduced from 1000)
        if (this.gameLog.frameStates.length > 200) {
            this.gameLog.frameStates = this.gameLog.frameStates.slice(-200);
        }
    }

    /**
     * REDUCED: Log state changes for audit trail (money game requirement)
     */
    logStateChange(fromState, toState) {
        const stateChangeLog = {
            frame: this.frameNumber,
            timestamp: Date.now(),
            fromState: fromState,
            toState: toState,
            score: this.state.score,
            trigger: 'state_transition'
        };
        
        // REDUCED: Only log important transitions
        if (toState === GameState.GAME_OVER_SEQUENCE || toState === GameState.PLAYING) {
            console.log(`🎮 State change: ${fromState} → ${toState}`);
        }
        
        this.gameLog.stateChanges.push(stateChangeLog);
    }

    // ... (keeping all the transition update methods unchanged) ...

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
            this.state.pauseStartTime = Date.now();
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
            this.state.pauseStartTime = null;
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
     * FIXED: Game over sequence with proper SimpleGameOver integration
     */
    updateGameOverSequence(deltaTime) {
        const now = Date.now();
        const gameOverElapsed = now - this.state.gameOverStartTime;
        
        // Phase 0: Death piece blinking (4 seconds - 4 blinks)
        if (this.state.gameOverSequencePhase === 0) {
            // After 4 seconds of blinking, start distortion phase
            if (gameOverElapsed > 4000) {
                this.state.gameOverSequencePhase = 1;
                this.state.distortionStartTime = now;
                console.log('🎭 Starting dramatic distortion phase');
            }
        }
        
        // Phase 1: Dramatic distortion with melting effect (5 seconds)
        if (this.state.gameOverSequencePhase === 1) {
            const distortionElapsed = now - this.state.distortionStartTime;
            
            // After 5 seconds of distortion, trigger SimpleGameOver UI
            if (distortionElapsed > 5000) {
                this.state.gameOverSequencePhase = 2;
                this.triggerSimpleGameOverUI();
                console.log('🎮 Transitioning to SimpleGameOver UI');
            }
        }
        
        // Phase 2: Show SimpleGameOver UI
        else if (this.state.gameOverSequencePhase === 2) {
            // Move to final phase
            this.state.gameOverSequencePhase = 3;
            this.state.gameState = GameState.GAME_OVER;
            this.state.phase = 'GAME_OVER';
        }
    }

    /**
     * FIXED: Trigger SimpleGameOver UI with proper score
     */
    triggerSimpleGameOverUI() {
        const gameOverEvent = new CustomEvent('gameOver', {
            detail: {
                score: this.state.score,
                level: this.state.level,
                lines: this.state.lines,
                time: Date.now() - this.state.startTime,
                isNewHighScore: this.state.score > (this.config.get('game.highScore') || 0)
            }
        });
        document.dispatchEvent(gameOverEvent);
        console.log('🎮 SimpleGameOver UI triggered with score:', this.state.score);
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

    // ... (keeping all input handling methods unchanged) ...

    /**
     * Handle input with buffering and logging
     */
    handleInput(action) {
        this.recordInput(action);

        if (this.shouldBufferInput(action)) {
            this.inputBuffer = {
                action: action,
                timestamp: Date.now()
            };
            return;
        }

        this.processInputAction(action);
    }

    /**
     * REDUCED: Record input for deterministic replay
     */
    recordInput(action) {
        const inputRecord = {
            frame: this.frameNumber,
            action: action,
            timestamp: Date.now(),
            gameState: this.state.gameState,
            score: this.state.score,
            level: this.state.level,
            currentPiece: this.state.currentPiece?.type || null,
            currentPosition: { ...this.state.currentPosition }
        };

        this.inputLog.push(inputRecord);
        this.gameLog.inputs.push(inputRecord);
        
        // REDUCED: Only log important inputs
        if (action.type === 'HARD_DROP' || action.type === 'HOLD') {
            console.log(`🎮 Input: ${action.type} at frame ${this.frameNumber}, score: ${this.state.score}`);
        }
    }

    /**
     * Check if input should be buffered
     */
    shouldBufferInput(action) {
        const bufferStates = [
            GameState.CLEARING,
            GameState.COUNTDOWN,
            GameState.MENU_TO_COUNTDOWN,
            GameState.COUNTDOWN_TO_PLAYING
        ];
        const isBufferState = bufferStates.includes(this.state.gameState);

        const isLateLock = this.state.gameState === GameState.PLAYING &&
                          this.state.isLocking &&
                          this.state.lockTimer < 150;

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

        if (age > this.inputBuffer.bufferWindow) {
            this.inputBuffer.action = null;
            return;
        }

        if (this.state.gameState === GameState.PLAYING) {
            this.processInputAction(this.inputBuffer.action);
            this.inputBuffer.action = null;
        }
    }

    /**
     * Process input action
     */
    processInputAction(action) {
        // NEW: Check game over lockout first
        if (this.isInputBlocked()) {
            console.log(`🚫 Input blocked during game over lockout: ${action.type}`);
            return;
        }
        
        // CRITICAL: Don't process gameplay inputs during game over
        if (this.gameOverTriggered || 
            this.state.gameState === GameState.GAME_OVER_SEQUENCE ||
            this.state.gameState === GameState.GAME_OVER) {
            
            // Only allow new game if lockout allows it
            if (action.type === 'START_GAME' && this.canStartNewGame()) {
                this.startFreePlay();
                this.resetGameOverLockout();
                return;
            }
            
            // Allow return to menu
            if (action.type === 'RETURN_TO_MENU') {
                this.returnToMenu();
                this.resetGameOverLockout();
                return;
            }
            
            // Block all other inputs
            console.log(`🚫 Input blocked during game over: ${action.type}`);
            return;
        }

        if (this.state.gameState === GameState.PLAYING) {
            this.scoring.inputMade();
        }

        switch (action.type) {
            case 'MOVE':
                this.movePiece(action.dx, action.dy);
                break;
            case 'UP_PRESSED':
                this.handleUpPress();
                break;
            case 'ROTATE':
                this.rotatePiece(action.direction);
                break;
            case 'HARD_DROP':
            case 'SPACE':
                this.hardDrop();
                break;
            case 'HOLD':
            case 'C':
                this.holdPiece();
                break;
            case 'PAUSE':
                this.togglePause();
                break;
            case 'START_GAME':
                this.startFreePlay();
                break;
            case 'RETURN_TO_MENU':
                this.returnToMenu();
                break;
        }
    }

    /**
     * Start game
     */
    startGame(mode = 'practice') {
        // Reset game over tracking
        this.gameOverTriggered = false;
        
        // NEW: Reset game over lockout
        this.resetGameOverLockout();
        
        this.state.gameMode = mode;
        this.state.gameState = GameState.MENU_TO_COUNTDOWN;
        this.state.startTime = Date.now();
        this.state.countdownTimer = 3000; // FIXED: Set countdown timer to 3 seconds
        this.startTransition('fade-in', 300);

        // Reset deterministic systems
        this.inputLog = [];
        this.gameLog = {
            seed: this.rng.seed,
            startTime: Date.now(),
            inputs: [],
            stateSnapshots: [],
            finalScore: 0,
            finalState: null,
            frameStates: [],
            stateChanges: []
        };

        // Reset 7-bag randomizer
        this.bagRandomizer = {
            currentBag: [],
            nextBag: [],
            bagHistory: [],
            bagCount: 0
        };

        this.recordStateSnapshot('game_start');

        // Initialize game state
        this.state.board = Array(CONSTANTS.BOARD.HEIGHT).fill().map(() =>
            Array(CONSTANTS.BOARD.WIDTH).fill(null)
        );

        this.state.score = 0;
        this.state.lines = 0;
        this.state.level = 1;
        this.state.combo = 0;
        this.state.gravitySpeed = 1000;
        this.state.gravityAccumulator = 0;

        this.state.currentPiece = null;
        this.state.nextPiece = null;
        this.state.heldPiece = null;
        this.state.canHold = true;

        this.state.unlockedPieces = [...CONSTANTS.PIECES.STARTING];
        this.state.lastUnlockScore = 0;

        this.state.statistics = {
            piecesPlaced: 0,
            maxCombo: 0,
            floatUsed: 0
        };

        // Generate first pieces
        this.state.nextPiece = this.generatePiece();
        this.state.currentPiece = this.generatePiece();
        this.state.currentPosition = {
            x: this.state.currentPiece.spawn.x,
            y: this.state.currentPiece.spawn.y
        };

        // Initialize spawn state
        this.state.spawnTimer = 0;
        this.state.isSpawning = true;
        this.state.pieceSpawnTime = Date.now();
        this.state.shadowValid = false;

        // Reset scoring system
        this.scoring.reset();

        // FIXED: Remove the immediate transition to PLAYING - let countdown handle it
    }

    /**
     * Start free play mode - simplified game start without tournament features
     */
    startFreePlay() {
        this.startGame('practice');
    }

    /**
     * Main game update
     */
    updatePlaying(deltaTime) {
        // CRITICAL: Stop all playing logic if game over has been triggered
        if (this.gameOverTriggered || 
            this.state.gameState === GameState.GAME_OVER_SEQUENCE ||
            this.state.gameState === GameState.GAME_OVER) {
            console.log('🚫 Blocking updatePlaying - game over triggered');
            return; // Don't continue with playing logic
        }

        // EMERGENCY: Check if board is too full (backup safety)
        if (this.checkEmergencyGameOver()) {
            return;
        }

        if (!this.state.currentPiece) {
            console.log('💀 No current piece in updatePlaying - triggering game over');
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
            this.state.gravityAccumulator += deltaTime;

            if (this.state.gravityAccumulator >= this.state.gravitySpeed) {
                this.state.gravityAccumulator -= this.state.gravitySpeed;

                if (!this.movePiece(0, 1)) {
                    this.state.gravityAccumulator = 0;
                }
            }
        } else if (!this.state.isLocking) {
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

        const stateKey = `${this.state.currentPosition.x},${this.state.currentPosition.y},${this.state.currentPiece.rotation}`;
        if (this.state.lastShadowKey === stateKey && this.state.shadowValid) {
            return;
        }

        const shadowX = this.state.currentPosition.x;
        let shadowY = this.state.currentPosition.y;

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

        this.state.shadowPosition = { x: shadowX, y: shadowY };
        this.state.shadowValid = true;
        this.state.lastShadowKey = stateKey;
        this.state.shadowY = shadowY;
    }

    /**
     * Move piece
     */
    movePiece(dx, dy) {
        if (!this.state.currentPiece || this.state.gameState !== 'PLAYING') {
            return false;
        }

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
            
            this.state.lockTimer = 0;
            this.state.isLocking = false;
            this.state.shadowValid = false;
            
            return true;
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

            this.state.shadowValid = false;

            if (this.audio) {
                this.audio.playSound('rotate');
            }

            if (this.state.lockTimer > 0) {
                this.state.lockTimer = 0;
                this.state.isLocking = false;
            }

            return true;
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

        // Always play land sound for hard drops
        if (this.audio) {
            this.audio.playSound('land');
        }

        this.lockPiece();
    }

    /**
     * Start locking
     */
    startLocking() {
        // Always play land sound when piece starts locking
        if (this.audio) {
            this.audio.playSound('land');
        }

        const lockDelay = CONSTANTS.TIMING.getLockDelay(
            this.state.currentPiece.type,
            this.state.currentPosition.y
        );

        this.state.lockTimer = lockDelay;
        this.state.isLocking = true;
    }

    /**
     * FIXED: Correct spawn checking that actually detects collisions
     */
    canPieceSpawnOnBoard(pieceType, board) {
        const def = CONSTANTS.PIECES.DEFINITIONS[pieceType];
        if (!def) {
            console.log(`❌ Unknown piece type: ${pieceType}`);
            return false;
        }
        
        const spawnPos = def.spawn;
        const pieceShape = def.shape;
        
        // Check each block of the piece
        for (let dy = 0; dy < pieceShape.length; dy++) {
            for (let dx = 0; dx < pieceShape[0].length; dx++) {
                if (pieceShape[dy][dx]) {
                    const boardX = spawnPos.x + dx;
                    const boardY = spawnPos.y + dy;
                    
                    // Check horizontal bounds
                    if (boardX < 0 || boardX >= CONSTANTS.BOARD.WIDTH) {
                        console.log(`❌ ${pieceType} out of bounds: X=${boardX}`);
                        return false;
                    }
                    
                    // CRITICAL FIX: Check for collisions only in visible board area
                    // If ANY part of the piece collides with existing blocks, it CANNOT spawn
                    if (boardY >= 0 && boardY < CONSTANTS.BOARD.HEIGHT) {
                        if (board[boardY][boardX] !== null) {
                            console.log(`💥 COLLISION: ${pieceType} cannot spawn - collision at (${boardX}, ${boardY})`);
                            return false; // CANNOT SPAWN - collision detected
                        }
                    }
                    // If boardY < 0, it's in the spawn zone above the board - always OK
                    // If boardY >= BOARD.HEIGHT, piece is too low (shouldn't happen in spawn)
                }
            }
        }
        
        return true; // CAN SPAWN - no collisions found
    }

    /**
     * FIXED: Simple updateLocking - no complex game over checks needed
     */
    updateLocking(deltaTime) {
        this.state.lockTimer -= deltaTime;

        if (this.state.lockTimer <= 0) {
            this.lockPiece();
        }
    }

    /**
     * 3. FIXED: Enhanced lockPiece with AGGRESSIVE game over checking
     */
    lockPiece() {
        // CRITICAL: Don't lock pieces if game over is in progress
        if (this.gameOverTriggered || 
            this.state.gameState === GameState.GAME_OVER_SEQUENCE ||
            this.state.gameState === GameState.GAME_OVER) {
            console.log('🚫 Blocking lockPiece - game over already triggered');
            return;
        }

        if (!this.state.currentPiece) {
            console.log('🚫 No current piece to lock');
            return;
        }

        console.log(`🔒 Locking piece ${this.state.currentPiece.type} at (${this.state.currentPosition.x}, ${this.state.currentPosition.y})`);

        // SIMPLE GAME OVER CHECK: Is piece locking above the board?
        if (this.isPieceLockingAboveBoard(this.state.currentPiece, this.state.currentPosition)) {
            console.log('💀💀💀 GAME OVER: Piece locking above visible board! 💀💀💀');
            
            // Place the piece first so it shows on the board for death piece rendering
            this.state.board = Physics.placePiece(this.state.board, {
                ...this.state.currentPiece,
                gridX: this.state.currentPosition.x,
                gridY: this.state.currentPosition.y
            });
            
            // Trigger game over immediately
            this.gameOver();
            return;
        }

        // Normal piece locking
        this.state.board = Physics.placePiece(this.state.board, {
            ...this.state.currentPiece,
            gridX: this.state.currentPosition.x,
            gridY: this.state.currentPosition.y
        });

        this.state.statistics.piecesPlaced++;

        // Find lines to clear
        const linesToClear = this.findLinesToClear();

        if (linesToClear.length > 0) {
            console.log(`🎯 Found ${linesToClear.length} lines to clear`);
            this.startClearing(linesToClear);
        } else {
            console.log('📍 No lines to clear, spawning next piece');
            this.spawnNextPiece();
        }

        // Reset locking state
        this.state.lockTimer = 0;
        this.state.isLocking = false;
    }

    /**
     * 4. FIXED: Enhanced spawnNextPiece with explicit collision checking
     */
    spawnNextPiece() {
        // CRITICAL: Don't spawn pieces if game over is in progress
        if (this.gameOverTriggered || 
            this.state.gameState === GameState.GAME_OVER_SEQUENCE ||
            this.state.gameState === GameState.GAME_OVER) {
            console.log('🚫 Blocking spawnNextPiece - game over already triggered');
            return;
        }

        console.log(`🌟 Spawning next piece: ${this.state.nextPiece.type}`);

        // Simple spawning - let the lock check handle game over
        this.state.currentPiece = this.state.nextPiece;
        this.state.nextPiece = this.generatePiece();
        this.state.currentPosition = {
            x: this.state.currentPiece.spawn.x,
            y: this.state.currentPiece.spawn.y
        };
        this.state.canHold = true;

        this.state.spawnTimer = 0;
        this.state.isSpawning = true;
        this.state.pieceSpawnTime = Date.now();
        this.state.shadowValid = false;

        console.log(`🎮 Spawned ${this.state.currentPiece.type} at (${this.state.currentPosition.x}, ${this.state.currentPosition.y})`);
    }

    /**
     * FIXED: Simple spawn check method that uses canPieceSpawnOnBoard
     */
    canSpawnPiece(pieceType) {
        const result = this.canPieceSpawnOnBoard(pieceType, this.state.board);
        
        if (!result) {
            console.log(`💀 Spawn check failed for ${pieceType} - triggering game over`);
        }
        
        return result;
    }

    /**
     * FIXED: Game over with more detailed logging
     */
    gameOver() {
        // CRITICAL: Immediately set the flag to prevent race conditions
        if (this.gameOverTriggered) {
            console.log('🚫 Game over already triggered - ignoring duplicate call');
            return;
        }
        
        this.gameOverTriggered = true;
        
        // NEW: Activate game over lockout
        this.gameOverLockout = {
            active: true,
            startTime: Date.now(),
            duration: 3000, // 3 seconds minimum lockout
            canStartNewGame: false
        };
        
        console.log('💀💀💀 GAME OVER TRIGGERED! 💀💀💀');
        console.log(`📊 Final Score: ${this.state.score}`);
        console.log('🔒 Game over lockout activated - preventing input bypass');
        
        // IMMEDIATELY lock the game state
        this.state.gameState = GameState.GAME_OVER_SEQUENCE;
        this.state.phase = 'GAME_OVER_SEQUENCE';
        this.state.gameOverSequencePhase = 0;
        this.state.gameOverStartTime = Date.now();
        this.state.deathPieceBlinkStart = Date.now();
        
        // Stop all timers and movement
        this.state.lockTimer = 0;
        this.state.isLocking = false;
        this.state.gravityAccumulator = 0;
        
        console.log('💀 Game over sequence started - death piece should be blinking');
        
        // Record final state and update stats...
        this.gameLog.finalScore = this.state.score;
        
        const highScore = this.config.get('game.highScore') || 0;
        const isNewHighScore = this.state.score > highScore;
        if (isNewHighScore) {
            this.config.set('game.highScore', this.state.score);
            console.log('🏆 NEW HIGH SCORE!');
        }

        this.config.incrementStat('game.gamesPlayed');
        this.config.incrementStat('game.totalScore', this.state.score);
        this.config.incrementStat('game.totalLines', this.state.lines);
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
     * 4. REMOVE complex finishClearing - keep it simple
     */
    finishClearing() {
        // CRITICAL: Don't finish clearing if game over is in progress
        if (this.gameOverTriggered || 
            this.state.gameState === GameState.GAME_OVER_SEQUENCE ||
            this.state.gameState === GameState.GAME_OVER) {
            console.log('🚫 Blocking finishClearing - game over already triggered');
            return;
        }

        const linesCleared = this.state.clearingLines.length;
        console.log(`🎯 Finishing clearing of ${linesCleared} lines`);

        this.state.board = Physics.removeClearedLines(
            this.state.board,
            this.state.clearingLines
        );

        const scoreResult = this.scoring.lineClear(linesCleared, this.state.board);
        const scoringState = this.scoring.getState();
        this.state.score = scoringState.score;
        this.state.lines = scoringState.lines;
        this.state.level = scoringState.level;
        this.state.combo = scoringState.combo;

        this.state.statistics.maxCombo = Math.max(
            this.state.statistics.maxCombo,
            this.state.combo
        );

        this.checkUnlocks();

        this.state.clearingLines = [];
        this.state.gameState = GameState.PLAYING;

        // Simple spawn - let lock check handle game over
        this.spawnNextPiece();
        this.processBufferedInput();
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
                break;
            }
        }
    }

    /**
     * Toggle pause
     */
    togglePause() {
        if (this.state.gameState === GameState.PLAYING) {
            this.state.gameState = GameState.PAUSED;
            this.state.pauseStartTime = Date.now();
        } else if (this.state.gameState === GameState.PAUSED) {
            this.state.gameState = GameState.PLAYING;
            this.state.pauseStartTime = null;
        }
    }

    /**
     * Find lines to clear
     */
    findLinesToClear() {
        const linesToClear = [];
        
        for (let y = 0; y < CONSTANTS.BOARD.HEIGHT; y++) {
            let isFull = true;
            for (let x = 0; x < CONSTANTS.BOARD.WIDTH; x++) {
                if (!this.state.board[y][x]) {
                    isFull = false;
                    break;
                }
            }
            if (isFull) {
                linesToClear.push(y);
            }
        }
        
        return linesToClear;
    }

    /**
     * Generate piece using 7-bag randomizer
     */
    generatePiece() {
        const availablePieces = this.state.unlockedPieces;
        
        if (availablePieces.length === 0) {
            return this.createPiece('I');
        }

        if (this.bagRandomizer.currentBag.length === 0) {
            this.fillBag();
        }

        const pieceType = this.bagRandomizer.currentBag.pop();
        
        this.bagRandomizer.bagHistory.push({
            frame: this.frameNumber,
            pieceType: pieceType,
            bagIndex: this.bagRandomizer.bagCount,
            bagPosition: this.bagRandomizer.currentBag.length
        });

        return this.createPiece(pieceType);
    }

    /**
     * Fill the current bag with a shuffled set of pieces
     */
    fillBag() {
        const availablePieces = this.state.unlockedPieces;
        const floatFrequency = this.calculateDynamicFloatFrequency();
        
        this.bagRandomizer.currentBag = [...availablePieces];
        
        if (floatFrequency > 1) {
            const extraFloatCount = Math.floor(floatFrequency - 1);
            for (let i = 0; i < extraFloatCount; i++) {
                this.bagRandomizer.currentBag.push('FLOAT');
            }
        }
        
        this.shuffleBag(this.bagRandomizer.currentBag);
        this.bagRandomizer.bagCount++;
    }

    /**
     * Calculate dynamic FLOAT frequency based on unlocked pieces and game progress
     */
    calculateDynamicFloatFrequency() {
        const unlockedPieces = this.state.unlockedPieces;
        const piecesPlaced = this.state.statistics.piecesPlaced;
        const floatConfig = CONSTANTS.PIECES.FLOAT_DYNAMIC_BOOST;
        
        let pieceBasedBoost = 0;
        
        const hasAdvancedPieces = unlockedPieces.some(piece => 
            floatConfig.ADVANCED_PIECES.includes(piece)
        );
        
        if (hasAdvancedPieces) {
            const advancedPieceCount = unlockedPieces.filter(piece => 
                floatConfig.ADVANCED_PIECES.includes(piece)
            ).length;
            
            const baseBoost = floatConfig.BASE_BOOST;
            const maxBoost = floatConfig.MAX_BOOST;
            const boostIncrement = (maxBoost - baseBoost) / floatConfig.ADVANCED_PIECES.length;
            
            pieceBasedBoost = baseBoost + (advancedPieceCount * boostIncrement);
        }
        
        const progressBasedBoost = this.calculateProgressBasedFloatBoost(piecesPlaced);
        const totalBoost = pieceBasedBoost + progressBasedBoost;
        const finalFrequency = 1.0 + totalBoost;
        
        return finalFrequency;
    }

    /**
     * Calculate FLOAT frequency boost based on game progress
     */
    calculateProgressBasedFloatBoost(piecesPlaced) {
        const milestones = CONSTANTS.PIECES.FLOAT_DYNAMIC_BOOST.PROGRESSION_MILESTONES;
        
        let currentMilestone = milestones[0];
        let nextMilestone = milestones[1];
        
        for (let i = 0; i < milestones.length - 1; i++) {
            if (piecesPlaced >= milestones[i].pieces && piecesPlaced < milestones[i + 1].pieces) {
                currentMilestone = milestones[i];
                nextMilestone = milestones[i + 1];
                break;
            }
        }
        
        if (piecesPlaced >= milestones[milestones.length - 1].pieces) {
            return milestones[milestones.length - 1].boost;
        }
        
        const progress = (piecesPlaced - currentMilestone.pieces) / (nextMilestone.pieces - currentMilestone.pieces);
        const interpolatedBoost = currentMilestone.boost + (progress * (nextMilestone.boost - currentMilestone.boost));
        
        return interpolatedBoost;
    }

    /**
     * Shuffle bag deterministically using Fisher-Yates
     */
    shuffleBag(bag) {
        for (let i = bag.length - 1; i > 0; i--) {
            const shuffleSeed = this.rng.seed + this.frameNumber + this.bagRandomizer.bagCount + i;
            const tempRng = new ProfessionalRNG(shuffleSeed);
            
            const j = Math.floor(tempRng.random() * (i + 1));
            [bag[i], bag[j]] = [bag[j], bag[i]];
        }
    }

    /**
     * Create piece
     */
    createPiece(type) {
        const def = CONSTANTS.PIECES.DEFINITIONS[type];
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
     * Get state for rendering
     */
    getState() {
        let phase = this.state.gameState;

        if (phase === GameState.PLAYING && this.state.isLocking) {
            phase = 'LOCKING';
        }

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

            gravityAccumulator: this.state.gravityAccumulator,
            currentGravityDelay: this.state.gravitySpeed,

            isLocking: this.state.isLocking,

            hasBufferedInput: this.inputBuffer.action !== null,

            transition: this.transitions.active ? {
                type: this.transitions.type,
                progress: this.getTransitionProgress(),
                data: this.transitions.data
            } : null,

            timeDilation: this.timeDilation,

            metrics: this.scoring.getPerformanceMetrics(),

            // FIXED: Add game over sequence tracking for renderer
            gameOverSequencePhase: this.state.gameOverSequencePhase,
            gameOverStartTime: this.state.gameOverStartTime,
            deathPieceBlinkStart: this.state.deathPieceBlinkStart
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
        this.gameOverTriggered = false; // Reset the flag
    }

    /**
     * Tick for main loop
     */
    tick(deltaTime) {
        this.update(deltaTime);
    }

    /**
     * Record state snapshot for replay
     */
    recordStateSnapshot(event, data = {}) {
        const snapshot = {
            frame: this.frameNumber,
            event: event,
            timestamp: Date.now(),
            state: {
                board: JSON.parse(JSON.stringify(this.state.board)),
                currentPiece: this.state.currentPiece ? { ...this.state.currentPiece } : null,
                currentPosition: { ...this.state.currentPosition },
                score: this.state.score,
                lines: this.state.lines,
                level: this.state.level,
                combo: this.state.combo
            },
            data: data
        };

        this.gameLog.stateSnapshots.push(snapshot);
    }

    /**
     * Get complete game log for replay
     */
    getGameLog() {
        return {
            ...this.gameLog,
            inputCount: this.inputLog.length,
            snapshotCount: this.gameLog.stateSnapshots.length,
            duration: Date.now() - this.gameLog.startTime
        };
    }

    /**
     * Get complete game log for audit trail (money game requirement)
     */
    getCompleteGameLog() {
        return {
            gameId: this.gameLog.seed,
            startTime: this.gameLog.startTime,
            endTime: Date.now(),
            finalScore: this.gameLog.finalScore,
            finalState: this.gameLog.finalState,
            inputs: this.gameLog.inputs,
            stateChanges: this.gameLog.stateChanges,
            frameStates: this.gameLog.frameStates,
            stateSnapshots: this.gameLog.stateSnapshots,
            bagHistory: this.bagRandomizer.bagHistory,
            totalFrames: this.frameNumber,
            config: {
                boardWidth: CONSTANTS.BOARD.WIDTH,
                boardHeight: CONSTANTS.BOARD.HEIGHT,
                startingPieces: CONSTANTS.PIECES.STARTING
            }
        };
    }

    /**
     * Export game log for dispute resolution (money game requirement)
     */
    exportGameLogForAudit() {
        const auditLog = this.getCompleteGameLog();
        
        const blob = new Blob([JSON.stringify(auditLog, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `neondrop-audit-${this.gameLog.seed}-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log(`📋 Audit log exported: ${a.download}`);
        return auditLog;
    }

    /**
     * Submit score to leaderboard system
     */
    async submitScoreToLeaderboard() {
        if (!window.leaderboard) return;

        try {
            const scoreProof = this.scoring.generateProof();
            this.storeScoreLocally(scoreProof.score);
            const result = await window.leaderboard.submitScore(scoreProof);
            
            if (result.success) {
                this.state.lastSubmissionResult = result;
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

            const stored = localStorage.getItem('neondrop5-scores');
            let scores = [];
            if (stored) {
                scores = JSON.parse(stored);
            }

            scores.push(scoreEntry);
            scores.sort((a, b) => b.score - a.score);
            scores = scores.slice(0, 100);

            localStorage.setItem('neondrop5-scores', JSON.stringify(scores));
        } catch (error) {
            // Error storing score locally - fail silently
        }
    }

    // 7. ADDITIONAL: Force game over when board is too full (emergency brake)
    checkEmergencyGameOver() {
        // Count filled blocks in top 4 rows
        let topRowsFilled = 0;
        let totalTopBlocks = 0;
        
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < CONSTANTS.BOARD.WIDTH; x++) {
                totalTopBlocks++;
                if (this.state.board[y] && this.state.board[y][x] !== null) {
                    topRowsFilled++;
                }
            }
        }
        
        const topFillPercentage = topRowsFilled / totalTopBlocks;
        
        // If top 4 rows are more than 80% full, force game over as emergency brake
        if (topFillPercentage > 0.8) {
            console.log(`🚨 EMERGENCY GAME OVER: Top rows ${(topFillPercentage * 100).toFixed(1)}% full`);
            this.gameOver();
            return true;
        }
        
        return false;
    }

    // 1. SIMPLE: Check if piece is locking above the board
    isPieceLockingAboveBoard(piece, position) {
        // Check if any block of the piece is above the visible board (Y < 0)
        for (let dy = 0; dy < piece.shape.length; dy++) {
            for (let dx = 0; dx < piece.shape[0].length; dx++) {
                if (piece.shape[dy][dx]) {
                    const blockY = position.y + dy;
                    if (blockY < 0) {
                        console.log(`💀 Piece ${piece.type} locking above board at Y=${blockY}`);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // NEW: Check if input should be blocked during game over lockout
    isInputBlocked() {
        if (!this.gameOverLockout.active) {
            return false;
        }
        
        const elapsed = Date.now() - this.gameOverLockout.startTime;
        
        // After lockout duration, allow new game but block other inputs
        if (elapsed >= this.gameOverLockout.duration) {
            this.gameOverLockout.canStartNewGame = true;
            // Still block other inputs until game over sequence completes
            return this.state.gameState === GameState.GAME_OVER_SEQUENCE;
        }
        
        // During lockout period, block ALL inputs
        return true;
    }

    // NEW: Check if new game can be started
    canStartNewGame() {
        return this.gameOverLockout.canStartNewGame || 
               this.state.gameState === GameState.GAME_OVER;
    }

    // NEW: Reset lockout when starting new game
    resetGameOverLockout() {
        this.gameOverLockout = {
            active: false,
            startTime: 0,
            duration: 3000,
            canStartNewGame: false
        };
        console.log('🔓 Game over lockout reset');
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