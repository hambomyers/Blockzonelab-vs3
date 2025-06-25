/**
 * gameplay/particles.js - AAA Particle System v2.0.0
 *
 * ENHANCED FOR BLOCKZONE LAB PLATFORM v2.0.0:
 * - 5x more gravity so they curve down faster
 * - 75% longer lifetime so they stay on screen
 * - Enhanced glow effects and trails
 * - More vibrant neon colors
 * - Particle size variation for dramatic effect
 */

import { CONSTANTS } from '../config.js';

// Helper: Get CSS variable value in JS
function getCSSVar(name, fallback) {
    if (typeof window !== 'undefined' && window.getComputedStyle) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return value || fallback;
    }
    return fallback;
}

// Enhanced neon palette with glow effects
const NEON_PALETTE = {
    blue: () => ({ color: getCSSVar('--neon-blue', '#00f5ff'), glow: '0 0 20px #00f5ff' }),
    cyan: () => ({ color: getCSSVar('--neon-cyan', '#00d4ff'), glow: '0 0 15px #00d4ff' }),
    pink: () => ({ color: getCSSVar('--hot-pink', '#ff1493'), glow: '0 0 20px #ff1493' }),
    green: () => ({ color: getCSSVar('--laser-green', '#39ff14'), glow: '0 0 18px #39ff14' }),
    purple: () => ({ color: getCSSVar('--electric-purple', '#8a2be2'), glow: '0 0 22px #8a2be2' }),
    gold: () => ({ color: getCSSVar('--gold-accent', '#ffd700'), glow: '0 0 25px #ffd700' }),
    orange: () => ({ color: getCSSVar('--neon-orange', '#ffa500'), glow: '0 0 20px #ffa500' }),
    white: () => ({ color: '#fff', glow: '0 0 15px #fff' }),
    silver: () => ({ color: '#C0C0C0', glow: '0 0 12px #C0C0C0' }),
};

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = CONSTANTS.PARTICLES.MAX_PARTICLES * 4; // Increased for more dramatic effects
        this.trailParticles = []; // New: trail particles for enhanced visual effect
    }

    // ============ PUBLIC API ============

    /**
     * Create explosion effect when lines are cleared
     * @param {number[]} lines - Array of line indices that were cleared
     * @param {Array<Array>} board - Game board for color info
     */
    createLineExplosion(lines, board) {
        const lineCount = lines.length;
        const intensity = lineCount / 4; // 0.25, 0.5, 0.75, 1.0

        lines.forEach((lineY, lineIndex) => {
            for (let x = 0; x < CONSTANTS.BOARD.WIDTH; x++) {
                if (board[lineY][x]) {
                    const color = board[lineY][x];
                    const blockCenterX = x * CONSTANTS.BOARD.BLOCK_SIZE + CONSTANTS.BOARD.BLOCK_SIZE / 2;
                    const blockCenterY = lineY * CONSTANTS.BOARD.BLOCK_SIZE + CONSTANTS.BOARD.BLOCK_SIZE / 2;

                    // ENHANCED: More particles for dramatic effect
                    const particleCount = Math.floor(30 * (1 + intensity * 3)); // 30, 60, 90, 120

                    for (let i = 0; i < particleCount; i++) {
                        const particle = this.createFireworkParticle(
                            blockCenterX,
                            blockCenterY,
                            color,
                            lineCount,
                            intensity,
                            x,
                            i / particleCount,
                            lineIndex / lineCount
                        );

                        this.particles.push(particle);
                        
                        // ENHANCED: Add trail particles for main particles
                        if (Math.random() < 0.3) { // 30% chance for trail
                            const trailParticle = this.createTrailParticle(particle);
                            this.trailParticles.push(trailParticle);
                        }
                    }
                }
            }
        });

        // Limit particle count
        if (this.particles.length > this.maxParticles) {
            this.particles = this.particles.slice(-this.maxParticles);
        }
        if (this.trailParticles.length > this.maxParticles) {
            this.trailParticles = this.trailParticles.slice(-this.maxParticles);
        }
    }

    /**
     * Update all particles
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        const dt = deltaTime / 1000;

        // Update main particles
        this.particles = this.particles.filter(p => {
            // Update lifetime
            p.life -= dt;
            if (p.life <= 0) return false;

            // Store previous position for trail effect
            p.prevX = p.x;
            p.prevY = p.y;

            // Physics update - parabolic motion
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // CHANGED: 5x MORE GRAVITY
            p.vy += (CONSTANTS.PARTICLES.GRAVITY * 5) * dt; // Gravity pulls down MUCH faster

            // Calculate progress for effects
            const progress = 1 - (p.life / p.maxLife);

            // ENHANCED: Rainbow color shift with glow
            if (p.rainbow) {
                const hue = Math.floor((p.rainbowOffset + progress * 180) % 360);
                const lightness = Math.floor(70 - progress * 20);
                p.color = `hsl(${hue}, 100%, ${lightness}%)`;
                p.glow = `0 0 ${15 + Math.floor(progress * 10)}px hsl(${hue}, 100%, 70%)`;
            }

            // ENHANCED: Each particle has its own fade curve with glow variation
            p.opacity = Math.pow(1 - progress, p.fadeExponent);
            p.glowIntensity = Math.pow(1 - progress, p.fadeExponent * 0.7); // Glow fades slower

            // ENHANCED: Create trail particles occasionally
            if (Math.random() < 0.1 && p.life > p.maxLife * 0.3) { // 10% chance, only in first 70% of life
                const trailParticle = this.createTrailParticle(p);
                this.trailParticles.push(trailParticle);
            }

            return true;
        });

        // Update trail particles
        this.trailParticles = this.trailParticles.filter(p => {
            p.life -= dt * 2; // Trail particles fade faster
            if (p.life <= 0) return false;

            p.opacity = Math.pow(1 - (p.life / p.maxLife), 1.5);
            return true;
        });
    }

    /**
     * Get all active particles for rendering
     * @returns {Array} Array of particle objects
     */
    getParticles() {
        return [...this.particles, ...this.trailParticles];
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
        this.trailParticles = [];
    }

    /**
     * Get particle count for debugging
     */
    getCount() {
        return this.particles.length + this.trailParticles.length;
    }

    // ============ PRIVATE METHODS ============

    createFireworkParticle(x, y, color, lineCount, intensity, columnX, particleRatio, lineRatio) {
        // Start position with some spread
        const startX = x + (Math.random() - 0.5) * CONSTANTS.BOARD.BLOCK_SIZE * 0.5;
        const startY = y + (Math.random() - 0.5) * CONSTANTS.BOARD.BLOCK_SIZE * 0.5;

        // Calculate base height
        const availableHeight = CONSTANTS.BOARD.HEIGHT * CONSTANTS.BOARD.BLOCK_SIZE * 0.8;
        const baseHeight = availableHeight * (0.3 + intensity * 0.5);

        // ANGLE: Spread increases with line count - particles go UP and OUT
        const maxSpread = (Math.PI / 3) * (1 + intensity); // 60° to 120° total spread
        const angle = (Math.PI / 2) + (Math.random() - 0.5) * maxSpread;

        // HEIGHT: More variation with more lines
        const heightVariation = 0.7 + Math.random() * (0.6 * (1 + intensity));
        const maxHeight = baseHeight * heightVariation;

        // VELOCITY: Initial velocity to reach maxHeight - INCREASED for viewport coverage
        const velocity = Math.sqrt(2 * CONSTANTS.PARTICLES.GRAVITY * maxHeight);

        // Much higher velocity multiplier to reach edges of viewport
        const velocityMultiplier = 1.5 + Math.random() * 2.5; // 1.5 to 4.0x

        // CHANGED: 75% LONGER LIFETIME
        const lifeVariation = 0.7 + Math.random() * (0.6 * (1 + intensity));
        const lifetime = (2 + intensity * 4) * lifeVariation * 1.75; // 75% longer life

        // ENHANCED: More dramatic size variation
        const sizeVariation = 0.6 + Math.random() * (0.8 * (1 + intensity));
        const size = (3 + intensity * 8) * sizeVariation; // Larger base size

        // ENHANCED: Visual properties with glow
        let particleColor = color;
        let glowEffect = '0 0 15px currentColor';
        
        // Use enhanced neon palette for all particles
        if (typeof color === 'string' && color[0] === '#') {
            // Map block color to neon palette if possible
            if (color.toLowerCase() === '#ffd700') {
                const palette = NEON_PALETTE.gold();
                particleColor = palette.color;
                glowEffect = palette.glow;
            }
            else if (color.toLowerCase() === '#8a2be2') {
                const palette = NEON_PALETTE.purple();
                particleColor = palette.color;
                glowEffect = palette.glow;
            }
            else if (color.toLowerCase() === '#00f5ff') {
                const palette = NEON_PALETTE.blue();
                particleColor = palette.color;
                glowEffect = palette.glow;
            }
            else if (color.toLowerCase() === '#ff1493') {
                const palette = NEON_PALETTE.pink();
                particleColor = palette.color;
                glowEffect = palette.glow;
            }
            else if (color.toLowerCase() === '#39ff14') {
                const palette = NEON_PALETTE.green();
                particleColor = palette.color;
                glowEffect = palette.glow;
            }
            else if (color.toLowerCase() === '#ffa500') {
                const palette = NEON_PALETTE.orange();
                particleColor = palette.color;
                glowEffect = palette.glow;
            }
        }

        // Create particle
        const particle = {
            // Position
            startX: startX,
            startY: startY,
            x: startX,
            y: startY,
            prevX: startX,
            prevY: startY,

            // Velocity components - UP and OUT with more force
            vx: Math.cos(angle) * velocity * velocityMultiplier,
            vy: -Math.sin(angle) * velocity * velocityMultiplier, // Negative for upward

            // ENHANCED: Visual properties
            color: particleColor,
            glow: glowEffect,
            glowIntensity: 1.0,
            size: size,
            opacity: 1.0,
            fadeExponent: 0.8 + Math.random() * 0.4, // Varied fade curves

            // Life cycle
            life: lifetime,
            maxLife: lifetime,

            // ENHANCED: Special effects
            rainbow: Math.random() < 0.2, // 20% chance for rainbow effect
            rainbowOffset: Math.random() * 360,
            trail: Math.random() < 0.3, // 30% chance for trail effect
            sparkle: Math.random() < 0.15, // 15% chance for sparkle effect
        };

        return particle;
    }

    // NEW: Create trail particles for enhanced visual effect
    createTrailParticle(mainParticle) {
        const trailOffset = 5 + Math.random() * 10; // Random offset behind main particle
        
        return {
            x: mainParticle.prevX + (Math.random() - 0.5) * trailOffset,
            y: mainParticle.prevY + (Math.random() - 0.5) * trailOffset,
            color: mainParticle.color,
            glow: mainParticle.glow,
            size: mainParticle.size * 0.6, // Smaller than main particle
            opacity: 0.7,
            life: 0.3 + Math.random() * 0.4, // Short lifetime
            maxLife: 0.3 + Math.random() * 0.4,
            fadeExponent: 1.2,
        };
    }
}

