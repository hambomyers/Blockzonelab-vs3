/**
 * BLOCKZONE LAB - Shared Web3 Integration
 *
 * This is the SINGLE entry point for all wallet and blockchain logic across the platform.
 *
 * - Use window.BlockZoneWeb3 for all wallet connection, blockchain, and onboarding flows.
 * - Internally, this module delegates to BlockchainBridge (core-systems/core/blockchain.js)
 *   and WalletOnboarding (core-systems/core/wallet-onboarding.js) for advanced features.
 * - All games and platform modules should use this interface for consistency and future-proofing.
 *
 * For AAA maintainability: Do NOT duplicate wallet/web3 logic elsewhere. Extend this module if needed.
 */
export class BlockZoneWeb3 {
    constructor() {
        this.isConnected = false;
        this.account = null;
        this.provider = null;
        this.signer = null;
        this.network = null;

        // Import blockchain bridge
        this.blockchain = null;
        this.wallet = null;

        this.init();
    }

    async init() {
        // Load configuration
        if (typeof window.SONIC_CONFIG === 'undefined') {
            console.warn('Sonic config not loaded. Loading fallback...');
            await this.loadSonicConfig();
        }

        // Check for existing connection
        this.checkExistingConnection();
    }

    async loadSonicConfig() {
        // Fallback if config script didn't load
        const script = document.createElement('script');
        script.src = '/core-systems/sonic-config.js';
        document.head.appendChild(script);

        return new Promise(resolve => {
            script.onload = resolve;
        });
    }

    async checkExistingConnection() {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });

                if (accounts.length > 0) {
                    await this.connect();
                }
            } catch (error) {
                console.warn('Could not check existing connection:', error);
            }
        }
    }

    async connect() {
        if (!window.ethereum) {
            throw new Error('Please install MetaMask or another Web3 wallet');
        }

        try {
            // Request connection
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            // Set up provider
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.account = accounts[0];

            // Check network
            const network = await this.provider.getNetwork();
            this.network = network;

            // Switch to Sonic if needed
            if (network.chainId !== 250 && network.chainId !== 4002) { // Sonic mainnet/testnet
                await this.switchToSonic('testnet');
            }

            // Load blockchain modules
            await this.loadBlockchainModules();

            this.isConnected = true;
            this.onConnect(this.account);

            return this.account;
        } catch (error) {
            console.error('Connection failed:', error);
            throw error;
        }
    }

    async loadBlockchainModules() {
        try {
            // Dynamically import blockchain bridge
            const { BlockchainBridge } = await import('/core-systems/core/blockchain.js');
            const { WalletOnboarding } = await import('/core-systems/core/wallet-onboarding.js');

            // Initialize with mock config for now
            const mockConfig = {
                get: (key) => {
                    const configs = {
                        'wallet.network': 'testnet',
                        'contracts.neonDrop': window.SONIC_CONFIG?.contracts?.testnet?.NEONDROP_GAME,
                        'contracts.leaderboard': window.SONIC_CONFIG?.contracts?.testnet?.LEADERBOARD
                    };
                    return configs[key];
                }
            };

            this.blockchain = new BlockchainBridge(mockConfig);
            this.wallet = new WalletOnboarding(mockConfig, this.blockchain);
        } catch (error) {
            console.warn('Could not load blockchain modules:', error);
        }
    }

    async switchToSonic(network = 'testnet') {
        if (window.switchToSonic) {
            await window.switchToSonic(network);
        } else {
            console.warn('Sonic network switch function not available');
        }
    }

    disconnect() {
        this.isConnected = false;
        this.account = null;
        this.provider = null;
        this.signer = null;
        this.onDisconnect();
    }

    // Event handlers (override in games)
    onConnect(account) {
        console.log('🎮 BlockZone Web3 Connected:', account);
        this.updateUI();
    }

    onDisconnect() {
        console.log('🎮 BlockZone Web3 Disconnected');
        this.updateUI();
    }

    updateUI() {
        // Update wallet connection status in UI
        const connectBtns = document.querySelectorAll('.wallet-connect-btn');
        const walletStatus = document.querySelectorAll('.wallet-status');

        connectBtns.forEach(btn => {
            if (this.isConnected) {
                btn.textContent = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
                btn.classList.add('connected');
            } else {
                btn.textContent = 'Connect Wallet';
                btn.classList.remove('connected');
            }
        });

        walletStatus.forEach(status => {
            status.textContent = this.isConnected ? 'Connected' : 'Disconnected';
            status.className = `wallet-status ${this.isConnected ? 'connected' : 'disconnected'}`;
        });
    }

    // Utility functions for games
    async getBalance() {
        if (!this.provider || !this.account) return 0;
        const balance = await this.provider.getBalance(this.account);
        return ethers.utils.formatEther(balance);
    }

    async submitScore(gameId, score, proof) {
        if (!this.blockchain) {
            console.warn('Blockchain not available - storing score locally');
            this.storeScoreLocally(gameId, score);
            return;
        }

        try {
            await this.blockchain.submitScore(gameId, score, proof);
        } catch (error) {
            console.error('Score submission failed:', error);
            this.storeScoreLocally(gameId, score);
        }
    }

    storeScoreLocally(gameId, score) {
        const scores = JSON.parse(localStorage.getItem('blockzone_scores') || '{}');
        if (!scores[gameId]) scores[gameId] = [];
        scores[gameId].push({ score, timestamp: Date.now() });
        localStorage.setItem('blockzone_scores', JSON.stringify(scores));
    }
}

// Create global instance
window.BlockZoneWeb3 = window.BlockZoneWeb3 || new BlockZoneWeb3();
