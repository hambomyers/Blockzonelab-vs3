/**
 * NavigationBar.js - Universal Side Panel Navigation
 * AAA Production Quality Side Panel Navigation System
 * Discord/Steam inspired side navigation panel
 */

export class NavigationBar {
    constructor() {
        this.container = null;
        this.isVisible = true;
        this.isExpanded = false;
        this.currentPage = this.detectCurrentPage();
        this.isGameActive = false;
        
        this.createContainer();
        this.bindEvents();
        this.updateVisibility();
        
        console.log('🧭 Side Panel Navigation initialized for page:', this.currentPage);
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('/games/neondrop')) return 'game';
        if (path.includes('/academy')) return 'academy';
        if (path.includes('/test-challenge-ui')) return 'challenge';
        if (path.includes('/games')) return 'games';
        
        return 'home';
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'sidePanelNavigation';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            height: 100vh;
            width: 60px;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            border-left: 1px solid rgba(0, 212, 255, 0.3);
            z-index: 10000;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 0;
            box-shadow: -8px 0 32px rgba(0, 212, 255, 0.1);
            transform: translateX(0);
        `;
        
        this.container.innerHTML = this.generateNavigationHTML();
        document.body.appendChild(this.container);
        
        // Animate in
        setTimeout(() => {
            this.container.style.transform = 'translateX(0)';
        }, 100);
    }

    generateNavigationHTML() {
        const navItems = [
            { id: 'home', icon: '🏠', label: 'Home', url: '/' },
            { id: 'games', icon: '🎮', label: 'Games', url: '/games/' },
            { id: 'challenge', icon: '⚡', label: 'Challenges', url: '/test-challenge-ui.html' },
            { id: 'leaderboard', icon: '🏆', label: 'Leaderboard', url: '/games/neondrop/' },
            { id: 'academy', icon: '📚', label: 'Academy', url: '/academy/' }
        ];

        return `
            <div class="side-panel-header" style="
                margin-bottom: 30px;
                text-align: center;
            ">
                <div class="logo-mini" style="
                    font-size: 20px;
                    color: #00d4ff;
                    margin-bottom: 5px;
                    text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
                ">✧</div>
                <div class="logo-text" style="
                    font-size: 8px;
                    color: #00d4ff;
                    font-weight: bold;
                    letter-spacing: 1px;
                    opacity: 0.8;
                ">BZ</div>
            </div>
            
            <div class="nav-items" style="
                display: flex;
                flex-direction: column;
                gap: 15px;
                flex: 1;
            ">
                ${navItems.map(item => {
                    const isActive = this.currentPage === item.id;
                    const activeClass = isActive ? 'nav-active' : '';
                    
                    return `
                        <button class="nav-item ${activeClass}" data-page="${item.id}" data-url="${item.url}" style="
                            background: ${isActive ? 'linear-gradient(135deg, #00d4ff, #0099cc)' : 'transparent'};
                            color: ${isActive ? '#ffffff' : '#ffffff'};
                            border: none;
                            border-radius: 12px;
                            padding: 12px;
                            font-size: 18px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            width: 40px;
                            height: 40px;
                            opacity: ${isActive ? '1' : '0.7'};
                            transform: ${isActive ? 'scale(1.1)' : 'scale(1)'};
                            box-shadow: ${isActive ? '0 4px 15px rgba(0, 212, 255, 0.3)' : 'none'};
                            position: relative;
                        " onmouseover="this.style.opacity='1'; this.style.transform='scale(1.1)'" onmouseout="this.style.opacity='${isActive ? '1' : '0.7'}'; this.style.transform='scale(${isActive ? '1.1' : '1'})'">
                            <span style="font-size: 18px;">${item.icon}</span>
                            <span class="nav-label" style="
                                position: absolute;
                                left: 50px;
                                background: rgba(0, 0, 0, 0.9);
                                color: white;
                                padding: 8px 12px;
                                border-radius: 8px;
                                font-size: 12px;
                                white-space: nowrap;
                                opacity: 0;
                                transform: translateX(-10px);
                                transition: all 0.3s ease;
                                pointer-events: none;
                                z-index: 10001;
                                border: 1px solid rgba(0, 212, 255, 0.3);
                            ">${item.label}</span>
                        </button>
                    `;
                }).join('')}
            </div>
            
