/**
 * SimpleGameOver.js - The Frictionless Flow
 * Beautiful, minimal post-game experience inspired by Apple Arcade + Coinbase
 * Pure elegance with neon drop animations
 */

// Import the real prize calculation system
import { PrizeCalculator } from '../../../shared/economics/prize-calculator.js';

export class SimpleGameOver {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.score = 0;
        this.playerName = null;
        this.apiBase = 'https://blockzone-api.hambomyers.workers.dev';
        this.playerId = this.getOrCreatePlayerId();
        this.leaderboardData = null;
        this.playerRank = null;        // Initialize the real prize calculator with new 50%/hyperbolic/$1 system
        this.prizeCalculator = new PrizeCalculator();
        this.prizeCalculator.winnerShare = 0.50;        // 50% to 1st place
        this.prizeCalculator.minimumPrize = 1.00;       // $1 minimum
        this.prizeCalculator.prizePoolRate = 0.90;      // 90% to prizes, 10% platform
        
        this.createContainer();
        console.log('✨ SimpleGameOver initialized - Pure Elegant Flow with Real Prize System');
        
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
        document.body.appendChild(this.container);    }    getOrCreatePlayerId() {
        let playerId = localStorage.getItem('playerId');
        if (!playerId) {
            // Generate a wallet-style player ID
            const walletSuffix = this.generateWalletSuffix();
            playerId = `player_${Date.now()}_${walletSuffix}`;
            localStorage.setItem('playerId', playerId);
            localStorage.setItem('playerWalletSuffix', walletSuffix);
        }
        return playerId;
    }

    // Generate a 8-character wallet-style suffix
    generateWalletSuffix() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }    // Get the last 4 characters of the wallet suffix for display
    getWalletDisplaySuffix() {
        const suffix = localStorage.getItem('playerWalletSuffix');
        if (suffix) {
            return suffix.slice(-4).toUpperCase();
        }
        // Generate new suffix if none exists
        const playerId = this.playerId || this.getOrCreatePlayerId();
        const match = playerId.match(/_([a-z0-9]+)$/);
        return match ? match[1].slice(-4).toUpperCase() : 'ANON';
    }    // Create the display name: "Username-WXYZ"
    createDisplayName(username) {
        if (!username || username.trim() === '') {
            return null; // Require username - no anonymous players
        }
        
        // Limit username to 12 characters and clean it
        const cleanUsername = username.trim().slice(0, 12);
        const walletSuffix = this.getWalletDisplaySuffix();        
        return `${cleanUsername}-${walletSuffix}`;
    }

    getStoredPlayerName() {
        return localStorage.getItem('neonDropPlayerName');
    }async show(finalScore) {
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
            // Returning player - show simple game over card with their score
            await this.showGameOverCard();
        } else {
            // New player - the magic moment
            await this.showNameCapture();
        }
        
        // Animate in
        requestAnimationFrame(() => {
            this.container.style.opacity = '1';
        });
    }

    async showGameOverCard() {
        console.log('🎮 Showing basic game over card for returning player');
        
        // Submit score first
        try {
            await this.submitScore(this.score, this.playerName);
        } catch (error) {
            console.error('❌ Score submission failed:', error);
        }
        
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
                animation: slideIn 0.4s ease-out;
            ">
                <h2 style="color: #00d4ff; font-size: 32px; margin: 0 0 30px 0; font-weight: 700;">
                    Game Over
                </h2>
                
                <div style="font-size: 64px; margin-bottom: 20px;">🎮</div>
                
                <div style="margin-bottom: 30px;">
                    <div style="color: #00d4ff; font-size: 48px; font-weight: 900; margin-bottom: 10px;">
                        ${this.score.toLocaleString()}
                    </div>
                    <div style="color: #aaa; font-size: 18px;">
                        Great job, ${this.playerName}!
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="actions" style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
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
                            min-width: 120px;
                        "
                    >
                        🎮 Play Again
                    </button>
                    
                    <button 
                        id="leaderboardBtn"
                        style="
                            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            min-width: 120px;
                        "
                    >
                        🏆 Leaderboard
                    </button>
                </div>
            </div>
        `;
        
        // Bind button events
        this.bindGameOverCardEvents();
    }

    bindGameOverCardEvents() {
        const playAgainBtn = this.container.querySelector('#playAgainBtn');
        const leaderboardBtn = this.container.querySelector('#leaderboardBtn');
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.hide();
                this.emit('play-again');
            });
        }
        
        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', async () => {
                console.log('🏆 Leaderboard clicked - showing full-screen leaderboard');
                await this.showFullScreenLeaderboard();
            });
        }
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
                </div>                <!-- The Ask -->
                <div class="name-capture" style="margin-bottom: 30px;">
                    <p style="color: #aaa; font-size: 18px; margin-bottom: 15px; line-height: 1.4;">
                        Game Name?
                    </p>
                    
                    <div style="margin-bottom: 15px;">                        <div style="color: #888; font-size: 14px; margin-bottom: 5px;">
                            Your display name will be: <span id="namePreview" style="color: #00d4ff; font-weight: bold;">[Username]-${this.getWalletDisplaySuffix()}</span>
                        </div>
                    </div>
                    
                    <input 
                        type="text" 
                        id="playerNameInput" 
                        placeholder="Game name (max 12 chars)"
                        maxlength="12"
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
                            margin-bottom: 15px;
                            box-sizing: border-box;
                        "
                        autocomplete="off"
                    >
                    
                    <div style="color: #666; font-size: 12px; margin-bottom: 15px;">
                        Your unique Web3 signature: -${this.getWalletDisplaySuffix()}
                    </div>
                    
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
        const feedback = this.container.querySelector('.validation-feedback');        // Pre-fill with existing username (without wallet suffix)
        const existingUsername = localStorage.getItem('neonDropUsername');
        if (existingUsername) {
            nameInput.value = existingUsername;
            // Update preview immediately
            const namePreview = this.container.querySelector('#namePreview');
            if (namePreview) {
                namePreview.textContent = this.createDisplayName(existingUsername);
            }
        }

        // Auto-focus and select
        setTimeout(() => {
            nameInput.focus();
            nameInput.select();
        }, 500);// Real-time validation and name preview
        nameInput.addEventListener('input', (e) => {
            const name = e.target.value.trim();
            const isValid = name.length >= 2; // Reduced minimum to 2 chars
            
            // Update live preview
            const namePreview = this.container.querySelector('#namePreview');
            if (namePreview) {
                const displayName = this.createDisplayName(name);
                namePreview.textContent = displayName;
            }
            
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
        // Create the display name with username + wallet suffix
        const displayName = this.createDisplayName(name);
        this.playerName = displayName;
        
        // Store both the raw username and display name locally
        localStorage.setItem('neonDropPlayerName', displayName);
        localStorage.setItem('neonDropUsername', name); // Raw username for editing
        
        // Submit directly to Cloudflare API
        try {
            console.log('📤 Submitting score to Cloudflare API:', this.score, 'for player:', displayName);
            
            const response = await fetch('https://blockzone-api.hambomyers.workers.dev/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_id: this.playerId,
                    score: this.score,
                    replay_hash: `${this.playerId}_${Date.now()}_${this.score}`,                    metrics: {
                        game: 'neon_drop',
                        player_name: displayName, // Send the full display name to backend
                        username: name, // Also send raw username for reference
                        wallet_suffix: this.getWalletDisplaySuffix(),
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
                </div>                <!-- Tournament Prize Info -->
                ${isInTournament && tournamentRank <= 5 ? `
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
                            ${this.getPrizeForRank(tournamentRank)}
                        </div>
                        <div style="color: #666; font-size: 12px; margin-top: 8px;">
                            ${tournamentRank === 1 ? '🏆 50% of prize pool!' : 
                              tournamentRank <= 3 ? '🥉 Hyperbolic distribution' : 
                              '💵 $1 minimum guaranteed'}
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
            // Enhanced: Show full-screen leaderboard with hyperbolic font scaling
            try {
                console.log('🏆 Opening enhanced full-screen leaderboard');
                await this.showFullScreenLeaderboard();
            } catch (error) {
                console.error('❌ Failed to open full-screen leaderboard:', error);
                // Fallback to regular leaderboard
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
                    ${leaderboardData.slice(0, 20).map((entry, index) => {                        const isCurrentPlayer = entry.player_id === this.playerId || 
                                              entry.playerId === this.playerId ||
                                              (this.playerName && (entry.playerName === this.playerName || entry.player_name === this.playerName || entry.metrics?.player_name === this.playerName));
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
                                    ${index < 3 ? this.getRankEmoji(index) : `#${index + 1}`}
                                </div>
                                <div class="player-name" style="
                                    flex: 1;
                                    color: ${isCurrentPlayer ? '#00d4ff' : '#fff'};
                                    font-weight: ${isCurrentPlayer ? '600' : '400'};
                                    text-align: left;
                                    margin-left: 15px;
                                ">                                    ${isCurrentPlayer ? '👑 ' : ''}${entry.display_name || 'Anonymous'}
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

        // Add navigation events
        this.bindNavigationEvents();
    }    /**
 * Enhanced Full-Screen Leaderboard with Hyperbolic Font Scaling
 * Uses the same mathematical elegance as the prize pool distribution
 */
async showFullScreenLeaderboard() {
    console.log('🎯 Loading full-screen leaderboard with hyperbolic scaling');
    
    let leaderboardData = [];
    
    try {
        // Fetch leaderboard data
        const response = await fetch(`${this.apiBase}/leaderboard?period=daily&limit=100&game=neon_drop`);
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
      try {
        // Fetch leaderboard data
        const response = await fetch(`${this.apiBase}/leaderboard?period=daily&limit=100&game=neon_drop`);
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.scores && data.scores.length > 0) {
            leaderboardData = data.scores;
        }
        // If no scores from API, leaderboardData stays empty array - that's fine
          } catch (error) {
        console.log('🎮 API unavailable, showing leaderboard with current player only');
        leaderboardData = []; // Start with empty array
    }
    
    // Always add current player's score if we have one
    if (this.playerName && this.score > 0) {
        const currentPlayerEntry = {
            player_id: this.playerId,
            display_name: this.playerName,
            high_score: this.score,
            timestamp: Date.now(),
            is_current_player: true
        };
        
        // Add current player if they're not already in the list
        const existingPlayerIndex = leaderboardData.findIndex(entry => 
            entry.player_id === this.playerId || entry.display_name === this.playerName
        );
        
        if (existingPlayerIndex === -1) {
            leaderboardData.push(currentPlayerEntry);
        } else {
            // Update existing entry if current score is higher
            if (this.score > leaderboardData[existingPlayerIndex].high_score) {
                leaderboardData[existingPlayerIndex] = currentPlayerEntry;
            }
        }
        
        // Sort by score descending
        leaderboardData.sort((a, b) => b.high_score - a.high_score);
        
        console.log('🎯 Leaderboard with current player:', leaderboardData.length, 'entries');
    }
    
    // Only show empty screen if we truly have no data at all
    if (leaderboardData.length === 0) {
        console.log('🎮 No scores and no current player data');
        this.showEmptyFullScreenLeaderboard();
        return;
    }
        
        // Create full-screen container
        this.container.innerHTML = `
            <div class="fullscreen-leaderboard-backdrop" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(135deg, 
                    rgba(0, 0, 0, 0.95) 0%,
                    rgba(20, 0, 40, 0.98) 50%,
                    rgba(0, 0, 0, 0.95) 100%);
                backdrop-filter: blur(10px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div class="leaderboard-content" style="
                    width: 90vw;
                    max-width: 1200px;
                    height: 85vh;
                    background: linear-gradient(145deg, 
                        rgba(30, 0, 60, 0.9) 0%,
                        rgba(60, 0, 120, 0.8) 50%,
                        rgba(30, 0, 60, 0.9) 100%);
                    border: 2px solid var(--neon-cyan);
                    border-radius: 20px;
                    box-shadow: 
                        0 0 50px rgba(0, 255, 255, 0.3),
                        inset 0 0 30px rgba(0, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                ">
                    <div class="leaderboard-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 30px;
                        border-bottom: 1px solid rgba(0, 255, 255, 0.3);
                        background: linear-gradient(90deg, 
                            transparent 0%,
                            rgba(0, 255, 255, 0.1) 50%,
                            transparent 100%);
                    ">
                        <h1 style="
                            margin: 0;
                            font-size: clamp(24px, 4vw, 48px);
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 3px;
                            color: var(--neon-cyan);
                            text-shadow: 
                                0 0 10px currentColor,
                                0 0 20px currentColor,
                                0 0 30px currentColor;
                            animation: neonPulse 2s ease-in-out infinite alternate;
                        ">
                            HALL OF FAME
                        </h1>
                        <button id="closeFullScreenLeaderboard" style="
                            background: none;
                            border: 2px solid var(--neon-cyan);
                            color: var(--neon-cyan);
                            width: 50px;
                            height: 50px;
                            border-radius: 50%;
                            font-size: 24px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">×</button>
                    </div>
                    <div class="leaderboard-viewport" style="
                        flex: 1;
                        overflow-y: auto;
                        overflow-x: hidden;
                        padding: 20px 30px;
                        position: relative;
                    ">
                        ${this.generateHyperbolicLeaderboard(leaderboardData)}
                    </div>
                    <div class="leaderboard-footer" style="
                        padding: 15px 30px;
                        border-top: 1px solid rgba(0, 255, 255, 0.3);
                        background: linear-gradient(90deg, 
                            transparent 0%,
                            rgba(0, 255, 255, 0.05) 50%,
                            transparent 100%);
                        text-align: center;
                        color: rgba(255, 255, 255, 0.7);
                        font-size: 14px;
                        font-weight: 500;
                    ">
                        Scroll for more • ESC to close
                    </div>
                </div>
            </div>
        `;
        
        // Add styles for neon pulse animation
        if (!document.getElementById('neon-pulse-styles')) {
            const style = document.createElement('style');
            style.id = 'neon-pulse-styles';
            style.textContent = `
                @keyframes neonPulse {
                    from { 
                        text-shadow: 
                            0 0 10px currentColor,
                            0 0 20px currentColor,
                            0 0 30px currentColor;
                    }
                    to { 
                        text-shadow: 
                            0 0 5px currentColor,
                            0 0 15px currentColor,
                            0 0 25px currentColor,
                            0 0 35px currentColor;
                    }
                }
            `;
            document.head.appendChild(style);
        }
          // Bind close events
        this.bindFullScreenLeaderboardEvents();
}

/**
 * Generate mock leaderboard data for testing hyperbolic font scaling/**
 * Show empty full-screen leaderboard (for when API fails or no data)
 */
showEmptyFullScreenLeaderboard() {
    console.log('🎮 Showing empty full-screen leaderboard');
    
    this.container.innerHTML = `
        <div class="fullscreen-leaderboard-backdrop" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, 
                rgba(0, 0, 0, 0.95) 0%,
                rgba(20, 0, 40, 0.98) 50%,
                rgba(0, 0, 0, 0.95) 100%);
            backdrop-filter: blur(10px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div class="leaderboard-content" style="
                width: 90vw;
                max-width: 600px;
                height: 60vh;
                background: linear-gradient(145deg, 
                    rgba(30, 0, 60, 0.9) 0%,
                    rgba(60, 0, 120, 0.8) 50%,
                    rgba(30, 0, 60, 0.9) 100%);
                border: 2px solid var(--neon-cyan);
                border-radius: 20px;
                box-shadow: 
                    0 0 50px rgba(0, 255, 255, 0.3),
                    inset 0 0 30px rgba(0, 255, 255, 0.1);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 40px;
            ">
                <h1 style="
                    margin: 0 0 30px 0;
                    font-size: clamp(24px, 4vw, 48px);
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    color: var(--neon-cyan);
                    text-shadow: 
                        0 0 10px currentColor,
                        0 0 20px currentColor,
                        0 0 30px currentColor;
                ">
                    HALL OF FAME
                </h1>
                
                <div style="font-size: 64px; margin-bottom: 20px;">🎮</div>                <p style="
                    color: #aaa;
                    font-size: 18px;
                    margin-bottom: 30px;
                    line-height: 1.5;
                ">
                    Leaderboard service temporarily unavailable.<br>
                    Your score will be saved when the service returns.
                </p>
                
                <button id="closeEmptyLeaderboard" style="
                    background: linear-gradient(135deg, #00d4ff, #0099cc);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    🎮 Back to Game
                </button>
            </div>
        </div>
    `;
    
    // Bind close event
    const closeBtn = this.container.querySelector('#closeEmptyLeaderboard');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hide();
            this.emit('play-again');
        });
    }
    
    // ESC key to close
    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            this.hide();
            this.emit('play-again');
            document.removeEventListener('keydown', handleKeydown);
        }
    };
    document.addEventListener('keydown', handleKeydown);
}

