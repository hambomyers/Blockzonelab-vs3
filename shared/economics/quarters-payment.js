/**
 * Quarters Token System for BlockZone Lab
 * Gaming-optimized microtransaction currency
 */

export class QuartersSystem {
  constructor() {
    this.balance = this.loadBalance();
    
    // TRUE ARCADE QUARTERS SYSTEM: 1 quarter = $0.25
    this.packages = [
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
    ];
    
    // Game costs in TRUE QUARTERS (1 quarter = $0.25)
    this.costs = {
      tournament_entry: 10,    // 10 quarters = $2.50 (matches current USDC price)
      premium_game: 4,         // 4 quarters = $1.00 
      daily_challenge: 1,      // 1 quarter = $0.25 (true arcade style!)
      cosmetic_unlock: 8,      // 8 quarters = $2.00
      power_up: 2,            // 2 quarters = $0.50
      extra_life: 3,          // 3 quarters = $0.75
      score_multiplier: 4     // 4 quarters = $1.00
    };
  }
  
  loadBalance() {
    return parseInt(localStorage.getItem('quarters_balance') || '0');
  }
  
  saveBalance() {
    localStorage.setItem('quarters_balance', this.balance.toString());
    this.dispatchBalanceUpdate();
  }
  
  async purchasePackage(packageIndex, paymentMethod = 'apple_pay') {
    const package_ = this.packages[packageIndex];
    if (!package_) throw new Error('Invalid package');
    
    try {
      let result;
      
      if (paymentMethod === 'apple_pay' && window.ApplePayIntegration?.isAvailable) {
        result = await window.ApplePayIntegration.processPayment(
          package_.price,
          `${package_.quarters + package_.bonus} Quarters`
        );
      } else {
        // Fallback to web payment
        result = await this.processWebPayment(package_);
      }
      
      if (result.success) {
        this.addQuarters(package_.quarters + package_.bonus);
        return result;
      }
      
      throw new Error(result.error || 'Payment failed');
      
    } catch (error) {
      console.error('Quarters purchase failed:', error);
      throw error;
    }
  }
  
  async spendQuarters(item, amount) {
    if (this.balance < amount) {
      throw new Error(`Insufficient quarters. Need ${amount}, have ${this.balance}`);
    }
    
    try {
      // Process with backend
      const response = await fetch('/api/payments/quarters/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          item: item,
          playerId: await this.getPlayerId()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.balance -= amount;
        this.saveBalance();
        return result;
      }
      
      throw new Error(result.error || 'Spending failed');
      
    } catch (error) {
      console.error('Quarters spending failed:', error);
      throw error;
    }
  }
  
  addQuarters(amount) {
    this.balance += amount;
    this.saveBalance();
  }
  
  canAfford(item) {
    const cost = this.costs[item] || 0;
    return this.balance >= cost;
  }
  
  getItemCost(item) {
    return this.costs[item] || 0;
  }
  
  dispatchBalanceUpdate() {
    window.dispatchEvent(new CustomEvent('quartersBalanceUpdated', {
      detail: { balance: this.balance }
    }));
  }
  
  async processWebPayment(package_) {
    // Implement web-based payment fallback
    return { success: false, error: 'Web payment not implemented' };
  }
  async getPlayerId() {
    if (window.UniversalIdentity) {
      const identity = await window.UniversalIdentity.getIdentity();
      return identity.playerId;
    }
    return 'anonymous';
  }
}

// Global instance
window.QuartersSystem = new QuartersSystem();
