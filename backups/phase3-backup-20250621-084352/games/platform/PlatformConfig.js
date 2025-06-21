/**
 * PlatformConfig.js - Global Platform Configuration System
 * Centralized configuration for all platform features
 */

class PlatformConfig {
    constructor() {
        this.config = {
            platform: {
                name: 'BlockZone Labs',
                version: '2.0.0',
                environment: this.detectEnvironment(),
                debug: this.isDebugMode()
            },
            
            blockchain: {
                network: 'sonic-testnet',
                chainId: 64165,
                rpcUrl: 'https://rpc.testnet.soniclabs.com',
                blockExplorer: 'https://testnet.sonicscan.org'
            },
            
            tokens: {
                QUARTERS: {
                    symbol: 'QUARTERS',
                    decimals: 18,
                    address: '0x1234...', // Will be set from sonic-config
                    isNative: false
                },
                USDC: {
                    symbol: 'USDC',
                    decimals: 6,
                    address: '0x5678...', // Will be set from sonic-config
                    isNative: false
                }
            },
            
            tournaments: {
                dailyReset: '00:00:00 UTC',
                entryFee: 10, // QUARTERS
                prizePool: {
                    first: 50,   // USDC cents
                    second: 30,  // USDC cents
                    third: 20    // USDC cents
                }
            },
            
            payments: {
                provider: 'universal',
                methods: ['wallet', 'apple-pay', 'mock'],
                defaultMethod: 'wallet'
            },
            
            ui: {
                theme: 'neon',
                animations: true,
                mobileOptimized: true,
                defaultCard: 'platform'
            },
            
            features: {
                analytics: true,
                tournaments: true,
                dailyRewards: true,
                crossGameIdentity: true,
                multiGameWallet: true
            }
        };
        
        this.loadExternalConfigs();
        console.log(`✅ PlatformConfig initialized (${this.config.platform.environment})`);
    }

    detectEnvironment() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'development';
        } else if (window.location.hostname.includes('staging')) {
            return 'staging';
        } else {
            return 'production';
        }
    }

    isDebugMode() {
        return this.detectEnvironment() === 'development' || 
               window.location.search.includes('debug=true');
    }

    async loadExternalConfigs() {
        try {
            // Load sonic configuration if available
            if (window.sonicConfig) {
                this.config.blockchain = { ...this.config.blockchain, ...window.sonicConfig };
            }
            
            // Load contract addresses from existing systems
            if (window.contractAddresses) {
                Object.keys(this.config.tokens).forEach(token => {
                    if (window.contractAddresses[token]) {
                        this.config.tokens[token].address = window.contractAddresses[token];
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️ Could not load external configs:', error);
        }
    }

    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.config);
    }

    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, this.config);
        target[lastKey] = value;
    }

    getGameConfig(gameId) {
        return this.get(`games.${gameId}`) || {};
    }

    setGameConfig(gameId, config) {
        this.set(`games.${gameId}`, config);
    }

    isFeatureEnabled(feature) {
        return this.get(`features.${feature}`) === true;
    }

    getBlockchainConfig() {
        return this.get('blockchain');
    }

    getTokenConfig(symbol) {
        return this.get(`tokens.${symbol}`);
    }

    getTournamentConfig() {
        return this.get('tournaments');
    }

    isDevelopment() {
        return this.config.platform.environment === 'development';
    }

    isProduction() {
        return this.config.platform.environment === 'production';
    }
}

// Export singleton instance
const platformConfig = new PlatformConfig();
export default platformConfig;
