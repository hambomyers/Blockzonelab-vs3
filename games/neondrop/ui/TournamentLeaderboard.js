/**
 * Tournament Leaderboard - Beautiful centered overlay with live backend data
 * Shows real-time tournament standings, prize pools, and player rankings
 */

export class TournamentLeaderboard {
    constructor() {
        this.overlay = null;
        this.isVisible = false;
        this.animationInProgress = false;
        this.tournamentData = null;
        
        this.createOverlay();
    }

    createOverlay() {
        // Dark background overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tournament-leaderboard-overlay';
        this.overlay.style.display = 'none';
        
        // Main leaderboard container (centered with padding)
        const container = document.createElement('div');
        container.className = 'tournament-leaderboard-container';
        
        // Header with chiclet title
        const header = this.createHeader();
        container.appendChild(header);
        
        // Tournament info section
        const tournamentInfo = this.createTournamentInfo();
        container.appendChild(tournamentInfo);
        
        // Rankings list
        const rankingsList = this.createRankingsList();
        container.appendChild(rankingsList);
        
        // Prize pool breakdown
        const prizeBreakdown = this.createPrizeBreakdown();
        container.appendChild(prizeBreakdown);
        
        // Close button
        const closeButton = this.createCloseButton();
        container.appendChild(closeButton);
        
        this.overlay.appendChild(container);
        document.body.appendChild(this.overlay);
        
        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'tournament-header';
        
        // Netflix-style chiclet title
        const titleContainer = document.createElement('div');
        titleContainer.className = 'netflix-chiclet-title tournament-title';
        
        const words = ['DAILY', 'TOURNAMENT'];
        words.forEach((word, wordIndex) => {
            const wordContainer = document.createElement('div');
            wordContainer.className = 'chiclet-word';
            
            word.split('').forEach((letter, letterIndex) => {
                const chiclet = document.createElement('div');
                chiclet.className = `chiclet ${wordIndex === 0 ? 'daily' : 'tournament'}`;
                chiclet.textContent = letter;
                chiclet.style.animationDelay = `${(wordIndex * 5 + letterIndex) * 50}ms`;
                wordContainer.appendChild(chiclet);
            });
            
            titleContainer.appendChild(wordContainer);
            
            // Add spacer between words
            if (wordIndex === 0) {
                const spacer = document.createElement('div');
                spacer.className = 'chiclet-spacer';
                titleContainer.appendChild(spacer);
            }
        });
        
        header.appendChild(titleContainer);
        
        // Subtitle
        const subtitle = document.createElement('div');
        subtitle.className = 'tournament-subtitle';
        subtitle.textContent = 'Live Rankings & Prize Pool';
        header.appendChild(subtitle);
        
        return header;
    }

    createTournamentInfo() {
        const info = document.createElement('div');
        info.className = 'tournament-info';
        
        // Tournament status and time remaining
        const status = document.createElement('div');
        status.className = 'tournament-status';
        status.innerHTML = `
            <div class="status-item">
                <span class="status-label">Tournament Status:</span>
                <span class="status-value live">🔴 LIVE</span>
            </div>
            <div class="status-item">
                <span class="status-label">Time Remaining:</span>
                <span class="status-value" id="tournament-countdown">Loading...</span>
            </div>
            <div class="status-item">
                <span class="status-label">Players Competing:</span>
                <span class="status-value" id="player-count">Loading...</span>
            </div>
        `;
        
        info.appendChild(status);
        return info;
    }

    createRankingsList() {
        const container = document.createElement('div');
        container.className = 'rankings-container';
        
        const title = document.createElement('h3');
        title.className = 'rankings-title';
        title.textContent = '🏆 TOP 25 LEADERBOARD';
        container.appendChild(title);
        
        const list = document.createElement('div');
        list.className = 'rankings-list';
        list.id = 'rankings-list';
        
        // Loading state
        list.innerHTML = `
            <div class="loading-rankings">
                <div class="loading-spinner"></div>
                <p>Loading live tournament data...</p>
            </div>
        `;
        
        container.appendChild(list);
        return container;
    }

    createPrizeBreakdown() {
        const container = document.createElement('div');
        container.className = 'prize-breakdown';
        
        const title = document.createElement('h3');
        title.className = 'prize-title';
        title.textContent = '💰 PRIZE POOL BREAKDOWN';
        container.appendChild(title);
        
        const breakdown = document.createElement('div');
        breakdown.className = 'prize-details';
        breakdown.id = 'prize-details';
        breakdown.innerHTML = `
            <div class="loading-prizes">
                <div class="loading-spinner"></div>
                <p>Calculating prize distribution...</p>
            </div>
        `;
        
        container.appendChild(breakdown);
        return container;
    }

    createCloseButton() {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'tournament-close-btn';
        closeBtn.innerHTML = '✕ Close';
        closeBtn.onclick = () => this.hide();
        return closeBtn;
    }

    async show() {
        if (this.isVisible || this.animationInProgress) return;
        
        this.isVisible = true;
        this.animationInProgress = true;
        
        this.overlay.style.display = 'flex';
        
        // Animate in
        requestAnimationFrame(() => {
            this.overlay.classList.add('fade-in');
            this.overlay.querySelector('.tournament-leaderboard-container').classList.add('slide-in');
        });
        
        // Load live tournament data
        await this.loadTournamentData();
        
        this.animationInProgress = false;
    }

