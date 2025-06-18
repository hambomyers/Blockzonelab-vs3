/**
 * game-menu-overlay.js - Legacy Support (Now using HTML-based menu card)
 * This file is kept for compatibility but no longer creates UI elements
 */

export class GameMenuOverlay {
    constructor() {
        this.isVisible = false;
        // Legacy support - do nothing as we now use HTML-based menu
        console.log('🎮 GameMenuOverlay: Using HTML-based menu card instead');
    }

    show() {
        this.isVisible = true;
        // Show the HTML-based menu card
        const menuCard = document.getElementById('game-menu-card');
        if (menuCard) {
            menuCard.classList.remove('hidden');
        }
    }

    hide() {
        this.isVisible = false;
        // Hide the HTML-based menu card
        const menuCard = document.getElementById('game-menu-card');
        if (menuCard) {
            menuCard.classList.add('hidden');
        }
    }

    destroy() {
        // Nothing to destroy as we don't create DOM elements
    }
}
