/**
 * Referral Tracker - BlockZone Lab
 * Handles viral challenge links and referral tracking
 */

import { viralStatusSystem } from './ViralStatusSystem.js';
import { styleSelector } from './StyleSelector.js';

export class ReferralTracker {
    constructor() {
        this.currentUser = null;
        this.referralCount = 0;
        this.currentStatus = null;
        this.currentStyle = 'style1';
        this.onStatusUpdate = null;
    }

    /**
     * Initialize referral tracker
     */
    async initialize(userId, playerName) {
        this.currentUser = { id: userId, name: playerName };
        
        // Load user data from backend/localStorage
        await this.loadUserData();
        
        // Check for referral in URL
        this.checkForReferral();
        
        // Update status display
        this.updateStatusDisplay();
    }

    /**
     * Load user data
     */
    async loadUserData() {
        // Try to load from localStorage first
        const stored = localStorage.getItem(`viral_status_${this.currentUser.id}`);
        if (stored) {
            const data = JSON.parse(stored);
            this.referralCount = data.referralCount || 0;
            this.currentStyle = data.style || 'style1';
        }

        // TODO: Load from backend API
        // const response = await fetch(`/api/user/${this.currentUser.id}/referrals`);
        // const data = await response.json();
        // this.referralCount = data.referralCount;

        this.currentStatus = viralStatusSystem.getStatus(this.referralCount);
    }

    /**
     * Save user data
     */
    async saveUserData() {
        const data = {
            referralCount: this.referralCount,
            style: this.currentStyle,
            lastUpdated: Date.now()
        };

        localStorage.setItem(`viral_status_${this.currentUser.id}`, JSON.stringify(data));

        // TODO: Save to backend API
        // await fetch(`/api/user/${this.currentUser.id}/referrals`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(data)
        // });
    }

    /**
     * Check for referral in URL
     */
    checkForReferral() {
        const urlParams = new URLSearchParams(window.location.search);
        const referralId = urlParams.get('ref');
        
        if (referralId && referralId !== this.currentUser.id) {
            this.processReferral(referralId);
        }
    }

    /**
     * Process a new referral
     */
    async processReferral(referrerId) {
        // Prevent self-referral
        if (referrerId === this.currentUser.id) return;

        // Check if this is a new referral
        const referralKey = `referral_${this.currentUser.id}_${referrerId}`;
        if (localStorage.getItem(referralKey)) return;

        // Mark as processed
        localStorage.setItem(referralKey, Date.now());

        // Increment referrer's count
        await this.incrementReferralCount(referrerId);

        // Show referral success message
        this.showReferralSuccess();
    }

    /**
     * Increment referral count for a user
     */
    async incrementReferralCount(userId) {
        // TODO: Update backend API
        // await fetch(`/api/user/${userId}/referrals/increment`, { method: 'POST' });

        // For now, update local storage
        const currentData = localStorage.getItem(`viral_status_${userId}`);
        if (currentData) {
            const data = JSON.parse(currentData);
            data.referralCount = (data.referralCount || 0) + 1;
            localStorage.setItem(`viral_status_${userId}`, JSON.stringify(data));
        }
    }

    /**
     * Generate challenge links
     */
    generateChallengeLinks(score) {
        const baseUrl = window.location.origin;
        const challengeId = this.generateChallengeId();
        
        return {
            easy: `${baseUrl}/games/neondrop/?ref=${this.currentUser.id}&challenge=${challengeId}&score=${score}&difficulty=easy`,
            medium: `${baseUrl}/games/neondrop/?ref=${this.currentUser.id}&challenge=${challengeId}&score=${score}&difficulty=medium`,
            hard: `${baseUrl}/games/neondrop/?ref=${this.currentUser.id}&challenge=${challengeId}&score=${score}&difficulty=hard`
        };
    }

