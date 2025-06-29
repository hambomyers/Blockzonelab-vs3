/**
 * Secure Input Controller - Input Validation and Pattern Detection
 * Validates inputs, detects suspicious patterns, and prevents manipulation
 */

class SecureInputController {
    constructor() {
        this.inputHistory = [];
        this.patternDetector = new PatternDetector();
        this.inputValidator = new InputValidator();
        this.manipulationDetector = new ManipulationDetector();
        
        this.maxInputsPerSecond = 10; // Maximum reasonable input rate
        this.suspiciousPatterns = [];
        this.blockedInputs = [];
    }

    processInput(input, gameState) {
        const inputRecord = {
            timestamp: Date.now(),
            input: input,
            gameState: gameState,
            isValid: false,
            reason: null
        };

        // Validate input format
        const validation = this.inputValidator.validateInput(input);
        if (!validation.valid) {
            inputRecord.reason = validation.reason;
            this.blockedInputs.push(inputRecord);
            return { processed: false, reason: validation.reason };
        }

        // Check input rate
        const rateCheck = this.checkInputRate();
        if (!rateCheck.valid) {
            inputRecord.reason = rateCheck.reason;
            this.blockedInputs.push(inputRecord);
            return { processed: false, reason: rateCheck.reason };
        }

        // Detect suspicious patterns
        const patternCheck = this.patternDetector.detectPatterns(input, this.inputHistory);
        if (patternCheck.suspicious) {
            inputRecord.reason = patternCheck.reason;
            this.suspiciousPatterns.push(inputRecord);
        }

        // Check for manipulation
        const manipulationCheck = this.manipulationDetector.checkManipulation(input, gameState);
        if (manipulationCheck.detected) {
            inputRecord.reason = manipulationCheck.reason;
            this.blockedInputs.push(inputRecord);
            return { processed: false, reason: manipulationCheck.reason };
        }

        // Input is valid
        inputRecord.isValid = true;
        this.inputHistory.push(inputRecord);

        return { processed: true, inputRecord: inputRecord };
    }

    checkInputRate() {
        const now = Date.now();
        const oneSecondAgo = now - 1000;
        
        // Count inputs in the last second
        const recentInputs = this.inputHistory.filter(
            record => record.timestamp > oneSecondAgo
        );

        if (recentInputs.length >= this.maxInputsPerSecond) {
            return {
                valid: false,
                reason: `Input rate exceeded: ${recentInputs.length} inputs per second`
            };
        }

        return { valid: true };
    }

    getInputSummary() {
        return {
            totalInputs: this.inputHistory.length,
            validInputs: this.inputHistory.filter(i => i.isValid).length,
            blockedInputs: this.blockedInputs.length,
            suspiciousPatterns: this.suspiciousPatterns.length,
            averageInputRate: this.calculateAverageInputRate()
        };
    }

    calculateAverageInputRate() {
        if (this.inputHistory.length < 2) return 0;
        
        const firstInput = this.inputHistory[0].timestamp;
        const lastInput = this.inputHistory[this.inputHistory.length - 1].timestamp;
        const duration = (lastInput - firstInput) / 1000; // seconds
        
        return this.inputHistory.length / duration;
    }
}

class InputValidator {
    constructor() {
        this.validInputs = [
            'left', 'right', 'down', 'up',
            'rotate_left', 'rotate_right',
            'drop', 'hold', 'pause', 'resume'
        ];
        
        this.inputConstraints = {
            'left': { maxPerSecond: 5 },
            'right': { maxPerSecond: 5 },
            'down': { maxPerSecond: 10 },
            'up': { maxPerSecond: 3 },
            'rotate_left': { maxPerSecond: 3 },
            'rotate_right': { maxPerSecond: 3 },
            'drop': { maxPerSecond: 2 },
            'hold': { maxPerSecond: 1 }
        };
    }

    validateInput(input) {
        // Check if input is a string
        if (typeof input !== 'string') {
            return { valid: false, reason: 'Input must be a string' };
        }

        // Check if input is in valid list
        if (!this.validInputs.includes(input)) {
            return { valid: false, reason: `Invalid input: ${input}` };
        }

        // Check input length
        if (input.length > 20) {
            return { valid: false, reason: 'Input too long' };
        }

        // Check for suspicious characters
        if (/[<>\"'&]/.test(input)) {
            return { valid: false, reason: 'Input contains suspicious characters' };
        }

        return { valid: true };
    }
}

class PatternDetector {
    constructor() {
        this.suspiciousPatterns = [
            'exact_repetition',
            'impossible_combinations',
            'inhuman_timing',
            'automated_sequences'
        ];
    }

