/**
 * UniversalPaymentSystem.js - Next-Generation Payment Integration
 * 
 * Four-tier payment system for maximum accessibility:
 * 1. Free Play - Ad-supported, daily limits
 * 2. Apple Pay - Seamless iOS/Mac purchases
 * 3. Quarters - Gaming token economy
 * 4. Sonic Labs - Crypto rewards and staking
 * 
 * Smart routing based on user tier and platform detection
 */

export class UniversalPaymentSystem {
    constructor(playerIdentity) {
        this.playerIdentity = playerIdentity;
        this.activeMethod = null;
        this.balance = {
            quarters: 0,
            sonic: 0,
            usd: 0
        };
        
        // Payment processors
        this.applePayProcessor = null;
        this.quartersProcessor = null;
        this.sonicLabsProcessor = null;
        
        // Backend integration
        this.paymentsAPI = 'https://blockzone-payments.hambomyers.workers.dev';
        
        console.log('💰 Universal Payment System initialized');
        this.initialize();
    }

    async initialize() {
        try {
            // Initialize based on current player tier
            const identity = await this.playerIdentity.getIdentity();
            
            // Platform detection
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isMac = /Macintosh/.test(navigator.userAgent);
            const supportsApplePay = isIOS || isMac;
            
            // Initialize available payment methods
            if (supportsApplePay && identity.tier !== 'anonymous') {
                await this.initializeApplePay();
            }
            
            if (identity.tier !== 'anonymous') {
                await this.initializeQuarters();
            }
            
            if (identity.tier === 'web3') {
                await this.initializeSonicLabs();
            }
            
            // Load balances
            await this.loadBalances();
            
            console.log('✅ Payment system ready');
            
        } catch (error) {
            console.error('❌ Payment system initialization failed:', error);
        }
    }

    /**
     * APPLE PAY INTEGRATION
     */
    async initializeApplePay() {
        if (!window.ApplePaySession) {
            console.log('🍎 Apple Pay not available on this device');
            return;
        }

        try {
            this.applePayProcessor = {
                canMakePayments: ApplePaySession.canMakePayments(),
                supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
                merchantCapabilities: ['supports3DS'],
                
                createSession: (amount, description) => {
                    const request = {
                        countryCode: 'US',
                        currencyCode: 'USD',
                        merchantCapabilities: ['supports3DS'],
                        supportedNetworks: ['visa', 'masterCard', 'amex'],
                        total: {
                            label: `BlockZone Lab - ${description}`,
                            amount: amount.toString()
                        }
                    };
                    
                    return new ApplePaySession(3, request);
                }
            };
            
            console.log('🍎 Apple Pay initialized successfully');
            
        } catch (error) {
            console.error('🍎 Apple Pay initialization failed:', error);
        }
    }

    /**
     * QUARTERS TOKEN SYSTEM
     */
    async initializeQuarters() {
        try {            this.quartersProcessor = {
                balance: 0,
                
                // TRUE ARCADE QUARTERS SYSTEM: 1 quarter = $0.25
                packages: [
                    { 
                        quarters: 1, 
                        price: 0.25, 
                        bonus: 0, 
                        popular: false,
                        description: "Single Quarter",
                        bestFor: "Try a daily challenge"
                    },
                    { 
                        quarters: 10, 
                        price: 2.50, 
                        bonus: 1, 
                        popular: true,
                        description: "Roll of Quarters",
                        bestFor: "1 tournament + bonus"
                    },
                    { 
                        quarters: 40, 
                        price: 10.00, 
                        bonus: 5, 
                        popular: false,
                        description: "Arcade Pack",
                        bestFor: "4 tournaments + bonus"
                    }
                ],
                
                // Game costs in TRUE QUARTERS (1 quarter = $0.25)
                costs: {
                    tournament_entry: 10,    // 10 quarters = $2.50
                    premium_game: 4,         // 4 quarters = $1.00 
                    daily_challenge: 1,      // 1 quarter = $0.25 (true arcade!)
                    cosmetic_item: 8,        // 8 quarters = $2.00
                    power_up: 2             // 2 quarters = $0.50
                }
            };
            
            console.log('🎯 Quarters system initialized');
            
        } catch (error) {
            console.error('🎯 Quarters initialization failed:', error);
        }
    }