    /**
     * Generate unique challenge ID
     */
    generateChallengeId() {
        return `${this.currentUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Update status display
     */
    updateStatusDisplay() {
        if (!this.currentStatus) return;

        // Update any elements with viral status classes
        const statusElements = document.querySelectorAll('.viral-status-display');
        statusElements.forEach(element => {
            viralStatusSystem.applyStatusEffects(element, this.currentStatus, this.currentStyle);
        });

        // Trigger status update callback
        if (this.onStatusUpdate) {
            this.onStatusUpdate(this.currentStatus, this.currentStyle);
        }
    }

    /**
     * Show style selector for Silver/Gold users
     */
    showStyleSelector() {
        if (!this.currentStatus || this.currentStatus.tier === 'bronze') return;

        styleSelector.showStyleSelector(
            this.currentStatus.tier,
            this.currentStyle,
            (selectedStyle) => {
                this.currentStyle = selectedStyle;
                this.saveUserData();
                this.updateStatusDisplay();
            }
        );
    }

    /**
     * Get status info for display
     */
    getStatusInfo() {
        if (!this.currentStatus) {
            return {
                tier: 'none',
                name: 'Newcomer',
                referralCount: 0,
                nextTier: 'bronze',
                referralsNeeded: 1
            };
        }

        const tierNames = {
            bronze: 'Bronze',
            silver: 'Silver',
            gold: 'Gold'
        };

        const nextTiers = {
            bronze: 'silver',
            silver: 'gold',
            gold: null
        };

        const referralsNeeded = {
            bronze: 6 - this.referralCount,
            silver: 31 - this.referralCount,
            gold: 0
        };

        return {
            tier: this.currentStatus.tier,
            name: tierNames[this.currentStatus.tier],
            referralCount: this.referralCount,
            nextTier: nextTiers[this.currentStatus.tier],
            referralsNeeded: Math.max(0, referralsNeeded[this.currentStatus.tier])
        };
    }

    /**
     * Show referral success message
     */
    showReferralSuccess() {
        const notification = document.createElement('div');
        notification.className = 'referral-success-notification';
        notification.innerHTML = `
            <div class="referral-success-content">
                <div class="referral-icon">🎯</div>
                <div class="referral-text">
                    <h3>Challenge Accepted!</h3>
                    <p>You've joined the competition</p>
                </div>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #00d4ff;
            border-radius: 12px;
            padding: 20px;
            color: white;
            z-index: 1000;
            animation: slideInRight 0.5s ease-out;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    /**
     * Create status display element
     */
    createStatusDisplay() {
        const statusInfo = this.getStatusInfo();
        const element = document.createElement('div');
        element.className = `viral-status-display viral-${statusInfo.tier}`;
        element.innerHTML = `
            <div class="status-info">
                <div class="status-name">${statusInfo.name}</div>
                <div class="status-count">${statusInfo.referralCount} referrals</div>
                ${statusInfo.nextTier ? 
                    `<div class="status-progress">${statusInfo.referralsNeeded} more to ${statusInfo.nextTier}</div>` : 
                    '<div class="status-progress">Maximum status reached!</div>'
                }
            </div>
        `;

        // Apply effects
        viralStatusSystem.applyStatusEffects(element, this.currentStatus, this.currentStyle);

        return element;
    }

    /**
     * Get challenge link display HTML
     */
    getChallengeLinksHTML(score) {
        const links = this.generateChallengeLinks(score);
        
        return `
            <div class="challenge-links">
                <h3>Share Your Challenge</h3>
                <div class="link-options">
                    <div class="link-option">
                        <label>Easy Challenge</label>
                        <div class="link-input">
                            <input type="text" value="${links.easy}" readonly>
                            <button class="copy-btn" data-link="${links.easy}">Copy</button>
                        </div>
                    </div>
                    <div class="link-option">
                        <label>Medium Challenge</label>
                        <div class="link-input">
                            <input type="text" value="${links.medium}" readonly>
                            <button class="copy-btn" data-link="${links.medium}">Copy</button>
                        </div>
                    </div>
                    <div class="link-option">
                        <label>Hard Challenge</label>
                        <div class="link-input">
                            <input type="text" value="${links.hard}" readonly>
                            <button class="copy-btn" data-link="${links.hard}">Copy</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Add copy functionality to challenge links
     */
    addCopyFunctionality(container) {
        const copyButtons = container.querySelectorAll('.copy-btn');
        copyButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const link = button.dataset.link;
                try {
                    await navigator.clipboard.writeText(link);
                    button.textContent = 'Copied!';
                    button.style.background = '#00ff88';
                    setTimeout(() => {
                        button.textContent = 'Copy';
                        button.style.background = '';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy link:', err);
                }
            });
        });
    }
}

// Export singleton instance
export const referralTracker = new ReferralTracker(); 