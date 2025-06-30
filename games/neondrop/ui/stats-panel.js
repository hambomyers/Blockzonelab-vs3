/**
 * stats-panel.js - Game statistics panel
 * Mirrors the guide panel but on the right side
 */

export class StatsPanel {    constructor() {
        this.container = null;
        this.isVisible = false;
        this.isMobile = window.BlockZoneMobile?.isMobile() || window.innerWidth < 1200;
        this.updateInterval = null;
        this.retryCount = 0;  // Add retry counter
        this.maxRetries = 20; // Max retries before giving up
        
        // Session tracking (resets when page loads)
        this.sessionStats = {
            gamesPlayed: 0,
            highScore: 0,
            totalScore: 0,
            totalLines: 0,
            maxCombo: 0,
            startTime: Date.now()
        };

        this.setupPanel();
        this.setupEventListeners();
        this.startAutoUpdate();
        this.setupGameEventListeners();

        // Wait to position until game is ready
        if (!this.isMobile) {
            setTimeout(() => this.positionPanel(), 500);
        }
    }

    positionPanel() {
        if (this.isMobile) return;const getZones = () => {
            if (!window.neonDrop?.renderer?.dimensions?.zones) {
                // Check retry limit to prevent infinite loop
                if (this.retryCount >= this.maxRetries) {
                    console.warn('⚠️ StatsPanel: Max retries reached, giving up positioning');
                    return false;
                }
                this.retryCount++;
                setTimeout(() => this.positionPanel(), 100);
                return false;
            }
            return window.neonDrop.renderer.dimensions.zones;
        };

        const zones = getZones();
        if (!zones) return;

        const rightZone = zones.rightPanel;

        // Only position if we have valid space
        if (rightZone.width < 100) {
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'flex';        // Calculate sizes
        const collapsedWidth = 80;
        const expandedWidth = Math.min(308, rightZone.width - 40);        // Use zone's centerX for positioning with additional scrollbar safety check
        // Ensure scrollbar compensation even if viewport manager missed it
        const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
        const scrollbarCompensation = scrollbarWidth > 0 ? scrollbarWidth : 17; // Fallback to typical scrollbar width
        
        const collapsedLeft = rightZone.centerX - (collapsedWidth / 2) + scrollbarCompensation;
        const expandedLeft = rightZone.centerX - (expandedWidth / 2) + scrollbarCompensation;// Store positions with professional title-level elevation
        this.container.dataset.collapsedLeft = collapsedLeft;
        this.container.dataset.expandedLeft = expandedLeft;
        this.container.dataset.collapsedWidth = collapsedWidth;
        this.container.dataset.expandedWidth = expandedWidth;        // Position panels at board top + 1 block for professional spacing
        const boardTop = zones.board.y;
        const blockSize = window.neonDrop?.renderer?.dimensions?.blockSize || 32;
        const panelElevation = boardTop + blockSize; // One block down from board top
          // Set initial position with proper block-based spacing
        this.container.style.left = `${collapsedLeft}px`;
        this.container.style.width = `${collapsedWidth}px`;
        this.container.style.top = `${panelElevation}px`;
    }setupPanel() {
        this.container = document.createElement('div');
        this.container.className = 'stats-panel';
        
        // FIXED: Show full content immediately instead of just "STATS"
        this.container.innerHTML = this.getContent();
        
        // Store the full content for hover expansion
        this.fullContent = this.getContent();

        document.body.appendChild(this.container);
        
        // FIXED: Initialize stats immediately
        setTimeout(() => this.updateStats(), 100);
    }    setupEventListeners() {
        // Desktop hover - expand to full content
        this.container.addEventListener('mouseenter', () => {
            this.container.classList.add('visible');
            // Update stats with current data
            this.updateStats();
            // Expand size and position  
            this.container.style.left = this.container.dataset.expandedLeft + 'px';
            this.container.style.width = this.container.dataset.expandedWidth + 'px';
        });

        this.container.addEventListener('mouseleave', () => {
            this.container.classList.remove('visible');
            // FIXED: Keep full content visible, just collapse size
            // Return to collapsed position
            this.container.style.left = this.container.dataset.collapsedLeft + 'px';
            this.container.style.width = this.container.dataset.collapsedWidth + 'px';
        });

        window.addEventListener('resize', () => {
            this.positionPanel();
        });
    }

    getContent() {
        return `
            <div class="stats-header">STATS</div>

            <div class="stats-section">
                <h3>■ CURRENT GAME</h3>
                <ul id="current-stats">
                    <li>Score: <span class="stat-value">0</span></li>
                    <li>Lines: <span class="stat-value">0</span></li>
                    <li>Level: <span class="stat-value">1</span></li>
                    <li>Pieces: <span class="stat-value">0</span></li>
                </ul>
            </div>

            <div class="stats-section">
                <h3>■ SESSION BEST</h3>
                <ul id="session-stats">
                    <li>High Score: <span class="stat-value">0</span></li>
                    <li>Max Combo: <span class="stat-value">0</span></li>
                    <li>Most Lines: <span class="stat-value">0</span></li>
                </ul>
            </div>

            <div class="stats-section">
                <h3>■ ALL TIME</h3>
                <ul id="alltime-stats">
                    <li>Games Played: <span class="stat-value">0</span></li>
                    <li>Total Score: <span class="stat-value">0</span></li>
                    <li>Total Lines: <span class="stat-value">0</span></li>
                    <li>Avg Score: <span class="stat-value">0</span></li>
                </ul>
            </div>

            <div class="stats-section">
                <h3>■ PERFORMANCE</h3>
                <ul id="performance-stats">
                    <li>APM: <span class="stat-value">0</span></li>
                    <li>PPS: <span class="stat-value">0</span></li>
                    <li>Efficiency: <span class="stat-value">0%</span></li>
                </ul>
            </div>
        `;
    }

    updateStats() {
        if (!window.neonDrop) {
            console.log('StatsPanel: window.neonDrop not available');
            return;
        }        try {
            const state = window.neonDrop.state();
            const config = window.neonDrop.getConfig();
            
            if (!state) {
                console.log('StatsPanel: game state not available');
                return;
            }

            console.log('StatsPanel: Updating with state:', state);

            const stats = config?.getStats ? config.getStats() : {};

            // Current game
            this.updateSection('current-stats', {
                'Score': state.score || 0,
                'Lines': state.lines || 0,
                'Level': state.level || 1,
                'Pieces': state.pieces || 0
            });

            // Session best (uses our session tracking)
            this.updateSection('session-stats', {
                'High Score': Math.max(state.score || 0, this.sessionStats.highScore),
                'Games Played': this.sessionStats.gamesPlayed,
                'Max Combo': Math.max(state.maxCombo || 0, this.sessionStats.maxCombo),
                'Total Lines': this.sessionStats.totalLines
            });

            // All time
            this.updateSection('alltime-stats', {
                'Games Played': stats.gamesPlayed || 0,
                'Total Score': stats.totalScore || 0,
                'Total Lines': stats.totalLines || 0,
                'Avg Score': stats.averageScore || 0
            });

            // Performance
            const apm = this.calculateAPM(state);
            const pps = this.calculatePPS(state);

            this.updateSection('performance-stats', {
                'APM': Math.round(apm),
                'PPS': pps.toFixed(1),
                'Efficiency': Math.round((state.score / Math.max(1, state.pieces * 100)) * 100) + '%'
            });
        } catch (error) {
            console.error('StatsPanel: Error updating stats:', error);
        }
    }

    updateSection(sectionId, data) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const values = section.querySelectorAll('.stat-value');
        Object.values(data).forEach((value, index) => {
            if (values[index]) {
                values[index].textContent = value;
            }
        });
    }

