/**
 * Pattern Detector - Cross-Session Fraud Detection
 * Analyzes patterns across multiple sessions to identify suspicious behavior
 */

class PatternDetector {
    constructor() {
        this.sessionDatabase = new Map();
        this.userProfiles = new Map();
        this.fraudPatterns = new Map();
        this.anomalyThreshold = 0.8;
        this.patternWeights = {
            'speed_hacking': 0.4,
            'score_manipulation': 0.5,
            'input_replay': 0.3,
            'timing_anomalies': 0.2,
            'session_manipulation': 0.6
        };
    }

    async analyzeUserPatterns(userId, sessionData) {
        const analysis = {
            userId: userId,
            timestamp: Date.now(),
            riskScore: 0,
            patterns: [],
            anomalies: [],
            recommendations: []
        };

        try {
            // Store session data
            this.storeSessionData(userId, sessionData);

            // Analyze individual session
            const sessionAnalysis = this.analyzeSessionPatterns(sessionData);
            analysis.patterns.push(...sessionAnalysis.patterns);
            analysis.riskScore += sessionAnalysis.riskScore;

            // Analyze cross-session patterns
            const crossSessionAnalysis = this.analyzeCrossSessionPatterns(userId);
            analysis.patterns.push(...crossSessionAnalysis.patterns);
            analysis.riskScore += crossSessionAnalysis.riskScore;

            // Detect anomalies
            const anomalyAnalysis = this.detectAnomalies(userId, sessionData);
            analysis.anomalies.push(...anomalyAnalysis.anomalies);
            analysis.riskScore += anomalyAnalysis.riskScore;

            // Generate recommendations
            analysis.recommendations = this.generateRecommendations(analysis);

            // Update user profile
            this.updateUserProfile(userId, analysis);

            return analysis;

        } catch (error) {
            analysis.anomalies.push(`Analysis error: ${error.message}`);
            analysis.riskScore = 1.0;
            return analysis;
        }
    }

    storeSessionData(userId, sessionData) {
        if (!this.sessionDatabase.has(userId)) {
            this.sessionDatabase.set(userId, []);
        }

        const userSessions = this.sessionDatabase.get(userId);
        userSessions.push({
            timestamp: Date.now(),
            sessionData: sessionData
        });

        // Keep only last 50 sessions per user
        if (userSessions.length > 50) {
            userSessions.shift();
        }
    }

    analyzeSessionPatterns(sessionData) {
        const patterns = [];
        let riskScore = 0;

        // Check for speed hacking patterns
        const speedPatterns = this.detectSpeedHacking(sessionData);
        if (speedPatterns.length > 0) {
            patterns.push(...speedPatterns);
            riskScore += this.patternWeights.speed_hacking;
        }

        // Check for score manipulation patterns
        const scorePatterns = this.detectScoreManipulation(sessionData);
        if (scorePatterns.length > 0) {
            patterns.push(...scorePatterns);
            riskScore += this.patternWeights.score_manipulation;
        }

        // Check for input replay patterns
        const inputPatterns = this.detectInputReplay(sessionData);
        if (inputPatterns.length > 0) {
            patterns.push(...inputPatterns);
            riskScore += this.patternWeights.input_replay;
        }

        // Check for timing anomalies
        const timingPatterns = this.detectTimingAnomalies(sessionData);
        if (timingPatterns.length > 0) {
            patterns.push(...timingPatterns);
            riskScore += this.patternWeights.timing_anomalies;
        }

        return {
            patterns: patterns,
            riskScore: riskScore
        };
    }

