/**
 * Viral Status System - BlockZone Lab
 * 3-tier social status system with customizable effects
 */

export class ViralStatusSystem {
    constructor() {
        this.tiers = {
            bronze: { min: 1, max: 5, styles: 1 },
            silver: { min: 6, max: 30, styles: 2 },
            gold: { min: 31, max: Infinity, styles: 3 }
        };
        
        this.effects = {
            bronze: {
                style1: { glow: 'subtle', intensity: 0.3 }
            },
            silver: {
                style1: { glow: 'bright', sparkles: true, intensity: 0.6 },
                style2: { glow: 'bright', waves: true, intensity: 0.6 }
            },
            gold: {
                style1: { glow: 'intense', particles: true, intensity: 0.9 },
                style2: { glow: 'intense', lightning: true, intensity: 0.9 },
                style3: { glow: 'intense', neonTrail: true, intensity: 0.9 }
            }
        };
    }

    /**
     * Get user's viral status based on referral count
     */
    getStatus(referralCount) {
        if (referralCount >= this.tiers.gold.min) {
            return { tier: 'gold', referralCount };
        } else if (referralCount >= this.tiers.silver.min) {
            return { tier: 'silver', referralCount };
        } else if (referralCount >= this.tiers.bronze.min) {
            return { tier: 'bronze', referralCount };
        } else {
            return { tier: 'none', referralCount };
        }
    }

    /**
     * Get available styles for a tier
     */
    getAvailableStyles(tier) {
        if (!this.tiers[tier]) return [];
        
        const styleCount = this.tiers[tier].styles;
        const styles = [];
        
        for (let i = 1; i <= styleCount; i++) {
            styles.push(`style${i}`);
        }
        
        return styles;
    }

    /**
     * Apply viral status effects to a DOM element
     */
    applyStatusEffects(element, status, selectedStyle = 'style1') {
        if (!status || status.tier === 'none') return;
        
        const effects = this.effects[status.tier][selectedStyle];
        if (!effects) return;
        
        // Remove any existing effects
        this.removeStatusEffects(element);
        
        // Apply glow effect
        if (effects.glow) {
            this.applyGlowEffect(element, effects.glow, effects.intensity);
        }
        
        // Apply additional effects
        if (effects.sparkles) this.applySparkleEffect(element);
        if (effects.waves) this.applyWaveEffect(element);
        if (effects.particles) this.applyParticleEffect(element);
        if (effects.lightning) this.applyLightningEffect(element);
        if (effects.neonTrail) this.applyNeonTrailEffect(element);
    }

    /**
     * Apply glow effect
     */
    applyGlowEffect(element, type, intensity) {
        const colors = {
            bronze: '#cd7f32',
            silver: '#c0c0c0', 
            gold: '#ffd700'
        };
        
        const tier = this.getTierFromElement(element);
        const color = colors[tier] || '#00d4ff';
        
        const glowIntensity = {
            subtle: 5,
            bright: 15,
            intense: 25
        };
        
        const blur = glowIntensity[type] * intensity;
        
        element.style.textShadow = `
            0 0 ${blur}px ${color},
            0 0 ${blur * 2}px ${color},
            0 0 ${blur * 3}px ${color}
        `;
        
        element.style.filter = `drop-shadow(0 0 ${blur}px ${color})`;
    }