    calculateAPM(state) {
        if (!state.startTime || state.phase === 'MENU') return 0;
        const minutes = (Date.now() - state.startTime) / 60000;
        return minutes > 0 ? (state.pieces || 0) / minutes * 10 : 0; // Rough estimate
    }

    calculatePPS(state) {
        if (!state.startTime || state.phase === 'MENU') return 0;
        const seconds = (Date.now() - state.startTime) / 1000;
        return seconds > 0 ? (state.pieces || 0) / seconds : 0;
    }

    /**
     * Start automatic stats updates during gameplay
     */
    startAutoUpdate() {
        // FIXED: Update stats every 500ms continuously, not just when hovering
        this.updateInterval = setInterval(() => {
            this.updateStats();
        }, 500);
    }

    /**
     * Stop automatic updates (cleanup)
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Setup listeners for game events to track session stats
     */
    setupGameEventListeners() {
        // Listen for game over events to update session stats
        window.addEventListener('gameOver', (e) => {
            this.updateSessionStats(e.detail);
        });
        
        // Listen for custom game events if available
        document.addEventListener('gameCompleted', (e) => {
            this.updateSessionStats(e.detail);
        });
    }

    /**
     * Update session statistics when a game ends
     */
    updateSessionStats(gameData) {
        console.log('StatsPanel: Updating session stats with:', gameData);
        
        this.sessionStats.gamesPlayed++;
        this.sessionStats.totalScore += gameData.score || 0;
        this.sessionStats.totalLines += gameData.linesCleared || 0;
        
        if ((gameData.score || 0) > this.sessionStats.highScore) {
            this.sessionStats.highScore = gameData.score || 0;
        }
        
        if ((gameData.maxCombo || 0) > this.sessionStats.maxCombo) {
            this.sessionStats.maxCombo = gameData.maxCombo || 0;
        }
        
        console.log('StatsPanel: Session stats updated:', this.sessionStats);
    }

    destroy() {
        this.stopAutoUpdate();
        this.container?.remove();
    }
}
