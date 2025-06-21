/**
 * Anti-Abuse Management System
 * Comprehensive protection against gaming system abuse
 * Part of BlockZone Lab's unified identity consolidation
 */

import { ImportPaths } from '../../utils/ImportPaths.js';
import { deviceFingerprinter } from './DeviceFingerprinter.js';

class AntiAbuseManager {
    constructor() {
        this.riskThresholds = {
            LOW: 0.2,
            MEDIUM: 0.5,
            HIGH: 0.8,
            CRITICAL: 0.95
        };
        
        this.restrictions = new Map();
        this.ipCache = new Map();
        this.deviceCache = new Map();
        this.behaviorCache = new Map();
        
        this.initializeFromStorage();
    }

    /**
     * Validate new player for free game eligibility
     * @param {string} deviceFingerprint - Device fingerprint
     * @param {string} ipAddress - Player's IP address
     * @param {Object} additionalData - Optional behavioral data
     * @returns {Promise<Object>} Validation result with risk assessment
     */
    async validateNewPlayer(deviceFingerprint, ipAddress, additionalData = {}) {
        try {
            const checks = await Promise.all([
                this.checkIPRateLimit(ipAddress),
                this.checkDeviceHistory(deviceFingerprint),
                this.checkBehavioralPatterns(deviceFingerprint, additionalData),
                this.checkGeolocation(ipAddress),
                this.checkTimePatterns(additionalData.timestamp)
            ]);

            const riskScore = this.evaluateRiskScore(checks);
            const recommendation = this.getRiskRecommendation(riskScore);
            
            // Log the assessment
            this.logSecurityEvent('player_validation', {
                deviceFingerprint,
                ipAddress: this.hashIP(ipAddress),
                riskScore,
                recommendation,
                checks: checks.map(check => ({ 
                    type: check.type, 
                    score: check.score, 
                    passed: check.passed 
                }))
            });

            return {
                allowed: recommendation.action === 'allow',
                riskLevel: recommendation.level,
                riskScore,
                message: recommendation.message,
                restrictions: recommendation.restrictions,
                retryAfter: recommendation.retryAfter,
                requiresVerification: recommendation.requiresVerification,
                details: checks
            };
        } catch (error) {
            console.error('Anti-abuse validation failed:', error);
            
            // Fail secure - be more restrictive on errors
            return {
                allowed: false,
                riskLevel: 'HIGH',
                riskScore: 0.9,
                message: 'Security validation temporarily unavailable. Please try again later.',
                restrictions: ['temporary_restriction'],
                retryAfter: 300000 // 5 minutes
            };
        }
    }

    /**
     * Check IP address rate limiting
     * @private
     */
    async checkIPRateLimit(ipAddress) {
        const hashedIP = this.hashIP(ipAddress);
        const now = Date.now();
        const ipData = this.ipCache.get(hashedIP) || { 
            attempts: [], 
            firstSeen: now,
            geoData: null 
        };

        // Clean old attempts (24 hour window)
        ipData.attempts = ipData.attempts.filter(timestamp => 
            now - timestamp < 86400000
        );

        const dailyAttempts = ipData.attempts.length;
        const recentAttempts = ipData.attempts.filter(timestamp => 
            now - timestamp < 3600000 // 1 hour
        ).length;

        // Rate limiting thresholds
        let score = 0;
        if (dailyAttempts > 10) score += 0.3;
        if (dailyAttempts > 20) score += 0.4;
        if (recentAttempts > 5) score += 0.5;
        if (recentAttempts > 3) score += 0.3;

        // Record this attempt
        ipData.attempts.push(now);
        this.ipCache.set(hashedIP, ipData);

        return {
            type: 'ip_rate_limit',
            score: Math.min(score, 1),
            passed: score < this.riskThresholds.MEDIUM,
            data: {
                dailyAttempts,
                recentAttempts,
                accountAge: now - ipData.firstSeen
            }
        };
    }

