// Universal Starfield System - Auto-activates for ALL quizzes
// This creates the "Black Star Portal" experience across the entire academy

class UniversalStarfield {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.stars = [];
        this.animationId = null;
        this.isActive = false;
        
        // Auto-detect quiz activation
        this.observeQuizActivation();
    }
    
    observeQuizActivation() {
        // Watch for quiz containers becoming visible
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const element = mutation.target;
                    if (element.id === 'quiz-container' || element.classList.contains('quiz-container')) {
                        if (!element.classList.contains('hidden') && !this.isActive) {
                            this.activateStarfield();
                        } else if (element.classList.contains('hidden') && this.isActive) {
                            this.deactivateStarfield();
                        }
                    }
                }
            });
        });
        
        // Also watch for style changes
        document.addEventListener('DOMContentLoaded', () => {
            const quizContainers = document.querySelectorAll('.quiz-container, #quiz-container');
            quizContainers.forEach(container => {
                observer.observe(container, { 
                    attributes: true, 
                    attributeFilter: ['class', 'style'] 
                });
            });
        });
        
        // Manual activation method for showQuiz() functions
        window.activateUniversalStarfield = () => this.activateStarfield();
        window.deactivateUniversalStarfield = () => this.deactivateStarfield();
    }
    
    activateStarfield() {
        if (this.isActive) return;
        
        this.isActive = true;
        document.body.classList.add('quiz-active');
        
        // Create or find canvas
        this.canvas = document.getElementById('universal-starfield') || this.createCanvas();
        this.ctx = this.canvas.getContext('2d');
        
        // Setup canvas dimensions
        this.resizeCanvas();
        
        // Initialize stars
        this.initStars();
        
        // Start animation
        this.animate();
        
        // Handle resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        console.log('🌟 Universal Starfield Activated');
    }
    
    deactivateStarfield() {
        if (!this.isActive) return;
        
        this.isActive = false;
        document.body.classList.remove('quiz-active');
        
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Remove canvas
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
        
        console.log('🌟 Universal Starfield Deactivated');
    }
    
    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'universal-starfield';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: -1;
            pointer-events: none;
        `;
        
        // Insert at the beginning of body or quiz container
        const quizContainer = document.querySelector('.quiz-container');
        if (quizContainer && !quizContainer.classList.contains('hidden')) {
            quizContainer.insertBefore(canvas, quizContainer.firstChild);
        } else {
            document.body.insertBefore(canvas, document.body.firstChild);
        }
        
        return canvas;
    }
      resizeCanvas() {
        if (!this.canvas) return;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Update star center positions when canvas resizes
        if (this.stars.length > 0) {
            const newCenterX = this.canvas.width / 2;
            const newCenterY = this.canvas.height / 2;
            
            this.stars.forEach(star => {
                star.centerX = newCenterX;
                star.centerY = newCenterY;
            });
        }
    }    initStars() {
        this.stars = [];
        const numStars = 400;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Define zones in pixels (converted from inches)
        const spawnZoneRadius = 48; // ~1 inch diameter (24px radius)
        const fullOpacityRadius = 144; // ~3 inch diameter (72px radius) 
        const maxDistance = Math.min(this.canvas.width, this.canvas.height) * 0.8;
        
        for (let i = 0; i < numStars; i++) {
            const angle = Math.random() * Math.PI * 2;
            
            // Distribute stars from spawn zone to edge
            const startDistance = Math.random() * (maxDistance - spawnZoneRadius) + spawnZoneRadius;
            
            // Star color variety - realistic stellar colors
            const starType = Math.random();
            let color, temperature;
            if (starType < 0.1) {
                color = '#b3c7ff'; // Blue giant
                temperature = 'hot';
            } else if (starType < 0.3) {
                color = '#ffffff'; // White dwarf
                temperature = 'neutral';
            } else if (starType < 0.7) {
                color = '#fff4e6'; // Yellowish white
                temperature = 'warm';
            } else if (starType < 0.9) {
                color = '#ffd4a3'; // Orange
                temperature = 'warm';
            } else {
                color = '#ffb366'; // Red giant
                temperature = 'cool';
            }
            
            this.stars.push({
                centerX: centerX,
                centerY: centerY,
                angle: angle,
                distance: startDistance,
                speed: Math.random() * 0.3 + 0.02, // Very slow and gentle
                size: Math.random() * 1.0 + 0.2,
                maxOpacity: Math.random() * 0.7 + 0.3, // Target opacity
                twinkle: Math.random() * 0.006 + 0.001,
                color: color,
                temperature: temperature,
                spawnZoneRadius: spawnZoneRadius,
                fullOpacityRadius: fullOpacityRadius,
                x: centerX + Math.cos(angle) * startDistance,
                y: centerY + Math.sin(angle) * startDistance
            });
        }
    }
    
    animate() {
        if (!this.isActive || !this.ctx) return;
        
        // Clear canvas with deep space background
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add subtle gradient
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2
        );
        gradient.addColorStop(0, 'rgba(0, 0, 34, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);        // Draw and animate stars - SMOOTH OPACITY FADE FROM CENTER
        this.stars.forEach(star => {
            // Move star outward very slowly
            star.distance += star.speed;
            
            // Update actual position based on angle and distance
            star.x = star.centerX + Math.cos(star.angle) * star.distance;
            star.y = star.centerY + Math.sin(star.angle) * star.distance;
            
            // Calculate current distance from center
            const currentDistanceFromCenter = star.distance;
            
            // Calculate opacity based on distance from center
            let renderOpacity;
            
            if (currentDistanceFromCenter <= star.spawnZoneRadius) {
                // In spawn zone (1 inch) - very low opacity (1-5%)
                const spawnRatio = currentDistanceFromCenter / star.spawnZoneRadius;
                renderOpacity = star.maxOpacity * (0.01 + spawnRatio * 0.04); // 1% to 5%
            } else if (currentDistanceFromCenter <= star.fullOpacityRadius) {
                // In fade zone (1-3 inch) - smooth transition to full opacity
                const fadeRatio = (currentDistanceFromCenter - star.spawnZoneRadius) / 
                                 (star.fullOpacityRadius - star.spawnZoneRadius);
                renderOpacity = star.maxOpacity * (0.05 + fadeRatio * 0.95); // 5% to 100%
            } else {
                // Beyond 3 inches - full opacity
                renderOpacity = star.maxOpacity;
            }
            
            // Add gentle twinkle effect
            const twinkleEffect = Math.sin(Date.now() * star.twinkle) * 0.001;
            renderOpacity += twinkleEffect;
            renderOpacity = Math.max(0.01, Math.min(1.0, renderOpacity));
            
            // Reset star when it goes off screen - restart from spawn zone
            const maxDistance = Math.max(this.canvas.width, this.canvas.height) * 0.9;
            if (star.distance > maxDistance) {
                star.distance = star.spawnZoneRadius * Math.random(); // Reset to spawn zone
                star.angle = Math.random() * Math.PI * 2;
            }
            
            // Draw star with calculated opacity
            this.ctx.save();
            this.ctx.globalAlpha = renderOpacity;
            this.ctx.fillStyle = star.color;
            
            // Subtle glow that scales with opacity
            const glowIntensity = Math.min(renderOpacity * 2, 1);
            if (star.temperature === 'hot') {
                this.ctx.shadowBlur = star.size * 0.6 * glowIntensity;
                this.ctx.shadowColor = star.color;
            } else if (star.temperature === 'cool') {
                this.ctx.shadowBlur = star.size * 0.4 * glowIntensity;
                this.ctx.shadowColor = star.color;
            } else {
                this.ctx.shadowBlur = star.size * 0.3 * glowIntensity;
                this.ctx.shadowColor = '#ffffff';
            }
            
            // Draw main star
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Only add sparkles to bright stars that are fully rendered (beyond 3 inches)
            if (renderOpacity > 0.8 && currentDistanceFromCenter > star.fullOpacityRadius) {
                this.ctx.globalAlpha = renderOpacity * 0.15;
                this.ctx.strokeStyle = star.color;
                this.ctx.lineWidth = 0.2;
                this.ctx.beginPath();
                // Vertical line
                this.ctx.moveTo(star.x, star.y - star.size * 1.2);
                this.ctx.lineTo(star.x, star.y + star.size * 1.2);
                // Horizontal line
                this.ctx.moveTo(star.x - star.size * 1.2, star.y);
                this.ctx.lineTo(star.x + star.size * 1.2, star.y);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.universalStarfield = new UniversalStarfield();
});

// Also initialize immediately if DOM already loaded
if (document.readyState === 'loading') {
    // Do nothing, wait for DOMContentLoaded
} else {
    // DOM already loaded
    window.universalStarfield = new UniversalStarfield();
}
