/* ==========================================================================
   BLOCKZONE LAB - PRIZE CALCULATION SYSTEM
   Hyperbolic distribution with $5 minimum and 40% to winner
   ========================================================================== */

export class PrizeCalculator {
  constructor() {
    this.platformFee = 0.10;        // 10% to platform
    this.prizePoolRate = 0.90;      // 90% to prizes
    this.winnerShare = 0.50;        // 50% to 1st place
    this.hyperbolicExponent = 2.5;  // Hyperbolic distribution curve
    this.minimumPrize = 1.00;       // $1 minimum per winner
    this.payoutPositions = 5;       // Top 5 winners
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

  // Calculate championship cycle prizes
  calculateChampionshipPrizes(totalPool, participantCount) {
    const prizes = [];
    const availablePool = totalPool * (1 - this.platformFee); // 90% to prizes
    
    if (participantCount === 0) return prizes;
    
    // 1st place gets 50% of available pool
    const firstPlacePrize = Math.max(this.minimumPrize, availablePool * this.winnerShare);
    prizes.push(firstPlacePrize);
    
    // Remaining 50% distributed hyperbolically among 2nd-5th
    const remainingPool = availablePool - firstPlacePrize;
    const remainingWinners = Math.min(4, participantCount - 1); // 2nd-5th place
    
    if (remainingWinners > 0 && remainingPool > 0) {
      const hyperbolicPrizes = this.calculateHyperbolicPrizes(remainingPool, remainingWinners);
      prizes.push(...hyperbolicPrizes);
    }
    
    return prizes;
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

  // Calculate hyperbolic distribution for 2nd-5th place
  calculateHyperbolicPrizes(totalPool, winnerCount) {
    const prizes = [];
    let remainingPool = totalPool;
    
    for (let i = 0; i < winnerCount; i++) {
      const rank = i + 2; // 2nd, 3rd, 4th, 5th place
      const share = 1 / Math.pow(rank, this.hyperbolicExponent);
      
      // Calculate this winner's share of remaining pool
      const winnerShare = remainingPool * share;
      const prize = Math.max(this.minimumPrize, winnerShare);
      
      prizes.push(prize);
      remainingPool -= prize;
    }
    
    return prizes;
  }

  // Format prize amounts for display
  formatPrize(amount) {
    return `$${amount.toFixed(2)}`;
  }

  // Get prize description for a specific rank
  getPrizeDescription(rank, totalPool, participantCount) {
    const prizes = this.calculateChampionshipPrizes(totalPool, participantCount);
    
    if (rank <= prizes.length) {
      return this.formatPrize(prizes[rank - 1]);
    }
    
    return 'No prize';
  }
}

// Export for use in Cloudflare Worker
export default PrizeCalculator;
