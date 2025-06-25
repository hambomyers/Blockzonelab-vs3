// BlockZone Lab - Unified Session Management Module
// Handles session detection, creation, upgrade, and profile sync
// Works with Cloudflare Worker backend (see /api/auth/session, /api/auth/upgrade)

const API_BASE = 'https://blockzone-api.hambomyers.workers.dev';
const SESSION_KEY = 'bzlab_session';
const PROFILE_KEY = 'bzlab_profile';

class SessionManager {
    constructor() {
        this.session = null;
        this.profile = null;
        this.initialized = false;
    }

    // Initialize session manager
    async init() {
        if (this.initialized) return;
        
        try {
            // Check for referral in URL
            const urlParams = new URLSearchParams(window.location.search);
            const referrerId = urlParams.get('ref');
            
            // Try to get existing session
            this.session = await this.getSession();
            this.profile = this.getProfile();
            this.initialized = true;
            console.log('✅ Session manager initialized:', this.session?.player_id);
            
            // Handle referral if this is a new player
            if (referrerId && this.session?.is_new) {
                await this.handleReferral(referrerId);
                console.log('✅ Referral tracked for new player:', referrerId);
            }
        } catch (error) {
            console.error('❌ Failed to initialize session manager:', error);
            // Create anonymous session as fallback
            this.session = await this.createAnonymousSession();
            this.initialized = true;
        }
    }

