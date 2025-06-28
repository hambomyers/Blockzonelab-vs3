/**
 * TournamentManager - Championship cycles and challenge management
 * Phase 2: Platform Infrastructure
 */

class TournamentManager {
    constructor() {
        this.activeChampionships = new Map(); // championshipId -> championship data
        this.scheduledChampionships = []; // upcoming championships
        this.prizePools = new Map(); // championshipId -> prize pool
        this.leaderboards = new Map(); // championshipId -> leaderboard
        this.activeChallenges = new Map(); // challengeId -> challenge data
        this.challengeLinks = new Map(); // challengeId -> shareable link
        
        console.log('🏆 TournamentManager initialized');
        this.initializeChampionshipSchedule();
    }

    /**
     * Initialize championship schedule (two 12-hour periods daily)
     */
    initializeChampionshipSchedule() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Schedule championships for the next 7 days
        for (let day = 0; day < 7; day++) {
            const date = new Date(today);
            date.setDate(date.getDate() + day);
            
            // Morning championship: 12 AM - 12 PM GMT
            const morningStart = new Date(date);
            morningStart.setHours(0, 0, 0, 0);
            this.scheduleChampionship(morningStart, 12 * 60 * 60 * 1000, 0.25); // 12 hours, $0.25 entry
            
            // Evening championship: 12 PM - 12 AM GMT  
            const eveningStart = new Date(date);
            eveningStart.setHours(12, 0, 0, 0);
            this.scheduleChampionship(eveningStart, 12 * 60 * 60 * 1000, 0.25); // 12 hours, $0.25 entry
        }
    }

    /**
     * Schedule a new championship
     */
    scheduleChampionship(startTime, duration, entryFee) {
        const championshipId = `champ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const championship = {
            id: championshipId,
            startTime: startTime.getTime(),
            endTime: startTime.getTime() + duration,
            duration: duration,
            entryFee: entryFee,
            status: 'scheduled', // scheduled, active, ended
            participants: new Set(),
            totalEntries: 0,
            totalPrizePool: 0,
            createdAt: Date.now()
        };
        
        this.scheduledChampionships.push(championship);
        this.leaderboards.set(championshipId, []);
        this.prizePools.set(championshipId, 0);
        
        console.log(`🏆 Championship scheduled: ${championshipId} starting ${startTime.toISOString()}`);
        return championshipId;
    }

    /**
     * Start a championship
     */
    startChampionship(championshipId) {
        const championship = this.scheduledChampionships.find(c => c.id === championshipId);
        if (!championship) throw new Error('Championship not found');
        
        championship.status = 'active';
        this.activeChampionships.set(championshipId, championship);
        
        // Remove from scheduled
        this.scheduledChampionships = this.scheduledChampionships.filter(c => c.id !== championshipId);
        
        console.log(`🏆 Championship started: ${championshipId}`);
        return championship;
    }

    /**
     * Join a championship
     */
    joinChampionship(championshipId, userId, entryFee) {
        const championship = this.activeChampionships.get(championshipId);
        if (!championship) throw new Error('Championship not active');
        
        if (entryFee < championship.entryFee) {
            throw new Error(`Entry fee must be at least $${championship.entryFee}`);
        }
        
        championship.participants.add(userId);
        championship.totalEntries++;
        championship.totalPrizePool += entryFee * 0.9; // 90% to prize pool, 10% platform fee
        
        // Initialize user in leaderboard
        const leaderboard = this.leaderboards.get(championshipId);
        leaderboard.push({
            userId: userId,
            score: 0,
            entries: 1,
            bestScore: 0,
            lastUpdated: Date.now()
        });
        
        console.log(`👤 User ${userId} joined championship ${championshipId}`);
        return true;
    }

    /**
     * Submit score to championship
     */
    submitScore(championshipId, userId, score, gameProof = null) {
        const championship = this.activeChampionships.get(championshipId);
        if (!championship) throw new Error('Championship not active');
        
        if (!championship.participants.has(userId)) {
            throw new Error('User not registered for championship');
        }
        
        const leaderboard = this.leaderboards.get(championshipId);
        const userEntry = leaderboard.find(entry => entry.userId === userId);
        
        if (!userEntry) {
            throw new Error('User not found in leaderboard');
        }
        
        // Update score (keep best score)
        if (score > userEntry.bestScore) {
            userEntry.bestScore = score;
        }
        userEntry.score = score;
        userEntry.lastUpdated = Date.now();
        
        // Sort leaderboard by score (descending)
        leaderboard.sort((a, b) => b.bestScore - a.bestScore);
        
        console.log(`📊 Score submitted: ${userId} scored ${score} in ${championshipId}`);
        return userEntry;
    }

    /**
     * End championship and distribute prizes
     */
    endChampionship(championshipId) {
        const championship = this.activeChampionships.get(championshipId);
        if (!championship) throw new Error('Championship not found');
        
        championship.status = 'ended';
        const leaderboard = this.leaderboards.get(championshipId);
        
        // Distribute prizes (top 3 winners)
        const winners = leaderboard.slice(0, 3);
        const prizeDistribution = [0.5, 0.3, 0.2]; // 50%, 30%, 20%
        
        const prizes = winners.map((winner, index) => ({
            userId: winner.userId,
            position: index + 1,
            prize: championship.totalPrizePool * prizeDistribution[index],
            score: winner.bestScore
        }));
        
        // Remove from active championships
        this.activeChampionships.delete(championshipId);
        
        console.log(`🏆 Championship ended: ${championshipId}, prizes distributed to ${winners.length} winners`);
        return { championship, prizes, leaderboard };
    }

    /**
     * Create a friend challenge
     */
    createChallenge(creatorId, gameId, fee, duration = 24 * 60 * 60 * 1000) { // 24 hours default
        const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const challenge = {
            id: challengeId,
            creatorId: creatorId,
            gameId: gameId,
            fee: fee,
            duration: duration,
            startTime: Date.now(),
            endTime: Date.now() + duration,
            status: 'active', // active, completed, expired
            participants: new Set([creatorId]),
            scores: new Map(), // userId -> score
            winner: null,
            prizePool: fee * 0.85, // 85% to winner, 15% platform fee
            createdAt: Date.now()
        };
        
        this.activeChallenges.set(challengeId, challenge);
        this.challengeLinks.set(challengeId, `/challenge/${challengeId}`);
        
        console.log(`🔗 Challenge created: ${challengeId} by ${creatorId}`);
        return { challengeId, shareableLink: this.challengeLinks.get(challengeId) };
    }

    /**
     * Accept a friend challenge
     */
    acceptChallenge(challengeId, challengerId) {
        const challenge = this.activeChallenges.get(challengeId);
        if (!challenge) throw new Error('Challenge not found');
        
        if (challenge.status !== 'active') {
            throw new Error('Challenge is not active');
        }
        
        if (challenge.participants.has(challengerId)) {
            throw new Error('Already participating in challenge');
        }
        
        challenge.participants.add(challengerId);
        challenge.prizePool += challenge.fee * 0.85; // Add challenger's fee to prize pool
        
        console.log(`👤 User ${challengerId} accepted challenge ${challengeId}`);
        return challenge;
    }

    /**
     * Submit score to challenge
     */
    submitChallengeScore(challengeId, userId, score) {
        const challenge = this.activeChallenges.get(challengeId);
        if (!challenge) throw new Error('Challenge not found');
        
        if (!challenge.participants.has(userId)) {
            throw new Error('User not participating in challenge');
        }
        
        challenge.scores.set(userId, score);
        console.log(`📊 Challenge score submitted: ${userId} scored ${score} in ${challengeId}`);
        return score;
    }

    /**
     * Resolve challenge and determine winner
     */
    resolveChallenge(challengeId) {
        const challenge = this.activeChallenges.get(challengeId);
        if (!challenge) throw new Error('Challenge not found');
        
        if (challenge.scores.size < 2) {
            throw new Error('Need at least 2 participants with scores');
        }
        
        // Find winner (highest score)
        let winner = null;
        let highestScore = -1;
        
        for (const [userId, score] of challenge.scores) {
            if (score > highestScore) {
                highestScore = score;
                winner = userId;
            }
        }
        
        challenge.winner = winner;
        challenge.status = 'completed';
        
        // Remove from active challenges
        this.activeChallenges.delete(challengeId);
        
        console.log(`🏆 Challenge resolved: ${challengeId}, winner: ${winner} with score ${highestScore}`);
        return { challenge, winner, prize: challenge.prizePool };
    }

    /**
     * Get active championships
     */
    getActiveChampionships() {
        return Array.from(this.activeChampionships.values());
    }

    /**
     * Get scheduled championships
     */
    getScheduledChampionships() {
        return this.scheduledChampionships;
    }

    /**
     * Get championship leaderboard
     */
    getLeaderboard(championshipId) {
        return this.leaderboards.get(championshipId) || [];
    }

    /**
     * Get active challenges
     */
    getActiveChallenges() {
        return Array.from(this.activeChallenges.values());
    }

    /**
     * Get user's active challenges
     */
    getUserChallenges(userId) {
        return Array.from(this.activeChallenges.values()).filter(challenge => 
            challenge.participants.has(userId)
        );
    }
}

// Create global instance
window.tournamentManager = new TournamentManager(); 