            <div class="side-panel-footer" style="
                margin-top: auto;
                padding-top: 20px;
                text-align: center;
            ">
                <button class="expand-toggle" style="
                    background: transparent;
                    border: 1px solid rgba(0, 212, 255, 0.3);
                    color: #00d4ff;
                    border-radius: 8px;
                    padding: 8px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    opacity: 0.7;
                " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                    ⋯
                </button>
            </div>
        `;
    }

    bindEvents() {
        // Navigation item clicks
        this.container.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const page = navItem.dataset.page;
                const url = navItem.dataset.url;
                
                if (page === this.currentPage) {
                    // Already on this page, maybe scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                
                // Navigate to new page
                this.navigateTo(url, page);
            }
            
            // Expand toggle
            if (e.target.classList.contains('expand-toggle')) {
                this.toggleExpanded();
            }
        });

        // Show labels on hover
        this.container.addEventListener('mouseenter', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const label = navItem.querySelector('.nav-label');
                if (label) {
                    label.style.opacity = '1';
                    label.style.transform = 'translateX(0)';
                }
            }
        });

        this.container.addEventListener('mouseleave', (e) => {
            const labels = this.container.querySelectorAll('.nav-label');
            labels.forEach(label => {
                label.style.opacity = '0';
                label.style.transform = 'translateX(-10px)';
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) return; // Don't interfere with browser shortcuts
            
            // FIXED: Don't process navigation shortcuts if user is typing in an input field
            const activeElement = document.activeElement;
            const isTyping = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.contentEditable === 'true' ||
                activeElement.classList.contains('editable')
            );
            
            if (isTyping) {
                return; // Don't interfere with typing
            }
            
            switch(e.key.toLowerCase()) {
                case 'h':
                    if (this.currentPage !== 'home') this.navigateTo('/', 'home');
                    break;
                case 'g':
                    if (this.currentPage !== 'games') this.navigateTo('/games/', 'games');
                    break;
                case 'c':
                    if (this.currentPage !== 'challenge') this.navigateTo('/test-challenge-ui.html', 'challenge');
                    break;
                case 'l':
                    if (this.currentPage !== 'leaderboard') this.navigateTo('/games/neondrop/', 'leaderboard');
                    break;
                case 'a':
                    if (this.currentPage !== 'academy') this.navigateTo('/academy/', 'academy');
                    break;
                case 'escape':
                    this.toggleVisibility();
                    break;
            }
        });

        // Auto-hide during gameplay
        this.setupGameDetection();
        
        // Mobile touch handling
        this.setupMobileHandling();
    }

    toggleExpanded() {
        this.isExpanded = !this.isExpanded;
        
        if (this.isExpanded) {
            this.container.style.width = '200px';
            this.container.style.transform = 'translateX(0)';
        } else {
            this.container.style.width = '60px';
            this.container.style.transform = 'translateX(0)';
        }
    }

    setupGameDetection() {
        // Listen for game state changes
        window.addEventListener('gameStarted', () => {
            this.isGameActive = true;
            this.updateVisibility();
        });
        
        window.addEventListener('gameEnded', () => {
            this.isGameActive = false;
            this.updateVisibility();
        });
        
        // Auto-detect if we're in a game
        if (window.location.pathname.includes('/games/neondrop')) {
            this.isGameActive = true;
        }
    }

    setupMobileHandling() {
        // On mobile, make the side panel a bottom sheet
        if (window.BlockZoneMobile && window.BlockZoneMobile.isMobile()) {
            this.container.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                top: auto;
                height: 80px;
                width: 100%;
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(20px);
                border-top: 1px solid rgba(0, 212, 255, 0.3);
                z-index: 10000;
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-around;
                padding: 0 20px;
                box-shadow: 0 -8px 32px rgba(0, 212, 255, 0.1);
                transform: translateY(0);
            `;
            
            // Update the navigation items for mobile
            const navItems = this.container.querySelector('.nav-items');
            if (navItems) {
                navItems.style.cssText = `
                    display: flex;
                    flex-direction: row;
                    gap: 20px;
                    justify-content: space-around;
                    width: 100%;
                `;
            }
        }
    }

    navigateTo(url, page) {
        console.log('🧭 Navigating to:', page, url);
        
        // Update current page
        this.currentPage = page;
        
        // Navigate
        window.location.href = url;
    }

    updateVisibility() {
        if (this.isGameActive && this.isVisible) {
            this.hide();
        } else if (!this.isGameActive && !this.isVisible) {
            this.show();
        }
    }

    show() {
        this.isVisible = true;
        this.container.style.transform = 'translateX(0)';
        console.log('🧭 Side panel shown');
    }

    hide() {
        this.isVisible = false;
        this.container.style.transform = 'translateX(100%)';
        console.log('🧭 Side panel hidden');
    }

    toggleVisibility() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    updateCurrentPage(page) {
        this.currentPage = page;
        // Update active states
        const navItems = this.container.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('nav-active');
            if (item.dataset.page === page) {
                item.classList.add('nav-active');
            }
        });
    }

    showQuickActions(actions = []) {
        // Implementation for quick actions if needed
        console.log('🧭 Quick actions:', actions);
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Global navigation instance
window.globalNavigation = null;

// Auto-initialize navigation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.globalNavigation) {
        window.globalNavigation = new NavigationBar();
    }
});

// Export for module usage
export default NavigationBar; 