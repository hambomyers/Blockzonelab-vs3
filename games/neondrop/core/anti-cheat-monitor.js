/**
 * Anti-Cheat Monitor - Client-Side Game State Protection
 * Tracks game state, validates inputs, and generates cryptographic proofs
 */

class AntiCheatMonitor {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.sessionId = this.generateSessionId();
        this.gameState = {
            startTime: Date.now(),
            moves: [],
            score: 0,
            level: 1,
            pieces: [],
            inputPatterns: [],
            stateHash: null
        };
        this.suspiciousPatterns = [];
        this.verificationData = [];
        
        this.initializeMonitoring();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    initializeMonitoring() {
        // Monitor game state changes
        this.monitorGameState();
        
        // Monitor input patterns
        this.monitorInputs();
        
        // Monitor score changes
        this.monitorScore();
        
        // Monitor piece sequences
        this.monitorPieces();
        
        // Generate periodic state hashes
        this.startPeriodicHashing();
    }

    monitorGameState() {
        // Check if game engine has the expected methods
        if (!this.gameEngine || !this.gameEngine.tick) {
            console.warn('Anti-cheat monitor: Game engine not properly initialized');
            return;
        }

        const originalTick = this.gameEngine.tick;
        this.gameEngine.tick = (deltaTime) => {
            try {
                // Record state before update
                const preState = this.captureGameState();
                
                // Execute original tick
                const result = originalTick.call(this.gameEngine, deltaTime);
                
                // Record state after update
                const postState = this.captureGameState();
                
                // Validate state transition
                this.validateStateTransition(preState, postState);
                
                return result;
            } catch (error) {
                console.error('Anti-cheat monitor error:', error);
                // Fall back to original tick if monitoring fails
                return originalTick.call(this.gameEngine, deltaTime);
            }
        };
    }

    monitorInputs() {
        // Check if input controller exists
        if (!this.gameEngine || !this.gameEngine.handleInput) {
            console.warn('Anti-cheat monitor: Input controller not available');
            return;
        }

        const originalHandleInput = this.gameEngine.handleInput;
        this.gameEngine.handleInput = (input) => {
            try {
                // Record input with timestamp
                const inputRecord = {
                    timestamp: Date.now(),
                    input: input,
                    gameState: this.captureGameState()
                };
                
                this.gameState.inputPatterns.push(inputRecord);
                
                // Check for suspicious patterns
                this.detectSuspiciousInputs(inputRecord);
                
                // Execute original input handling
                return originalHandleInput.call(this.gameEngine, input);
            } catch (error) {
                console.error('Anti-cheat input monitoring error:', error);
                return originalHandleInput.call(this.gameEngine, input);
            }
        };
    }

    monitorScore() {
        // Check if scoring system exists
        if (!this.gameEngine || !this.gameEngine.scoring || !this.gameEngine.scoring.updateScore) {
            console.warn('Anti-cheat monitor: Scoring system not available');
            return;
        }

        const originalUpdateScore = this.gameEngine.scoring.updateScore;
        this.gameEngine.scoring.updateScore = (points) => {
            try {
                // Record score change
                const scoreChange = {
                    timestamp: Date.now(),
                    previousScore: this.gameState.score,
                    points: points,
                    newScore: this.gameState.score + points
                };
                
                // Validate score change
                this.validateScoreChange(scoreChange);
                
                // Update our tracking
                this.gameState.score = scoreChange.newScore;
                
                // Execute original score update
                return originalUpdateScore.call(this.gameEngine.scoring, points);
            } catch (error) {
                console.error('Anti-cheat score monitoring error:', error);
                return originalUpdateScore.call(this.gameEngine.scoring, points);
            }
        };
    }

    monitorPieces() {
        // Check if piece generator exists
        if (!this.gameEngine || !this.gameEngine.generatePiece) {
            console.warn('Anti-cheat monitor: Piece generator not available');
            return;
        }

        const originalGeneratePiece = this.gameEngine.generatePiece;
        this.gameEngine.generatePiece = () => {
            try {
                const piece = originalGeneratePiece.call(this.gameEngine);
                
                // Record piece generation
                this.gameState.pieces.push({
                    timestamp: Date.now(),
                    piece: piece,
                    level: this.gameState.level
                });
                
                return piece;
            } catch (error) {
                console.error('Anti-cheat piece monitoring error:', error);
                return originalGeneratePiece.call(this.gameEngine);
            }
        };
    }