    /**
     * Check device history and reputation
     * @private
     */
    async checkDeviceHistory(deviceFingerprint) {
        const deviceData = this.deviceCache.get(deviceFingerprint) || {
            firstSeen: Date.now(),
            gamesSessions: [],
            violations: [],
            reputation: 0.5 // Neutral starting reputation
        };

        const now = Date.now();
        const accountAge = now - deviceData.firstSeen;
        const recentSessions = deviceData.gamesSessions.filter(session => 
            now - session.timestamp < 86400000
        ).length;

        let score = 0;

        // New device penalty (devices under 1 hour old are suspicious)
        if (accountAge < 3600000) score += 0.3;
        
        // Multiple sessions in short time
        if (recentSessions > 5) score += 0.4;
        if (recentSessions > 10) score += 0.5;

        // Violation history
        const recentViolations = deviceData.violations.filter(violation => 
            now - violation.timestamp < 7 * 86400000 // 7 days
        ).length;
        score += recentViolations * 0.2;

        // Reputation factor
        if (deviceData.reputation < 0.3) score += 0.3;
        if (deviceData.reputation > 0.7) score -= 0.2;

        return {
            type: 'device_history',
            score: Math.max(0, Math.min(score, 1)),
            passed: score < this.riskThresholds.MEDIUM,
            data: {
                accountAge,
                recentSessions,
                reputation: deviceData.reputation,
                violationsCount: recentViolations
            }
        };
    }

    /**
     * Analyze behavioral patterns
     * @private
     */
    async checkBehavioralPatterns(deviceFingerprint, additionalData) {
        const behaviorData = this.behaviorCache.get(deviceFingerprint) || {
            sessions: [],
            playPatterns: {},
            averageSession: 0
        };

        let score = 0;

        // Check for bot-like behavior
        if (additionalData.mouseMovements) {
            const movements = additionalData.mouseMovements;
            if (movements.length > 0) {
                const avgSpeed = movements.reduce((sum, move) => sum + move.speed, 0) / movements.length;
                const avgAcceleration = movements.reduce((sum, move) => sum + Math.abs(move.acceleration || 0), 0) / movements.length;
                
                // Too consistent movement patterns suggest automation
                const speedVariance = this.calculateVariance(movements.map(m => m.speed));
                if (speedVariance < 10) score += 0.4; // Very consistent speed
                if (avgSpeed > 1000) score += 0.3; // Unrealistically fast
                if (avgAcceleration < 5) score += 0.2; // Too smooth acceleration
            }
        }

        // Check timing patterns
        if (additionalData.keystrokes) {
            const keystrokes = additionalData.keystrokes;
            if (keystrokes.length > 10) {
                const intervals = [];
                for (let i = 1; i < keystrokes.length; i++) {
                    intervals.push(keystrokes[i].timestamp - keystrokes[i-1].timestamp);
                }
                
                const intervalVariance = this.calculateVariance(intervals);
                if (intervalVariance < 100) score += 0.3; // Too consistent typing
            }
        }

        // Check session patterns
        if (behaviorData.sessions.length > 3) {
            const sessionLengths = behaviorData.sessions.map(s => s.duration);
            const lengthVariance = this.calculateVariance(sessionLengths);
            if (lengthVariance < 1000) score += 0.2; // Too consistent session lengths
        }

        return {
            type: 'behavioral_patterns',
            score: Math.min(score, 1),
            passed: score < this.riskThresholds.MEDIUM,
            data: {
                sessionsAnalyzed: behaviorData.sessions.length,
                hasMouseData: !!additionalData.mouseMovements,
                hasKeystrokeData: !!additionalData.keystrokes
            }
        };
    }

