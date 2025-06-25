/* ==========================================================================
   BLOCKZONE LAB - PRIZE CALCULATION SYSTEM
   Hyperbolic distribution with $5 minimum and 40% to winner
   ========================================================================== */

export class PrizeCalculator {
  constructor() {
    this.platformFee = 0.10;        // 10% to platform
    this.prizePoolRate = 0.90;      // 90% to prizes
    this.winnerShare = 0.40;        // 40% to 1st place
    this.minimumPrize = 5.00;       // $5 minimum for top 5
    this.payoutPositions = 5;       // Top 5 winners
  }

  calculatePrizes(totalRevenue) {
    const prizePool = totalRevenue * this.prizePoolRate;
    const platformRevenue = totalRevenue * this.platformFee;
    
    // Calculate 1st place (40% of prize pool)
    const firstPlace = prizePool * this.winnerShare;
    
    // Check if we can afford minimums for places 2-5
    const minimumTotal = this.minimumPrize * (this.payoutPositions - 1);
    const remainingPool = prizePool - firstPlace;
    
    if (remainingPool < minimumTotal) {
      // Not enough for minimums, scale everything proportionally
      return this.calculateScaledPrizes(prizePool);
    }
    
    // Calculate hyperbolic distribution for places 2-5
    const hyperbolicPool = remainingPool - minimumTotal;
    const prizes = [firstPlace];
    
    // Hyperbolic weights: 1/2, 1/3, 1/4, 1/5
    const weights = [1/2, 1/3, 1/4, 1/5];
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    for (let i = 0; i < 4; i++) {
      const hyperbolicAmount = (hyperbolicPool * weights[i]) / totalWeight;
      prizes.push(this.minimumPrize + hyperbolicAmount);
    }
    
    return {
      totalRevenue,
      prizePool,
      platformRevenue,
      prizes: prizes.map(p => Math.round(p * 100) / 100), // Round to cents
      distribution: this.getPrizeBreakdown(prizes),
      minimumGuaranteed: true
    };
  }

  calculateScaledPrizes(prizePool) {
    // If we can't afford minimums, distribute proportionally
    const baseAmounts = [40, 25, 20, 10, 5]; // Percentages
    const prizes = baseAmounts.map(pct => (prizePool * pct) / 100);
    
    return {
      totalRevenue: prizePool / this.prizePoolRate,
      prizePool,
      platformRevenue: (prizePool / this.prizePoolRate) * this.platformFee,
      prizes: prizes.map(p => Math.round(p * 100) / 100),
      distribution: this.getPrizeBreakdown(prizes),
      minimumGuaranteed: false
    };
  }

  getPrizeBreakdown(prizes) {
    const positions = ['1st', '2nd', '3rd', '4th', '5th'];
    return prizes.map((amount, index) => ({
      position: positions[index],
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round((amount / prizes.reduce((sum, p) => sum + p, 0)) * 100)
    }));
  }

  // Preview prizes for different entry scenarios
  previewPrizes(playerCount, entryFee = 0.25) {
    const totalPool = playerCount * entryFee;
    const platformFee = totalPool * 0.10;
    const prizePool = totalPool * 0.90;
    
    return {
      totalPool: totalPool.toFixed(2),
      platformFee: platformFee.toFixed(2),
      prizePool: prizePool.toFixed(2),
      firstPlace: (prizePool * 0.50).toFixed(2),
      secondPlace: (prizePool * 0.30).toFixed(2),
      thirdPlace: (prizePool * 0.20).toFixed(2)
    };
  }

  // Get current tournament prize preview
  getCurrentPrizePreview(currentEntries, entryFee = 0.25) {
    if (currentEntries < 5) {
      return {
        status: 'insufficient_players',
        message: 'Need at least 5 players for tournament',
        currentRevenue: currentEntries * entryFee,
        needed: 5 - currentEntries
      };
    }
    
    return {
      status: 'active',
      ...this.calculatePrizes(currentEntries * entryFee),
      currentEntries
    };
  }
}

// Export for use in Cloudflare Worker
export default PrizeCalculator;
