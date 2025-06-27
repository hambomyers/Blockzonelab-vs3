/**
 * Challenge Viewer - View and Accept Challenges
 * Allows players to view challenge details and accept them
 */
export class ChallengeViewer {
    constructor(gameEngine, blockchain) {
        this.gameEngine = gameEngine;
        this.blockchain = blockchain;
        this.currentChallenge = null;
        this.replayPlayer = null;
        
        // Challenge tiers configuration (matching ChallengeCreator)
        this.challengeTiers = {
            quick: {
                stake: 1.00,
                winnerPrize: 1.80,
                label: "Quick Challenge",
                description: "Beat my score for $1.00",
                color: "#00d4ff",
                icon: "⚡",
                timeLimit: 24
            },
            highRoller: {
                stake: 5.00,
                winnerPrize: 9.00,
                label: "High Roller Challenge",
                description: "Beat my score for $5.00", 
                color: "#ffd700",
                icon: "👑",
                timeLimit: 24
            }
        };
    }

    /**
     * Load and display a challenge
     */
    async loadChallenge(challengeId) {
        try {
            this.currentChallenge = await this.getChallenge(challengeId);
            
            if (!this.currentChallenge) {
                throw new Error('Challenge not found');
            }

            if (this.currentChallenge.status !== 'active') {
                throw new Error('Challenge is no longer active');
            }

            if (Date.now() > this.currentChallenge.endTime) {
                throw new Error('Challenge has expired');
            }

            return this.createChallengeView();
            
        } catch (error) {
            console.error('Failed to load challenge:', error);
            return this.createErrorView(error.message);
        }
    }

    /**
     * Get challenge by ID
     */
    async getChallenge(challengeId) {
        // Try local storage first
        const localChallenge = localStorage.getItem(`challenge_${challengeId}`);
        if (localChallenge) {
            return JSON.parse(localChallenge);
        }

        // Fallback to blockchain
        try {
            return await this.blockchain.getChallenge(challengeId);
        } catch (error) {
            console.error('Failed to get challenge:', error);
            return null;
        }
    }

    /**
     * Create challenge view UI
     */
    createChallengeView() {
        const challenge = this.currentChallenge;
        const tierConfig = this.challengeTiers[challenge.tier];
        const timeLeft = this.getTimeLeft(challenge.endTime);
        const isExpired = Date.now() > challenge.endTime;
        const isAccepted = challenge.challengers.includes(this.blockchain.getCurrentAddress());

        const container = document.createElement('div');
        container.className = 'challenge-viewer';
        container.innerHTML = `
            <div class="challenge-header">
                <div class="challenge-title">
                    <span class="tier-icon ${challenge.tier}">${tierConfig.icon}</span>
                    <h2 class="neondrop-logo">${tierConfig.label}</h2>
                </div>
                <div class="challenge-status ${isExpired ? 'expired' : 'active'}">
                    ${isExpired ? '⏰ Expired' : '🟢 Active'}
                </div>
            </div>

            <div class="challenge-content">
                <div class="challenge-info-grid">
                    <div class="info-card target-score">
                        <div class="card-header">
                            <span class="card-icon">🎯</span>
                            <h3>Target Score</h3>
                        </div>
                        <div class="card-value">${challenge.targetScore.toLocaleString()}</div>
                    </div>

                    <div class="info-card stake-amount">
                        <div class="card-header">
                            <span class="card-icon">💰</span>
                            <h3>Stake Amount</h3>
                        </div>
                        <div class="card-value">$${challenge.stake}</div>
                    </div>

                    <div class="info-card prize-pool">
                        <div class="card-header">
                            <span class="card-icon">🏆</span>
                            <h3>Prize Pool</h3>
                        </div>
                        <div class="card-value prize">$${challenge.winnerPrize}</div>
                    </div>

                    <div class="info-card time-remaining">
                        <div class="card-header">
                            <span class="card-icon">⏱️</span>
                            <h3>Time Left</h3>
                        </div>
                        <div class="card-value ${isExpired ? 'expired' : ''}">${timeLeft}</div>
                    </div>
                </div>

                <div class="challenge-description">
                    <p class="description-text">
                        <strong>${tierConfig.description}</strong><br>
                        Can you beat this score and claim the prize?
                    </p>
                </div>

                <div class="replay-section">
                    <h3>🎬 Challenge Replay</h3>
                    <div class="replay-container">
                        <div class="replay-video" id="replay-video">
                            <div class="replay-placeholder">
                                <span class="play-icon">▶️</span>
                                <p>Click to watch the challenge replay</p>
                            </div>
                        </div>
                        <div class="replay-controls">
                            <button class="replay-btn" id="play-replay">▶️ Play Replay</button>
                            <button class="replay-btn" id="pause-replay">⏸️ Pause</button>
                            <button class="replay-btn" id="restart-replay">🔄 Restart</button>
                        </div>
                    </div>
                </div>

                <div class="challenge-stats">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Creator:</span>
                            <span class="stat-value">${this.formatAddress(challenge.creator)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Created:</span>
                            <span class="stat-value">${this.formatDate(challenge.createdAt)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Challengers:</span>
                            <span class="stat-value">${challenge.challengers.length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Attempts:</span>
                            <span class="stat-value">${Object.keys(challenge.attempts).length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="challenge-actions">
                ${this.createActionButtons(isExpired, isAccepted)}
            </div>
        `;

        // Add event listeners
        this.addChallengeViewEventListeners(container);

        return container;
    }

