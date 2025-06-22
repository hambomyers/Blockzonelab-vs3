/**
 * Everything Card - The Universal Identity Card
 * Beautiful Netflix-style card for all game states
 */

// Removed: TournamentLeaderboard stub - replaced by UnifiedTournamentSystem

export class EverythingCard {
    constructor() {
        this.container = null;
        this.finalScore = 0;
        this.isVisible = false;
        this.animationInProgress = false;
        this.currentPlayer = null;
        
        // FIXED: Get unified systems from global
        this.playerSystem = window.neonDrop?.playerSystem || null;
        this.tournamentSystem = window.neonDrop?.tournament || null;
        
        this.createContainer();
        console.log('✅ EverythingCard initialized with unified systems');
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'game-over-overlay';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
    }    async show(score, gameStats = {}) {
        if (this.isVisible || this.animationInProgress) return;
        
        console.log('🎭 EverythingCard showing with score:', score);
        
        this.finalScore = score;
        this.isVisible = true;
        this.animationInProgress = true;

        try {
            // FIXED: Get or create player through unified system
            this.currentPlayer = await this.ensurePlayerExists();
            
            // FIXED: Submit score to tournament system
            await this.submitScoreToTournament();
            
            this.container.innerHTML = '';
            this.container.style.display = 'flex';
            
            await this.createCinematicReveal();
            
        } catch (error) {
            console.error('❌ Error showing EverythingCard:', error);
            // Show basic game over anyway
            await this.createBasicGameOver();
        }        
        this.animationInProgress = false;
    }

