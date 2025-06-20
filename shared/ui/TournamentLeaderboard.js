/**
 * Tournament Leaderboard - Beautiful overlay component
 * Shows live tournament standings with real prize pools
 * Connects to Cloudflare workers for live data
 */

export class TournamentLeaderboard {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.currentTournament = null;
        this.refreshInterval = null;
        
        this.createOverlay();
    }

    createOverlay() {
        this.container = document.createElement('div');
        this.container.className = 'tournament-leaderboard-overlay';
        
        this.container.innerHTML = `
            <div class="tournament-leaderboard-modal">
                <button class="leaderboard-close">&times;</button>
                
                <div class="tournament-header">
                    <div class="tournament-chiclet-title">
                        <div class="tournament-chiclet">DAILY</div>
                        <div class="tournament-chiclet">TOURNAMENT</div>
                    </div>
                    <div class="tournament-prize-pool">Prize Pool: $0.00</div>
                    <div class="tournament-countdown">Loading tournament data...</div>
                </div>
                
                <div class="leaderboard-content">
                    <ul class="leaderboard-list">
                        <!-- Leaderboard entries will be populated here -->
                    </ul>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close button
        const closeBtn = this.container.querySelector('.leaderboard-close');
        closeBtn.addEventListener('click', () => this.hide());
        
        // Click outside to close
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.hide();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }    async show() {
        console.log('🏆 TournamentLeaderboard.show() called');
        console.log('🏆 Current isVisible state:', this.isVisible);
        console.log('🏆 Container element:', this.container);
        
        if (this.isVisible) {
            console.log('🏆 Already visible, returning');
            return;
        }
          this.isVisible = true;
        console.log('🏆 Adding visible class to container');
        this.container.classList.add('visible');
        
        // Force visibility via inline styles to bypass CSS conflicts
        this.container.style.opacity = '1';
        this.container.style.visibility = 'visible';
        this.container.style.display = 'flex';
        
        console.log('🏆 Container classes after adding visible:', this.container.className);
        console.log('🏆 Container style display:', this.container.style.display);
        
        // Debug computed styles
        const computedStyles = window.getComputedStyle(this.container);
        console.log('🏆 Computed opacity:', computedStyles.opacity);
        console.log('🏆 Computed visibility:', computedStyles.visibility);
        console.log('🏆 Computed z-index:', computedStyles.zIndex);
        console.log('🏆 Computed position:', computedStyles.position);
        
        // Load tournament data
        await this.loadTournamentData();
        
        // Set up auto-refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadTournamentData();
        }, 30000);
        
        console.log('🏆 TournamentLeaderboard.show() completed');
    }

    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.container.classList.remove('visible');
        
        // Clear refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }    async loadTournamentData() {
        try {
            // Load live tournament data from Cloudflare worker
            const tournamentResponse = await fetch('https://blockzone-api.hambomyers.workers.dev/api/tournament/current');
            const leaderboardResponse = await fetch('https://blockzone-api.hambomyers.workers.dev/api/tournament/leaderboard');
            
            if (!tournamentResponse.ok || !leaderboardResponse.ok) {
                throw new Error('Failed to fetch tournament data');
            }
            
            const tournament = await tournamentResponse.json();
            const leaderboardData = await leaderboardResponse.json();
            
            const combinedData = {
                prizePool: tournament.prizePool || 0,
                countdown: tournament.countdown || "Loading...",
                entries: tournament.entries || 0,
                leaderboard: leaderboardData.leaderboard || []
            };
            
            this.updateDisplay(combinedData);
            
        } catch (error) {
            console.error('Failed to load tournament data:', error);
            // Fallback to mock data if API fails
            const mockData = await this.getMockTournamentData();
            this.updateDisplay(mockData);
            this.showError('Using offline data - refresh to try again');
        }
    }

    async getMockTournamentData() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            prizePool: 1247.50,
            countdown: "Resets in 4h 23m",
            entries: 187,
            leaderboard: [
                { rank: 1, playerId: "hambo_zx4c", name: "Hambo ZX4C", score: 2340, prize: 498.00 },
                { rank: 2, playerId: "sarah_k9p2", name: "Sarah K9P2", score: 2156, prize: 299.00 },
                { rank: 3, playerId: "crypto_king", name: "CryptoKing 4A1F", score: 1987, prize: 149.00 },
                { rank: 4, playerId: "neon_master", name: "NeonMaster 8B2C", score: 1834, prize: 87.00 },
                { rank: 5, playerId: "block_ace", name: "BlockAce D3E4", score: 1723, prize: 62.00 },
                { rank: 6, playerId: "drop_zone", name: "DropZone F5G6", score: 1654, prize: 49.00 },
                { rank: 7, playerId: "pixel_pro", name: "PixelPro H7I8", score: 1589, prize: 37.00 },
                { rank: 8, playerId: "game_guru", name: "GameGuru J9K0", score: 1512, prize: 31.00 },
                { rank: 9, playerId: "score_star", name: "ScoreStar L1M2", score: 1445, prize: 25.00 },
                { rank: 10, playerId: "top_tier", name: "TopTier N3O4", score: 1378, prize: 22.00 }
            ]
        };
    }

    updateDisplay(data) {
        // Update prize pool
        const prizePoolEl = this.container.querySelector('.tournament-prize-pool');
        prizePoolEl.textContent = `Prize Pool: $${data.prizePool.toFixed(2)}`;
        
        // Update countdown
        const countdownEl = this.container.querySelector('.tournament-countdown');
        countdownEl.textContent = `${data.countdown} • ${data.entries} players entered`;
        
        // Update leaderboard
        const listEl = this.container.querySelector('.leaderboard-list');
        listEl.innerHTML = '';
        
        data.leaderboard.forEach(entry => {
            const li = document.createElement('li');
            li.className = `leaderboard-item${entry.rank <= 3 ? ' top-3' : ''}${entry.rank === 1 ? ' rank-1' : ''}`;
            
            li.innerHTML = `
                <div class="leaderboard-rank">#${entry.rank}</div>
                <div class="leaderboard-player">
                    <div class="player-name">${entry.name}</div>
                    <div class="player-score">${entry.score.toLocaleString()} points</div>
                </div>
                <div class="leaderboard-prize">$${entry.prize.toFixed(2)}</div>
            `;
            
            listEl.appendChild(li);
        });
    }

    showError(message) {
        const countdownEl = this.container.querySelector('.tournament-countdown');
        countdownEl.textContent = message;
        countdownEl.style.color = '#ef4444';
    }

    // Future: Connect to real Cloudflare workers API
    async loadLiveTournamentData() {
        const response = await fetch('/api/tournament/current');
        if (!response.ok) {
            throw new Error('Failed to fetch tournament data');
        }
        return await response.json();
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