    /**
     * Check geolocation patterns
     * @private
     */
    async checkGeolocation(ipAddress) {
        // This would typically use a geolocation service
        // For now, we'll simulate basic geographic checking
        
        const hashedIP = this.hashIP(ipAddress);
        const ipData = this.ipCache.get(hashedIP);
        
        let score = 0;

        // Check for known proxy/VPN patterns (simplified)
        const suspiciousPatterns = [
            /^10\./, /^172\.1[6-9]\./, /^172\.2\d\./, /^172\.3[01]\./, // Private ranges
            /^192\.168\./, // Local networks
            /^127\./ // Localhost
        ];

        if (suspiciousPatterns.some(pattern => pattern.test(ipAddress))) {
            score += 0.2;
        }

        // Check for data center IP ranges (would need external service)
        // This is a placeholder for more sophisticated checking
        if (this.isDataCenterIP(ipAddress)) {
            score += 0.4;
        }

        return {
            type: 'geolocation',
            score: Math.min(score, 1),
            passed: score < this.riskThresholds.MEDIUM,
            data: {
                ipHash: hashedIP,
                suspiciousIP: score > 0
            }
        };
    }

    /**
     * Check time-based patterns
     * @private
     */
    async checkTimePatterns(timestamp = Date.now()) {
        const hour = new Date(timestamp).getHours();
        const dayOfWeek = new Date(timestamp).getDay();
        
        let score = 0;

        // Suspicious hours (very early morning might indicate automation)
        if (hour >= 2 && hour <= 5) score += 0.1;
        
        // Most human activity happens during reasonable hours
        if (hour >= 6 && hour <= 23) score -= 0.1;

        return {
            type: 'time_patterns',
            score: Math.max(0, Math.min(score, 1)),
            passed: score < this.riskThresholds.LOW,
            data: {
                hour,
                dayOfWeek,
                timestamp
            }
        };
    }

    /**
     * Evaluate overall risk score from individual checks
     * @private
     */
    evaluateRiskScore(checks) {
        const weights = {
            'ip_rate_limit': 0.3,
            'device_history': 0.25,
            'behavioral_patterns': 0.25,
            'geolocation': 0.15,
            'time_patterns': 0.05
        };

        let totalScore = 0;
        let totalWeight = 0;

        checks.forEach(check => {
            const weight = weights[check.type] || 0.1;
            totalScore += check.score * weight;
            totalWeight += weight;
        });

        return totalWeight > 0 ? totalScore / totalWeight : 0.5;
    }

    /**
     * Get recommendation based on risk score
     * @private
     */
    getRiskRecommendation(riskScore) {
        if (riskScore < this.riskThresholds.LOW) {
            return {
                action: 'allow',
                level: 'LOW',
                message: 'Welcome! Enjoy your free daily game!',
                restrictions: [],
                requiresVerification: false
            };
        } else if (riskScore < this.riskThresholds.MEDIUM) {
            return {
                action: 'allow_with_monitoring',
                level: 'MEDIUM',
                message: 'Welcome! Your free game is ready.',
                restrictions: ['enhanced_monitoring'],
                requiresVerification: false
            };
        } else if (riskScore < this.riskThresholds.HIGH) {
            return {
                action: 'verify',
                level: 'HIGH',
                message: 'Please verify you\'re human to continue.',
                restrictions: ['require_captcha', 'enhanced_monitoring'],
                requiresVerification: true
            };
        } else {
            const retryAfter = this.calculateRetryDelay(riskScore);
            return {
                action: 'block',
                level: 'CRITICAL',
                message: 'Daily limit reached. Try again later.',
                restrictions: ['blocked', 'manual_review_required'],
                requiresVerification: true,
                retryAfter
            };
        }
    }

    /**
     * Calculate retry delay based on risk score
     * @private
     */
    calculateRetryDelay(riskScore) {
        // Progressive delays: 5min to 24 hours based on risk
        const minDelay = 5 * 60 * 1000; // 5 minutes
        const maxDelay = 24 * 60 * 60 * 1000; // 24 hours
        
        const factor = (riskScore - this.riskThresholds.HIGH) / (1 - this.riskThresholds.HIGH);
        return Math.round(minDelay + (maxDelay - minDelay) * factor);
    }

