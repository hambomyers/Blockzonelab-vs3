/**
 * AAA Game Over Sequence - Cinematic Stats Reveal
 * Beautiful, professional, and graceful even when API is down
 */

import { LocalLeaderboardSystem } from './local-leaderboard-system.js';

export class GameOverSequence {
    constructor() {
        this.container = null;
        this.finalScore = 0;
        this.isVisible = false;
        this.animationInProgress = false;
        this.leaderboard = new LocalLeaderboardSystem();
        this.currentPlayer = null;
        
        this.createContainer();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'game-over-overlay';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
    }    async show(score) {
        if (this.isVisible || this.animationInProgress) return;
        
        this.finalScore = score;
        this.isVisible = true;
        this.animationInProgress = true;

        // Get current player and submit score
        this.currentPlayer = await this.leaderboard.getCurrentPlayer();
        await this.leaderboard.submitScore({
            playerId: this.currentPlayer.id,
            playerName: this.currentPlayer.displayName,
            score: this.finalScore
        });

        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        
        await this.createCinematicReveal();
        
        this.animationInProgress = false;
    }    async createCinematicReveal() {
        const card = document.createElement('div');
        card.className = 'game-over-card';
        this.container.appendChild(card);

        // Netflix-style Hero Section
        const heroSection = document.createElement('div');
        heroSection.className = 'hero-section';
        card.appendChild(heroSection);

        // Add chiclet title
        const titleContainer = this.createNetflixChicletTitle();
        heroSection.appendChild(titleContainer);

        // Add subtitle
        const subtitle = document.createElement('div');
        subtitle.className = 'game-over-subtitle';
        subtitle.textContent = 'DAILY LEADERBOARD CHALLENGE!';
        heroSection.appendChild(subtitle);

        const divider = document.createElement('div');
        divider.className = 'game-over-divider';
        card.appendChild(divider);

        const statsSection = document.createElement('div');
        statsSection.className = 'game-over-stats';
        card.appendChild(statsSection);

        await this.animateStatsReveal(statsSection);

        const buttonsSection = document.createElement('div');
        buttonsSection.className = 'game-over-buttons';
        card.appendChild(buttonsSection);

        await this.createActionButtons(buttonsSection);
    }

    async animateStatsReveal(container) {
        const stats = [
            { icon: '🎮', label: 'Your Score', value: this.finalScore.toLocaleString() },
            { icon: '📈', label: 'Personal Best', value: await this.getPersonalBest() },
            { icon: '🏆', label: 'Global Rank', value: await this.getGlobalRank() },
            { icon: '💎', label: 'Earnings', value: await this.getEarnings() }
        ];

        for (let i = 0; i < stats.length; i++) {
            const stat = stats[i];
            const statElement = this.createStatElement(stat);
            container.appendChild(statElement);
            
            await this.animateIn(statElement, i * 200);
        }
    }

    createStatElement(stat) {
        const element = document.createElement('div');
        element.className = 'stat-row';
        element.innerHTML = `
            <span class="stat-icon">${stat.icon}</span>
            <span class="stat-label">${stat.label}:</span>
            <span class="stat-value">${stat.value}</span>
        `;
        return element;
    }

