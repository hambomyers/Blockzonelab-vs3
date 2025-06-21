/**
 * Everything Card - The Universal Identity Card
 * Beautiful Netflix-style card for all game states
 */

import { TournamentLeaderboard } from '../../../shared/ui/TournamentLeaderboard.js';

export class EverythingCard {    constructor() {
        this.container = null;
        this.finalScore = 0;
        this.isVisible = false;
        this.animationInProgress = false;
        this.currentPlayer = null;
        this.tournamentLeaderboard = new TournamentLeaderboard();
        
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

        // Get the real player identity from the game system
        await this.loadCurrentPlayer();

        // Submit score to tournament API
        await this.submitScoreToTournament();

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
    }    async animateStatsReveal(container) {
        const playerStatus = this.getPlayerStatusDisplay();
        
        const stats = [
            { icon: playerStatus.icon, label: playerStatus.status, value: playerStatus.detail },
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
        const playerStatus = this.getPlayerStatusDisplay();
        
        const playBtn = document.createElement('button');
        playBtn.className = 'game-over-btn primary';
        
        // Dynamic button text based on player status
        let buttonText = '🎮 Play Neon Drop';
        if (playerStatus.tier === 'free-available') {
            buttonText = '✨ Play Free Daily Game';
        } else if (playerStatus.tier === 'free-used') {
            buttonText = '💰 Continue Playing';
        } else if (playerStatus.tier === 'monthly') {
            buttonText = '� Play Unlimited';
        } else if (playerStatus.tier === 'daily') {
            buttonText = '⏰ Play All Day';
        } else if (playerStatus.tier === 'single') {
            buttonText = '🪙 Use Paid Game';
        }
        
        playBtn.innerHTML = buttonText;
        playBtn.style.pointerEvents = 'auto';
        playBtn.style.cursor = 'pointer';
        
        playBtn.onclick = (e) => {
            console.log('🎮 Play button clicked:', buttonText);
            e.preventDefault();
            e.stopPropagation();
            this.smartPlayNeonDrop();
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

        container.appendChild(playBtn);
        container.appendChild(leaderboardBtn);

        await this.animateIn(playBtn, 0);
        await this.animateIn(leaderboardBtn, 100);
    }async getPersonalBest() {
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
    }    smartPlayNeonDrop() {
        console.log('🎮 Smart Play Neon Drop - checking player status');
        
        // Check if player has active paid access
        if (this.hasActivePaidAccess()) {
            console.log('💎 Player has paid access - starting game immediately');
            this.startPaidGame();
            return;
        }
        
        // Check if player has used their free daily game
        const hasPlayedFreeGameToday = this.checkFreeGameStatus();
        
        if (hasPlayedFreeGameToday) {
            console.log('💰 Player has used free game - showing payment prompt');
            this.showPaymentPrompt();
        } else {
            console.log('🎮 Starting free daily game');
            this.startFreeGame();
        }
    }
    
    hasActivePaidAccess() {
        const now = new Date();
        
        // Check for monthly pass
        const monthlyExpiry = localStorage.getItem('monthlyPassExpiry');
        if (monthlyExpiry) {
            const expiryDate = new Date(monthlyExpiry);
            if (now < expiryDate) {
                console.log('🎯 Monthly pass active until:', expiryDate.toDateString());
                return true;
            } else {
                // Clean up expired pass
                localStorage.removeItem('monthlyPassExpiry');
            }
        }
        
        // Check for all-day pass
        const allDayDate = localStorage.getItem('allDayPassDate');
        if (allDayDate === now.toDateString()) {
            console.log('⏰ All-day pass active for today');
            return true;
        } else if (allDayDate && allDayDate !== now.toDateString()) {
            // Clean up expired day pass
            localStorage.removeItem('allDayPassDate');
        }
        
        // Check for remaining paid games
        const paidGames = parseInt(localStorage.getItem('paidGamesRemaining') || '0');
        if (paidGames > 0) {
            console.log('🪙 Paid games remaining:', paidGames);
            // Consume one paid game
            localStorage.setItem('paidGamesRemaining', (paidGames - 1).toString());
            return true;
        }
        
        return false;
    }
    
    checkFreeGameStatus() {
        // Check localStorage for last free game date
        const lastFreeGame = localStorage.getItem('lastFreeGameDate');
        const today = new Date().toDateString();
        
        if (lastFreeGame === today) {
            return true; // Already played today
        }
        
        return false; // Haven't played today
    }
    
    startFreeGame() {
        // Mark that they've played their free game today
        localStorage.setItem('lastFreeGameDate', new Date().toDateString());
        
        this.hide();
        
        // Start the game in free mode
        if (window.neonDrop && window.neonDrop.uiStateManager) {
            console.log('🎮 Starting free daily game');
            window.neonDrop.engine.returnToMenu();
            window.neonDrop.uiStateManager.beginGameplay();
        } else {
            window.location.reload();
        }
    }
    
    showPaymentPrompt() {
        // Create elegant pricing modal
        const modal = document.createElement('div');
        modal.className = 'pricing-modal-overlay';
        modal.innerHTML = `
            <div class="pricing-modal">
                <div class="pricing-header">
                    <h2>🎮 Continue Playing</h2>
                    <p>You've used your free daily game!</p>
                    <button class="modal-close">&times;</button>
                </div>
                
                <div class="pricing-options">
                    <div class="pricing-tier" data-tier="single">
                        <div class="tier-icon">🪙</div>
                        <div class="tier-title">Single Game</div>
                        <div class="tier-price">$0.25</div>
                        <div class="tier-desc">One tournament entry</div>
                    </div>
                    
                    <div class="pricing-tier featured" data-tier="daily">
                        <div class="tier-icon">⏰</div>
                        <div class="tier-title">All Day Pass</div>
                        <div class="tier-price">$3.00</div>
                        <div class="tier-desc">Unlimited today</div>
                        <div class="tier-badge">Popular</div>
                    </div>
                    
                    <div class="pricing-tier" data-tier="monthly">
                        <div class="tier-icon">🎯</div>
                        <div class="tier-title">Roll of Quarters</div>
                        <div class="tier-price">$10.00</div>
                        <div class="tier-desc">Unlimited monthly</div>
                    </div>
                </div>
                
                <div class="pricing-footer">
                    <button class="pricing-cancel">Maybe Later</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close').onclick = () => this.closePricingModal(modal);
        modal.querySelector('.pricing-cancel').onclick = () => this.closePricingModal(modal);
        modal.onclick = (e) => {
            if (e.target === modal) this.closePricingModal(modal);
        };
        
        // Pricing tier selection
        modal.querySelectorAll('.pricing-tier').forEach(tier => {
            tier.onclick = () => {
                const tierType = tier.dataset.tier;
                this.selectPricingTier(tierType, modal);
            };
        });
        
        // Animate in
        setTimeout(() => modal.classList.add('visible'), 10);
    }
    
    closePricingModal(modal) {
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 300);
    }
      selectPricingTier(tier, modal) {
        console.log('💰 Selected pricing tier:', tier);
        
        // Show payment processing UI
        this.showPaymentProcessing(tier, modal);
    }
    
    showPaymentProcessing(tier, modal) {
        const paymentContent = modal.querySelector('.pricing-modal');
        
        // Save original content for restoration
        const originalContent = paymentContent.innerHTML;
        
        // Show payment processing screen
        paymentContent.innerHTML = `
            <div class="payment-processing">
                <div class="payment-header">
                    <h2>🔐 Secure Payment</h2>
                    <p>Processing your ${this.getTierDisplayName(tier)} purchase...</p>
                </div>
                
                <div class="payment-simulator">
                    <div class="payment-step active" data-step="1">
                        <div class="step-icon">💳</div>
                        <div class="step-text">Verifying payment method</div>
                        <div class="step-loader"></div>
                    </div>
                    
                    <div class="payment-step" data-step="2">
                        <div class="step-icon">🔒</div>
                        <div class="step-text">Processing secure transaction</div>
                        <div class="step-loader"></div>
                    </div>
                    
                    <div class="payment-step" data-step="3">
                        <div class="step-icon">✅</div>
                        <div class="step-text">Activating game access</div>
                        <div class="step-loader"></div>
                    </div>
                </div>
                
                <div class="payment-footer">
                    <button class="payment-cancel">Cancel</button>
                </div>
            </div>
        `;
        
        // Add cancel functionality
        modal.querySelector('.payment-cancel').onclick = () => {
            paymentContent.innerHTML = originalContent;
            this.rebindPricingEvents(modal);
        };
        
        // Simulate payment processing
        this.simulatePaymentProcess(tier, modal, paymentContent);
    }
    
    async simulatePaymentProcess(tier, modal, paymentContent) {
        const steps = paymentContent.querySelectorAll('.payment-step');
        
        // Step 1: Verify payment method (1.5s)
        await this.processPaymentStep(steps[0], 1500);
        
        // Step 2: Process transaction (2s)
        await this.processPaymentStep(steps[1], 2000);
        
        // Step 3: Activate access (1s)
        await this.processPaymentStep(steps[2], 1000);
        
        // Payment complete - grant access
        this.completePayment(tier, modal);
    }
    
    processPaymentStep(step, duration) {
        return new Promise(resolve => {
            step.classList.add('active');
            
            setTimeout(() => {
                step.classList.remove('active');
                step.classList.add('completed');
                step.querySelector('.step-loader').style.display = 'none';
                step.querySelector('.step-icon').style.opacity = '1';
                resolve();
            }, duration);
        });
    }
    
    completePayment(tier, modal) {
        console.log('✅ Payment completed for tier:', tier);
        
        // Grant access based on tier
        this.grantGameAccess(tier);
        
        // Show success message
        const paymentContent = modal.querySelector('.pricing-modal');
        paymentContent.innerHTML = `
            <div class="payment-success">
                <div class="success-icon">🎉</div>
                <h2>Payment Successful!</h2>
                <p>Your ${this.getTierDisplayName(tier)} is now active</p>
                
                <div class="access-details">
                    ${this.getAccessDetails(tier)}
                </div>
                
                <button class="success-play-btn">🎮 Start Playing</button>
            </div>
        `;
        
        // Add play button functionality
        modal.querySelector('.success-play-btn').onclick = () => {
            this.closePricingModal(modal);
            this.startPaidGame();
        };
        
        // Auto-close after showing success briefly
        setTimeout(() => {
            if (modal.parentNode) {
                this.closePricingModal(modal);
                this.startPaidGame();
            }
        }, 3000);
    }
    
    grantGameAccess(tier) {
        const now = new Date();
        
        switch(tier) {
            case 'single':
                // Grant one additional game
                const currentGames = parseInt(localStorage.getItem('paidGamesRemaining') || '0');
                localStorage.setItem('paidGamesRemaining', (currentGames + 1).toString());
                console.log('🎮 Granted 1 additional game');
                break;
                
            case 'daily':
                // Grant unlimited games for today
                localStorage.setItem('allDayPassDate', now.toDateString());
                console.log('⏰ Granted all-day pass for:', now.toDateString());
                break;
                
            case 'monthly':
                // Grant unlimited games for 30 days
                const monthlyExpiry = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
                localStorage.setItem('monthlyPassExpiry', monthlyExpiry.toISOString());
                console.log('🎯 Granted monthly pass until:', monthlyExpiry.toDateString());
                break;
        }
        
        // Track purchase for analytics
        this.trackPurchase(tier);
    }
    
    getTierDisplayName(tier) {
        const names = {
            single: 'Single Game',
            daily: 'All Day Pass',
            monthly: 'Roll of Quarters'
        };
        return names[tier] || tier;
    }
    
    getAccessDetails(tier) {
        switch(tier) {
            case 'single':
                return '<div class="access-item">🎮 1 Tournament Entry Added</div>';
            case 'daily':
                return '<div class="access-item">⏰ Unlimited Games Until Midnight</div>';
            case 'monthly':
                return '<div class="access-item">🎯 Unlimited Games for 30 Days</div>';
            default:
                return '';
        }
    }
    
    rebindPricingEvents(modal) {
        // Re-add event listeners for pricing tiers
        modal.querySelectorAll('.pricing-tier').forEach(tier => {
            tier.onclick = () => {
                const tierType = tier.dataset.tier;
                this.selectPricingTier(tierType, modal);
            };
        });
    }
    
    startPaidGame() {
        console.log('🎮 Starting paid game');
        
        this.hide();
        
        // Start the game
        if (window.neonDrop && window.neonDrop.uiStateManager) {
            window.neonDrop.engine.returnToMenu();
            window.neonDrop.uiStateManager.beginGameplay();
        } else {
            window.location.reload();
        }
    }
    
    trackPurchase(tier) {
        // Track purchase for analytics/backend integration
        const purchase = {
            tier: tier,
            timestamp: new Date().toISOString(),
            playerId: this.currentPlayer?.id || 'anonymous',
            amount: this.getTierPrice(tier)
        };
        
        // Store locally for now, will sync to backend later
        const purchases = JSON.parse(localStorage.getItem('playerPurchases') || '[]');
        purchases.push(purchase);
        localStorage.setItem('playerPurchases', JSON.stringify(purchases));
        
        console.log('📊 Tracked purchase:', purchase);
    }
    
    getTierPrice(tier) {
        const prices = {
            single: 0.25,
            daily: 3.00,
            monthly: 10.00
        };
        return prices[tier] || 0;
    }

    // ...existing code...
    showLeaderboard() {
        console.log('🏆 Opening tournament leaderboard');
        console.log('🏆 Tournament leaderboard instance:', this.tournamentLeaderboard);
        console.log('🏆 Tournament leaderboard container:', this.tournamentLeaderboard?.container);
        
        if (this.tournamentLeaderboard && this.tournamentLeaderboard.show) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                this.tournamentLeaderboard.show();
                console.log('🏆 Leaderboard show() method called');
            }, 100);
        } else {
            console.error('❌ Tournament leaderboard not properly initialized');
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

    async submitScoreToTournament() {
        try {
            const response = await fetch('https://blockzone-api.hambomyers.workers.dev/api/tournament/submit-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerId: this.currentPlayer.id,
                    playerName: this.currentPlayer.displayName,
                    score: this.finalScore,
                    walletAddress: '0x742d35Cc6548C6532C' // Future: get from wallet connection
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('🏆 Score submitted successfully:', result);
                this.currentPlayer.rank = result.newRank;
                this.currentPlayer.totalPlayers = result.totalPlayers;
            } else {
                console.warn('Failed to submit score to tournament');
            }
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }

    async loadCurrentPlayer() {
        try {
            // Get the real player identity from the main game system
            if (window.neonDrop && window.neonDrop.playerIdentity) {
                const identity = await window.neonDrop.playerIdentity.getIdentity();
                
                this.currentPlayer = {
                    id: identity.playerId || 'anonymous_player',
                    displayName: identity.displayName || identity.name || 'Anonymous Player',
                    score: this.finalScore,
                    walletAddress: identity.walletAddress || null,
                    tier: identity.tier || 'anonymous'
                };
                
                console.log('🎮 Loaded real player identity:', this.currentPlayer.displayName);
            } else {
                // Fallback if identity system isn't available
                this.currentPlayer = {
                    id: 'fallback_player',
                    displayName: 'Player',
                    score: this.finalScore,
                    walletAddress: null,
                    tier: 'anonymous'
                };
                
                console.warn('⚠️ Using fallback player identity');
            }
        } catch (error) {
            console.error('Failed to load player identity:', error);
            
            // Emergency fallback
            this.currentPlayer = {
                id: 'error_player',
                displayName: 'Player',
                score: this.finalScore,
                walletAddress: null,
                tier: 'anonymous'
            };
        }
    }

    getPlayerStatusDisplay() {
        const now = new Date();
        
        // Check for monthly pass
        const monthlyExpiry = localStorage.getItem('monthlyPassExpiry');
        if (monthlyExpiry) {
            const expiryDate = new Date(monthlyExpiry);
            if (now < expiryDate) {
                const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                return {
                    icon: '🎯',
                    status: 'Roll of Quarters',
                    detail: `${daysLeft} days remaining`,
                    tier: 'monthly'
                };
            }
        }
        
        // Check for all-day pass
        const allDayDate = localStorage.getItem('allDayPassDate');
        if (allDayDate === now.toDateString()) {
            const midnight = new Date(now);
            midnight.setHours(23, 59, 59, 999);
            const hoursLeft = Math.ceil((midnight - now) / (1000 * 60 * 60));
            return {
                icon: '⏰',
                status: 'All Day Pass',
                detail: `${hoursLeft} hours remaining`,
                tier: 'daily'
            };
        }
        
        // Check for remaining paid games
        const paidGames = parseInt(localStorage.getItem('paidGamesRemaining') || '0');
        if (paidGames > 0) {
            return {
                icon: '🪙',
                status: 'Paid Games',
                detail: `${paidGames} games remaining`,
                tier: 'single'
            };
        }
        
        // Check if used free game today
        const lastFreeGame = localStorage.getItem('lastFreeGameDate');
        if (lastFreeGame === now.toDateString()) {
            return {
                icon: '🎮',
                status: 'Free Player',
                detail: 'Daily game used',
                tier: 'free-used'
            };
        }
        
        // Free game available
        return {
            icon: '✨',
            status: 'Free Player',
            detail: 'Daily game available',
            tier: 'free-available'
        };
    }
}
