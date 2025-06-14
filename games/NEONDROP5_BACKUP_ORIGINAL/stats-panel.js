/**
 * stats-panel.js - Game statistics panel
 * Mirrors the guide panel but on the right side
 */

export class StatsPanel {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.isMobile = window.innerWidth < 1200;

        this.setupPanel();
        this.setupEventListeners();

        // Wait to position until game is ready
        if (!this.isMobile) {
            setTimeout(() => this.positionPanel(), 500);
        }
    }

    positionPanel() {
        if (this.isMobile) return;

        const getZones = () => {
            if (!window.neonDrop?.game?.renderer?.dimensions?.zones) {
                setTimeout(() => this.positionPanel(), 100);
                return false;
            }
            return window.neonDrop.game.renderer.dimensions.zones;
        };

        const zones = getZones();
        if (!zones) return;

        const rightZone = zones.rightPanel;

        // Only position if we have valid space
        if (rightZone.width < 100) {
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'flex';

        // Calculate sizes
        const collapsedWidth = 80;
        const expandedWidth = Math.min(308, rightZone.width - 40);

        // Use zone's centerX for positioning
        const collapsedLeft = rightZone.centerX - (collapsedWidth / 2);
        const expandedLeft = rightZone.centerX - (expandedWidth / 2);

        // Store positions
        this.container.dataset.collapsedLeft = collapsedLeft;
        this.container.dataset.expandedLeft = expandedLeft;
        this.container.dataset.collapsedWidth = collapsedWidth;
        this.container.dataset.expandedWidth = expandedWidth;

        // Set initial position
        this.container.style.left = `${collapsedLeft}px`;
        this.container.style.width = `${collapsedWidth}px`;
    }

    setupPanel() {
        this.container = document.createElement('div');
        this.container.className = 'stats-panel';
        this.container.innerHTML = this.getContent();

        this.container.style.maxHeight = '80vh';
        this.container.style.padding = '20px';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';

        this.container.style.transition = 'left 0.3s ease, width 0.3s ease, padding 0.3s ease';

        const header = this.container.querySelector('.stats-header');
        if (header) {
            header.style.textAlign = 'center';
            header.style.marginBottom = '20px';
        }

        const sections = this.container.querySelectorAll('.stats-section');
        sections.forEach(section => {
            section.style.marginBottom = '20px';
            const h3 = section.querySelector('h3');
            if (h3) {
                h3.style.margin = '0 0 10px 0';
            }
        });

        document.body.appendChild(this.container);
    }

    setupEventListeners() {
        this.container.addEventListener('mouseenter', () => {
            this.container.classList.add('visible');
            this.container.style.left = this.container.dataset.expandedLeft + 'px';
            this.container.style.width = this.container.dataset.expandedWidth + 'px';
            this.container.style.padding = '20px 20px 68px 20px';
            this.container.style.alignItems = 'flex-start';

            this.updateStats();

            const sections = this.container.querySelectorAll('.stats-section');
            sections.forEach(section => {
                section.style.transform = 'translateX(0)';
            });
        });

        this.container.addEventListener('mouseleave', () => {
            this.container.classList.remove('visible');
            this.container.style.left = this.container.dataset.collapsedLeft + 'px';
            this.container.style.width = this.container.dataset.collapsedWidth + 'px';
            this.container.style.padding = '20px';
            this.container.style.alignItems = 'center';

            const sections = this.container.querySelectorAll('.stats-section');
            sections.forEach(section => {
                section.style.transform = 'translateX(-10px)';
            });
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
        if (!window.neonDrop) return;

        const state = window.neonDrop.state();
        const config = window.neonDrop.config();
        const stats = config.getStats();

        // Current game
        this.updateSection('current-stats', {
            'Score': state.score || 0,
            'Lines': state.lines || 0,
            'Level': state.level || 1,
            'Pieces': state.pieces || 0
        });

        // Session best
        this.updateSection('session-stats', {
            'High Score': Math.max(state.score || 0, stats.highScore || 0),
            'Max Combo': state.maxCombo || 0,
            'Most Lines': state.lines || 0
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

    destroy() {
        this.container?.remove();
    }
}
