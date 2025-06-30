/**
 * 🎮 BlockZone Lab - Friendly Wallet Detection
 * Handles multiple wallet extensions gracefully with a warm user experience
 */

class WalletDetector {
    constructor() {
        this.detectedWallets = [];
        this.preferredWallet = null;
        this.warningShown = false;
    }

    /**
     * Detect all available wallet extensions
     */
    detectWallets() {
        const wallets = [];

        // Check for MetaMask
        if (window.ethereum && window.ethereum.isMetaMask) {
            wallets.push({
                name: 'MetaMask',
                provider: window.ethereum,
                icon: '🦊',
                description: 'Most popular crypto wallet'
            });
        }

        // Check for Rabby
        if (window.ethereum && window.ethereum.isRabby) {
            wallets.push({
                name: 'Rabby',
                provider: window.ethereum,
                icon: '🐰',
                description: 'DeFi-focused wallet'
            });
        }

        // Check for Brave Wallet
        if (window.ethereum && window.ethereum.isBraveWallet) {
            wallets.push({
                name: 'Brave Wallet',
                provider: window.ethereum,
                icon: '🦁',
                description: 'Built into Brave browser'
            });
        }

        // Check for Coinbase Wallet
        if (window.ethereum && window.ethereum.isCoinbaseWallet) {
            wallets.push({
                name: 'Coinbase Wallet',
                provider: window.ethereum,
                icon: '🪙',
                description: 'Exchange wallet'
            });
        }

        // Check for multiple providers (newer MetaMask versions)
        if (window.ethereum && window.ethereum.providers) {
            window.ethereum.providers.forEach(provider => {
                if (provider.isMetaMask && !wallets.find(w => w.name === 'MetaMask')) {
                    wallets.push({
                        name: 'MetaMask',
                        provider: provider,
                        icon: '🦊',
                        description: 'Most popular crypto wallet'
                    });
                }
            });
        }

        this.detectedWallets = wallets;
        return wallets;
    }

    /**
     * Show a friendly warning if multiple wallets are detected
     */
    showMultipleWalletWarning() {
        if (this.detectedWallets.length <= 1 || this.warningShown) {
            return;
        }

        this.warningShown = true;

        // Create a friendly notification
        const notification = document.createElement('div');
        notification.className = 'wallet-notification';
        notification.innerHTML = `
            <div class="wallet-notification-content">
                <div class="wallet-notification-header">
                    <span class="wallet-notification-icon">🎮</span>
                    <h3>Multiple Wallets Detected</h3>
                    <button class="wallet-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
                <p>We found ${this.detectedWallets.length} wallet extensions in your browser. 
                Don't worry - we'll use the first one we found (${this.detectedWallets[0].name}).</p>
                <div class="wallet-notification-tip">
                    <span class="tip-icon">💡</span>
                    <span class="tip-text">For the best experience, you can disable other wallet extensions temporarily.</span>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .wallet-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px;
                padding: 0;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                z-index: 10000;
                max-width: 350px;
                animation: slideIn 0.3s ease-out;
            }
            .wallet-notification-content {
                padding: 20px;
            }
            .wallet-notification-header {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
            }
            .wallet-notification-icon {
                font-size: 24px;
                margin-right: 12px;
            }
            .wallet-notification-header h3 {
                margin: 0;
                flex: 1;
                font-size: 16px;
                font-weight: 600;
            }
            .wallet-notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s;
            }
            .wallet-notification-close:hover {
                background: rgba(255,255,255,0.2);
            }
            .wallet-notification p {
                margin: 0 0 12px 0;
                font-size: 14px;
                line-height: 1.4;
                opacity: 0.9;
            }
            .wallet-notification-tip {
                display: flex;
                align-items: flex-start;
                background: rgba(255,255,255,0.1);
                padding: 12px;
                border-radius: 8px;
                font-size: 13px;
                line-height: 1.4;
            }
            .tip-icon {
                margin-right: 8px;
                font-size: 16px;
            }
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(notification);

        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 8000);
    }

    /**
     * Get the best available wallet provider
     */
    getBestProvider() {
        if (this.detectedWallets.length === 0) {
            return null;
        }

        // Prefer MetaMask if available
        const metamask = this.detectedWallets.find(w => w.name === 'MetaMask');
        if (metamask) {
            return metamask.provider;
        }

        // Otherwise return the first available
        return this.detectedWallets[0].provider;
    }

    /**
     * Initialize wallet detection
     */
    initialize() {
        const wallets = this.detectWallets();
        
        if (wallets.length > 1) {
            this.showMultipleWalletWarning();
        }

        return this.getBestProvider();
    }
}

// Create global instance
window.walletDetector = new WalletDetector(); 