    detectSpeedHacking(sessionData) {
        const patterns = [];
        const gameState = sessionData.gameState;

        // Check for inhuman input speeds
        const inputPatterns = gameState.inputPatterns || [];
        for (let i = 1; i < inputPatterns.length; i++) {
            const timeDiff = inputPatterns[i].timestamp - inputPatterns[i-1].timestamp;
            if (timeDiff < 30) { // Less than 30ms between inputs
                patterns.push({
                    type: 'speed_hacking',
                    severity: 'high',
                    description: `Inhuman input speed: ${timeDiff}ms`,
                    timestamp: inputPatterns[i].timestamp
                });
            }
        }

        // Check for impossible move speeds
        const moves = gameState.moves || [];
        for (let i = 1; i < moves.length; i++) {
            const timeDiff = moves[i].timestamp - moves[i-1].timestamp;
            if (timeDiff < 10) { // Less than 10ms between moves
                patterns.push({
                    type: 'speed_hacking',
                    severity: 'critical',
                    description: `Impossible move speed: ${timeDiff}ms`,
                    timestamp: moves[i].timestamp
                });
            }
        }

        return patterns;
    }

    detectScoreManipulation(sessionData) {
        const patterns = [];
        const gameState = sessionData.gameState;

        // Check for impossible score jumps
        const moves = gameState.moves || [];
        for (const move of moves) {
            if (move.scoreIncrease && move.scoreIncrease > 1000) {
                patterns.push({
                    type: 'score_manipulation',
                    severity: 'high',
                    description: `Impossible score increase: ${move.scoreIncrease}`,
                    timestamp: move.timestamp
                });
            }
        }

        // Check for negative score changes
        if (gameState.score < 0) {
            patterns.push({
                type: 'score_manipulation',
                severity: 'critical',
                description: 'Negative score detected',
                timestamp: Date.now()
            });
        }

        // Check for unrealistic final scores
        if (gameState.score > 1000000) {
            patterns.push({
                type: 'score_manipulation',
                severity: 'medium',
                description: `Unrealistic final score: ${gameState.score}`,
                timestamp: Date.now()
            });
        }

        return patterns;
    }

    detectInputReplay(sessionData) {
        const patterns = [];
        const gameState = sessionData.gameState;

        // Check for exact input repetition
        const inputPatterns = gameState.inputPatterns || [];
        for (let i = 0; i < inputPatterns.length - 10; i++) {
            const sequence1 = inputPatterns.slice(i, i + 5).map(p => p.input);
            const sequence2 = inputPatterns.slice(i + 5, i + 10).map(p => p.input);
            
            if (JSON.stringify(sequence1) === JSON.stringify(sequence2)) {
                patterns.push({
                    type: 'input_replay',
                    severity: 'medium',
                    description: 'Exact input sequence repetition',
                    timestamp: inputPatterns[i + 5].timestamp
                });
            }
        }

        // Check for too-perfect timing patterns
        const timeDiffs = [];
        for (let i = 1; i < inputPatterns.length; i++) {
            timeDiffs.push(inputPatterns[i].timestamp - inputPatterns[i-1].timestamp);
        }

        if (timeDiffs.length > 10) {
            const variance = this.calculateVariance(timeDiffs);
            if (variance < 20) { // Very low variance
                patterns.push({
                    type: 'input_replay',
                    severity: 'high',
                    description: 'Suspiciously consistent input timing',
                    timestamp: Date.now()
                });
            }
        }

        return patterns;
    }

    detectTimingAnomalies(sessionData) {
        const patterns = [];
        const gameState = sessionData.gameState;

        // Check for future timestamps
        const verificationData = gameState.verificationData || [];
        for (const data of verificationData) {
            if (data.timestamp > Date.now()) {
                patterns.push({
                    type: 'timing_anomalies',
                    severity: 'critical',
                    description: 'Future timestamp detected',
                    timestamp: data.timestamp
                });
            }
        }

        // Check for impossible session duration
        if (gameState.startTime && gameState.endTime) {
            const duration = gameState.endTime - gameState.startTime;
            if (duration > 7200000) { // More than 2 hours
                patterns.push({
                    type: 'timing_anomalies',
                    severity: 'medium',
                    description: `Unusually long session: ${duration}ms`,
                    timestamp: Date.now()
                });
            }
        }

        return patterns;
    }

