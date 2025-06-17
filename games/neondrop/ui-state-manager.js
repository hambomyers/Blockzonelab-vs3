/**
 * ui-state-manager.js - Professional Enterprise UI State Management
 * 
 * Implements Scenario C: Modal-Based Enterprise Style
 * - Tournament choice is always a centered modal
 * - Professional modal animations (scale, fade, slide)
 * - Game canvas is treated as separate viewport
 * - Clear visual separation between menu and game states
 */

const UIStates = {
    APPLICATION_READY: 'APPLICATION_READY',     // Tournament modal center-stage
    MODAL_TRANSITION: 'MODAL_TRANSITION',       // Tournament modal shrinks to corner
    GAME_SESSION: 'GAME_SESSION',               // Full game canvas, tournament badge
    RESULTS_MODAL: 'RESULTS_MODAL',             // Game dimmed, results modal appears
    RESET_SEQUENCE: 'RESET_SEQUENCE'            // Results closes, tournament returns
};

export class UIStateManager {
    constructor() {
        this.currentState = UIStates.APPLICATION_READY;
        this.previousState = null;
        this.isTransitioning = false;
        
        // UI Element references
        this.tournamentModal = null;
        this.gameViewport = null;
        this.resultsModal = null;
        this.tournamentBadge = null;
        
        // Animation timings (professional durations)
        this.timings = {
            modalTransition: 800,
            fadeTransition: 400,
            resetSequence: 600
        };
        
        console.log('🎭 Professional UI State Manager initialized');
    }

    /**
     * Initialize UI elements and set up professional state management
     */
    initialize(tournamentUI, gameCanvas, gameOverSequence) {
        this.tournamentModal = tournamentUI;
        this.gameViewport = gameCanvas;
        this.resultsModal = gameOverSequence;
        
        // Set initial state - tournament modal center-stage
        this.setState(UIStates.APPLICATION_READY);
        
        console.log('🎭 UI State Manager ready - APPLICATION_READY state');
    }

    /**
     * Professional state transition with validation
     */
    async setState(newState, data = {}) {
        if (this.isTransitioning) {
            console.warn('🎭 State transition in progress, ignoring new transition');
            return false;
        }

        if (newState === this.currentState) {
            console.log(`🎭 Already in state ${newState}`);
            return true;
        }

        console.log(`🎭 State transition: ${this.currentState} → ${newState}`);
        
        this.isTransitioning = true;
        this.previousState = this.currentState;
        
        try {
            await this.executeStateTransition(newState, data);
            this.currentState = newState;
            console.log(`🎭 ✅ State transition complete: ${newState}`);
            return true;
        } catch (error) {
            console.error('🎭 ❌ State transition failed:', error);
            return false;
        } finally {
            this.isTransitioning = false;
        }
    }

    /**
     * Execute the visual transitions for each state
     */
    async executeStateTransition(newState, data) {
        switch (newState) {
            case UIStates.APPLICATION_READY:
                await this.showTournamentModal();
                break;
                
            case UIStates.MODAL_TRANSITION:
                await this.transitionToGameViewport();
                break;
                
            case UIStates.GAME_SESSION:
                await this.showGameSession();
                break;
                
            case UIStates.RESULTS_MODAL:
                await this.showResultsModal(data);
                break;
                
            case UIStates.RESET_SEQUENCE:
                await this.resetToTournamentModal();
                break;
                
            default:
                throw new Error(`Unknown state: ${newState}`);
        }
    }

    /**
     * APPLICATION_READY: Tournament modal center-stage
     */
    async showTournamentModal() {
        // Hide game viewport completely
        if (this.gameViewport) {
            this.gameViewport.style.display = 'none';
        }
        
        // Hide results modal
        if (this.resultsModal?.container) {
            this.resultsModal.container.style.display = 'none';
        }
        
        // Show tournament modal center-stage with professional animation
        if (this.tournamentModal) {
            this.tournamentModal.container.style.display = 'block';
            this.tournamentModal.container.style.position = 'fixed';
            this.tournamentModal.container.style.top = '50%';
            this.tournamentModal.container.style.left = '50%';
            this.tournamentModal.container.style.transform = 'translate(-50%, -50%) scale(1)';
            this.tournamentModal.container.style.zIndex = '1000';
            this.tournamentModal.container.style.transition = `all ${this.timings.modalTransition}ms ease`;
            
            // Ensure it's visible
            this.tournamentModal.isVisible = true;
        }
        
        await this.wait(this.timings.modalTransition);
    }