    animateIn(element, delay = 0) {
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
                
                setTimeout(resolve, 600);
            }, delay);
        });
    }    async createActionButtons(container) {
        const playAgainBtn = document.createElement('button');
        playAgainBtn.className = 'game-over-btn primary';
        playAgainBtn.innerHTML = '� Free Game';
        playAgainBtn.style.pointerEvents = 'auto';
        playAgainBtn.style.cursor = 'pointer';
        playAgainBtn.onclick = (e) => {
            console.log('� Free Game button clicked!');
            e.preventDefault();
            e.stopPropagation();
            this.playAgain();
        };

        const leaderboardBtn = document.createElement('button');
        leaderboardBtn.className = 'game-over-btn secondary';
        leaderboardBtn.innerHTML = '🏆 Leaderboard';
        leaderboardBtn.style.pointerEvents = 'auto';
        leaderboardBtn.style.cursor = 'pointer';
        leaderboardBtn.onclick = (e) => {
            console.log('🏆 Leaderboard button clicked!');
            e.preventDefault();
            e.stopPropagation();
            this.showLeaderboard();
        };

        container.appendChild(playAgainBtn);
        container.appendChild(leaderboardBtn);

        await this.animateIn(playAgainBtn, 0);
        await this.animateIn(leaderboardBtn, 100);
    }    async getPersonalBest() {
        try {
            if (this.currentPlayer && this.currentPlayer.stats) {
                return this.currentPlayer.stats.bestScore.toLocaleString();
            }
            
            // Fallback to localStorage
            const saved = localStorage.getItem('neon_drop_best_score');
            const best = saved ? parseInt(saved) : 0;
            const newBest = Math.max(best, this.finalScore);
            
            if (newBest > best) {
                localStorage.setItem('neon_drop_best_score', newBest.toString());
            }
            
            return newBest.toLocaleString();
        } catch (error) {
            return this.finalScore.toLocaleString();
        }
    }

    async getGlobalRank() {
        try {
            if (this.currentPlayer) {
                const rank = await this.leaderboard.getPlayerRank(this.currentPlayer.id);
                if (rank) {
                    return `#${rank}`;
                }
            }
            
            // Fallback to API if available
            const response = await fetch('https://blockzone-api.hambomyers.workers.dev/api/leaderboard', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                const rank = this.calculateApproximateRank(data, this.finalScore);
                return `#${rank}`;
            }
        } catch (error) {
            console.log('API unavailable, using fallback rank');
        }
        
        return this.estimateRank(this.finalScore);
    }

    calculateApproximateRank(leaderboardData, score) {
        if (!leaderboardData || !leaderboardData.length) return '???';
        
        let rank = 1;
        for (const entry of leaderboardData) {
            if (entry.score > score) {
                rank++;
            }
        }
        return rank;
    }

    estimateRank(score) {
        if (score > 2000) return '#1-10';
        if (score > 1500) return '#11-50';
        if (score > 1000) return '#51-200';
        if (score > 500) return '#201-1000';
        return '#1000+';
    }

    async getEarnings() {
        const baseEarnings = Math.floor(this.finalScore / 10);
        const bonus = this.finalScore > 1000 ? 50 : 0;
        const total = baseEarnings + bonus;
        
        return `+${total} QUARTERS`;
    }    playAgain() {
        this.hide();
        
        // Go to GAME_SESSION state (Press Space to Start) instead of all the way back to menu
        if (window.neonDrop && window.neonDrop.uiStateManager) {
            console.log('� Going to game session state for fresh start');
            window.neonDrop.engine.returnToMenu();
            window.neonDrop.uiStateManager.beginGameplay();
        } else {
            // Fallback: reload the page
            console.log('🔄 Fallback: reloading page');
            window.location.reload();
        }
    }

    showLeaderboard() {
        this.hide();
        
        // Check if there's a leaderboard system
        if (window.neonDrop && window.neonDrop.leaderboard) {
            console.log('📊 Opening leaderboard via game system');
            window.neonDrop.leaderboard.show();
        } else {
            // For now, just log - we'll implement this properly
            console.log('📊 Leaderboard system not yet implemented');
            alert('Leaderboard coming soon! 🏆');
        }
    }

    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        
        this.container.style.transition = 'opacity 0.3s ease-out';
        this.container.style.opacity = '0';
        
        setTimeout(() => {
            this.container.style.display = 'none';
            this.container.style.opacity = '1';
        }, 300);
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }    createNetflixChicletTitle() {
        const container = document.createElement('div');
        container.className = 'netflix-chiclet-title';
        
        const words = ['NEON', 'DROP'];
        
        words.forEach((word, wordIndex) => {
            const wordContainer = document.createElement('div');
            wordContainer.className = 'chiclet-word';
            
            [...word].forEach((letter, letterIndex) => {
                const chiclet = document.createElement('div');
                chiclet.className = `chiclet ${wordIndex === 0 ? 'neon' : 'drop'}`;
                chiclet.textContent = letter;
                chiclet.style.animationDelay = `${(wordIndex * 4 + letterIndex) * 100}ms`;
                wordContainer.appendChild(chiclet);
            });
            
            container.appendChild(wordContainer);
            
            // Add 2 block spaces between NEON and DROP (like actual game)
            if (wordIndex === 0) {
                const spacer1 = document.createElement('div');
                spacer1.className = 'chiclet-spacer';
                container.appendChild(spacer1);
                
                const spacer2 = document.createElement('div');
                spacer2.className = 'chiclet-spacer';
                container.appendChild(spacer2);
            }
        });
        
        return container;
    }
}
