/**
 * Tournament Manager - Single Daily Tournament Model
 * Manages the daily championship tournament and challenge system
 */
class TournamentManager {
    constructor() {
        this.dailyTournament = null;
        this.challenges = new Map();
        this.currentUser = null;
        this.web3 = null;
        this.contract = null;
        this.isInitialized = false;
        
        // Tournament state
        this.tournamentState = {
            isActive: false,
            startTime: null,
            endTime: null,
            entryFee: 0.25, // $0.25 USDC
            prizePool: 0,
            participants: 0,
            userJoined: false,
            userScore: 0
        };
        
        // Event listeners
        this.eventListeners = new Map();
        
        console.log('TournamentManager: Initialized for single daily tournament model');
    }
    
    /**
     * Initialize the tournament manager
     */
    async initialize(web3Instance, contractInstance, userAddress) {
        try {
            this.web3 = web3Instance;
            this.contract = contractInstance;
            this.currentUser = userAddress;
            
            // Load current tournament state
            await this.loadDailyTournamentState();
            
            // Set up periodic updates
            this.startPeriodicUpdates();
            
            this.isInitialized = true;
            console.log('TournamentManager: Initialized successfully');
            
            // Emit initialization event
            this.emit('initialized', this.tournamentState);
            
        } catch (error) {
            console.error('TournamentManager: Initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Load current daily tournament state from contract
     */
    async loadDailyTournamentState() {
        try {
            if (!this.contract) {
                console.warn('TournamentManager: Contract not available, using mock data');
                this.setMockTournamentState();
                return;
            }
            
            // Get tournament info from contract
            const tournamentInfo = await this.contract.methods.getDailyTournamentInfo().call();
            
            this.tournamentState = {
                isActive: tournamentInfo.isActive,
                startTime: parseInt(tournamentInfo.startTime),
                endTime: parseInt(tournamentInfo.endTime),
                entryFee: this.web3.utils.fromWei(tournamentInfo.entryFee, 'ether'),
                prizePool: this.web3.utils.fromWei(tournamentInfo.prizePool, 'ether'),
                participants: parseInt(tournamentInfo.currentParticipants),
                userJoined: false,
                userScore: 0
            };
            
            // Check if user is participant
            if (this.currentUser) {
                const isParticipant = await this.contract.methods.isParticipant(this.currentUser).call();
                this.tournamentState.userJoined = isParticipant;
                
                if (isParticipant) {
                    const score = await this.contract.methods.getParticipantScore(this.currentUser).call();
                    this.tournamentState.userScore = parseInt(score);
                }
            }
            
            console.log('TournamentManager: Tournament state loaded:', this.tournamentState);
            
        } catch (error) {
            console.error('TournamentManager: Failed to load tournament state:', error);
            this.setMockTournamentState();
        }
    }
    
    /**
     * Set mock tournament state for development
     */
    setMockTournamentState() {
        const now = Date.now();
        const startOfDay = new Date();
        startOfDay.setUTCHours(4, 0, 0, 0); // 11 PM EST previous day
        
        if (now < startOfDay.getTime()) {
            startOfDay.setUTCDate(startOfDay.getUTCDate() - 1);
        }
        
        this.tournamentState = {
            isActive: true,
            startTime: startOfDay.getTime(),
            endTime: startOfDay.getTime() + (24 * 60 * 60 * 1000), // 24 hours
            entryFee: 0.25,
            prizePool: 12.50, // Mock prize pool
            participants: 50, // Mock participants
            userJoined: false,
            userScore: 0
        };
    }
    
    /**
     * Join the daily tournament
     */
    async joinDailyTournament() {
        try {
            if (!this.contract || !this.currentUser) {
                console.warn('TournamentManager: Cannot join - contract or user not available');
                return false;
            }
            
            if (this.tournamentState.userJoined) {
                console.warn('TournamentManager: User already joined tournament');
                return false;
            }
            
            if (!this.tournamentState.isActive) {
                console.warn('TournamentManager: Tournament not active');
                return false;
            }
            
            // Convert entry fee to wei
            const entryFeeWei = this.web3.utils.toWei(this.tournamentState.entryFee.toString(), 'ether');
            
            // Call contract to join tournament
            await this.contract.methods.joinDailyTournament().send({
                from: this.currentUser,
                gas: 200000
            });
            
            // Update local state
            this.tournamentState.userJoined = true;
            this.tournamentState.participants++;
            this.tournamentState.prizePool += this.tournamentState.entryFee;
            
            console.log('TournamentManager: Successfully joined daily tournament');
            
            // Emit join event
            this.emit('tournamentJoined', this.tournamentState);
            
            return true;
            
        } catch (error) {
            console.error('TournamentManager: Failed to join tournament:', error);
            return false;
        }
    }
    
    /**
     * Submit score for daily tournament
     */
    async submitScore(score, gameHash) {
        try {
            if (!this.contract || !this.currentUser) {
                console.warn('TournamentManager: Cannot submit score - contract or user not available');
                return false;
            }
            
            if (!this.tournamentState.userJoined) {
                console.warn('TournamentManager: User not joined to tournament');
                return false;
            }
            
            if (!this.tournamentState.isActive) {
                console.warn('TournamentManager: Tournament not active');
                return false;
            }
            
            // Call contract to submit score
            await this.contract.methods.submitScore(score, gameHash).send({
                from: this.currentUser,
                gas: 200000
            });
            
            // Update local state
            if (score > this.tournamentState.userScore) {
                this.tournamentState.userScore = score;
            }
            
            console.log('TournamentManager: Score submitted successfully:', score);
            
            // Emit score submission event
            this.emit('scoreSubmitted', { score, gameHash });
            
            return true;
            
        } catch (error) {
            console.error('TournamentManager: Failed to submit score:', error);
            return false;
        }
    }
    
    /**
     * Get current tournament state
     */
    getTournamentState() {
        return { ...this.tournamentState };
    }
    
    /**
     * Check if user can join tournament
     */
    canJoinTournament() {
        return this.tournamentState.isActive && 
               !this.tournamentState.userJoined && 
               Date.now() < this.tournamentState.endTime;
    }
    
    /**
     * Check if tournament is active
     */
    isTournamentActive() {
        return this.tournamentState.isActive && Date.now() < this.tournamentState.endTime;
    }
    
    /**
     * Get time until tournament ends
     */
    getTimeUntilEnd() {
        if (!this.tournamentState.isActive) return 0;
        return Math.max(0, this.tournamentState.endTime - Date.now());
    }
    
    /**
     * Get time until next tournament starts
     */
    getTimeUntilNext() {
        const now = Date.now();
        const nextStart = this.tournamentState.endTime;
        return Math.max(0, nextStart - now);
    }
    
    /**
     * Start periodic updates
     */
    startPeriodicUpdates() {
        // Update every 30 seconds
        setInterval(() => {
            this.loadDailyTournamentState();
        }, 30000);
        
        // Check for tournament end every minute
        setInterval(() => {
            if (this.tournamentState.isActive && Date.now() >= this.tournamentState.endTime) {
                this.handleTournamentEnd();
            }
        }, 60000);
    }
    
    /**
     * Handle tournament end
     */
    handleTournamentEnd() {
        console.log('TournamentManager: Daily tournament ended');
        this.tournamentState.isActive = false;
        this.emit('tournamentEnded', this.tournamentState);
    }
    
    // ============ CHALLENGE SYSTEM ============
    
    /**
     * Create a new challenge
     */
    async createChallenge(fee, pieceSequenceHash) {
        try {
            if (!this.contract || !this.currentUser) {
                console.warn('TournamentManager: Cannot create challenge - contract or user not available');
                return null;
            }
            
            // Convert fee to wei
            const feeWei = this.web3.utils.toWei(fee.toString(), 'ether');
            
            // Call contract to create challenge
            const result = await this.contract.methods.createChallenge(feeWei, pieceSequenceHash).send({
                from: this.currentUser,
                gas: 300000
            });
            
            // Get challenge ID from event
            const challengeId = result.events.ChallengeCreated.returnValues.challengeId;
            
            console.log('TournamentManager: Challenge created successfully:', challengeId);
            
            // Emit challenge creation event
            this.emit('challengeCreated', { challengeId, fee, pieceSequenceHash });
            
            return challengeId;
            
        } catch (error) {
            console.error('TournamentManager: Failed to create challenge:', error);
            return null;
        }
    }
    
    /**
     * Accept a challenge
     */
    async acceptChallenge(challengeId) {
        try {
            if (!this.contract || !this.currentUser) {
                console.warn('TournamentManager: Cannot accept challenge - contract or user not available');
                return false;
            }
            
            // Get challenge details
            const challenge = await this.contract.methods.challenges(challengeId).call();
            
            // Convert fee to wei
            const feeWei = this.web3.utils.toWei(challenge.fee, 'ether');
            
            // Call contract to accept challenge
            await this.contract.methods.acceptChallenge(challengeId).send({
                from: this.currentUser,
                value: feeWei,
                gas: 200000
            });
            
            console.log('TournamentManager: Challenge accepted successfully:', challengeId);
            
            // Emit challenge acceptance event
            this.emit('challengeAccepted', { challengeId });
            
            return true;
            
        } catch (error) {
            console.error('TournamentManager: Failed to accept challenge:', error);
            return false;
        }
    }
    
    // ============ EVENT SYSTEM ============
    
    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Emit event
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('TournamentManager: Event callback error:', error);
                }
            });
        }
    }
    
    // ============ UTILITY FUNCTIONS ============
    
    /**
     * Format time remaining
     */
    formatTimeRemaining(milliseconds) {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Format USDC amount
     */
    formatUSDC(amount) {
        return `$${parseFloat(amount).toFixed(2)} USDC`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TournamentManager;
} 