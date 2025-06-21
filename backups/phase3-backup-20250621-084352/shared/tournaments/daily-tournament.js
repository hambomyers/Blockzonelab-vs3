/**
 * Daily Tournament System - Live API Integration
 * Connects to deployed Cloudflare Worker for real-time tournaments
 */

export class DailyTournament {
    constructor() {
        this.apiBase = 'https://blockzone-api.hambomyers.workers.dev/api';
        this.isActive = false;        this.participants = 0;
        this.prizePool = 0;
        this.timeRemaining = '00:00:00';
        this.updateInterval = null;
        this.eventListeners = {};
        
        // Connect to live API and refresh status
        this.refreshTournamentStatus();
    }

    async joinTournament(entryFee = 5) {        try {
            // Entry fee will be integrated with payment system
            console.log(`💰 Joining tournament with $${entryFee} entry fee`);
            
            // For now, simulate successful entry
            this.participants++;
            this.prizePool += entryFee * 0.9; // 90% to prize pool
            this.isActive = true;
            
            this.emit('tournamentJoined', { entryFee, prizePool: this.prizePool });
            return { success: true, prizePool: this.prizePool };
            
        } catch (error) {
            console.error('Tournament join failed:', error);
            throw new Error('Failed to join tournament');
        }
    }

    async submitScore(score, metrics, playerId) {
        try {
            const response = await fetch(`${this.apiBase}/scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score,
                    metrics,
                    player_id: playerId,
                    timestamp: Date.now(),
                    replay_hash: this.generateReplayHash(score, metrics)
                })
            });

            const result = await response.json();
            
            if (result.verified) {
                console.log(`✅ Score submitted: ${score} (Rank #${result.rank})`);
                this.emit('scoreSubmitted', { score, rank: result.rank });
                return result;
            } else {
                throw new Error(result.reason || 'Score verification failed');
            }
            
        } catch (error) {
            console.error('Score submission failed:', error);
            throw error;
        }
    }

    async getLeaderboard(timeframe = 'daily') {
        try {
            const response = await fetch(`${this.apiBase}/leaderboard?timeframe=${timeframe}`);
            const data = await response.json();
            return data.leaderboard || [];
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            return [];
        }
    }

    getTournamentInfo() {
        return {
            isActive: this.isActive,
            participants: this.participants,
            prizePool: this.prizePool,
            timeRemaining: this.timeRemaining,
            status: this.isActive ? 'active' : 'waiting'
        };
    }

    async refreshTournamentStatus() {
        try {
            // Calculate time remaining until next daily reset (midnight UTC)
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
            tomorrow.setUTCHours(0, 0, 0, 0);
            
            const timeLeft = tomorrow.getTime() - now.getTime();
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            this.timeRemaining = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Check if we have an active tournament
            this.isActive = true; // Always active for daily tournaments
            
            this.emit('statusUpdate', this.getTournamentInfo());
            
        } catch (error) {
            console.error('Failed to refresh tournament status:', error);
        }
    }

    startPeriodicUpdates() {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(() => {
            this.refreshTournamentStatus();
        }, 1000); // Update every second for countdown
    }

    stopPeriodicUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    addEventListener(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event listener error for ${event}:`, error);
                }
            });
        }
    }

    generateReplayHash(score, metrics) {
        const data = `${score}-${metrics?.duration || 0}-${Date.now()}`;
        // Simple hash for replay protection
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    destroy() {
        this.stopPeriodicUpdates();
        this.eventListeners = {};
    }
}