/**
 * Generate leaderboard with hyperbolic font scaling
 * Uses same formula as prize pool: larger font for higher ranks
 */
generateHyperbolicLeaderboard(scores) {
    const maxFontSize = 48;  // #1 position
    const minFontSize = 16;  // #100+ positions
    const scalingCutoff = 100; // After position 100, use normal size
    
    const getFontSize = (position) => {
        if (position > scalingCutoff) {
            return minFontSize;
        }
        
        // Use hyperbolic scaling: fontSize = maxSize / position
        // With smooth interpolation to minimum
        const hyperbolicSize = maxFontSize / position;
        const t = Math.min(position / scalingCutoff, 1);
        const smoothedSize = hyperbolicSize * (1 - t) + minFontSize * t;
        
        return Math.max(minFontSize, smoothedSize);
    };
    
    return scores.map((entry, index) => {
        const position = index + 1;
        const fontSize = getFontSize(position);
        const isCurrentPlayer = entry.player_id === this.playerId || 
                               entry.display_name === this.playerName;
        
        // Special styling for top 3
        let rankColor = 'var(--neon-cyan)';
        let bgGradient = 'rgba(0, 255, 255, 0.05), rgba(255, 0, 255, 0.05)';
        let borderColor = 'rgba(0, 255, 255, 0.2)';
        
        if (position === 1) {
            rankColor = '#FFD700';
            bgGradient = 'rgba(255, 215, 0, 0.3), rgba(255, 140, 0, 0.3)';
            borderColor = '#FFD700';
        } else if (position === 2) {
            rankColor = '#C0C0C0';
            bgGradient = 'rgba(192, 192, 192, 0.3), rgba(169, 169, 169, 0.3)';
            borderColor = '#C0C0C0';
        } else if (position === 3) {
            rankColor = '#CD7F32';
            bgGradient = 'rgba(205, 127, 50, 0.3), rgba(184, 115, 51, 0.3)';
            borderColor = '#CD7F32';
        }
        
        if (isCurrentPlayer) {
            bgGradient = 'rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.2)';
            borderColor = '#FFD700';
        }
        
        return `
            <div class="leaderboard-entry ${isCurrentPlayer ? 'current-player' : ''}" style="
                display: flex;
                align-items: center;
                padding: ${Math.max(12, fontSize * 0.3)}px 20px;
                margin: 8px 0;
                background: linear-gradient(90deg, ${bgGradient});
                border: 1px solid ${borderColor};
                border-radius: 12px;
                transition: all 0.3s ease;
                font-size: ${fontSize}px;
                ${isCurrentPlayer ? 'box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);' : ''}
            ">
                <div style="
                    font-weight: 900;
                    color: ${rankColor};
                    text-shadow: 0 0 10px currentColor;
                    min-width: ${Math.max(80, fontSize * 2)}px;
                    text-align: right;
                    margin-right: 20px;
                ">#${position}</div>
                <div style="
                    flex: 1;
                    color: white;
                    font-weight: 600;
                ">${this.escapeHtml(entry.display_name || 'Anonymous')}</div>
                <div style="
                    font-weight: 900;
                    color: var(--neon-magenta);
                    text-shadow: 0 0 10px currentColor;
                    min-width: ${Math.max(120, fontSize * 3)}px;
                    text-align: right;
                ">${entry.high_score.toLocaleString()}</div>
            </div>
        `;
    }).join('');
}

