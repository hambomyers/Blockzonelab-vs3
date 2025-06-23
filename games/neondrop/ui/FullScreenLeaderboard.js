/* ==========================================================================
   BLOCKZONE LAB - FULL SCREEN LEADERBOARD
   Classic Arcade Takeover with Hyperbolic Font Scaling
   ========================================================================== */

import { API_CONFIG } from '../../../shared/api/api-config.js';

export class FullScreenLeaderboard {
  constructor() {
    this.isVisible = false;
    this.currentPlayer = null;
    this.leaderboardData = [];
    this.container = null;
    this.virtualContainer = null;
    this.currentScroll = 0;
    this.itemHeight = 60; // Base height for normal entries
    this.visibleRange = { start: 0, end: 0 };
    this.totalHeight = 0;
    
    // Font scaling parameters (using same hyperbolic approach as prizes)
    this.maxFontSize = 48;      // #1 position
    this.minFontSize = 16;      // #100+ positions
    this.scalingCutoff = 100;   // After position 100, use normal size
    
    this.bindEvents();
  }

  bindEvents() {
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.close();
      }
    });
  }

  async show(currentPlayerData = null) {
    if (this.isVisible) return;
    
    this.currentPlayer = currentPlayerData;
    this.isVisible = true;
    
    // Create overlay
    this.createOverlay();
    
    // Load leaderboard data
    await this.loadLeaderboard();
    
    // Render virtual scroll
    this.setupVirtualScroll();
    
    // Show with animation
    this.container.style.opacity = '0';
    this.container.style.transform = 'scale(0.95)';
    document.body.appendChild(this.container);
    
    // Animate in
    requestAnimationFrame(() => {
      this.container.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      this.container.style.opacity = '1';
      this.container.style.transform = 'scale(1)';
    });
    
    // Focus for keyboard navigation
    this.container.focus();
    
    // Scroll to current player if found
    this.scrollToCurrentPlayer();
  }

  createOverlay() {
    this.container = document.createElement('div');
    this.container.className = 'fullscreen-leaderboard';
    this.container.tabIndex = -1; // For keyboard focus
    
    this.container.innerHTML = `
      <div class="leaderboard-backdrop"></div>
      <div class="leaderboard-content">
        <div class="leaderboard-header">
          <h1 class="leaderboard-title">
            <span class="neon-text">HALL OF FAME</span>
          </h1>
          <button class="close-btn" title="Close (ESC)">×</button>
        </div>
        <div class="leaderboard-viewport">
          <div class="virtual-container"></div>
        </div>
        <div class="leaderboard-footer">
          <div class="scroll-indicator">
            <span>Scroll for more • ESC to close</span>
          </div>
        </div>
      </div>
    `;
    
    // Add styles
    this.addStyles();
    
    // Bind close button
    this.container.querySelector('.close-btn').onclick = () => this.close();
    
    // Get virtual container
    this.virtualContainer = this.container.querySelector('.virtual-container');
  }

  addStyles() {
    if (document.getElementById('fullscreen-leaderboard-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'fullscreen-leaderboard-styles';
    style.textContent = `
      .fullscreen-leaderboard {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
        font-family: 'Orbitron', 'Segoe UI', sans-serif;
      }
      
      .leaderboard-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, 
          rgba(0, 0, 0, 0.95) 0%,
          rgba(20, 0, 40, 0.98) 50%,
          rgba(0, 0, 0, 0.95) 100%);
        backdrop-filter: blur(10px);
      }
      
      .leaderboard-content {
        position: relative;
        width: 90vw;
        max-width: 1200px;
        height: 85vh;
        background: linear-gradient(145deg, 
          rgba(30, 0, 60, 0.9) 0%,
          rgba(60, 0, 120, 0.8) 50%,
          rgba(30, 0, 60, 0.9) 100%);
        border: 2px solid var(--neon-cyan);
        border-radius: 20px;
        box-shadow: 
          0 0 50px rgba(0, 255, 255, 0.3),
          inset 0 0 30px rgba(0, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .leaderboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 30px;
        border-bottom: 1px solid rgba(0, 255, 255, 0.3);
        background: linear-gradient(90deg, 
          transparent 0%,
          rgba(0, 255, 255, 0.1) 50%,
          transparent 100%);
      }
      
      .leaderboard-title {
        margin: 0;
        font-size: clamp(24px, 4vw, 48px);
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 3px;
      }
      
      .neon-text {
        color: var(--neon-cyan);
        text-shadow: 
          0 0 10px currentColor,
          0 0 20px currentColor,
          0 0 30px currentColor;
        animation: neonPulse 2s ease-in-out infinite alternate;
      }
      
      @keyframes neonPulse {
        from { 
          text-shadow: 
            0 0 10px currentColor,
            0 0 20px currentColor,
            0 0 30px currentColor;
        }
        to { 
          text-shadow: 
            0 0 5px currentColor,
            0 0 15px currentColor,
            0 0 25px currentColor,
            0 0 35px currentColor;
        }
      }
      
      .close-btn {
        background: none;
        border: 2px solid var(--neon-cyan);
        color: var(--neon-cyan);
        width: 50px;
        height: 50px;
        border-radius: 50%;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .close-btn:hover {
        background: var(--neon-cyan);
        color: black;
        box-shadow: 0 0 20px var(--neon-cyan);
        transform: scale(1.1);
      }
      
      .leaderboard-viewport {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 20px 30px;
        position: relative;
      }
      
      .virtual-container {
        position: relative;
      }
      
      .leaderboard-entry {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        margin: 8px 0;
        background: linear-gradient(90deg,
          rgba(0, 255, 255, 0.05) 0%,
          rgba(255, 0, 255, 0.05) 100%);
        border: 1px solid rgba(0, 255, 255, 0.2);
        border-radius: 12px;
        transition: all 0.3s ease;
        position: absolute;
        left: 0;
        right: 0;
      }
      
      .leaderboard-entry:hover {
        border-color: var(--neon-cyan);
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
        transform: translateX(5px);
      }
      
      .leaderboard-entry.current-player {
        background: linear-gradient(90deg,
          rgba(255, 215, 0, 0.2) 0%,
          rgba(255, 140, 0, 0.2) 100%);
        border-color: #FFD700;
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
      }
      
      .entry-rank {
        font-weight: 900;
        color: var(--neon-cyan);
        text-shadow: 0 0 10px currentColor;
        min-width: 80px;
        text-align: right;
        margin-right: 20px;
      }
      
      .entry-player {
        flex: 1;
        color: white;
        font-weight: 600;
      }
      
      .entry-score {
        font-weight: 900;
        color: var(--neon-magenta);
        text-shadow: 0 0 10px currentColor;
        min-width: 120px;
        text-align: right;
      }
      
      .leaderboard-footer {
        padding: 15px 30px;
        border-top: 1px solid rgba(0, 255, 255, 0.3);
        background: linear-gradient(90deg, 
          transparent 0%,
          rgba(0, 255, 255, 0.05) 50%,
          transparent 100%);
        text-align: center;
      }
      
      .scroll-indicator {
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        font-weight: 500;
      }
      
      /* Mobile optimizations */
      @media (max-width: 768px) {
        .leaderboard-content {
          width: 95vw;
          height: 90vh;
        }
        
        .leaderboard-header {
          padding: 15px 20px;
        }
        
        .leaderboard-viewport {
          padding: 15px 20px;
        }
        
        .leaderboard-entry {
          padding: 10px 15px;
          margin: 6px 0;
        }
        
        .entry-rank {
          min-width: 60px;
          margin-right: 15px;
        }
        
        .entry-score {
          min-width: 100px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  async loadLeaderboard() {
    try {
      const response = await fetch(`${API_CONFIG.WORKER_URL}/leaderboard?limit=1000`);
      const data = await response.json();
      
      if (data.success) {
        this.leaderboardData = data.leaderboard;
        this.totalHeight = this.calculateTotalHeight();
      } else {
        console.error('Failed to load leaderboard:', data.error);
        this.leaderboardData = [];
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      this.leaderboardData = [];
    }
  }

  calculateTotalHeight() {
    let total = 0;
    for (let i = 0; i < this.leaderboardData.length; i++) {
      total += this.getEntryHeight(i + 1);
    }
    return total;
  }

  getEntryHeight(position) {
    const fontSize = this.getFontSize(position);
    // Height scales with font size, with some padding
    return Math.max(this.itemHeight, fontSize * 2.5 + 20);
  }

  getFontSize(position) {
    if (position > this.scalingCutoff) {
      return this.minFontSize;
    }
    
    // Use hyperbolic scaling: fontSize = maxSize / position
    // But with a minimum floor and smooth transition
    const hyperbolicSize = this.maxFontSize / position;
    
    // Smooth interpolation between hyperbolic and minimum
    const t = Math.min(position / this.scalingCutoff, 1);
    const smoothedSize = hyperbolicSize * (1 - t) + this.minFontSize * t;
    
    return Math.max(this.minFontSize, smoothedSize);
  }

  setupVirtualScroll() {
    if (!this.leaderboardData.length) {
      this.virtualContainer.innerHTML = '<div class="no-data">No leaderboard data available</div>';
      return;
    }
    
    // Set container height
    this.virtualContainer.style.height = `${this.totalHeight}px`;
    
    // Setup scroll listener
    const viewport = this.container.querySelector('.leaderboard-viewport');
    viewport.addEventListener('scroll', () => {
      this.currentScroll = viewport.scrollTop;
      this.updateVisibleItems();
    });
    
    // Initial render
    this.updateVisibleItems();
  }

  updateVisibleItems() {
    const viewport = this.container.querySelector('.leaderboard-viewport');
    const viewportHeight = viewport.clientHeight;
    const buffer = viewportHeight; // Render extra items for smooth scrolling
    
    // Calculate visible range
    const startY = this.currentScroll - buffer;
    const endY = this.currentScroll + viewportHeight + buffer;
    
    let currentY = 0;
    let startIndex = -1;
    let endIndex = -1;
    
    // Find visible range
    for (let i = 0; i < this.leaderboardData.length; i++) {
      const entryHeight = this.getEntryHeight(i + 1);
      
      if (startIndex === -1 && currentY + entryHeight >= startY) {
        startIndex = i;
      }
      
      if (currentY <= endY) {
        endIndex = i;
      }
      
      currentY += entryHeight + 8; // 8px margin
      
      if (currentY > endY && endIndex !== -1) break;
    }
    
    startIndex = Math.max(0, startIndex);
    endIndex = Math.min(this.leaderboardData.length - 1, endIndex);
    
    // Clear existing items
    this.virtualContainer.innerHTML = '';
    
    // Render visible items
    currentY = 0;
    for (let i = 0; i < this.leaderboardData.length; i++) {
      const entryHeight = this.getEntryHeight(i + 1);
      
      if (i >= startIndex && i <= endIndex) {
        const entry = this.createLeaderboardEntry(this.leaderboardData[i], i + 1, currentY);
        this.virtualContainer.appendChild(entry);
      }
      
      currentY += entryHeight + 8;
    }
  }

  createLeaderboardEntry(playerData, position, offsetY) {
    const entry = document.createElement('div');
    entry.className = 'leaderboard-entry';
    
    // Check if this is the current player
    const isCurrentPlayer = this.currentPlayer && 
      (playerData.player_id === this.currentPlayer.player_id ||
       playerData.display_name === this.currentPlayer.display_name);
    
    if (isCurrentPlayer) {
      entry.classList.add('current-player');
    }
    
    const fontSize = this.getFontSize(position);
    const entryHeight = this.getEntryHeight(position);
    
    entry.style.top = `${offsetY}px`;
    entry.style.height = `${entryHeight}px`;
    entry.style.fontSize = `${fontSize}px`;
    
    // Position-based styling
    if (position === 1) {
      entry.style.background = 'linear-gradient(90deg, rgba(255, 215, 0, 0.3), rgba(255, 140, 0, 0.3))';
      entry.style.borderColor = '#FFD700';
    } else if (position === 2) {
      entry.style.background = 'linear-gradient(90deg, rgba(192, 192, 192, 0.3), rgba(169, 169, 169, 0.3))';
      entry.style.borderColor = '#C0C0C0';
    } else if (position === 3) {
      entry.style.background = 'linear-gradient(90deg, rgba(205, 127, 50, 0.3), rgba(184, 115, 51, 0.3))';
      entry.style.borderColor = '#CD7F32';
    }
    
    entry.innerHTML = `
      <div class="entry-rank">#${position}</div>
      <div class="entry-player">${this.escapeHtml(playerData.display_name || 'Anonymous')}</div>
      <div class="entry-score">${playerData.high_score.toLocaleString()}</div>
    `;
    
    return entry;
  }

  scrollToCurrentPlayer() {
    if (!this.currentPlayer || !this.leaderboardData.length) return;
    
    // Find current player's position
    const playerIndex = this.leaderboardData.findIndex(p => 
      p.player_id === this.currentPlayer.player_id ||
      p.display_name === this.currentPlayer.display_name
    );
    
    if (playerIndex === -1) return;
    
    // Calculate scroll position
    let scrollY = 0;
    for (let i = 0; i < playerIndex; i++) {
      scrollY += this.getEntryHeight(i + 1) + 8;
    }
    
    // Center the player in viewport
    const viewport = this.container.querySelector('.leaderboard-viewport');
    const centerOffset = viewport.clientHeight / 2;
    scrollY = Math.max(0, scrollY - centerOffset);
    
    // Smooth scroll to position
    viewport.scrollTo({
      top: scrollY,
      behavior: 'smooth'
    });
  }
  close() {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    
    // Animate out
    this.container.style.transition = 'all 0.2s ease-out';
    this.container.style.opacity = '0';
    this.container.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container = null;
      this.virtualContainer = null;
      
      // Emit close event for game to handle
      this.onClose && this.onClose();
    }, 200);
  }

  // Allow external handlers to be notified when leaderboard closes
  setCloseHandler(handler) {
    this.onClose = handler;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in other modules
export default FullScreenLeaderboard;
