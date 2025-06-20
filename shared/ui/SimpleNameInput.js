/**
 * Simple Name Input - Minimal onboarding for leaderboard
 * Clean, fast, gaming-focused
 */

export class SimpleNameInput {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.onComplete = null;
        
        this.createModal();
    }

    createModal() {
        this.container = document.createElement('div');
        this.container.className = 'simple-name-overlay';
        
        this.container.innerHTML = `
            <div class="simple-name-modal">
                <div class="name-header">
                    <h2>Name for Leaderboard</h2>
                    <p>What should we call you?</p>
                </div>
                
                <div class="name-input-section">
                    <input 
                        type="text" 
                        class="name-input" 
                        placeholder="Enter your name"
                        maxlength="20"
                        autocomplete="off"
                    >
                </div>
                
                <div class="name-buttons">
                    <button class="name-btn primary">Start Playing</button>
                    <button class="name-btn secondary">Skip for Now</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        this.setupEventListeners();
    }

    setupEventListeners() {
        const input = this.container.querySelector('.name-input');
        const startBtn = this.container.querySelector('.name-btn.primary');
        const skipBtn = this.container.querySelector('.name-btn.secondary');
        
        // Enter key to submit
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleSubmit();
            }
        });
        
        // Auto-enable start button when typing
        input.addEventListener('input', () => {
            const hasName = input.value.trim().length > 0;
            startBtn.textContent = hasName ? 'Start Playing' : 'Start Playing';
            startBtn.disabled = false; // Always enabled
        });
        
        // Start playing button
        startBtn.addEventListener('click', () => {
            this.handleSubmit();
        });
        
        // Skip button
        skipBtn.addEventListener('click', () => {
            this.handleSkip();
        });
        
        // Focus input on show
        setTimeout(() => {
            input.focus();
        }, 300);
    }

    show(onComplete) {
        if (this.isVisible) return;
        
        this.onComplete = onComplete;
        this.isVisible = true;
        this.container.classList.add('visible');
    }

    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.container.classList.remove('visible');
        
        setTimeout(() => {
            if (this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
        }, 300);
    }

    handleSubmit() {
        const input = this.container.querySelector('.name-input');
        const name = input.value.trim();
        
        // Use entered name or generate a simple default
        const playerName = name || this.generateSimpleName();
        
        // Save to localStorage
        localStorage.setItem('anonymous_display_name', playerName);
        localStorage.setItem('anonymous_player_id', this.generatePlayerId(playerName));
        localStorage.setItem('name_input_completed', 'true');
        
        console.log(`🎮 Player name set: ${playerName}`);
        
        this.hide();
        
        if (this.onComplete) {
            this.onComplete(playerName);
        }
    }

    handleSkip() {
        // Generate anonymous name
        const anonName = this.generateSimpleName();
        
        localStorage.setItem('anonymous_display_name', anonName);
        localStorage.setItem('anonymous_player_id', this.generatePlayerId(anonName));
        localStorage.setItem('name_input_completed', 'true');
        
        console.log(`🎮 Anonymous player: ${anonName}`);
        
        this.hide();
        
        if (this.onComplete) {
            this.onComplete(anonName);
        }
    }

    generateSimpleName() {
        const adjectives = ['Fast', 'Quick', 'Swift', 'Sharp', 'Bright', 'Cool', 'Smart', 'Bold'];
        const nouns = ['Player', 'Gamer', 'Pro', 'Ace', 'Star', 'Hero', 'Champion'];
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 100);
        
        return `${adj}${noun}${num}`;
    }

    generatePlayerId(name) {
        // Simple ID based on name + timestamp
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const timestamp = Date.now().toString().slice(-4);
        return `${cleanName}_${timestamp}`;
    }

    // Check if user has already provided name
    static hasCompletedNameInput() {
        return localStorage.getItem('name_input_completed') === 'true';
    }

    // Check if user has existing identity
    static hasExistingIdentity() {
        return !!localStorage.getItem('anonymous_display_name');
    }
}
