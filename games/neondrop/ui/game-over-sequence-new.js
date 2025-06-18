/**
 * Elegant Fade & Rise Game Over Sequence - AAA Quality Implementation
 * Premium, smooth animations with luxury feel
 */

export class GameOverSequence {
    constructor() {
        this.isActive = false;
        this.finalScore = 0;
        this.gameMetrics = null;
        this.container = null;
        
        // Elegant timing for smooth experience
        this.timings = {
            gameBlur: 800,         // Time to blur the game
            scoreCountUp: 1500,    // Score animation duration
            cardSlideUp: 600,      // Card slide animation
            buttonFadeIn: 400      // Button appearance
        };
    }

    show(score, metrics = {}) {
        this.finalScore = score;
        this.gameMetrics = metrics;
        this.isActive = true;
        
        console.log('🎭 Starting Elegant Fade & Rise sequence');
        
        this.startElegantSequence();
    }

    async startElegantSequence() {
        // Step 1: Elegant game blur and fade
        await this.blurGameBoard();
        
        // Step 2: Animated score count-up
        await this.showScoreAnimation();
        
        // Step 3: Slide up the action card
        await this.slideUpActionCard();
        
        // Step 4: Fade in action buttons
        this.fadeInActionButtons();
    }

    async blurGameBoard() {
        return new Promise(resolve => {
            // Get the game canvas
            const gameCanvas = document.getElementById('game');
            const bgCanvas = document.getElementById('bg');
            
            // Create overlay for blur effect
            this.createOverlay();
            
            // Apply elegant blur transition
            if (gameCanvas) {
                gameCanvas.style.transition = `filter ${this.timings.gameBlur}ms cubic-bezier(0.4, 0, 0.2, 1)`;
                gameCanvas.style.filter = 'blur(8px) brightness(0.3)';
            }
            
            if (bgCanvas) {
                bgCanvas.style.transition = `filter ${this.timings.gameBlur}ms cubic-bezier(0.4, 0, 0.2, 1)`;
                bgCanvas.style.filter = 'blur(12px) brightness(0.2)';
            }
            
            setTimeout(resolve, this.timings.gameBlur);
        });
    }

    async showScoreAnimation() {
        return new Promise(resolve => {
            const content = this.container.querySelector('.game-over-content');
            
            // Create score display
            const scoreDisplay = document.createElement('div');
            scoreDisplay.className = 'score-animation';
            scoreDisplay.innerHTML = `
                <div class="score-label">Final Score</div>
                <div class="score-number" id="animated-score">0</div>
                <div class="score-glow"></div>
            `;
            
            content.appendChild(scoreDisplay);
            
            // Animate score count-up
            this.animateScoreCountUp();
            
            setTimeout(resolve, this.timings.scoreCountUp);
        });
    }

    animateScoreCountUp() {
        const scoreElement = document.getElementById('animated-score');
        if (!scoreElement) return;
        
        const startScore = 0;
        const endScore = this.finalScore;
        const duration = this.timings.scoreCountUp;
        const startTime = performance.now();
        
        const updateScore = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentScore = Math.floor(startScore + (endScore - startScore) * easeOut);
            
            scoreElement.textContent = currentScore.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateScore);
            }
        };
        
        requestAnimationFrame(updateScore);
    }

    async slideUpActionCard() {
        return new Promise(resolve => {
            const content = this.container.querySelector('.game-over-content');
            
            // Create action card
            const actionCard = document.createElement('div');
            actionCard.className = 'action-card';
            actionCard.innerHTML = `
                <div class="card-header">
                    <h3>Game Complete</h3>
                    <div class="game-stats">
                        <div class="stat">
                            <span class="stat-label">Level</span>
                            <span class="stat-value">${this.gameMetrics.level || 1}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Lines</span>
                            <span class="stat-value">${this.gameMetrics.lines || 0}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Time</span>
                            <span class="stat-value">${this.formatTime(this.gameMetrics.time || 0)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-actions">
                    <!-- Buttons will fade in separately -->
                </div>
            `;
            
            content.appendChild(actionCard);
            
            // Trigger slide-up animation
            setTimeout(() => {
                actionCard.classList.add('slide-up');
                setTimeout(resolve, this.timings.cardSlideUp);
            }, 100);
        });
    }

    fadeInActionButtons() {
        const actionsContainer = this.container.querySelector('.card-actions');
        if (!actionsContainer) return;
        
        // Create elegant action buttons
        actionsContainer.innerHTML = `
            <button class="action-btn primary" data-action="play-again">
                <span class="btn-icon">🎮</span>
                <span class="btn-text">Play Again</span>
            </button>
            
            <button class="action-btn secondary" data-action="leaderboard">
                <span class="btn-icon">🏆</span>
                <span class="btn-text">Leaderboard</span>
            </button>
            
            <button class="action-btn tertiary" data-action="menu">
                <span class="btn-icon">🏠</span>
                <span class="btn-text">Main Menu</span>
            </button>
        `;
        
        // Add click handlers
        actionsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (btn) {
                const action = btn.dataset.action;
                this.handleAction(action);
            }
        });
        
        // Fade in buttons with stagger
        const buttons = actionsContainer.querySelectorAll('.action-btn');
        buttons.forEach((btn, index) => {
            setTimeout(() => {
                btn.classList.add('fade-in');
            }, index * 150);
        });
    }

    createOverlay() {
        // Remove any existing overlay
        this.destroy();
        
        // Create elegant overlay
        this.container = document.createElement('div');
        this.container.className = 'game-over-overlay elegant-fade-rise';
        this.container.innerHTML = `
            <div class="elegant-backdrop"></div>
            <div class="game-over-content"></div>
        `;
        
        document.body.appendChild(this.container);
        
        // Trigger initial fade-in
        setTimeout(() => {
            this.container.classList.add('active');
        }, 50);
    }

    handleAction(action) {
        console.log('🎮 Game over action:', action);
        
        // Add elegant exit animation
        this.container.classList.add('exiting');
        
        setTimeout(() => {
            // Dispatch the action
            document.dispatchEvent(new CustomEvent('gameOverChoice', {
                detail: { action, score: this.finalScore }
            }));
            
            this.destroy();
        }, 300);
    }

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    destroy() {
        if (this.container) {
            // Clear blur effects
            const gameCanvas = document.getElementById('game');
            const bgCanvas = document.getElementById('bg');
            
            if (gameCanvas) {
                gameCanvas.style.filter = '';
                gameCanvas.style.transition = '';
            }
            
            if (bgCanvas) {
                bgCanvas.style.filter = '';
                bgCanvas.style.transition = '';
            }
            
            // Remove overlay
            this.container.remove();
            this.container = null;
        }
        
        this.isActive = false;
    }
}
