/**
 * EverythingCard Templates - Clean HTML Templates
 */
export const CardTemplates = {
    identityCreation: () => `
        <div class="identity-creation">
            <div class="hero-section">
                <h2>🎮 Welcome to BlockZone!</h2>
                <p>Create your player identity for tournaments and rewards</p>
            </div>
            <div class="identity-form">
                <input type="text" id="displayNameInput" placeholder="Enter your name (3+ chars)" maxlength="20" />
                <button id="createIdentityBtn" class="game-over-btn primary" disabled>
                    ✨ Create Identity
                </button>
                <div id="loadingState" style="display: none;">
                    <p>Creating your identity...</p>
                </div>
            </div>
        </div>
    `,
    
    gameResults: () => `
        <div class="game-over-card">
            <div class="hero-section">
                <h2>🏆 Game Results</h2>
            </div>
            <div class="game-over-stats" id="statsContainer">
                <!-- Stats will be populated by JavaScript -->
            </div>
            <div class="game-over-buttons">
                <button class="game-over-btn primary" data-action="play">
                    🎮 Play Again
                </button>
                <button class="game-over-btn secondary" data-action="leaderboard">
                    🏆 Leaderboard
                </button>
            </div>
        </div>
    `,
    
    paymentModal: () => `
        <div class="pricing-modal">
            <div class="pricing-header">
                <h2>🎮 Continue Playing</h2>
                <p>Choose your game access level</p>
            </div>
            <div class="pricing-options">
                <div class="pricing-tier" data-tier="single">
                    <div class="tier-title">Single Game</div>
                    <div class="tier-price">$0.25</div>
                    <div class="tier-desc">One game entry</div>
                </div>
                <div class="pricing-tier featured" data-tier="daily">
                    <div class="tier-title">All Day Pass</div>
                    <div class="tier-price">$3.00</div>
                    <div class="tier-desc">Unlimited today</div>
                </div>
                <div class="pricing-tier" data-tier="monthly">
                    <div class="tier-title">Monthly Pass</div>
                    <div class="tier-price">$10.00</div>
                    <div class="tier-desc">30 days unlimited</div>
                </div>
            </div>
            <button class="pricing-cancel">Maybe Later</button>
        </div>
    `
};