    /**
     * MODAL_TRANSITION: Tournament modal shrinks to corner, game viewport expands
     */
    async transitionToGameViewport() {
        if (this.tournamentModal) {
            // Professional shrink animation to corner
            this.tournamentModal.container.style.transform = 'translate(-50%, -50%) scale(0.3)';
            this.tournamentModal.container.style.opacity = '0.8';
            this.tournamentModal.container.style.top = '20px';
            this.tournamentModal.container.style.left = '20px';
            this.tournamentModal.container.style.transform = 'scale(0.3)';
        }
        
        // Show game viewport with fade-in
        if (this.gameViewport) {
            this.gameViewport.style.display = 'block';
            this.gameViewport.style.opacity = '0';
            this.gameViewport.style.transition = `opacity ${this.timings.fadeTransition}ms ease`;
            
            // Trigger fade-in
            setTimeout(() => {
                this.gameViewport.style.opacity = '1';
            }, 50);
        }
        
        await this.wait(this.timings.modalTransition);
    }

    /**
     * GAME_SESSION: Full game canvas, tournament info in corner badge
     */
    async showGameSession() {
        // Hide tournament modal completely
        if (this.tournamentModal) {
            this.tournamentModal.container.style.display = 'none';
            this.tournamentModal.isVisible = false;
        }
        
        // Ensure game viewport is fully visible
        if (this.gameViewport) {
            this.gameViewport.style.opacity = '1';
            this.gameViewport.style.filter = 'none';
        }
        
        await this.wait(this.timings.fadeTransition);
    }    /**
     * RESULTS_MODAL: Game dimmed with overlay, results modal appears
     */
    async showResultsModal(data) {
        // Dim game viewport
        if (this.gameViewport) {
            this.gameViewport.style.filter = 'brightness(0.3) blur(2px)';
            this.gameViewport.style.transition = `filter ${this.timings.fadeTransition}ms ease`;
        }
        
        // Start the results modal with game data
        if (this.resultsModal && data) {
            // Start the game over sequence with the provided data
            this.resultsModal.start({
                score: data.score,
                level: data.level,
                linesCleared: data.lines,
                gameTime: data.time,
                isNewHighScore: data.isNewHighScore || false
            });
            
            // Professional entrance animation
            if (this.resultsModal.container) {
                this.resultsModal.container.style.display = 'flex';
                this.resultsModal.container.style.opacity = '0';
                this.resultsModal.container.style.transform = 'scale(0.8)';
                this.resultsModal.container.style.transition = `all ${this.timings.fadeTransition}ms ease`;
                
                // Trigger entrance animation
                setTimeout(() => {
                    this.resultsModal.container.style.opacity = '1';
                    this.resultsModal.container.style.transform = 'scale(1)';
                }, 50);
            }
        }
        
        await this.wait(this.timings.fadeTransition);
    }

    /**
     * RESET_SEQUENCE: Results closes, tournament modal returns center-stage
     */
    async resetToTournamentModal() {
        // Hide results modal with exit animation
        if (this.resultsModal?.container) {
            this.resultsModal.container.style.opacity = '0';
            this.resultsModal.container.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                this.resultsModal.container.style.display = 'none';
            }, this.timings.fadeTransition);
        }
        
        // Clear game viewport
        if (this.gameViewport) {
            const ctx = this.gameViewport.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, this.gameViewport.width, this.gameViewport.height);
            this.gameViewport.style.filter = 'none';
        }
        
        // Return tournament modal to center-stage
        await this.wait(this.timings.fadeTransition);
        await this.showTournamentModal();
    }

    /**
     * Public API for state transitions
     */
    startGame(gameType) {
        this.setState(UIStates.MODAL_TRANSITION, { gameType });
    }

    beginGameplay() {
        this.setState(UIStates.GAME_SESSION);
    }

    showGameResults(score, stats) {
        this.setState(UIStates.RESULTS_MODAL, { score, stats });
    }

    returnToMenu() {
        this.setState(UIStates.RESET_SEQUENCE);
    }

    /**
     * Utility methods
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getCurrentState() {
        return this.currentState;
    }

    isInGameSession() {
        return this.currentState === UIStates.GAME_SESSION;
    }

    isShowingModal() {
        return [UIStates.APPLICATION_READY, UIStates.RESULTS_MODAL].includes(this.currentState);
    }
}
