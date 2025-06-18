/**
 * Quarters Token System for BlockZone Lab
 * Gaming-optimized microtransaction currency
 */

export class QuartersSystem {
  constructor() {
    this.balance = this.loadBalance();
    this.packages = [
      { quarters: 100, price: 0.99, bonus: 0, popular: false },
      { quarters: 500, price: 4.99, bonus: 50, popular: false },
      { quarters: 1200, price: 9.99, bonus: 200, popular: true },
      { quarters: 2500, price: 19.99, bonus: 500, popular: false },
      { quarters: 6000, price: 49.99, bonus: 1500, popular: false }
    ];
    
    this.costs = {
      tournament_entry: 25,
      premium_game: 10,
      daily_challenge: 5,
      cosmetic_unlock: 50,
      power_up: 15,
      extra_life: 20,
      score_multiplier: 30
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
          \\ Quarters\
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
      throw new Error(\Insufficient quarters. Need \, have \\);
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
    console.log(\ Added \ quarters. New balance: \\);
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
    if (window.UniversalPlayerIdentity) {
      const identity = await window.UniversalPlayerIdentity.getIdentity();
      return identity.playerId;
    }
    return 'anonymous';
  }
}

// Global instance
window.QuartersSystem = new QuartersSystem();
