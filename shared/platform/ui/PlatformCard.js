/**
 * PlatformCard.js - Universal Platform UI Component
 * Updated with standardized imports
 */

// Standardized imports using path constants
import { UTILS_PATHS, PLATFORM_PATHS } from '../../utils/ImportPaths.js';
import EventEmitter from '../../utils/EventEmitter.js';
import gameRegistry from '../core/GameRegistry.js';
import platformConfig from '../core/PlatformConfig.js';
import universalIdentity from '../systems/UniversalIdentity.js';
import universalPayments from '../systems/UniversalPayments.js';

class PlatformCard extends EventEmitter {
    constructor(gameId, container) {
        super();
        this.gameId = gameId;
        this.container = container;
        this.game = gameRegistry.getGame(gameId);
        this.isInitialized = false;
        this.components = new Map();
        
        if (!this.game) {
            throw new Error(`Game not found in registry: ${gameId}`);
        }
        
        this.init();
    }

    async init() {
        try {
            await this.waitForPlatformSystems();
            this.setupEventListeners();
            this.render();
            this.isInitialized = true;
            this.emit('platform-card:ready');
            console.log(`✅ PlatformCard initialized for ${this.game.name}`);
        } catch (error) {
            console.error('❌ PlatformCard init failed:', error);
        }
    }

    async waitForPlatformSystems() {
        // Wait for core systems to be ready
        const systems = [universalIdentity, universalPayments];
        
        for (const system of systems) {
            if (!system.isInitialized) {
                await new Promise(resolve => {
                    const checkReady = () => {
                        if (system.isInitialized) {
                            resolve();
                        } else {
                            setTimeout(checkReady, 100);
                        }
                    };
                    checkReady();
                });
            }
        }
    }

