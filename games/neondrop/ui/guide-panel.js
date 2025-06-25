/**
 * guide-panel.js - Beautiful interactive game guide
 * Centered between viewport and game board
 * Shows just "GUIDE" until hover
 * UPDATED: Fixed positioning to center in left space
 */

export class GuidePanel {    constructor() {
        this.container = null;
        this.mobileModal = null;
        this.isVisible = false;
        this.isMobile = window.BlockZoneMobile?.isMobile() || window.innerWidth < 1200;
        this.retryCount = 0;  // Add retry counter
        this.maxRetries = 20; // Max retries before giving up

        this.setupPanel();
        this.setupMobileButton();
        this.setupEventListeners();

        // Wait to position until game is ready
        if (!this.isMobile) {
            // Try positioning after a delay
            setTimeout(() => this.positionPanel(), 500);
        }    }positionPanel() {
        if (this.isMobile) return;

        // Get zones from ViewportManager
        const getZones = () => {
            if (!window.neonDrop?.renderer?.dimensions?.zones) {
                // Check retry limit to prevent infinite loop
                if (this.retryCount >= this.maxRetries) {
                    console.warn('⚠️ GuidePanel: Max retries reached, giving up positioning');
                    return false;
                }
                this.retryCount++;
                // Try again if not ready
                setTimeout(() => this.positionPanel(), 100);
                return false;
            }
            return window.neonDrop.renderer.dimensions.zones;
        };

        const zones = getZones();
        if (!zones) return;

        const leftZone = zones.leftPanel;

        // Only position if we have valid space
        if (leftZone.width < 100) {
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'flex';

        // Calculate sizes
        const collapsedWidth = 80;
        const expandedWidth = Math.min(308, leftZone.width - 40); // Original + 48px

        // Use zone's centerX for positioning
        const collapsedLeft = leftZone.centerX - (collapsedWidth / 2);
        const expandedLeft = leftZone.centerX - (expandedWidth / 2);        // Store positions with professional title-level elevation
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
        this.container.className = 'guide-panel';
        // Start with just the glowing word
        this.container.innerHTML = 'GUIDE';
        
        // Store the full content for hover expansion
        this.fullContent = this.getContent();

        document.body.appendChild(this.container);

        // Mobile modal
        this.mobileModal = document.createElement('div');
        this.mobileModal.className = 'guide-modal';
        this.mobileModal.innerHTML = `
            <div class="guide-modal-content">
                <button class="guide-modal-close">&times;</button>
                ${this.getContent()}
            </div>
        `;
        document.body.appendChild(this.mobileModal);
    }

    setupMobileButton() {
        const button = document.createElement('button');
        button.className = 'guide-mobile-button';
        button.innerHTML = '?';
        button.setAttribute('aria-label', 'Game Guide');
        document.body.appendChild(button);

        button.addEventListener('click', () => this.showMobileModal());
    }

    setupEventListeners() {        // Desktop hover - expand to full content
        this.container.addEventListener('mouseenter', () => {
            this.container.classList.add('visible');
            // Switch to full content
            this.container.innerHTML = this.fullContent;
            // Expand size and position
            this.container.style.left = this.container.dataset.expandedLeft + 'px';
            this.container.style.width = this.container.dataset.expandedWidth + 'px';
            
            // Setup toggle event listener after content is added
            this.setupTwoPlayerToggle();
        });

        this.container.addEventListener('mouseleave', () => {
            this.container.classList.remove('visible');
            // Switch back to just the word
            this.container.innerHTML = 'GUIDE';
            // Return to collapsed position
            this.container.style.left = this.container.dataset.collapsedLeft + 'px';
            this.container.style.width = this.container.dataset.collapsedWidth + 'px';
        });

        // Mobile close
        const closeBtn = this.mobileModal.querySelector('.guide-modal-close');
        closeBtn.addEventListener('click', () => this.hideMobileModal());

        // Close on background click
        this.mobileModal.addEventListener('click', (e) => {
            if (e.target === this.mobileModal) {
                this.hideMobileModal();
            }
        });

        // Setup toggle for mobile modal too
        this.setupTwoPlayerToggle();

        // Resize handling
        window.addEventListener('resize', () => {
            const wasDesktop = !this.isMobile;
            this.isMobile = window.innerWidth < 1200;

            if (wasDesktop && this.isMobile) {
                this.container.style.display = 'none';
                document.querySelector('.guide-mobile-button').style.display = 'block';
            } else if (!wasDesktop && !this.isMobile) {
                this.container.style.display = 'flex';
                document.querySelector('.guide-mobile-button').style.display = 'none';
            }

            // Reposition if still desktop
            if (!this.isMobile) {
                this.positionPanel();
            }
        });
    }

    setupTwoPlayerToggle() {
        const toggle = document.getElementById('twoPlayerToggle');
        const info = document.getElementById('twoPlayerInfo');
        
        if (!toggle) return;
        
        // Load saved state
        const savedState = localStorage.getItem('neondrop_two_player_mode');
        if (savedState === 'true') {
            toggle.checked = true;
            if (info) info.style.display = 'block';
        }
        
        toggle.addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            
            // Save state
            localStorage.setItem('neondrop_two_player_mode', isEnabled.toString());
            
            // Show/hide info
            if (info) {
                info.style.display = isEnabled ? 'block' : 'none';
            }
            
            // Emit event for game engine
            this.emitTwoPlayerModeChange(isEnabled);
        });
    }

    emitTwoPlayerModeChange(isEnabled) {
        // Dispatch custom event for game engine to listen to
        const event = new CustomEvent('twoPlayerModeChange', {
            detail: { enabled: isEnabled }
        });
        document.dispatchEvent(event);
    }

    getContent() {
        return `
            <div class="guide-header">GUIDE</div>

            <div class="guide-section">
                <h3>■ NEON DROP</h3>
                <p>A modern twist on the classic block game with special pieces and dynamic gravity</p>
            </div>

            <div class="guide-section">
                <h3>■ SPECIAL PIECES</h3>
                <ul>
                    <li><span class="guide-icon">↑</span> <strong>FLOAT</strong> - Press UP to fly! Limited uses</li>
                    <li><span class="guide-icon">+</span> <strong>PLUS</strong> - Unlocked at 2,000 points</li>
                    <li><span class="guide-icon">U</span> <strong>U-SHAPE</strong> - Unlocked at 4,000 points</li>
                    <li><span class="guide-icon">◆</span> <strong>DOT</strong> - Unlocked at 6,000 points</li>
                    <li><span class="guide-icon">⌐</span> <strong>CORNER</strong> - Unlocked at 8,000 points</li>
                    <li><span class="guide-icon">‖</span> <strong>PIPE</strong> - Unlocked at 10,000 points</li>
                    <li><span class="guide-icon">★</span> <strong>STAR</strong> - Unlocked at 12,000 points</li>
                    <li><span class="guide-icon">Z</span> <strong>ZIGZAG</strong> - Unlocked at 14,000 points</li>
                    <li><span class="guide-icon">═</span> <strong>BRIDGE</strong> - Unlocked at 16,000 points</li>
                    <li><span class="guide-icon">◊</span> <strong>DIAMOND</strong> - Unlocked at 18,000 points</li>
                    <li><span class="guide-icon">◆◆</span> <strong>TWINS</strong> - Unlocked at 20,000 points</li>
                </ul>
            </div>

            <div class="guide-section">
                <h3>■ HOW TO PLAY</h3>
                <p>Stack falling pieces to create complete horizontal lines. When you fill an entire row, it disappears! Clear multiple lines at once for big points.</p>
            </div>

            <div class="guide-section">
                <h3>■ GRAVITY & LOCKING</h3>
                <ul>
                    <li>• Pieces fall faster over time</li>
                    <li>• Each level gives 5% gravity reduction</li>
                    <li>• When pieces land, they pulse before locking</li>
                    <li>• Lock delay: 0.75s (normal pieces)</li>
                    <li>• Lock delay: 0.9s (FLOAT piece)</li>
                    <li>• Lock delay: 1.5s (danger spawn)</li>
                </ul>
            </div>

            <div class="guide-section">
                <h3>■ CONTROLS</h3>
                <ul>
                    <li><span class="guide-key">←→↓</span> / <span class="guide-key">ASD</span> - Move pieces</li>
                    <li><span class="guide-key">↑</span> / <span class="guide-key">W</span> - Rotate (or FLOAT up)</li>
                    <li><span class="guide-key">SPACE</span> - Hard drop</li>
                    <li><span class="guide-key">C</span> / <span class="guide-key">SHIFT</span> - Hold piece</li>
                    <li><span class="guide-key">P</span> / <span class="guide-key">ESC</span> - Pause</li>
                    <li><span class="guide-key">+/-</span> - Adjust ghost opacity</li>
                </ul>
            </div>

            <div class="guide-section">
                <h3>■ 2-PLAYER MODE</h3>
                <div class="two-player-toggle">
                    <label class="toggle-switch">
                        <input type="checkbox" id="twoPlayerToggle">
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">Local 2-Player</span>
                </div>
                <div class="two-player-info" id="twoPlayerInfo" style="display: none;">
                    <p><strong>Player 1:</strong> WASD + Space</p>
                    <p><strong>Player 2:</strong> Arrow Keys + Enter</p>
                    <p>Split-screen competition mode</p>
                </div>
            </div>

            <div class="guide-section">
                <h3>■ SCORING & COMBOS</h3>
                <ul>
                    <li>• 1 line = 100 points × level</li>
                    <li>• 2 lines = 300 points × level</li>
                    <li>• 3 lines = 500 points × level</li>
                    <li>• 4 lines (Tetris) = 800 points × level</li>
                </ul>
                <p><strong>Combos:</strong> Clear lines on consecutive pieces for bonus points! Each combo adds +50 × combo number × level.</p>
                <p><strong>Drops:</strong> Soft drop = 1pt/row, Hard drop = 2pt/row</p>
            </div>

            <div class="guide-section">
                <h3>■ TIPS</h3>
                <ul>
                    <li>• FLOAT pieces darken with use</li>
                    <li>• Build flat for easier recovery</li>
                    <li>• Combos multiply your score!</li>
                    <li>• New pieces every 2k points</li>
                </ul>
            </div>
        `;
    }

    showMobileModal() {
        this.mobileModal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    hideMobileModal() {
        this.mobileModal.classList.remove('visible');
        document.body.style.overflow = '';
    }

    destroy() {
        this.container?.remove();
        this.mobileModal?.remove();
        document.querySelector('.guide-mobile-button')?.remove();
    }
}
