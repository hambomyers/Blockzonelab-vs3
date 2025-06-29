/**
 * Verification Engine - Server-Side Game Session Validation
 * Reconstructs game sessions and validates them for fraud detection
 */

class VerificationEngine {
    constructor() {
        this.fraudScoreThreshold = 0.7;
        this.verificationHistory = [];
        this.suspiciousSessions = [];
        this.blockedSessions = [];
    }

    async verifyGameSession(sessionData) {
        const verification = {
            sessionId: sessionData.sessionId,
            timestamp: Date.now(),
            isValid: false,
            fraudScore: 0,
            issues: [],
            recommendations: []
        };

        try {
            // Step 1: Validate session structure
            const structureValidation = this.validateSessionStructure(sessionData);
            if (!structureValidation.valid) {
                verification.issues.push(...structureValidation.issues);
                verification.fraudScore += 0.3;
            }

            // Step 2: Reconstruct game session
            const reconstruction = this.reconstructGameSession(sessionData);
            if (!reconstruction.valid) {
                verification.issues.push(...reconstruction.issues);
                verification.fraudScore += 0.4;
            }

            // Step 3: Analyze patterns
            const patternAnalysis = this.analyzePatterns(sessionData);
            verification.fraudScore += patternAnalysis.fraudScore;
            verification.issues.push(...patternAnalysis.issues);

            // Step 4: Cross-reference with known patterns
            const crossReference = this.crossReferencePatterns(sessionData);
            verification.fraudScore += crossReference.fraudScore;
            verification.issues.push(...crossReference.issues);

            // Step 5: Determine final validity
            verification.isValid = verification.fraudScore < this.fraudScoreThreshold;
            
            if (verification.isValid) {
                verification.recommendations.push('Session appears legitimate');
            } else {
                verification.recommendations.push('Session requires manual review');
                this.suspiciousSessions.push(verification);
            }

            // Store verification result
            this.verificationHistory.push(verification);

            return verification;

        } catch (error) {
            verification.issues.push(`Verification error: ${error.message}`);
            verification.fraudScore = 1.0;
            return verification;
        }
    }

