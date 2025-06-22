/**
 * SimpleGameOver.js - The Frictionless Flow
 * Beautiful, minimal post-game experience inspired by Apple Arcade + Coinbase
 * Pure elegance with neon drop animations
 */

export class SimpleGameOver {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.score = 0;
        this.playerName = null;
        this.apiBase = 'https://blockzone-api.hambomyers.workers.dev/api';
        this.playerId = this.getOrCreatePlayerId();
        this.leaderboardData = null;
        this.playerRank = null;
        
        this.createContainer();
        console.log('✨ SimpleGameOver initialized - Pure Elegant Flow');
        
        // Initialize systems asynchronously
        this.initializeSystems();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'simple-game-over-overlay';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease-out;
        `;
        document.body.appendChild(this.container);    }

    getOrCreatePlayerId() {
        let playerId = localStorage.getItem('playerId');
        if (!playerId) {
            playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('playerId', playerId);
        }
        return playerId;
    }

    getStoredPlayerName() {
        return localStorage.getItem('neonDropPlayerName');
    }    async show(finalScore) {
        if (this.isVisible) return;
        
        this.score = finalScore;
        this.isVisible = true;
        this.playerName = this.getStoredPlayerName();
        
        console.log('🎮 Game Over - Score:', finalScore, 'Player:', this.playerName || 'New Player');
        
        // Refresh tournament and player data
        await this.loadTournamentInfo();
        
        // Show container
        this.container.style.display = 'flex';
        
        if (this.playerName) {
            // Returning player - go straight to leaderboard with their new score
            console.log('🔍 DEBUG: Returning player detected, calling showLeaderboardWithNewScore()');
            await this.showLeaderboardWithNewScore();
        } else {
            // New player - the magic moment
            console.log('🔍 DEBUG: New player detected, calling showNameCapture()');
            await this.showNameCapture();
        }
        
        // Animate in
        requestAnimationFrame(() => {
            this.container.style.opacity = '1';
        });
    }

    async showNameCapture() {
        this.container.innerHTML = `
            <div class="game-over-card" style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 20px;
                padding: 40px;
                max-width: 450px;
                width: 90%;
                border: 1px solid rgba(0, 212, 255, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
                transform: scale(0.9);
                animation: slideIn 0.4s ease-out forwards;
            ">
                <!-- Score Celebration -->
                <div class="score-celebration" style="margin-bottom: 30px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                    <h2 style="color: #00d4ff; font-size: 32px; margin: 0 0 10px 0; font-weight: 700;">
                        Nice Score!
                    </h2>
                    <div style="color: #fff; font-size: 24px; font-weight: 600;">
                        ${this.score.toLocaleString()}
                    </div>
                </div>

                <!-- The Ask -->
                <div class="name-capture" style="margin-bottom: 30px;">
                    <p style="color: #aaa; font-size: 18px; margin-bottom: 20px; line-height: 1.4;">
                        Save your score to the leaderboard?
                    </p>
                    
                    <input 
                        type="text" 
                        id="playerNameInput" 
                        placeholder="Enter your player name"
                        maxlength="20"
                        style="
                            width: 100%;
                            padding: 15px 20px;
                            font-size: 18px;
                            border: 2px solid rgba(0, 212, 255, 0.3);
                            border-radius: 12px;
                            background: rgba(0, 0, 0, 0.3);
                            color: white;
                            text-align: center;
                            transition: all 0.3s ease;
                            margin-bottom: 20px;
                            box-sizing: border-box;
                        "
                        autocomplete="off"
                    >
                    
                    <div class="validation-feedback" style="
                        height: 20px;
                        font-size: 14px;
                        margin-bottom: 10px;
                        color: #00ff88;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    ">
                        ✓ Perfect!
                    </div>
                </div>

                <!-- Actions -->
                <div class="actions" style="display: flex; gap: 15px; justify-content: center;">
                    <button 
                        id="saveScoreBtn" 
                        disabled
                        style="
                            background: linear-gradient(135deg, #00d4ff, #0099cc);
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            opacity: 0.5;
                        "
                    >
                        💾 Save Score
                    </button>
                    
                    <button 
                        id="skipBtn"
                        style="
                            background: rgba(255, 255, 255, 0.1);
                            color: #aaa;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            padding: 15px 30px;
                            border-radius: 10px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        ⏭️ Skip
                    </button>
                </div>
                
                <p style="color: #666; font-size: 12px; margin-top: 20px;">
                    Your name stays on your device. Anonymous and private.
                </p>
            </div>

            <style>
                @keyframes slideIn {
                    from {
                        transform: scale(0.9) translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }
                
                #playerNameInput:focus {
                    border-color: #00d4ff !important;
                    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3) !important;
                    outline: none;
                }
                
                #saveScoreBtn:not(:disabled) {
                    opacity: 1 !important;
                    transform: scale(1.05);
                    box-shadow: 0 5px 20px rgba(0, 212, 255, 0.4);
                }
                
