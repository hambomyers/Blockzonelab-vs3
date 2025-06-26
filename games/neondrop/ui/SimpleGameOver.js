/**
 * SimpleGameOver.js - The Frictionless Flow
 * Beautiful, minimal post-game experience inspired by Apple Arcade + Coinbase
 * Pure elegance with neon drop animations
 */

// Import the real prize calculation system
import { PrizeCalculator } from '../../../shared/economics/prize-calculator.js';
import { sessionManager } from '../../../shared/platform/session.js';
import { referralTracker } from '../../../shared/components/ReferralTracker.js';

export class SimpleGameOver {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.score = 0;
        this.playerName = null;
        this.playerId = null;
        this.playerRank = null;
        this.apiBase = 'https://blockzone-api.hambomyers.workers.dev';
        
        console.log('🔥 AGGRESSIVE SimpleGameOver initialized with API base:', this.apiBase);
            
        this.prizeCalculator = new PrizeCalculator();
        this.prizeCalculator.winnerShare = 0.50;        // 50% to 1st place
        this.prizeCalculator.minimumPrize = 1.00;       // $1 minimum
        this.prizeCalculator.prizePoolRate = 0.90;      // 90% to prizes, 10% platform
        
        this.createContainer();
        this.initSession();
        console.log('✨ SimpleGameOver initialized - Pure Elegant Flow with Real Prize System');
        
