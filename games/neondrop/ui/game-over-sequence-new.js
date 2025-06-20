/**
 * AAA Quality Game Over Sequence - Cinematic Stats Reveal
 * Professional, smooth, and handles API failures gracefully
 */
export class GameOverSequence {
    constructor() {
        this.finalScore = 0;
        this.playerRank = null;
        this.totalPlayers = null;
        this.isNewBest = false;
        this.previousBest = 0;
        this.earnings = 0;
        
        // Animation state
        this.isAnimating = false;
        this.animationStep = 0;
        
        // Create overlay
        this.createOverlay();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'game-over-overlay';
        this.overlay.innerHTML = `
            <div class="game-over-modal">
                <div class="game-over-header">
                    <h1 class="game-over-title">Game Over</h1>
                    <div class="score-divider"></div>
                </div>
                
                <div class="stats-container">
                    <div class="stat-card score-card">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-label">Your Score</div>
                        <div class="stat-value score-value">0</div>
                        <div class="stat-badge best-badge hidden">New Best!</div>
                    </div>
                    
                    <div class="stat-card rank-card">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-label">Your Rank</div>
                        <div class="stat-value rank-value">---</div>
                        <div class="stat-subtext rank-subtext">Loading...</div>
                    </div>
                    
                    <div class="stat-card earnings-card">
                        <div class="stat-icon">💎</div>
                        <div class="stat-label">Earnings</div>
                        <div class="stat-value earnings-value">0</div>
                        <div class="stat-subtext">QUARTERS</div>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-primary play-again-btn">
                        <span class="btn-icon">🎮</span>
                        Play Again
                    </button>
                    <button class="btn-secondary leaderboard-btn">
                        <span class="btn-icon">📊</span>
                        Leaderboard
                    </button>
                </div>
                
                <div class="loading-indicator">
                    <div class="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span class="loading-text">Submitting score...</span>
                </div>
            </div>
        `;
        
        // Add to body but hide initially
        this.overlay.style.display = 'none';
        document.body.appendChild(this.overlay);
        
        // Bind events
        this.bindEvents();
    }

    bindEvents() {
        const playAgainBtn = this.overlay.querySelector('.play-again-btn');
        const leaderboardBtn = this.overlay.querySelector('.leaderboard-btn');
        
        playAgainBtn.addEventListener('click', () => this.playAgain());
        leaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        
        // Close on overlay click (not modal)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
    }

    async show(score, gameData = {}) {
        this.finalScore = score;
        this.previousBest = this.getPersonalBest();
        this.isNewBest = score > this.previousBest;
        
        // Show overlay
        this.overlay.style.display = 'flex';
        
        // Start cinematic reveal
        await this.startCinematicReveal();
        
        // Submit score in background
        this.submitScoreInBackground(score, gameData);
    }

    async startCinematicReveal() {
        this.isAnimating = true;
        
        // Step 1: Fade in modal
        this.overlay.querySelector('.game-over-modal').style.animation = 'modalSlideIn 0.6s ease-out';
        await this.sleep(300);
        
        // Step 2: Animate score counting
        await this.animateScore();
        await this.sleep(200);
        
        // Step 3: Show new best badge if applicable
        if (this.isNewBest) {
            await this.showNewBestAnimation();
            await this.sleep(300);
        }
        
        // Step 4: Calculate and show earnings
        this.calculateEarnings();
        await this.animateEarnings();
        await this.sleep(200);
        
        // Step 5: Show action buttons
        await this.showActionButtons();
        
        this.isAnimating = false;
    }

    async animateScore() {
        const scoreElement = this.overlay.querySelector('.score-value');
        const duration = 1000;
        const startTime = Date.now();
        
        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function for smooth counting
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentScore = Math.floor(this.finalScore * easeOut);
                
                scoreElement.textContent = currentScore.toLocaleString();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }

    async showNewBestAnimation() {
        const badge = this.overlay.querySelector('.best-badge');
        const scoreCard = this.overlay.querySelector('.score-card');
        
        badge.classList.remove('hidden');
        scoreCard.classList.add('new-best');
        
        // Sparkle effect
        for (let i = 0; i < 5; i++) {
            this.createSparkle(scoreCard);
        }
    }

    createSparkle(parent) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        parent.appendChild(sparkle);
        
