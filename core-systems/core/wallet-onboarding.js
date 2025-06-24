// INTERNAL MODULE: WalletOnboarding
// Used by BlockZoneWeb3 (shared/web3/blockzone-web3.js) for user-friendly wallet onboarding flows.
// Do NOT use directly in games or platform modules. Use window.BlockZoneWeb3 for all onboarding.

// WalletOnboarding.js - Friendly wallet creation flow
export class WalletOnboarding {
    constructor(config, blockchain) {
        this.config = config;
        this.blockchain = blockchain;
        this.steps = [
            {
                id: 'username',
                title: 'Choose Your Player Name',
                subtitle: 'This is how you\'ll appear on the leaderboard',
                icon: '🎮'
            },
            {
                id: 'creating',
                title: 'Creating Your Rewards Vault',
                subtitle: 'Where your earnings are stored',
                icon: '🏦',
                automated: true
            },
            {
                id: 'backup',
                title: 'Save Your Vault Key',
                subtitle: 'Like a password for your earnings - keep it safe!',
                icon: '🔑'
            },
            {
                id: 'success',
                title: 'Your Vault is Ready!',
                subtitle: 'Here\'s your first $0.31 in QUARTERS',
                icon: '💰'
            }
        ];
    }

    async start(earnedAmount) {
        return new Promise((resolve) => {
            this.showStep(0, earnedAmount, resolve);
        });
    }

    showStep(index, earnedAmount, onComplete) {
        const step = this.steps[index];
        const modal = this.createModal(step, earnedAmount);

        switch(step.id) {
            case 'username':
                this.handleUsernameStep(modal, () => {
                    this.showStep(index + 1, earnedAmount, onComplete);
                });
                break;

            case 'creating':
                this.handleCreatingStep(modal, () => {
                    this.showStep(index + 1, earnedAmount, onComplete);
                });
                break;

            case 'backup':
                this.handleBackupStep(modal, () => {
                    this.showStep(index + 1, earnedAmount, onComplete);
                });
                break;

            case 'success':
                this.handleSuccessStep(modal, earnedAmount, onComplete);
                break;
        }
    }