    /**
     * Record security event for monitoring
     * @private
     */
    logSecurityEvent(eventType, data) {
        const event = {
            type: eventType,
            timestamp: Date.now(),
            data
        };

        // Store in memory (in production, this would go to a logging service)
        if (!this.securityLog) this.securityLog = [];
        this.securityLog.push(event);
        
        // Keep only last 1000 events in memory
        if (this.securityLog.length > 1000) {
            this.securityLog = this.securityLog.slice(-1000);
        }

        // In production, send to analytics/monitoring service
        console.log('Security Event:', event);
    }

    /**
     * Hash IP address for privacy
     * @private
     */
    hashIP(ipAddress) {
        // Simple hash for privacy (in production, use proper cryptographic hash)
        let hash = 0;
        for (let i = 0; i < ipAddress.length; i++) {
            const char = ipAddress.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Check if IP is from a data center (placeholder)
     * @private
     */
    isDataCenterIP(ipAddress) {
        // This would typically use a service like IPQualityScore or similar
        // For now, just basic checks
        const dataCenter patterns = [
            /^5\./, // Some cloud providers
            /^31\./, // Some hosting providers
        ];
        
        return dataCenter.some(pattern => pattern.test(ipAddress));
    }

    /**
     * Calculate variance of an array of numbers
     * @private
     */
    calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    }

    /**
     * Initialize from localStorage
     * @private
     */
    initializeFromStorage() {
        try {
            const stored = localStorage.getItem('bz_antiabuse_data');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.ipCache) {
                    this.ipCache = new Map(data.ipCache);
                }
                if (data.deviceCache) {
                    this.deviceCache = new Map(data.deviceCache);
                }
                if (data.behaviorCache) {
                    this.behaviorCache = new Map(data.behaviorCache);
                }
            }
        } catch (error) {
            console.warn('Could not load anti-abuse data from storage:', error);
        }
    }

    /**
     * Save data to localStorage
     */
    saveToStorage() {
        try {
            const data = {
                ipCache: Array.from(this.ipCache.entries()),
                deviceCache: Array.from(this.deviceCache.entries()),
                behaviorCache: Array.from(this.behaviorCache.entries()),
                timestamp: Date.now()
            };
            localStorage.setItem('bz_antiabuse_data', JSON.stringify(data));
        } catch (error) {
            console.warn('Could not save anti-abuse data to storage:', error);
        }
    }

    /**
     * Get current security metrics
     */
    getSecurityMetrics() {
        const now = Date.now();
        const last24h = now - 86400000;
        
        const recentEvents = (this.securityLog || []).filter(event => 
            event.timestamp > last24h
        );

        const blockedAttempts = recentEvents.filter(event => 
            event.data.recommendation && event.data.recommendation.action === 'block'
        ).length;

        const flaggedBehavior = recentEvents.filter(event => 
            event.data.riskScore > this.riskThresholds.MEDIUM
        ).length;

        return {
            totalValidations: recentEvents.length,
            blockedAttempts,
            flaggedBehavior,
            avgRiskScore: recentEvents.length > 0 ? 
                recentEvents.reduce((sum, event) => sum + (event.data.riskScore || 0), 0) / recentEvents.length : 0,
            systemHealth: 'operational'
        };
    }

    /**
     * Update device reputation based on behavior
     */
    updateDeviceReputation(deviceFingerprint, behavior) {
        const deviceData = this.deviceCache.get(deviceFingerprint) || {
            firstSeen: Date.now(),
            gamesSessions: [],
            violations: [],
            reputation: 0.5
        };

        if (behavior === 'positive') {
            deviceData.reputation = Math.min(1, deviceData.reputation + 0.1);
        } else if (behavior === 'negative') {
            deviceData.reputation = Math.max(0, deviceData.reputation - 0.2);
            deviceData.violations.push({
                timestamp: Date.now(),
                type: behavior
            });
        }

        this.deviceCache.set(deviceFingerprint, deviceData);
        this.saveToStorage();
    }
}

// Export singleton instance
export const antiAbuseManager = new AntiAbuseManager();
