/**
 * UniversalPayments.js - Cross-Game Payment System
 * Unified payment interface supporting multiple payment methods across all games
 */

import EventEmitter from '../../../shared/utils/EventEmitter.js';
import platformConfig from '../../platform/PlatformConfig.js';

class UniversalPayments extends EventEmitter {
    constructor() {
        super();
        this.providers = new Map();
        this.activeProvider = null;
        this.isInitialized = false;
        this.balances = new Map();
        
        this.init();
    }

    async init() {
        try {
            await this.initializeProviders();
            this.loadBalances();
            this.isInitialized = true;
            this.emit('payments:ready');
            console.log('✅ UniversalPayments initialized');
        } catch (error) {
            console.error('❌ UniversalPayments init failed:', error);
        }
    }

    async initializeProviders() {
        // Wallet Provider (Web3/Sonic)
        this.providers.set('wallet', {
            name: 'Crypto Wallet',
            type: 'blockchain',
            available: false,
            methods: ['QUARTERS', 'USDC'],
            pay: this.payWithWallet.bind(this),
            getBalance: this.getWalletBalance.bind(this)
        });

        // Apple Pay Provider
        this.providers.set('apple-pay', {
            name: 'Apple Pay',
            type: 'fiat',
            available: this.isApplePayAvailable(),
            methods: ['USD'],
            pay: this.payWithApplePay.bind(this),
            getBalance: () => Promise.resolve(null) // Fiat doesn't have "balance"
        });

        // Mock Provider (for testing)
        this.providers.set('mock', {
            name: 'Mock Payment',
            type: 'test',
            available: platformConfig.isDevelopment(),
            methods: ['QUARTERS', 'USDC', 'USD'],
            pay: this.payWithMock.bind(this),
            getBalance: this.getMockBalance.bind(this)
        });

        // Check wallet availability
        if (window.ethereum || window.sonic) {
            this.providers.get('wallet').available = true;
        }

        console.log(`💳 Payment providers initialized: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    isApplePayAvailable() {
        return window.ApplePaySession && ApplePaySession.canMakePayments();
    }

    async setActiveProvider(providerId) {
        const provider = this.providers.get(providerId);
        if (!provider) {
            throw new Error(`Payment provider not found: ${providerId}`);
        }
        
        if (!provider.available) {
            throw new Error(`Payment provider not available: ${providerId}`);
        }

        this.activeProvider = provider;
        this.emit('payments:provider-changed', { providerId, provider });
        console.log(`💳 Active payment provider: ${provider.name}`);
        return true;
    }

    async pay(amount, currency, metadata = {}) {
        if (!this.activeProvider) {
            await this.setActiveProvider(this.getDefaultProvider());
        }

        if (!this.activeProvider.methods.includes(currency)) {
            throw new Error(`Currency ${currency} not supported by ${this.activeProvider.name}`);
        }

        const paymentRequest = {
            amount,
            currency,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString(),
                provider: this.activeProvider.name
            }
        };

        this.emit('payments:started', paymentRequest);

        try {
            const result = await this.activeProvider.pay(paymentRequest);
            this.emit('payments:success', { ...paymentRequest, result });
            await this.updateBalances();
            return result;
        } catch (error) {
            this.emit('payments:error', { ...paymentRequest, error });
            throw error;
        }
    }

    async payWithWallet(paymentRequest) {
        const { amount, currency } = paymentRequest;
        
        // This would integrate with the existing wallet systems
        // For now, we'll simulate the call to existing payment functions
        
        try {
            if (currency === 'QUARTERS') {
                // Call existing QUARTERS payment
                if (window.payWithQuarters) {
                    const result = await window.payWithQuarters(amount);
                    return { success: true, txHash: result.hash, method: 'QUARTERS' };
                }
            } else if (currency === 'USDC') {
                // Call existing USDC payment
                if (window.payWithUSDC) {
                    const result = await window.payWithUSDC(amount);
                    return { success: true, txHash: result.hash, method: 'USDC' };
                }
            }
            
            throw new Error(`Wallet payment not implemented for ${currency}`);
        } catch (error) {
            console.error('Wallet payment failed:', error);
            throw error;
        }
    }

    async payWithApplePay(paymentRequest) {
        const { amount, currency, metadata } = paymentRequest;
        
        // Convert to USD if needed
        const usdAmount = currency === 'USD' ? amount : await this.convertToUSD(amount, currency);
        
        try {
            const result = await this.processApplePayment(usdAmount, metadata);
            
            // If payment was for crypto, credit the appropriate token
            if (currency !== 'USD') {
                await this.creditPurchasedTokens(amount, currency, result.transactionId);
            }
            
            return { success: true, transactionId: result.transactionId, method: 'ApplePay' };
        } catch (error) {
            console.error('Apple Pay failed:', error);
            throw error;
        }
    }

    async payWithMock(paymentRequest) {
        const { amount, currency } = paymentRequest;
        
        // Simulate payment delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate 90% success rate
        if (Math.random() > 0.9) {
            throw new Error('Mock payment failed (simulated)');
        }
        
        const mockTxId = 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Update mock balances
        this.updateMockBalance(currency, -amount);
        
        return { 
            success: true, 
            txHash: mockTxId, 
            method: 'Mock',
            timestamp: new Date().toISOString()
        };
    }

    async processApplePayment(amount, metadata) {
        // This would integrate with Apple Pay Web APIs
        // For now, return a mock response
        return {
            transactionId: 'apple_' + Date.now(),
            amount,
            currency: 'USD',
            status: 'completed'
        };
    }

    async convertToUSD(amount, fromCurrency) {
        // This would call a price API
        // For now, use mock conversion rates
        const rates = {
            'QUARTERS': 0.01, // 1 QUARTER = $0.01
            'USDC': 1.00      // 1 USDC = $1.00
        };
        
        return amount * (rates[fromCurrency] || 1);
    }

    async creditPurchasedTokens(amount, currency, transactionId) {
        // This would call smart contracts to credit tokens
        console.log(`💰 Crediting ${amount} ${currency} for transaction ${transactionId}`);
    }

    async getBalance(currency) {
        if (!this.activeProvider) {
            return 0;
        }
        
        return await this.activeProvider.getBalance(currency);
    }

    async getWalletBalance(currency) {
        try {
            const tokenConfig = platformConfig.getTokenConfig(currency);
            if (!tokenConfig) return 0;
            
            // This would call the actual wallet balance check
            // For now, return cached balance or 0
            return this.balances.get(`wallet:${currency}`) || 0;
        } catch (error) {
            console.error(`Failed to get wallet balance for ${currency}:`, error);
            return 0;
        }
    }

    getMockBalance(currency) {
        return this.balances.get(`mock:${currency}`) || 1000; // Start with 1000 of each
    }

    updateMockBalance(currency, change) {
        const key = `mock:${currency}`;
        const current = this.balances.get(key) || 1000;
        this.balances.set(key, Math.max(0, current + change));
    }

    async updateBalances() {
        if (!this.activeProvider) return;
        
        for (const currency of this.activeProvider.methods) {
            try {
                const balance = await this.activeProvider.getBalance(currency);
                const key = `${this.getActiveProviderId()}:${currency}`;
                this.balances.set(key, balance);
            } catch (error) {
                console.warn(`Failed to update balance for ${currency}:`, error);
            }
        }
        
        this.emit('payments:balances-updated', Object.fromEntries(this.balances));
    }

    loadBalances() {
        try {
            const saved = localStorage.getItem('blockzone:payment:balances');
            if (saved) {
                const balancesArray = JSON.parse(saved);
                this.balances = new Map(balancesArray);
            }
        } catch (error) {
            console.warn('Could not load saved balances:', error);
        }
    }

    async saveBalances() {
        try {
            localStorage.setItem('blockzone:payment:balances', JSON.stringify([...this.balances]));
        } catch (error) {
            console.error('Failed to save balances:', error);
        }
    }

    getAvailableProviders() {
        return Array.from(this.providers.entries())
            .filter(([_, provider]) => provider.available)
            .map(([id, provider]) => ({ id, ...provider }));
    }

    getActiveProviderId() {
        return Array.from(this.providers.entries())
            .find(([_, provider]) => provider === this.activeProvider)?.[0] || null;
    }

    getDefaultProvider() {
        const preferred = platformConfig.get('payments.defaultMethod');
        if (this.providers.get(preferred)?.available) {
            return preferred;
        }
        
        // Fallback priority: wallet > apple-pay > mock
        const priorities = ['wallet', 'apple-pay', 'mock'];
        for (const providerId of priorities) {
            if (this.providers.get(providerId)?.available) {
                return providerId;
            }
        }
        
        throw new Error('No payment providers available');
    }

    // Convenience methods
    async payForTournamentEntry(gameId) {
        const tournamentConfig = platformConfig.getTournamentConfig();
        return await this.pay(tournamentConfig.entryFee, 'QUARTERS', { 
            type: 'tournament-entry',
            gameId 
        });
    }

    async payForPowerup(powerupId, cost, currency = 'QUARTERS') {
        return await this.pay(cost, currency, { 
            type: 'powerup',
            powerupId 
        });
    }
}

// Export singleton instance
const universalPayments = new UniversalPayments();
export default universalPayments;