bindFullScreenLeaderboardEvents() {
    const closeBtn = this.container.querySelector('#closeFullScreenLeaderboard');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hide();
            this.emit('play-again'); // Return to game
        });
    }
    
    // ESC key to close
    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            this.hide();
            this.emit('play-again');
            document.removeEventListener('keydown', handleKeydown);
        }
    };
    document.addEventListener('keydown', handleKeydown);
    
    // Close button hover effects
    if (closeBtn) {
        closeBtn.addEventListener('mouseover', () => {
            closeBtn.style.background = 'var(--neon-cyan)';
            closeBtn.style.color = 'black';
            closeBtn.style.boxShadow = '0 0 20px var(--neon-cyan)';
            closeBtn.style.transform = 'scale(1.1)';
        });
        
        closeBtn.addEventListener('mouseout', () => {
            closeBtn.style.background = 'none';
            closeBtn.style.color = 'var(--neon-cyan)';
            closeBtn.style.boxShadow = 'none';
            closeBtn.style.transform = 'scale(1)';
        });
    }
}

async initializeSystems() {
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
            // Get real tournament data from API or fallback
            const entryFee = 2.50;
            let participants = 10; // Default minimum
            
            // Try to get real participant count from API
            try {
                const response = await fetch(`${this.apiBase}/leaderboard?period=daily&limit=100`);
                const data = await response.json();
                if (data.scores && data.scores.length > 0) {
                    participants = data.scores.length;
                }
            } catch (error) {
                console.warn('Could not fetch participant count, using default');
            }
            
            // Calculate REAL prizes using the new 50%/hyperbolic/$1 system
            const totalRevenue = participants * entryFee;
            const prizeData = this.prizeCalculator.calculatePrizes(totalRevenue);
            
            this.tournamentInfo = {
                isActive: true,
                participants: participants,
                entryFee: entryFee,
                totalRevenue: totalRevenue,
                prizePool: prizeData.prizePool,
                prizes: prizeData.prizes,
                distribution: prizeData.distribution,
                minimumGuaranteed: prizeData.minimumGuaranteed
            };
            
            // Check free plays remaining
            const playerData = localStorage.getItem(`player_${this.playerId}_daily`);
            const todayKey = new Date().toDateString();
            const dailyData = playerData ? JSON.parse(playerData) : {};
            
            this.hasFreePlays = !dailyData[todayKey] || dailyData[todayKey].freePlaysUsed < 1;
            
            console.log('🎯 Real Tournament Prizes Calculated:', {
                participants: participants,
                totalRevenue: `$${totalRevenue}`,
                prizePool: `$${prizeData.prizePool}`,
                prizes: prizeData.prizes.map((p, i) => `${i+1}st: $${p}`),
                system: '50% winner + hyperbolic + $1 minimum'
            });
            
        } catch (error) {
            console.warn('⚠️ Failed to load tournament info:', error);
            // Fallback to minimal tournament info
            this.tournamentInfo = {
                isActive: true,
                participants: 10,
                entryFee: 2.50,
                prizePool: 22.50,
                prizes: [11.25, 5.62, 2.81, 1.41, 1.00], // Example with 50% system
                minimumGuaranteed: true
            };
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
    }    async showTournamentEntry() {
        const entryFee = this.tournamentInfo?.entryFee || 2.50;
        const prizes = this.tournamentInfo?.prizes || [11.25, 5.62, 2.81, 1.41, 1.00];
        const prizePool = this.tournamentInfo?.prizePool || 22.50;
        
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
                </div>                <!-- Prize Pool with Real Calculations -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #ffd700; font-size: 18px; margin: 0 0 15px 0;">
                        Prize Pool: $${prizePool.toFixed(2)}
                    </h3>
                    <div style="color: #aaa; font-size: 12px; margin-bottom: 15px;">
                        50% to winner • Hyperbolic distribution • $1 minimum
                    </div>
                    <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 5px;">🥇</div>
                            <div style="color: #ffd700; font-weight: 600; font-size: 14px;">$${prizes[0]?.toFixed(2) || '0'}</div>
                            <div style="color: #666; font-size: 10px;">50%</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 5px;">🥈</div>
                            <div style="color: #c0c0c0; font-weight: 600; font-size: 14px;">$${prizes[1]?.toFixed(2) || '0'}</div>
                            <div style="color: #666; font-size: 10px;">Hyperbolic</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 5px;">🥉</div>
                            <div style="color: #cd7f32; font-weight: 600; font-size: 14px;">$${prizes[2]?.toFixed(2) || '0'}</div>
                            <div style="color: #666; font-size: 10px;">Hyperbolic</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 20px; margin-bottom: 5px;">🏆</div>
                            <div style="color: #00d4ff; font-weight: 600; font-size: 14px;">$${prizes[3]?.toFixed(2) || '1.00'}</div>
                            <div style="color: #666; font-size: 10px;">4th-5th</div>
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
        
        // Hide the current game over UI
        this.hide();
          // Show the full-screen arcade leaderboard with current player highlighted
        try {
            console.log('🏆 Opening full-screen arcade leaderboard for returning player');
            
            await this.showFullScreenLeaderboard();
            
        } catch (error) {
            console.error('❌ Failed to open full-screen leaderboard:', error);
            // Show the game over UI as fallback
            this.container.style.display = 'flex';
            this.container.style.opacity = '1';
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
                        padding:  8px 16px;
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
                                    ${index < 3 ? this.getRankEmoji(index) : `#${index + 1}`}
                                </div>
                                <div class="player-info" style="flex: 1; margin: 0 15px; text-align: left;">
                                    <div style="
                                        color: ${isCurrentPlayer ? '#00d4ff' : '#fff'};
                                        font-weight: ${isCurrentPlayer ? '600' : '400'};
                                        font-size: 16px;
                                        margin-bottom: 2px;
                                    ">
                                        ${entry.display_name || 'Anonymous'}
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
                            border-radius:  10px;
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
                    50% { transform: scale(1.02); box-shadow: 0  0 30px rgba(0, 212, 255, 0.5); }
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
    }    bindNavigationEvents() {
        // Global navigation
        const navHome = this.container.querySelector('#navHome');
        const navGames = this.container.querySelector('#navGames');
        const navAcademy = this.container.querySelector('#navAcademy');
        const navLeaderboard = this.container.querySelector('#navLeaderboard');

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

        if (navLeaderboard) {
            navLeaderboard.addEventListener('click', async () => {
                // If we're already showing leaderboard, change the button behavior
                const isLeaderboardVisible = this.container.querySelector('.leaderboard-content');
                if (isLeaderboardVisible) {
                    // Already showing leaderboard, so "Play Again" instead
                    this.hide();
                    this.emit('play-again');
                } else {
                    // Show leaderboard
                    await this.showLeaderboard();
                }
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

    // Get the prize amount for a specific rank using real prize calculator
    getPrizeForRank(rank) {
        if (!this.tournamentInfo || !this.tournamentInfo.prizes) {
            return '$1.00'; // Fallback minimum
        }
        
        const prizes = this.tournamentInfo.prizes;
        if (rank <= prizes.length) {
            const amount = prizes[rank - 1];
            return `$${amount.toFixed(2)}`;
        }
        
        return '$1.00'; // Minimum guarantee
   }

    // Admin method to clear backend KV leaderboard data
    async clearBackendLeaderboard() {
        console.log('🧹 Clearing backend KV leaderboard data...');
        
        try {
            const response = await fetch(`${this.apiBase}/admin/clear-leaderboard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Backend leaderboard cleared:', result);
                return true;
            } else {
                console.warn('⚠️ Failed to clear backend leaderboard:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Error clearing backend leaderboard:', error);
            return false;
        }
    }

    // Enhanced clear method that clears EVERYTHING
    async clearEverything() {
        console.log('🧹 NUCLEAR RESET: Clearing ALL player and leaderboard data...');
        
        // Clear local storage
        this.clearAllPlayerData();
        
        // Clear backend KV data
        const backendCleared = await this.clearBackendLeaderboard();
        
        if (backendCleared) {
            console.log('✨ COMPLETE RESET: Both local and backend data cleared!');
            this.showToast('🧹 Complete data reset successful!');
        } else {
            console.log('⚠️ Local data cleared, but backend may still have data');
            this.showToast('⚠️ Local data cleared (backend may need manual reset)');
        }
        
        return backendCleared;
    }

    /**
     * Update the leaderboard button text based on current view
     */
    updateLeaderboardButtonText() {
        const navLeaderboard = this.container.querySelector('#navLeaderboard');
        if (!navLeaderboard) return;

        const isLeaderboardVisible = this.container.querySelector('.leaderboard-content');
        if (isLeaderboardVisible) {
            navLeaderboard.innerHTML = '🎮 Play Again';
            navLeaderboard.title = 'Start a new game';
        } else {
            navLeaderboard.innerHTML = '🏆 Leaderboard';
            navLeaderboard.title = 'View leaderboard';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
