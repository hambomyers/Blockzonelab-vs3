/**
 * game-over-sequence.js - Clean Minimal Game Over
 *
 * Simple sequence: Game freezes ? Everything fades except death piece ?
 * Clean centered score for 3 seconds ? Smooth fade to black ?
 * Direct to leaderboard with Play Again button at bottom
 */

export class GameOverSequence {
    constructor() {
        this.isActive = false;
        this.phase = 'none';
        this.finalScore = 0;
        this.isNewHighScore = false;
        this.deathPiecePosition = null;
        this.container = null;

        // Clean timings
        this.timings = {
            deathPieceDisplay: 3000,  // 3 seconds for score display
            fadeToBlack: 1000,        // 1 second fade to black
            showLeaderboard: 500      // 0.5 seconds to show leaderboard
        };
    }

    setupUI() {
        // Create the main overlay container using Japanese MA-inspired design
        this.container = document.createElement('div');
        this.container.className = 'game-over-overlay';
        this.container.innerHTML = `
            <!-- Japanese MA-inspired game over content -->
            <div class="game-over-content">
                <!-- Final score display with breathing room -->
                <div class="final-score-display">
                    <div class="final-score-label">Final Score</div>
                    <div class="final-score-value">0</div>
                    <div class="high-score-indicator">✦ NEW HIGH SCORE ✦</div>
                </div>

                <!-- Choice buttons with generous spacing -->
                <div class="game-over-choices">
                    <button class="game-over-btn primary-btn" data-action="play-again">
                        <span class="btn-icon">↻</span>
                        <span class="btn-text">Play Again</span>
                        <span class="btn-shortcut">ENTER</span>
                    </button>
                    
                    <button class="game-over-btn secondary-btn" data-action="leaderboard">
                        <span class="btn-icon">👑</span>
                        <span class="btn-text">View Leaderboard</span>
                        <span class="btn-shortcut">L</span>
                    </button>
                    
                    <button class="game-over-btn tertiary-btn" data-action="menu">
                        <span class="btn-icon">🏠</span>
                        <span class="btn-text">Main Menu</span>
                        <span class="btn-shortcut">ESC</span>
                    </button>
                </div>

                <!-- Game stats with MA spacing -->
                <div class="game-stats-summary">
                    <div class="stat-item">
                        <span class="stat-label">Lines</span>
                        <span class="stat-value">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Level</span>
                        <span class="stat-value">1</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Time</span>
                        <span class="stat-value">0:00</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle all game over button clicks
        this.container.addEventListener('click', (e) => {
            console.log('Game over container clicked', e.target);
            const button = e.target.closest('.game-over-btn');
            if (button) {
                const action = button.getAttribute('data-action');
                console.log('Button clicked with action:', action);
                this.handleChoice(action);
            }
        });

        // Handle keyboard input with MA-inspired graceful interactions
        this.keyHandler = (e) => {
            if (!this.isActive || this.phase !== 'choices') return;

            switch (e.key) {
                case 'Enter':
                case ' ':
                    this.handleChoice('play-again');
                    break;
                case 'l':
                case 'L':
                    this.handleChoice('leaderboard');
                    break;
                case 'Escape':
                    this.handleChoice('menu');
                    break;
                case '1':
                    this.handleChoice('play-again');
                    break;
                case '2':
                    this.handleChoice('leaderboard');
                    break;
                case '3':
                    this.handleChoice('menu');
                    break;
            }
        };

        document.addEventListener('keydown', this.keyHandler);
    }

    async start(gameState) {
        if (this.isActive) return;

        this.isActive = true;
        this.finalScore = gameState.score || 0;
        this.isNewHighScore = gameState.isNewHighScore || false;
        this.deathPiecePosition = gameState.deathPiecePosition || null;

        // Notify stats panel about game completion
        window.dispatchEvent(new CustomEvent('gameCompleted', {
            detail: {
                score: this.finalScore,
                linesCleared: gameState.linesCleared || 0,
                level: gameState.level || 1,
                gameTime: gameState.gameTime || 0,
                maxCombo: gameState.maxCombo || 0,
                isNewHighScore: this.isNewHighScore
            }
        }));

        // Automatically submit score to leaderboard
        await this.submitScoreToLeaderboard(gameState);

        // Ensure UI is set up
        if (!this.container) {
            this.setupUI();
        }

        // Update score display with Japanese MA spacing
        this.container.querySelector('.final-score-value').textContent = this.finalScore.toLocaleString();
        this.container.querySelector('.high-score-indicator').style.display =
            this.isNewHighScore ? 'block' : 'none';

        // Update game stats
        this.updateGameStats(gameState);

        // Start the Japanese MA-inspired sequence
        await this.executeMASequence();
    }

    updateGameStats(gameState) {
        const statElements = this.container.querySelectorAll('.stat-value');
        
        // Update lines cleared
        if (statElements[0]) {
            statElements[0].textContent = (gameState.linesCleared || 0).toString();
        }
        
        // Update level
        if (statElements[1]) {
            statElements[1].textContent = (gameState.level || 1).toString();
        }
        
        // Update time (format as MM:SS)
        if (statElements[2] && gameState.gameTime) {
            const minutes = Math.floor(gameState.gameTime / 60000);
            const seconds = Math.floor((gameState.gameTime % 60000) / 1000);
            statElements[2].textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    async executeMASequence() {
        // Japanese MA (間) principle: beauty through thoughtful pauses and space
        
        // Phase 1: Gentle appearance with death pulse
        this.phase = 'death-pulse';
        this.container.style.display = 'flex';
        this.container.classList.add('death-pulse');
        
        // Brief moment to absorb the game over state
        await this.wait(800);
        
        // Phase 2: Reveal score with breathing space
        this.phase = 'score';
        this.container.classList.add('show-score');
        
        // Let the score settle with generous time for reflection
        await this.wait(2000);
        
        // Phase 3: Present choices with MA spacing
        this.phase = 'choices';
        this.container.classList.remove('death-pulse');
        this.container.classList.add('show-choices');
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    handleChoice(action) {
        console.log('handleChoice called with action:', action);
        if (!this.isActive) {
            console.log('GameOverSequence not active, ignoring choice');
            return;
        }

        // Add button feedback with Japanese MA consideration for interaction
        const clickedBtn = this.container.querySelector(`[data-action="${action}"]`);
        if (clickedBtn) {
            clickedBtn.classList.add('clicked');
        }

        // Execute action after brief delay for visual feedback
        setTimeout(() => {
            this.executeChoice(action);
        }, 150);
    }

    executeChoice(action) {
        console.log('executeChoice called with action:', action);
        switch(action) {
            case 'play-again':
                console.log('Executing play-again');
                this.restartGame();
                break;
            case 'leaderboard':
                console.log('Executing leaderboard');
                this.showLeaderboard();
                break;
            case 'menu':
                console.log('Executing menu');
                this.returnToMenu();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    /**
     * Submit score to leaderboard automatically when game ends
     */
    async submitScoreToLeaderboard(gameState) {
        try {
            console.log('Auto-submitting score to leaderboard:', this.finalScore);
            
            // Import leaderboard module
            const leaderboardModule = await import('./leaderboard.js');
            const leaderboardSystem = new leaderboardModule.LeaderboardSystem();
            
            // Prepare score data that matches what the leaderboard expects
            const scoreData = {
                score: this.finalScore,
                finalHash: gameState.finalHash || 'no-hash', // From anti-cheat system
                metrics: {
                    apm: gameState.apm || 0,
                    pps: gameState.pps || 0,
                    gameTime: gameState.gameTime || 0,
                    linesCleared: gameState.linesCleared || 0,
                    level: gameState.level || 1
                }
            };
            
            // Submit to leaderboard
            const result = await leaderboardSystem.submitScore(scoreData);
            console.log('Score submitted successfully:', result);
            
            // Check if this is a new high score based on leaderboard response
            if (result && (result.isHighScore || result.isNewRecord)) {
                this.isNewHighScore = true;
            }
            
        } catch (error) {
            console.error('Failed to submit score to leaderboard:', error);
            // Continue with game over sequence even if submission fails
        }
    }

    async showLeaderboard() {
        console.log('showLeaderboard called');
        try {
            // PROFESSIONAL FIX: Use the main.js leaderboard system instead of creating duplicate
            console.log('Using existing global leaderboard system');
            
            // Disable game over key handler to prevent conflicts
            if (this.keyHandler) {
                document.removeEventListener('keydown', this.keyHandler);
            }
            
            // Hide the game over choices
            this.container.style.display = 'none';
            
            // Use the global leaderboard UI from main.js
            if (window.leaderboardUI) {
                console.log('Showing global leaderboard with score:', this.finalScore);
                await window.leaderboardUI.show(this.finalScore);
                
                // Override the hide method to restore game over screen
                const originalHide = window.leaderboardUI.hide.bind(window.leaderboardUI);
                window.leaderboardUI.hide = () => {
                    console.log('Leaderboard hiding, returning to game over choices');
                    originalHide();
                    // Re-enable game over key handler
                    if (this.keyHandler) {
                        document.addEventListener('keydown', this.keyHandler);
                    }
                    this.container.style.display = 'flex';
                    // Restore original hide method
                    window.leaderboardUI.hide = originalHide;
                };
            } else {
                console.error('Global leaderboard UI not found');
                throw new Error('Leaderboard system not available');
            }
            
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            // Re-enable key handler on error
            if (this.keyHandler) {
                document.addEventListener('keydown', this.keyHandler);
            }
            this.container.style.display = 'flex';
        }
    }

    restartGame() {
        // Emit event for main game to handle
        window.dispatchEvent(new CustomEvent('gameOver', {
            detail: {
                action: 'restart',
                score: this.finalScore,
                isNewHighScore: this.isNewHighScore
            }
        }));
        this.hide();
    }

    returnToMenu() {
        // Navigate back to the main portal
        window.location.href = '../../index.html';
    }

    hide() {
        this.isActive = false;
        this.phase = 'none';
        
        // Graceful fade out following MA principles
        this.container.classList.add('fade-out');
        
        setTimeout(() => {
            this.container.style.display = 'none';
            this.container.classList.remove('fade-out', 'show-score', 'show-choices', 'death-pulse');
        }, 300);
    }

    cleanup() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}


