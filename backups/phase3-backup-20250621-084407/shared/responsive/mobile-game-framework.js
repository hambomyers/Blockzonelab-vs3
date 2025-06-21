/**
 * BlockZone Lab Mobile-Responsive Game Framework
 * Following Web3 gaming industry patterns (Gods Unchained, Axie Infinity)
 */

class MobileGameFramework {
  constructor(gameInstance) {
    this.game = gameInstance;
    
    // Use centralized mobile detection
    this.isMobile = window.BlockZoneMobile?.isMobile() || this.detectMobile();
    this.isTablet = window.BlockZoneMobile?.isTablet() || this.detectTablet();
    this.isPWA = window.BlockZoneMobile?.isPWA() || this.detectPWA();
    this.touchSupport = window.BlockZoneMobile?.hasTouch() || ('ontouchstart' in window);
    
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    };
    
    this.init();
  }
  
  init() {
    this.setupViewport();
    this.setupControls();
    this.setupPerformanceMode();
    this.setupOrientationHandling();
    this.bindEvents();
    
    console.log('[Mobile Framework] Initialized for', {
      mobile: this.isMobile,
      tablet: this.isTablet,
      pwa: this.isPWA,
      touch: this.touchSupport
    });
  }
  
  detectMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  detectTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024 && this.touchSupport;
  }
  
  detectPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }
  
  setupViewport() {
    // Optimize viewport for mobile gaming
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
    
    // Handle dynamic viewport height (mobile browsers)
    this.updateViewportHeight();
    
    // Prevent zoom on input focus (iOS)
    if (this.isMobile) {
      document.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'INPUT') {
          setTimeout(() => {
            window.scrollTo(0, 0);
          }, 100);
        }
      });
    }
  }
  
  updateViewportHeight() {
    // Handle mobile browser viewport changes (address bar)
    const updateHeight = () => {
      this.viewport.height = window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${this.viewport.height * 0.01}px`);
      
      if (this.game && typeof this.game.handleResize === 'function') {
        this.game.handleResize(this.viewport.width, this.viewport.height);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateHeight, 100); // Delay for orientation change
    });
  }
  
  setupControls() {
    if (!this.touchSupport) return;
    
    // Touch control system for games
    this.touchControls = {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      deltaX: 0,
      deltaY: 0
    };
    
    // Prevent default touch behaviors that interfere with games
    document.addEventListener('touchstart', (e) => {
      if (e.target.closest('.game-container')) {
        e.preventDefault();
        this.handleTouchStart(e);
      }
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
      if (e.target.closest('.game-container')) {
        e.preventDefault();
        this.handleTouchMove(e);
      }
    }, { passive: false });
    
    document.addEventListener('touchend', (e) => {
      if (e.target.closest('.game-container')) {
        e.preventDefault();
        this.handleTouchEnd(e);
      }
    }, { passive: false });
    
    // Add virtual controls for mobile
    if (this.isMobile) {
      this.createVirtualControls();
    }
  }
  
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchControls.active = true;
    this.touchControls.startX = touch.clientX;
    this.touchControls.startY = touch.clientY;
    this.touchControls.currentX = touch.clientX;
    this.touchControls.currentY = touch.clientY;
    
    // Notify game of touch start
    if (this.game && typeof this.game.onTouchStart === 'function') {
      this.game.onTouchStart(touch.clientX, touch.clientY);
    }
  }
  
  handleTouchMove(e) {
    if (!this.touchControls.active) return;
    
    const touch = e.touches[0];
    this.touchControls.currentX = touch.clientX;
    this.touchControls.currentY = touch.clientY;
    this.touchControls.deltaX = this.touchControls.currentX - this.touchControls.startX;
    this.touchControls.deltaY = this.touchControls.currentY - this.touchControls.startY;
    
    // Notify game of touch move
    if (this.game && typeof this.game.onTouchMove === 'function') {
      this.game.onTouchMove(
        touch.clientX, 
        touch.clientY, 
        this.touchControls.deltaX, 
        this.touchControls.deltaY
      );
    }
  }
  
  handleTouchEnd(e) {
    this.touchControls.active = false;
    
    // Notify game of touch end
    if (this.game && typeof this.game.onTouchEnd === 'function') {
      this.game.onTouchEnd(
        this.touchControls.currentX, 
        this.touchControls.currentY,
        this.touchControls.deltaX,
        this.touchControls.deltaY
      );
    }
    
    // Reset deltas
    this.touchControls.deltaX = 0;
    this.touchControls.deltaY = 0;
  }
  
  createVirtualControls() {
    // Check if virtual controls already exist
    if (document.querySelector('.mobile-game-controls')) return;
    
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'mobile-game-controls';
    controlsContainer.innerHTML = `
      <button class="mobile-control-btn" data-action="pause">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8,5V19L11,19V5M13,5V19L16,19V5"/>
        </svg>
      </button>
      <button class="mobile-control-btn" data-action="action">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
        </svg>
      </button>
    `;
    
    // Add event listeners for virtual controls
    controlsContainer.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action && this.game && typeof this.game.handleVirtualControl === 'function') {
        this.game.handleVirtualControl(action);
      }
    });
    
    document.body.appendChild(controlsContainer);
  }
    setupPerformanceMode() {
    // Use centralized performance settings if available
    if (window.BlockZoneMobile?.getPerformanceSettings) {
      this.performanceSettings = window.BlockZoneMobile.getPerformanceSettings();
    } else {
      // Fallback to local detection
      const isLowEnd = this.detectLowEndDevice();
      this.performanceSettings = {
        particleCount: isLowEnd ? 50 : (this.isMobile ? 100 : 200),
        shadowQuality: isLowEnd ? 'none' : (this.isMobile ? 'low' : 'high'),
        animationQuality: isLowEnd ? 'reduced' : 'full',
        frameRate: isLowEnd ? 30 : 60
      };
    }
    
    // Apply performance settings to game
    if (this.game && typeof this.game.applyPerformanceSettings === 'function') {
      this.game.applyPerformanceSettings(this.performanceSettings);
    }
    
    console.log('[Mobile Framework] Performance mode:', this.performanceSettings);
  }
  
  detectLowEndDevice() {
    // Heuristics for low-end device detection
    const memory = navigator.deviceMemory || 4; // Default to 4GB if not available
    const cores = navigator.hardwareConcurrency || 4;
    const pixelRatio = window.devicePixelRatio || 1;
    
    return memory <= 2 || cores <= 2 || (this.isMobile && pixelRatio < 2);
  }
  
  setupOrientationHandling() {
    // Handle orientation changes for mobile games
    if (!this.isMobile) return;
    
    const handleOrientationChange = () => {
      setTimeout(() => {
        this.viewport.width = window.innerWidth;
        this.viewport.height = window.innerHeight;
        
        // Notify game of orientation change
        if (this.game && typeof this.game.handleOrientationChange === 'function') {
          const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
          this.game.handleOrientationChange(orientation, this.viewport);
        }
        
        this.updateViewportHeight();
      }, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    screen.orientation?.addEventListener('change', handleOrientationChange);
  }
  
  bindEvents() {
    // Prevent context menu on long press (mobile)
    if (this.touchSupport) {
      document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.game-container')) {
          e.preventDefault();
        }
      });
    }
    
    // Prevent accidental page refresh on pull-down (mobile)
    if (this.isMobile) {
      let startY = 0;
      document.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
      }, { passive: true });
      
      document.addEventListener('touchmove', (e) => {
        if (startY < 50 && e.touches[0].clientY > startY) {
          e.preventDefault();
        }
      }, { passive: false });
    }
    
    // Handle app state changes (PWA)
    if (this.isPWA) {
      document.addEventListener('visibilitychange', () => {
        if (this.game && typeof this.game.handleVisibilityChange === 'function') {
          this.game.handleVisibilityChange(document.hidden);
        }
      });
    }
  }
  
  // Utility methods for games
  vibrate(pattern = [100]) {
    if (navigator.vibrate && this.isMobile) {
      navigator.vibrate(pattern);
    }
  }
  
  requestFullscreen() {
    if (this.isPWA && window.BlockZonePWA) {
      window.BlockZonePWA.requestFullscreen();
    }
  }
  
  preventSleep() {
    if (this.isPWA && window.BlockZonePWA) {
      window.BlockZonePWA.preventSleep();
    }
  }
  
  getOptimalCanvasSize() {
    // Calculate optimal canvas size for performance
    const maxWidth = this.isMobile ? 1024 : 1920;
    const maxHeight = this.isMobile ? 768 : 1080;
    
    let width = Math.min(this.viewport.width * this.viewport.devicePixelRatio, maxWidth);
    let height = Math.min(this.viewport.height * this.viewport.devicePixelRatio, maxHeight);
    
    // Maintain aspect ratio
    const aspectRatio = this.viewport.width / this.viewport.height;
    if (width / height > aspectRatio) {
      width = height * aspectRatio;
    } else {
      height = width / aspectRatio;
    }
    
    return { width: Math.floor(width), height: Math.floor(height) };
  }
  
  // Expose mobile capabilities
  getMobileCapabilities() {
    return {
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      isPWA: this.isPWA,
      touchSupport: this.touchSupport,
      performanceSettings: this.performanceSettings,
      viewport: this.viewport
    };
  }
}

// Export for use by games
window.MobileGameFramework = MobileGameFramework;

// Auto-initialize for existing games
document.addEventListener('DOMContentLoaded', () => {
  // Look for existing game instances and enhance them with mobile support
  if (window.gameInstance && !window.gameInstance.mobileFramework) {
    window.gameInstance.mobileFramework = new MobileGameFramework(window.gameInstance);
  }
});
