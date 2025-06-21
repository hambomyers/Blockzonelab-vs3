/**
 * Everything Card - Clean, Simple Version
 * Minimal working implementation
 */

export class EverythingCard {
    constructor() {
        this.container = null;
        this.finalScore = 0;
        this.isVisible = false;
        this.animationInProgress = false;
        this.currentPlayer = null;
        
        this.createContainer();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'game-over-overlay';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
    }

    async show(score) {
        if (this.isVisible || this.animationInProgress) return;
        
        this.finalScore = score;
        this.isVisible = true;
        this.animationInProgress = true;

        // Simple implementation for now
        await this.loadCurrentPlayer();
        
        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        
        await this.createSimpleCard();
        
        this.animationInProgress = false;
    }

    async createSimpleCard() {
        const card = document.createElement('div');
        card.className = 'game-over-card';
        card.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.95);
            color: #d4af37;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            font-family: Arial, sans-serif;
            border: 2px solid #d4af37;
            z-index: 1000;
            min-width: 400px;
        `;
        
        card.innerHTML = `
            <h1>🎮 Neon Drop</h1>
            <p>Score: ${this.finalScore.toLocaleString()}</p>
            <p>Player: ${this.currentPlayer.displayName}</p>
            <button onclick="this.parentElement.parentElement.style.display='none'" style="
                background: #d4af37;
                color: black;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 20px;
            ">Continue</button>
        `;
        
        this.container.appendChild(card);
    }

    async loadCurrentPlayer() {
        this.currentPlayer = {
            id: 'player_' + Date.now(),
            displayName: 'Player',
            score: this.finalScore,
            walletAddress: null,
            tier: 'anonymous'
        };
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        this.isVisible = false;
    }
}
