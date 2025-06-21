/**
 * EverythingCard Systems - Business Logic
 */
import { EventEmitter } from '../../../shared/utils/EventEmitter.js';

export class CardSystems extends EventEmitter {
    constructor() {
        super();
        this.currentPlayer = null;
    }

    async createWalletIdentity(displayName) {
        console.log('🔐 Creating identity for:', displayName);
        
        // Create simple local identity
        const identity = {
            id: `player_${Date.now()}`,
            displayName: displayName,
            tier: 'anonymous',
            createdAt: Date.now()
        };
        
        // Store locally
        localStorage.setItem('player_identity', JSON.stringify(identity));
        this.currentPlayer = identity;
        
        // Emit event
        this.emit('identity:created', identity);
        
        console.log('✅ Identity created:', identity);
        return identity;
    }

    async checkGameAccess() {
        // Simple access check
        return { hasAccess: true, accessType: 'free' };
    }

    async processPayment(tier) {
        console.log('💰 Processing payment for:', tier);
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const payment = {
            tier: tier,
            success: true,
            timestamp: Date.now()
        };
        
        // Grant access based on tier
        const now = new Date();
        switch(tier) {
            case 'single':
                const games = parseInt(localStorage.getItem('paid_games') || '0');
                localStorage.setItem('paid_games', (games + 1).toString());
                break;
            case 'daily':
                localStorage.setItem('daily_pass', now.toDateString());
                break;
            case 'monthly':
                const expiry = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
                localStorage.setItem('monthly_pass', expiry.toISOString());
                break;
        }
        
        this.emit('payment:completed', payment);
        console.log('✅ Payment completed:', payment);
        return payment;
    }

    async getPersonalBest(currentScore) {
        const saved = localStorage.getItem('best_score') || '0';
        const best = Math.max(parseInt(saved), currentScore);
        if (best > parseInt(saved)) {
            localStorage.setItem('best_score', best.toString());
        }
        return best;
    }

    async getGlobalRank(score) {
        // Simple rank estimation
        if (score > 2000) return '#1-10';
        if (score > 1500) return '#11-50';
        if (score > 1000) return '#51-200';
        if (score > 500) return '#201-1000';
        return '#1000+';
    }

    async submitScoreToTournament(playerData, score) {
        console.log('🏆 Submitting score:', score);
        
        try {
            // Try to submit to API (will fail gracefully if offline)
            const response = await fetch('https://blockzone-api.hambomyers.workers.dev/api/tournament/submit-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: playerData.id,
                    playerName: playerData.displayName,
                    score: score
                })
            });
            
            if (response.ok) {
                console.log('✅ Score submitted to tournament');
                return await response.json();
            }
        } catch (error) {
            console.log('⚠️ Tournament API unavailable, score saved locally');
        }
        
        // Store locally as fallback
        const scores = JSON.parse(localStorage.getItem('tournament_scores') || '[]');
        scores.push({ score, timestamp: Date.now(), playerId: playerData.id });
        localStorage.setItem('tournament_scores', JSON.stringify(scores));
        
        return { success: true, local: true };
    }
}