        // Initialize systems asynchronously
        // this.initializeSystems(); // <-- Removed to fix TypeError
    }

    async initSession() {
        try {
            await sessionManager.init();
            await sessionManager.migrateOldData();
            
            this.playerId = sessionManager.getPlayerId();
            this.playerName = sessionManager.getDisplayName();
            
            console.log('✅ Session initialized:', this.playerId, this.playerName);
        } catch (error) {
            console.error('❌ Session initialization failed:', error);
            // Fallback to old system
            this.playerId = this.getOrCreatePlayerId();
            this.playerName = this.getStoredPlayerName();
        }
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease-out;
        `;
        document.body.appendChild(this.container);
    }

    // Fallback method for old localStorage system
    getOrCreatePlayerId() {
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
    }

    // Get the last 4 characters of the wallet suffix for display
    getWalletDisplaySuffix() {
        const suffix = localStorage.getItem('playerWalletSuffix');
        if (suffix) {
            return suffix.slice(-4).toUpperCase();
        }
        // Generate new suffix if none exists
        const playerId = this.playerId || this.getOrCreatePlayerId();
        const match = playerId.match(/_([a-z0-9]+)$/);
        return match ? match[1].slice(-4).toUpperCase() : 'ANON';
    }

    // Create the display name: "Username-WXYZ"
    createDisplayName(username) {
        if (!username || username.trim() === '') {
            return null; // Require username - no anonymous players
        }
        
        // Limit username to 12 characters and clean it
        const cleanUsername = username.trim().slice(0, 12);
        const walletSuffix = this.getWalletDisplaySuffix();        
        return `${cleanUsername}-${walletSuffix}`;
    }

    // Fallback method for old localStorage system
    getStoredPlayerName() {
        return localStorage.getItem('neonDropPlayerName');
    }

    async show(finalScore) {
        if (this.isVisible) return;
        
        // Just get the damn score
        this.score = finalScore || 0;
        
        // If it's still 0, get it from wherever it actually is
        if (this.score === 0 && window.neonDrop?.gameEngine?.score) {
            this.score = window.neonDrop.gameEngine.score;
        }
        
        this.isVisible = true;
        
        console.log('🎮 Game Over - Score:', this.score, 'Player:', this.playerName || 'New Player');
        
        // Refresh tournament and player data
        // await this.loadTournamentInfo(); // <-- Removed to fix TypeError
        // Show container
        this.container.style.display = 'flex';
        if (this.playerName) {
            // Returning player - show simple game over card with their score
            await this.showGameOverCard();
        } else {
            // New player - the magic moment
            await this.showNameCapture();
        }
        
        // AAA Quality: Much longer, more dramatic fade-in animation
        requestAnimationFrame(() => {
            this.container.style.transition = 'opacity 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            this.container.style.opacity = '1';
        });
    }

    async showGameOverCard() {
        console.log('🎮 Showing enhanced game over card with animated NeonDrop logo');
        
        this.container.innerHTML = `
            <div class="game-over-card" style="
                display: grid;
                grid-template-rows: auto auto auto;
                gap: 20px;
                place-items: center;
                text-align: center;
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid rgba(0, 212, 255, 0.5);
                border-radius: 15px;
                padding: 10px 30px 30px 30px;
                max-width: 600px;
                margin: 0 auto;
                box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
                backdrop-filter: blur(10px);
                opacity: 0;
                transform: translateY(50px) scale(0.9);
                transition: all 4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            ">
                
                <!-- Logo Section - At the very top -->
                <div class="logo-section" style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    min-height: 120px;
                    padding-top: 10px;
                ">
                    <canvas id="logoCanvas" width="480" height="120" style="
                        display: block;
                        margin: 0 auto;
                    "></canvas>
                </div>
                
                <!-- Score Display - Automatically Centered -->
                <div class="score-section" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    background: rgba(0, 212, 255, 0.1);
                    border: 1px solid rgba(0, 212, 255, 0.3);
                    border-radius: 10px;
                    padding: 20px;
                ">
                    <div style="color: #00d4ff; font-size: 24px; margin: 0 0 10px 0;">
                        Final Score
                    </div>
                    <div style="color: #ffffff; font-size: 36px; font-weight: bold;">
                        ${this.score.toLocaleString()}
                    </div>
                </div>
                
                <!-- Navigation Grid - Automatically Centered -->
                <div class="navigation-section" style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    width: 100%;
                ">
                    <button id="playAgainBtn" style="
                        background: linear-gradient(135deg, #00d4ff, #0099cc);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        padding: 15px 20px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 212, 255, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 212, 255, 0.3)'">
                        🎮 Play Again
                    </button>
                    
                    <button id="leaderboardBtn" style="
                        background: linear-gradient(135deg, #8A2BE2, #9932CC);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        padding: 15px 20px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(138, 43, 226, 0.3);
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(138, 43, 226, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(138, 43, 226, 0.3)'">
                        🏆 Leaderboard
                    </button>
                    
                    <button id="academyBtn" style="
                        background: linear-gradient(135deg, #FFD700, #FFA500);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        padding: 15px 20px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 215, 0, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255, 215, 0, 0.3)'">
                        📚 Academy
                    </button>
                    
                    <button id="shareBtn" style="
                        background: linear-gradient(135deg, #FF6B6B, #FF8E53);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        padding: 15px 20px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 107, 107, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255, 107, 107, 0.3)'">
                        📤 Share Score
                    </button>
                </div>
            </div>
        `;
        
        // Render the animated NeonDrop logo
        this.renderNeonDropLogo();
        
        // Bind button events
        this.bindEnhancedGameOverCardEvents();
        
        // CINEMATIC FADE-IN: Trigger the beautiful fade-in animation
        setTimeout(() => {
            const card = this.container.querySelector('.game-over-card');
            if (card) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }
        }, 100); // Small delay to ensure DOM is ready
    }

    bindEnhancedGameOverCardEvents() {
        const playAgainBtn = this.container.querySelector('#playAgainBtn');
        const leaderboardBtn = this.container.querySelector('#leaderboardBtn');
        const academyBtn = this.container.querySelector('#academyBtn');
        const shareBtn = this.container.querySelector('#shareBtn');
        
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
        
        if (academyBtn) {
            academyBtn.addEventListener('click', () => {
                window.location.href = '/academy/';
            });
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareScore();
            });
        }
    }

    renderNeonDropLogo() {
        const canvas = this.container.querySelector('#logoCanvas');
        if (!canvas) {
            console.error('Logo canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const blockSize = 48; // TWICE as big (was 24px)
        const spacing = 48; // TWICE the spacing (was 24px)
        
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // SIMPLIFIED: CSS Grid handles centering automatically
        // Just center the logo within the canvas itself
        const totalBlocks = 10; // 4 NEON + 2 spacer + 4 DROP
        const totalWidth = totalBlocks * blockSize;
        const startX = (canvas.width - totalWidth) / 2;
        const startY = (canvas.height - blockSize) / 2;
        
        // NEON (left 4 blocks) - EXACT same as renderer.js but bigger
        for (let i = 0; i < 4; i++) {
            const x = startX + (i * blockSize);
            this.renderTitleLetter(ctx, 'NEON'[i], x, startY, '#FFFF00', blockSize);
        }
        
        // DROP (right 4 blocks) - EXACT same as renderer.js but bigger
        for (let i = 0; i < 4; i++) {
            const x = startX + ((i + 6) * blockSize); // 6 = 4 NEON + 2 spacer
            this.renderTitleLetter(ctx, 'DROP'[i], x, startY, '#8A2BE2', blockSize);
        }
        
        // Add production-style roll-in animation
        this.addLogoRollInAnimation(canvas);
    }
    
    addLogoRollInAnimation(canvas) {
        // Start with logo above the screen
        canvas.style.transform = 'translateY(-200px) rotateX(90deg)';
        canvas.style.opacity = '0';
        canvas.style.transition = 'none';
        
        // Force a reflow
        canvas.offsetHeight;
        
        // Production roll-in animation
        canvas.style.transition = 'all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        canvas.style.transform = 'translateY(0) rotateX(0deg)';
        canvas.style.opacity = '1';
        
        // Add subtle bounce at the end
        setTimeout(() => {
            canvas.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            canvas.style.transform = 'translateY(-5px) scale(1.02)';
            
            setTimeout(() => {
                canvas.style.transform = 'translateY(0) scale(1)';
            }, 300);
        }, 1200);
    }
    
    renderTitleLetter(ctx, letter, x, y, color, size) {
        // EXACT same implementation as renderer.js
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.clearRect(0, 0, size, size);
        
        // FIXED: Pass isNeon parameter based on color
        const isNeon = color === '#FFFF00';
        this.drawChicletBlock(tempCtx, 0, 0, size, color, isNeon);
        
        tempCtx.save();
        tempCtx.globalCompositeOperation = 'destination-out';
        tempCtx.font = `bold ${size * 1.2}px Bungee, monospace`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(letter, size / 2, size / 2 + size * 0.1);
        tempCtx.restore();
        
        // CHANGED: Much thinner stroke - EXACT same as renderer.js
        tempCtx.strokeStyle = '#000000';
        tempCtx.lineWidth = 1;
        tempCtx.font = `bold ${size * 1.2}px Bungee, monospace`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.strokeText(letter, size / 2, size / 2 + size * 0.1);
        
        ctx.drawImage(tempCanvas, x, y);
    }
    
    drawChicletBlock(ctx, x, y, size, color, isNeon) {
        // Save context
        ctx.save();
        
        // Create gradient matching CSS exactly
        let gradient;
        if (isNeon) {
            // NEON: Yellow gradient like CSS
            gradient = ctx.createLinearGradient(x, y, x + size, y + size);
            gradient.addColorStop(0, '#FFFF00');
            gradient.addColorStop(0.5, '#FFD700');
            gradient.addColorStop(1, '#FFA500');
        } else {
            // DROP: Purple gradient like CSS
            gradient = ctx.createLinearGradient(x, y, x + size, y + size);
            gradient.addColorStop(0, '#8A2BE2');
            gradient.addColorStop(0.5, '#9932CC');
            gradient.addColorStop(1, '#DA70D6');
        }
        
        // Draw main block with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        
        // Add inset shadows like CSS
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowOffsetX = -2;
        ctx.shadowOffsetY = -2;
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        
        // Add outer glow like CSS
        ctx.shadowColor = isNeon ? 'rgba(255, 255, 0, 0.5)' : 'rgba(138, 43, 226, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        
        // Reset shadows
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Add subtle border
        ctx.strokeStyle = isNeon ? '#FFD700' : '#9932CC';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
        
        // Restore context
        ctx.restore();
    }
    
    adjustBrightness(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) * factor);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) * factor);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) * factor);
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }
    
    addLogoGlowEffect(canvas) {
        // Add pulsing glow animation
        let pulse = 0;
        const animate = () => {
            pulse = (pulse + 0.03) % (Math.PI * 2);
            const glowIntensity = Math.sin(pulse) * 0.2 + 0.8;
            
            // Add pulsing glow overlay without redrawing the entire logo
            const ctx = canvas.getContext('2d');
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = `rgba(0, 212, 255, ${0.08 * glowIntensity})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            
            requestAnimationFrame(animate);
        };
        animate();
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
        }, 500);        // Real-time validation and name preview
        nameInput.addEventListener('input', (e) => {
            const name = e.target.value.trim();
            const isValid = name.length >= 2; // 2 chars minimum
            
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
                feedback.textContent = 'Need at least 2 characters';
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
        const displayName = this.createDisplayName(name);
        this.playerName = displayName;
        
        // Use new session system to upgrade the session with the player name
        try {
            await sessionManager.upgradeSession({
                upgrade_type: 'social',
                display_name: displayName,
                email: null,
                wallet_address: null,
                signature: null
            });
            
            // Update local references
            this.playerId = sessionManager.getPlayerId();
            this.playerName = sessionManager.getDisplayName();
            
            console.log('✅ Session upgraded with player name:', this.playerName);
        } catch (error) {
            console.warn('⚠️ Could not upgrade session, using fallback:', error);
            // Fallback to old localStorage system
            localStorage.setItem('neonDropPlayerName', displayName);
            localStorage.setItem('neonDropUsername', name);
        }
        
        // Try to submit score but don't break if it fails
        try {
            console.log('📤 Submitting score:', this.score, 'for player:', displayName);
            
            const response = await fetch('https://blockzone-api.hambomyers.workers.dev/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: this.playerId,
                    score: this.score,
                    replay_hash: `${this.playerId}_${Date.now()}_${this.score}`,
                    metrics: {
                        game: 'neon_drop',
                        player_name: displayName,
                        username: name,
                        wallet_suffix: this.getWalletDisplaySuffix(),
                        duration: 0
                    },
                    timestamp: Date.now()
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Score submitted successfully');
                if (result.rank) {
                    this.playerRank = result.rank;
                }
            } else {
                console.log('⚠️ Score submission failed, continuing anyway');
            }
        } catch (error) {
            console.log('⚠️ API not available, continuing anyway');
        }
        
        // Show viral challenge links for new players
        await this.showViralChallengeLinks();
    }

    async showViralChallengeLinks() {
        // Initialize referral tracker if not already done
        if (!referralTracker.currentUser) {
            await referralTracker.initialize(this.playerName, this.playerName);
        }
        
        // Generate challenge links
        const challengeLinksHTML = referralTracker.getChallengeLinksHTML(this.score);
        
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
                <!-- Welcome Message -->
                <div style="margin-bottom: 30px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                    <h2 style="color: #00d4ff; font-size: 32px; margin: 0 0 10px 0; font-weight: 700;">
                        Welcome ${this.playerName}!
                    </h2>
                    <div style="color: #aaa; font-size: 18px;">
                        You scored ${this.score.toLocaleString()}
                    </div>
                </div>

                <!-- Viral Status Display -->
                <div style="margin-bottom: 30px;">
                    ${referralTracker.createStatusDisplay().outerHTML}
                </div>

                <!-- Viral Challenge Section -->
                <div style="
                    background: rgba(255, 215, 0, 0.1);
                    border: 1px solid rgba(255, 215, 0, 0.3);
                    border-radius: 15px;
                    padding: 25px;
                    margin-bottom: 30px;
                ">
                    <div style="color: #ffd700; font-size: 20px; font-weight: 600; margin-bottom: 15px;">
                        🚀 Create Your First Challenges!
                    </div>
                    <div style="color: #aaa; font-size: 14px; margin-bottom: 20px;">
                        Share these links with friends. When they join, your name will glow!
                    </div>
                    
                    ${challengeLinksHTML}
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
                            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
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
                        🏆 Leaderboard
                    </button>
                </div>
            </div>
        `;
        
        // Add copy functionality to challenge links
        referralTracker.addCopyFunctionality(this.container);
        
        // Bind events
        this.bindViralEvents();
    }

    bindViralEvents() {
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
                await this.showLeaderboard();
            });
        }
    }

    async showGameResults(tournamentSuccess = false) {
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
    }

    bindResultsEvents() {
        const playAgainBtn = this.container.querySelector('#playAgainBtn');
        const leaderboardBtn = this.container.querySelector('#leaderboardBtn');

        playAgainBtn.addEventListener('click', () => {
            this.hide();
            this.emit('play-again');
        });        leaderboardBtn.addEventListener('click', async () => {
            // Enhanced: Show full-screen leaderboard with hyperbolic font scaling
            try {
                console.log('🏆 Opening enhanced full-screen leaderboard');
                await this.showFullScreenLeaderboard();            } catch (error) {
                console.error('❌ Failed to open full-screen leaderboard:', error);
                // Fallback to empty leaderboard
                this.showEmptyFullScreenLeaderboard();
            }
        });    }

    async submitScore(score, playerName) {
        // FORCE SCORE SUBMISSION - NO GENTLE HANDLING!
        console.log('🔥 FORCING score submission');
        
        const response = await fetch(`${this.apiBase}/api/scores`, {
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
                    duration: 0,
                    player_name: playerName
                },
                timestamp: Date.now()
            })        });        if (!response.ok) {
            const errorText = await response.text();
            console.log('🔥 API Response:', response.status, errorText);
            
            // Check for specific duplicate submission error
            if (errorText.includes('Duplicate submission')) {
                console.log('⚠️ Duplicate submission detected by API - saving locally instead');
                this.saveScoreToLocalStorage(score, playerName);
                return { verified: false, reason: 'Duplicate submission - saved locally', savedLocally: true };
            }
            
            throw new Error(`SCORE SUBMISSION FAILED: ${response.status} - ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        
        // Also check for duplicate in successful response
        if (result.verified === false && result.reason === 'Duplicate submission') {
            console.log('⚠️ API returned duplicate submission - saving locally instead');
            this.saveScoreToLocalStorage(score, playerName);
            return { ...result, savedLocally: true };
        }
        
        console.log('✅ FORCED Score submission SUCCESS:', result);
        return result;
    }

    async fetchLeaderboard(period = 'daily', limit = 100) {
        // FORCE LEADERBOARD FETCH - NO GENTLE FALLBACKS!
        console.log('🔥 FORCING leaderboard fetch from:', `${this.apiBase}/api/leaderboard`);
        
        const response = await fetch(`${this.apiBase}/api/leaderboard`);
        
        if (!response.ok) {
            throw new Error(`LEADERBOARD FETCH FAILED: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 FORCED Leaderboard fetch SUCCESS:', data);
        this.leaderboardData = data;
        return data;
    }

    async getPlayerRank() {
        // FORCE PLAYER RANK FETCH - NO FAILSAFES!
        console.log('🔥 FORCING player rank fetch');
        
        const response = await fetch(`${this.apiBase}/api/leaderboard`);
        if (!response.ok) {
            throw new Error(`PLAYER RANK FETCH FAILED: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.scores || data.scores.length === 0) {
            return 1; // First player if no scores exist
        }
        
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
        
        console.log('✅ FORCED Player rank SUCCESS:', rank);
        return rank;
    }

    async getTotalPlayers() {
        // FORCE TOTAL PLAYERS FETCH - NO GENTLE FALLBACKS!
        console.log('🔥 FORCING total players count fetch');
        
        const response = await fetch(`${this.apiBase}/api/leaderboard`);
        if (!response.ok) {
            throw new Error(`TOTAL PLAYERS FETCH FAILED: ${response.status}`);
        }
        
        const data = await response.json();
        const count = data.scores ? data.scores.length : 1;
        console.log('👥 FORCED Total players SUCCESS:', count);
        return count;
    }

    saveScoreToLocalStorage(score, playerName) {
        console.log('💾 Saving score to localStorage as backup:', score, playerName);
        
        // Get existing scores
        const existingScores = JSON.parse(localStorage.getItem('neonDropScores') || '[]');
        
        // Add new score
        const newScore = {
            score: score,
            playerName: playerName,
            playerId: this.playerId,
            timestamp: Date.now(),
            savedLocally: true // Flag to indicate this was saved locally due to API failure
        };
        
        existingScores.push(newScore);
        
        // Sort by score descending and keep top 100
        existingScores.sort((a, b) => b.score - a.score);
        const topScores = existingScores.slice(0, 100);
        
        // Save back to localStorage
        localStorage.setItem('neonDropScores', JSON.stringify(topScores));
        
        console.log('✅ Score saved to localStorage:', newScore);
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
                <div class="leaderboard-list leaderboard-content" style="margin-bottom: 30px;">                    ${leaderboardData.slice(0, 20).map((entry, index) => {
                        const isCurrentPlayer = entry.player_id === this.playerId || 
                                              entry.playerId === this.playerId ||
                                              (this.playerName && (entry.playerName === this.playerName || entry.player_name === this.playerName || entry.metrics?.player_name === this.playerName));
                        const isNewScore = isCurrentPlayer && this.score && Math.abs(entry.score - this.score) < 10; // Recently submitted score
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

    async showFullScreenLeaderboard() {
        console.log('🏆 Showing full-screen leaderboard');
        try {
            const leaderboardData = await this.fetchLeaderboard();
            if (leaderboardData && leaderboardData.scores && leaderboardData.scores.length > 0) {
                // Normalize the data to ensure display_name and score fields
                const normalizedScores = leaderboardData.scores.map(entry => ({
                    player_id: entry.player_id || entry.playerId,
                    display_name: entry.display_name || entry.playerName || entry.metrics?.player_name || 'Anonymous',
                    score: entry.score || entry.high_score || 0,
                    timestamp: entry.timestamp || Date.now(),
                    rank: entry.rank
                }));
                
                this.showBeautifulLeaderboard(normalizedScores);
            } else {
                this.showEmptyFullScreenLeaderboard();
            }
        } catch (error) {
            console.error('❌ Failed to fetch leaderboard:', error);
            this.showEmptyFullScreenLeaderboard();
        }
    }

    showEmptyFullScreenLeaderboard() {
        console.log('🏆 Showing empty full-screen leaderboard');
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
                    <div style="font-size: 32px; margin-bottom: 10px;">🏆</div>
                    <h2 style="color: #00d4ff; font-size: 28px; margin: 0 0 5px 0; font-weight: 700;">
                        Daily Leaderboard
                    </h2>
                    <div style="color: #aaa; font-size: 16px;">
                        No scores yet - be the first!
                    </div>
                </div>

                <!-- Empty State -->
                <div style="text-align: center; color: #666; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🎮</div>
                    <div style="font-size: 18px; margin-bottom: 10px; color: #fff;">No scores yet!</div>
                    <div style="font-size: 14px; color: #888;">Be the first to set a high score</div>
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
                        🎮 Play Game
                    </button>
                    
                    <button 
                        id="closeBtn"
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
                        ✕ Close
                    </button>
                </div>
            </div>
        `;

        // Bind events
        const playAgainBtn = this.container.querySelector('#playAgainBtn');
        const closeBtn = this.container.querySelector('#closeBtn');

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

    // Clear all localStorage player data for fresh start
    clearAllPlayerData() {
        console.log('🧹 Clearing ALL localStorage player data...');
        
        const keysToRemove = [
            'neonDropPlayerName',
            'neonDropUsername', 
            'neonDropPlayerId',
            'neonDropScores',
            'neonDropPlayerProfile',
            'neonDropWalletSuffix'
        ];
        
        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                console.log(`🗑️ Removing ${key}:`, localStorage.getItem(key));
                localStorage.removeItem(key);
            }
        });
        
        // Also clear any tournament-related data
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
            if (key.startsWith('tournament_') || key.startsWith('neonDrop')) {
                console.log(`🗑️ Removing tournament/game key ${key}:`, localStorage.getItem(key));
                localStorage.removeItem(key);
            }
        });
        
        console.log('✅ All localStorage player data cleared!');
    }
}