    setupEventListeners() {
        // Identity events
        universalIdentity.on('identity:wallet-connected', (data) => {
            this.onWalletConnected(data);
        });
        
        universalIdentity.on('identity:level-up', (data) => {
            this.onLevelUp(data);
        });
        
        universalIdentity.on('identity:achievement-unlocked', (data) => {
            this.onAchievementUnlocked(data);
        });

        // Payment events
        universalPayments.on('payments:success', (data) => {
            this.onPaymentSuccess(data);
        });
        
        universalPayments.on('payments:error', (data) => {
            this.onPaymentError(data);
        });
    }

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = this.getBaseTemplate();
        this.attachEventHandlers();
        this.updateUI();
    }

    getBaseTemplate() {
        const player = universalIdentity.getPlayerData();
        const isWalletConnected = universalIdentity.isWalletConnected();
        
        return `
            <div class="platform-card" data-game="${this.gameId}">
                <!-- Header Section -->
                <div class="platform-header">
                    <div class="game-info">
                        <h2 class="game-title">${this.game.name}</h2>
                        <span class="game-version">v${this.game.version}</span>
                    </div>
                    <div class="player-info">
                        <div class="player-level">
                            <span class="level-label">Level</span>
                            <span class="level-value">${player.level}</span>
                        </div>
                        <div class="player-xp">
                            <div class="xp-bar">
                                <div class="xp-fill" style="width: ${(player.experience % 100)}%"></div>
                            </div>
                            <span class="xp-text">${player.experience % 100}/100 XP</span>
                        </div>
                    </div>
                </div>
                
                <!-- Wallet Section -->
                <div class="wallet-section">
                    ${isWalletConnected ? this.getConnectedWalletTemplate() : this.getConnectWalletTemplate()}
                </div>
                
                <!-- Game-specific Content Area -->
                <div class="game-content" id="game-content-${this.gameId}">
                    <!-- This will be populated by the specific game card -->
                </div>
                
                <!-- Platform Actions -->
                <div class="platform-actions">
                    <button class="btn btn-secondary" id="view-profile">
                        👤 Profile
                    </button>
                    <button class="btn btn-secondary" id="view-achievements">
                        🏆 Achievements
                    </button>
                    ${this.game.features.includes('tournaments') ? `
                        <button class="btn btn-primary" id="join-tournament">
                            🎯 Tournament
                        </button>
                    ` : ''}
                </div>
                
                <!-- Status Messages -->
                <div class="status-messages" id="status-messages"></div>
            </div>
        `;
    }

    getConnectedWalletTemplate() {
        const address = universalIdentity.player.walletAddress;
        const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
        
        return `
            <div class="wallet-connected">
                <div class="wallet-info">
                    <span class="wallet-icon">🔗</span>
                    <span class="wallet-address">${shortAddress}</span>
                    <span class="wallet-status connected">Connected</span>
                </div>
                <div class="balances" id="wallet-balances">
                    <!-- Balances will be loaded dynamically -->
                </div>
            </div>
        `;
    }

    getConnectWalletTemplate() {
        return `
            <div class="wallet-disconnected">
                <button class="btn btn-connect" id="connect-wallet">
                    🔗 Connect Wallet
                </button>
                <p class="wallet-help">Connect your wallet to play tournaments and earn rewards</p>
            </div>
        `;
    }

    attachEventHandlers() {
        // Wallet connection
        const connectBtn = this.container.querySelector('#connect-wallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }
        
        // Platform actions
        this.container.querySelector('#view-profile')?.addEventListener('click', () => {
            this.showProfile();
        });
        
        this.container.querySelector('#view-achievements')?.addEventListener('click', () => {
            this.showAchievements();
        });
        
        this.container.querySelector('#join-tournament')?.addEventListener('click', () => {
            this.joinTournament();
        });
    }

    async connectWallet() {
        try {
            // This would integrate with the existing wallet connection logic
            if (window.connectWallet) {
                const address = await window.connectWallet();
                await universalIdentity.connectWallet(address);
            } else {
                throw new Error('Wallet connection not available');
            }
        } catch (error) {
            this.showStatus('❌ Failed to connect wallet', 'error');
            console.error('Wallet connection failed:', error);
        }
    }

    async joinTournament() {
        try {
            await universalPayments.payForTournamentEntry(this.gameId);
            this.showStatus('✅ Joined tournament!', 'success');
            this.emit('platform-card:tournament-joined');
        } catch (error) {
            this.showStatus('❌ Failed to join tournament', 'error');
            console.error('Tournament join failed:', error);
        }
    }

    showProfile() {
        const player = universalIdentity.getPlayerData();
        const modal = this.createModal('Player Profile', this.getProfileTemplate(player));
        this.showModal(modal);
    }

    showAchievements() {
        const achievements = universalIdentity.getPlayerData().achievements;
        const modal = this.createModal('Achievements', this.getAchievementsTemplate(achievements));
        this.showModal(modal);
    }

    getProfileTemplate(player) {
        return `
            <div class="profile-content">
                <div class="profile-header">
                    <h3>${player.name || 'Anonymous Player'}</h3>
                    <p class="player-id">ID: ${player.id}</p>
                </div>
                <div class="profile-stats">
                    <div class="stat">
                        <label>Level:</label>
                        <span>${player.level}</span>
                    </div>
                    <div class="stat">
                        <label>Experience:</label>
                        <span>${player.experience} XP</span>
                    </div>
                    <div class="stat">
                        <label>Games Played:</label>
                        <span>${player.totalGamesPlayed}</span>
                    </div>
                    <div class="stat">
                        <label>Member Since:</label>
                        <span>${new Date(player.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    getAchievementsTemplate(achievements) {
        if (!achievements.length) {
            return '<p>No achievements unlocked yet. Keep playing to earn rewards!</p>';
        }
        
        return `
            <div class="achievements-list">
                ${achievements.map(achievement => `
                    <div class="achievement-item">
                        <span class="achievement-icon">🏆</span>
                        <div class="achievement-info">
                            <h4>${achievement.id}</h4>
                            ${achievement.gameId ? `<p>Game: ${achievement.gameId}</p>` : ''}
                            <small>Unlocked: ${new Date(achievement.unlockedAt).toLocaleDateString()}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createModal(title, content) {
        return `
            <div class="modal-overlay" id="platform-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
    }

    showModal(modalHTML) {
        const existing = document.getElementById('platform-modal');
        if (existing) existing.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('platform-modal');
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    showStatus(message, type = 'info') {
        const container = this.container.querySelector('#status-messages');
        if (!container) return;
        
        const statusEl = document.createElement('div');
        statusEl.className = `status-message ${type}`;
        statusEl.textContent = message;
        
        container.appendChild(statusEl);
        
        setTimeout(() => {
            statusEl.remove();
        }, 5000);
    }

    updateUI() {
        // Update wallet balances if connected
        if (universalIdentity.isWalletConnected()) {
            this.updateWalletBalances();
        }
    }

    async updateWalletBalances() {
        const balancesContainer = this.container.querySelector('#wallet-balances');
        if (!balancesContainer) return;
        
        const currencies = ['QUARTERS', 'USDC'];
        const balancePromises = currencies.map(async (currency) => {
            try {
                const balance = await universalPayments.getBalance(currency);
                return `<span class="balance">${balance} ${currency}</span>`;
            } catch (error) {
                return `<span class="balance error">-- ${currency}</span>`;
            }
        });
        
        const balances = await Promise.all(balancePromises);
        balancesContainer.innerHTML = balances.join('');
    }

    // Event handlers
    onWalletConnected(data) {
        this.render(); // Re-render to show connected state
        this.showStatus('✅ Wallet connected successfully!', 'success');
    }

    onLevelUp(data) {
        this.showStatus(`🎉 Level up! You are now level ${data.newLevel}!`, 'success');
        this.updateUI();
    }

    onAchievementUnlocked(data) {
        this.showStatus(`🏆 Achievement unlocked: ${data.achievementId}!`, 'success');
    }

    onPaymentSuccess(data) {
        this.showStatus(`✅ Payment successful: ${data.amount} ${data.currency}`, 'success');
        this.updateWalletBalances();
    }

    onPaymentError(data) {
        this.showStatus(`❌ Payment failed: ${data.error.message}`, 'error');
    }

    // Game-specific content methods (to be overridden)
    getGameContentContainer() {
        return this.container.querySelector(`#game-content-${this.gameId}`);
    }

    setGameContent(html) {
        const container = this.getGameContentContainer();
        if (container) {
            container.innerHTML = html;
        }
    }

    // Cleanup
    destroy() {
        this.removeAllListeners();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

export default PlatformCard;