    async createCinematicReveal() {
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

    getPlayerStatusDisplay() {
        // Default status for anonymous players
        return {
            icon: '👤',
            status: 'Anonymous Player',
            detail: 'Create identity to track progress',
            tier: 'anonymous'
        };
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
    }

    async createActionButtons(container) {
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
            buttonText = '🎯 Play Unlimited';
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
    }

    async getPersonalBest() {
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
    }

    async smartPlayNeonDrop() {
        console.log('🎮 Smart Play Neon Drop - checking wallet-based player status');
        
        // Ensure we have a wallet identity
        if (!this.currentPlayer?.walletAddress) {
            console.warn('⚠️ No wallet identity found - creating new identity');
            await this.show(0); // Show identity creation flow
            return;
        }
        
        // Check wallet-based game access
        const accessResult = await this.checkGameAccess();
        
        if (accessResult.hasAccess) {
            switch(accessResult.accessType) {
                case 'monthly':
                case 'daily':
                    console.log(`🎯 Player has ${accessResult.accessType} access - starting game immediately`);
                    this.startGame();
                    break;
                    
                case 'single':
                    console.log(`🪙 Player has ${accessResult.gamesRemaining} paid games remaining`);
                    this.startGame();
                    break;
                    
                case 'free':
                default:
                    console.log('🎮 Starting free daily game');
                    this.startGame();
                    break;
            }
        } else {
            console.log('💰 No game access available - showing payment prompt');
            this.showPaymentPrompt();
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

    async completePayment(tier, modal) {
        console.log('✅ Payment completed for tier:', tier);
        
        // Update wallet-based payment tier
        const success = await this.updatePaymentTier(tier);
        
        if (success) {
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
                    
                    <div class="wallet-info">
                        <small>💳 Linked to ${this.currentPlayer?.displayFormat || 'your wallet'}</small>
                    </div>
                    
                    <button class="success-play-btn">🎮 Start Playing</button>
                </div>
            `;
            
            // Add play button functionality
            modal.querySelector('.success-play-btn').onclick = () => {
                this.closePricingModal(modal);
                this.startGame();
            };
            
            // Auto-close after showing success briefly
            setTimeout(() => {
                if (modal.parentNode) {
                    this.closePricingModal(modal);
                    this.startGame();
                }
            }, 3000);
        } else {
            // Show error
            alert('Payment processing failed. Please try again.');
        }
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
        };        return prices[tier] || 0;
    }    showLeaderboard() {
        console.log('🏆 Opening tournament leaderboard');
        
        // Use unified tournament system if available
        if (this.tournamentSystem) {
            console.log('🏆 Using unified tournament system leaderboard');
            this.tournamentSystem.show(); // This should show UnifiedPlayerCard leaderboard
            return;
        }
        
        // Fallback to global leaderboard
        if (window.leaderboard && window.leaderboard.show) {
            console.log('🏆 Using global leaderboard');
            window.leaderboard.show();
            return;
        }
        
        console.warn('🏆 No leaderboard system available');
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
    }

    createNetflixChicletTitle() {
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
    }    // FIXED: Ensure player exists with proper name input
    async ensurePlayerExists() {
        try {
            // Try to get player from unified system
            if (this.playerSystem) {
                let player = await this.playerSystem.getPlayer();
                
                // If no player or anonymous, show identity creation
                if (!player || !player.displayName || player.displayName.startsWith('Player')) {
                    console.log('🆕 No named player found, showing identity creation');
                    player = await this.showIdentityCreation();
                }
                
                return player;
            }
            
            // Fallback if no player system
            return {
                id: 'fallback_player',
                displayName: 'Player',
                level: 1,
                experience: 0,
                balances: { quarters: 0, usdc: 0, freeCredits: 0 }
            };
            
        } catch (error) {
            console.error('❌ Error ensuring player exists:', error);
            // Return basic player as fallback
            return {
                id: 'fallback_player',
                displayName: 'Player',
                level: 1,
                experience: 0,
                balances: { quarters: 0, usdc: 0, freeCredits: 0 }
            };
        }
    }

    // FIXED: Beautiful identity creation flow
    async showIdentityCreation() {
        return new Promise((resolve) => {
            this.container.innerHTML = `
                <div class="game-over-card" style="max-width: 450px;">
                    <div class="hero-section">
                        <div class="netflix-chiclet-title">
                            ${this.createChicletTitle()}
                        </div>
                        <div class="game-over-subtitle">Welcome to BlockZone!</div>
                    </div>
                    
                    <div class="identity-creation-form">
                        <h3 style="color: #00d4ff; margin-bottom: 15px;">Choose Your Player Name</h3>
                        <p style="color: #aaa; margin-bottom: 20px;">This will be your identity across all games</p>
                        
                        <input type="text" 
                               id="playerNameInput" 
                               placeholder="Enter your name (3+ characters)" 
                               maxlength="20"
                               style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(0,212,255,0.3); 
                                      background: rgba(0,0,0,0.3); color: white; font-size: 16px; margin-bottom: 20px; box-sizing: border-box;">
                        
                        <div class="button-grid">
                            <button id="createPlayerBtn" class="game-over-btn primary" disabled>
                                ✨ Create Player
                            </button>
                            <button id="skipBtn" class="game-over-btn secondary">
                                ⏭️ Skip for Now
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const nameInput = this.container.querySelector('#playerNameInput');
            const createBtn = this.container.querySelector('#createPlayerBtn');
            const skipBtn = this.container.querySelector('#skipBtn');

            // Enable/disable create button based on input
            nameInput.addEventListener('input', (e) => {
                const name = e.target.value.trim();
                createBtn.disabled = name.length < 3;
            });

            // Create player button
            createBtn.addEventListener('click', async () => {
                const name = nameInput.value.trim();
                if (name.length >= 3) {
                    try {
                        const player = this.playerSystem ? 
                            await this.playerSystem.createPlayer({ displayName: name }) :
                            { id: 'created_player', displayName: name, level: 1, experience: 0, balances: { quarters: 0, usdc: 0, freeCredits: 0 } };
                        console.log('✅ Player created:', name);
                        resolve(player);
                    } catch (error) {
                        console.error('❌ Failed to create player:', error);
                        alert('Failed to create player. Please try again.');
                    }
                }
            });

            // Skip button
            skipBtn.addEventListener('click', async () => {
                try {
                    const player = this.playerSystem ?
                        await this.playerSystem.createPlayer({ displayName: `Player${Math.floor(Math.random() * 10000)}` }) :
                        { id: 'skipped_player', displayName: 'Anonymous Player', level: 1, experience: 0, balances: { quarters: 0, usdc: 0, freeCredits: 0 } };
                    resolve(player);
                } catch (error) {
                    console.error('❌ Failed to create player:', error);
                    resolve({
                        id: 'anonymous_player',
                        displayName: 'Anonymous Player',
                        level: 1,
                        experience: 0,
                        balances: { quarters: 0, usdc: 0, freeCredits: 0 }
                    });
                }
            });

            // Focus the input
            setTimeout(() => nameInput.focus(), 500);
        });
    }

    // FIXED: Submit score to unified tournament system
    async submitScoreToTournament() {
        try {
            if (this.tournamentSystem && this.currentPlayer) {
                const result = await this.tournamentSystem.submitScore(
                    this.currentPlayer.id,
                    this.finalScore,
                    {
                        playerName: this.currentPlayer.displayName,
                        gameData: { timestamp: Date.now() }
                    }
                );
                
                if (result) {
                    console.log('🏆 Score submitted to tournament:', result);
                    this.currentPlayer.rank = result.rank;
                    this.currentPlayer.totalPlayers = result.totalPlayers;
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to submit tournament score:', error);
        }
    }

    // FIXED: Basic game over fallback
    async createBasicGameOver() {
        this.container.innerHTML = `
            <div class="game-over-card">
                <div class="hero-section">
                    <h2 style="color: #00d4ff; font-size: 28px; margin-bottom: 20px;">Game Over</h2>
                    <p style="color: #aaa;">Score: ${this.finalScore.toLocaleString()}</p>
                </div>
                
                <div class="game-over-buttons">
                    <button class="game-over-btn primary" onclick="document.dispatchEvent(new CustomEvent('gameOverChoice', {detail: {action: 'play-again'}}))">
                        🎮 Play Again
                    </button>
                    <button class="game-over-btn secondary" onclick="document.dispatchEvent(new CustomEvent('gameOverChoice', {detail: {action: 'menu'}}))">
                        🏠 Menu
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Connect EverythingCard to unified systems for data access
     */
    connectToUnifiedSystems(unifiedSystems) {
        console.log('🔗 Connecting EverythingCard to unified systems');
        
        this.unifiedSystems = unifiedSystems;
        this.playerSystem = unifiedSystems.playerSystem;
        this.tournamentSystem = unifiedSystems.tournamentSystem;
        
        // Set up real-time data access
        this.setupUnifiedDataAccess();
        
        console.log('✅ EverythingCard connected to unified systems');
    }

    /**
     * Set up real-time data access from unified systems
     */
    setupUnifiedDataAccess() {
        // Listen for player updates
        this.playerSystem.on('player:level-up', (data) => {
            console.log('🎉 Player leveled up:', data);
            // Could show celebration animation
        });
        
        this.playerSystem.on('player:achievement-unlocked', (data) => {
            console.log('🏆 Achievement unlocked:', data);
            // Could show achievement notification
        });
        
        // Listen for tournament updates
        this.tournamentSystem.on('tournament:score-submitted', (data) => {
            console.log('📊 Score submitted:', data);
            // Update display with new rank
        });
    }

    // FIXED: Helper method to create chiclet title
    createChicletTitle() {
        const words = ['NEON', 'DROP'];
        let titleHTML = '<div class="netflix-chiclet-title">';
        
        words.forEach((word, wordIndex) => {
            titleHTML += '<div class="chiclet-word">';
            
            [...word].forEach((letter, letterIndex) => {
                titleHTML += `<div class="chiclet ${wordIndex === 0 ? 'neon' : 'drop'}" 
                    style="animation-delay: ${(wordIndex * 4 + letterIndex) * 100}ms;">
                    ${letter}
                </div>`;
            });
            
            titleHTML += '</div>';
            
            if (wordIndex === 0) {
                titleHTML += '<div class="chiclet-spacer"></div>';
                titleHTML += '<div class="chiclet-spacer"></div>';
            }
        });
        
        titleHTML += '</div>';
        return titleHTML;
    }

    // FIXED: Update existing action buttons to use new event system
    updateActionButtonsForNewEventSystem() {
        // Find existing buttons and update their onclick handlers
        const buttons = this.container.querySelectorAll('.game-over-btn');
        
        buttons.forEach(button => {
            const text = button.textContent;
            
            if (text.includes('Play') || text.includes('Again')) {
                button.onclick = () => {
                    console.log('🎮 Play Again clicked');
                    this.hide();
                    document.dispatchEvent(new CustomEvent('gameOverChoice', {
                        detail: { action: 'play-again' }
                    }));
                };
            } else if (text.includes('Leaderboard')) {
                button.onclick = () => {
                    console.log('🏆 Leaderboard clicked');
                    document.dispatchEvent(new CustomEvent('gameOverChoice', {
                        detail: { action: 'leaderboard' }
                    }));
                };
            } else if (text.includes('Menu')) {
                button.onclick = () => {
                    console.log('🏠 Menu clicked');
                    this.hide();
                    document.dispatchEvent(new CustomEvent('gameOverChoice', {
                        detail: { action: 'menu' }
                    }));
                };
            }
        });
    }
}