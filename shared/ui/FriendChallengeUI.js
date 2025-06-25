/**
 * FriendChallengeUI.js - Viral Challenge System
 * Create and share challenge links for head-to-head battles
 * Apple-inspired design with neon accents
 * 
 * VERSION: 2.0.0-BLOCKZONE-PLATFORM-RELEASE
 * CREATED: 2025-01-25 (BlockZone Lab Platform Phase 1)
 * FEATURES: Viral challenge links, head-to-head battles, social sharing
 * 
 * This is the NEW BlockZone Lab platform version - completely refactored
 * for professional gaming platform with viral challenge system.
 */

import { sessionManager } from '../platform/session.js';
import { PrizeCalculator } from '../economics/prize-calculator.js';

export class FriendChallengeUI {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.currentChallenge = null;
        this.apiBase = 'https://blockzone-api.hambomyers.workers.dev';
        this.prizeCalculator = new PrizeCalculator();
        
        this.createContainer();
        console.log('⚡ FriendChallengeUI initialized - BlockZone Lab Platform v2.0.0');
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'friend-challenge-ui-overlay';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.4s ease-out;
            font-family: 'Inter', sans-serif;
        `;
        document.body.appendChild(this.container);
    }

    async show(score) {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.score = score;
        
        // Show challenge creation screen
        await this.showChallengeCreation();
        
        // Animate in
        requestAnimationFrame(() => {
            this.container.style.opacity = '1';
        });
    }

    async showChallengeCreation() {
        const challengePrize = this.prizeCalculator.calculateFriendChallengePrize(2.00);
        
        this.container.innerHTML = `
            <div class="challenge-creation-card" style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                border: 2px solid rgba(255, 215, 0, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
                animation: slideIn 0.4s ease-out;
            ">
                <!-- Challenge Header -->
                <div style="margin-bottom: 30px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                    <h2 style="color: #ffd700; font-size: 32px; margin: 0 0 10px 0; font-weight: 700;">
                        Create $2 Challenge
                    </h2>
                    <div style="color: #aaa; font-size: 18px;">
                        You scored ${this.score.toLocaleString()} points
                    </div>
                </div>

                <!-- Challenge Details -->
                <div style="
                    background: rgba(255, 215, 0, 0.1);
                    border: 1px solid rgba(255, 215, 0, 0.3);
                    border-radius: 15px;
                    padding: 25px;
                    margin-bottom: 30px;
                ">
                    <div style="color: #ffd700; font-size: 20px; font-weight: 600; margin-bottom: 15px;">
                        💰 Challenge Prize Pool
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
                        <div>
                            <div style="color: #00d4ff; font-size: 24px; font-weight: 700;">
                                $${challengePrize.totalPot.toFixed(2)}
                            </div>
                            <div style="color: #aaa; font-size: 14px;">Total Pot</div>
                        </div>
                        <div>
                            <div style="color: #00ff88; font-size: 24px; font-weight: 700;">
                                $${challengePrize.winnerPrize.toFixed(2)}
                            </div>
                            <div style="color: #aaa; font-size: 14px;">Winner Gets</div>
                        </div>
                    </div>
                    <div style="color: #aaa; font-size: 14px;">
                        You pay $2 to create, challenger pays $2 to attempt
                    </div>
                </div>

                <!-- Challenge Message -->
                <div style="margin-bottom: 30px;">
                    <label style="color: #00d4ff; font-size: 16px; font-weight: 600; display: block; margin-bottom: 10px;">
                        Challenge Message (optional):
                    </label>
                    <textarea 
                        id="challengeMessage"
                        placeholder="Beat my score for $2! 🎮"
                        style="
                            width: 100%;
                            height: 80px;
                            background: rgba(0, 0, 0, 0.3);
                            border: 1px solid rgba(0, 212, 255, 0.3);
                            border-radius: 8px;
                            padding: 12px;
                            color: #fff;
                            font-size: 14px;
                            resize: none;
                        "
                    ></textarea>
                </div>

                <!-- Actions -->
                <div class="actions" style="display: flex; gap: 15px; justify-content: center;">
                    <button 
                        id="createChallengeBtn"
                        style="
                            background: linear-gradient(135deg, #ffd700, #ffb700);
                            color: #000;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        💰 Create $2 Challenge
                    </button>
                    
                    <button 
                        id="cancelBtn"
                        style="
                            background: rgba(255, 255, 255, 0.1);
                            color: #aaa;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            padding: 15px 30px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        this.bindChallengeCreationEvents();
    }

    bindChallengeCreationEvents() {
        const createBtn = this.container.querySelector('#createChallengeBtn');
        const cancelBtn = this.container.querySelector('#cancelBtn');
        
        if (createBtn) {
            createBtn.addEventListener('click', async () => {
                await this.createChallenge();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hide();
            });
        }
    }

    async createChallenge() {
        const message = this.container.querySelector('#challengeMessage')?.value || 'Beat my score for $2! 🎮';
        
        try {
            // Create challenge on backend
            const challenge = await this.createChallengeOnBackend({
                score: this.score,
                entryFee: 2.00,
                message: message,
                type: 'friend_challenge'
            });
            
            // Show challenge created screen
            await this.showChallengeCreated(challenge);
            
        } catch (error) {
            console.error('❌ Failed to create challenge:', error);
            this.showError('Failed to create challenge. Please try again.');
        }
    }

    async createChallengeOnBackend(challengeData) {
        const playerId = sessionManager.getPlayerId();
        const playerName = sessionManager.getDisplayName();
        
        const response = await fetch('https://blockzone-api.hambomyers.workers.dev/api/challenges/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                creator_id: playerId,
                creator_name: playerName,
                score: challengeData.score,
                entry_fee: challengeData.entryFee,
                message: challengeData.message,
                type: challengeData.type,
                timestamp: Date.now()
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create challenge');
        }
        
        return await response.json();
    }

    async showChallengeCreated(challenge) {
        const challengePrize = this.prizeCalculator.calculateFriendChallengePrize(2.00);
        
        this.container.innerHTML = `
            <div class="challenge-created-card" style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                border: 2px solid rgba(0, 215, 0, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                text-align: center;
                animation: slideIn 0.4s ease-out;
            ">
                <!-- Success Header -->
                <div style="margin-bottom: 30px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                    <h2 style="color: #00ff88; font-size: 32px; margin: 0 0 10px 0; font-weight: 700;">
                        Challenge Created!
                    </h2>
                    <div style="color: #aaa; font-size: 18px;">
                        Share this link with friends
                    </div>
                </div>

                <!-- Challenge Link -->
                <div style="
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(0, 212, 255, 0.3);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 30px;
                ">
                    <div style="color: #00d4ff; font-size: 14px; font-family: monospace; word-break: break-all;">
                        ${challenge.challenge_url}
                    </div>
                    <button 
                        onclick="navigator.clipboard.writeText('${challenge.challenge_url}')"
                        style="
                            background: linear-gradient(135deg, #00d4ff, #0099cc);
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            font-size: 14px;
                            cursor: pointer;
                            margin-top: 10px;
                            transition: all 0.3s ease;
                        "
                    >
                        📋 Copy Link
                    </button>
                </div>

                <!-- Challenge Details -->
                <div style="
                    background: rgba(255, 215, 0, 0.1);
                    border: 1px solid rgba(255, 215, 0, 0.3);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 30px;
                ">
                    <div style="color: #ffd700; font-size: 16px; font-weight: 600; margin-bottom: 10px;">
                        Challenge Details
                    </div>
                    <div style="color: #aaa; font-size: 14px; margin-bottom: 5px;">
                        Score to beat: ${this.score.toLocaleString()}
                    </div>
                    <div style="color: #aaa; font-size: 14px; margin-bottom: 5px;">
                        Entry fee: $2.00
                    </div>
                    <div style="color: #00ff88; font-size: 14px; font-weight: 600;">
                        Winner gets: $${challengePrize.winnerPrize.toFixed(2)}
                    </div>
                </div>

                <!-- Actions -->
                <div class="actions" style="display: flex; gap: 15px; justify-content: center;">
                    <button 
                        id="shareBtn"
                        style="
                            background: linear-gradient(135deg, #00d4ff, #0099cc);
                            color: white;
                            border: none;
                            padding: 15px 25px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        📤 Share Challenge
                    </button>
                    
                    <button 
                        id="doneBtn"
                        style="
                            background: rgba(255, 255, 255, 0.1);
                            color: #aaa;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            padding: 15px 25px;
                            border-radius: 10px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                    >
                        Done
                    </button>
                </div>
            </div>
        `;
        
        this.bindChallengeCreatedEvents();
    }

    bindChallengeCreatedEvents() {
        const shareBtn = this.container.querySelector('#shareBtn');
        const doneBtn = this.container.querySelector('#doneBtn');
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                // Share to social media
                this.shareChallenge();
            });
        }
        
        if (doneBtn) {
            doneBtn.addEventListener('click', () => {
                this.hide();
            });
        }
    }

    shareChallenge() {
        // Implement social sharing
        if (navigator.share) {
            navigator.share({
                title: 'Beat my score for $2!',
                text: 'I scored ' + this.score.toLocaleString() + ' points. Can you beat it?',
                url: window.location.href
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(window.location.href);
            this.showToast('Challenge link copied to clipboard!');
        }
    }

    showError(message) {
        // Show error message
        console.error('Challenge Error:', message);
    }

    showToast(message) {
        // Show toast notification
        console.log('Toast:', message);
    }

    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.container.style.opacity = '0';
        
        setTimeout(() => {
            this.container.style.display = 'none';
        }, 300);
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Make it globally accessible
window.friendChallengeUI = null; 