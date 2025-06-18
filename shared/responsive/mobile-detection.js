/**
 * BlockZone Lab Global Mobile Utilities
 * Centralized mobile detection and utilities for all components
 * Following Web3 gaming industry best practices
 */

window.BlockZoneMobile = {
  // Cached detection results for performance
  _cache: {},
  
  // Mobile detection (industry standard approach)
  isMobile() {
    if (this._cache.isMobile === undefined) {
      this._cache.isMobile = window.innerWidth <= 768 || 
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    return this._cache.isMobile;
  },
  
  // Tablet detection
  isTablet() {
    if (this._cache.isTablet === undefined) {
      this._cache.isTablet = window.innerWidth > 768 && 
        window.innerWidth <= 1024 && 
        'ontouchstart' in window;
    }
    return this._cache.isTablet;
  },
  
  // Touch support detection
  hasTouch() {
    if (this._cache.hasTouch === undefined) {
      this._cache.hasTouch = 'ontouchstart' in window || 
        navigator.maxTouchPoints > 0;
    }
    return this._cache.hasTouch;
  },
  
  // PWA detection
  isPWA() {
    if (this._cache.isPWA === undefined) {
      this._cache.isPWA = window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true;
    }
    return this._cache.isPWA;
  },
  
  // Screen size categories (following industry breakpoints)
  getScreenSize() {
    const width = window.innerWidth;
    if (width <= 480) return 'small-mobile';
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    if (width <= 1440) return 'desktop';
    return 'large-desktop';
  },
  
  // Performance detection for games
  isLowEndDevice() {
    if (this._cache.isLowEnd === undefined) {
      const memory = navigator.deviceMemory || 4;
      const cores = navigator.hardwareConcurrency || 4;
      const pixelRatio = window.devicePixelRatio || 1;
      
      this._cache.isLowEnd = memory <= 2 || cores <= 2 || 
        (this.isMobile() && pixelRatio < 2);
    }
    return this._cache.isLowEnd;
  },
  
  // Get optimal performance settings for games
  getPerformanceSettings() {
    const isLowEnd = this.isLowEndDevice();
    const isMobile = this.isMobile();
    
    return {
      particleCount: isLowEnd ? 50 : (isMobile ? 100 : 200),
      shadowQuality: isLowEnd ? 'none' : (isMobile ? 'low' : 'high'),
      animationQuality: isLowEnd ? 'reduced' : 'full',
      frameRate: isLowEnd ? 30 : 60,
      maxTextureSize: isMobile ? 1024 : 2048
    };
  },
  
  // Utility to clear cache (call on resize/orientation change)
  clearCache() {
    this._cache = {};
  },
  
  // Initialize event listeners
  init() {
    // Clear cache on significant viewport changes
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.clearCache();
      }, 250);
    });
    
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.clearCache(), 100);
    });
    
    console.log('[BlockZone Mobile] Initialized with capabilities:', {
      mobile: this.isMobile(),
      tablet: this.isTablet(),
      touch: this.hasTouch(),
      pwa: this.isPWA(),
      screenSize: this.getScreenSize(),
      lowEnd: this.isLowEndDevice()
    });
  }
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.BlockZoneMobile.init();
  });
} else {
  window.BlockZoneMobile.init();
}

// Legacy compatibility (so existing code doesn't break)
window.isMobile = () => window.BlockZoneMobile.isMobile();
window.isTablet = () => window.BlockZoneMobile.isTablet();