                #saveScoreBtn:not(:disabled):hover {
                    transform: scale(1.08);
                }
                
                #skipBtn:hover {
                    background: rgba(255, 255, 255, 0.2) !important;
                    color: #fff !important;
                }
            </style>
        `;

        this.bindNameCaptureEvents();
    }

    bindNameCaptureEvents() {
        const nameInput = this.container.querySelector('#playerNameInput');
        const saveBtn = this.container.querySelector('#saveScoreBtn');
        const skipBtn = this.container.querySelector('#skipBtn');
        const feedback = this.container.querySelector('.validation-feedback');

        // Auto-focus and select
        setTimeout(() => {
            nameInput.focus();
            nameInput.select();
        }, 500);

        // Real-time validation
        nameInput.addEventListener('input', (e) => {
            const name = e.target.value.trim();
            const isValid = name.length >= 3;
            
            saveBtn.disabled = !isValid;
            
            if (isValid) {
                feedback.style.opacity = '1';
                feedback.textContent = '✓ Perfect!';
                feedback.style.color = '#00ff88';
            } else if (name.length > 0) {
                feedback.style.opacity = '1';
                feedback.textContent = 'Need at least 3 characters';
                feedback.style.color = '#ff6b35';
            } else {
                feedback.style.opacity = '0';
            }
        });

        // Enter key to save
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !saveBtn.disabled) {
                this.savePlayerName(nameInput.value.trim());
            }
        });

        // Save button
        saveBtn.addEventListener('click', () => {
            this.savePlayerName(nameInput.value.trim());
        });

        // Skip button
        skipBtn.addEventListener('click', () => {
            this.savePlayerName(`Player${Math.floor(Math.random() * 10000)}`);
        });
    }    async savePlayerName(name) {
        this.playerName = name;
        
        // Store locally
        localStorage.setItem('neonDropPlayerName', name);
        
        // Submit directly to Cloudflare API
        try {
            console.log('📤 Submitting score to Cloudflare API:', this.score, 'for player:', name);
            
            const response = await fetch('https://blockzone-api.hambomyers.workers.dev/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_id: this.playerId,
                    score: this.score,
                    replay_hash: `${this.playerId}_${Date.now()}_${this.score}`,
                    metrics: {
                        game: 'neon_drop',
                        player_name: name,
                        duration: 0
                    },
                    timestamp: Date.now()
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Score submitted successfully:', result);
                if (result.rank) {
                    this.playerRank = result.rank;
                }
            } else {
                console.warn('⚠️ Score submission failed:', response.status, await response.text());
            }
        } catch (error) {
            console.error('❌ Score submission error:', error);
        }
        
        // Show results
        await this.showGameResults();
    }    async showGameResults(tournamentSuccess = false) {
        const rank = await this.getPlayerRank();
        const totalPlayers = await this.getTotalPlayers();
        
        // Tournament status
        const tournamentInfo = this.tournamentInfo || {};
        const isInTournament = tournamentSuccess || this.hasFreePlays || localStorage.getItem(`tournament_entered_${new Date().toDateString()}`);
        const tournamentRank = this.playerRank || rank;
        
        this.container.innerHTML = `
            <div class="game-over-card" style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                border: 1px solid rgba(0, 212, 255, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
                animation: slideIn 0.4s ease-out;
            ">
                <!-- Tournament Success Banner -->
                ${tournamentSuccess ? `
                    <div style="
                        background: linear-gradient(135deg, #ffd700, #ffb700);
                        color: #000;
                        padding: 15px;
                        border-radius: 10px;
                        margin-bottom: 25px;
                        font-weight: 600;
                    ">
                        🏆 Tournament Entry Successful!
                    </div>
                ` : ''}

                <!-- Player Identity -->
                <div class="player-header" style="margin-bottom: 30px;">
                    <div style="font-size: 24px; color: #00d4ff; font-weight: 600; margin-bottom: 5px;">
                        ${this.playerName}
                    </div>
                    <div style="color: #aaa; font-size: 16px;">
                        ${isInTournament ? 
                            `🏆 Tournament Rank #${tournamentRank} of ${tournamentInfo.participants || totalPlayers}` :
                            `Rank #${rank} of ${totalPlayers} players`
                        }
                    </div>
                </div>

                <!-- Score Display -->
                <div class="score-display" style="margin-bottom: 30px;">
                    <div style="color: #fff; font-size: 36px; font-weight: 700; margin-bottom: 10px;">
                        ${this.score.toLocaleString()}
                    </div>
                    <div style="color: ${tournamentRank <= 3 ? '#ffd700' : tournamentRank <= 10 ? '#00ff88' : '#00d4ff'}; font-size: 14px;">
                        ${isInTournament ? 
                            (tournamentRank === 1 ? '🥇 Tournament Leader!' :
                             tournamentRank === 2 ? '🥈 Second Place!' :
                             tournamentRank === 3 ? '🥉 Third Place!' :
                             tournamentRank <= 10 ? '🏆 Top 10 Tournament!' : '🎮 Tournament Player') :
                            (rank <= 10 ? '🏆 Top 10!' : rank <= 50 ? '🎯 Top 50!' : '🎮 Great job!')
                        }
                    </div>
                </div>

                <!-- Tournament Prize Info -->
                ${isInTournament && tournamentRank <= 3 ? `
                    <div style="
                        background: rgba(255, 215, 0, 0.1);
                        border: 1px solid rgba(255, 215, 0, 0.3);
                        border-radius: 10px;
                        padding: 20px;
                        margin-bottom: 25px;
                    ">
                        <div style="color: #ffd700; font-size: 18px; font-weight: 600; margin-bottom: 10px;">
                            💰 Prize Eligible!
                        </div>
                        <div style="color: #aaa; font-size: 14px;">
                            ${tournamentRank === 1 ? `$${tournamentInfo.prizePool?.amounts?.[1] || 10} USDC` :
                              tournamentRank === 2 ? `$${tournamentInfo.prizePool?.amounts?.[2] || 5} USDC` :
                              `$${tournamentInfo.prizePool?.amounts?.[3] || 2} USDC`
                            }
                        </div>
                    </div>
                ` : ''}

                <!-- Quick Stats -->
                <div class="quick-stats" style="
                    display: grid; 
                    grid-template-columns: repeat(3, 1fr); 
                    gap: 20px; 
                    margin-bottom: 30px;
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                ">
                    <div>
                        <div style="color: #00d4ff; font-size: 18px; font-weight: 600;">${this.score.toLocaleString()}</div>
                        <div style="color: #aaa; font-size: 12px;">Your Score</div>
                    </div>
                    <div>
                        <div style="color: #00d4ff; font-size: 18px; font-weight: 600;">#${rank}</div>
                        <div style="color: #aaa; font-size: 12px;">Your Rank</div>
                    </div>
                    <div>
                        <div style="color: #00d4ff; font-size: 18px; font-weight: 600;">${totalPlayers}</div>
                        <div style="color: #aaa; font-size: 12px;">Total Players</div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="actions" style="display: flex; gap: 15px; justify-content: center;">
                    <button 
                        id="playAgainBtn"
                        style="
                            background: linear-gradient(135deg, #00d4ff, #0099cc);
                            color: white;
                            border: none;
                            padding: 15px 25px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        🎮 Play Again
                    </button>
                    
                    <button 
                        id="leaderboardBtn"
                        style="
                            background: rgba(255, 255, 255, 0.1);
                            color: white;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            padding: 15px 25px;
                            border-radius: 10px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        🏆 Leaderboard
                    </button>
                </div>
            </div>
        `;

        this.bindResultsEvents();
    }    bindResultsEvents() {
        const playAgainBtn = this.container.querySelector('#playAgainBtn');
        const leaderboardBtn = this.container.querySelector('#leaderboardBtn');

        playAgainBtn.addEventListener('click', () => {
            this.hide();
            this.emit('play-again');
        });        leaderboardBtn.addEventListener('click', async () => {
            // FIXED: Direct API call with correct parameters
            try {
                console.log('🏆 Fetching leaderboard from Cloudflare API directly');
                
                const response = await fetch('https://blockzone-api.hambomyers.workers.dev/api/leaderboard?period=daily&limit=50&game=neon_drop', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                
                const data = await response.json();
                console.log('📊 Leaderboard API response:', data);
                
                if (data.scores && data.scores.length > 0) {
                    console.log('✅ Found', data.scores.length, 'scores, showing leaderboard');
                    this.showBeautifulLeaderboard(data.scores);
                } else {
                    console.warn('⚠️ No scores in leaderboard data');
                    this.showEmptyLeaderboard();
                }
                
            } catch (error) {
                console.error('❌ Failed to load leaderboard:', error);
                this.showEmptyLeaderboard();
            }
        });
    }

    async submitScore(score, playerName) {
        try {
            const response = await fetch(`${this.apiBase}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_id: this.playerId,
                    score: score,
                    replay_hash: `${this.playerId}_${Date.now()}_${score}`,
                    metrics: {
                        game: 'neon_drop',
                        duration: 0, // Could track game duration
                        player_name: playerName
                    },
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`Score submission failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Score submitted successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to submit score:', error);
            return null;
        }
    }

    async fetchLeaderboard(period = 'daily', limit = 100) {
        try {
            const response = await fetch(`${this.apiBase}/leaderboard?period=${period}&limit=${limit}&game=neon_drop`);
            
            if (!response.ok) {
                throw new Error(`Leaderboard fetch failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Leaderboard fetched:', data);
            this.leaderboardData = data;
            return data;
        } catch (error) {
            console.error('❌ Failed to fetch leaderboard:', error);
            return null;
        }
    }    async getPlayerRank() {
        try {
            // Get real leaderboard data from API
            const response = await fetch(`${this.apiBase}/leaderboard`);
            const data = await response.json();
            
            if (data.scores && data.scores.length > 0) {
                // Sort by score descending
                const sortedScores = data.scores.sort((a, b) => b.score - a.score);
                
                // Find this player's rank
                const playerName = this.getStoredPlayerName();
                let rank = sortedScores.findIndex(entry => 
                    entry.player_id === this.playerId || 
                    entry.playerName === playerName ||
                    entry.metrics?.player_name === playerName
                ) + 1;
                
                // If not found, they would be ranked after current players
                if (rank === 0) {
                    rank = sortedScores.length + 1;
                }
                
                return rank;
            }
            
            return 1; // First player
        } catch (error) {
            console.warn('Failed to get player rank:', error);
            return 1;
        }
    }    async getTotalPlayers() {
        try {
            const response = await fetch(`${this.apiBase}/leaderboard`);
            const data = await response.json();
            return data.scores ? data.scores.length : 1;
        } catch (error) {
            console.warn('Failed to get total players:', error);            return 1;
        }
    }

    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.container.style.opacity = '0';
        
        setTimeout(() => {
            this.container.style.display = 'none';
        }, 300);
    }

    emit(eventName, data = {}) {
        document.dispatchEvent(new CustomEvent('simpleGameOver', {
            detail: { action: eventName, ...data }
        }));
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }

    async showLeaderboard() {
        const leaderboard = await this.getLeaderboard();
        const playerName = this.getStoredPlayerName();
        
        this.container.innerHTML = `
            <div class="game-over-card" style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 20px;
                padding: 40px;
                max-width: 600px;
                width: 95%;
                border: 1px solid rgba(0, 212, 255, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
                animation: slideIn 0.4s ease-out;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <!-- Header -->
                <div class="leaderboard-header" style="margin-bottom: 30px;">
                    <div style="font-size: 32px; margin-bottom: 10px;">🏆</div>
                    <h2 style="color: #00d4ff; font-size: 28px; margin: 0 0 5px 0; font-weight: 700;">
                        Daily Leaderboard
                    </h2>
                    <div style="color: #aaa; font-size: 16px;">
                        ${leaderboard.length} players competing today
                    </div>
                </div>

                <!-- Current Player Highlight (if playing) -->
                ${playerName ? `
                    <div class="current-player-card" style="
                        background: rgba(0, 212, 255, 0.1);
                        border: 1px solid rgba(0, 212, 255, 0.3);
                        border-radius: 10px;
                        padding: 15px;
                        margin-bottom: 25px;
                    ">
                        <div style="color: #00d4ff; font-weight: 600; margin-bottom: 5px;">
                            Your Position
                        </div>
                        <div style="color: #fff; font-size: 18px;">
                            ${playerName} - Rank #${await this.getPlayerRank()}
                        </div>
                    </div>
                ` : ''}

                <!-- Leaderboard List -->
                <div class="leaderboard-list" style="text-align: left;">
                    ${leaderboard.slice(0, 20).map((entry, index) => `
                        <div class="leaderboard-entry" style="
                            display: flex;
                            align-items: center;
                            padding: 12px 15px;
                            margin-bottom: 8px;
                            background: ${entry.playerName === playerName ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
                            border-radius: 8px;
                            border: ${entry.playerName === playerName ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid transparent'};
                            transition: all 0.3s ease;
                        ">
                            <!-- Rank -->
                            <div style="
                                width: 40px;
                                height: 40px;
                                border-radius: 50%;
                                background: ${index < 3 ? this.getRankColor(index) : 'rgba(255, 255, 255, 0.1)'};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: 700;
                                color: ${index < 3 ? '#000' : '#fff'};
                                margin-right: 15px;
                            ">
                                ${index < 3 ? this.getRankEmoji(index) : `#${index + 1}`}
                            </div>
                            
                            <!-- Player Info -->
                            <div style="flex: 1;">
                                <div style="
                                    color: ${entry.playerName === playerName ? '#00d4ff' : '#fff'};
                                    font-weight: ${entry.playerName === playerName ? '600' : '400'};
                                    font-size: 16px;
                                    margin-bottom: 2px;
                                ">
                                    ${entry.playerName}
                                    ${entry.playerName === playerName ? ' (You)' : ''}
                                </div>
                                <div style="color: #aaa; font-size: 12px;">
                                    ${this.formatTimeAgo(entry.timestamp)}
                                </div>
                            </div>
                            
                            <!-- Score -->
                            <div style="
                                color: #00d4ff;
                                font-weight: 600;
                                font-size: 16px;
                            ">
                                ${entry.score.toLocaleString()}
                            </div>
                        </div>
                    `).join('')}
                    
                    ${leaderboard.length === 0 ? `
                        <div style="text-align: center; color: #666; padding: 40px;">
                            <div style="font-size: 48px; margin-bottom: 15px;">🎮</div>
                            <div style="font-size: 18px; margin-bottom: 10px;">No scores yet!</div>
                            <div style="font-size: 14px; color: #888;">Be the first to set a high score</div>
                        </div>
                    ` : ''}
                </div>

                <!-- Actions -->
                <div class="actions" style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                    <button 
                        id="playGameBtn"
                        style="
                            background: linear-gradient(135deg, #00d4ff, #0099cc);
                            color: white;
                            border: none;
                            padding: 15px 25px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        🎮 Play Game
                    </button>
                    
                    <button 
                        id="refreshBtn"
                        style="
                            background: rgba(255, 255, 255, 0.1);
                            color: white;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            padding: 15px 25px;
                            border-radius: 10px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        🔄 Refresh
                    </button>
                    
                    <button 
                        id="closeBtn"
                        style="
                            background: rgba(255, 255, 255, 0.1);
                            color: white;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            padding: 15px 25px;
                            border-radius: 10px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        ✕ Close
                    </button>
                </div>
            </div>
        `;

        this.bindLeaderboardEvents();
    }

    bindLeaderboardEvents() {
        const playBtn = this.container.querySelector('#playGameBtn');
        const refreshBtn = this.container.querySelector('#refreshBtn');
        const closeBtn = this.container.querySelector('#closeBtn');

        playBtn.addEventListener('click', () => {
            this.hide();
            this.emit('play-again');
        });

        refreshBtn.addEventListener('click', () => {
            this.showLeaderboard(); // Refresh the leaderboard
        });

        closeBtn.addEventListener('click', () => {
            this.hide();
        });
    }

    async getLeaderboard() {
        try {
            // Try unified tournament system first (BACKEND CONNECTION)
            if (window.neonDrop?.tournament) {
                const leaderboard = window.neonDrop.tournament.getLeaderboard(50);
                console.log('🏆 Got leaderboard from unified tournament system:', leaderboard.length, 'entries');
                return leaderboard;
            }
        } catch (error) {
            console.warn('⚠️ Could not get tournament leaderboard, using local storage');
        }
        
        // Fallback to local storage
        const scores = JSON.parse(localStorage.getItem('neonDropScores') || '[]');
        const leaderboard = scores.map((entry, index) => ({
            rank: index + 1,
            playerName: entry.playerName,
            score: entry.score,
            timestamp: entry.timestamp
        }));
        
        console.log('📊 Got local leaderboard:', leaderboard.length, 'entries');
        return leaderboard;
    }

    getRankColor(index) {
        const colors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
        return colors[index] || '#fff';
    }

    getRankEmoji(index) {
        const emojis = ['🥇', '🥈', '🥉'];
        return emojis[index] || '🏅';
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    showBeautifulLeaderboard(leaderboardData) {
        this.container.innerHTML = `
            <div class="game-over-card" style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 20px;
                padding: 40px;
                max-width: 600px;
                width: 90%;
                border: 1px solid rgba(0, 212, 255, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
                animation: slideIn 0.4s ease-out;
                max-height: 80vh;
                overflow-y: auto;
            ">                <!-- Header -->
                <div class="leaderboard-header" style="margin-bottom: 30px;">
                    <div style="font-size: 32px; margin-bottom: 10px;">🏆</div>
                    <h2 style="color: #00d4ff; font-size: 28px; margin: 0 0 5px 0; font-weight: 700;">
                        Daily Leaderboard
                    </h2>
                    <div style="color: #aaa; font-size: 16px;">
                        ${leaderboardData.length} players competing today
                    </div>
                </div>

                <!-- Global Navigation -->
                <div class="global-nav" style="
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 25px;
                    padding: 15px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                ">
                    <button id="navHome" style="
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: #aaa;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">🏠 Home</button>
                    <button id="navGames" style="
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: #aaa;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">🎮 Games</button>
                    <button id="navLeaderboard" style="
                        background: linear-gradient(135deg, #00d4ff, #0099cc);
                        border: none;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        font-weight: 600;
                    ">🏆 Leaderboard</button>
                    <button id="navAcademy" style="
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: #aaa;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">📚 Academy</button>
                </div>

                <!-- Leaderboard List -->
                <div class="leaderboard-list" style="margin-bottom: 30px;">
                    ${leaderboardData.slice(0, 20).map((entry, index) => {
                        const isCurrentPlayer = entry.player_id === this.playerId || 
                                              entry.playerId === this.playerId ||
                                              (this.playerName && (entry.playerName === this.playerName || entry.player_name === this.playerName));
                        return `
                            <div class="leaderboard-item" style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 15px 20px;
                                margin: 8px 0;
                                background: ${isCurrentPlayer ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
                                border: ${isCurrentPlayer ? '1px solid #00d4ff' : '1px solid rgba(255, 255, 255, 0.1)'};
                                border-radius: 10px;
                                transition: all 0.3s ease;
                            ">
                                <div class="rank" style="
                                    font-size: 18px;
                                    font-weight: 700;
                                    color: ${index < 3 ? '#ffd700' : '#00d4ff'};
                                    min-width: 40px;
                                ">
                                    ${index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                                </div>
                                <div class="player-name" style="
                                    flex: 1;
                                    color: ${isCurrentPlayer ? '#00d4ff' : '#fff'};
                                    font-weight: ${isCurrentPlayer ? '600' : '400'};
                                    text-align: left;
                                    margin-left: 15px;
                                ">
                                    ${isCurrentPlayer ? '👑 ' : ''}${entry.playerName || entry.player_name || `Player ${(entry.player_id || entry.playerId || '').slice(-4)}`}
                                    ${isCurrentPlayer ? ' (You)' : ''}
                                </div>
                                <div class="score" style="
                                    font-size: 18px;
                                    font-weight: 600;
                                    color: #fff;
                                ">
                                    ${(entry.score || 0).toLocaleString()}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Actions -->
                <div class="actions" style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                    <button 
                        id="playAgainFromLeaderboard"
                        style="
                            background: linear-gradient(135deg, #00d4ff, #0099cc);
                            color: white;
                            border: none;
                            padding: 15px 25px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        🎮 Play Again
                    </button>
                    
                    <button 
                        id="closeLeaderboard"
                        style="
                            background: rgba(255, 255, 255, 0.1);
                            color: white;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            padding: 15px 25px;
                            border-radius: 10px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        ❌ Close
                    </button>
                </div>
            </div>
        `;

        this.bindLeaderboardEvents();
    }

    showEmptyLeaderboard() {
        this.container.innerHTML = `
            <div class="game-over-card" style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                border: 1px solid rgba(0, 212, 255, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
                animation: slideIn 0.4s ease-out;
            ">
                <h2 style="color: #00d4ff; font-size: 28px; margin: 0 0 20px 0; font-weight: 700;">
                    🏆 Daily Leaderboard
                </h2>
                <div style="font-size: 64px; margin-bottom: 20px;">🎮</div>
                <p style="color: #aaa; font-size: 18px; margin-bottom: 30px;">
                    Be the first to set a score today!
                </p>
                <button 
                    id="playAgainFromLeaderboard"
                    style="
                        background: linear-gradient(135deg, #00d4ff, #0099cc);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 10px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    "
                >
                    🎮 Play Now
                </button>
            </div>
        `;

        this.bindLeaderboardEvents();
    }    bindLeaderboardEvents() {
        const playAgainBtn = this.container.querySelector('#playAgainFromLeaderboard');
        const closeBtn = this.container.querySelector('#closeLeaderboard');

        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.hide();
                this.emit('play-again');
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // Add navigation events
        this.bindNavigationEvents();
    }    async initializeSystems() {
        try {
            // Initialize tournament system
            if (window.neonDrop && window.neonDrop.tournament) {
                this.tournamentSystem = window.neonDrop.tournament;
                console.log('🏆 Tournament system connected');
            }
            
            // Initialize payment system
            if (window.neonDrop && window.neonDrop.paymentSystem) {
                this.paymentSystem = window.neonDrop.paymentSystem;
                console.log('💰 Payment system connected');
            }
            
            // Load tournament info
            await this.loadTournamentInfo();
            
        } catch (error) {
            console.warn('⚠️ Systems initialization failed:', error);
        }
    }async loadTournamentInfo() {
        try {
            if (this.tournamentSystem) {
                // Use the current tournament data directly
                this.tournamentInfo = {
                    isActive: true,
                    participants: 0,
                    prizePool: { amounts: { 1: 10, 2: 5, 3: 2 } },
                    entryFee: 0.25
                };
                
                // Get leaderboard to count real participants
                const leaderboard = this.tournamentSystem.getLeaderboard(100);
                this.tournamentInfo.participants = leaderboard.length;
                
                this.playerStats = this.tournamentSystem.getPlayerStats(this.playerId);
                
                // Check free plays remaining
                const playerData = localStorage.getItem(`player_${this.playerId}_daily`);
                const todayKey = new Date().toDateString();
                const dailyData = playerData ? JSON.parse(playerData) : {};
                
                this.hasFreePlays = !dailyData[todayKey] || dailyData[todayKey].freePlaysUsed < 1;
                
                console.log('🎯 Tournament info loaded:', {
                    active: this.tournamentInfo?.isActive,
                    players: this.tournamentInfo?.participants,
                    hasFreePlays: this.hasFreePlays
                });
            }
        } catch (error) {
            console.warn('⚠️ Failed to load tournament info:', error);
        }
    }

    shouldShowTournamentEntry() {
        // Check if player should be prompted for tournament entry
        if (!this.tournamentInfo || !this.tournamentInfo.isActive) return false;
        
        // If they have free plays, they're already in
        if (this.hasFreePlays) return false;
        
        // If they haven't entered today's tournament, show entry option
        const todayKey = new Date().toDateString();
        const enteredToday = localStorage.getItem(`tournament_entered_${todayKey}`);
        
        return !enteredToday;
    }

    async showTournamentEntry() {
        const prizeInfo = this.tournamentInfo?.prizePool || { amounts: { 1: 10, 2: 5, 3: 2 } };
        const entryFee = this.tournamentInfo?.entryFee || 0.25;
        
        this.container.innerHTML = `
            <div class="game-over-card" style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                border: 1px solid rgba(255, 215, 0, 0.4);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
                animation: slideIn 0.4s ease-out;
            ">
                <!-- Tournament Header -->
                <div style="margin-bottom: 30px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🏆</div>
                    <h2 style="color: #ffd700; font-size: 24px; margin: 0 0 10px 0; font-weight: 700;">
                        Daily Tournament
                    </h2>
                    <p style="color: #aaa; font-size: 16px; margin: 0;">
                        ${this.tournamentInfo?.participants || 0} players competing today
                    </p>
                </div>

                <!-- Your Score -->
                <div style="
                    background: rgba(0, 212, 255, 0.1);
                    border: 1px solid rgba(0, 212, 255, 0.3);
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 25px;
                ">
                    <p style="color: #00d4ff; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
                        Your Score
                    </p>
                    <div style="color: white; font-size: 32px; font-weight: 700; margin: 0;">
                        ${this.score.toLocaleString()}
                    </div>
                </div>

                <!-- Prize Pool -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #ffd700; font-size: 18px; margin: 0 0 15px 0;">Prize Pool</h3>
                    <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 5px;">🥇</div>
                            <div style="color: #ffd700; font-weight: 600;">$${prizeInfo.amounts[1] || 10}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 5px;">🥈</div>
                            <div style="color: #c0c0c0; font-weight: 600;">$${prizeInfo.amounts[2] || 5}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 5px;">🥉</div>
                            <div style="color: #cd7f32; font-weight: 600;">$${prizeInfo.amounts[3] || 2}</div>
                        </div>
                    </div>
                </div>

                <!-- Entry Options -->
                <div style="margin-bottom: 25px;">
                    <button 
                        id="joinTournamentBtn"
                        style="
                            background: linear-gradient(135deg, #ffd700, #ffb700);
                            color: #000;
                            border: none;
                            padding: 15px 40px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 700;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            margin-bottom: 15px;
                            width: 100%;
                        "
                    >
                        🎯 Enter Tournament - $${entryFee}
                    </button>
                    
                    <button 
                        id="skipTournamentBtn"
                        style="
                            background: rgba(255, 255, 255, 0.1);
                            color: #aaa;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            padding: 12px 30px;
                            border-radius: 10px;
                            font-size: 14px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            width: 100%;
                        "
                    >
                        Skip Tournament (Free Play)
                    </button>
                </div>

                <p style="color: #666; font-size: 12px; margin: 0;">
                    Prize payments via Apple Pay, QUARTERS, or USDC
                </p>
            </div>
        `;

        this.bindTournamentEntryEvents();
    }

    bindTournamentEntryEvents() {
        const joinBtn = this.container.querySelector('#joinTournamentBtn');
        const skipBtn = this.container.querySelector('#skipTournamentBtn');

        if (joinBtn) {
            joinBtn.addEventListener('click', async () => {
                await this.handleTournamentEntry();
            });
        }

        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                this.savePlayerName(`Player${Math.floor(Math.random() * 10000)}`);
            });
        }
    }

    async handleTournamentEntry() {
        try {
            // Show payment options
            await this.showPaymentOptions();
            
        } catch (error) {
            console.error('❌ Tournament entry failed:', error);
            alert('Tournament entry failed. Playing as free game.');
            this.showGameResults();
        }
    }

    async showPaymentOptions() {
        const entryFee = this.tournamentInfo?.entryFee || 0.25;
        
        this.container.innerHTML = `
            <div class="game-over-card" style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                border: 1px solid rgba(0, 212, 255, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
                animation: slideIn 0.4s ease-out;
            ">
                <h2 style="color: #00d4ff; font-size: 24px; margin: 0 0 30px 0; font-weight: 700;">
                    💳 Payment Method
                </h2>
                
                <div style="margin-bottom: 20px;">
                    <p style="color: #aaa; font-size: 16px;">Tournament Entry: $${entryFee}</p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 30px;">
                    ${this.paymentSystem?.applePayProcessor?.canMakePayments ? `
                        <button 
                            id="applePayBtn"
                            style="
                                background: #000;
                                color: white;
                                border: 1px solid #333;
                                padding: 15px 30px;
                                border-radius: 10px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 10px;
                            "
                        >
                            🍎 Apple Pay
                        </button>
                    ` : ''}
                    
                    <button 
                        id="quartersBtn"
                        style="
                            background: linear-gradient(135deg, #ff6b35, #f7931e);
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 10px;
                        "
                    >
                        🪙 QUARTERS (Gaming Tokens)
                    </button>
                    
                    <button 
                        id="usdcBtn"
                        style="
                            background: linear-gradient(135deg, #2775ca, #1a5490);
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 10px;
                        "
                    >
                        💎 USDC (Sonic Labs)
                    </button>
                </div>

                <button 
                    id="backToTournamentBtn"
                    style="
                        background: rgba(255, 255, 255, 0.1);
                        color: #aaa;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 12px 30px;
                        border-radius: 10px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    "
                >
                    ← Back
                </button>
            </div>
        `;

        this.bindPaymentEvents();
    }

    bindPaymentEvents() {
        const applePayBtn = this.container.querySelector('#applePayBtn');
        const quartersBtn = this.container.querySelector('#quartersBtn');
        const usdcBtn = this.container.querySelector('#usdcBtn');
        const backBtn = this.container.querySelector('#backToTournamentBtn');

        if (applePayBtn) {
            applePayBtn.addEventListener('click', () => this.processPayment('apple_pay'));
        }

        if (quartersBtn) {
            quartersBtn.addEventListener('click', () => this.processPayment('quarters'));
        }

        if (usdcBtn) {
            usdcBtn.addEventListener('click', () => this.processPayment('usdc'));
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => this.showTournamentEntry());
        }
    }

    async processPayment(method) {
        try {
            const entryFee = this.tournamentInfo?.entryFee || 0.25;
            
            console.log(`💳 Processing ${method} payment for $${entryFee}`);
            
            // Show processing state
            const button = this.container.querySelector(`#${method.replace('_', '')}Btn`);
            if (button) {
                button.innerHTML = '⏳ Processing...';
                button.disabled = true;
            }
            
            // Process payment based on method
            let paymentResult;
            switch (method) {
                case 'apple_pay':
                    paymentResult = await this.processApplePay(entryFee);
                    break;
                case 'quarters':
                    paymentResult = await this.processQuartersPayment(entryFee);
                    break;
                case 'usdc':
                    paymentResult = await this.processUSDCPayment(entryFee);
                    break;
                default:
                    throw new Error('Invalid payment method');
            }
            
            if (paymentResult.success) {
                // Mark tournament as entered
                this.markTournamentEntered();
                
                // Submit score to tournament
                await this.submitTournamentScore();
                
                // Show success and results
                await this.showGameResults(true); // true = tournament entry successful
            } else {
                throw new Error(paymentResult.error || 'Payment failed');
            }
            
        } catch (error) {
            console.error('❌ Payment failed:', error);
            alert(`Payment failed: ${error.message}\nPlaying as free game.`);
            this.showGameResults();
        }
    }

    async processApplePay(amount) {
        if (!this.paymentSystem?.applePayProcessor) {
            throw new Error('Apple Pay not available');
        }
        
        return await this.paymentSystem.processApplePayment(amount, 'Tournament Entry');
    }

    async processQuartersPayment(amount) {
        // Convert USD to QUARTERS (assuming 1 QUARTER = $0.01)
        const quartersNeeded = Math.round(amount * 100);
        
        if (!this.paymentSystem?.quartersProcessor) {
            throw new Error('QUARTERS payment not available');
        }
        
        return await this.paymentSystem.processQuartersPayment(quartersNeeded);
    }

    async processUSDCPayment(amount) {
        if (!this.paymentSystem?.sonicLabsProcessor) {
            throw new Error('USDC payment not available');
        }
        
        return await this.paymentSystem.processUSDCPayment(amount);
    }

    async submitTournamentScore() {
        if (!this.tournamentSystem) return;
        
        try {
            const result = await this.tournamentSystem.submitScore(
                this.playerId,
                this.score,
                {
                    playerName: this.playerName,
                    gameData: {
                        timestamp: Date.now(),
                        gameType: 'neon_drop'
                    }
                }
            );
            
            this.playerRank = result.rank;
            console.log(`🏆 Tournament score submitted - Rank: ${result.rank}`);
            
        } catch (error) {
            console.error('❌ Failed to submit tournament score:', error);
        }
    }

    markTournamentEntered() {
        const todayKey = new Date().toDateString();
        localStorage.setItem(`tournament_entered_${todayKey}`, 'true');
    }

    markTournamentSkipped() {
        const todayKey = new Date().toDateString();
        localStorage.setItem(`tournament_skipped_${todayKey}`, 'true');
    }    async showLeaderboardWithNewScore() {
        console.log('🎯 showLeaderboardWithNewScore called with score:', this.score, 'player:', this.playerName);
        
        // Submit score first
        try {
            console.log('📤 Submitting score...');
            const submitResult = await this.submitScore(this.score, this.playerName);
            console.log('📤 Submit result:', submitResult);
        } catch (error) {
            console.error('❌ Score submission failed:', error);
        }
        
        // Get updated leaderboard with new score
        try {            console.log('📊 Fetching leaderboard...');
            const response = await fetch(`${this.apiBase}/leaderboard`);
            const data = await response.json();
            console.log('📊 Leaderboard response:', data);
            
            if (data.scores && data.scores.length > 0) {
                console.log('✅ Found scores, showing leaderboard with highlight');
                // Find player's new rank
                const sortedScores = data.scores.sort((a, b) => b.score - a.score);
                const playerName = this.getStoredPlayerName();
                let playerRank = sortedScores.findIndex(entry => 
                    entry.player_id === this.playerId || 
                    entry.playerName === playerName ||
                    entry.metrics?.player_name === playerName
                ) + 1;
                
                console.log('🎯 Player rank found:', playerRank, 'for player:', playerName);
                this.showBeautifulLeaderboardWithHighlight(data.scores, playerRank, this.score);
            } else {
                console.warn('⚠️ No scores found, showing empty leaderboard');
                this.showEmptyLeaderboard();
            }
        } catch (error) {
            console.error('❌ Failed to load leaderboard:', error);
            this.showEmptyLeaderboard();
        }
    }

    showBeautifulLeaderboardWithHighlight(leaderboardData, highlightRank, newScore) {
        const playerName = this.getStoredPlayerName();
        
        this.container.innerHTML = `
            <div class="game-over-card" style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 20px;
                padding: 40px;
                max-width: 600px;
                width: 90%;
                border: 1px solid rgba(0, 212, 255, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
                animation: slideIn 0.4s ease-out;
                max-height: 80vh;
                overflow-y: auto;
            ">                <!-- Score Success Header with Chiclet Animation -->
                <div class="score-success-header" style="margin-bottom: 30px;">
                    <!-- Beautiful Netflix Chiclet Title -->
                    <div class="netflix-chiclet-title" style="
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        gap: 0px;
                        margin-bottom: 20px;
                        filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
                    ">
                        <div class="chiclet-word" style="display: flex; gap: 0px;">
                            ${['N','E','O','N'].map((letter, index) => `
                                <div class="chiclet neon" style="
                                    width: 24px; height: 24px;
                                    display: flex; align-items: center; justify-content: center;
                                    font-family: 'Bungee', monospace; font-weight: bold;
                                    font-size: 28.8px; line-height: 1;
                                    border-radius: 3px; position: relative; text-align: center;
                                    background: linear-gradient(135deg, #FFFF00 0%, #FFD700 50%, #FFA500 100%);
                                    color: #000; text-shadow: 1px 1px 0 rgba(0,0,0,0.3);
                                    box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.3),
                                                inset -2px -2px 4px rgba(0, 0, 0, 0.3),
                                                0 0 10px rgba(255, 255, 0, 0.5);
                                    transform: translateY(-30px) scale(0.3); opacity: 0;
                                    animation: chicletEntrance 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                                    animation-delay: ${index * 100}ms;
                                ">${letter}</div>
                            `).join('')}
                        </div>
                        
                        <!-- Spacers -->
                        <div style="width: 24px; height: 24px;"></div>
                        <div style="width: 24px; height: 24px;"></div>
                        
                        <div class="chiclet-word" style="display: flex; gap: 0px;">
                            ${['D','R','O','P'].map((letter, index) => `
                                <div class="chiclet drop" style="
                                    width: 24px; height: 24px;
                                    display: flex; align-items: center; justify-content: center;
                                    font-family: 'Bungee', monospace; font-weight: bold;
                                    font-size: 28.8px; line-height: 1;
                                    border-radius: 3px; position: relative; text-align: center;
                                    background: linear-gradient(135deg, #8A2BE2 0%, #9932CC 50%, #DA70D6 100%);
                                    color: #000; text-shadow: 1px 1px 0 rgba(0,0,0,0.3);
                                    box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.3),
                                                inset -2px -2px 4px rgba(0, 0, 0, 0.3),
                                                0 0 10px rgba(138, 43, 226, 0.5);
                                    transform: translateY(-30px) scale(0.3); opacity: 0;
                                    animation: chicletEntrance 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                                    animation-delay: ${(4 + index) * 100}ms;
                                ">${letter}</div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="font-size: 48px; margin-bottom: 15px;">
                        ${highlightRank === 1 ? '🥇' : highlightRank === 2 ? '🥈' : highlightRank === 3 ? '🥉' : '🎮'}
                    </div>
                    <h2 style="color: #00d4ff; font-size: 28px; margin: 0 0 10px 0; font-weight: 700;">
                        ${highlightRank === 1 ? 'New Leader!' : highlightRank <= 3 ? 'Podium Finish!' : 'Score Submitted!'}
                    </h2>
                    <div style="color: #ffd700; font-size: 24px; font-weight: 600; margin-bottom: 5px;">
                        ${newScore.toLocaleString()} points
                    </div>
                    <p style="color: #aaa; font-size: 16px; margin: 0;">
                        You're #${highlightRank} of ${leaderboardData.length} players
                    </p>
                </div>

                <!-- Global Navigation -->
                <div class="global-nav" style="
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 25px;
                    padding: 15px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                ">
                    <button id="navHome" style="
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: #aaa;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">🏠 Home</button>
                    <button id="navGames" style="
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: #aaa;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">🎮 Games</button>
                    <button id="navLeaderboard" style="
                        background: linear-gradient(135deg, #00d4ff, #0099cc);
                        border: none;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        font-weight: 600;
                    ">🏆 Leaderboard</button>
                    <button id="navAcademy" style="
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: #aaa;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">📚 Academy</button>
                </div>

                <!-- Leaderboard List -->
                <div class="leaderboard-list" style="margin-bottom: 30px;">
                    ${leaderboardData.slice(0, 20).map((entry, index) => {
                        const isCurrentPlayer = entry.player_id === this.playerId || 
                                              entry.playerId === this.playerId ||
                                              (playerName && (entry.playerName === playerName || entry.player_name === playerName || entry.metrics?.player_name === playerName));
                        const isNewScore = isCurrentPlayer && Math.abs(entry.score - newScore) < 10; // Recently submitted score
                        return `
                            <div class="leaderboard-item" style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 15px 20px;
                                margin: 8px 0;
                                background: ${isNewScore ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(0, 153, 204, 0.2))' : 
                                            isCurrentPlayer ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
                                border: ${isNewScore ? '2px solid #00d4ff' : 
                                          isCurrentPlayer ? '1px solid #00d4ff' : '1px solid rgba(255, 255, 255, 0.1)'};
                                border-radius: 10px;
                                transition: all 0.3s ease;
                                ${isNewScore ? 'animation: pulseHighlight 2s ease-in-out;' : ''}
                            ">
                                <div class="rank" style="
                                    font-size: 18px;
                                    font-weight: 700;
                                    color: ${index < 3 ? '#ffd700' : '#00d4ff'};
                                    min-width: 40px;
                                ">
                                    ${index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                                </div>
                                <div class="player-info" style="flex: 1; margin: 0 15px; text-align: left;">
                                    <div style="
                                        color: ${isCurrentPlayer ? '#00d4ff' : '#fff'};
                                        font-weight: ${isCurrentPlayer ? '600' : '400'};
                                        font-size: 16px;
                                        margin-bottom: 2px;
                                    ">
                                        ${entry.playerName || entry.player_name || entry.metrics?.player_name || `Player-${entry.player_id?.slice(-4) || '????'}`}
                                        ${isCurrentPlayer ? ' (You)' : ''}
                                        ${isNewScore ? ' ✨' : ''}
                                    </div>
                                    <div style="color: #aaa; font-size: 12px;">
                                        ${this.formatTimeAgo(entry.timestamp)}
                                    </div>
                                </div>
                                <div class="score" style="
                                    color: ${isNewScore ? '#ffd700' : '#00d4ff'};
                                    font-weight: 600;
                                    font-size: 16px;
                                ">
                                    ${entry.score.toLocaleString()}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Actions -->
                <div class="actions" style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                    <button 
                        id="playAgainBtn"
                        style="
                            background: linear-gradient(135deg, #00d4ff, #0099cc);
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        🎮 Play Again
                    </button>
                    
                    <button 
                        id="shareScoreBtn"
                        style="
                            background: rgba(255, 255, 255, 0.1);
                            color: #aaa;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            padding: 15px 30px;
                            border-radius: 10px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        📤 Share
                    </button>
                </div>
            </div>            <style>
               
                @keyframes pulseHighlight {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
                    50% { transform: scale(1.02); box-shadow: 0 0 30px rgba(0, 212, 255, 0.5); }
                }
                
                @keyframes chicletEntrance {
                    0% {
                        transform: translateY(-30px) scale(0.3) rotate(10deg);
                        opacity: 0;
                    }
                    60% {
                        transform: translateY(2px) scale(1.1) rotate(-3deg);
                        opacity: 0.8;
                    }
                    100% {
                        transform: translateY(0) scale(1) rotate(0deg);
                        opacity: 1;
                    }
                }
                
                .chiclet:hover {
                    transform: translateY(0) scale(1.05) !important;
                    transition: transform 0.3s ease;
                }
                
                .global-nav button:hover:not([id="navLeaderboard"]) {
                    background: rgba(255, 255, 255, 0.2) !important;
                    color: #fff !important;
                }
            </style>
        `;

        this.bindNavigationEvents();
        this.bindLeaderboardActions();
    }

    bindNavigationEvents() {
        // Global navigation
        const navHome = this.container.querySelector('#navHome');
        const navGames = this.container.querySelector('#navGames');
        const navAcademy = this.container.querySelector('#navAcademy');

        if (navHome) {
            navHome.addEventListener('click', () => {
                window.location.href = '/';
            });
        }

        if (navGames) {
            navGames.addEventListener('click', () => {
                window.location.href = '/games/';
            });
        }

        if (navAcademy) {
            navAcademy.addEventListener('click', () => {
                window.location.href = '/academy/';
            });
        }
    }

    bindLeaderboardActions() {
        const playAgainBtn = this.container.querySelector('#playAgainBtn');
        const shareScoreBtn = this.container.querySelector('#shareScoreBtn');

        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.hide();
                this.emit('play-again');
            });
        }

        if (shareScoreBtn) {
            shareScoreBtn.addEventListener('click', () => {
                this.shareScore();
            });
        }
    }

    async shareScore() {
        const playerName = this.getStoredPlayerName();
        const rank = await this.getPlayerRank();
        const shareText = `🎮 I just scored ${this.score.toLocaleString()} points in Neon Drop and ranked #${rank}! 🏆\n\nPlay at BlockZone Lab`;
        const shareUrl = window.location.origin + '/games/neondrop/';

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Neon Drop - BlockZone Lab',
                    text: shareText,
                    url: shareUrl
                });
            } catch (error) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                this.showToast('Score copied to clipboard! 📋');
            } catch (error) {
                console.warn('Could not copy to clipboard');
            }
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #00d4ff, #0099cc);
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            z-index: 20000;
            animation: slideDown 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}
