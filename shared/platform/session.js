// BlockZone Lab - Unified Session Management Module
// Handles session detection, creation, upgrade, and profile sync
// Works with Cloudflare Worker backend (see /api/auth/session, /api/auth/upgrade)

import apiClient from '../api/api-client.js';

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
            // Try to validate session with backend (optional)
            try {
                const data = await apiClient.validateSession(session.session_id);
                if (data.success) {
                    return session;
                } else {
                    console.warn('⚠️ Session validation failed (status error), using local session');
                }
            } catch (error) {
                if (error.message === 'API_UNAVAILABLE') {
                    console.warn('⚠️ Backend unavailable, using local session');
                } else {
                    console.warn('⚠️ Session validation failed (network error), using local session');
                }
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
                console.log('✅ Created session with backend:', data.player_id);
                return data;
            }
        } catch (error) {
            console.warn('⚠️ Backend session creation failed (network/CORS error), creating local session');
        }
        
        // Fallback: create local-only session
        const fallbackSession = {
            session_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            player_id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            is_new: true,
            local_only: true
        };
        
        localStorage.setItem(SESSION_KEY, JSON.stringify(fallbackSession));
        console.log('✅ Created local-only session:', fallbackSession.player_id);
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
                
                console.log('✅ Session upgraded with backend:', upgrade_type);
                return data.profile;
            }
            throw new Error(data.error || 'Failed to upgrade session');
        } catch (error) {
            console.warn('⚠️ Backend session upgrade failed (network/CORS error), upgrading locally');
            
            // Local fallback for session upgrade
            const localProfile = {
                player_id: this.session.player_id,
                display_name: display_name || 'Player',
                tier: upgrade_type === 'wallet' ? 'wallet' : 'social',
                wallet_address: wallet_address || null,
                email: email || null,
                created_at: Date.now(),
                local_only: true
            };
            
            this.profile = localProfile;
            localStorage.setItem(PROFILE_KEY, JSON.stringify(localProfile));
            
            console.log('✅ Session upgraded locally:', upgrade_type);
            return localProfile;
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

    // Get current BlockZone name
    getPlayerName() {
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
                console.log('✅ Referral tracked with backend:', referrerId);
            }
        } catch (error) {
            console.warn('⚠️ Could not track referral (network/CORS error), tracking locally');
            // Store referral locally for later sync
            const referrals = JSON.parse(localStorage.getItem('local_referrals') || '[]');
            referrals.push({ referrer_id: referrerId, timestamp: Date.now() });
            localStorage.setItem('local_referrals', JSON.stringify(referrals));
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
        const playerName = this.getPlayerName();
        const baseUrl = window.location.origin;
        
        return [
            `${baseUrl}/challenge/${playerName}/${score}?ref=${playerId}`,
            `${baseUrl}/challenge/${playerName}/${score}/2?ref=${playerId}`,
            `${baseUrl}/challenge/${playerName}/${score}/3?ref=${playerId}`
        ];
    }

    // NEW: Enhanced session restoration with cross-device sync
    async restoreSession() {
        try {
            console.log('🔄 Restoring session...');
            
            // Check for existing session data
            const sessionData = localStorage.getItem('blockzone_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                console.log('📦 Found existing session:', session);
                
                // Validate session hasn't expired
                if (session.expiresAt && new Date() < new Date(session.expiresAt)) {
                    this.currentSession = session;
                    console.log('✅ Session restored successfully');
                    return true;
                } else {
                    console.log('⏰ Session expired, clearing...');
                    localStorage.removeItem('blockzone_session');
                }
            }

            // Check for cross-device sync data
            const syncData = localStorage.getItem('blockzone_sync');
            if (syncData) {
                const sync = JSON.parse(syncData);
                console.log('🔄 Found cross-device sync data:', sync);
                
                // Attempt to restore from sync data
                if (await this.validateSyncData(sync)) {
                    this.currentSession = sync.session;
                    console.log('✅ Session restored from cross-device sync');
                    return true;
                }
            }

            // If no valid session found, create anonymous session
            console.log('👤 Creating anonymous session...');
            await this.createAnonymousSession();
            return false;
            
        } catch (error) {
            console.error('❌ Error restoring session:', error);
            await this.createAnonymousSession();
            return false;
        }
    }

    // NEW: Validate cross-device sync data
    async validateSyncData(sync) {
        try {
            // Verify sync data integrity
            if (!sync.session || !sync.deviceId || !sync.lastSync) {
                return false;
            }

            // Check if sync is recent (within 24 hours)
            const lastSync = new Date(sync.lastSync);
            const now = new Date();
            const hoursDiff = (now - lastSync) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                console.log('⏰ Cross-device sync data too old');
                return false;
            }

            // Verify with server if needed
            const response = await fetch(`${API_BASE}/api/session/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: sync.deviceId,
                    sessionId: sync.session.id
                })
            });

            return response.ok;
        } catch (error) {
            console.warn('⚠️ Error validating sync data:', error);
            return false;
        }
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

// Export the SessionManager class
export { SessionManager };

// TODO: Add event listeners for login/logout/profile changes
// TODO: Add support for JWT/cookie-based sessions if needed
// TODO: Add wallet signature verification for Web3
// TODO: Add refresh logic for session/profile expiry 