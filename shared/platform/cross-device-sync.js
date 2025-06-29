/**
 * Cross-Device Sync System
 * Enables users to access their wallet and profile across devices
 * Uses email-based authentication with encrypted wallet storage
 */

export class CrossDeviceSync {
    constructor() {
        this.API_BASE = '/api';
        this.STORAGE_KEYS = {
            WALLET_ENCRYPTED: 'blockzone_wallet_encrypted',
            PROFILE_ENCRYPTED: 'blockzone_profile_encrypted',
            DEVICE_ID: 'blockzone_device_id',
            LAST_SYNC: 'blockzone_last_sync'
        };
        this.deviceId = this.getOrCreateDeviceId();
    }

    /**
     * Get or create unique device identifier
     */
    getOrCreateDeviceId() {
        let deviceId = localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
        if (!deviceId) {
            // Create device fingerprint
            const fingerprint = this.createDeviceFingerprint();
            deviceId = `device_${Date.now()}_${fingerprint}`;
            localStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, deviceId);
        }
        return deviceId;
    }

    /**
     * Create device fingerprint for identification
     */
    createDeviceFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        // Simple hash
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Encrypt sensitive data with user's email as key
     */
    async encryptData(data, email) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        
        // Use email as encryption key (simplified for demo)
        const keyBuffer = encoder.encode(email.toLowerCase());
        const key = await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            dataBuffer
        );
        
        return {
            data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
            iv: btoa(String.fromCharCode(...iv))
        };
    }

    /**
     * Decrypt data with user's email
     */
    async decryptData(encryptedData, email) {
        try {
            const encoder = new TextEncoder();
            const keyBuffer = encoder.encode(email.toLowerCase());
            const key = await crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );
            
            const data = Uint8Array.from(atob(encryptedData.data), c => c.charCodeAt(0));
            const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                data
            );
            
            return JSON.parse(new TextDecoder().decode(decrypted));
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }

    /**
     * Store wallet and profile encrypted locally
     */
    async storeUserData(wallet, profile, email) {
        const walletEncrypted = await this.encryptData(wallet, email);
        const profileEncrypted = await this.encryptData(profile, email);
        
        localStorage.setItem(this.STORAGE_KEYS.WALLET_ENCRYPTED, JSON.stringify(walletEncrypted));
        localStorage.setItem(this.STORAGE_KEYS.PROFILE_ENCRYPTED, JSON.stringify(profileEncrypted));
        localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, Date.now().toString());
        
        // Also sync to backend
        await this.syncToBackend(email, walletEncrypted, profileEncrypted);
    }

    /**
     * Retrieve and decrypt user data
     */
    async retrieveUserData(email) {
        try {
            const walletEncrypted = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.WALLET_ENCRYPTED) || 'null');
            const profileEncrypted = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PROFILE_ENCRYPTED) || 'null');
            
            if (!walletEncrypted || !profileEncrypted) {
                // Try to restore from backend
                return await this.restoreFromBackend(email);
            }
            
            const wallet = await this.decryptData(walletEncrypted, email);
            const profile = await this.decryptData(profileEncrypted, email);
            
            if (!wallet || !profile) {
                throw new Error('Failed to decrypt user data');
            }
            
            return { wallet, profile };
        } catch (error) {
            console.error('Failed to retrieve user data:', error);
            return null;
        }
    }

    /**
     * Sync encrypted data to backend for cross-device access
     */
    async syncToBackend(email, walletEncrypted, profileEncrypted) {
        try {
            const response = await fetch(`${this.API_BASE}/sync/user-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    device_id: this.deviceId,
                    wallet_encrypted: walletEncrypted,
                    profile_encrypted: profileEncrypted,
                    timestamp: Date.now()
                })
            });
            
            if (response.ok) {
                console.log('✅ User data synced to backend');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Failed to sync to backend:', error);
        }
        return false;
    }

    /**
     * Restore user data from backend
     */
    async restoreFromBackend(email) {
        try {
            const response = await fetch(`${this.API_BASE}/sync/user-data?email=${encodeURIComponent(email)}&device_id=${this.deviceId}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.wallet_encrypted && data.profile_encrypted) {
                    const wallet = await this.decryptData(data.wallet_encrypted, email);
                    const profile = await this.decryptData(data.profile_encrypted, email);
                    
                    if (wallet && profile) {
                        // Store locally for future use
                        await this.storeUserData(wallet, profile, email);
                        console.log('✅ User data restored from backend');
                        return { wallet, profile };
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to restore from backend:', error);
        }
        return null;
    }

    /**
     * Check if user has data on this device
     */
    hasLocalData() {
        return !!(localStorage.getItem(this.STORAGE_KEYS.WALLET_ENCRYPTED) && 
                 localStorage.getItem(this.STORAGE_KEYS.PROFILE_ENCRYPTED));
    }

    /**
     * Clear all local data (logout)
     */
    clearLocalData() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        console.log('🧹 Local user data cleared');
    }

    /**
     * Get last sync timestamp
     */
    getLastSync() {
        const timestamp = localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
        return timestamp ? parseInt(timestamp) : null;
    }

    /**
     * Check if sync is needed (older than 1 hour)
     */
    needsSync() {
        const lastSync = this.getLastSync();
        if (!lastSync) return true;
        
        const oneHour = 60 * 60 * 1000;
        return (Date.now() - lastSync) > oneHour;
    }
}

// Create singleton instance
export const crossDeviceSync = new CrossDeviceSync(); 