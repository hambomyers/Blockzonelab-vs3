/**
 * Challenge Creator - Asynchronous Challenge System
 * Allows players to create challenges from completed games
 */
export class ChallengeCreator {
    constructor(gameEngine, blockchain) {
        this.gameEngine = gameEngine;
        this.blockchain = blockchain;
        this.currentChallenge = null;
        
        // Challenge tiers configuration
        this.challengeTiers = {
            quick: {
                stake: 1.00,
                winnerPrize: 1.80,
                label: "Quick Challenge",
                description: "Beat my score for $1.00",
                color: "#00d4ff",
                icon: "⚡",
                timeLimit: 24 // hours
            },
            highRoller: {
                stake: 5.00,
                winnerPrize: 9.00,
                label: "High Roller Challenge",
                description: "Beat my score for $5.00", 
                color: "#ffd700",
                icon: "👑",
                timeLimit: 24 // hours
            }
        };
    }

    /**
     * Create a challenge from a completed game
     */
    async createChallenge(tier = 'quick') {
        const gameLog = this.gameEngine.getCompleteGameLog();
        
        if (!gameLog.finalScore || gameLog.finalScore === 0) {
            throw new Error('No valid game score to challenge');
        }

        const tierConfig = this.challengeTiers[tier];
        if (!tierConfig) {
            throw new Error('Invalid challenge tier');
        }

        // Generate 4x speed replay video data
        const replayData = this.generateReplayData(gameLog);
        
        // Create challenge object
        const challenge = {
            id: this.generateChallengeId(),
            tier: tier,
            creator: await this.blockchain.getCurrentAddress(),
            targetScore: gameLog.finalScore,
            stake: tierConfig.stake,
            winnerPrize: tierConfig.winnerPrize,
            endTime: Date.now() + (tierConfig.timeLimit * 60 * 60 * 1000),
            gameLog: gameLog,
            replayData: replayData,
            status: 'active',
            challengers: [],
            attempts: {},
            createdAt: Date.now()
        };

        // Store challenge locally and on blockchain
        await this.storeChallenge(challenge);
        
        // Generate shareable link
        const shareLink = this.generateShareLink(challenge);
        
        return {
            challenge,
            shareLink,
            replayVideo: replayData.videoUrl
        };
    }

    /**
     * Generate 4x speed replay video data
     */
    generateReplayData(gameLog) {
        const replayFrames = [];
        const frameInterval = 4; // 4x speed = every 4th frame
        
        // Extract key frames for replay
        for (let i = 0; i < gameLog.frameStates.length; i += frameInterval) {
            const frame = gameLog.frameStates[i];
            replayFrames.push({
                frame: frame.frame,
                board: frame.boardTopRows,
                score: frame.score,
                level: frame.level,
                currentPiece: frame.currentPiece,
                nextPiece: frame.nextPiece
            });
        }

        // Create video data (simplified - would use actual video encoding)
        const videoData = {
            frames: replayFrames,
            duration: gameLog.duration / 4, // 4x speed
            frameRate: 60 / 4, // 15 FPS for 4x speed
            resolution: { width: 320, height: 640 }
        };

        return {
            videoUrl: this.encodeReplayVideo(videoData),
            frameData: replayFrames,
            metadata: {
                originalDuration: gameLog.duration,
                speedMultiplier: 4,
                totalFrames: replayFrames.length
            }
        };
    }

    /**
     * Encode replay video (simplified implementation)
     */
    encodeReplayVideo(videoData) {
        // In production, this would use WebCodecs API or similar
        // For now, return a data URL with frame data
        const videoBlob = new Blob([JSON.stringify(videoData)], { type: 'application/json' });
        return URL.createObjectURL(videoBlob);
    }

    /**
     * Generate shareable challenge link
     */
    generateShareLink(challenge) {
        const baseUrl = window.location.origin;
        return `${baseUrl}/challenge/${challenge.id}`;
    }

