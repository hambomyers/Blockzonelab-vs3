/* ==========================================================================
   BLOCKZONE LAB - PRIZE CALCULATION SYSTEM
   Hyperbolic distribution with $5 minimum and 40% to winner
   ========================================================================== */

/**
 * Prize Calculator - Original Revenue Model
 * Maintains the original 10% platform fee structure
 */

export class PrizeCalculator {
  constructor() {
    // ORIGINAL REVENUE MODEL - As you had it
    this.platformFee = 0.10;        // 10% to platform (as you had it)
    this.prizePoolRate = 0.90;      // 90% to players (as you had it)
    
    // Original prize distribution
    this.winnerShare = 0.50;        // 50% to 1st place
    this.hyperbolicExponent = 2.5;  // Hyperbolic distribution curve
    this.minimumPrize = 1.00;       // $1 minimum per winner
    this.payoutPositions = 5;       // Top 5 winners
    
    console.log('💰 Prize Calculator initialized with original revenue model');
  }

  calculatePrizes(totalRevenue) {
    const prizePool = totalRevenue * this.prizePoolRate;
    const platformRevenue = totalRevenue * this.platformFee;
    
    // Calculate 1st place (50% of prize pool)
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
    const baseAmounts = [50, 30, 20, 10, 5]; // Percentages
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

  // Calculate friend challenge prizes
  calculateFriendChallengePrize(entryFee = 2.00) {
    const totalPot = entryFee * 2; // Both players pay $2
    const winnerPrize = totalPot * (1 - this.platformFee); // 90% to winner
    const platformFee = totalPot * this.platformFee; // 10% to platform
    
    return {
      totalPot: totalPot,
      winnerPrize: winnerPrize,
      platformFee: platformFee,
      entryFee: entryFee
    };
  }

  calculateChampionshipPrizes(totalPool, participantCount) {
    const prizes = [];
    const availablePool = totalPool * (1 - this.platformFee); // 90% to prizes
    
    if (participantCount === 0) return prizes;
    
    // Calculate prizes based on participant count
    if (participantCount >= 5) {
      prizes.push(availablePool * 0.50); // 1st place: 50%
      prizes.push(availablePool * 0.30); // 2nd place: 30%
      prizes.push(availablePool * 0.20); // 3rd place: 20%
    } else if (participantCount >= 3) {
      prizes.push(availablePool * 0.60); // 1st place: 60%
      prizes.push(availablePool * 0.40); // 2nd place: 40%
    } else {
      prizes.push(availablePool); // Winner takes all
    }
    
    return prizes.map(p => Math.round(p * 100) / 100);
  }

  getPrizeForPosition(position, totalPool, participantCount) {
    const prizes = this.calculateChampionshipPrizes(totalPool, participantCount);
    if (position <= prizes.length) {
      return `$${prizes[position - 1].toFixed(2)}`;
    }
    return 'No prize';
  }
}

// Export for use in Cloudflare Worker
export default PrizeCalculator;