    /**
     * Create action buttons based on challenge state
     */
    createActionButtons(isExpired, isAccepted) {
        if (isExpired) {
            return `
                <button class="btn-secondary" onclick="window.history.back()">
                    ← Back to Challenges
                </button>
            `;
        }

        if (isAccepted) {
            return `
                <button class="btn-primary" id="attempt-challenge-btn">
                    🎮 Attempt Challenge
                </button>
                <button class="btn-secondary" onclick="window.history.back()">
                    ← Back to Challenges
                </button>
            `;
        }

        const tierConfig = this.challengeTiers[this.currentChallenge.tier];
        
        return `
            <button class="btn-primary accept-btn" id="accept-challenge-btn">
                💰 Accept ${tierConfig.label} ($${tierConfig.stake})
            </button>
            <button class="btn-secondary" onclick="window.history.back()">
                ← Back to Challenges
            </button>
        `;
    }

    /**
     * Add event listeners to challenge view
     */
    addChallengeViewEventListeners(container) {
        const acceptBtn = container.querySelector('#accept-challenge-btn');
        const attemptBtn = container.querySelector('#attempt-challenge-btn');
        const playReplayBtn = container.querySelector('#play-replay');
        const pauseReplayBtn = container.querySelector('#pause-replay');
        const restartReplayBtn = container.querySelector('#restart-replay');

        // Accept challenge
        if (acceptBtn) {
            acceptBtn.addEventListener('click', async () => {
                try {
                    acceptBtn.disabled = true;
                    acceptBtn.textContent = 'Accepting...';
                    
                    await this.acceptChallenge();
                    
                    // Show success message
                    this.showAcceptanceSuccess();
                    
                } catch (error) {
                    console.error('Failed to accept challenge:', error);
                    alert('Failed to accept challenge: ' + error.message);
                } finally {
                    acceptBtn.disabled = false;
                    acceptBtn.textContent = `💰 Accept ${this.challengeTiers[this.currentChallenge.tier].label} ($${this.challengeTiers[this.currentChallenge.tier].stake})`;
                }
            });
        }

        // Attempt challenge
        if (attemptBtn) {
            attemptBtn.addEventListener('click', () => {
                this.startChallengeAttempt();
            });
        }

        // Replay controls
        if (playReplayBtn) {
            playReplayBtn.addEventListener('click', () => {
                this.playReplay();
            });
        }

        if (pauseReplayBtn) {
            pauseReplayBtn.addEventListener('click', () => {
                this.pauseReplay();
            });
        }

        if (restartReplayBtn) {
            restartReplayBtn.addEventListener('click', () => {
                this.restartReplay();
            });
        }

        // Replay video click
        const replayVideo = container.querySelector('#replay-video');
        if (replayVideo) {
            replayVideo.addEventListener('click', () => {
                this.playReplay();
            });
        }
    }

    /**
     * Accept the challenge
     */
    async acceptChallenge() {
        const challenge = this.currentChallenge;
        const tierConfig = this.challengeTiers[challenge.tier];
        
        // Verify user has sufficient balance
        const balance = await this.blockchain.getBalance();
        if (balance < tierConfig.stake) {
            throw new Error(`Insufficient balance. You need $${tierConfig.stake} to accept this challenge.`);
        }

        // Add challenger to challenge
        const playerAddress = await this.blockchain.getCurrentAddress();
        challenge.challengers.push(playerAddress);
        
        // Store updated challenge
        await this.storeChallenge(challenge);

        return challenge;
    }

