/**
 * game-flow-manager.js - Professional State Machine for NEONDROP5
 * 
 * Manages all user interaction states from game over to leaderboard display.
 * Designed for Sonic Labs Web3 integration and professional UX.
 */

export class GameFlowManager {
    constructor() {
        this.currentState = null;
        this.stateStack = [];
        this.gameData = null;
        this.playerData = {
            name: localStorage.getItem('neon_drop_username') || '',
            playerId: this.generatePlayerId(),
            isAnonymous: false
        };
        
        // State definitions
        this.STATES = {
            GAME_OVER: 'game_over',
            NAME_ENTRY: 'name_entry', 
            SCORE_SUBMISSION: 'score_submission',
            LEADERBOARD_DISPLAY: 'leaderboard_display',
            // Future Sonic Labs states
            WALLET_CONNECT: 'wallet_connect',
            TOKEN_REWARD: 'token_reward'
        };

        // Active UI components
        this.activeComponents = new Map();
        this.globalKeyHandler = null;
        
        this.initializeStateHandlers();
    }

    /**
     * Initialize the state machine with game over data
     */
    async initialize(gameState) {
        console.log('🎮 GameFlowManager: Initializing with game state:', gameState);
        
        this.gameData = {
            score: gameState.score || 0,
            level: gameState.level || 1,
            linesCleared: gameState.linesCleared || 0,
            gameTime: gameState.gameTime || 0,
            apm: gameState.apm || 0,
            pps: gameState.pps || 0,
            finalHash: gameState.finalHash || 'no-hash',
            isNewHighScore: gameState.isNewHighScore || false,
            deathPiecePosition: gameState.deathPiecePosition || null
        };

        // Start with game over state
        await this.transitionTo(this.STATES.GAME_OVER);
    }

    /**
     * Clean state transition between UI states
     */
    async transitionTo(newState, data = {}) {
        console.log(`🔄 State transition: ${this.currentState} → ${newState}`);
        
        // Cleanup current state
        if (this.currentState) {
            await this.exitState(this.currentState);
        }
        
        // Push to state stack for back navigation
        if (this.currentState) {
            this.stateStack.push(this.currentState);
        }
        
        // Enter new state
        this.currentState = newState;
        await this.enterState(newState, data);
    }

    /**
     * Go back to previous state
     */
    async goBack() {
        if (this.stateStack.length > 0) {
            const previousState = this.stateStack.pop();
            console.log(`⬅️ Going back to: ${previousState}`);
            
            // Clean current state without adding to stack
            if (this.currentState) {
                await this.exitState(this.currentState);
            }
            
            this.currentState = previousState;
            await this.enterState(previousState);
        }
    }

    /**
     * Setup global key handling
     */
    initializeStateHandlers() {
        // Single global key handler that routes to active state
        this.globalKeyHandler = (event) => {
            if (this.currentState) {
                this.handleStateInput(this.currentState, event);
            }
        };
        
        document.addEventListener('keydown', this.globalKeyHandler);
    }

    /**
     * Route input to the appropriate state handler
     */
    handleStateInput(state, event) {
        const handlers = {
            [this.STATES.GAME_OVER]: this.handleGameOverInput.bind(this),
            [this.STATES.NAME_ENTRY]: this.handleNameEntryInput.bind(this),
            [this.STATES.LEADERBOARD_DISPLAY]: this.handleLeaderboardInput.bind(this)
        };

        const handler = handlers[state];
        if (handler) {
            handler(event);
        }
    }

    /**
     * GAME_OVER state management
     */
    async enterGameOver() {
        console.log('🎯 Entering GAME_OVER state');
        
        // Import and create game over component
        const { GameOverSequence } = await import('./game-over-sequence.js');
        const gameOverUI = new GameOverSequence();
        
        // Store component reference
        this.activeComponents.set('gameOver', gameOverUI);
        
        // Setup the UI with our game data
        gameOverUI.setupUI();
        
        // Start the sequence but with our state machine handling choices
        await gameOverUI.start(this.gameData);
        
        // Override the choice handling to use our state machine
        gameOverUI.handleChoice = (action) => {
            this.handleGameOverChoice(action);
        };
        
        console.log('✅ GAME_OVER state ready');
    }

