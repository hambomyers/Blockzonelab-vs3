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

export class FriendChallengeUI {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.currentChallenge = null;
        this.apiBase = 'https://blockzone-api.hambomyers.workers.dev';
        
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

    async show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.container.style.display = 'flex';
        
        // Show the challenge creation interface
        await this.showChallengeInterface();
        
        // Animate in
        requestAnimationFrame(() => {
            this.container.style.opacity = '1';
        });
    }

    async showChallengeInterface() {
        this.container.innerHTML = `
            <div class="challenge-card" style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 24px;
                padding: 40px;
                max-width: 600px;
                width: 90%;
                border: 2px solid rgba(255, 0, 170, 0.3);
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
                text-align: center;
                animation: slideInUp 0.5s ease-out;
                position: relative;
                overflow: hidden;
            ">
                <!-- Neon glow effect -->
                <div style="
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    background: linear-gradient(45deg, #ff00aa, #00d4ff, #ff00aa);
                    border-radius: 24px;
                    z-index: -1;
                    opacity: 0.3;
                    animation: neonPulse 2s ease-in-out infinite alternate;
                "></div>
                
                <!-- Header -->
                <div style="margin-bottom: 30px;">
                    <h1 style="
                        color: #ff00aa;
                        font-size: 36px;
                        font-weight: 900;
                        margin: 0 0 10px 0;
                        font-family: 'Orbitron', monospace;
                        text-shadow: 0 0 20px rgba(255, 0, 170, 0.5);
                    ">
                        ⚡ Challenge Friend
                    </h1>
                    <p style="
                        color: #aaa;
                        font-size: 16px;
                        margin: 0;
                        font-weight: 500;
                    ">
                        Create viral challenge links for head-to-head battles
                    </p>
                </div>
                
                <!-- Challenge Options -->
                <div style="
                    display: grid;
                    gap: 20px;
                    margin-bottom: 30px;
                ">
                    <!-- Challenge Type -->
                    <div style="
                        background: rgba(255, 0, 170, 0.1);
                        border: 1px solid rgba(255, 0, 170, 0.3);
                        border-radius: 16px;
                        padding: 20px;
                    ">
                        <div style="color: #ff00aa; font-size: 18px; font-weight: 700; margin-bottom: 10px;">
                            Challenge Type
                        </div>
                        <select id="challengeType" style="
                            width: 100%;
                            padding: 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(255, 0, 170, 0.3);
                            background: rgba(0, 0, 0, 0.3);
                            color: #fff;
                            font-size: 16px;
                        ">
                            <option value="neondrop">Neon Drop - Block Puzzle</option>
                            <option value="speedrun">Speed Run - Fastest Time</option>
                            <option value="endurance">Endurance - Longest Survival</option>
                        </select>
                    </div>
                    
                    <!-- Entry Fee -->
                    <div style="
                        background: rgba(0, 212, 255, 0.1);
                        border: 1px solid rgba(0, 212, 255, 0.3);
                        border-radius: 16px;
                        padding: 20px;
                    ">
                        <div style="color: #00d4ff; font-size: 18px; font-weight: 700; margin-bottom: 10px;">
                            Entry Fee (Quarters)
                        </div>
                        <select id="entryFee" style="
                            width: 100%;
                            padding: 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(0, 212, 255, 0.3);
                            background: rgba(0, 0, 0, 0.3);
                            color: #fff;
                            font-size: 16px;
                        ">
                            <option value="0.25">25¢ (1 Quarter)</option>
                            <option value="0.50">50¢ (2 Quarters)</option>
                            <option value="1.00">$1.00 (4 Quarters)</option>
                            <option value="2.50">$2.50 (10 Quarters)</option>
                            <option value="5.00">$5.00 (20 Quarters)</option>
                        </select>
                    </div>
                    
                    <!-- Challenge Duration -->
                    <div style="
                        background: rgba(255, 215, 0, 0.1);
                        border: 1px solid rgba(255, 215, 0, 0.3);
                        border-radius: 16px;
                        padding: 20px;
                    ">
                        <div style="color: #ffd700; font-size: 18px; font-weight: 700; margin-bottom: 10px;">
                            Challenge Duration
                        </div>
                        <select id="challengeDuration" style="
                            width: 100%;
                            padding: 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(255, 215, 0, 0.3);
                            background: rgba(0, 0, 0, 0.3);
                            color: #fff;
                            font-size: 16px;
                        ">
                            <option value="1">1 Hour</option>
                            <option value="6">6 Hours</option>
                            <option value="24">24 Hours</option>
                            <option value="168">1 Week</option>
                        </select>
                    </div>
                </div>
                
                <!-- Challenge Description -->
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 30px;
                ">
                    <div style="color: #fff; font-size: 16px; font-weight: 600; margin-bottom: 10px;">
                        Challenge Message (Optional)
                    </div>
                    <textarea 
                        id="challengeMessage" 
                        placeholder="Add a personal message to your challenge..."
                        style="
                            width: 100%;
                            min-height: 80px;
                            padding: 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            background: rgba(0, 0, 0, 0.3);
                            color: #fff;
                            font-size: 14px;
                            font-family: 'Inter', sans-serif;
                            resize: vertical;
                        "
                    ></textarea>
                </div>
                
                <!-- Action Buttons -->
                <div style="
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                ">
                    <button 
                        id="createChallengeBtn"
                        style="
                            background: linear-gradient(135deg, #ff00aa, #cc0088);
                            color: white;
                            border: none;
                            padding: 18px 36px;
                            border-radius: 12px;
                            font-size: 18px;
                            font-weight: 700;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            min-width: 180px;
                            box-shadow: 0 8px 25px rgba(255, 0, 170, 0.3);
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(255, 0, 170, 0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(255, 0, 170, 0.3)'"
                    >
                        ⚡ Create Challenge
                    </button>
                    
                    <button 
                        id="viewMyChallengesBtn"
                        style="
                            background: linear-gradient(135deg, #00d4ff, #0099cc);
                            color: white;
                            border: none;
                            padding: 18px 36px;
                            border-radius: 12px;
                            font-size: 18px;
                            font-weight: 700;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            min-width: 180px;
                            box-shadow: 0 8px 25px rgba(0, 212, 255, 0.3);
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(0, 212, 255, 0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(0, 212, 255, 0.3)'"
                    >
                        📋 My Challenges
                    </button>
                </div>
                
                <!-- Close Button -->
                <button 
                    id="closeChallengeBtn"
                    style="
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        background: none;
                        border: none;
                        color: #aaa;
                        font-size: 24px;
                        cursor: pointer;
                        transition: color 0.3s ease;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                    "
                    onmouseover="this.style.color='#ff00aa'"
                    onmouseout="this.style.color='#aaa'"
                >
                    ✕
                </button>
            </div>
        `;
        
        this.bindEvents();
    }

    bindEvents() {
        // Create Challenge
        const createBtn = document.getElementById('createChallengeBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.createChallenge();
            });
        }
        
        // View My Challenges
        const viewBtn = document.getElementById('viewMyChallengesBtn');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => {
                this.showMyChallenges();
            });
        }
        
        // Close
        const closeBtn = document.getElementById('closeChallengeBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }
        
        // Close on background click
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.hide();
            }
        });
    }

    async createChallenge() {
        console.log('⚡ Creating challenge...');
        
        // Get challenge data
        const challengeType = document.getElementById('challengeType').value;
        const entryFee = parseFloat(document.getElementById('entryFee').value);
        const duration = parseInt(document.getElementById('challengeDuration').value);
        const message = document.getElementById('challengeMessage').value;
        
        // Check if player has wallet connected
        if (!window.BlockZoneWeb3?.isConnected) {
            this.showWalletPrompt();
            return;
        }
        
        // Check if player has sufficient balance
        const balance = await window.BlockZoneWeb3.getBalance();
        if (parseFloat(balance) < entryFee) {
            this.showInsufficientBalance(entryFee);
            return;
        }
        
        try {
            // Create challenge
            const challenge = await this.createChallengeOnBackend({
                type: challengeType,
                entryFee: entryFee,
                duration: duration,
                message: message
            });
            
            // Show challenge created success
            this.showChallengeCreated(challenge);
            
        } catch (error) {
            console.error('❌ Challenge creation failed:', error);
            this.showError('Failed to create challenge. Please try again.');
        }
    }

    async createChallengeOnBackend(challengeData) {
        // TODO: Implement real backend challenge creation
        console.log('📡 Creating challenge on backend:', challengeData);
        
        // For now, simulate challenge creation
        const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const playerId = localStorage.getItem('playerId') || 'anonymous';
        const playerName = localStorage.getItem('neonDropPlayerName') || 'Anonymous';
        
        const challenge = {
            id: challengeId,
            creator: {
                id: playerId,
                name: playerName
            },
            type: challengeData.type,
            entryFee: challengeData.entryFee,
            duration: challengeData.duration,
            message: challengeData.message,
            status: 'active',
            createdAt: Date.now(),
            expiresAt: Date.now() + (challengeData.duration * 60 * 60 * 1000),
            participants: [],
            url: `${window.location.origin}/challenge/${challengeId}`
        };
        
        // Store challenge locally for now
        const myChallenges = JSON.parse(localStorage.getItem('myChallenges') || '[]');
        myChallenges.push(challenge);
        localStorage.setItem('myChallenges', JSON.stringify(myChallenges));
        
        return challenge;
    }

    showChallengeCreated(challenge) {
        // Create success modal
        const successModal = document.createElement('div');
        successModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
        `;
        
        const successContent = `
            <div style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                border: 2px solid rgba(0, 212, 255, 0.3);
                text-align: center;
            ">
                <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                <h2 style="color: #00d4ff; margin-bottom: 20px;">Challenge Created!</h2>
                <p style="color: #aaa; margin-bottom: 30px;">
                    Your challenge is ready to share with friends.
                </p>
                
                <!-- Challenge Link -->
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 15px;
                    margin-bottom: 20px;
                    word-break: break-all;
                ">
                    <div style="color: #fff; font-size: 12px; margin-bottom: 5px;">Challenge Link:</div>
                    <div style="color: #00d4ff; font-size: 14px; font-family: monospace;">
                        ${challenge.url}
                    </div>
                </div>
                
                <!-- Share Buttons -->
                <div style="
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin-bottom: 20px;
                ">
                    <button 
                        id="copyLinkBtn"
                        style="
                            background: linear-gradient(135deg, #00d4ff, #0099cc);
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                        "
                    >
                        📋 Copy Link
                    </button>
                    
                    <button 
                        id="shareBtn"
                        style="
                            background: linear-gradient(135deg, #ff00aa, #cc0088);
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                        "
                    >
                        📤 Share
                    </button>
                </div>
                
                <button 
                    id="closeSuccessBtn"
                    style="
                        background: rgba(255, 255, 255, 0.1);
                        color: #aaa;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 14px;
                        cursor: pointer;
                    "
                >
                    Close
                </button>
            </div>
        `;
        
        successModal.innerHTML = successContent;
        document.body.appendChild(successModal);
        
        // Bind events
        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            navigator.clipboard.writeText(challenge.url);
            this.showToast('Link copied to clipboard!');
        });
        
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareChallenge(challenge);
        });
        
        document.getElementById('closeSuccessBtn').addEventListener('click', () => {
            successModal.remove();
            this.hide();
        });
        
        // Close on background click
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.remove();
                this.hide();
            }
        });
    }

    async shareChallenge(challenge) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${challenge.creator.name} challenged you!`,
                    text: challenge.message || `Beat my score in ${challenge.type}!`,
                    url: challenge.url
                });
            } catch (error) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(challenge.url);
            this.showToast('Challenge link copied to clipboard!');
        }
    }

    async showMyChallenges() {
        console.log('📋 Showing my challenges...');
        
        // Get challenges from localStorage
        const myChallenges = JSON.parse(localStorage.getItem('myChallenges') || '[]');
        
        // Create challenges modal
        const challengesModal = document.createElement('div');
        challengesModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
        `;
        
        const challengesContent = `
            <div style="
                background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                border-radius: 20px;
                padding: 30px;
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                border: 2px solid rgba(255, 0, 170, 0.3);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2 style="color: #ff00aa; margin: 0;">📋 My Challenges</h2>
                    <button 
                        id="closeChallengesBtn"
                        style="
                            background: none;
                            border: none;
                            color: #aaa;
                            font-size: 24px;
                            cursor: pointer;
                            width: 40px;
                            height: 40px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 50%;
                        "
                    >
                        ✕
                    </button>
                </div>
                
                <div id="challengesContent">
                    ${this.renderChallengesContent(myChallenges)}
                </div>
            </div>
        `;
        
        challengesModal.innerHTML = challengesContent;
        document.body.appendChild(challengesModal);
        
        // Bind close event
        document.getElementById('closeChallengesBtn').addEventListener('click', () => {
            challengesModal.remove();
        });
        
        // Close on background click
        challengesModal.addEventListener('click', (e) => {
            if (e.target === challengesModal) {
                challengesModal.remove();
            }
        });
    }

    renderChallengesContent(challenges) {
        if (challenges.length === 0) {
            return `
                <div style="text-align: center; padding: 40px; color: #aaa;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
                    <h3 style="color: #ff00aa; margin-bottom: 10px;">No Challenges Yet</h3>
                    <p>Create your first challenge to get started!</p>
                </div>
            `;
        }
        
        return `
            <div style="
                display: grid;
                gap: 15px;
            ">
                ${challenges.map(challenge => `
                    <div style="
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 12px;
                        padding: 20px;
                        border: 1px solid rgba(255, 0, 170, 0.2);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                            <div>
                                <div style="color: #fff; font-weight: 600; font-size: 16px; margin-bottom: 5px;">
                                    ${challenge.type.toUpperCase()} Challenge
                                </div>
                                <div style="color: #aaa; font-size: 14px;">
                                    Entry: $${challenge.entryFee} • Duration: ${challenge.duration}h
                                </div>
                            </div>
                            <div style="
                                color: ${challenge.status === 'active' ? '#00d4ff' : '#ff6b6b'};
                                font-size: 12px;
                                font-weight: 600;
                                text-transform: uppercase;
                            ">
                                ${challenge.status}
                            </div>
                        </div>
                        
                        ${challenge.message ? `
                            <div style="
                                background: rgba(255, 0, 170, 0.1);
                                border-radius: 8px;
                                padding: 10px;
                                margin-bottom: 15px;
                                color: #ff00aa;
                                font-style: italic;
                            ">
                                "${challenge.message}"
                            </div>
                        ` : ''}
                        
                        <div style="
                            display: flex;
                            gap: 10px;
                            justify-content: flex-end;
                        ">
                            <button 
                                onclick="navigator.clipboard.writeText('${challenge.url}'); window.friendChallengeUI.showToast('Link copied!');"
                                style="
                                    background: rgba(0, 212, 255, 0.2);
                                    color: #00d4ff;
                                    border: 1px solid rgba(0, 212, 255, 0.3);
                                    padding: 8px 16px;
                                    border-radius: 6px;
                                    font-size: 12px;
                                    cursor: pointer;
                                "
                            >
                                Copy Link
                            </button>
                            
                            <button 
                                onclick="window.open('${challenge.url}', '_blank');"
                                style="
                                    background: rgba(255, 0, 170, 0.2);
                                    color: #ff00aa;
                                    border: 1px solid rgba(255, 0, 170, 0.3);
                                    padding: 8px 16px;
                                    border-radius: 6px;
                                    font-size: 12px;
                                    cursor: pointer;
                                "
                            >
                                View Challenge
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    showWalletPrompt() {
        const prompt = document.createElement('div');
        prompt.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
            border-radius: 20px;
            padding: 30px;
            border: 2px solid rgba(255, 0, 170, 0.3);
            text-align: center;
            z-index: 10001;
            max-width: 400px;
            width: 90%;
        `;
        
        prompt.innerHTML = `
            <h3 style="color: #ff00aa; margin-bottom: 20px;">Connect Wallet Required</h3>
            <p style="color: #aaa; margin-bottom: 25px;">
                You need to connect your wallet to create challenges.
            </p>
            <button 
                id="connectWalletBtn"
                style="
                    background: linear-gradient(135deg, #ff00aa, #cc0088);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-right: 10px;
                "
            >
                Connect Wallet
            </button>
            <button 
                id="cancelWalletBtn"
                style="
                    background: rgba(255, 255, 255, 0.1);
                    color: #aaa;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 15px 30px;
                    border-radius: 10px;
                    font-size: 16px;
                    cursor: pointer;
                "
            >
                Cancel
            </button>
        `;
        
        document.body.appendChild(prompt);
        
        // Bind events
        document.getElementById('connectWalletBtn').addEventListener('click', async () => {
            try {
                await window.BlockZoneWeb3.connect();
                prompt.remove();
                this.createChallenge(); // Retry
            } catch (error) {
                console.error('Wallet connection failed:', error);
            }
        });
        
        document.getElementById('cancelWalletBtn').addEventListener('click', () => {
            prompt.remove();
        });
    }

    showInsufficientBalance(required) {
        const prompt = document.createElement('div');
        prompt.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
            border-radius: 20px;
            padding: 30px;
            border: 2px solid rgba(255, 0, 170, 0.3);
            text-align: center;
            z-index: 10001;
            max-width: 400px;
            width: 90%;
        `;
        
        prompt.innerHTML = `
            <h3 style="color: #ff00aa; margin-bottom: 20px;">Insufficient Balance</h3>
            <p style="color: #aaa; margin-bottom: 25px;">
                You need $${required} USDC.E to create this challenge.
            </p>
            <button 
                id="addFundsBtn"
                style="
                    background: linear-gradient(135deg, #ff00aa, #cc0088);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-right: 10px;
                "
            >
                Add Funds
            </button>
            <button 
                id="cancelBalanceBtn"
                style="
                    background: rgba(255, 255, 255, 0.1);
                    color: #aaa;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 15px 30px;
                    border-radius: 10px;
                    font-size: 16px;
                    cursor: pointer;
                "
            >
                Cancel
            </button>
        `;
        
        document.body.appendChild(prompt);
        
        // Bind events
        document.getElementById('addFundsBtn').addEventListener('click', () => {
            // TODO: Implement add funds flow
            prompt.remove();
        });
        
        document.getElementById('cancelBalanceBtn').addEventListener('click', () => {
            prompt.remove();
        });
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 10002;
            animation: slideInRight 0.3s ease-out;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00d4ff, #0099cc);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 10002;
            animation: slideInRight 0.3s ease-out;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.container.style.opacity = '0';
        
        setTimeout(() => {
            this.container.style.display = 'none';
        }, 400);
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Make it globally accessible
window.friendChallengeUI = null; 