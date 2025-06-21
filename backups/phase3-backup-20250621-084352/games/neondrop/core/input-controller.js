/**
 * core/input-controller.js - Professional Game Input System
 *
 * Handles all input methods with proper state checking
 * Fixed to work with cleaned game engine states
 */

// Helper function to check if we're in a playing state
function isPlayingPhase(phase) {
    return phase === 'PLAYING' || phase === 'LOCKING';
}

export class InputController {
    constructor(onAction, getState, config) {
        this.onAction = onAction;
        this.getState = getState;
        this.config = config;

        // Input state
        this.keys = new Map();
        this.das = new Map(); // Delayed Auto Shift timers
        this.arr = new Map(); // Auto Repeat Rate timers

        // Timing configuration
        this.DAS_DELAY = config.get('input.dasDelay') || 133;
        this.ARR_RATE = config.get('input.arrRate') || 10;

        // Listen for config changes
        config.onChange('input.dasDelay', (value) => {
            this.DAS_DELAY = value;
        });

        config.onChange('input.arrRate', (value) => {
            this.ARR_RATE = value;
        });

        // Cooldowns to prevent accidental inputs
        this.cooldowns = {
            gameOver: false,
            gameOverTime: 500,
            menuStart: false,
            menuStartTime: 300,
            pause: false,
            pauseTime: 200
        };

        // Touch state
        this.touch = {
            startX: 0,
            startY: 0,
            startTime: 0,
            isSwiping: false,
            holdTimer: null,
            holdInterval: null,
            lastTapTime: 0,
            swipeThreshold: 30,
            tapTimeout: 200,
            doubleTapTimeout: 300
        };

        // Button repeat state
        this.buttonRepeat = new Map();

        // Input method detection state
        this.inputMethod = {
            lastUsed: null,
            hasUsedTouch: false,
            hasUsedKeyboard: false,
            hasUsedMouse: false
        };

        this.setupListeners();
        this.detectInitialInputMethod();
    }

    /**
     * Detect initial input method
     */
    detectInitialInputMethod() {
        // Check saved preference first
        const savedControlType = this.config.get('input.preferredControls');
        if (savedControlType === 'touch') {
            this.showTouchControls();
            return;
        } else if (savedControlType === 'keyboard') {
            this.hideTouchControls();
            return;
        }

        // Auto-detect based on initial capabilities
        const detection = this.getInputCapabilities();

        if (!detection.hasKeyboard || detection.isPhoneSize) {
            this.showTouchControls();
        } else {
            this.hideTouchControls();
        }
    }

    /**
     * Get input capabilities
     */
    getInputCapabilities() {
        const capabilities = {
            hasKeyboard: true,
            hasMouse: true,
            hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            isPhoneSize: window.innerWidth < 768 && window.innerHeight < 1024,
            isMobileOS: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        };

        // Heuristic: If it's mobile OS without mouse, probably need touch controls
        if (capabilities.isMobileOS && !window.matchMedia("(hover: hover)").matches) {
            capabilities.hasKeyboard = false;
            capabilities.hasMouse = false;
        }

        return capabilities;
    }

    /**
     * Detect input method from event
     */
    detectInputMethodFromEvent(eventType) {
        const previousMethod = this.inputMethod.lastUsed;

        switch(eventType) {
            case 'keyboard':
                this.inputMethod.lastUsed = 'keyboard';
                this.inputMethod.hasUsedKeyboard = true;
                break;
            case 'touch':
                this.inputMethod.lastUsed = 'touch';
                this.inputMethod.hasUsedTouch = true;
                break;
            case 'mouse':
                this.inputMethod.lastUsed = 'mouse';
                this.inputMethod.hasUsedMouse = true;
                break;
        }

        // Auto-hide touch controls if user starts using keyboard/mouse
        if (previousMethod !== this.inputMethod.lastUsed) {
            if (this.inputMethod.lastUsed === 'keyboard' || this.inputMethod.lastUsed === 'mouse') {
                if (this.inputMethod.hasUsedTouch && document.body.classList.contains('touch-device')) {
                    this.promptControlPreference();
                }
            }
        }
    }