        setTimeout(() => sparkle.remove(), 1000);
    }

    calculateEarnings() {
        // Base earnings calculation
        this.earnings = Math.floor(this.finalScore / 100) * 10;
        
        // Bonus for new best
        if (this.isNewBest) {
            this.earnings += 50;
        }
        
        // Random bonus (simulated)
        if (Math.random() < 0.3) {
            this.earnings += 25;
        }
    }

    async animateEarnings() {
        const earningsElement = this.overlay.querySelector('.earnings-value');
        const duration = 800;
        const startTime = Date.now();
        
        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const easeOut = 1 - Math.pow(1 - progress, 2);
                const currentEarnings = Math.floor(this.earnings * easeOut);
                
                earningsElement.textContent = '+' + currentEarnings;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }

    async showActionButtons() {
        const buttons = this.overlay.querySelectorAll('.action-buttons .btn-primary, .action-buttons .btn-secondary');
        
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].style.animation = `buttonSlideIn 0.4s ease-out ${i * 0.1}s both`;
            await this.sleep(100);
        }
    }

    async submitScoreInBackground(score, gameData) {
        const loadingIndicator = this.overlay.querySelector('.loading-indicator');
        const rankCard = this.overlay.querySelector('.rank-card');
        
        try {
            // Get player identity
            const game = window.neonDrop;
            let playerData = { id: 'anonymous', displayName: 'Anonymous Player' };
            
            if (game && game.playerIdentity) {
                try {
                    const identity = await game.playerIdentity.getIdentity();
                    playerData = {
                        id: identity.playerId || 'anonymous',
                        displayName: identity.displayName || 'Anonymous Player'
                    };
                } catch (e) {
                    console.warn('Could not get player identity:', e);
                }
            }
            
            // Prepare score data
            const scoreData = {
                score: score,
                player_id: playerData.id,
                player_name: playerData.displayName,
                replay_hash: this.generateReplayHash(score, gameData),
                metrics: this.extractMetrics(gameData),
                timestamp: Date.now()
            };
            
            // Submit to API
            const response = await fetch('https://blockzone-api.hambomyers.workers.dev/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scoreData)
            });
            
            if (response.ok) {
                const result = await response.json();
                await this.handleSuccessfulSubmission(result);
            } else {
                throw new Error(`API Error: ${response.status}`);
            }
            
        } catch (error) {
            console.warn('Score submission failed:', error);
            await this.handleFailedSubmission();
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    async handleSuccessfulSubmission(result) {
        const rankValue = this.overlay.querySelector('.rank-value');
        const rankSubtext = this.overlay.querySelector('.rank-subtext');
        
        // Update rank display
        if (result.rank) {
            rankValue.textContent = `#${result.rank}`;
            rankSubtext.textContent = `of ${result.totalPlayers || '1000+'} players`;
        } else {
            rankValue.textContent = 'Submitted';
            rankSubtext.textContent = 'Score recorded!';
        }
        
        // Animate rank reveal
        rankValue.style.animation = 'numberFlip 0.6s ease-out';
    }

    async handleFailedSubmission() {
        const rankValue = this.overlay.querySelector('.rank-value');
        const rankSubtext = this.overlay.querySelector('.rank-subtext');
        
        rankValue.textContent = 'Offline';
        rankSubtext.textContent = 'Score saved locally';
        
        // Save locally
        this.saveScoreLocally();
    }

    generateReplayHash(score, gameData) {
        const data = `${score}-${Date.now()}-${Math.random()}`;
        return btoa(data).substring(0, 16);
    }

    extractMetrics(gameData) {
        return {
            accuracy: gameData.accuracy || Math.floor(Math.random() * 100),
            maxCombo: gameData.maxCombo || Math.floor(Math.random() * 50),
            duration: gameData.duration || Math.floor(Math.random() * 300)
        };
    }

    getPersonalBest() {
        return parseInt(localStorage.getItem('neondrop_best_score') || '0');
    }

    saveScoreLocally() {
        // Save current score
        const scores = JSON.parse(localStorage.getItem('neondrop_scores') || '[]');
        scores.push({
            score: this.finalScore,
            timestamp: Date.now(),
            synced: false
        });
        localStorage.setItem('neondrop_scores', JSON.stringify(scores));
        
        // Update personal best
        if (this.isNewBest) {
            localStorage.setItem('neondrop_best_score', this.finalScore.toString());
        }
    }

    playAgain() {
        this.hide();
        const game = window.neonDrop;
        if (game && game.restart) {
            game.restart();
        }
    }

    showLeaderboard() {
        // Implementation for leaderboard view
        console.log('Show leaderboard');
    }

    hide() {
        this.overlay.style.display = 'none';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
