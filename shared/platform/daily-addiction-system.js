/**
 * Daily Addiction System
 * Creates addictive daily gaming habits with profile requirements
 * - Requires profile/wallet to play free daily games
 * - Tracks streaks and provides rewards
 * - Encourages daily engagement
 */

export class DailyAddictionSystem {
    constructor() {
        this.API_BASE = '/api';
        this.STORAGE_KEYS = {
            DAILY_PLAYS: 'blockzone_daily_plays',
            STREAK_COUNT: 'blockzone_streak_count',
            LAST_PLAY_DATE: 'blockzone_last_play_date',
            REWARDS_CLAIMED: 'blockzone_rewards_claimed',
            ADDICTION_STATS: 'blockzone_addiction_stats'
        };
        this.currentDate = new Date().toDateString();
        this.init();
    }

    /**
     * Initialize the addiction system
     */
    init() {
        this.loadStats();
        this.checkStreakContinuity();
        this.updateUI();
    }

    /**
     * Load addiction statistics
     */
    loadStats() {
        this.stats = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ADDICTION_STATS) || '{}');
        this.streakCount = parseInt(localStorage.getItem(this.STORAGE_KEYS.STREAK_COUNT) || '0');
        this.lastPlayDate = localStorage.getItem(this.STORAGE_KEYS.LAST_PLAY_DATE);
        this.dailyPlays = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.DAILY_PLAYS) || '{}');
        this.rewardsClaimed = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.REWARDS_CLAIMED) || '{}');
    }

    /**
     * Check if user can play a free game today
     */
    canPlayFreeGame(gameId = 'neondrop') {
        // Check if user has a profile (wallet)
        const hasProfile = this.hasUserProfile();
        if (!hasProfile) {
            return {
                canPlay: false,
                reason: 'profile_required',
                message: 'Create a profile to play free daily games!',
                action: 'create_profile'
            };
        }

        // Check if already played today
        const todayKey = `${gameId}_${this.currentDate}`;
        if (this.dailyPlays[todayKey]) {
            return {
                canPlay: false,
                reason: 'already_played',
                message: `You've already played ${gameId} today!`,
                action: 'wait_tomorrow'
            };
        }

        return {
            canPlay: true,
            reason: 'available',
            message: 'Free game available!',
            action: 'play_now'
        };
    }

    /**
     * Check if user has a profile/wallet
     */
    hasUserProfile() {
        // Check session manager first (preferred method)
        try {
            if (sessionManager && sessionManager.isAuthenticated()) {
                return true;
            }
        } catch (error) {
            console.warn('Session manager check failed:', error);
        }
        
        // Fallback to legacy checks
        const hasSession = localStorage.getItem('sessionId');
        const hasWallet = localStorage.getItem('blockzone_wallet_encrypted');
        const hasUserManager = false; // Deprecated - using sessionManager
        
        return !!(hasSession || hasWallet || hasUserManager);
    }

    /**
     * Record a game play for today
     */
    async recordGamePlay(gameId = 'neondrop', score = 0) {
        const todayKey = `${gameId}_${this.currentDate}`;
        
        // Record the play
        this.dailyPlays[todayKey] = {
            timestamp: Date.now(),
            score: score,
            gameId: gameId
        };
        
        // Update streak
        this.updateStreak();
        
        // Save stats
        this.saveStats();
        
        // Update backend
        await this.syncToBackend(gameId, score);
        
        // Check for rewards
        this.checkRewards();
        
        console.log(`🎮 Recorded ${gameId} play for ${this.currentDate}`);
    }

    /**
     * Update streak count
     */
    updateStreak() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();
        
        if (this.lastPlayDate === yesterdayString) {
            // Consecutive day
            this.streakCount++;
            console.log(`🔥 Streak continues: ${this.streakCount} days!`);
        } else if (this.lastPlayDate === this.currentDate) {
            // Already played today, don't update streak
            return;
        } else {
            // Streak broken or first play
            this.streakCount = 1;
            console.log(`🆕 New streak started!`);
        }
        
        this.lastPlayDate = this.currentDate;
    }

    /**
     * Check streak continuity (handle missed days)
     */
    checkStreakContinuity() {
        if (!this.lastPlayDate) return;
        
        const lastPlay = new Date(this.lastPlayDate);
        const today = new Date();
        const daysDiff = Math.floor((today - lastPlay) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 1) {
            // Streak broken
            this.streakCount = 0;
            console.log(`💔 Streak broken - missed ${daysDiff} days`);
        }
    }

    /**
     * Check for rewards based on streak
     */
    checkRewards() {
        const rewards = this.calculateRewards();
        const todayKey = this.currentDate;
        
        if (rewards.available && !this.rewardsClaimed[todayKey]) {
            this.showRewardNotification(rewards);
        }
    }

    /**
     * Calculate available rewards
     */
    calculateRewards() {
        const rewards = {
            available: false,
            type: null,
            amount: 0,
            message: ''
        };

        // Daily streak rewards
        if (this.streakCount >= 7) {
            rewards.available = true;
            rewards.type = 'weekly_bonus';
            rewards.amount = 50; // USDC.E
            rewards.message = `🔥 7-day streak bonus: ${rewards.amount} USDC.E!`;
        } else if (this.streakCount >= 3) {
            rewards.available = true;
            rewards.type = 'streak_bonus';
            rewards.amount = 10; // USDC.E
            rewards.message = `🔥 ${this.streakCount}-day streak: ${rewards.amount} USDC.E!`;
        }

        return rewards;
    }

    /**
     * Show reward notification
     */
    showRewardNotification(rewards) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'addiction-reward-notification';
        notification.innerHTML = `
            <div class="reward-content">
                <div class="reward-icon">💰</div>
                <div class="reward-text">
                    <h3>Daily Reward!</h3>
                    <p>${rewards.message}</p>
                </div>
                <button class="reward-claim-btn" onclick="this.parentElement.parentElement.remove()">
                    Claim ${rewards.amount} USDC.E
                </button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
            border: 2px solid #00ff88;
            border-radius: 12px;
            padding: 20px;
            color: white;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * Get addiction statistics
     */
    getAddictionStats() {
        return {
            currentStreak: this.streakCount,
            totalPlays: Object.keys(this.dailyPlays).length,
            gamesPlayedToday: this.getGamesPlayedToday(),
            lastPlayDate: this.lastPlayDate,
            rewards: this.calculateRewards(),
            profileRequired: !this.hasUserProfile()
        };
    }

    /**
     * Get games played today
     */
    getGamesPlayedToday() {
        return Object.keys(this.dailyPlays).filter(key => 
            key.includes(this.currentDate)
        ).length;
    }

    /**
     * Save statistics to localStorage
     */
    saveStats() {
        localStorage.setItem(this.STORAGE_KEYS.DAILY_PLAYS, JSON.stringify(this.dailyPlays));
        localStorage.setItem(this.STORAGE_KEYS.STREAK_COUNT, this.streakCount.toString());
        localStorage.setItem(this.STORAGE_KEYS.LAST_PLAY_DATE, this.lastPlayDate);
        localStorage.setItem(this.STORAGE_KEYS.ADDICTION_STATS, JSON.stringify(this.stats));
    }

    /**
     * Sync to backend
     */
    async syncToBackend(gameId, score) {
        try {
            const response = await fetch(`${this.API_BASE}/addiction/record-play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId,
                    score,
                    date: this.currentDate,
                    streak: this.streakCount,
                    deviceId: this.getDeviceId()
                })
            });
            
            if (response.ok) {
                console.log('✅ Addiction stats synced to backend');
            }
        } catch (error) {
            console.warn('⚠️ Failed to sync addiction stats:', error);
        }
    }

    /**
     * Get device ID for tracking
     */
    getDeviceId() {
        return localStorage.getItem('blockzone_device_id') || 'unknown';
    }

    /**
     * Update UI elements
     */
    updateUI() {
        // Update streak display
        const streakElements = document.querySelectorAll('.streak-count');
        streakElements.forEach(el => {
            el.textContent = this.streakCount;
        });

        // Update daily plays display
        const dailyPlaysElements = document.querySelectorAll('.daily-plays-count');
        dailyPlaysElements.forEach(el => {
            el.textContent = this.getGamesPlayedToday();
        });

        // Show/hide profile requirement warnings
        const profileWarnings = document.querySelectorAll('.profile-required-warning');
        profileWarnings.forEach(el => {
            el.style.display = this.hasUserProfile() ? 'none' : 'block';
        });
    }

    /**
     * Create addiction UI component
     */
    createAddictionUI() {
        const stats = this.getAddictionStats();
        
        return `
            <div class="addiction-dashboard">
                <div class="addiction-header">
                    <h3>🎮 Daily Gaming</h3>
                    <p>Build your streak and earn rewards!</p>
                </div>
                
                <div class="addiction-stats">
                    <div class="stat-item">
                        <span class="stat-label">Current Streak</span>
                        <span class="stat-value streak-count">${stats.currentStreak}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Today's Plays</span>
                        <span class="stat-value daily-plays-count">${stats.gamesPlayedToday}</span>
                    </div>
                </div>
                
                ${!stats.profileRequired ? `
                    <div class="addiction-actions">
                        <button class="btn btn-primary" onclick="window.dailyAddiction.playFreeGame()">
                            🎮 Play Free Game
                        </button>
                    </div>
                ` : `
                    <div class="profile-required-warning">
                        <p>⚠️ Create a profile to play free daily games!</p>
                        <a href="/pages/user-profile.html" class="btn btn-outline">Create Profile</a>
                    </div>
                `}
                
                ${stats.rewards.available ? `
                    <div class="reward-available">
                        <p>${stats.rewards.message}</p>
                        <button class="btn btn-success" onclick="window.dailyAddiction.claimReward()">
                            Claim Reward
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Play free game (called from UI)
     */
    async playFreeGame() {
        const canPlay = this.canPlayFreeGame();
        
        if (!canPlay.canPlay) {
            alert(canPlay.message);
            return;
        }
        
        // Redirect to game
        window.location.href = '/games/neondrop/';
    }

    /**
     * Claim reward (called from UI)
     */
    async claimReward() {
        const rewards = this.calculateRewards();
        const todayKey = this.currentDate;
        
        if (rewards.available && !this.rewardsClaimed[todayKey]) {
            this.rewardsClaimed[todayKey] = {
                type: rewards.type,
                amount: rewards.amount,
                claimedAt: Date.now()
            };
            
            localStorage.setItem(this.STORAGE_KEYS.REWARDS_CLAIMED, JSON.stringify(this.rewardsClaimed));
            
            alert(`🎉 Reward claimed: ${rewards.amount} USDC.E!`);
            this.updateUI();
        }
    }
}

// Create singleton instance
export const dailyAddiction = new DailyAddictionSystem();

// Make available globally
window.dailyAddiction = dailyAddiction; 