    /**
     * Apply sparkle effect
     */
    applySparkleEffect(element) {
        const sparkleContainer = document.createElement('div');
        sparkleContainer.className = 'viral-sparkles';
        sparkleContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        `;
        
        element.style.position = 'relative';
        element.appendChild(sparkleContainer);
        
        this.animateSparkles(sparkleContainer);
    }

    /**
     * Apply wave effect
     */
    applyWaveEffect(element) {
        element.style.animation = 'viral-wave 2s ease-in-out infinite';
        
        // Add CSS animation if not already present
        if (!document.querySelector('#viral-wave-style')) {
            const style = document.createElement('style');
            style.id = 'viral-wave-style';
            style.textContent = `
                @keyframes viral-wave {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-3px); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Apply particle effect
     */
    applyParticleEffect(element) {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'viral-particles';
        particleContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        `;
        
        element.style.position = 'relative';
        element.appendChild(particleContainer);
        
        this.animateParticles(particleContainer);
    }

    /**
     * Apply lightning effect
     */
    applyLightningEffect(element) {
        element.style.animation = 'viral-lightning 3s ease-in-out infinite';
        
        if (!document.querySelector('#viral-lightning-style')) {
            const style = document.createElement('style');
            style.id = 'viral-lightning-style';
            style.textContent = `
                @keyframes viral-lightning {
                    0%, 90%, 100% { 
                        text-shadow: 0 0 20px #ffd700, 0 0 40px #ffd700;
                    }
                    5%, 85% { 
                        text-shadow: 0 0 30px #ffd700, 0 0 60px #ffd700, 0 0 80px #ffd700;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Apply neon trail effect
     */
    applyNeonTrailEffect(element) {
        element.style.animation = 'viral-neon-trail 2s ease-in-out infinite';
        
        if (!document.querySelector('#viral-neon-trail-style')) {
            const style = document.createElement('style');
            style.id = 'viral-neon-trail-style';
            style.textContent = `
                @keyframes viral-neon-trail {
                    0% { 
                        text-shadow: 
                            0 0 20px #ffd700,
                            0 0 40px #ffd700,
                            0 0 60px #ffd700;
                    }
                    50% { 
                        text-shadow: 
                            0 0 25px #ffd700,
                            0 0 50px #ffd700,
                            0 0 75px #ffd700,
                            0 0 100px #ffd700;
                    }
                    100% { 
                        text-shadow: 
                            0 0 20px #ffd700,
                            0 0 40px #ffd700,
                            0 0 60px #ffd700;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Remove all status effects
     */
    removeStatusEffects(element) {
        element.style.textShadow = '';
        element.style.filter = '';
        element.style.animation = '';
        element.style.position = '';
        
        // Remove effect containers
        const containers = element.querySelectorAll('.viral-sparkles, .viral-particles');
        containers.forEach(container => container.remove());
    }

    /**
     * Animate sparkles
     */
    animateSparkles(container) {
        const createSparkle = () => {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: #ffd700;
                border-radius: 50%;
                pointer-events: none;
                animation: sparkle-fade 1.5s ease-out forwards;
            `;
            
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 100 + '%';
            
            container.appendChild(sparkle);
            
            setTimeout(() => sparkle.remove(), 1500);
        };
        
        // Create sparkles periodically
        setInterval(createSparkle, 200);
        
        // Add sparkle animation CSS
        if (!document.querySelector('#sparkle-animation-style')) {
            const style = document.createElement('style');
            style.id = 'sparkle-animation-style';
            style.textContent = `
                @keyframes sparkle-fade {
                    0% { opacity: 0; transform: scale(0); }
                    50% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(0); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Animate particles
     */
    animateParticles(container) {
        const createParticle = () => {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: #ffd700;
                border-radius: 50%;
                pointer-events: none;
                animation: particle-float 3s ease-out forwards;
            `;
            
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = '100%';
            
            container.appendChild(particle);
            
            setTimeout(() => particle.remove(), 3000);
        };
        
        setInterval(createParticle, 100);
        
        if (!document.querySelector('#particle-animation-style')) {
            const style = document.createElement('style');
            style.id = 'particle-animation-style';
            style.textContent = `
                @keyframes particle-float {
                    0% { 
                        opacity: 0; 
                        transform: translateY(0) scale(0);
                    }
                    20% { 
                        opacity: 1; 
                        transform: translateY(-20px) scale(1);
                    }
                    100% { 
                        opacity: 0; 
                        transform: translateY(-100px) scale(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Get tier from element (helper method)
     */
    getTierFromElement(element) {
        if (element.classList.contains('viral-gold')) return 'gold';
        if (element.classList.contains('viral-silver')) return 'silver';
        if (element.classList.contains('viral-bronze')) return 'bronze';
        return 'none';
    }

    /**
     * Show status upgrade notification
     */
    showStatusUpgrade(oldStatus, newStatus) {
        if (!oldStatus || oldStatus.tier === newStatus.tier) return;
        
        const notification = document.createElement('div');
        notification.className = 'viral-status-upgrade';
        notification.innerHTML = `
            <div class="upgrade-content">
                <div class="upgrade-icon">🎉</div>
                <div class="upgrade-text">
                    <h3>Status Upgrade!</h3>
                    <p>You've reached ${newStatus.tier.toUpperCase()} status!</p>
                    ${this.tiers[newStatus.tier].styles > 1 ? 
                        '<button class="choose-style-btn">Choose Your Style</button>' : 
                        ''
                    }
                </div>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #00d4ff;
            border-radius: 12px;
            padding: 20px;
            color: white;
            z-index: 1000;
            animation: slideInRight 0.5s ease-out;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
        
        // Add animation CSS if not present
        if (!document.querySelector('#viral-notification-style')) {
            const style = document.createElement('style');
            style.id = 'viral-notification-style';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Export singleton instance
export const viralStatusSystem = new ViralStatusSystem(); 