    async exitGameOver() {
        console.log('👋 Exiting GAME_OVER state');
        const gameOverUI = this.activeComponents.get('gameOver');
        if (gameOverUI) {
            gameOverUI.cleanup();
            this.activeComponents.delete('gameOver');
        }
    }

    handleGameOverInput(event) {
        const { code, key } = event;
        
        switch (code) {
            case 'Enter':
            case 'Space':
                event.preventDefault();
                this.handleGameOverChoice('play-again');
                break;
            case 'KeyL':
                event.preventDefault();
                this.handleGameOverChoice('leaderboard');
                break;
            case 'Escape':
                event.preventDefault();
                this.handleGameOverChoice('menu');
                break;
            case 'Digit1':
                event.preventDefault();
                this.handleGameOverChoice('play-again');
                break;
            case 'Digit2':
                event.preventDefault();
                this.handleGameOverChoice('leaderboard');
                break;
            case 'Digit3':
                event.preventDefault();
                this.handleGameOverChoice('menu');
                break;
        }
    }

    async handleGameOverChoice(action) {
        console.log(`🎮 Game over choice: ${action}`);
        
        switch (action) {
            case 'play-again':
                this.restartGame();
                break;
            case 'leaderboard':
                await this.transitionTo(this.STATES.NAME_ENTRY);
                break;
            case 'menu':
                this.returnToMenu();
                break;
        }
    }

    /**
     * NAME_ENTRY state management
     */
    async enterNameEntry() {
        console.log('📝 Entering NAME_ENTRY state');
        
        // Create name entry UI
        await this.createNameEntryUI();
        
        console.log('✅ NAME_ENTRY state ready');
    }

    async exitNameEntry() {
        console.log('👋 Exiting NAME_ENTRY state');
        const nameEntryUI = this.activeComponents.get('nameEntry');
        if (nameEntryUI && nameEntryUI.container) {
            nameEntryUI.container.remove();
            this.activeComponents.delete('nameEntry');
        }
    }