    captureGameState() {
        try {
            if (!this.gameEngine || !this.gameEngine.getState) {
                console.warn('Anti-cheat monitor: Game engine not available for state capture');
                return {
                    timestamp: Date.now(),
                    score: 0,
                    level: 1,
                    lines: 0,
                    activePiece: null,
                    boardState: []
                };
            }

            const gameState = this.gameEngine.getState();
            return {
                timestamp: Date.now(),
                score: gameState.score || 0,
                level: gameState.level || 1,
                lines: gameState.lines || 0,
                activePiece: gameState.current ? {
                    type: gameState.current.type,
                    position: { x: gameState.current.gridX, y: gameState.current.gridY },
                    rotation: gameState.current.rotation
                } : null,
                boardState: gameState.board || []
            };
        } catch (error) {
            console.error('Anti-cheat monitor: Error capturing game state:', error);
            return {
                timestamp: Date.now(),
                score: 0,
                level: 1,
                lines: 0,
                activePiece: null,
                boardState: []
            };
        }
    }

    validateStateTransition(preState, postState) {
        // Check for impossible state changes
        if (postState.score < preState.score) {
            this.flagSuspiciousActivity('Score decreased unexpectedly', { preState, postState });
        }
        
        if (postState.level < preState.level) {
            this.flagSuspiciousActivity('Level decreased unexpectedly', { preState, postState });
        }
        
        // Check for impossible score jumps
        const scoreDiff = postState.score - preState.score;
        if (scoreDiff > 1000) { // Maximum reasonable score increase
            this.flagSuspiciousActivity('Unusually large score increase', { 
                scoreDiff, 
                preState, 
                postState 
            });
        }
    }

    validateScoreChange(scoreChange) {
        // Validate score increase is reasonable
        if (scoreChange.points < 0) {
            this.flagSuspiciousActivity('Negative score change', scoreChange);
        }
        
        if (scoreChange.points > 1000) {
            this.flagSuspiciousActivity('Unusually large score points', scoreChange);
        }
        
        // Check for impossible score calculations
        const expectedScore = scoreChange.previousScore + scoreChange.points;
        if (scoreChange.newScore !== expectedScore) {
            this.flagSuspiciousActivity('Score calculation mismatch', scoreChange);
        }
    }

    detectSuspiciousInputs(inputRecord) {
        // Check for inhuman input speeds
        if (this.gameState.inputPatterns.length > 1) {
            const lastInput = this.gameState.inputPatterns[this.gameState.inputPatterns.length - 2];
            const timeDiff = inputRecord.timestamp - lastInput.timestamp;
            
            if (timeDiff < 50) { // Less than 50ms between inputs
                this.flagSuspiciousActivity('Unusually fast inputs', { 
                    timeDiff, 
                    inputRecord 
                });
            }
        }
        
        // Check for impossible input combinations
        if (inputRecord.input.includes('left') && inputRecord.input.includes('right')) {
            this.flagSuspiciousActivity('Impossible input combination', inputRecord);
        }
    }

    flagSuspiciousActivity(type, data) {
        const suspiciousActivity = {
            type: type,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            data: data,
            gameState: this.captureGameState()
        };
        
        this.suspiciousPatterns.push(suspiciousActivity);
        console.warn('Suspicious activity detected:', suspiciousActivity);
        
        // Send to server for analysis
        this.reportSuspiciousActivity(suspiciousActivity);
    }

    startPeriodicHashing() {
        setInterval(() => {
            this.generateStateHash();
        }, 5000); // Generate hash every 5 seconds
    }

    generateStateHash() {
        const stateData = {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            score: this.gameState.score,
            level: this.gameState.level,
            moves: this.gameState.moves.length,
            pieces: this.gameState.pieces.length,
            suspiciousPatterns: this.suspiciousPatterns.length
        };
        
        // Generate simple hash (in production, use proper crypto)
        this.gameState.stateHash = this.simpleHash(JSON.stringify(stateData));
        
        // Store verification data
        this.verificationData.push({
            timestamp: Date.now(),
            stateHash: this.gameState.stateHash,
            stateData: stateData
        });
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }

    async reportSuspiciousActivity(activity) {
        try {
            // In production, send to server for analysis
            console.log('Reporting suspicious activity to server:', activity);
            
            // For now, store locally
            this.suspiciousPatterns.push(activity);
        } catch (error) {
            console.error('Failed to report suspicious activity:', error);
        }
    }

    getVerificationData() {
        return {
            sessionId: this.sessionId,
            gameState: this.gameState,
            suspiciousPatterns: this.suspiciousPatterns,
            verificationData: this.verificationData,
            finalHash: this.gameState.stateHash
        };
    }

    validateSession() {
        const issues = [];
        
        // Check for suspicious patterns
        if (this.suspiciousPatterns.length > 0) {
            issues.push(`Found ${this.suspiciousPatterns.length} suspicious activities`);
        }
        
        // Check for impossible score progression
        if (this.gameState.score > 1000000) { // Unrealistic score
            issues.push('Unrealistic final score');
        }
        
        // Check for missing state hashes
        if (this.verificationData.length < 2) {
            issues.push('Insufficient verification data');
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues,
            sessionId: this.sessionId,
            finalScore: this.gameState.score
        };
    }
}

// Export for ES6 modules
export { AntiCheatMonitor }; 