    hide() {
        if (!this.isVisible) return;
        
        this.overlay.classList.remove('fade-in');
        this.overlay.querySelector('.tournament-leaderboard-container').classList.remove('slide-in');
        
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.isVisible = false;
        }, 300);
    }

    async loadTournamentData() {
        try {
            console.log('🏆 Loading live tournament data from Cloudflare workers...');
            
            // TODO: Replace with real Cloudflare worker API calls
            const mockData = await this.getMockTournamentData();
            this.tournamentData = mockData;
            
            this.renderTournamentData();
            this.startCountdown();
            
        } catch (error) {
            console.error('❌ Failed to load tournament data:', error);
            this.renderErrorState();
        }
    }

    async getMockTournamentData() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock tournament data that will be replaced with real Cloudflare worker calls
        return {
            status: 'live',
            endTime: Date.now() + (8 * 60 * 60 * 1000), // 8 hours from now
            playerCount: 247,
            totalPrizePool: 1247.50,
            leaderboard: [
                { rank: 1, playerId: 'hambo_zx4c', name: 'Hambo ZX4C', score: 2340, prize: 498.00 },
                { rank: 2, playerId: 'sarah_k9p2', name: 'Sarah K9P2', score: 2195, prize: 299.40 },
                { rank: 3, playerId: 'crypto_king_4a1f', name: 'CryptoKing 4A1F', score: 2089, prize: 187.13 },
                { rank: 4, playerId: 'neon_master_8x7z', name: 'NeonMaster 8X7Z', score: 1945, prize: 124.75 },
                { rank: 5, playerId: 'block_queen_2r5t', name: 'BlockQueen 2R5T', score: 1876, prize: 93.56 },
                // ... more players (will be generated or fetched from API)
            ]
        };
    }

    renderTournamentData() {
        if (!this.tournamentData) return;
        
        // Update player count and countdown
        document.getElementById('player-count').textContent = this.tournamentData.playerCount.toLocaleString();
        
        // Render leaderboard
        this.renderLeaderboard();
        
        // Render prize breakdown
        this.renderPrizeBreakdown();
    }

    renderLeaderboard() {
        const list = document.getElementById('rankings-list');
        const leaderboard = this.tournamentData.leaderboard;
        
        list.innerHTML = '';
        
        leaderboard.forEach((player, index) => {
            const playerRow = document.createElement('div');
            playerRow.className = `player-row ${index < 3 ? 'top-three' : ''}`;
            
            const rankMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            
            playerRow.innerHTML = `
                <div class="player-rank">${rankMedal} ${player.rank}</div>
                <div class="player-identity">${player.name}</div>
                <div class="player-score">${player.score.toLocaleString()}</div>
                <div class="player-prize">$${player.prize.toFixed(2)}</div>
            `;
            
            list.appendChild(playerRow);
            
            // Animate in with stagger
            setTimeout(() => {
                playerRow.classList.add('fade-in-row');
            }, index * 50);
        });
    }

    renderPrizeBreakdown() {
        const container = document.getElementById('prize-details');
        const data = this.tournamentData;
        
        container.innerHTML = `
            <div class="prize-summary">
                <div class="total-pool">
                    <span class="pool-label">Total Prize Pool:</span>
                    <span class="pool-amount">$${data.totalPrizePool.toFixed(2)} USDC</span>
                </div>
                <div class="platform-fee">
                    <span class="fee-label">Platform Fee (10%):</span>
                    <span class="fee-amount">$${(data.totalPrizePool * 0.1).toFixed(2)}</span>
                </div>
                <div class="player-payout">
                    <span class="payout-label">Player Payouts (90%):</span>
                    <span class="payout-amount">$${(data.totalPrizePool * 0.9).toFixed(2)}</span>
                </div>
            </div>
            <div class="distribution-note">
                <p>🏆 Prizes distributed to top 25 players using hyperbolic curve</p>
                <p>💰 Minimum payout: $0.25 USDC • 1st place: ~40% of player pool</p>
            </div>
        `;
    }

    startCountdown() {
        const updateCountdown = () => {
            const now = Date.now();
            const timeLeft = this.tournamentData.endTime - now;
            
            if (timeLeft <= 0) {
                document.getElementById('tournament-countdown').textContent = 'Tournament Ended';
                return;
            }
            
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            document.getElementById('tournament-countdown').textContent = 
                `${hours}h ${minutes}m ${seconds}s`;
        };
        
        updateCountdown();
        this.countdownInterval = setInterval(updateCountdown, 1000);
    }

    renderErrorState() {
        document.getElementById('rankings-list').innerHTML = `
            <div class="error-state">
                <h3>⚠️ Connection Error</h3>
                <p>Unable to load tournament data. Please check your connection and try again.</p>
                <button onclick="window.tournamentLeaderboard.loadTournamentData()" class="retry-btn">
                    🔄 Retry
                </button>
            </div>
        `;
        
        document.getElementById('prize-details').innerHTML = `
            <div class="error-state">
                <p>Prize pool data unavailable</p>
            </div>
        `;
    }

    destroy() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
}