    /**
     * Prompt for control preference
     */
    promptControlPreference() {
        if (this.inputMethod.hasUsedKeyboard) {
            setTimeout(() => {
                if (this.inputMethod.lastUsed === 'keyboard') {
                    this.hideTouchControls();
                    this.config.set('input.preferredControls', 'keyboard');
                }
            }, 5000);
        }
    }

    showTouchControls() {
        document.body.classList.add('touch-device');
    }

    hideTouchControls() {
        document.body.classList.remove('touch-device');
    }

    /**
     * Setup all event listeners
     */
    setupListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.detectInputMethodFromEvent('keyboard');
            this.onKeyDown(e);
        });
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Mouse
        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('.touch-btn')) return;
            this.detectInputMethodFromEvent('mouse');
        });

        // Touch
        document.addEventListener('touchstart', (e) => {
            this.detectInputMethodFromEvent('touch');
            this.onTouchStart(e);
        }, { passive: false });
        document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });

        // On-screen buttons
        this.setupTouchButtons();

        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Responsive listeners
        this.setupResponsiveListeners();
    }

    /**
     * Setup responsive listeners
     */
    setupResponsiveListeners() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const capabilities = this.getInputCapabilities();

                if (capabilities.isPhoneSize && !document.body.classList.contains('touch-device')) {
                    this.showTouchControls();
                } else if (!capabilities.isPhoneSize && !this.inputMethod.hasUsedTouch) {
                    this.hideTouchControls();
                }
            }, 250);
        });

        window.addEventListener('orientationchange', () => {
            this.adjustControlsForOrientation();
        });
    }

    adjustControlsForOrientation() {
        // Placeholder for orientation adjustments
    }

    /**
     * Setup touch buttons
     */
    setupTouchButtons() {
        const buttons = document.querySelectorAll('.touch-btn');

        buttons.forEach(btn => {
            // Touch events
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.onTouchButtonPress(btn.dataset.action);
                btn.classList.add('active');
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.onTouchButtonRelease(btn.dataset.action);
                btn.classList.remove('active');
            });

            // Mouse events for testing
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.onTouchButtonPress(btn.dataset.action);
                btn.classList.add('active');
            });

            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.onTouchButtonRelease(btn.dataset.action);
                btn.classList.remove('active');
            });

            btn.addEventListener('mouseleave', (e) => {
                this.onTouchButtonRelease(btn.dataset.action);
                btn.classList.remove('active');
            });
        });
    }

    /**
     * Keyboard key down handler
     */
    onKeyDown(e) {
        // Prevent key repeat
        if (this.keys.has(e.code)) return;

        // Prevent default for game keys
        if (this.isGameKey(e.code)) {
            e.preventDefault();
        }

        this.keys.set(e.code, true);

        // Convert to action
        const action = this.keyToAction(e.code);
        if (!action) return;

        // Process action
        this.processAction(action);

        // Setup auto-repeat for movement
        if (action.type === 'MOVE' && isPlayingPhase(this.getState().phase)) {
            this.startAutoRepeat(e.code, action);
        }

        // Setup auto-repeat for ghost piece opacity adjustment
        if (action.type === 'ADJUST_GHOST') {
            this.startAutoRepeat(e.code, action);
        }
    }

    /**
     * Keyboard key up handler
     */
    onKeyUp(e) {
        this.keys.delete(e.code);
        this.stopAutoRepeat(e.code);
    }

    /**
     * Convert keyboard key to game action
     */
    keyToAction(keyCode) {
        const mapping = {
            // Movement
            'ArrowLeft': { type: 'MOVE', dx: -1, dy: 0 },
            'KeyA': { type: 'MOVE', dx: -1, dy: 0 },
            'ArrowRight': { type: 'MOVE', dx: 1, dy: 0 },
            'KeyD': { type: 'MOVE', dx: 1, dy: 0 },
            'ArrowDown': { type: 'MOVE', dx: 0, dy: 1 },
            'KeyS': { type: 'MOVE', dx: 0, dy: 1 },

            // Special handling for up
            'ArrowUp': { type: 'UP_PRESSED' },
            'KeyW': { type: 'UP_PRESSED' },

            // Rotation
            'KeyZ': { type: 'ROTATE', direction: -1 },
            'ShiftLeft': { type: 'ROTATE', direction: -1 },
            'KeyX': { type: 'ROTATE', direction: 1 },
            'ControlLeft': { type: 'ROTATE', direction: 1 },
            'ControlRight': { type: 'ROTATE', direction: 1 },

            // Actions
            'Space': { type: 'SPACE' },
            'KeyC': { type: 'HOLD' },
            'ShiftRight': { type: 'HOLD' },
            'Escape': { type: 'ESCAPE' },
            'Enter': { type: 'ENTER' },
            'KeyP': { type: 'PAUSE' },

            // Ghost piece opacity
            'Equal': { type: 'ADJUST_GHOST', delta: 0.02 },
            'Minus': { type: 'ADJUST_GHOST', delta: -0.02 }
        };

        return mapping[keyCode];
    }

    /**
     * Check if key is a game key
     */
    isGameKey(keyCode) {
        const gameKeys = [
            'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp',
            'KeyA', 'KeyD', 'KeyS', 'KeyW',
            'KeyZ', 'KeyX', 'KeyC', 'KeyP',
            'Space', 'Enter', 'Escape',
            'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
            'Equal', 'Minus'
        ];
        return gameKeys.includes(keyCode);
    }

    /**
     * Touch start handler
     */
    onTouchStart(e) {
        e.preventDefault();

        const touch = e.touches[0];
        this.touch.startX = touch.clientX;
        this.touch.startY = touch.clientY;
        this.touch.startTime = Date.now();
        this.touch.isSwiping = false;

        // Start hold detection
        this.touch.holdTimer = setTimeout(() => {
            if (!this.touch.isSwiping) {
                this.startTouchHold();
            }
        }, 200);
    }

    /**
     * Touch move handler
     */
    onTouchMove(e) {
        e.preventDefault();

        if (!this.touch.startX || !this.touch.startY) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touch.startX;
        const deltaY = touch.clientY - this.touch.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Detect swipe start
        if (distance > 10) {
            this.touch.isSwiping = true;
            clearTimeout(this.touch.holdTimer);
        }

        // Process swipe
        if (distance > this.touch.swipeThreshold) {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            if (absX > absY) {
                // Horizontal swipe
                const action = { type: 'MOVE', dx: deltaX > 0 ? 1 : -1, dy: 0 };
                this.processAction(action);
                this.touch.startX = touch.clientX;
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    // Swipe down
                    const action = { type: 'MOVE', dx: 0, dy: 1 };
                    this.processAction(action);
                    this.touch.startY = touch.clientY;
                } else {
                    // Swipe up
                    const action = { type: 'ROTATE', direction: 1 };
                    this.processAction(action);
                    this.touch.startX = touch.clientX;
                    this.touch.startY = touch.clientY;
                }
            }
        }
    }

    /**
     * Touch end handler
     */
    onTouchEnd(e) {
        e.preventDefault();

        clearTimeout(this.touch.holdTimer);
        this.stopTouchHold();

        const touchDuration = Date.now() - this.touch.startTime;
        const now = Date.now();

        // Process tap
        if (!this.touch.isSwiping && touchDuration < this.touch.tapTimeout) {
            // Check for double tap
            if (now - this.touch.lastTapTime < this.touch.doubleTapTimeout) {
                // Double tap - hard drop
                const action = { type: 'HARD_DROP' };
                this.processAction(action);
                this.touch.lastTapTime = 0;
            } else {
                // Single tap - rotate
                const action = { type: 'ROTATE', direction: 1 };
                this.processAction(action);
                this.touch.lastTapTime = now;
            }
        }

        // Reset touch state
        this.touch.startX = 0;
        this.touch.startY = 0;
        this.touch.isSwiping = false;
    }

    /**
     * Start touch hold
     */
    startTouchHold() {
        this.touch.holdInterval = setInterval(() => {
            const action = { type: 'MOVE', dx: 0, dy: 1 };
            this.processAction(action);
        }, 50);
    }

    /**
     * Stop touch hold
     */
    stopTouchHold() {
        if (this.touch.holdInterval) {
            clearInterval(this.touch.holdInterval);
            this.touch.holdInterval = null;
        }
    }

    /**
     * Touch button press handler
     */
    onTouchButtonPress(actionType) {
        let action = null;

        switch (actionType) {
            case 'left':
                action = { type: 'MOVE', dx: -1, dy: 0 };
                break;
            case 'right':
                action = { type: 'MOVE', dx: 1, dy: 0 };
                break;
            case 'down':
                action = { type: 'MOVE', dx: 0, dy: 1 };
                break;
            case 'rotate':
                action = { type: 'ROTATE', direction: 1 };
                break;
            case 'drop':
                action = { type: 'HARD_DROP' };
                break;
            case 'hold':
                action = { type: 'HOLD' };
                break;
        }

        if (action) {
            this.processAction(action);

            // Start repeat for movement buttons
            if (action.type === 'MOVE') {
                this.startButtonRepeat(actionType, action);
            }
        }
    }

    /**
     * Touch button release handler
     */
    onTouchButtonRelease(actionType) {
        this.stopButtonRepeat(actionType);
    }

    /**
     * Start button repeat
     */
    startButtonRepeat(buttonType, action) {
        const key = `btn-${buttonType}`;

        // DAS
        const dasTimer = setTimeout(() => {
            // ARR
            const arrTimer = setInterval(() => {
                this.processAction(action);
            }, this.ARR_RATE);

            this.buttonRepeat.set(`${key}-arr`, arrTimer);
        }, this.DAS_DELAY);

        this.buttonRepeat.set(`${key}-das`, dasTimer);
    }

    /**
     * Stop button repeat
     */
    stopButtonRepeat(buttonType) {
        const key = `btn-${buttonType}`;

        // Clear DAS
        const dasTimer = this.buttonRepeat.get(`${key}-das`);
        if (dasTimer) {
            clearTimeout(dasTimer);
            this.buttonRepeat.delete(`${key}-das`);
        }

        // Clear ARR
        const arrTimer = this.buttonRepeat.get(`${key}-arr`);
        if (arrTimer) {
            clearInterval(arrTimer);
            this.buttonRepeat.delete(`${key}-arr`);
        }
    }

    /**
     * Process action based on game state
     */
    processAction(action) {
        const state = this.getState();

        // Handle based on game phase
        switch (state.phase) {
            case 'MENU':
                this.handleMenuInput(action);
                break;

            case 'COUNTDOWN':
                // No input during countdown
                break;

            case 'PLAYING':
            case 'LOCKING':
                this.handleGameplayInput(action);
                break;

            case 'CLEARING':
                // Limited input during clearing
                if (action.type === 'PAUSE' || action.type === 'ESCAPE') {
                    this.onAction({ type: 'PAUSE' });
                }
                break;

            case 'PAUSED':
                this.handlePausedInput(action);
                break;

            case 'GAME_OVER':
                this.handleGameOverInput(action);
                break;
        }
    }

    /**
     * Handle menu input
     */
    handleMenuInput(action) {
        // Check cooldown
        if (this.cooldowns.menuStart) return;

        // Start game on various inputs
        if (action.type === 'SPACE' ||
            action.type === 'ENTER' ||
            action.type === 'HARD_DROP' ||
            (action.type === 'ROTATE' && action.direction === 1)) {

            this.cooldowns.menuStart = true;
            setTimeout(() => {
                this.cooldowns.menuStart = false;
            }, this.cooldowns.menuStartTime);

            this.onAction({ type: 'START_GAME' });
        }
    }

    /**
     * Handle gameplay input
     */
    handleGameplayInput(action) {
        // Convert SPACE to hard drop during gameplay
        if (action.type === 'SPACE') {
            action = { type: 'HARD_DROP' };
        }

        // Convert ESCAPE to pause
        if (action.type === 'ESCAPE' || action.type === 'PAUSE') {
            if (!this.cooldowns.pause) {
                this.cooldowns.pause = true;
                setTimeout(() => {
                    this.cooldowns.pause = false;
                }, this.cooldowns.pauseTime);

                this.onAction({ type: 'PAUSE' });
            }
            return;
        }

        // Handle ghost piece opacity adjustment
        if (action.type === 'ADJUST_GHOST') {
            const current = this.config.get('graphics.ghostPieceOpacity') || 0.5;
            const newOpacity = Math.max(0.01, Math.min(1.0, current + action.delta));
            this.config.set('graphics.ghostPieceOpacity', newOpacity);
            return;
        }

        // Pass other actions through
        this.onAction(action);
    }

    /**
     * Handle paused input
     */
    handlePausedInput(action) {
        // Unpause on various inputs
        if (action.type === 'SPACE' ||
            action.type === 'ENTER' ||
            action.type === 'ESCAPE' ||
            action.type === 'PAUSE') {

            if (!this.cooldowns.pause) {
                this.cooldowns.pause = true;
                setTimeout(() => {
                    this.cooldowns.pause = false;
                }, this.cooldowns.pauseTime);

                this.onAction({ type: 'PAUSE' });
            }
        }
    }

    /**
     * Handle game over input
     */
    handleGameOverInput(action) {
        // Check cooldown
        if (this.cooldowns.gameOver) return;

        // Return to menu on specific inputs
        if (action.type === 'SPACE' ||
            action.type === 'ENTER' ||
            action.type === 'ESCAPE') {

            this.cooldowns.gameOver = true;
            setTimeout(() => {
                this.cooldowns.gameOver = false;
            }, this.cooldowns.gameOverTime);

            this.onAction({ type: 'RETURN_TO_MENU' });
        }
    }

    /**
     * Start auto repeat
     */
    startAutoRepeat(keyCode, action) {
        // DAS: Delayed Auto Shift
        const dasTimer = setTimeout(() => {
            // ARR: Auto Repeat Rate
            const arrTimer = setInterval(() => {
                if (this.keys.has(keyCode)) {
                    // Re-check if action is still valid
                    const state = this.getState();
                    if (isPlayingPhase(state.phase) || action.type === 'ADJUST_GHOST') {
                        if (action.type === 'ADJUST_GHOST') {
                            // Process ghost adjustment directly
                            this.processAction(action);
                        } else {
                            this.onAction(action);
                        }
                    } else {
                        // Stop if phase changed
                        clearInterval(arrTimer);
                        this.arr.delete(keyCode);
                    }
                } else {
                    // Key released
                    clearInterval(arrTimer);
                    this.arr.delete(keyCode);
                }
            }, this.ARR_RATE);

            this.arr.set(keyCode, arrTimer);
        }, this.DAS_DELAY);

        this.das.set(keyCode, dasTimer);
    }

    /**
     * Stop auto repeat
     */
    stopAutoRepeat(keyCode) {
        // Clear DAS
        const dasTimer = this.das.get(keyCode);
        if (dasTimer) {
            clearTimeout(dasTimer);
            this.das.delete(keyCode);
        }

        // Clear ARR
        const arrTimer = this.arr.get(keyCode);
        if (arrTimer) {
            clearInterval(arrTimer);
            this.arr.delete(keyCode);
        }
    }

    /**
     * Destroy controller
     */
    destroy() {
        // Remove listeners
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('touchstart', this.onTouchStart);
        document.removeEventListener('touchmove', this.onTouchMove);
        document.removeEventListener('touchend', this.onTouchEnd);

        // Clear all timers
        this.das.forEach(timer => clearTimeout(timer));
        this.arr.forEach(timer => clearInterval(timer));
        this.buttonRepeat.forEach(timer => {
            if (typeof timer === 'number') {
                clearTimeout(timer);
            } else {
                clearInterval(timer);
            }
        });

        // Clear touch timers
        clearTimeout(this.touch.holdTimer);
        clearInterval(this.touch.holdInterval);

        // Clear maps
        this.das.clear();
        this.arr.clear();
        this.keys.clear();
        this.buttonRepeat.clear();
    }

    /**
     * Update DAS setting
     */
    updateDAS(value) {
        this.DAS_DELAY = value;
        this.config.set('input.dasDelay', value);
    }

    /**
     * Update ARR setting
     */
    updateARR(value) {
        this.ARR_RATE = value;
        this.config.set('input.arrRate', value);
    }

    /**
     * Get input stats
     */
    getInputStats() {
        return {
            keysPressed: this.keys.size,
            dasDelay: this.DAS_DELAY,
            arrRate: this.ARR_RATE,
            lastInputMethod: this.inputMethod.lastUsed,
            touchControlsVisible: document.body.classList.contains('touch-device')
        };
    }

    /**
     * Toggle touch controls
     */
    toggleTouchControls() {
        if (document.body.classList.contains('touch-device')) {
            this.hideTouchControls();
            this.config.set('input.preferredControls', 'keyboard');
        } else {
            this.showTouchControls();
            this.config.set('input.preferredControls', 'touch');
        }
    }
}