    /**
     * SONIC LABS INTEGRATION
     */
    async initializeSonicLabs() {
        try {
            const identity = await this.playerIdentity.getIdentity();
            
            this.sonicLabsProcessor = {
                walletAddress: identity.walletAddress,
                network: 'testnet', // Switch to mainnet for production
                
                // Smart contract addresses
                contracts: {
                    QUARTERS: window.SONIC_CONFIG.contracts.testnet.QUARTERS,
                    NEONDROP_GAME: window.SONIC_CONFIG.contracts.testnet.NEONDROP_GAME,
                    STAKING: window.SONIC_CONFIG.contracts.testnet.STAKING
                },
                
                // Web3 provider
                provider: window.ethereum,
                
                // Reward structure
                rewards: {
                    daily_challenge_complete: 0.1, // S tokens
                    tournament_win: 1.0,
                    high_score: 0.5,
                    perfect_game: 2.0
                }
            };
            
            console.log('⚡ Sonic Labs integration initialized');
            
        } catch (error) {
            console.error('⚡ Sonic Labs initialization failed:', error);
        }
    }

    /**
     * PAYMENT PROCESSING METHODS
     */

    /**
     * Process payment with smart routing
     */
    async processPayment(item, options = {}) {
        const identity = await this.playerIdentity.getIdentity();
        const preferredMethod = options.method || this.getPreferredPaymentMethod();
        
        console.log(`💳 Processing payment for ${item.name} via ${preferredMethod}`);
        
        try {
            switch (preferredMethod) {
                case 'apple_pay':
                    return await this.processApplePayment(item);
                    
                case 'quarters':
                    return await this.processQuartersPayment(item);
                    
                case 'sonic_labs':
                    return await this.processSonicPayment(item);
                    
                case 'free':
                    return await this.processFreeAccess(item);
                    
                default:
                    throw new Error(`Unsupported payment method: ${preferredMethod}`);
            }
            
        } catch (error) {
            console.error('❌ Payment processing failed:', error);
            
            // Try fallback method
            if (options.allowFallback !== false) {
                const fallbackMethod = this.getFallbackPaymentMethod(preferredMethod);
                if (fallbackMethod) {
                    return await this.processPayment(item, { 
                        method: fallbackMethod, 
                        allowFallback: false 
                    });
                }
            }
            
            throw error;
        }
    }