    /**
     * Show acceptance success message
     */
    showAcceptanceSuccess() {
        const tierConfig = this.challengeTiers[this.currentChallenge.tier];
        
        const successContainer = document.createElement('div');
        successContainer.className = 'challenge-accepted';
        successContainer.innerHTML = `
            <div class="acceptance-success">
                <div class="success-header">
                    <span class="success-icon">✅</span>
                    <h3>Challenge Accepted!</h3>
                </div>
                
                <p class="success-message">
                    You've accepted the ${tierConfig.label} for $${tierConfig.stake}. 
                    Good luck beating the target score of ${this.currentChallenge.targetScore.toLocaleString()}!
                </p>
                
                <div class="acceptance-details">
                    <div class="detail-row">
                        <span class="detail-label">Stake Paid:</span>
                        <span class="detail-value">$${tierConfig.stake}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Potential Prize:</span>
                        <span class="detail-value prize">$${tierConfig.winnerPrize}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Time Remaining:</span>
                        <span class="detail-value">${this.getTimeLeft(this.currentChallenge.endTime)}</span>
                    </div>
                </div>

                <div class="acceptance-actions">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-primary">
                        🎮 Start Attempt
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-secondary">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(successContainer);
    }

    /**
     * Start challenge attempt
     */
    startChallengeAttempt() {
        // Close any open modals
        const modals = document.querySelectorAll('.challenge-accepted, .challenge-created');
        modals.forEach(modal => modal.remove());

        // Start new game with challenge context
        this.gameEngine.startNewGame({
            challengeMode: true,
            targetScore: this.currentChallenge.targetScore,
            challengeId: this.currentChallenge.id
        });
    }

    /**
     * Play replay video
     */
    playReplay() {
        if (!this.replayPlayer) {
            this.initializeReplayPlayer();
        }
        
        this.replayPlayer.play();
    }

    /**
     * Pause replay video
     */
    pauseReplay() {
        if (this.replayPlayer) {
            this.replayPlayer.pause();
        }
    }

    /**
     * Restart replay video
     */
    restartReplay() {
        if (this.replayPlayer) {
            this.replayPlayer.restart();
        }
    }

    /**
     * Initialize replay player
     */
    initializeReplayPlayer() {
        const replayData = this.currentChallenge.replayData;
        const replayContainer = document.querySelector('#replay-video');
        
        if (!replayData || !replayContainer) {
            return;
        }

        // Create replay player (simplified implementation)
        this.replayPlayer = {
            play: () => {
                replayContainer.innerHTML = `
                    <div class="replay-playing">
                        <div class="replay-frame">
                            <div class="replay-board">
                                <!-- Replay board would be rendered here -->
                                <p>Replay playing at 4x speed...</p>
                            </div>
                        </div>
                    </div>
                `;
            },
            pause: () => {
                // Pause replay
            },
            restart: () => {
                this.playReplay();
            }
        };
    }

    /**
     * Store challenge locally and on blockchain
     */
    async storeChallenge(challenge) {
        // Store locally for immediate access
        localStorage.setItem(`challenge_${challenge.id}`, JSON.stringify(challenge));
        
        // Store on blockchain
        try {
            await this.blockchain.updateChallenge(challenge.id, challenge);
        } catch (error) {
            console.error('Failed to store challenge on blockchain:', error);
            // Fallback to local storage only
        }
    }

    /**
     * Get time left until challenge expires
     */
    getTimeLeft(endTime) {
        const timeLeft = endTime - Date.now();
        
        if (timeLeft <= 0) {
            return 'Expired';
        }

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    /**
     * Format address for display
     */
    formatAddress(address) {
        if (!address) return 'Unknown';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    /**
     * Format date for display
     */
    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString() + ' ' + 
               new Date(timestamp).toLocaleTimeString();
    }

    /**
     * Create error view
     */
    createErrorView(errorMessage) {
        const container = document.createElement('div');
        container.className = 'challenge-error';
        container.innerHTML = `
            <div class="error-content">
                <div class="error-header">
                    <span class="error-icon">❌</span>
                    <h3>Challenge Not Found</h3>
                </div>
                
                <p class="error-message">${errorMessage}</p>
                
                <div class="error-actions">
                    <button onclick="window.history.back()" class="btn-secondary">
                        ← Go Back
                    </button>
                    <button onclick="window.location.href='/games/neondrop/'" class="btn-primary">
                        🎮 Play NeonDrop
                    </button>
                </div>
            </div>
        `;

        return container;
    }
} 