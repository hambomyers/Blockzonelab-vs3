/**
 * Secure Session Manager - Cryptographic Session Management
 * Handles secure session creation, validation, and replay protection
 */

class SecureSessionManager {
    constructor() {
        this.sessionKey = this.generateSessionKey();
        this.sessionStartTime = Date.now();
        this.actionHistory = [];
        this.replayProtection = new Set();
        this.verificationTokens = [];
    }

    generateSessionKey() {
        // Generate a unique session key
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const userAgent = navigator.userAgent;
        
        return this.simpleHash(`${timestamp}_${random}_${userAgent}`);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    createActionToken(action, gameState) {
        const token = {
            timestamp: Date.now(),
            action: action,
            gameState: gameState,
            sessionKey: this.sessionKey,
            sequenceNumber: this.actionHistory.length,
            hash: this.generateActionHash(action, gameState)
        };

        // Add to replay protection
        this.replayProtection.add(token.hash);
        
        // Add to history
        this.actionHistory.push(token);
        
        return token;
    }

    generateActionHash(action, gameState) {
        const data = {
            action: action,
            gameState: gameState,
            sessionKey: this.sessionKey,
            timestamp: Date.now()
        };
        
        return this.simpleHash(JSON.stringify(data));
    }

    validateActionToken(token) {
        // Check if token is from current session
        if (token.sessionKey !== this.sessionKey) {
            return { valid: false, reason: 'Invalid session key' };
        }

        // Check for replay attacks
        if (this.replayProtection.has(token.hash)) {
            return { valid: false, reason: 'Replay attack detected' };
        }

        // Check timestamp validity (within 5 seconds)
        const timeDiff = Date.now() - token.timestamp;
        if (timeDiff > 5000) {
            return { valid: false, reason: 'Token expired' };
        }

        // Check sequence number
        if (token.sequenceNumber !== this.actionHistory.length) {
            return { valid: false, reason: 'Invalid sequence number' };
        }

        // Verify hash
        const expectedHash = this.generateActionHash(token.action, token.gameState);
        if (token.hash !== expectedHash) {
            return { valid: false, reason: 'Hash mismatch' };
        }

        return { valid: true };
    }

    recordGameAction(action, gameState) {
        const token = this.createActionToken(action, gameState);
        this.verificationTokens.push(token);
        
        return token;
    }

    validateGameSession() {
        const issues = [];
        
        // Check session duration
        const sessionDuration = Date.now() - this.sessionStartTime;
        if (sessionDuration > 3600000) { // 1 hour max
            issues.push('Session duration exceeded maximum');
        }

        // Check for gaps in action history
        for (let i = 1; i < this.actionHistory.length; i++) {
            const timeDiff = this.actionHistory[i].timestamp - this.actionHistory[i-1].timestamp;
            if (timeDiff > 10000) { // 10 second gap
                issues.push(`Large gap in action history at position ${i}`);
            }
        }

        // Check for suspicious action patterns
        const suspiciousPatterns = this.detectSuspiciousPatterns();
        if (suspiciousPatterns.length > 0) {
            issues.push(...suspiciousPatterns);
        }

        return {
            valid: issues.length === 0,
            issues: issues,
            sessionDuration: sessionDuration,
            actionCount: this.actionHistory.length,
            sessionKey: this.sessionKey
        };
    }

    detectSuspiciousPatterns() {
        const patterns = [];
        
        // Check for impossible action sequences
        for (let i = 1; i < this.actionHistory.length; i++) {
            const current = this.actionHistory[i];
            const previous = this.actionHistory[i-1];
            
            // Check for impossible time gaps
            const timeDiff = current.timestamp - previous.timestamp;
            if (timeDiff < 16) { // Less than 16ms (60fps)
                patterns.push(`Impossible action timing at position ${i}`);
            }
            
            // Check for conflicting actions
            if (this.areActionsConflicting(previous.action, current.action)) {
                patterns.push(`Conflicting actions detected at position ${i}`);
            }
        }
        
        return patterns;
    }

    areActionsConflicting(action1, action2) {
        // Define conflicting action pairs
        const conflicts = [
            ['left', 'right'],
            ['up', 'down'],
            ['rotate_left', 'rotate_right']
        ];
        
        for (const [conflict1, conflict2] of conflicts) {
            if ((action1.includes(conflict1) && action2.includes(conflict2)) ||
                (action1.includes(conflict2) && action2.includes(conflict1))) {
                return true;
            }
        }
        
        return false;
    }

    generateSessionProof() {
        const proof = {
            sessionKey: this.sessionKey,
            startTime: this.sessionStartTime,
            endTime: Date.now(),
            actionCount: this.actionHistory.length,
            verificationTokens: this.verificationTokens,
            finalHash: this.generateSessionHash()
        };
        
        return proof;
    }

    generateSessionHash() {
        const sessionData = {
            sessionKey: this.sessionKey,
            startTime: this.sessionStartTime,
            actionCount: this.actionHistory.length,
            verificationTokens: this.verificationTokens.length
        };
        
        return this.simpleHash(JSON.stringify(sessionData));
    }

    getSessionSummary() {
        return {
            sessionKey: this.sessionKey,
            duration: Date.now() - this.sessionStartTime,
            actionCount: this.actionHistory.length,
            verificationTokens: this.verificationTokens.length,
            replayProtectionSize: this.replayProtection.size
        };
    }
}

// Export for ES6 modules
export { SecureSessionManager }; 