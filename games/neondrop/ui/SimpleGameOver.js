/**
 * SimpleGameOver.js - The Frictionless Flow
 * Beautiful, minimal post-game experience inspired by Apple Arcade + Coinbase
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
        console.log('✨ SimpleGameOver initialized - Frictionless Flow ready');
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
        document.body.appendChild(this.container);
    }

    getOrCreatePlayerId() {
        let playerId = localStorage.getItem('playerId');
        if (!playerId) {
            playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('playerId', playerId);
        }
        return playerId;
    }

    async show(finalScore) {
        if (this.isVisible) return;
        
        this.score = finalScore;
        this.isVisible = true;
        this.playerName = this.getStoredPlayerName();
        
        console.log('🎮 Game Over - Score:', finalScore, 'Player:', this.playerName || 'New Player');
        
        // Show container
        this.container.style.display = 'flex';
        
        if (this.playerName) {
            // Returning player - straight to results
            await this.showGameResults();
        } else {
            // New player - the magic moment
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
        
        // Submit to leaderboard using existing tournament system
        try {
            if (window.tournamentSystem) {
                const submitResult = await window.tournamentSystem.submitScore(
                    this.playerId, 
                    this.score, 
                    { 
                        playerName: name,
                        gameData: { timestamp: Date.now() }
                    }
                );
                this.playerRank = submitResult.rank;
                console.log('✅ Score submitted via tournament system:', submitResult);
            } else {
                // Fallback to direct API call
                const submitResult = await this.submitScore(this.score, name);
                if (submitResult) {
                    this.playerRank = submitResult.rank;
                }
            }
        } catch (error) {
            console.error('❌ Score submission failed:', error);
        }
        
        // Fetch fresh leaderboard data
        await this.fetchLeaderboard();
        
        // Show results
        await this.showGameResults();
    }

    async showGameResults() {
        const rank = await this.getPlayerRank();
        const totalPlayers = await this.getTotalPlayers();
        
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
                <!-- Player Identity -->
                <div class="player-header" style="margin-bottom: 30px;">
                    <div style="font-size: 24px; color: #00d4ff; font-weight: 600; margin-bottom: 5px;">
                        ${this.playerName}
                    </div>
                    <div style="color: #aaa; font-size: 16px;">
                        Rank #${rank} of ${totalPlayers} players
                    </div>
                </div>

                <!-- Score Display -->
                <div class="score-display" style="margin-bottom: 30px;">
                    <div style="color: #fff; font-size: 36px; font-weight: 700; margin-bottom: 10px;">
                        ${this.score.toLocaleString()}
                    </div>
                    <div style="color: #00ff88; font-size: 14px;">
                        ${rank <= 10 ? '🏆 Top 10!' : rank <= 50 ? '🎯 Top 50!' : '🎮 Great job!'}
                    </div>
                </div>

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
            // Use the original DailyTournament API for leaderboard data
            try {
                console.log('🏆 Fetching leaderboard from DailyTournament API');
                
                // Import and use the DailyTournament class directly
                const { DailyTournament } = await import('../../../shared/tournaments/daily-tournament.js');
                const tournamentAPI = new DailyTournament();
                
                // Get real leaderboard data
                const leaderboardData = await tournamentAPI.getLeaderboard();
                
                if (leaderboardData && leaderboardData.length > 0) {
                    this.showBeautifulLeaderboard(leaderboardData);
                } else {
                    console.warn('⚠️ No leaderboard data available');
                    this.showEmptyLeaderboard();
                }
                
            } catch (error) {
                console.error('❌ Failed to load leaderboard:', error);
                // Fallback to unified player card if available
                if (window.playerCard && window.playerCard.showLeaderboard) {
                    this.hide();
                    try {
                        await window.playerCard.showLeaderboard();
                    } catch (cardError) {
                        console.error('❌ Unified player card also failed:', cardError);
                        this.emit('show-leaderboard');
                    }
                } else {
                    this.emit('show-leaderboard');
                }
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
        // Use tournament system if available
        if (window.tournamentSystem && this.playerRank) {
            return this.playerRank;
        }
        
        // Use API data if available from score submission
        if (this.playerRank) {
            return this.playerRank;
        }
        
        // Use leaderboard data if available
        if (this.leaderboardData && this.leaderboardData.scores) {
            const betterScores = this.leaderboardData.scores.filter(entry => entry.score > this.score);
            return betterScores.length + 1;
        }
        
        // Fallback to local scores
        const scores = JSON.parse(localStorage.getItem('neonDropScores') || '[]');
        const betterScores = scores.filter(entry => entry.score > this.score);
        return betterScores.length + 1;
    }

    async getTotalPlayers() {
        // Use tournament system if available
        if (window.tournamentSystem) {
            try {
                const leaderboard = await window.tournamentSystem.getLeaderboard();
                return leaderboard.length;
            } catch (error) {
                console.warn('Could not get tournament player count:', error);
            }
        }
        
        // Use API data if available
        if (this.leaderboardData && this.leaderboardData.total_players) {
            return this.leaderboardData.total_players;
        }
        
        // Fallback
        const scores = JSON.parse(localStorage.getItem('neonDropScores') || '[]');
        return Math.max(scores.length, 50); // Minimum 50 for psychological effect
    }

    getStoredPlayerName() {
        return localStorage.getItem('neonDropPlayerName');
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
            ">
                <!-- Header -->
                <div class="leaderboard-header" style="margin-bottom: 30px;">
                    <h2 style="color: #00d4ff; font-size: 28px; margin: 0 0 10px 0; font-weight: 700;">
                        🏆 Daily Leaderboard
                    </h2>
                    <p style="color: #aaa; font-size: 16px; margin: 0;">
                        ${leaderboardData.length} players competing today
                    </p>
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
                <div class="actions" style="display: flex; gap: 15px; justify-content: center;">
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
    }

    bindLeaderboardEvents() {
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
    }

    // ...existing code...
}