    async createNameEntryUI() {
        const container = document.createElement('div');
        container.className = 'name-entry-overlay';
        container.innerHTML = `
            <div class="name-entry-content">
                <div class="name-entry-header">
                    <h2>🏆 IMMORTALIZE YOUR SCORE</h2>
                    <div class="score-display">Your Score: ${this.gameData.score.toLocaleString()} Points</div>
                </div>
                
                <div class="name-entry-form">
                    <label for="champion-name">Enter Your Champion Name:</label>
                    <input 
                        type="text" 
                        id="champion-name" 
                        maxlength="16" 
                        placeholder="CHAMPION"
                        value="${this.playerData.name}"
                        autocomplete="off"
                    >
                    <div class="character-count">
                        <span id="char-count">${this.playerData.name.length}</span>/16 characters
                    </div>
                    <div class="name-preview">
                        Will appear as: <span id="name-preview">${this.playerData.name || 'CHAMPION'}</span> - ${this.gameData.score.toLocaleString()}
                    </div>
                </div>
                
                <div class="name-entry-actions">
                    <button class="primary-btn" id="submit-score">
                        <span class="btn-icon">🚀</span>
                        <span class="btn-text">Submit to Leaderboard</span>
                        <span class="btn-shortcut">ENTER</span>
                    </button>
                    
                    <button class="secondary-btn" id="anonymous-submit">
                        <span class="btn-icon">👤</span>
                        <span class="btn-text">Play as Anonymous</span>
                        <span class="btn-shortcut">TAB</span>
                    </button>
                    
                    <button class="tertiary-btn" id="back-to-game-over">
                        <span class="btn-icon">←</span>
                        <span class="btn-text">Back</span>
                        <span class="btn-shortcut">ESC</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // Setup interactive elements
        const nameInput = container.querySelector('#champion-name');
        const charCount = container.querySelector('#char-count');
        const namePreview = container.querySelector('#name-preview');
        const submitBtn = container.querySelector('#submit-score');
        const anonymousBtn = container.querySelector('#anonymous-submit');
        const backBtn = container.querySelector('#back-to-game-over');

        // Real-time name updates
        nameInput.addEventListener('input', (e) => {
            const name = e.target.value.slice(0, 16);
            e.target.value = name;
            charCount.textContent = name.length;
            namePreview.textContent = name || 'CHAMPION';
            this.playerData.name = name;
        });

        // Button handlers
        submitBtn.addEventListener('click', () => this.submitWithName());
        anonymousBtn.addEventListener('click', () => this.submitAnonymous());
        backBtn.addEventListener('click', () => this.goBack());

        // Auto-focus the input
        setTimeout(() => nameInput.focus(), 100);

        // Store component reference
        this.activeComponents.set('nameEntry', { container, nameInput });
    }

    handleNameEntryInput(event) {
        const { code } = event;
        
        switch (code) {
            case 'Enter':
                event.preventDefault();
                this.submitWithName();
                break;
            case 'Tab':
                event.preventDefault();
                this.submitAnonymous();
                break;
            case 'Escape':
                event.preventDefault();
                this.goBack();
                break;
        }
    }

    /**
     * Score submission actions
     */
    async submitWithName() {
        const name = this.playerData.name.trim();
        if (name.length === 0) {
            // Flash the input field to indicate name is required
            const nameEntry = this.activeComponents.get('nameEntry');
            if (nameEntry?.nameInput) {
                nameEntry.nameInput.classList.add('error-flash');
                setTimeout(() => {
                    nameEntry.nameInput.classList.remove('error-flash');
                }, 500);
            }
            return;
        }

        this.playerData.isAnonymous = false;
        this.playerData.displayName = name;
        
        // Save name for future games
        localStorage.setItem('neon_drop_username', name);
        
        await this.transitionTo(this.STATES.SCORE_SUBMISSION);
    }

    async submitAnonymous() {
        this.playerData.isAnonymous = true;
        this.playerData.displayName = `Player ${this.playerData.playerId.slice(0, 6)}`;
        
        await this.transitionTo(this.STATES.SCORE_SUBMISSION);
    }

    /**
     * SCORE_SUBMISSION state management
     */
    async enterScoreSubmission() {
        console.log('📤 Entering SCORE_SUBMISSION state');
        
        // Show loading UI
        await this.createSubmissionUI();
        
        // Submit the score
        await this.performScoreSubmission();
        
        // Transition to leaderboard
        await this.transitionTo(this.STATES.LEADERBOARD_DISPLAY);
    }

    async createSubmissionUI() {
        const container = document.createElement('div');
        container.className = 'submission-overlay';
        container.innerHTML = `
            <div class="submission-content">
                <div class="submission-spinner">⚡</div>
                <h2>Submitting Score...</h2>
                <div class="submission-details">
                    ${this.playerData.displayName} - ${this.gameData.score.toLocaleString()} points
                </div>
                <div class="submission-progress">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.activeComponents.set('submission', { container });

        // Animate progress bar
        const progressFill = container.querySelector('.progress-fill');
        progressFill.style.width = '100%';
    }

    async performScoreSubmission() {
        try {
            console.log('📡 Submitting score to leaderboard...');
            
            // Import leaderboard system
            const { LeaderboardSystem } = await import('./leaderboard.js');
            const leaderboard = new LeaderboardSystem();
            
            // Prepare submission data
            const scoreData = {
                score: this.gameData.score,
                finalHash: this.gameData.finalHash,
                metrics: {
                    apm: this.gameData.apm,
                    pps: this.gameData.pps,
                    gameTime: this.gameData.gameTime,
                    linesCleared: this.gameData.linesCleared,
                    level: this.gameData.level
                }
            };
            
            // Submit score
            const result = await leaderboard.submitScore(scoreData);
            
            // Store submission result
            this.submissionResult = result;
            
            console.log('✅ Score submitted successfully:', result);
            
        } catch (error) {
            console.error('❌ Score submission failed:', error);
            this.submissionResult = { success: false, error: error.message };
        }
    }