    analyzeCrossSessionPatterns(userId) {
        const patterns = [];
        let riskScore = 0;

        const userSessions = this.sessionDatabase.get(userId) || [];
        if (userSessions.length < 2) {
            return { patterns: [], riskScore: 0 };
        }

        // Analyze score progression patterns
        const scorePatterns = this.analyzeScoreProgression(userSessions);
        patterns.push(...scorePatterns);
        riskScore += scorePatterns.length * 0.1;

        // Analyze timing patterns across sessions
        const timingPatterns = this.analyzeCrossSessionTiming(userSessions);
        patterns.push(...timingPatterns);
        riskScore += timingPatterns.length * 0.1;

        // Analyze input pattern consistency
        const inputPatterns = this.analyzeInputConsistency(userSessions);
        patterns.push(...inputPatterns);
        riskScore += inputPatterns.length * 0.1;

        return {
            patterns: patterns,
            riskScore: riskScore
        };
    }

    analyzeScoreProgression(userSessions) {
        const patterns = [];
        const scores = userSessions.map(s => s.sessionData.gameState.score);

        // Check for impossible score improvements
        for (let i = 1; i < scores.length; i++) {
            const improvement = scores[i] - scores[i-1];
            if (improvement > 50000) { // More than 50k improvement
                patterns.push({
                    type: 'cross_session_anomaly',
                    severity: 'high',
                    description: `Impossible score improvement: ${improvement}`,
                    timestamp: userSessions[i].timestamp
                });
            }
        }

        return patterns;
    }

    analyzeCrossSessionTiming(userSessions) {
        const patterns = [];

        // Check for impossible session timing
        for (let i = 1; i < userSessions.length; i++) {
            const timeDiff = userSessions[i].timestamp - userSessions[i-1].timestamp;
            if (timeDiff < 1000) { // Less than 1 second between sessions
                patterns.push({
                    type: 'cross_session_anomaly',
                    severity: 'medium',
                    description: `Impossible session timing: ${timeDiff}ms`,
                    timestamp: userSessions[i].timestamp
                });
            }
        }

        return patterns;
    }

    analyzeInputConsistency(userSessions) {
        const patterns = [];

        // Check for suspicious input pattern consistency
        const inputPatterns = userSessions.map(s => s.sessionData.gameState.inputPatterns || []);
        
        for (let i = 1; i < inputPatterns.length; i++) {
            const pattern1 = this.extractInputPattern(inputPatterns[i-1]);
            const pattern2 = this.extractInputPattern(inputPatterns[i]);
            
            if (this.calculatePatternSimilarity(pattern1, pattern2) > 0.95) {
                patterns.push({
                    type: 'cross_session_anomaly',
                    severity: 'medium',
                    description: 'Suspiciously similar input patterns across sessions',
                    timestamp: userSessions[i].timestamp
                });
            }
        }

        return patterns;
    }

    extractInputPattern(inputPatterns) {
        return inputPatterns.map(p => p.input).join(',');
    }

    calculatePatternSimilarity(pattern1, pattern2) {
        if (pattern1 === pattern2) return 1.0;
        if (pattern1.length === 0 || pattern2.length === 0) return 0.0;
        
        const longer = pattern1.length > pattern2.length ? pattern1 : pattern2;
        const shorter = pattern1.length > pattern2.length ? pattern2 : pattern1;
        
        let matches = 0;
        for (let i = 0; i < shorter.length; i++) {
            if (longer.includes(shorter[i])) {
                matches++;
            }
        }
        
        return matches / longer.length;
    }

