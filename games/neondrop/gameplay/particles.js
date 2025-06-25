/**
 * gameplay/particles.js - Simple Particle System
 * 
 * Clean, working particles with a little more pop sound
 */

import { CONSTANTS } from '../config.js';

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = CONSTANTS.PARTICLES.MAX_PARTICLES;
    }

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

                    // Simple particle count based on intensity
                    const particleCount = Math.floor(8 + intensity * 12); // 8-20 particles per block

                    for (let i = 0; i < particleCount; i++) {
                        const particle = this.createParticle(
                            blockCenterX,
                            blockCenterY,
                            color,
                            intensity
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

            // Physics update - simple parabolic motion
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += CONSTANTS.PARTICLES.GRAVITY * dt;

            // Simple fade out
            p.opacity = p.life / p.maxLife;

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

    createParticle(x, y, color, intensity) {
        // Start position with some spread
        const startX = x + (Math.random() - 0.5) * CONSTANTS.BOARD.BLOCK_SIZE * 0.8;
        const startY = y + (Math.random() - 0.5) * CONSTANTS.BOARD.BLOCK_SIZE * 0.8;

        // Calculate velocity for upward explosion
        const angle = (Math.PI / 2) + (Math.random() - 0.5) * Math.PI / 2; // Upward spread
        const speed = 100 + Math.random() * 200 + intensity * 100; // More speed with intensity

        // Simple lifetime
        const lifetime = 1.5 + Math.random() * 1.0 + intensity * 0.5;

        // Simple size
        const size = 2 + Math.random() * 3 + intensity * 2;

        // Ensure color is valid
        let particleColor = color;
        if (typeof color === 'string' && color.startsWith('#')) {
            // Keep hex colors as-is
            particleColor = color;
        } else {
            // Fallback to white for invalid colors
            particleColor = '#ffffff';
        }

        return {
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: -Math.sin(angle) * speed, // Negative for upward
            color: particleColor,
            size: size,
            opacity: 1.0,
            life: lifetime,
            maxLife: lifetime
        };
    }
}