    /**
     * Store challenge locally and on blockchain
     */
    async storeChallenge(challenge) {
        // Store locally for immediate access
        localStorage.setItem(`challenge_${challenge.id}`, JSON.stringify(challenge));
        
        // Store on blockchain
        try {
            await this.blockchain.createChallenge(
                challenge.targetScore,
                challenge.stake,
                challenge.endTime
            );
        } catch (error) {
            console.error('Failed to store challenge on blockchain:', error);
            // Fallback to local storage only
        }
    }

    /**
     * Generate unique challenge ID
     */
    generateChallengeId() {
        return `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
     * Accept a challenge
     */
    async acceptChallenge(challengeId, stake) {
        const challenge = await this.getChallenge(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        if (challenge.status !== 'active') {
            throw new Error('Challenge is no longer active');
        }

        if (Date.now() > challenge.endTime) {
            throw new Error('Challenge has expired');
        }

        // Add challenger to challenge
        challenge.challengers.push(await this.blockchain.getCurrentAddress());
        
        // Store updated challenge
        await this.storeChallenge(challenge);

        return challenge;
    }

    /**
     * Submit attempt for a challenge
     */
    async submitAttempt(challengeId, score, gameProof) {
        const challenge = await this.getChallenge(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        const playerAddress = await this.blockchain.getCurrentAddress();
        
        // Verify player is a challenger
        if (!challenge.challengers.includes(playerAddress)) {
            throw new Error('You must accept the challenge before attempting');
        }

        // Store attempt
        challenge.attempts[playerAddress] = {
            score: score,
            gameProof: gameProof,
            timestamp: Date.now()
        };

        // Check if challenge is beaten
        if (score > challenge.targetScore) {
            challenge.status = 'completed';
            challenge.winner = playerAddress;
            challenge.winningScore = score;
        }

        // Store updated challenge
        await this.storeChallenge(challenge);

        return {
            success: true,
            beaten: score > challenge.targetScore,
            challenge: challenge
        };
    }

    /**
     * Get active challenges
     */
    async getActiveChallenges() {
        const challenges = [];
        
        // Get from local storage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('challenge_')) {
                const challenge = JSON.parse(localStorage.getItem(key));
                if (challenge.status === 'active' && Date.now() < challenge.endTime) {
                    challenges.push(challenge);
                }
            }
        }

        return challenges.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Create challenge UI with tiered options
     */
    createChallengeUI() {
        const container = document.createElement('div');
        container.className = 'challenge-creator';
        container.innerHTML = `
            <div class="challenge-creator-header">
                <h3 class="neondrop-logo">Create Challenge</h3>
                <p>Challenge others to beat your score of <strong>${this.gameEngine.state.score.toLocaleString()}</strong></p>
            </div>
            
            <div class="challenge-tiers">
                <div class="challenge-tier quick-challenge" data-tier="quick">
                    <div class="tier-header">
                        <span class="tier-icon">⚡</span>
                        <h4>Quick Challenge</h4>
                    </div>
                    <div class="tier-details">
                        <p class="tier-description">Beat my score for $1.00</p>
                        <p class="tier-prize">Winner gets <strong>$1.80</strong></p>
                        <p class="tier-time">24 hours to accept</p>
                    </div>
                    <button class="tier-button quick-button" data-tier="quick">
                        Create $1 Challenge
                    </button>
                </div>

                <div class="challenge-divider">
                    <span>or</span>
                </div>

                <div class="challenge-tier high-roller-challenge" data-tier="highRoller">
                    <div class="tier-header">
                        <span class="tier-icon">👑</span>
                        <h4>High Roller Challenge</h4>
                    </div>
                    <div class="tier-details">
                        <p class="tier-description">Beat my score for $5.00</p>
                        <p class="tier-prize">Winner gets <strong>$9.00</strong></p>
                        <p class="tier-time">24 hours to accept</p>
                    </div>
                    <button class="tier-button high-roller-button" data-tier="highRoller">
                        Create $5 Challenge
                    </button>
                </div>
            </div>

            <div class="challenge-info">
                <p class="info-text">
                    <strong>How it works:</strong> Create a challenge, share the link, 
                    and when someone beats your score, they win the prize!
                </p>
            </div>

            <div class="challenge-actions">
                <button id="cancel-challenge-btn" class="btn-secondary">Cancel</button>
            </div>
        `;

        // Add event listeners
        this.addChallengeEventListeners(container);

        return container;
    }

    /**
     * Add event listeners to challenge UI
     */
    addChallengeEventListeners(container) {
        const quickButton = container.querySelector('.quick-button');
        const highRollerButton = container.querySelector('.high-roller-button');
        const cancelBtn = container.querySelector('#cancel-challenge-btn');

        // Quick challenge
        quickButton.addEventListener('click', async () => {
            try {
                quickButton.disabled = true;
                quickButton.textContent = 'Creating...';
                
                const result = await this.createChallenge('quick');
                
                // Show success message
                this.showChallengeCreated(result);
                
            } catch (error) {
                console.error('Failed to create quick challenge:', error);
                alert('Failed to create challenge: ' + error.message);
            } finally {
                quickButton.disabled = false;
                quickButton.textContent = 'Create $1 Challenge';
            }
        });

        // High roller challenge
        highRollerButton.addEventListener('click', async () => {
            try {
                highRollerButton.disabled = true;
                highRollerButton.textContent = 'Creating...';
                
                const result = await this.createChallenge('highRoller');
                
                // Show success message
                this.showChallengeCreated(result);
                
            } catch (error) {
                console.error('Failed to create high roller challenge:', error);
                alert('Failed to create challenge: ' + error.message);
            } finally {
                highRollerButton.disabled = false;
                highRollerButton.textContent = 'Create $5 Challenge';
            }
        });

        // Cancel
        cancelBtn.addEventListener('click', () => {
            container.remove();
        });

        // Add hover effects for tier selection
        const tierElements = container.querySelectorAll('.challenge-tier');
        tierElements.forEach(tier => {
            tier.addEventListener('mouseenter', () => {
                tier.classList.add('tier-hover');
            });
            
            tier.addEventListener('mouseleave', () => {
                tier.classList.remove('tier-hover');
            });
        });
    }

    /**
     * Show challenge created success message
     */
    showChallengeCreated(result) {
        const tierConfig = this.challengeTiers[result.challenge.tier];
        
        const successContainer = document.createElement('div');
        successContainer.className = 'challenge-created';
        successContainer.innerHTML = `
            <div class="challenge-success">
                <div class="success-header">
                    <span class="success-icon">🎉</span>
                    <h3>Challenge Created!</h3>
                </div>
                
                <p class="success-message">Your ${tierConfig.label} is now live for ${tierConfig.timeLimit} hours.</p>
                
                <div class="challenge-details">
                    <div class="detail-row">
                        <span class="detail-label">Target Score:</span>
                        <span class="detail-value">${result.challenge.targetScore.toLocaleString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Stake:</span>
                        <span class="detail-value">$${result.challenge.stake}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Prize Pool:</span>
                        <span class="detail-value prize">$${result.challenge.winnerPrize}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Challenge Type:</span>
                        <span class="detail-value tier-badge ${result.challenge.tier}">
                            ${tierConfig.icon} ${tierConfig.label}
                        </span>
                    </div>
                </div>

                <div class="challenge-share">
                    <h4>Share Your Challenge:</h4>
                    <div class="share-input-group">
                        <input type="text" value="${result.shareLink}" readonly id="share-link">
                        <button onclick="navigator.clipboard.writeText('${result.shareLink}')" class="copy-button">
                            📋 Copy
                        </button>
                    </div>
                </div>

                <div class="challenge-actions">
                    <button onclick="window.open('${result.shareLink}', '_blank')" class="btn-primary">
                        👁️ View Challenge
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-secondary">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(successContainer);
    }
} 