    detectAnomalies(userId, sessionData) {
        const anomalies = [];
        let riskScore = 0;

        // Compare with user's historical patterns
        const userProfile = this.userProfiles.get(userId);
        if (userProfile) {
            const historicalAnomalies = this.compareWithHistory(userProfile, sessionData);
            anomalies.push(...historicalAnomalies);
            riskScore += historicalAnomalies.length * 0.2;
        }

        // Check for statistical anomalies
        const statisticalAnomalies = this.detectStatisticalAnomalies(sessionData);
        anomalies.push(...statisticalAnomalies);
        riskScore += statisticalAnomalies.length * 0.15;

        return {
            anomalies: anomalies,
            riskScore: riskScore
        };
    }

    compareWithHistory(userProfile, sessionData) {
        const anomalies = [];

        // Compare score with historical average
        const avgScore = userProfile.averageScore || 0;
        const currentScore = sessionData.gameState.score;
        
        if (avgScore > 0 && currentScore > avgScore * 3) {
            anomalies.push({
                type: 'historical_anomaly',
                severity: 'medium',
                description: `Score significantly above historical average`,
                details: `Current: ${currentScore}, Average: ${avgScore}`
            });
        }

        return anomalies;
    }

    detectStatisticalAnomalies(sessionData) {
        const anomalies = [];
        const gameState = sessionData.gameState;

        // Check for statistical outliers in input patterns
        const inputPatterns = gameState.inputPatterns || [];
        if (inputPatterns.length > 20) {
            const timeDiffs = [];
            for (let i = 1; i < inputPatterns.length; i++) {
                timeDiffs.push(inputPatterns[i].timestamp - inputPatterns[i-1].timestamp);
            }

            const mean = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
            const stdDev = Math.sqrt(timeDiffs.reduce((sum, diff) => sum + Math.pow(diff - mean, 2), 0) / timeDiffs.length);

            // Check for outliers (more than 3 standard deviations)
            for (let i = 0; i < timeDiffs.length; i++) {
                if (Math.abs(timeDiffs[i] - mean) > stdDev * 3) {
                    anomalies.push({
                        type: 'statistical_anomaly',
                        severity: 'low',
                        description: 'Input timing statistical outlier',
                        details: `Value: ${timeDiffs[i]}, Mean: ${mean}, StdDev: ${stdDev}`
                    });
                }
            }
        }

        return anomalies;
    }

    generateRecommendations(analysis) {
        const recommendations = [];

        if (analysis.riskScore > 0.8) {
            recommendations.push('Immediate manual review required');
            recommendations.push('Consider temporary account suspension');
        } else if (analysis.riskScore > 0.5) {
            recommendations.push('Enhanced monitoring recommended');
            recommendations.push('Flag for follow-up review');
        } else if (analysis.riskScore > 0.2) {
            recommendations.push('Continue normal monitoring');
        } else {
            recommendations.push('Session appears legitimate');
        }

        return recommendations;
    }

    updateUserProfile(userId, analysis) {
        if (!this.userProfiles.has(userId)) {
            this.userProfiles.set(userId, {
                userId: userId,
                sessionCount: 0,
                averageScore: 0,
                totalRiskScore: 0,
                lastAnalysis: null
            });
        }

        const profile = this.userProfiles.get(userId);
        profile.sessionCount++;
        profile.totalRiskScore += analysis.riskScore;
        profile.lastAnalysis = analysis;

        // Update average score
        const currentScore = analysis.sessionData?.gameState?.score || 0;
        if (currentScore > 0) {
            profile.averageScore = (profile.averageScore * (profile.sessionCount - 1) + currentScore) / profile.sessionCount;
        }
    }

    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    }

    getPatternStats() {
        return {
            totalUsers: this.userProfiles.size,
            totalSessions: Array.from(this.sessionDatabase.values()).reduce((sum, sessions) => sum + sessions.length, 0),
            averageRiskScore: Array.from(this.userProfiles.values()).reduce((sum, profile) => sum + profile.totalRiskScore, 0) / this.userProfiles.size
        };
    }
}

// Export for use in platform
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatternDetector;
} 