    /**
     * Apple Pay processing
     */
    async processApplePayment(item) {
        if (!this.applePayProcessor) {
            throw new Error('Apple Pay not available');
        }

        return new Promise((resolve, reject) => {
            const session = this.applePayProcessor.createSession(item.price, item.name);
            
            session.onvalidatemerchant = async (event) => {
                try {
                    // Validate with our backend
                    const response = await fetch(`${this.paymentsAPI}/apple_pay/validate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            validationURL: event.validationURL,
                            domainName: window.location.hostname
                        })
                    });
                    
                    const merchantSession = await response.json();
                    session.completeMerchantValidation(merchantSession);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            session.onpaymentauthorized = async (event) => {
                try {
                    // Process payment with backend
                    const response = await fetch(`${this.paymentsAPI}/apple_pay/process`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            payment: event.payment,
                            item: item,
                            playerId: (await this.playerIdentity.getIdentity()).playerId
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        session.completePayment(ApplePaySession.STATUS_SUCCESS);
                        resolve(result);
                    } else {
                        session.completePayment(ApplePaySession.STATUS_FAILURE);
                        reject(new Error(result.error));
                    }
                    
                } catch (error) {
                    session.completePayment(ApplePaySession.STATUS_FAILURE);
                    reject(error);
                }
            };
            
            session.oncancel = () => {
                reject(new Error('Payment cancelled by user'));
            };
            
            session.begin();
        });
    }

    /**
     * Quarters token processing
     */
    async processQuartersPayment(item) {
        const quartersNeeded = item.quarters || item.price * 4; // TRUE ARCADE: $0.25 = 1 quarter
        
        if (this.balance.quarters < quartersNeeded) {
            throw new Error(`Insufficient quarters. Need ${quartersNeeded}, have ${this.balance.quarters}`);
        }
        
        try {
            // Process with backend
            const response = await fetch(`${this.paymentsAPI}/quarters/spend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: quartersNeeded,
                    item: item,
                    playerId: (await this.playerIdentity.getIdentity()).playerId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.balance.quarters -= quartersNeeded;
                return result;
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            throw new Error(`Quarters payment failed: ${error.message}`);
        }
    }

    /**
     * Sonic Labs crypto processing
     */
    async processSonicPayment(item) {
        if (!this.sonicLabsProcessor) {
            throw new Error('Sonic Labs not available');
        }
        
        try {
            // This would interact with smart contracts
            // For now, simulate the transaction
            
            const transaction = {
                to: this.sonicLabsProcessor.contracts.NEONDROP_GAME,
                value: item.sonic_price || 0,
                data: `0x${item.action}` // Encoded contract call
            };
            
            // Process transaction
            const result = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transaction]
            });
            
            return {
                success: true,
                transactionHash: result,
                network: 'sonic_labs'
            };
            
        } catch (error) {
            throw new Error(`Sonic Labs payment failed: ${error.message}`);
        }
    }

    /**
     * Free access processing (ads, daily limits)
     */
    async processFreeAccess(item) {
        const identity = await this.playerIdentity.getIdentity();
        
        // Check daily limits
        const today = new Date().toDateString();
        const dailyUsage = JSON.parse(localStorage.getItem(`free_usage_${today}`) || '{}');
        
        if (dailyUsage[item.type] >= (item.dailyLimit || 3)) {
            throw new Error('Daily free limit reached');
        }
        
        // Track usage
        dailyUsage[item.type] = (dailyUsage[item.type] || 0) + 1;
        localStorage.setItem(`free_usage_${today}`, JSON.stringify(dailyUsage));
        
        return {
            success: true,
            method: 'free',
            remainingToday: (item.dailyLimit || 3) - dailyUsage[item.type]
        };
    }

    /**
     * BALANCE MANAGEMENT
     */

    async loadBalances() {
        try {
            const identity = await this.playerIdentity.getIdentity();
            
            if (identity.tier === 'anonymous') {
                this.balance = { quarters: 0, sonic: 0, usd: 0 };
                return;
            }
            
            // Load from backend
            const response = await fetch(`${this.paymentsAPI}/balances/${identity.playerId}`);
            const balances = await response.json();
            
            this.balance = {
                quarters: balances.quarters || 0,
                sonic: balances.sonic || 0,
                usd: balances.usd || 0
            };
            
            console.log('💰 Balances loaded:', this.balance);
            
        } catch (error) {
            console.error('❌ Failed to load balances:', error);
            this.balance = { quarters: 0, sonic: 0, usd: 0 };
        }
    }

    /**
     * Purchase quarters with Apple Pay
     */
    async purchaseQuarters(packageIndex) {
        const package_ = this.quartersProcessor.packages[packageIndex];
        if (!package_) {
            throw new Error('Invalid quarters package');
        }
        
        const item = {
            name: `${package_.quarters + package_.bonus} Quarters`,
            price: package_.price,
            type: 'quarters_package',
            quarters: package_.quarters + package_.bonus
        };
        
        const result = await this.processApplePayment(item);
        
        if (result.success) {
            this.balance.quarters += item.quarters;
            console.log(`✅ Purchased ${item.quarters} quarters`);
        }
        
        return result;
    }

    /**
     * UTILITY METHODS
     */

    getPreferredPaymentMethod() {
        const identity = this.playerIdentity.currentTier;
        const isAppleDevice = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
        
        if (identity === 'web3') return 'sonic_labs';
        if (identity === 'social' && isAppleDevice) return 'apple_pay';
        if (identity === 'social') return 'quarters';
        return 'free';
    }

    getFallbackPaymentMethod(failedMethod) {
        const fallbacks = {
            'apple_pay': 'quarters',
            'quarters': 'apple_pay',
            'sonic_labs': 'quarters',
            'free': null
        };
        
        return fallbacks[failedMethod];
    }

    getAvailablePaymentMethods() {
        const methods = [];
        
        if (this.applePayProcessor) methods.push('apple_pay');
        if (this.quartersProcessor) methods.push('quarters');
        if (this.sonicLabsProcessor) methods.push('sonic_labs');
        methods.push('free');
        
        return methods;
    }

    /**
     * Get balance for display
     */
    getBalance(currency = 'quarters') {
        return this.balance[currency] || 0;
    }

    /**
     * Check if user can afford an item
     */
    canAfford(item, method = null) {
        const paymentMethod = method || this.getPreferredPaymentMethod();
        
        switch (paymentMethod) {
            case 'quarters':
                return this.balance.quarters >= (item.quarters || item.price * 4);
            case 'sonic_labs':
                return this.balance.sonic >= (item.sonic_price || 0);
            case 'free':
                return this.checkDailyLimit(item);
            default:
                return true; // Apple Pay handled by system
        }
    }

    checkDailyLimit(item) {
        const today = new Date().toDateString();
        const dailyUsage = JSON.parse(localStorage.getItem(`free_usage_${today}`) || '{}');
        return (dailyUsage[item.type] || 0) < (item.dailyLimit || 3);
    }
}

// Export for use with UniversalPlayerIdentity
export default UniversalPaymentSystem;
