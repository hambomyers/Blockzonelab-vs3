// BlockZone Lab Academy Main Script
// Provides shared functionality for academy pages

class AcademyMain {
    constructor() {
        this.stardustCount = 0;
        this.init();
    }

    init() {
        this.loadStardustCount();
        this.updateStardustDisplay();
        this.initializeNavigation();
    }

    loadStardustCount() {
        const saved = localStorage.getItem('blockzone_stardust_total');
        this.stardustCount = saved ? parseInt(saved, 10) : 0;
    }

    updateStardustDisplay() {
        const displays = document.querySelectorAll('#totalStardust, .stardust-amount, #footerStardust');
        displays.forEach(display => {
            if (display) {
                display.textContent = this.stardustCount.toLocaleString();
            }
        });
    }

    addStardust(amount) {
        this.stardustCount += amount;
        localStorage.setItem('blockzone_stardust_total', this.stardustCount.toString());
        this.updateStardustDisplay();
    }

    initializeNavigation() {
        // Mobile menu toggle
        const menuToggle = document.querySelector('.nav-menu-toggle');
        const nav = document.querySelector('.main-nav');
        
        if (menuToggle && nav) {
            menuToggle.addEventListener('click', () => {
                nav.classList.toggle('nav-open');
            });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.academyMain = new AcademyMain();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AcademyMain;
}
