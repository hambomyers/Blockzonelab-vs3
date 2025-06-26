/**
 * core/renderer.js - Professional rendering pipeline with smooth transitions
 *
 * Handles all visual output including:
 * - Game board and piece rendering
 * - UI elements (score, preview, hold)
 * - Transition effects and animations
 * - Particle system integration
 */

import * as Physics from './physics-pure.js';

import { PIECE_DEFINITIONS, CONSTANTS } from '../config.js';
import { ChicletRenderer } from '../gameplay/chiclet.js';
import { createStarfieldRenderer } from '../gameplay/starfield.js';

/**
 * Professional renderer with dynamic sizing and transitions
 */
export class Renderer {
    constructor(canvas, bgCanvas, config, dimensions = null) {
        this.canvas = canvas;
        this.bgCanvas = bgCanvas;
        this.ctx = canvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
            willReadFrequently: false
        });
        this.bgCtx = bgCanvas.getContext('2d', {
            alpha: false,
            desynchronized: true
        });
        this.config = config;
        this.viewportManager = null;

        // Use provided dimensions or fall back to defaults
        this.dimensions = dimensions || {
            blockSize: 24,
            boardWidth: 240,
            boardHeight: 480,
            canvasWidth: 312,
            canvasHeight: 750,
            boardX: 36,
            boardY: 192
        };

        // Rendering systems
        this.chicletRenderer = new ChicletRenderer();
        this.starfieldRenderer = createStarfieldRenderer();

        // Layer management
        this.layers = new Map();
        this.dirtyRegions = new Set();

        // Animation state
        this.animations = {
            countdown: { scale: 1, lastNumber: 0 },
            gameOver: {
                shakeX: 0,
                shakeY: 0,
                particles: [],
                initialized: false,
                startTime: null,
                stage: 1
            },
            unlock: { alpha: 0, message: '' },
            combo: { scale: 1, count: 0, alpha: 0 }
        };

        // Transition effects
        this.transitionEffects = {
            blur: 0,
            fadeAlpha: 0,
            vignetteRadius: 1,
            desaturation: 0,
            zoomScale: 1
        };

        // Resource pools
        this.resourcePools = {
            tempCanvases: [],
            gradients: new Map()
        };

        this.initialize();
    }

    initialize() {
        this.chicletRenderer.setBlockSize(this.dimensions.blockSize);
        this.chicletRenderer.setScale(1);
        this.precalculateLayouts();

        // ADD THIS
        this.initializeEdgeGlow();
    }

    /**
     * Main render method - orchestrates all rendering
     */
    render(state, particles = [], starfieldState = null) {
        const frameStart = performance.now();

        this.updateTransitionEffects(state);
        this.clearCanvas();

        // Apply canvas-wide effects if needed
        if (this.transitionEffects.blur > 0) {
            this.canvas.style.filter = `blur(${this.transitionEffects.blur}px)`;
        } else {
            this.canvas.style.filter = 'none';
        }

        this.renderBackground(starfieldState);

        // Apply zoom effect if transitioning
        if (this.transitionEffects.zoomScale !== 1) {
            this.ctx.save();
            const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
            const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(this.transitionEffects.zoomScale, this.transitionEffects.zoomScale);
            this.ctx.translate(-centerX, -centerY);
        }

        // Apply screen shake if needed
        const shakeActive = this.animations.gameOver.shakeX !== 0;
        if (shakeActive) {
            this.ctx.save();
            this.ctx.translate(
                this.animations.gameOver.shakeX,
                this.animations.gameOver.shakeY
            );
        }

        // Render game layers
        this.renderBoard(state);

        // ADD THIS: Render edge glow
        this.renderEdgeGlow(state);

        this.renderActivePieces(state);

        if (shakeActive) {
            this.ctx.restore();
            this.updateShake();
        }

        if (this.transitionEffects.zoomScale !== 1) {
            this.ctx.restore();
        }

        this.renderUI(state);
        this.renderPostProcessing(state);
        this.renderOverlays(state);

        // Render particles on BOTH canvases for overflow effect
        this.renderParticles(particles);
        this.renderParticlesOverflow(particles);

        // Time dilation indicator
        if (state.timeDilation && state.timeDilation !== 1) {
            this.renderTimeDilationEffect(state.timeDilation);
        }

        // Add practice mode indicator
        if (state.gameMode === 'practice') {
            this.renderPracticeIndicator();
        }
    }

    /**
     * Update transition effects based on state
     */
    updateTransitionEffects(state) {
        if (!state.transition) {
            // Reset effects when no transition
            this.transitionEffects.blur = 0;
            this.transitionEffects.fadeAlpha = 0;
            this.transitionEffects.vignetteRadius = 1;
            this.transitionEffects.desaturation = 0;
            this.transitionEffects.zoomScale = 1;
            return;
        }

        const { type, progress } = state.transition;

        switch (type) {
            case 'menu-fade':
                this.transitionEffects.fadeAlpha = progress;
                this.transitionEffects.zoomScale = 1 + (progress * 0.05);
                break;

            case 'countdown-end':
                const pulse = Math.sin(progress * Math.PI);
                this.transitionEffects.zoomScale = 1 + (pulse * 0.02);
                break;

            case 'pause':
                this.transitionEffects.blur = progress * 8;
                break;

            case 'unpause':
                this.transitionEffects.blur = (1 - progress) * 8;
                break;

            case 'game-over-slow':
                this.transitionEffects.zoomScale = 1 - (progress * 0.03);
                break;

            case 'game-over-fade':
                this.transitionEffects.vignetteRadius = 1 - (progress * 0.8);
                this.transitionEffects.desaturation = progress;
                this.transitionEffects.fadeAlpha = progress * 0.8;
                break;

            case 'fade-out':
                this.transitionEffects.fadeAlpha = progress;
                break;
        }
    }

    /**
     * Apply post-processing effects (desaturation, vignette, fade)
     */
    renderPostProcessing(state) {
        if (this.transitionEffects.desaturation > 0) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'saturation';
            this.ctx.fillStyle = `rgba(128, 128, 128, ${this.transitionEffects.desaturation})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }

        if (this.transitionEffects.vignetteRadius < 1) {
            const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
            const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;
            const maxRadius = Math.sqrt(
                Math.pow(this.dimensions.boardWidth / 2, 2) +
                Math.pow(this.dimensions.boardHeight / 2, 2)
            );

            const gradient = this.ctx.createRadialGradient(
                centerX, centerY, maxRadius * this.transitionEffects.vignetteRadius,
                centerX, centerY, maxRadius * 1.5
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                this.dimensions.boardX,
                this.dimensions.boardY,
                this.dimensions.boardWidth,
                this.dimensions.boardHeight
            );
        }

        if (this.transitionEffects.fadeAlpha > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionEffects.fadeAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Subtle time dilation effect for line clears
     */
    renderTimeDilationEffect(timeDilation) {
        if (timeDilation >= 0.8) return;

        const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
        const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;
        const pulse = Math.sin(Date.now() * 0.01) * 0.05 + 0.95;

        this.ctx.save();
        this.ctx.globalAlpha = (1 - timeDilation) * 0.1;

        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, this.dimensions.boardWidth * pulse
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            this.dimensions.boardX,
            this.dimensions.boardY,
            this.dimensions.boardWidth,
            this.dimensions.boardHeight
        );

        this.ctx.restore();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
    }

    renderBackground(starfieldState) {
        if (starfieldState?.enabled) {
            this.starfieldRenderer.render(
                this.bgCtx,
                starfieldState,
                { width: this.bgCanvas.width, height: this.bgCanvas.height }
            );
        } else {
            this.bgCtx.fillStyle = '#000000';
            this.bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        }
    }

    renderBoard(state) {
        // Board background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(
            this.dimensions.boardX,
            this.dimensions.boardY,
            this.dimensions.boardWidth,
            this.dimensions.boardHeight
        );

        if (this.config.get('graphics.showGrid')) {
            this.renderGrid();
        }

        this.renderBoardPieces(state.board, state.clearingLines);
    }

    renderBoardPieces(board, clearingLines = []) {
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                const color = board[y][x];
                if (!color) continue;

                // Clearing animation flash
                if (clearingLines.includes(y)) {
                    const flash = Math.sin(Date.now() * 0.05) * 0.5 + 0.5;
                    this.ctx.globalAlpha = 0.5 + flash * 0.5;
                }

                const pixelX = this.dimensions.boardX + x * this.dimensions.blockSize;
                const pixelY = this.dimensions.boardY + y * this.dimensions.blockSize;

                this.chicletRenderer.drawBlock(
                    this.ctx, pixelX, pixelY, color, y, x
                );

                this.ctx.globalAlpha = 1;
            }
        }
    }

    renderActivePieces(state) {
        if (!state.current) return;

        // Ghost piece
        if (this.config.get('graphics.ghostPiece') &&
            (state.phase === 'PLAYING' || state.phase === 'LOCKING')) {
            this.renderGhostPiece(state);
        }

        // Current piece - FIXED: Hide during game over sequence but show death piece
        const hideCurrentPiece = state.phase === 'GAME_OVER' ||
                               (state.phase === 'GAME_OVER_SEQUENCE' && state.gameOverSequencePhase > 0);

        if (!hideCurrentPiece) {
            this.renderCurrentPiece(state);
        }

        // Death piece overlay - FIXED: Show during game over sequence phase 0
        if (state.phase === 'GAME_OVER_SEQUENCE' && 
            state.gameOverSequencePhase === 0 && 
            state.current) {
            // Don't call renderDeathPiece here - it's handled in renderGameOverSequence
            // This prevents double rendering
        }
    }

    renderGhostPiece(state) {
        if (state.shadowY === state.current.gridY) return;

        const opacity = this.config.get('graphics.ghostPieceOpacity') || 0.15;
        this.ctx.globalAlpha = opacity;

        // Use common piece drawing method
        this.drawPieceWithSpawn(
            state.current,
            state.current.gridX,
            state.shadowY,
            0,
            true
        );

        this.ctx.globalAlpha = 1;
    }

    renderCurrentPiece(state) {
        if (!state.current) return;

        let opacity = 1;
        let yOffset = 0;

        // Calculate smooth falling interpolation
        if (state.phase === 'PLAYING') {
            if (state.current.gridY < state.shadowY) {
                const progress = Math.min(1, state.gravityAccumulator / state.currentGravityDelay);
                yOffset = progress * this.dimensions.blockSize;

                // Clamp visual position to shadow
                const currentPixelY = state.current.gridY * this.dimensions.blockSize + yOffset;
                const shadowPixelY = state.shadowY * this.dimensions.blockSize;

                if (currentPixelY > shadowPixelY) {
                    yOffset = shadowPixelY - (state.current.gridY * this.dimensions.blockSize);
                }
            }
        }

        // Per-block spawn opacity is now handled in drawPieceWithSpawn

        // Locking pulse effect
        if (state.phase === 'LOCKING' && state.lockTimer && !state.isSpawning) {
            const lockDelay = this.getLockDelay(state.current.type);
            const progress = Math.min(1, state.lockTimer / lockDelay);
            const pulseSpeed = 3 + progress * 12;
            opacity *= Math.sin(Date.now() * 0.001 * pulseSpeed) * 0.3 + 0.7;
        }

        this.ctx.globalAlpha = opacity;

        this.drawPieceWithSpawn(
            state.current,
            state.current.gridX,
            state.current.gridY,
            yOffset,
            false
        );

        this.ctx.globalAlpha = 1;
    }

    /**
     * Unified piece drawing method - handles both ghost and regular pieces
     */
    drawPieceWithSpawn(piece, gridX, gridY, pixelYOffset, isGhost = false) {
        piece.shape.forEach((row, dy) => {
            row.forEach((cell, dx) => {
                if (!cell) return;

                const x = gridX + dx;
                const y = gridY + dy;

                // Allow rendering above board for spawn visibility
                if (y < -4 || y >= 20 || x < 0 || x >= 10) return;

                let color = piece.color;

                // Calculate per-block spawn opacity for smooth fade
                let blockOpacity = 1.0;
                if (!isGhost) {
                    blockOpacity = Physics.getBlockSpawnOpacity(piece, gridY, pixelYOffset, dy);
                }

                if (isGhost) {
                    color = '#404040';
                } else if (piece.type === 'FLOAT' && piece.upMovesUsed > 0) {
                    // FLOAT darkening based on usage
                    const brightness = 255 - (piece.upMovesUsed * 30);
                    const hex = Math.max(0, brightness).toString(16).padStart(2, '0');
                    color = `#${hex}${hex}${hex}`;
                }

                const pixelX = this.dimensions.boardX + x * this.dimensions.blockSize;
                const pixelY = this.dimensions.boardY + y * this.dimensions.blockSize + pixelYOffset;

                // Apply per-block opacity
                this.ctx.save();
                if (isGhost) {
                    // For ghost pieces, multiply the current global alpha (set by renderGhostPiece)
                    // with the block opacity to preserve the ghost opacity setting
                    this.ctx.globalAlpha = this.ctx.globalAlpha * blockOpacity;
                } else {
                    this.ctx.globalAlpha = blockOpacity;
                }

                this.chicletRenderer.drawBlock(
                    this.ctx, pixelX, pixelY, color, y, x,
                    isGhost ? null : piece
                );

                this.ctx.restore();
            });
        });
    }

    /**
     * FIXED: Enhanced renderDeathPiece for better visualization
     */
    renderDeathPiece(piece) {
        if (!piece) return;
        
        piece.shape.forEach((row, dy) => {
            row.forEach((cell, dx) => {
                if (!cell) return;

                const boardX = piece.gridX + dx;
                const boardY = piece.gridY + dy;

                // FIXED: Only render pieces above the board (negative Y) and within horizontal bounds
                if (boardY < 0 && boardX >= 0 && boardX < CONSTANTS.BOARD.WIDTH) {
                    const pixelX = this.dimensions.boardX + boardX * this.dimensions.blockSize;
                    const pixelY = this.dimensions.boardY + boardY * this.dimensions.blockSize;

                    // Use current global alpha (set by caller for blinking effect)
                    this.chicletRenderer.drawBlock(
                        this.ctx, pixelX, pixelY, '#FF0000', boardY, boardX
                    );
                }
            });
        });
    }

    renderUI(state) {
        this.renderTitle();
        this.renderScore(state);
        this.renderStats(state);
        this.renderPreviewAndHold(state);
        this.renderNotifications(state);
    }

    /**
     * Render NEON DROP title with cutout effect
     */
    renderTitle() {
        const blockSize = this.dimensions.blockSize;
        const titleZone = this.dimensions.zones.title;

        // NEON (left 4 blocks)
        for (let i = 0; i < 4; i++) {
            const x = titleZone.x + (i * blockSize);
            this.renderTitleLetter('NEON'[i], x, titleZone.y, '#FFFF00', blockSize);
        }

        // DROP (right 4 blocks)
        for (let i = 0; i < 4; i++) {
            const x = titleZone.x + ((i + 6) * blockSize);
            this.renderTitleLetter('DROP'[i], x, titleZone.y, '#8A2BE2', blockSize);
        }
    }

    renderTitleLetter(letter, x, y, color, size) {
        const tempCanvas = this.getTempCanvas(size, size);
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.clearRect(0, 0, size, size);

        this.chicletRenderer.drawBlock(tempCtx, 0, 0, color, 0, 0);

        tempCtx.save();
        tempCtx.globalCompositeOperation = 'destination-out';
        tempCtx.font = `bold ${size * 1.2}px Bungee, monospace`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(letter, size / 2, size / 2 + size * 0.1); // Changed from 0.05 to 0.1
        tempCtx.restore();

        // CHANGED: Much thinner stroke
        tempCtx.strokeStyle = '#000000';
        tempCtx.lineWidth = 1; // Changed from size * 0.06 to just 1 pixel
        tempCtx.font = `bold ${size * 1.2}px Bungee, monospace`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.strokeText(letter, size / 2, size / 2 + size * 0.1); // Changed from 0.05 to 0.1

        this.ctx.drawImage(tempCanvas, x, y);
    }

    renderScore(state) {
        const scoreZone = this.dimensions.zones.score;

        this.ctx.font = `${this.dimensions.blockSize * 0.6}px monospace`;
        this.ctx.textBaseline = 'top';

        // Player score
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            `P1 ${state.score.toString().padStart(6, '0')}`,
            scoreZone.x,
            scoreZone.y
        );

        // High score (with new record flash)
        this.ctx.textAlign = 'right';

        if (state.isNewHighScore && state.score > 0) {
            const flash = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
            this.ctx.fillStyle = `rgb(255, ${Math.floor(255 * flash)}, 0)`;
        } else {
            this.ctx.fillStyle = '#FFFFFF';
        }

        this.ctx.fillText(
            `HS ${(state.displayHighScore || 0).toString().padStart(6, '0')}`,
            scoreZone.x + scoreZone.width,
            scoreZone.y
        );
    }

    renderStats(state) {
        // REMOVED - No longer showing lines/level below score
        this.statsBottom = this.dimensions.zones.score.y + this.dimensions.blockSize * 0.7;
    }

    renderPreviewAndHold(state) {
        // Preview (next piece)
        if (state.next && state.phase !== 'GAME_OVER' && state.phase !== 'MENU') {
            const layout = this.pieceLayouts.get(state.next.type);
            if (layout) {
                const scale = 0.75;
                const blockSize = Math.floor(this.dimensions.blockSize * 0.6 * scale);
                const gap = Math.floor(this.dimensions.blockSize * 0.15 * scale);
                const pieceHeight = layout.height * (blockSize + gap) - gap;

                const previewZone = this.dimensions.zones.preview;
                const previewY = previewZone.y - pieceHeight;

                this.renderMiniPieceAtPosition(state.next, previewZone.centerX, previewY, scale, 0.5);
            }
        }

        // Hold piece
        if (state.hold) {
            const holdZone = this.dimensions.zones.hold;

            const layout = this.pieceLayouts.get(state.hold.type);
            if (layout) {
                const scale = 0.75;
                const opacity = state.canHold ? 0.5 : 0.25;

                this.renderMiniPieceAtPosition(state.hold, holdZone.centerX, holdZone.y, scale, opacity);
            }
        }
    }

    renderMiniPieceAtPosition(piece, centerX, topY, scale, opacity) {
        const layout = this.pieceLayouts.get(piece.type);
        if (!layout) return;

        const blockSize = Math.floor(this.dimensions.blockSize * 0.6 * scale);
        const gap = Math.floor(this.dimensions.blockSize * 0.15 * scale);

        this.ctx.save();
        this.ctx.globalAlpha = opacity;

        const totalWidth = layout.width * (blockSize + gap) - gap;
        const startX = centerX - totalWidth / 2;

        layout.blocks.forEach(({ dx, dy }) => {
            const x = startX + dx * (blockSize + gap);
            const y = topY + dy * (blockSize + gap);

            this.drawMiniBlock(x, y, blockSize, piece.color);
        });

        this.ctx.restore();
    }

    drawMiniBlock(x, y, size, color) {
        const radius = size * 0.3;

        // Rounded rect
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + size - radius, y);
        this.ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
        this.ctx.lineTo(x + size, y + size - radius);
        this.ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
        this.ctx.lineTo(x + radius, y + size);
        this.ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();

        this.ctx.fillStyle = color;
        this.ctx.fill();

        // Gradient overlay
        const gradient = this.ctx.createRadialGradient(
            x + size/2, y + size/2, size * 0.1,
            x + size/2, y + size/2, size * 0.7
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    renderOverlays(state) {
        switch (state.phase) {
            case 'MENU':
                this.renderMenu(state);
                break;
            case 'MENU_TO_COUNTDOWN':
                this.renderMenuTransition(state);
                break;
            case 'COUNTDOWN':
                this.renderCountdown(state);
                break;
            case 'COUNTDOWN_TO_PLAYING':
                this.renderCountdownTransition(state);
                break;
            case 'PLAYING_TO_PAUSE':
            case 'PAUSED':
            case 'PAUSE_TO_PLAYING':
                this.renderPaused(state);
                break;
            case 'GAME_OVER_SEQUENCE':
            case 'GAME_OVER':
            case 'GAME_OVER_TO_MENU':
                // FIXED: Use our new game over sequence rendering
                this.renderGameOverSequence(state);
                break;
        }
    }

    renderMenu(state) {
        this.dimBoard(0.7);

        // Render the beautiful NEON DROP title
        this.renderTitle();

        const pulse = Math.sin(Date.now() * 0.001) * 0.3 + 0.7;

        this.ctx.save();
        this.ctx.globalAlpha = pulse;

        // Simple prompt below title
        this.ctx.font = `${this.dimensions.blockSize * 0.6}px monospace`;
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#FFFF00';
        this.ctx.shadowBlur = 10;

        const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
        const promptY = this.dimensions.zones.title.y + this.dimensions.blockSize * 3;
        this.ctx.fillText('PRESS SPACE TO START', centerX, promptY);

        this.ctx.restore();
    }

    renderMenuTransition(state) {
        const progress = state.transition?.progress || 0;
        const fadeOut = 1 - progress;

        this.dimBoard(0.7 * fadeOut);

        if (fadeOut > 0.01) {
            this.ctx.save();
            this.ctx.globalAlpha = fadeOut;

            this.ctx.font = `${this.dimensions.blockSize * 0.7}px monospace`;
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#FFFF00';
            this.ctx.shadowBlur = 10 * fadeOut;

            const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
            const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;
            this.ctx.fillText('PRESS SPACE TO START', centerX, centerY);

            this.ctx.restore();
        }
    }

    renderCountdown(state) {
        this.dimBoard(0.5);

        const seconds = Math.ceil((state.countdownTimer || 0) / 1000);

        if (seconds !== this.animations.countdown.lastNumber) {
            this.animations.countdown.lastNumber = seconds;
            this.animations.countdown.scale = 2;
        }

        this.animations.countdown.scale = Math.max(1, this.animations.countdown.scale * 0.95);

        const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
        const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;

        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(
            this.animations.countdown.scale,
            this.animations.countdown.scale
        );

        this.ctx.font = `bold ${this.dimensions.blockSize * 3}px monospace`;
        this.ctx.fillStyle = seconds === 1 ? '#FF0000' : '#FFFF00';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.shadowBlur = 20;

        this.ctx.fillText(seconds.toString(), 0, 0);

        this.ctx.restore();
    }

    renderCountdownTransition(state) {
        const progress = state.transition?.progress || 0;
        const fadeOut = 1 - progress;

        this.dimBoard(0.5 * fadeOut);

        if (fadeOut > 0.01) {
            const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
            const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;

            this.ctx.save();
            this.ctx.globalAlpha = fadeOut;
            this.ctx.translate(centerX, centerY);

            const scale = 1 + (progress * 3);
            this.ctx.scale(scale, scale);

            this.ctx.font = `bold ${this.dimensions.blockSize * 3}px monospace`;
            this.ctx.fillStyle = '#FF0000';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.shadowBlur = 20;

            this.ctx.fillText('1', 0, 0);

            this.ctx.restore();
        }
    }

    renderPaused(state) {
        const progress = state.transition?.progress || 1;
        const isUnpausing = state.phase === 'PAUSE_TO_PLAYING';
        const effectiveProgress = isUnpausing ? 1 - progress : progress;

        this.dimBoard(0.7);

        const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 0.9;

        this.ctx.save();

        const yOffset = (1 - effectiveProgress) * -50;
        this.ctx.translate(0, yOffset);

        this.ctx.globalAlpha = effectiveProgress * pulse;

        this.ctx.font = `${this.dimensions.blockSize * 1.5}px monospace`;
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#FFFF00';
        this.ctx.shadowBlur = 15;

        const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
        const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;

        this.ctx.fillText('PAUSED', centerX, centerY);

        this.ctx.restore();
    }

    /**
     * FIXED: Enhanced renderGameOverSequence with proper death piece blinking
     */
    renderGameOverSequence(state) {
        // Check if SimpleGameOver UI is active
        const gameOverUI = document.querySelector('.game-over-card');
        const isSimpleGameOverActive = gameOverUI && gameOverUI.style.display !== 'none';
        
        // FIXED: Always show death piece blinking during game over sequence
        if (state.gameOverSequencePhase === 0 && state.current) {
            // Calculate elapsed time since game over started
            const elapsed = Date.now() - (state.gameOverStartTime || Date.now());
            
            // Phase 0: Death piece blinking (0-3 seconds)
            this.renderDeathPieceBlinking(state, elapsed);
            
            // Add subtle "GAME OVER" text that fades in
            const fadeInDuration = 3000; // 3 seconds
            const fadeProgress = Math.min(1, elapsed / fadeInDuration);
            
            if (fadeProgress > 0) {
                const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
                const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;
                
                this.ctx.save();
                this.ctx.globalAlpha = fadeProgress * 0.7;
                this.ctx.font = `bold ${this.dimensions.blockSize * 1.5}px 'Orbitron', monospace`;
                this.ctx.fillStyle = '#FF0066';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = '#FF0066';
                this.ctx.shadowBlur = 20;
                this.ctx.fillText('GAME OVER', centerX, centerY - this.dimensions.blockSize * 2);
                this.ctx.restore();
            }
        }
        // Phase 1+: Only show minimal overlay if SimpleGameOver is not active
        else if (state.gameOverSequencePhase >= 1 && !isSimpleGameOverActive) {
            this.renderMinimalGameOver(state);
        }
    }

    /**
     * FIXED: Render death piece with proper blinking timing
     */
    renderDeathPieceBlinking(state, elapsed) {
        if (!state.current) return;
        
        // FIXED: Use deterministic blinking based on elapsed time (1 second cycle)
        const blinkCycle = 1000; // 1 second
        const blinkProgress = (elapsed % blinkCycle) / blinkCycle;
        
        // Use sine wave for smooth blinking (0.2 to 1.0 opacity)
        const opacity = Math.sin(blinkProgress * Math.PI * 2) * 0.4 + 0.6;
        
        // Only render pieces that are above the visible board (negative Y)
        state.current.shape.forEach((row, dy) => {
            row.forEach((cell, dx) => {
                if (!cell) return;

                const boardX = state.current.gridX + dx;
                const boardY = state.current.gridY + dy;

                // FIXED: Only render pieces above the board AND within bounds
                if (boardY < 0 && boardX >= 0 && boardX < CONSTANTS.BOARD.WIDTH) {
                    const pixelX = this.dimensions.boardX + boardX * this.dimensions.blockSize;
                    const pixelY = this.dimensions.boardY + boardY * this.dimensions.blockSize;

                    this.ctx.save();
                    this.ctx.globalAlpha = opacity;

                    // Draw with bright red color for the blinking death piece
                    this.chicletRenderer.drawBlock(
                        this.ctx, pixelX, pixelY, '#FF0000', boardY, boardX
                    );
                    
                    this.ctx.restore();
                }
            });
        });
    }

    /**
     * FIXED: Enhanced renderMinimalGameOver for non-SimpleGameOver cases
     */
    renderMinimalGameOver(state) {
        // Render the board first
        this.renderBoard(state);
        
        // Slowly blinking death piece (2 second cycle)
        if (state.current) {
            const elapsed = Date.now() - (state.gameOverStartTime || Date.now());
            const blinkCycle = 2000; // 2 seconds
            const blinkProgress = (elapsed % blinkCycle) / blinkCycle;
            const opacity = Math.sin(blinkProgress * Math.PI) * 0.4 + 0.4; // 0.0 to 0.8 range

            this.ctx.save();
            this.ctx.globalAlpha = opacity;
            this.renderDeathPiece(state.current);
            this.ctx.restore();
        }

        // Frosted glass overlay with neon borders
        const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
        const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;
        const overlayWidth = this.dimensions.boardWidth * 0.8;
        const overlayHeight = this.dimensions.boardHeight * 0.6;
        const overlayX = centerX - overlayWidth / 2;
        const overlayY = centerY - overlayHeight / 2;

        // Semi-transparent frosted glass background
        this.ctx.save();
        this.ctx.globalAlpha = 0.15;
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(overlayX, overlayY, overlayWidth, overlayHeight);
        this.ctx.restore();

        // Neon border glow
        const borderGlow = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
        this.ctx.save();
        this.ctx.strokeStyle = '#FF0066';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#FF0066';
        this.ctx.shadowBlur = 15 * borderGlow;
        this.ctx.strokeRect(overlayX, overlayY, overlayWidth, overlayHeight);
        this.ctx.restore();

        // Inner border
        this.ctx.save();
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.lineWidth = 1;
        this.ctx.shadowColor = '#00FFFF';
        this.ctx.shadowBlur = 8;
        this.ctx.strokeRect(overlayX + 2, overlayY + 2, overlayWidth - 4, overlayHeight - 4);
        this.ctx.restore();

        // Game Over text with neon glow
        this.ctx.save();
        this.ctx.font = `bold ${this.dimensions.blockSize * 1.2}px 'Orbitron', monospace`;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#FF0066';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('GAME OVER', centerX, centerY - this.dimensions.blockSize * 1.5);
        this.ctx.restore();

        // Score with subtle glow
        this.ctx.save();
        this.ctx.font = `${this.dimensions.blockSize * 0.8}px 'Orbitron', monospace`;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#00FFFF';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(`SCORE: ${state.score.toLocaleString()}`, centerX, centerY);
        this.ctx.restore();

        // Continue prompt with pulsing effect
        const promptAlpha = Math.sin(Date.now() * 0.004) * 0.3 + 0.7;
        this.ctx.save();
        this.ctx.globalAlpha = promptAlpha;
        this.ctx.font = `${this.dimensions.blockSize * 0.6}px 'Orbitron', monospace`;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press SPACE to continue', centerX, centerY + this.dimensions.blockSize * 1.5);
        this.ctx.restore();
    }

    // Removed complex crumble animation methods - using unified simple approach

    // Removed complex color utility methods - using simple approach

    // Removed complex board crumble method - using simple unified approach

    // Simplified animation system - removed complex crumble-specific logic
    updateAnimationParticles(particleArray, particleType = 'standard') {
        const dt = 0.016; // 60fps

        return particleArray.filter(particle => {
            // Simple physics for all particles
            particle.vy += 200 * dt; // Standard gravity
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.life -= dt;

            return particle.life > 0;
        });
    }

    renderAnimationParticles(particleArray, particleType = 'standard') {
        particleArray.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(
                particle.x - particle.size/2, 
                particle.y - particle.size/2, 
                particle.size, 
                particle.size
            );
            this.ctx.restore();
        });
    }

    // Simplified animation system - removed complex crumble-specific logic
    /**
     * Update game over animation state
     */
    updateGameOverAnimation() {
        const now = Date.now();
        const dt = Math.min(1, (now - this.animations.gameOver.lastUpdate) / 1000);
        this.animations.gameOver.lastUpdate = now;

        // Particle update
        this.animations.gameOver.particles.forEach(p => {
            p.y += p.vy * dt;
            p.x += p.vx * dt;
            p.vy += 200 * dt; // Gravity
            p.life -= dt;
        });

        // Remove old particles
        this.animations.gameOver.particles = this.animations.gameOver.particles.filter(p => p.life > 0);

        // Shake effect
        if (this.animations.gameOver.shakeX !== 0) {
            this.animations.gameOver.shakeX *= 0.9;
            this.animations.gameOver.shakeY *= 0.9;

            if (Math.abs(this.animations.gameOver.shakeX) < 0.1) {
                this.animations.gameOver.shakeX = 0;
                this.animations.gameOver.shakeY = 0;
            } else {
                this.animations.gameOver.shakeX =
                    (Math.random() - 0.5) * this.animations.gameOver.shakeX;
                this.animations.gameOver.shakeY =
                    (Math.random() - 0.5) * this.animations.gameOver.shakeY;
            }
        }
    }

    /**
     * Initialize game over animation
     */
    initGameOverAnimation() {
        this.animations.gameOver.shakeX = 20;
        this.animations.gameOver.shakeY = 20;
        this.animations.gameOver.particles = [];

        const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
        const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;

        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const speed = 100 + Math.random() * 200;

            this.animations.gameOver.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: Math.random() > 0.5 ? '#FF0000' : '#FFD700',
                life: 1
            });
        }
    }

    renderGameOver(state) {
        this.dimBoard(0.8);

        this.updateGameOverParticles();
        this.renderGameOverParticles();

        const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
        const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;

        // Game Over text with wobble
        this.ctx.save();

        const wobble = Math.sin(Date.now() * 0.002) * 2;
        this.ctx.translate(centerX, centerY - this.dimensions.blockSize * 2.5);
        this.ctx.rotate(wobble * 0.01);

        this.ctx.font = `bold ${this.dimensions.blockSize * 1.5}px monospace`;
        this.ctx.fillStyle = '#FF0000';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#FF0000';
        this.ctx.shadowBlur = 20 + Math.sin(Date.now() * 0.01) * 10;

        this.ctx.fillText('GAME OVER', 0, 0);
        this.ctx.restore();

        // Score
        this.ctx.font = `bold ${this.dimensions.blockSize}px monospace`;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`SCORE: ${state.score}`, centerX, centerY);

        // New high score
        if (state.isNewHighScore && state.score > 0) {
            const flash = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
            this.ctx.fillStyle = `rgba(255, 215, 0, ${flash})`;
            this.ctx.font = `bold ${this.dimensions.blockSize * 0.8}px monospace`;
            this.ctx.fillText('NEW HIGH SCORE!', centerX, centerY + this.dimensions.blockSize * 1.3);
        }

        // Continue prompt
        const promptAlpha = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
        this.ctx.globalAlpha = promptAlpha;
        this.ctx.font = `${this.dimensions.blockSize * 0.7}px monospace`;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Press SPACE to continue', centerX, centerY + this.dimensions.blockSize * 2.5);

        this.ctx.globalAlpha = 1;
    }

    renderGameOverTransition(state) {
        // Fade handled by post-processing
    }

    renderNotifications(state) {
        // Don't show any notifications during game over states
        if (state.phase === 'GAME_OVER' ||
            state.phase === 'GAME_OVER_SEQUENCE' ||
            state.phase === 'GAME_OVER_TO_MENU') {
            return;
        }

        // Piece unlock notification
        if (state.lastUnlockScore > 0 &&
            state.score >= state.lastUnlockScore &&
             state.score < state.lastUnlockScore + 1000) {

            if (this.animations.unlock.alpha < 1) {
                this.animations.unlock.alpha = Math.min(1, this.animations.unlock.alpha + 0.1);
                this.animations.unlock.message = 'NEW PIECE UNLOCKED!';
            }

            this.ctx.save();
            this.ctx.globalAlpha = this.animations.unlock.alpha;
            this.ctx.font = `bold ${this.dimensions.blockSize * 0.75}px monospace`;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 10;

            const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
            const notificationY = this.dimensions.boardY - this.dimensions.blockSize * 2 - 5;
            this.ctx.fillText(this.animations.unlock.message, centerX, notificationY);
            this.ctx.restore();
        } else {
            this.animations.unlock.alpha = Math.max(0, this.animations.unlock.alpha - 0.05);
        }

        // Combo notification - positioned below board like unlock notifications
        if (state.combo > 1 &&
            state.phase !== 'GAME_OVER' &&
            state.phase !== 'GAME_OVER_SEQUENCE') {
            
            // Reset combo animation when combo changes
            if (this.animations.combo.count !== state.combo) {
                this.animations.combo.count = state.combo;
                this.animations.combo.scale = 2;
                this.animations.combo.alpha = 1.0; // Start fully visible
            }

            // Animate scale and alpha
            this.animations.combo.scale = Math.max(1, this.animations.combo.scale * 0.95);
            this.animations.combo.alpha = Math.max(0, this.animations.combo.alpha - 0.02); // Gradual fade

            const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
            // Position below board like unlock notifications
            const comboY = this.dimensions.boardY + this.dimensions.boardHeight + this.dimensions.blockSize * 2 + 5;

            this.ctx.save();
            this.ctx.globalAlpha = this.animations.combo.alpha;
            this.ctx.font = `bold ${this.dimensions.blockSize * 0.75}px monospace`;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 10;

            this.ctx.fillText(`${state.combo}x COMBO!`, centerX, comboY);
            this.ctx.restore();
        } else {
            // Reset combo animation when no combo
            this.animations.combo.count = 0;
            this.animations.combo.alpha = 0;
        }
    }

    /**
     * Render particles with shared drawing logic
     */
    renderParticlesWithContext(ctx, particles, xOffset = 0, yOffset = 0, bounds = null) {
        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.opacity || 1;

            const x = xOffset + p.x;
            const y = yOffset + p.y;

            // Check bounds if provided
            if (bounds && (x < bounds.minX || x > bounds.maxX ||
                          y < bounds.minY || y > bounds.maxY)) {
                ctx.restore();
                return;
            }

            if (p.type === 'glow') {
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, p.size);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(0.4, p.color);
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.fillRect(x - p.size, y - p.size, p.size * 2, p.size * 2);
            } else if (p.type === 'spark') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size * 0.5;
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(x - p.vx * 0.1, y - p.vy * 0.1);
                ctx.lineTo(x, y);
                ctx.stroke();
            } else {
                ctx.fillStyle = p.color;
                ctx.fillRect(x - p.size/2, y - p.size/2, p.size, p.size);
            }

            ctx.restore();
        });
    }

    renderParticles(particles) {
        if (particles.length === 0) return;

        const bounds = {
            minX: 0,
            maxX: this.dimensions.canvasWidth,
            minY: 0,
            maxY: this.dimensions.canvasHeight
        };

        this.renderParticlesWithContext(
            this.ctx,
            particles,
            this.dimensions.boardX,
            this.dimensions.boardY,
            bounds
        );
    }

    renderParticlesOverflow(particles) {
        if (particles.length === 0) return;

        const gameRect = this.canvas.getBoundingClientRect();

        // Filter particles that are outside game canvas
        const overflowParticles = particles.filter(p => {
            const gameX = this.dimensions.boardX + p.x;
            const gameY = this.dimensions.boardY + p.y;

            return gameX < 0 || gameX > this.dimensions.canvasWidth ||
                   gameY < 0 || gameY > this.dimensions.canvasHeight;
        });

        if (overflowParticles.length === 0) return;

        this.renderParticlesWithContext(
            this.bgCtx,
            overflowParticles,
            gameRect.left + this.dimensions.boardX,
            gameRect.top + this.dimensions.boardY
        );
    }

    renderGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();

        for (let x = 1; x < 10; x++) {
            const xPos = this.dimensions.boardX + x * this.dimensions.blockSize;
            this.ctx.moveTo(xPos, this.dimensions.boardY);
            this.ctx.lineTo(xPos, this.dimensions.boardY + this.dimensions.boardHeight);
        }

        for (let y = 1; y < 20; y++) {
            const yPos = this.dimensions.boardY + y * this.dimensions.blockSize;
            this.ctx.moveTo(this.dimensions.boardX, yPos);
            this.ctx.lineTo(this.dimensions.boardX + this.dimensions.boardWidth, yPos);
        }

        this.ctx.stroke();
    }

    dimBoard(opacity) {
        this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        this.ctx.fillRect(
            this.dimensions.boardX,
            this.dimensions.boardY,
            this.dimensions.boardWidth,
            this.dimensions.boardHeight
        );
    }

    getLockDelay(pieceType) {
        if (pieceType === 'FLOAT') {
            return CONSTANTS.TIMING.LOCK_DELAY_FLOAT;
        }
        return CONSTANTS.TIMING.LOCK_DELAY;
    }

    getTempCanvas(width, height) {
        if (!width || !height || width <= 0 || height <= 0) {
            width = 24;
            height = 24;
        }

        const key = `${width}x${height}`;
        let canvas = this.resourcePools.tempCanvases.find(c =>
            c.width === width && c.height === height && !c.inUse
        );

        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            this.resourcePools.tempCanvases.push(canvas);
        }

        canvas.inUse = true;
        setTimeout(() => { canvas.inUse = false; }, 100);

        return canvas;
    }

    /**
     * Pre-calculate piece layouts for efficient preview/hold rendering
     */
    precalculateLayouts() {
        this.pieceLayouts = new Map();

        Object.entries(PIECE_DEFINITIONS).forEach(([type, def]) => {
            const blocks = [];
            let minX = def.shape[0].length, maxX = 0;
            let minY = def.shape.length, maxY = 0;

            def.shape.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell) {
                        blocks.push({ dx: x, dy: y });
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                });
            });

            // Normalize blocks to top-left origin
            const normalizedBlocks = blocks.map(b => ({
                dx: b.dx - minX,
                dy: b.dy - minY
            }));

            this.pieceLayouts.set(type, {
                blocks: normalizedBlocks,
                width: maxX - minX + 1,
                height: maxY - minY + 1
            });
        });
    }

    toggleGrid() {
        const current = this.config.get('graphics.showGrid');
        this.config.set('graphics.showGrid', !current);
    }

    resetAnimations() {
        this.animations.countdown = { scale: 1, lastNumber: 0 };
        this.animations.gameOver = {
            shakeX: 0,
            shakeY: 0,
            particles: [],
            initialized: false,
            startTime: null,
            stage: 1
        };
        this.animations.unlock = { alpha: 0, message: '' };
        this.animations.combo = { scale: 1, count: 0, alpha: 0 };

        this.transitionEffects = {
            blur: 0,
            fadeAlpha: 0,
            vignetteRadius: 1,
            desaturation: 0,
            zoomScale: 1
        };

        this.canvas.style.filter = 'none';
    }

    initializeEdgeGlow() {
        this.edgeGlow = {
            // Configuration
            maxDistance: 2, // blocks from edge to consider
            baseOpacity: 0.08,
            maxOpacity: 0.16,
            glowRadius: 15, // pixels outside board
            pulseEffects: [],

            // Edge definitions
            edges: {
                left: {
                    x: this.dimensions.boardX - 15,
                    y: this.dimensions.boardY,
                    width: 20,
                    height: this.dimensions.boardHeight
                },
                right: {
                    x: this.dimensions.boardX + this.dimensions.boardWidth - 5,
                    y: this.dimensions.boardY,
                    width: 20,
                    height: this.dimensions.boardHeight
                },
                bottom: {
                    x: this.dimensions.boardX,
                    y: this.dimensions.boardY + this.dimensions.boardHeight - 5,
                    width: this.dimensions.boardWidth,
                    height: 20
                }
            }
        };
    }

    calculateEdgeGlow(state) {
        const glow = {
            left: 0,
            right: 0,
            bottom: 0
        };

        // Check current piece
        if (state.current && (state.phase === 'PLAYING' || state.phase === 'LOCKING')) {
            state.current.shape.forEach((row, dy) => {
                row.forEach((cell, dx) => {
                    if (!cell) return;

                    const blockX = state.current.gridX + dx;
                    const blockY = state.current.gridY + dy;

                    // Skip if above visible board
                    if (blockY < 0) return;

                    // Left edge (distance-based intensity)
                    if (blockX <= this.edgeGlow.maxDistance) {
                        const distance = blockX;
                        const intensity = 1 - (distance / this.edgeGlow.maxDistance);
                        glow.left = Math.max(glow.left, intensity);
                    }

                    // Right edge
                    if (blockX >= 10 - this.edgeGlow.maxDistance - 1) {
                        const distance = 9 - blockX;
                        const intensity = 1 - (distance / this.edgeGlow.maxDistance);
                        glow.right = Math.max(glow.right, intensity);
                    }

                    // Bottom edge
                    if (blockY >= 20 - this.edgeGlow.maxDistance - 1) {
                        const distance = 19 - blockY;
                        const intensity = 1 - (distance / this.edgeGlow.maxDistance);
                        glow.bottom = Math.max(glow.bottom, intensity);
                    }
                });
            });
        }

        // Check board density for ambient glow
        const density = this.calculateBoardDensity(state.board);

        // Add subtle ambient glow based on filled blocks
        glow.left = Math.min(1, glow.left + density.left * 0.3);
        glow.right = Math.min(1, glow.right + density.right * 0.3);
        glow.bottom = Math.min(1, glow.bottom + density.bottom * 0.5);

        return glow;
    }

    calculateBoardDensity(board) {
        const density = {
            left: 0,
            right: 0,
            bottom: 0
        };

        let leftFilled = 0, rightFilled = 0, bottomFilled = 0;
        let leftTotal = 0, rightTotal = 0, bottomTotal = 0;

        board.forEach((row, y) => {
            // Count edge columns
            if (row[0]) leftFilled++;
            if (row[9]) rightFilled++;
            leftTotal++;
            rightTotal++;

            // Count bottom rows (last 3 rows)
            if (y >= 17) {
                row.forEach(cell => {
                    if (cell) bottomFilled++;
                    bottomTotal++;
                });
            }
        });

        density.left = leftTotal > 0 ? leftFilled / leftTotal : 0;
        density.right = rightTotal > 0 ? rightFilled / rightTotal : 0;
        density.bottom = bottomTotal > 0 ? bottomFilled / bottomTotal : 0;

        return density;
    }

    renderEdgeGlow(state) {
        if (!this.config.get('graphics.edgeGlow')) return;

        const glowIntensity = this.calculateEdgeGlow(state);

        this.ctx.save();

        // Render each edge
        ['left', 'right', 'bottom'].forEach(edge => {
            if (glowIntensity[edge] > 0.01) {
                this.renderEdge(edge, glowIntensity[edge], state);
            }
        });

        // Render any active pulse effects
        this.renderEdgePulses();

        this.ctx.restore();
    }

    renderEdge(edge, intensity, state) {
        const edgeData = this.edgeGlow.edges[edge];
        const opacity = this.edgeGlow.baseOpacity +
                       (this.edgeGlow.maxOpacity - this.edgeGlow.baseOpacity) * intensity;

        let gradient;

        switch(edge) {
            case 'left':
                gradient = this.ctx.createLinearGradient(
                    edgeData.x, edgeData.y,
                    edgeData.x + edgeData.width, edgeData.y
                );
                gradient.addColorStop(0, 'rgba(138, 43, 226, 0)');
                gradient.addColorStop(0.3, `rgba(138, 43, 226, ${opacity * 0.7})`);
                gradient.addColorStop(0.7, `rgba(138, 43, 226, ${opacity})`);
                gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
                break;

            case 'right':
                gradient = this.ctx.createLinearGradient(
                    edgeData.x + edgeData.width, edgeData.y,
                    edgeData.x, edgeData.y
                );
                gradient.addColorStop(0, 'rgba(138, 43, 226, 0)');
                gradient.addColorStop(0.3, `rgba(138, 43, 226, ${opacity * 0.7})`);
                gradient.addColorStop(0.7, `rgba(138, 43, 226, ${opacity})`);
                gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
                break;

            case 'bottom':
                gradient = this.ctx.createLinearGradient(
                    edgeData.x, edgeData.y + edgeData.height,
                    edgeData.x, edgeData.y
                );
                gradient.addColorStop(0, 'rgba(138, 43, 226, 0)');
                gradient.addColorStop(0.3, `rgba(138, 43, 226, ${opacity * 0.7})`);
                gradient.addColorStop(0.7, `rgba(138, 43, 226, ${opacity})`);
                gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
                break;
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(edgeData.x, edgeData.y, edgeData.width, edgeData.height);
    }

    addEdgePulse(piece) {
        const edges = this.getAffectedEdges(piece);
        if (edges.length > 0) {
            this.edgeGlow.pulseEffects.push({
                edges: edges,
                startTime: Date.now(),
                duration: 300,
                color: piece.color
            });
        }
    }

    getAffectedEdges(piece) {
        const edges = [];

        piece.shape.forEach((row, dy) => {
            row.forEach((cell, dx) => {
                if (!cell) return;

                const blockX = piece.gridX + dx;
                const blockY = piece.gridY + dy;

                if (blockX === 0 && !edges.includes('left')) edges.push('left');
                if (blockX === 9 && !edges.includes('right')) edges.push('right');
                if (blockY === 19 && !edges.includes('bottom')) edges.push('bottom');
            });
        });

        return edges;
    }

    renderEdgePulses() {
        const now = Date.now();

        this.edgeGlow.pulseEffects = this.edgeGlow.pulseEffects.filter(pulse => {
            const elapsed = now - pulse.startTime;
            if (elapsed > pulse.duration) return false;

            const progress = elapsed / pulse.duration;
            const intensity = Math.sin(progress * Math.PI) * 0.3;

            pulse.edges.forEach(edge => {
                const edgeData = this.edgeGlow.edges[edge];

                // Create colored pulse gradient - use color directly
                let gradient;

                switch(edge) {
                    case 'left':
                        gradient = this.ctx.createLinearGradient(
                            edgeData.x, edgeData.y,
                            edgeData.x + edgeData.width * 1.5, edgeData.y
                        );
                        break;
                    case 'right':
                        gradient = this.ctx.createLinearGradient(
                            edgeData.x + edgeData.width, edgeData.y,
                            edgeData.x - edgeData.width * 0.5, edgeData.y
                        );
                        break;
                    case 'bottom':
                        gradient = this.ctx.createLinearGradient(
                            edgeData.x, edgeData.y + edgeData.height,
                            edgeData.x, edgeData.y - edgeData.height * 0.5
                        );
                        break;
                }

                // Use hex color with alpha for gradients
                const baseColor = pulse.color.replace('#', '');
                const r = parseInt(baseColor.substr(0, 2), 16);
                const g = parseInt(baseColor.substr(2, 2), 16);  
                const b = parseInt(baseColor.substr(4, 2), 16);

                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
                gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${intensity})`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(edgeData.x, edgeData.y, edgeData.width, edgeData.height);
            });

            return true;
        });
    }

    renderPracticeIndicator() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
        this.ctx.font = '14px monospace';
        this.ctx.fillText('PRACTICE MODE - No Rewards', 10, 25);
        this.ctx.restore();
    }
}




