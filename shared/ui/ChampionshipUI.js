/**
 * ChampionshipUI.js - Professional Tournament Interface
 * Apple-inspired design with neon accents from Neon Drop
 * Handles championship cycles, entry fees, and real-time leaderboards
 * 
 * VERSION: 2.0.0-BLOCKZONE-PLATFORM-RELEASE
 * CREATED: 2025-01-25 (BlockZone Lab Platform Phase 1)
 * FEATURES: Championship cycles, real-time leaderboards, payment integration
 * 
 * This is the NEW BlockZone Lab platform version - completely refactored
 * for professional gaming platform with championship and friend challenge systems.
 */

export class ChampionshipUI {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.currentTournament = null;
        this.leaderboardData = null;
        this.playerRank = null;
        this.apiBase = 'https://blockzone-api.hambomyers.workers.dev';
        
        // Championship cycle tracking - NEW BLOCKZONE PLATFORM FEATURE
        this.cycles = {
            am: { name: 'Morning Championship', time: '12:00 AM - 12:00 PM GMT' },
            pm: { name: 'Evening Championship', time: '12:00 PM - 12:00 AM GMT' }
        };
        
        this.createContainer();
        console.log('🏆 ChampionshipUI initialized - BlockZone Lab Platform v2.0.0');
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'championship-ui-overlay';
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
            transition: opacity 0.4s ease-out;
            font-family: 'Inter', sans-serif;
        `;
        document.body.appendChild(this.container);
    }

    async show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.container.style.display = 'flex';
        
        // Load current tournament data
        await this.loadTournamentData();
        
        // Show the championship interface
        await this.showChampionshipInterface();
        
        // Animate in
        requestAnimationFrame(() => {
            this.container.style.opacity = '1';
        });
    }

    async loadTournamentData() {
        try {
            // Load current tournament
            const tournamentResponse = await fetch(`${this.apiBase}/api/tournaments/current`);
            this.currentTournament = await tournamentResponse.json();
            
            // Load current leaderboard
            const leaderboardResponse = await fetch(`${this.apiBase}/api/leaderboard`);
            this.leaderboardData = await leaderboardResponse.json();
            
            console.log('🏆 Tournament data loaded:', this.currentTournament);
        } catch (error) {
            console.error('❌ Failed to load tournament data:', error);
            this.currentTournament = this.getDefaultTournament();
            this.leaderboardData = { scores: [] };
        }
    }

    getDefaultTournament() {
        const now = new Date();
        const cycle = now.getUTCHours() < 12 ? 'am' : 'pm';
        const cycleEnd = new Date();
        cycleEnd.setUTCHours(cycle === 'am' ? 12 : 24, 0, 0, 0);
        
        return {
            id: `daily_${cycle}`,
            name: this.cycles[cycle].name,
            type: 'daily',
            status: 'active',
            entry_fee: 2.50,
            prize_pool: 0,
            max_players: 1000,
            current_players: 0,
            start_time: Date.now(),
            end_time: cycleEnd.getTime(),
            cycle: cycle
        };
    }

    async showChampionshipInterface() {
        const cycle = this.currentTournament.cycle || 'am';
        const timeRemaining = this.getTimeRemaining();
        const entryFee = this.currentTournament.entry_fee || 2.50;
        
        this.container.innerHTML = `
            <div class="championship-card" style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 24px;
                padding: 40px;
                max-width: 600px;
                width: 90%;
                border: 2px solid rgba(0, 212, 255, 0.3);
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
                text-align: center;
                animation: slideInUp 0.5s ease-out;
                position: relative;
                overflow: hidden;
            ">
                <!-- Neon glow effect -->
                <div style="
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    background: linear-gradient(45deg, #00d4ff, #ff00aa, #00d4ff);
                    border-radius: 24px;
                    z-index: -1;
                    opacity: 0.3;
                    animation: neonPulse 2s ease-in-out infinite alternate;
                "></div>
                
                <!-- Header -->
                <div style="margin-bottom: 30px;">
                    <h1 style="
                        color: #00d4ff;
                        font-size: 36px;
                        font-weight: 900;
                        margin: 0 0 10px 0;
                        font-family: 'Orbitron', monospace;
                        text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
                    ">
                        🏆 ${this.cycles[cycle].name}
                    </h1>
                    <p style="
                        color: #aaa;
                        font-size: 16px;
                        margin: 0;
                        font-weight: 500;
                    ">
                        ${this.cycles[cycle].time}
                    </p>
                </div>
                
                <!-- Time Remaining -->
                <div style="
                    background: rgba(0, 212, 255, 0.1);
                    border: 1px solid rgba(0, 212, 255, 0.3);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 30px;
                ">
                    <div style="color: #00d4ff; font-size: 24px; font-weight: 700; margin-bottom: 5px;">
                        ${timeRemaining}
                    </div>
                    <div style="color: #aaa; font-size: 14px;">
                        Time Remaining
                    </div>
                </div>
                
                <!-- Entry Fee & Prize Pool -->
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                ">
                    <div style="
                        background: rgba(255, 0, 170, 0.1);
                        border: 1px solid rgba(255, 0, 170, 0.3);
                        border-radius: 16px;
                        padding: 20px;
                    ">
                        <div style="color: #ff00aa; font-size: 24px; font-weight: 700; margin-bottom: 5px;">
                            $${entryFee}
                        </div>
                        <div style="color: #aaa; font-size: 14px;">
                            Entry Fee
                        </div>
                    </div>
                    
                    <div style="
                        background: rgba(255, 215, 0, 0.1);
                        border: 1px solid rgba(255, 215, 0, 0.3);
                        border-radius: 16px;
                        padding: 20px;
                    ">
                        <div style="color: #ffd700; font-size: 24px; font-weight: 700; margin-bottom: 5px;">
                            $${this.currentTournament.prize_pool || 0}
                        </div>
                        <div style="color: #aaa; font-size: 14px;">
                            Prize Pool
                        </div>
                    </div>
                </div>
                
                <!-- Current Players -->
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 30px;
                ">
                    <div style="color: #fff; font-size: 20px; font-weight: 700; margin-bottom: 5px;">
                        ${this.currentTournament.current_players || 0} Players
                    </div>
                    <div style="color: #aaa; font-size: 14px;">
                        Competing Now
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div style="
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                ">
                    <button 
                        id="enterChampionshipBtn"
                        style="
                            background: linear-gradient(135deg, #00d4ff, #0099cc);
                            color: white;
                            border: none;
                            padding: 18px 36px;
                            border-radius: 12px;
                            font-size: 18px;
                            font-weight: 700;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            min-width: 180px;
                            box-shadow: 0 8px 25px rgba(0, 212, 255, 0.3);
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(0, 212, 255, 0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(0, 212, 255, 0.3)'"
                    >
                        🎮 Enter Championship
                    </button>
                    
                    <button 
                        id="viewLeaderboardBtn"
                        style="
                            background: linear-gradient(135deg, #ff00aa, #cc0088);
                            color: white;
                            border: none;
                            padding: 18px 36px;
                            border-radius: 12px;
                            font-size: 18px;
                            font-weight: 700;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            min-width: 180px;
                            box-shadow: 0 8px 25px rgba(255, 0, 170, 0.3);
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(255, 0, 170, 0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(255, 0, 170, 0.3)'"
                    >
                        📊 View Leaderboard
                    </button>
                </div>
                
                <!-- Close Button -->
                <button 
                    id="closeChampionshipBtn"
                    style="
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        background: none;
                        border: none;
                        color: #aaa;
                        font-size: 24px;
                        cursor: pointer;
                        transition: color 0.3s ease;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                    "
                    onmouseover="this.style.color='#00d4ff'"
                    onmouseout="this.style.color='#aaa'"
                >
                    ✕
                </button>
            </div>
        `;
        
        this.bindEvents();
    }

    getTimeRemaining() {
        const now = Date.now();
        const endTime = this.currentTournament.end_time;
        const remaining = endTime - now;
        
        if (remaining <= 0) {
            return 'Tournament Ended';
        }
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    bindEvents() {
        // Enter Championship
        const enterBtn = document.getElementById('enterChampionshipBtn');
        if (enterBtn) {
            enterBtn.addEventListener('click', () => {
                this.enterChampionship();
            });
        }
        
        // View Leaderboard
        const leaderboardBtn = document.getElementById('viewLeaderboardBtn');
        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', () => {
                this.showLeaderboard();
            });
        }
        
        // Close
        const closeBtn = document.getElementById('closeChampionshipBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }
        
        // Close on background click
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.hide();
            }
        });
    }

    async enterChampionship() {
        console.log('🎮 Entering championship...');
        
        // Check if player has wallet connected
        if (!window.BlockZoneWeb3?.isConnected) {
            this.showWalletPrompt();
            return;
        }
        
        // Check if player has sufficient balance
        const balance = await window.BlockZoneWeb3.getBalance();
        const entryFee = this.currentTournament.entry_fee || 2.50;
        
        if (parseFloat(balance) < entryFee) {
            this.showInsufficientBalance(entryFee);
            return;
        }
        
        // Process payment and start game
        try {
            await this.processEntryPayment(entryFee);
            this.startChampionshipGame();
        } catch (error) {
            console.error('❌ Payment failed:', error);
            this.showPaymentError(error.message);
        }
    }

    showWalletPrompt() {
        // Create wallet connection prompt
        const prompt = document.createElement('div');
        prompt.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
            border-radius: 20px;
            padding: 30px;
            border: 2px solid rgba(0, 212, 255, 0.3);
            text-align: center;
            z-index: 10001;
            max-width: 400px;
            width: 90%;
        `;
        
        prompt.innerHTML = `
            <h3 style="color: #00d4ff; margin-bottom: 20px;">Connect Wallet Required</h3>
            <p style="color: #aaa; margin-bottom: 25px;">
                You need to connect your wallet to enter the championship.
            </p>
            <button 
                id="connectWalletBtn"
                style="
                    background: linear-gradient(135deg, #00d4ff, #0099cc);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-right: 10px;
                "
            >
                Connect Wallet
            </button>
            <button 
                id="cancelWalletBtn"
                style="
                    background: rgba(255, 255, 255, 0.1);
                    color: #aaa;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 15px 30px;
                    border-radius: 10px;
                    font-size: 16px;
                    cursor: pointer;
                "
            >
                Cancel
            </button>
        `;
        
        document.body.appendChild(prompt);
        
        // Bind events
        document.getElementById('connectWalletBtn').addEventListener('click', async () => {
            try {
                await window.BlockZoneWeb3.connect();
                prompt.remove();
                this.enterChampionship(); // Retry
            } catch (error) {
                console.error('Wallet connection failed:', error);
            }
        });
        
        document.getElementById('cancelWalletBtn').addEventListener('click', () => {
            prompt.remove();
        });
    }

    showInsufficientBalance(required) {
        const prompt = document.createElement('div');
        prompt.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
            border-radius: 20px;
            padding: 30px;
            border: 2px solid rgba(255, 0, 170, 0.3);
            text-align: center;
            z-index: 10001;
            max-width: 400px;
            width: 90%;
        `;
        
        prompt.innerHTML = `
            <h3 style="color: #ff00aa; margin-bottom: 20px;">Insufficient Balance</h3>
            <p style="color: #aaa; margin-bottom: 25px;">
                You need $${required} USDC.E to enter the championship.
            </p>
            <button 
                id="addFundsBtn"
                style="
                    background: linear-gradient(135deg, #ff00aa, #cc0088);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-right: 10px;
                "
            >
                Add Funds
            </button>
            <button 
                id="cancelBalanceBtn"
                style="
                    background: rgba(255, 255, 255, 0.1);
                    color: #aaa;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 15px 30px;
                    border-radius: 10px;
                    font-size: 16px;
                    cursor: pointer;
                "
            >
                Cancel
            </button>
        `;
        
        document.body.appendChild(prompt);
        
        // Bind events
        document.getElementById('addFundsBtn').addEventListener('click', () => {
            // TODO: Implement add funds flow
            prompt.remove();
        });
        
        document.getElementById('cancelBalanceBtn').addEventListener('click', () => {
            prompt.remove();
        });
    }

    async processEntryPayment(amount) {
        // TODO: Implement real USDC.E payment processing
        console.log(`💰 Processing payment: $${amount} USDC.E`);
        
        // For now, simulate payment success
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    startChampionshipGame() {
        console.log('🎮 Starting championship game...');
        
        // Hide championship UI
        this.hide();
        
        // Navigate to Neon Drop game
        window.location.href = '/games/neondrop/';
    }

    async showLeaderboard() {
        console.log('📊 Showing championship leaderboard...');
        
        // Create leaderboard modal
        const leaderboardModal = document.createElement('div');
        leaderboardModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
        `;
        
        const leaderboardContent = `
            <div style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 20px;
                padding: 30px;
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                border: 2px solid rgba(0, 212, 255, 0.3);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2 style="color: #00d4ff; margin: 0;">🏆 Championship Leaderboard</h2>
                    <button 
                        id="closeLeaderboardBtn"
                        style="
                            background: none;
                            border: none;
                            color: #aaa;
                            font-size: 24px;
                            cursor: pointer;
                            width: 40px;
                            height: 40px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 50%;
                        "
                    >
                        ✕
                    </button>
                </div>
                
                <div id="leaderboardContent">
                    ${this.renderLeaderboardContent()}
                </div>
            </div>
        `;
        
        leaderboardModal.innerHTML = leaderboardContent;
        document.body.appendChild(leaderboardModal);
        
        // Bind close event
        document.getElementById('closeLeaderboardBtn').addEventListener('click', () => {
            leaderboardModal.remove();
        });
        
        // Close on background click
        leaderboardModal.addEventListener('click', (e) => {
            if (e.target === leaderboardModal) {
                leaderboardModal.remove();
            }
        });
    }

    renderLeaderboardContent() {
        if (!this.leaderboardData?.scores || this.leaderboardData.scores.length === 0) {
            return `
                <div style="text-align: center; padding: 40px; color: #aaa;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🏆</div>
                    <h3 style="color: #00d4ff; margin-bottom: 10px;">No Scores Yet</h3>
                    <p>Be the first to enter and set a record!</p>
                </div>
            `;
        }
        
        const scores = this.leaderboardData.scores.slice(0, 20); // Top 20
        
        return `
            <div style="
                display: grid;
                gap: 10px;
            ">
                ${scores.map((score, index) => `
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 15px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        border: 1px solid rgba(0, 212, 255, ${index < 3 ? '0.3' : '0.1'});
                    ">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="
                                width: 40px;
                                height: 40px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: 700;
                                font-size: 16px;
                                ${index === 0 ? 'background: linear-gradient(135deg, #ffd700, #ffed4e); color: #000;' : ''}
                                ${index === 1 ? 'background: linear-gradient(135deg, #c0c0c0, #e5e5e5); color: #000;' : ''}
                                ${index === 2 ? 'background: linear-gradient(135deg, #cd7f32, #daa520); color: #fff;' : ''}
                                ${index > 2 ? 'background: rgba(255, 255, 255, 0.1); color: #aaa;' : ''}
                            ">
                                ${index + 1}
                            </div>
                            <div>
                                <div style="color: #fff; font-weight: 600; font-size: 16px;">
                                    ${score.display_name || 'Anonymous'}
                                </div>
                                <div style="color: #aaa; font-size: 12px;">
                                    ${this.formatTimeAgo(score.timestamp)}
                                </div>
                            </div>
                        </div>
                        <div style="
                            color: #00d4ff;
                            font-size: 24px;
                            font-weight: 900;
                            font-family: 'Orbitron', monospace;
                        ">
                            ${score.score.toLocaleString()}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    showPaymentError(message) {
        // Show payment error toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 10002;
            animation: slideInRight 0.3s ease-out;
        `;
        toast.textContent = `Payment Failed: ${message}`;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.container.style.opacity = '0';
        
        setTimeout(() => {
            this.container.style.display = 'none';
        }, 400);
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes neonPulse {
        from {
            opacity: 0.3;
        }
        to {
            opacity: 0.6;
        }
    }
    
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style); 