    detectPatterns(input, inputHistory) {
        const patterns = [];

        // Check for exact repetition
        if (this.checkExactRepetition(input, inputHistory)) {
            patterns.push('exact_repetition');
        }

        // Check for impossible combinations
        if (this.checkImpossibleCombinations(input, inputHistory)) {
            patterns.push('impossible_combinations');
        }

        // Check for inhuman timing
        if (this.checkInhumanTiming(inputHistory)) {
            patterns.push('inhuman_timing');
        }

        // Check for automated sequences
        if (this.checkAutomatedSequences(inputHistory)) {
            patterns.push('automated_sequences');
        }

        return {
            suspicious: patterns.length > 0,
            patterns: patterns,
            reason: patterns.length > 0 ? `Detected patterns: ${patterns.join(', ')}` : null
        };
    }

    checkExactRepetition(input, inputHistory) {
        if (inputHistory.length < 3) return false;

        const lastThree = inputHistory.slice(-3).map(record => record.input);
        return lastThree.every(i => i === input);
    }

    checkImpossibleCombinations(input, inputHistory) {
        if (inputHistory.length === 0) return false;

        const lastInput = inputHistory[inputHistory.length - 1].input;
        
        // Check for conflicting inputs
        const conflicts = [
            ['left', 'right'],
            ['rotate_left', 'rotate_right']
        ];

        for (const [conflict1, conflict2] of conflicts) {
            if ((lastInput === conflict1 && input === conflict2) ||
                (lastInput === conflict2 && input === conflict1)) {
                return true;
            }
        }

        return false;
    }

    checkInhumanTiming(inputHistory) {
        if (inputHistory.length < 2) return false;

        const recentInputs = inputHistory.slice(-10);
        const timeDiffs = [];

        for (let i = 1; i < recentInputs.length; i++) {
            const diff = recentInputs[i].timestamp - recentInputs[i-1].timestamp;
            timeDiffs.push(diff);
        }

        // Check for inhumanly consistent timing
        const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
        const variance = timeDiffs.reduce((sum, diff) => sum + Math.pow(diff - avgDiff, 2), 0) / timeDiffs.length;

        // If variance is too low, it's suspicious
        return variance < 100; // Less than 100ms variance
    }

    checkAutomatedSequences(inputHistory) {
        if (inputHistory.length < 10) return false;

        const recentInputs = inputHistory.slice(-20).map(record => record.input);
        
        // Look for repeating sequences
        for (let seqLength = 3; seqLength <= 6; seqLength++) {
            if (this.hasRepeatingSequence(recentInputs, seqLength)) {
                return true;
            }
        }

        return false;
    }

    hasRepeatingSequence(inputs, seqLength) {
        for (let i = 0; i <= inputs.length - seqLength * 2; i++) {
            const seq1 = inputs.slice(i, i + seqLength);
            const seq2 = inputs.slice(i + seqLength, i + seqLength * 2);
            
            if (JSON.stringify(seq1) === JSON.stringify(seq2)) {
                return true;
            }
        }
        return false;
    }
}

class ManipulationDetector {
    constructor() {
        this.manipulationSignals = [];
    }

    checkManipulation(input, gameState) {
        const signals = [];

        // Check for impossible game state changes
        if (this.checkImpossibleStateChange(input, gameState)) {
            signals.push('impossible_state_change');
        }

        // Check for memory manipulation indicators
        if (this.checkMemoryManipulation(gameState)) {
            signals.push('memory_manipulation');
        }

        // Check for timing manipulation
        if (this.checkTimingManipulation(gameState)) {
            signals.push('timing_manipulation');
        }

        return {
            detected: signals.length > 0,
            signals: signals,
            reason: signals.length > 0 ? `Manipulation detected: ${signals.join(', ')}` : null
        };
    }

    checkImpossibleStateChange(input, gameState) {
        // Check for impossible score changes
        if (gameState.score < 0) {
            return true;
        }

        // Check for impossible level changes
        if (gameState.level < 1 || gameState.level > 100) {
            return true;
        }

        // Check for impossible piece positions
        if (gameState.activePiece) {
            const pos = gameState.activePiece.position;
            if (pos.x < 0 || pos.x > 9 || pos.y < 0 || pos.y > 19) {
                return true;
            }
        }

        return false;
    }

    checkMemoryManipulation(gameState) {
        // Check for corrupted game state
        if (!gameState || typeof gameState !== 'object') {
            return true;
        }

        // Check for missing required properties
        const requiredProps = ['score', 'level', 'lines'];
        for (const prop of requiredProps) {
            if (!(prop in gameState)) {
                return true;
            }
        }

        return false;
    }

    checkTimingManipulation(gameState) {
        // Check for impossible timing in game state
        if (gameState.timestamp && gameState.timestamp > Date.now()) {
            return true;
        }

        return false;
    }
}

// Export for ES6 modules
export { 
    SecureInputController, 
    InputValidator, 
    PatternDetector, 
    ManipulationDetector 
}; 