    validateSessionStructure(sessionData) {
        const issues = [];
        const requiredFields = ['sessionId', 'gameState', 'suspiciousPatterns', 'verificationData'];

        for (const field of requiredFields) {
            if (!sessionData[field]) {
                issues.push(`Missing required field: ${field}`);
            }
        }

        // Validate game state structure
        if (sessionData.gameState) {
            const gameStateFields = ['score', 'level', 'moves', 'pieces'];
            for (const field of gameStateFields) {
                if (!(field in sessionData.gameState)) {
                    issues.push(`Missing game state field: ${field}`);
                }
            }
        }

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    reconstructGameSession(sessionData) {
        const issues = [];
        const gameState = sessionData.gameState;

        try {
            // Reconstruct score progression
            const scoreReconstruction = this.reconstructScoreProgression(gameState);
            if (!scoreReconstruction.valid) {
                issues.push(...scoreReconstruction.issues);
            }

            // Reconstruct piece sequence
            const pieceReconstruction = this.reconstructPieceSequence(gameState);
            if (!pieceReconstruction.valid) {
                issues.push(...pieceReconstruction.issues);
            }

            // Reconstruct move sequence
            const moveReconstruction = this.reconstructMoveSequence(gameState);
            if (!moveReconstruction.valid) {
                issues.push(...moveReconstruction.issues);
            }

            return {
                valid: issues.length === 0,
                issues: issues
            };

        } catch (error) {
            issues.push(`Reconstruction error: ${error.message}`);
            return {
                valid: false,
                issues: issues
            };
        }
    }

    reconstructScoreProgression(gameState) {
        const issues = [];
        const score = gameState.score;

        // Check for impossible score values
        if (score < 0) {
            issues.push('Negative score detected');
        }

        if (score > 1000000) {
            issues.push('Unrealistically high score');
        }

        // Check for impossible score jumps
        if (gameState.moves && gameState.moves.length > 0) {
            const lastMove = gameState.moves[gameState.moves.length - 1];
            if (lastMove.scoreIncrease && lastMove.scoreIncrease > 1000) {
                issues.push('Impossible score increase in single move');
            }
        }

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    reconstructPieceSequence(gameState) {
        const issues = [];
        const pieces = gameState.pieces || [];

        // Check for impossible piece sequences
        for (let i = 1; i < pieces.length; i++) {
            const current = pieces[i];
            const previous = pieces[i - 1];

            // Check for impossible timing
            if (current.timestamp && previous.timestamp) {
                const timeDiff = current.timestamp - previous.timestamp;
                if (timeDiff < 100) { // Less than 100ms between pieces
                    issues.push('Impossible piece generation timing');
                }
            }

            // Check for duplicate pieces in impossible sequence
            if (current.piece === previous.piece && i < pieces.length - 1) {
                const next = pieces[i + 1];
                if (next.piece === current.piece) {
                    issues.push('Impossible piece repetition');
                }
            }
        }

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    reconstructMoveSequence(gameState) {
        const issues = [];
        const moves = gameState.moves || [];

        // Check for impossible move sequences
        for (let i = 1; i < moves.length; i++) {
            const current = moves[i];
            const previous = moves[i - 1];

            // Check for conflicting moves
            if (this.areMovesConflicting(previous, current)) {
                issues.push('Conflicting moves detected');
            }

            // Check for impossible timing
            if (current.timestamp && previous.timestamp) {
                const timeDiff = current.timestamp - previous.timestamp;
                if (timeDiff < 16) { // Less than 16ms between moves
                    issues.push('Impossible move timing');
                }
            }
        }

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    areMovesConflicting(move1, move2) {
        const conflicts = [
            ['left', 'right'],
            ['rotate_left', 'rotate_right']
        ];

        for (const [conflict1, conflict2] of conflicts) {
            if ((move1.action === conflict1 && move2.action === conflict2) ||
                (move1.action === conflict2 && move2.action === conflict1)) {
                return true;
            }
        }

        return false;
    }

    analyzePatterns(sessionData) {
        const issues = [];
        let fraudScore = 0;

        // Analyze suspicious patterns
        const suspiciousPatterns = sessionData.suspiciousPatterns || [];
        if (suspiciousPatterns.length > 0) {
            issues.push(`Found ${suspiciousPatterns.length} suspicious patterns`);
            fraudScore += suspiciousPatterns.length * 0.1;
        }

        // Analyze input patterns
        const inputPatterns = sessionData.gameState.inputPatterns || [];
        if (inputPatterns.length > 0) {
            const patternAnalysis = this.analyzeInputPatterns(inputPatterns);
            issues.push(...patternAnalysis.issues);
            fraudScore += patternAnalysis.fraudScore;
        }

        // Analyze timing patterns
        const timingAnalysis = this.analyzeTimingPatterns(sessionData);
        issues.push(...timingAnalysis.issues);
        fraudScore += timingAnalysis.fraudScore;

        return {
            fraudScore: fraudScore,
            issues: issues
        };
    }

    analyzeInputPatterns(inputPatterns) {
        const issues = [];
        let fraudScore = 0;

        // Check for inhuman input speeds
        for (let i = 1; i < inputPatterns.length; i++) {
            const timeDiff = inputPatterns[i].timestamp - inputPatterns[i-1].timestamp;
            if (timeDiff < 50) { // Less than 50ms between inputs
                issues.push('Inhuman input speed detected');
                fraudScore += 0.2;
            }
        }

        // Check for automated patterns
        const automatedPatterns = this.detectAutomatedPatterns(inputPatterns);
        if (automatedPatterns.length > 0) {
            issues.push(`Automated patterns detected: ${automatedPatterns.join(', ')}`);
            fraudScore += automatedPatterns.length * 0.15;
        }

        return {
            fraudScore: fraudScore,
            issues: issues
        };
    }

    detectAutomatedPatterns(inputPatterns) {
        const patterns = [];
        const actions = inputPatterns.map(p => p.input);

        // Check for exact repetition
        for (let i = 0; i < actions.length - 5; i++) {
            const sequence = actions.slice(i, i + 5);
            const nextSequence = actions.slice(i + 5, i + 10);
            if (JSON.stringify(sequence) === JSON.stringify(nextSequence)) {
                patterns.push('exact_repetition');
            }
        }

        // Check for too-perfect timing
        const timeDiffs = [];
        for (let i = 1; i < inputPatterns.length; i++) {
            timeDiffs.push(inputPatterns[i].timestamp - inputPatterns[i-1].timestamp);
        }

        const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
        const variance = timeDiffs.reduce((sum, diff) => sum + Math.pow(diff - avgDiff, 2), 0) / timeDiffs.length;

        if (variance < 50) { // Very low variance
            patterns.push('perfect_timing');
        }

        return patterns;
    }

    analyzeTimingPatterns(sessionData) {
        const issues = [];
        let fraudScore = 0;

        // Check session duration
        if (sessionData.gameState.startTime && sessionData.gameState.endTime) {
            const duration = sessionData.gameState.endTime - sessionData.gameState.startTime;
            if (duration > 3600000) { // More than 1 hour
                issues.push('Session duration exceeds reasonable limit');
                fraudScore += 0.1;
            }
        }

        // Check for time manipulation
        const verificationData = sessionData.verificationData || [];
        for (const data of verificationData) {
            if (data.timestamp > Date.now()) {
                issues.push('Future timestamp detected');
                fraudScore += 0.3;
            }
        }

        return {
            fraudScore: fraudScore,
            issues: issues
        };
    }

    crossReferencePatterns(sessionData) {
        const issues = [];
        let fraudScore = 0;

        // Cross-reference with known cheating patterns
        const knownPatterns = this.getKnownCheatingPatterns();
        const sessionPatterns = this.extractSessionPatterns(sessionData);

        for (const pattern of sessionPatterns) {
            if (knownPatterns.includes(pattern)) {
                issues.push(`Known cheating pattern detected: ${pattern}`);
                fraudScore += 0.4;
            }
        }

        return {
            fraudScore: fraudScore,
            issues: issues
        };
    }

    getKnownCheatingPatterns() {
        return [
            'memory_manipulation',
            'speed_hacking',
            'score_injection',
            'input_replay',
            'timing_manipulation'
        ];
    }

    extractSessionPatterns(sessionData) {
        const patterns = [];

        // Extract patterns from suspicious activities
        const suspiciousPatterns = sessionData.suspiciousPatterns || [];
        for (const pattern of suspiciousPatterns) {
            if (pattern.type) {
                patterns.push(pattern.type);
            }
        }

        return patterns;
    }

    getVerificationStats() {
        return {
            totalVerifications: this.verificationHistory.length,
            validSessions: this.verificationHistory.filter(v => v.isValid).length,
            suspiciousSessions: this.suspiciousSessions.length,
            blockedSessions: this.blockedSessions.length,
            averageFraudScore: this.verificationHistory.reduce((sum, v) => sum + v.fraudScore, 0) / this.verificationHistory.length
        };
    }
}

// Export for use in platform
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VerificationEngine;
} 