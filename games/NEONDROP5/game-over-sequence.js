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
        // Create the main overlay container
        this.container = document.createElement('div');
        this.container.className = 'clean-game-over-overlay';
        this.container.innerHTML = `
            <!-- Fade overlay that dims everything except death piece -->
            <div class="game-fade-overlay"></div>

            <!-- Clean score display -->
            <div class="clean-score-display">
                <div class="score-label">FINAL SCORE</div>
                <div class="score-value">0</div>
                <div class="high-score-indicator">NEW HIGH SCORE!</div>
            </div>

            <!-- Black fade overlay -->
            <div class="black-fade-overlay"></div>

            <!-- Leaderboard container -->
            <div class="leaderboard-container">
                <div class="leaderboard-header">LEADERBOARD</div>
                <div class="leaderboard-list">
                    <!-- Scores will be populated here -->
                </div>
                <button class="play-again-btn" data-action="play-again">
                    PLAY AGAIN
                </button>
            </div>
        `;

        document.body.appendChild(this.container);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle play again button
        this.container.querySelector('.play-again-btn').addEventListener('click', () => {
            this.handleChoice('play-again');
        });

        // Handle keyboard input
        this.keyHandler = (e) => {
            if (!this.isActive) return;

            if (e.key === 'Enter' || e.key === ' ') {
                if (this.phase === 'leaderboard') {
                    this.handleChoice('play-again');
                }
            }

            if (e.key === 'Escape') {
                this.handleChoice('menu');
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

        // Ensure UI is set up
        if (!this.container) {
            this.setupUI();
        }

        // Update score display
        this.container.querySelector('.score-value').textContent = this.finalScore.toLocaleString();
        this.container.querySelector('.high-score-indicator').style.display =
            this.isNewHighScore ? 'block' : 'none';

        // Start the clean sequence
        await this.executeCleanSequence();
    }

    async executeCleanSequence() {
        const gameCanvas = document.querySelector('canvas') || document.getElementById('game');
        const gameFadeOverlay = this.container.querySelector('.game-fade-overlay');
        const scoreDisplay = this.container.querySelector('.clean-score-display');
        const blackOverlay = this.container.querySelector('.black-fade-overlay');
        const leaderboardContainer = this.container.querySelector('.leaderboard-container');

        // Show the overlay
        this.container.style.display = 'block';

        // Phase 1: Game freezes, everything fades except death piece (3 seconds)
        this.phase = 'death-piece';

        // Freeze the game canvas
        if (gameCanvas) {
            gameCanvas.style.filter = 'none';
            gameCanvas.style.transform = 'none';
            gameCanvas.style.transition = 'none';
        }

        // Show fade overlay and score
        gameFadeOverlay.style.display = 'block';
        gameFadeOverlay.classList.add('fade-in');
        scoreDisplay.style.display = 'block';
        scoreDisplay.classList.add('fade-in');

        await this.wait(this.timings.deathPieceDisplay);

        // Phase 2: Smooth fade to black (1 second)
        this.phase = 'fade-to-black';
        blackOverlay.style.display = 'block';
        blackOverlay.classList.add('fade-in');

        await this.wait(this.timings.fadeToBlack);

        // Phase 3: Show leaderboard (0.5 seconds)
        this.phase = 'leaderboard';

        // Populate leaderboard
        await this.populateLeaderboard();

        // Show leaderboard
        leaderboardContainer.style.display = 'block';
        leaderboardContainer.classList.add('fade-in');

        // Focus the play again button
        setTimeout(() => {
            this.container.querySelector('.play-again-btn').focus();
        }, 200);

        await this.wait(this.timings.showLeaderboard);
    }

    async populateLeaderboard() {
        const leaderboardList = this.container.querySelector('.leaderboard-list');

        try {
            // Get leaderboard data
            const scores = await this.getLeaderboardScores();

            // Clear existing content
            leaderboardList.innerHTML = '';

            // Add scores
            scores.slice(0, 10).forEach((scoreEntry, index) => {
                const scoreItem = document.createElement('div');
                scoreItem.className = 'leaderboard-item';
                if (scoreEntry.score === this.finalScore && this.isNewHighScore) {
                    scoreItem.classList.add('current-score');
                }

                scoreItem.innerHTML = `
                    <span class="rank">${index + 1}</span>
                    <span class="name">${scoreEntry.name || 'Anonymous'}</span>
                    <span class="score">${scoreEntry.score.toLocaleString()}</span>
                `;

                leaderboardList.appendChild(scoreItem);
            });

            // If no scores, show placeholder
            if (scores.length === 0) {
                leaderboardList.innerHTML = `
                    <div class="leaderboard-item current-score">
                        <span class="rank">1</span>
                        <span class="name">You</span>
                        <span class="score">${this.finalScore.toLocaleString()}</span>
                    </div>
                `;
            }

        } catch (error) {
            // console.error('Error loading leaderboard:', error);
            // Fallback display
            leaderboardList.innerHTML = `
                <div class="leaderboard-item current-score">
                    <span class="rank">1</span>
                    <span class="name">You</span>
                    <span class="score">${this.finalScore.toLocaleString()}</span>
                </div>
            `;
        }
    }

    async getLeaderboardScores() {
        // Try to get scores from leaderboard system
        if (window.leaderboard && window.leaderboard.getTopScores) {
            return await window.leaderboard.getTopScores(10);
        }

        // Fallback to localStorage
        const stored = localStorage.getItem('neondrop5-scores');
        if (stored) {
            try {
                const scores = JSON.parse(stored);
                return scores.sort((a, b) => b.score - a.score);
            } catch (e) {
                return [];
            }
        }

        return [];
    }

    handleChoice(action) {
        if (!this.isActive) return;

        // Add button feedback
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
        switch(action) {
            case 'play-again':
                this.restartGame();
                break;
            case 'menu':
                this.returnToMenu();
                break;
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
        // Emit event for main game to handle
        window.dispatchEvent(new CustomEvent('gameOver', {
            detail: {
                action: 'menu',
                score: this.finalScore,
                isNewHighScore: this.isNewHighScore
            }
        }));
        this.hide();
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    hide() {
        this.isActive = false;
        this.phase = 'none';
        this.container.style.display = 'none';

        // Reset all states
        this.container.querySelectorAll('.game-fade-overlay, .clean-score-display, .black-fade-overlay, .leaderboard-container').forEach(el => {
            el.style.display = 'none';
            el.classList.remove('fade-in');
        });

        // Reset button states
        this.container.querySelectorAll('.play-again-btn').forEach(btn => {
            btn.classList.remove('clicked');
        });
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

// Clean minimal CSS
const CLEAN_GAME_OVER_CSS = `
/* ============ CLEAN GAME OVER OVERLAY ============ */
.clean-game-over-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
    z-index: 100;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Game fade overlay - dims everything except death piece */
.game-fade-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    opacity: 0;
    transition: opacity 0.8s ease-out;
    display: none;
}

.game-fade-overlay.fade-in {
    opacity: 1;
}

/* Clean score display */
.clean-score-display {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    opacity: 0;
    transition: opacity 0.8s ease-out;
    display: none;
}

.clean-score-display.fade-in {
    opacity: 1;
}

.score-label {
    font-size: 18px;
    font-weight: 300;
    color: #ffffff;
    margin-bottom: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
}

.score-value {
    font-size: 48px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 16px;
    line-height: 1;
}

.high-score-indicator {
    display: none;
    font-size: 14px;
    font-weight: 500;
    color: #4CAF50;
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* Black fade overlay */
.black-fade-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000000;
    opacity: 0;
    transition: opacity 1s ease-out;
    display: none;
}

.black-fade-overlay.fade-in {
    opacity: 1;
}

/* Leaderboard container */
.leaderboard-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    max-width: 500px;
    padding: 0 20px;
    opacity: 0;
    transition: opacity 0.6s ease-out;
    display: none;
}

.leaderboard-container.fade-in {
    opacity: 1;
}

.leaderboard-header {
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    text-align: center;
    margin-bottom: 30px;
    letter-spacing: 1px;
    text-transform: uppercase;
}

.leaderboard-list {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
    backdrop-filter: blur(10px);
}

.leaderboard-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-size: 16px;
}

.leaderboard-item:last-child {
    border-bottom: none;
}

.leaderboard-item.current-score {
    background: rgba(76, 175, 80, 0.1);
    border-radius: 4px;
    padding: 12px 16px;
    margin: 4px -16px;
    color: #4CAF50;
    font-weight: 600;
}

.leaderboard-item .rank {
    width: 40px;
    font-weight: 600;
    text-align: center;
}

.leaderboard-item .name {
    flex: 1;
    margin-left: 16px;
}

.leaderboard-item .score {
    font-weight: 600;
    font-family: 'Courier New', monospace;
}

/* Play again button */
.play-again-btn {
    display: block;
    width: 100%;
    padding: 16px 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.play-again-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
}

.play-again-btn:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
}

.play-again-btn.clicked {
    transform: translateY(0);
    background: rgba(255, 255, 255, 0.2);
}

/* Responsive design */
@media (max-width: 768px) {
    .score-value {
        font-size: 36px;
    }

    .leaderboard-header {
        font-size: 20px;
    }

    .leaderboard-item {
        font-size: 14px;
    }

    .play-again-btn {
        font-size: 14px;
        padding: 14px 20px;
    }
}

@media (max-width: 480px) {
    .score-label {
        font-size: 16px;
    }

    .score-value {
        font-size: 32px;
    }

    .leaderboard-container {
        padding: 0 16px;
    }

    .leaderboard-list {
        padding: 16px;
    }
}
`;

// Inject the CSS into the document
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = CLEAN_GAME_OVER_CSS;
    document.head.appendChild(styleElement);
}