    async exitScoreSubmission() {
        const submissionUI = this.activeComponents.get('submission');
        if (submissionUI?.container) {
            submissionUI.container.remove();
            this.activeComponents.delete('submission');
        }
    }

    /**
     * LEADERBOARD_DISPLAY state management
     */
    async enterLeaderboardDisplay() {
        console.log('🏆 Entering LEADERBOARD_DISPLAY state');
        
        // Import and create leaderboard UI
        const [leaderboardModule, uiModule] = await Promise.all([
            import('./leaderboard.js'),
            import('./arcade-leaderboard-ui.js')
        ]);
        
        const leaderboardSystem = new leaderboardModule.LeaderboardSystem();
        const arcadeUI = new uiModule.ArcadeLeaderboardUI(leaderboardSystem);
        
        // Store component reference
        this.activeComponents.set('leaderboard', arcadeUI);
        
        // Override the leaderboard's event handling
        arcadeUI.isVisible = true;
        
        // Show leaderboard with our score
        await arcadeUI.show(this.gameData.score);
        
        console.log('✅ LEADERBOARD_DISPLAY state ready');
    }

    async exitLeaderboardDisplay() {
        console.log('👋 Exiting LEADERBOARD_DISPLAY state');
        const leaderboardUI = this.activeComponents.get('leaderboard');
        if (leaderboardUI) {
            leaderboardUI.hide();
            this.activeComponents.delete('leaderboard');
        }
    }

    handleLeaderboardInput(event) {
        const { code } = event;
        
        switch (code) {
            case 'Space':
            case 'Enter':
            case 'Escape':
                event.preventDefault();
                this.goBack();
                break;
        }
    }

    /**
     * State entry/exit router
     */
    async enterState(state, data = {}) {
        const handlers = {
            [this.STATES.GAME_OVER]: this.enterGameOver.bind(this),
            [this.STATES.NAME_ENTRY]: this.enterNameEntry.bind(this),
            [this.STATES.SCORE_SUBMISSION]: this.enterScoreSubmission.bind(this),
            [this.STATES.LEADERBOARD_DISPLAY]: this.enterLeaderboardDisplay.bind(this)
        };

        const handler = handlers[state];
        if (handler) {
            await handler(data);
        }
    }

    async exitState(state) {
        const handlers = {
            [this.STATES.GAME_OVER]: this.exitGameOver.bind(this),
            [this.STATES.NAME_ENTRY]: this.exitNameEntry.bind(this),
            [this.STATES.SCORE_SUBMISSION]: this.exitScoreSubmission.bind(this),
            [this.STATES.LEADERBOARD_DISPLAY]: this.exitLeaderboardDisplay.bind(this)
        };

        const handler = handlers[state];
        if (handler) {
            await handler();
        }
    }

    /**
     * Game control actions
     */
    restartGame() {
        console.log('🔄 Restarting game...');
        window.dispatchEvent(new CustomEvent('gameOver', {
            detail: {
                action: 'restart',
                score: this.gameData.score,
                isNewHighScore: this.gameData.isNewHighScore
            }
        }));
        this.cleanup();
    }

    returnToMenu() {
        console.log('🏠 Returning to main menu...');
        window.location.href = '../../index.html';
    }

    /**
     * Utilities
     */
    generatePlayerId() {
        let playerId = localStorage.getItem('neon_drop_player_id');
        if (!playerId) {
            playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('neon_drop_player_id', playerId);
        }
        return playerId;
    }

    /**
     * Cleanup when flow is complete
     */
    cleanup() {
        console.log('🧹 Cleaning up GameFlowManager...');
        
        // Remove global event listener
        if (this.globalKeyHandler) {
            document.removeEventListener('keydown', this.globalKeyHandler);
            this.globalKeyHandler = null;
        }
        
        // Cleanup all active components
        for (const [name, component] of this.activeComponents) {
            if (component.cleanup) {
                component.cleanup();
            } else if (component.container) {
                component.container.remove();
            }
        }
        
        this.activeComponents.clear();
        this.currentState = null;
        this.stateStack = [];
    }
}