    createModal(step, earnedAmount) {
        const modal = document.createElement('div');
        modal.className = 'wallet-modal';
        modal.innerHTML = `
            <div class="wallet-modal-content">
                <div class="wallet-step-icon">${step.icon}</div>
                <h2>${step.title}</h2>
                <p>${step.subtitle}</p>
                <div class="wallet-step-content" id="step-content"></div>
                <div class="wallet-earnings-reminder">
                    You earned: <span class="earnings-amount">$${earnedAmount.toFixed(2)}</span>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    handleUsernameStep(modal, onNext) {
        const content = modal.querySelector('#step-content');
        content.innerHTML = `
            <input type="text"
                   id="username-input"
                   placeholder="Enter player name..."
                   maxlength="20"
                   autocomplete="off">
            <div class="username-available" id="username-status"></div>
            <button id="continue-btn" disabled>Continue</button>
            <div class="help-text">
                This name will show on the leaderboard when you win
            </div>
        `;

        const input = content.querySelector('#username-input');
        const button = content.querySelector('#continue-btn');
        const status = content.querySelector('#username-status');

        input.addEventListener('input', async (e) => {
            const username = e.target.value.trim();
            if (username.length >= 3) {
                // Check availability (mock for now)
                const available = await this.checkUsernameAvailable(username);
                if (available) {
                    status.textContent = '✓ Available';
                    status.className = 'username-available success';
                    button.disabled = false;
                } else {
                    status.textContent = '✗ Already taken';
                    status.className = 'username-available error';
                    button.disabled = true;
                }
            } else {
                status.textContent = '';
                button.disabled = true;
            }
        });

        button.addEventListener('click', () => {
            this.username = input.value.trim();
            modal.remove();
            onNext();
        });
    }

    handleCreatingStep(modal, onNext) {
        const content = modal.querySelector('#step-content');
        content.innerHTML = `
            <div class="vault-creation">
                <div class="loading-spinner"></div>
                <div class="creation-steps">
                    <div class="step-item active" id="step-1">
                        <span class="step-icon">🔐</span>
                        <span>Generating secure vault...</span>
                    </div>
                    <div class="step-item" id="step-2">
                        <span class="step-icon">🌐</span>
                        <span>Connecting to Sonic network...</span>
                    </div>
                    <div class="step-item" id="step-3">
                        <span class="step-icon">💰</span>
                        <span>Preparing your QUARTERS...</span>
                    </div>
                </div>
            </div>
        `;

        // Animated progress through steps
        const animateSteps = async () => {
            // Step 1: Generate wallet
            await this.delay(1000);
            this.wallet = await this.generateWallet();
            content.querySelector('#step-1').classList.add('complete');
            content.querySelector('#step-2').classList.add('active');

            // Step 2: Connect to network
            await this.delay(800);
            content.querySelector('#step-2').classList.add('complete');
            content.querySelector('#step-3').classList.add('active');

            // Step 3: Prepare account
            await this.delay(600);
            content.querySelector('#step-3').classList.add('complete');

            await this.delay(400);
            modal.remove();
            onNext();
        };

        animateSteps();
    }

    handleBackupStep(modal, onNext) {
        const content = modal.querySelector('#step-content');
        const maskedKey = this.wallet.privateKey.slice(0, 6) + '...' + this.wallet.privateKey.slice(-4);

        content.innerHTML = `
            <div class="vault-key-section">
                <div class="key-display">
                    <div class="key-label">Your Vault Key:</div>
                    <div class="key-value" id="key-value">${maskedKey}</div>
                    <button class="reveal-btn" id="reveal-btn">
                        <span class="eye-icon">👁</span> Show
                    </button>
                </div>

                <div class="key-actions">
                    <button class="action-btn" id="copy-btn">
                        <span>📋</span> Copy Key
                    </button>
                    <button class="action-btn" id="download-btn">
                        <span>💾</span> Download Backup
                    </button>
                </div>

                <div class="key-warning">
                    ⚠️ This is like the password to your earnings vault.
                    If you lose it, you lose access to your QUARTERS!
                </div>

                <label class="confirm-saved">
                    <input type="checkbox" id="confirm-checkbox">
                    I've saved my vault key safely
                </label>

                <button id="continue-btn" disabled>Continue to Vault</button>
            </div>
        `;

        const keyDisplay = content.querySelector('#key-value');
        const revealBtn = content.querySelector('#reveal-btn');
        const copyBtn = content.querySelector('#copy-btn');
        const downloadBtn = content.querySelector('#download-btn');
        const confirmCheckbox = content.querySelector('#confirm-checkbox');
        const continueBtn = content.querySelector('#continue-btn');

        let keyRevealed = false;

        revealBtn.addEventListener('click', () => {
            keyRevealed = !keyRevealed;
            keyDisplay.textContent = keyRevealed ? this.wallet.privateKey : maskedKey;
            revealBtn.innerHTML = keyRevealed ?
                '<span class="eye-icon">🙈</span> Hide' :
                '<span class="eye-icon">👁</span> Show';
        });

        copyBtn.addEventListener('click', async () => {
            await navigator.clipboard.writeText(this.wallet.privateKey);
            copyBtn.innerHTML = '<span>✓</span> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = '<span>📋</span> Copy Key';
            }, 2000);
        });

        downloadBtn.addEventListener('click', () => {
            this.downloadBackup();
            downloadBtn.innerHTML = '<span>✓</span> Downloaded!';
            setTimeout(() => {
                downloadBtn.innerHTML = '<span>💾</span> Download Backup';
            }, 2000);
        });

        confirmCheckbox.addEventListener('change', (e) => {
            continueBtn.disabled = !e.target.checked;
        });

        continueBtn.addEventListener('click', () => {
            // Save encrypted wallet to localStorage
            this.saveWallet();
            modal.remove();
            onNext();
        });
    }

    handleSuccessStep(modal, earnedAmount, onComplete) {
        const content = modal.querySelector('#step-content');
        content.innerHTML = `
            <div class="success-animation">
                <div class="quarters-drop">
                    ${this.createQuartersAnimation(earnedAmount)}
                </div>
                <div class="vault-graphic">🏦</div>
            </div>

            <div class="success-message">
                <p class="earnings-deposited">
                    $${earnedAmount.toFixed(2)} deposited into your vault!
                </p>
                <p class="vault-address">
                    Vault ID: ${this.wallet.address.slice(0, 6)}...${this.wallet.address.slice(-4)}
                </p>
            </div>

            <button id="play-again-btn" class="primary-btn">
                Play Again ($0.25)
            </button>

            <button id="practice-btn" class="secondary-btn">
                Practice Mode (Free)
            </button>
        `;

        // Animate quarters dropping
        setTimeout(() => {
            content.querySelector('.quarters-drop').classList.add('animate');
        }, 100);

        content.querySelector('#play-again-btn').addEventListener('click', () => {
            modal.remove();
            onComplete({ mode: 'competitive' });
        });

        content.querySelector('#practice-btn').addEventListener('click', () => {
            modal.remove();
            onComplete({ mode: 'practice' });
        });
    }

    // Helper methods
    async generateWallet() {
        // Create new wallet using ethers
        const wallet = window.ethers.Wallet.createRandom();
        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic.phrase
        };
    }

    saveWallet() {
        // Encrypt with simple password for now
        // In production, use proper encryption
        const encrypted = btoa(JSON.stringify({
            address: this.wallet.address,
            privateKey: this.wallet.privateKey,
            username: this.username,
            createdAt: Date.now()
        }));

        localStorage.setItem('neonDrop_vault', encrypted);
        this.config.set('wallet.address', this.wallet.address);
        this.config.set('wallet.connected', true);
        this.config.set('player.username', this.username);
    }

    downloadBackup() {
        const backupData = {
            game: 'Neon Drop',
            username: this.username,
            vaultAddress: this.wallet.address,
            vaultKey: this.wallet.privateKey,
            created: new Date().toISOString(),
            warning: 'Keep this file safe! Anyone with this key can access your vault.'
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)],
            { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NeonDrop_Vault_${this.username}_Backup.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    createQuartersAnimation(amount) {
        // Create visual quarters based on amount
        const quarterCount = Math.ceil(amount / 0.25);
        let html = '';
        for (let i = 0; i < Math.min(quarterCount, 10); i++) {
            html += `<div class="quarter-coin" style="animation-delay: ${i * 0.1}s">25¢</div>`;
        }
        return html;
    }

    async checkUsernameAvailable(username) {
        // Mock check - in production, check against blockchain
        await this.delay(300);
        const taken = ['admin', 'test', 'user', 'player1'];
        return !taken.includes(username.toLowerCase());
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
