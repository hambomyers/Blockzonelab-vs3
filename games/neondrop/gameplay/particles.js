/**
 * gameplay/particles.js - AAA Particle System
 *
 * SIMPLE FIX:
 * - 5x more gravity so they curve down faster
 * - 75% longer lifetime so they stay on screen
 * - Everything else EXACTLY the same
 */

import { CONSTANTS } from '../config.js';

// Helper: Get CSS variable value in JS
function getCSSVar(name, fallback) {
    if (typeof window !== 'undefined' && window.getComputedStyle) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    }
    return fallback;
}

// Neon palette (from CSS variables)
const NEON_PALETTE = {
    blue: () => getCSSVar('--neon-blue', '#00f5ff'),
    cyan: () => getCSSVar('--neon-cyan', '#00d4ff'),
    pink: () => getCSSVar('--hot-pink', '#ff1493'),
    green: () => getCSSVar('--laser-green', '#39ff14'),
    purple: () => getCSSVar('--electric-purple', '#8a2be2'),
    gold: () => getCSSVar('--gold-accent', '#ffd700'),
    orange: () => getCSSVar('--neon-orange', '#ffa500'),
    white: () => '#fff',
    silver: () => '#C0C0C0',
};

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = CONSTANTS.PARTICLES.MAX_PARTICLES * 3; // Allow bursts
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

                    // Particle count scales with intensity
                    const particleCount = Math.floor(20 * (1 + intensity * 2)); // 20, 30, 40, 60

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
                    }
                }
            }
        });

        // Limit particle count
        if (this.particles.length > this.maxParticles) {
            this.particles = this.particles.slice(-this.maxParticles);
        }
    }

    /**
     * Update all particles
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        const dt = deltaTime / 1000;

        this.particles = this.particles.filter(p => {
            // Update lifetime
            p.life -= dt;
            if (p.life <= 0) return false;

            // Physics update - parabolic motion
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // CHANGED: 5x MORE GRAVITY
            p.vy += (CONSTANTS.PARTICLES.GRAVITY * 5) * dt; // Gravity pulls down MUCH faster

            // Calculate progress for effects
            const progress = 1 - (p.life / p.maxLife);

            // Rainbow color shift for tetris
            if (p.rainbow) {
                const hue = (p.rainbowOffset + progress * 180) % 360;
                p.color = `hsl(${hue}, 100%, ${70 - progress * 20}%)`;
            }

            // Each particle has its own fade curve
            p.opacity = Math.pow(1 - progress, p.fadeExponent);

            return true;
        });
    }

    /**
     * Get all active particles for rendering
     * @returns {Array} Array of particle objects
     */
    getParticles() {
        return this.particles;
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }

    /**
     * Get particle count for debugging
     */
    getCount() {
        return this.particles.length;
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

        // SIZE: More variation with more lines
        const sizeVariation = 0.8 + Math.random() * (0.4 * (1 + intensity));
        const size = (2 + intensity * 6) * sizeVariation;

        // Visual properties
        let particleColor = color;
        // Use neon palette for all particles
        if (typeof color === 'string' && color[0] === '#') {
            // Map block color to neon palette if possible
            if (color.toLowerCase() === '#ffd700') particleColor = NEON_PALETTE.gold();
            else if (color.toLowerCase() === '#8a2be2') particleColor = NEON_PALETTE.purple();
            else if (color.toLowerCase() === '#00f5ff') particleColor = NEON_PALETTE.blue();
            else if (color.toLowerCase() === '#ff1493') particleColor = NEON_PALETTE.pink();
            else if (color.toLowerCase() === '#39ff14') particleColor = NEON_PALETTE.green();
            else if (color.toLowerCase() === '#ffa500') particleColor = NEON_PALETTE.orange();
        }
        // Slightly increase brightness for GPU pop
        // (Use a CSS filter or just a lighter color for now)
        // For now, just use the palette color directly

        // Create particle
        const particle = {
            // Position
            startX: startX,
            startY: startY,
            x: startX,
            y: startY,

            // Velocity components - UP and OUT with more force
            vx: Math.cos(angle) * velocity * velocityMultiplier,
            vy: -Math.sin(angle) * velocity * velocityMultiplier, // Negative for upward

            // Visual properties
            color: particleColor,
            size: size,
            type: Math.random() > (1 - intensity * 0.5) ? 'glow' : 'spark',

            // Lifetime
            maxLife: lifetime,
            life: lifetime,

            // Unique fade rate
            fadeExponent: 1.5 + Math.random() * (2 * (1 + intensity)),

            // Special effects
            rainbow: lineCount === 4 && Math.random() > 0.3,
            rainbowOffset: columnX * 36 + lineRatio * 60
        };

        // Color variations for multi-line clears
        if (lineCount >= 2 && Math.random() > 0.7) {
            // Use neon palette for rainbow
            const neonColors = [
                NEON_PALETTE.blue(),
                NEON_PALETTE.cyan(),
                NEON_PALETTE.pink(),
                NEON_PALETTE.green(),
                NEON_PALETTE.purple(),
                NEON_PALETTE.gold(),
                NEON_PALETTE.orange(),
            ];
            particle.color = neonColors[Math.floor(Math.random() * neonColors.length)];
        }

        if (lineCount >= 3 && Math.random() > 0.6) {
            particle.color = Math.random() > 0.5 ? NEON_PALETTE.gold() : NEON_PALETTE.silver();
        }

        return particle;
    }
}