    // Get or create session
    async getSession() {
        let session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        
        if (session && session.session_id && session.player_id) {
            // Validate session with backend
            try {
                const res = await fetch(`${API_BASE}/api/auth/validate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: session.session_id })
                });
                
                if (res.ok) {
                    return session;
                }
            } catch (error) {
                console.warn('⚠️ Session validation failed, creating new session');
            }
        }
        
        // No valid session, create anonymous
        return await this.createAnonymousSession();
    }

    // Create anonymous session
    async createAnonymousSession() {
        const device_info = { 
            ua: navigator.userAgent, 
            lang: navigator.language,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`
        };
        
        try {
            const res = await fetch(`${API_BASE}/api/auth/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_info })
            });
            
            const data = await res.json();
            if (data.success) {
                localStorage.setItem(SESSION_KEY, JSON.stringify(data));
                console.log('✅ Created anonymous session:', data.player_id);
                return data;
            }
        } catch (error) {
            console.error('❌ Failed to create session:', error);
        }
        
        // Fallback: create local-only session
        const fallbackSession = {
            session_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            player_id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            is_new: true,
            local_only: true
        };
        
        localStorage.setItem(SESSION_KEY, JSON.stringify(fallbackSession));
        return fallbackSession;
    }

    // Upgrade session to wallet or email/social
    async upgradeSession({ upgrade_type, wallet_address, email, display_name, signature }) {
        if (!this.session) {
            throw new Error('No active session');
        }

        try {
            const res = await fetch(`${API_BASE}/api/auth/upgrade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    session_id: this.session.session_id, 
                    upgrade_type, 
                    wallet_address, 
                    email, 
                    display_name, 
                    signature 
                })
            });
            
            const data = await res.json();
            if (data.success) {
                // Update local session/profile
                this.profile = data.profile;
                localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
                
                this.session.player_id = data.player_id;
                localStorage.setItem(SESSION_KEY, JSON.stringify(this.session));
                
                console.log('✅ Session upgraded:', upgrade_type);
                return data.profile;
            }
            throw new Error(data.error || 'Failed to upgrade session');
        } catch (error) {
            console.error('❌ Session upgrade failed:', error);
            throw error;
        }
    }

    // Get profile from localStorage
    getProfile() {
        return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    }

    // Get current player ID
    getPlayerId() {
        return this.session?.player_id || this.getProfile()?.player_id;
    }

    // Get current display name
    getDisplayName() {
        return this.profile?.display_name || this.getProfile()?.display_name || 'Anonymous';
    }

    // Check if session is authenticated
    isAuthenticated() {
        return this.profile?.tier !== 'anonymous';
    }

    // Clear session/profile (logout/reset)
    clearSession() {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(PROFILE_KEY);
        this.session = null;
        this.profile = null;
        console.log('🧹 Session cleared');
    }

    // Migrate old localStorage data to new session system
    async migrateOldData() {
        const oldKeys = [
            'neonDropPlayerName',
            'neonDropUsername',
            'playerId',
            'neonDropPlayerId'
        ];

        let migrated = false;
        for (const key of oldKeys) {
            const value = localStorage.getItem(key);
            if (value) {
                console.log(`🔄 Migrating old data: ${key} = ${value}`);
                
                // If we have a player name, upgrade the session
                if (key === 'neonDropPlayerName' || key === 'neonDropUsername') {
                    try {
                        await this.upgradeSession({
                            upgrade_type: 'social',
                            display_name: value,
                            email: null,
                            wallet_address: null,
                            signature: null
                        });
                        migrated = true;
                    } catch (error) {
                        console.warn('⚠️ Could not migrate player name:', error);
                    }
                }
                
                // Clean up old key
                localStorage.removeItem(key);
            }
        }

        if (migrated) {
            console.log('✅ Old data migration completed');
        }
        
        // NEW: Check for "Hambo" identity specifically
        await this.restoreHamboIdentity();
    }

    // NEW: Restore Hambo identity if it exists
    async restoreHamboIdentity() {
        // Check if we have any reference to "Hambo" in localStorage
        const hamboKeys = [
            'neonDropPlayerName',
            'neonDropUsername', 
            'playerName',
            'username',
            'displayName'
        ];
        
        for (const key of hamboKeys) {
            const value = localStorage.getItem(key);
            if (value && value.toLowerCase().includes('hambo')) {
                console.log(`🎯 Found Hambo identity: ${key} = ${value}`);
                
                try {
                    await this.upgradeSession({
                        upgrade_type: 'social',
                        display_name: value,
                        email: null,
                        wallet_address: null,
                        signature: null
                    });
                    console.log('✅ Hambo identity restored!');
                    return;
                } catch (error) {
                    console.warn('⚠️ Could not restore Hambo identity:', error);
                }
            }
        }
        
        // If no Hambo found, check if current session is anonymous and prompt for name
        if (this.getDisplayName() === 'Anonymous') {
            console.log('🤔 No Hambo identity found, current user is anonymous');
            this.showIdentityPrompt();
        }
    }

    // NEW: Show identity prompt for anonymous users
    showIdentityPrompt() {
        // Don't show if already shown recently
        if (localStorage.getItem('identity_prompt_shown')) {
            return;
        }
        
        // Create simple identity prompt
        const prompt = document.createElement('div');
        prompt.id = 'identity-prompt';
        prompt.innerHTML = `
            <div class="identity-prompt-content">
                <h3>Welcome to BlockZone Lab!</h3>
                <p>What should we call you?</p>
                <input type="text" id="player-name-input" placeholder="Enter your name" maxlength="20">
                <div class="identity-prompt-buttons">
                    <button id="save-name-btn">Save Name</button>
                    <button id="skip-name-btn">Skip for now</button>
                </div>
            </div>
        `;
        
        prompt.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
        `;
        
        const content = prompt.querySelector('.identity-prompt-content');
        content.style.cssText = `
            background: #1a1a1a;
            border: 2px solid #00d4ff;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            color: white;
            max-width: 400px;
            width: 90%;
        `;
        
        const input = prompt.querySelector('#player-name-input');
        input.style.cssText = `
            width: 100%;
            padding: 12px;
            margin: 15px 0;
            border: 1px solid #333;
            border-radius: 6px;
            background: #2a2a2a;
            color: white;
            font-size: 16px;
        `;
        
        const buttons = prompt.querySelector('.identity-prompt-buttons');
        buttons.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
        `;
        
        const saveBtn = prompt.querySelector('#save-name-btn');
        const skipBtn = prompt.querySelector('#skip-name-btn');
        
        [saveBtn, skipBtn].forEach(btn => {
            btn.style.cssText = `
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
        });
        
        saveBtn.style.background = '#00d4ff';
        saveBtn.style.color = '#000';
        skipBtn.style.background = '#333';
        skipBtn.style.color = '#fff';
        
        // Event listeners
        saveBtn.addEventListener('click', async () => {
            const name = input.value.trim();
            if (name) {
                try {
                    await this.upgradeSession({
                        upgrade_type: 'social',
                        display_name: name,
                        email: null,
                        wallet_address: null,
                        signature: null
                    });
                    console.log('✅ Identity set:', name);
                    document.body.removeChild(prompt);
                    localStorage.setItem('identity_prompt_shown', 'true');
                } catch (error) {
                    console.error('❌ Failed to set identity:', error);
                }
            }
        });
        
        skipBtn.addEventListener('click', () => {
            document.body.removeChild(prompt);
            localStorage.setItem('identity_prompt_shown', 'true');
        });
        
        // Auto-focus input
        input.focus();
        
        // Add to page
        document.body.appendChild(prompt);
    }

    // Handle referral tracking
    async handleReferral(referrerId) {
        if (!this.session || !referrerId) return;
        
        try {
            const response = await fetch(`${API_BASE}/api/referrals/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.session.session_id,
                    referrer_id: referrerId,
                    timestamp: Date.now()
                })
            });
            
            if (response.ok) {
                console.log('✅ Referral tracked:', referrerId);
            }
        } catch (error) {
            console.warn('⚠️ Could not track referral:', error);
        }
    }

    // Get referral status for display
    getReferralStatus() {
        const profile = this.getProfile();
        if (!profile) return { tier: 'newcomer', referrals: 0 };
        
        const referrals = profile.referrals || 0;
        
        if (referrals >= 51) return { tier: 'legend', referrals, glow: 'gold', effects: ['animation'] };
        if (referrals >= 21) return { tier: 'viral_star', referrals, glow: 'purple', effects: ['sparkles'] };
        if (referrals >= 6) return { tier: 'influencer', referrals, glow: 'blue' };
        return { tier: 'newcomer', referrals };
    }

    // Generate challenge links for viral sharing
    generateChallengeLinks(score) {
        if (!this.session) return [];
        
        const playerId = this.getPlayerId();
        const displayName = this.getDisplayName();
        const baseUrl = window.location.origin;
        
        return [
            `${baseUrl}/challenge/${displayName}/${score}?ref=${playerId}`,
            `${baseUrl}/challenge/${displayName}/${score}/2?ref=${playerId}`,
            `${baseUrl}/challenge/${displayName}/${score}/3?ref=${playerId}`
        ];
    }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Export functions for backward compatibility
export async function getSession() {
    await sessionManager.init();
    return sessionManager.session;
}

export async function upgradeSession(upgradeData) {
    await sessionManager.init();
    return await sessionManager.upgradeSession(upgradeData);
}

export function getProfile() {
    return sessionManager.getProfile();
}

export function clearSession() {
    sessionManager.clearSession();
}

// Export the session manager instance for advanced usage
export { sessionManager };

// TODO: Add event listeners for login/logout/profile changes
// TODO: Add support for JWT/cookie-based sessions if needed
// TODO: Add wallet signature verification for Web3
// TODO: Add refresh logic for session/profile expiry 