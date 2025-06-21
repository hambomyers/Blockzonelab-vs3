// shared/platform/systems/UniversalPayments.js
/**
 * Universal Payment System
 * Handles USDC, QUARTERS, free credits, and tournament payments
 */

export class UniversalPayments {
  constructor(config = {}) {
    this.config = {
      enableUSDC: true,
      enableQuarters: true,
      enableFreeCredits: true,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
    
    this.isInitialized = false;
    this.eventListeners = new Map();
    this.pendingTransactions = new Map();
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.processPayment = this.processPayment.bind(this);
    this.refundPayment = this.refundPayment.bind(this);
  }

  /**
   * Initialize payment system
   */
  async initialize() {
    try {
      console.log('💳 Initializing Universal Payment System...');
      
      // Initialize payment providers
      if (this.config.enableUSDC) {
        await this.initializeUSDC();
      }
      
      if (this.config.enableQuarters) {
        await this.initializeQuarters();
      }
      
      this.isInitialized = true;
      this.emit('initialized');
      
      console.log('✅ Universal Payment System ready');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize payment system:', error);
      throw new Error(`Payment initialization failed: ${error.message}`);
    }
  }

  /**
   * Process a payment
   */
  async processPayment(paymentData) {
    try {
      const {
        amount,
        currency,
        playerId,
        description,
        metadata = {}
      } = paymentData;

      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`💰 Processing ${currency} payment:`, amount);
      
      // Validate payment data
      this.validatePaymentData(paymentData);
      
      // Generate transaction ID
      const transactionId = this.generateTransactionId();
      
      // Store pending transaction
      this.pendingTransactions.set(transactionId, {
        ...paymentData,
        id: transactionId,
        status: 'pending',
        createdAt: Date.now()
      });
      
      let result;
      
      switch (currency.toLowerCase()) {
        case 'usdc':
          result = await this.processUSDCPayment(paymentData, transactionId);
          break;
        case 'quarters':
          result = await this.processQuartersPayment(paymentData, transactionId);
          break;
        case 'free':
          result = await this.processFreeCredits(paymentData, transactionId);
          break;
        default:
          throw new Error(`Unsupported currency: ${currency}`);
      }
      
      // Update transaction status
      const transaction = this.pendingTransactions.get(transactionId);
      transaction.status = 'completed';
      transaction.completedAt = Date.now();
      transaction.result = result;
      
      this.emit('paymentCompleted', transaction);
      console.log('✅ Payment completed:', transactionId);
      
      return transaction;
    } catch (error) {
      console.error('❌ Payment failed:', error);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Process USDC payment
   */
  async processUSDCPayment(paymentData, transactionId) {
    try {
      const { amount, walletAddress } = paymentData;
      
      // Simulate USDC transaction processing
      console.log(`🔗 Processing USDC payment: ${amount} USDC`);
      
      // In real implementation, this would interact with Sonic blockchain
      await this.delay(2000); // Simulate network delay
      
      const txHash = this.generateTransactionHash();
      
      return {
        success: true,
        transactionHash: txHash,
        currency: 'USDC',
        amount,
        network: 'Sonic',
        walletAddress
      };
    } catch (error) {
      throw new Error(`USDC payment failed: ${error.message}`);
    }
  }

  /**
   * Process QUARTERS payment
   */
  async processQuartersPayment(paymentData, transactionId) {
    try {
      const { amount, walletAddress } = paymentData;
      
      console.log(`🪙 Processing QUARTERS payment: ${amount} QUARTERS`);
      
      // Simulate QUARTERS transaction processing
      await this.delay(1500);
      
      const txHash = this.generateTransactionHash();
      
      return {
        success: true,
        transactionHash: txHash,
        currency: 'QUARTERS',
        amount,
        network: 'Ethereum',
        walletAddress
      };
    } catch (error) {
      throw new Error(`QUARTERS payment failed: ${error.message}`);
    }
  }

  /**
   * Process free credits
   */
  async processFreeCredits(paymentData, transactionId) {
    try {
      const { amount, playerId } = paymentData;
      
      console.log(`🎁 Processing free credits: ${amount} credits`);
      
      // Update player's free credit balance
      const creditBalance = await this.getFreeCreditsBalance(playerId);
      const newBalance = creditBalance + amount;
      
      await this.setFreeCreditsBalance(playerId, newBalance);
      
      return {
        success: true,
        currency: 'FREE_CREDITS',
        amount,
        newBalance,
        playerId
      };
    } catch (error) {
      throw new Error(`Free credits processing failed: ${error.message}`);
    }
  }

  /**
   * Get player's balance for specific currency
   */
  async getBalance(playerId, currency) {
    try {
      switch (currency.toLowerCase()) {
        case 'usdc':
          return await this.getUSDCBalance(playerId);
        case 'quarters':
          return await this.getQuartersBalance(playerId);
        case 'free':
          return await this.getFreeCreditsBalance(playerId);
        default:
          throw new Error(`Unknown currency: ${currency}`);
      }
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      return 0;
    }
  }

  /**
   * Handle tournament entry payment
   */
  async handleTournamentEntry(playerId, tournamentId, entryFee, currency = 'usdc') {
    try {
      console.log(`🏆 Processing tournament entry: ${entryFee} ${currency}`);
      
      const paymentData = {
        amount: entryFee,
        currency,
        playerId,
        description: `Tournament entry: ${tournamentId}`,
        metadata: {
          type: 'tournament_entry',
          tournamentId
        }
      };
      
      const transaction = await this.processPayment(paymentData);
      
      this.emit('tournamentEntryProcessed', {
        playerId,
        tournamentId,
        transaction
      });
      
      return transaction;
    } catch (error) {
      throw new Error(`Tournament entry payment failed: ${error.message}`);
    }
  }

  /**
   * Distribute tournament prize
   */
  async distributeTournamentPrize(playerId, amount, currency, tournamentId) {
    try {
      console.log(`🏆 Distributing prize: ${amount} ${currency} to ${playerId}`);
      
      // For now, add to free credits (in production, would send to wallet)
      if (currency.toLowerCase() === 'usdc') {
        await this.addFreeCredits(playerId, amount);
      }
      
      this.emit('prizeDistributed', {
        playerId,
        amount,
        currency,
        tournamentId
      });
      
      return true;
    } catch (error) {
      throw new Error(`Prize distribution failed: ${error.message}`);
    }
  }

  /**
   * Add free credits to player
   */
  async addFreeCredits(playerId, amount) {
    try {
      const currentBalance = await this.getFreeCreditsBalance(playerId);
      const newBalance = currentBalance + amount;
      await this.setFreeCreditsBalance(playerId, newBalance);
      
      this.emit('freeCreditsAdded', {
        playerId,
        amount,
        newBalance
      });
      
      return newBalance;
    } catch (error) {
      throw new Error(`Failed to add free credits: ${error.message}`);
    }
  }

  /**
   * Get free credits balance
   */
  async getFreeCreditsBalance(playerId) {
    try {
      const key = `credits_${playerId}`;
      const balance = localStorage.getItem(key);
      return balance ? parseFloat(balance) : 0;
    } catch (error) {
      console.warn('Failed to get free credits balance:', error);
      return 0;
    }
  }

  /**
   * Set free credits balance
   */
  async setFreeCreditsBalance(playerId, balance) {
    try {
      const key = `credits_${playerId}`;
      localStorage.setItem(key, balance.toString());
    } catch (error) {
      console.warn('Failed to set free credits balance:', error);
    }
  }

  /**
   * Validate payment data
   */
  validatePaymentData(paymentData) {
    const { amount, currency, playerId } = paymentData;
    
    if (!amount || amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    
    if (!currency) {
      throw new Error('Currency is required');
    }
    
    if (!playerId) {
      throw new Error('Player ID is required');
    }
    
    const validCurrencies = ['usdc', 'quarters', 'free'];
    if (!validCurrencies.includes(currency.toLowerCase())) {
      throw new Error(`Invalid currency: ${currency}`);
    }
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `tx_${timestamp}_${random}`;
  }

  /**
   * Generate mock transaction hash
   */
  generateTransactionHash() {
    return '0x' + Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * Initialize USDC provider
   */
  async initializeUSDC() {
    console.log('🔗 Initializing USDC provider...');
    // In production, initialize Sonic blockchain connection
  }

  /**
   * Initialize QUARTERS provider
   */
  async initializeQuarters() {
    console.log('🪙 Initializing QUARTERS provider...');
    // In production, initialize QUARTERS token contract
  }

  /**
   * Get USDC balance (mock)
   */
  async getUSDCBalance(playerId) {
    // In production, query blockchain
    return 0;
  }

  /**
   * Get QUARTERS balance (mock)
   */
  async getQuartersBalance(playerId) {
    // In production, query token contract
    return 0;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Event emitter methods
   */
  emit(event, data) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in payment event listener for ${event}:`, error);
      }
    });
  }

  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(listener);
  }

  off(event, listener) {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
}