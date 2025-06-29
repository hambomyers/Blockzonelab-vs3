/**
 * UserManager - User registration, authentication, and profile management
 * Phase 2: Platform Infrastructure - Browser Compatible Version
 */

class UserManager {
    constructor() {
        this.users = new Map(); // userId -> user data
        this.sessions = new Map(); // sessionId -> userId
        this.currentUser = null;
        console.log('👤 UserManager initialized');
    }

    /**
     * Initialize user manager (load any persistent state if needed)
     */
    async initialize() {
        // Load from localStorage if available
        const savedUsers = localStorage.getItem('blockzone_users');
        if (savedUsers) {
            try {
                const users = JSON.parse(savedUsers);
                this.users = new Map(Object.entries(users));
            } catch (e) {
                console.warn('Failed to load saved users:', e);
            }
        }
        return true;
    }

    /**
     * Save users to localStorage
     */
    _saveUsers() {
        const usersObj = Object.fromEntries(this.users);
        localStorage.setItem('blockzone_users', JSON.stringify(usersObj));
    }

    /**
     * Generate a secure wallet address
     */
    _generateWalletAddress() {
        // Generate a deterministic wallet address based on timestamp and random
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 16);
        const seed = `${timestamp}_${random}`;
        
        // Simple hash function to create a wallet-like address
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Convert to hex and format as wallet address
        const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
        return `0x${hexHash}${random}${timestamp.toString(16).slice(-8)}`;
    }

    /**
     * Register a new user (email only - wallet created automatically)
     */
    async register({ email, profile = {} }) {
        if (!email) throw new Error('Email required');
        
        const emailLower = email.toLowerCase();
        
        // Check if user already exists
        if (this.users.has(emailLower)) {
            throw new Error('User already exists');
        }

        // Automatically generate a wallet address for the user
        const walletAddress = this._generateWalletAddress();

        const user = {
            id: emailLower,
            wallet: walletAddress,
            email: emailLower,
            profile: {
                displayName: profile.displayName || '',
                avatar: profile.avatar || '',
                bio: profile.bio || '',
                createdAt: Date.now(),
                ...profile
            },
            walletBalance: 0, // USDC.E balance
            gameStats: {
                totalGames: 0,
                totalWins: 0,
                totalEarnings: 0,
                bestScore: 0
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        this.users.set(emailLower, user);
        this._saveUsers();
        
        console.log(`👤 New user registered: ${emailLower} with wallet ${walletAddress}`);
        return user;
    }

    /**
     * Login/authenticate a user (email only)
     */
    async login({ email }) {
        if (!email) throw new Error('Email required');
        
        const emailLower = email.toLowerCase();
        const user = this.users.get(emailLower);
        
        if (!user) {
            // Auto-register if user doesn't exist
            console.log(`👤 Auto-registering new user: ${emailLower}`);
            const newUser = await this.register({ email: emailLower });
            
            // Create a session for the new user
            const sessionId = Math.random().toString(36).substr(2, 16);
            this.sessions.set(sessionId, emailLower);
            this.currentUser = newUser;
            
            console.log(`👤 New user logged in: ${emailLower} (wallet: ${newUser.wallet})`);
            return { user: newUser, sessionId };
        }
        
        // Create a session (simple random string for now)
        const sessionId = Math.random().toString(36).substr(2, 16);
        this.sessions.set(sessionId, emailLower);
        this.currentUser = user;
        
        console.log(`👤 User logged in: ${emailLower} (wallet: ${user.wallet})`);
        return { user, sessionId };
    }

    /**
     * Get user profile
     */
    async getProfile(userId) {
        const user = this.users.get(userId);
        return user ? user.profile : null;
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, profileUpdates) {
        const user = this.users.get(userId);
        if (!user) throw new Error('User not found');
        
        user.profile = { ...user.profile, ...profileUpdates, updatedAt: Date.now() };
        user.updatedAt = Date.now();
        this.users.set(userId, user);
        this._saveUsers();
        return user.profile;
    }

    /**
     * Get user's wallet address
     */
    getWalletAddress(userId) {
        const user = this.users.get(userId);
        return user ? user.wallet : null;
    }

    /**
     * Get user's wallet balance
     */
    getWalletBalance(userId) {
        const user = this.users.get(userId);
        return user ? user.walletBalance : 0;
    }

    /**
     * Update wallet balance (for payments/prizes)
     */
    updateWalletBalance(userId, amount) {
        const user = this.users.get(userId);
        if (!user) throw new Error('User not found');
        
        user.walletBalance += amount;
        user.updatedAt = Date.now();
        this.users.set(userId, user);
        this._saveUsers();
        
        console.log(`💰 Wallet balance updated: ${userId} ${amount > 0 ? '+' : ''}${amount} USDC.E`);
        return user.walletBalance;
    }

    /**
     * Get user's game statistics
     */
    getGameStats(userId) {
        const user = this.users.get(userId);
        return user ? user.gameStats : null;
    }

    /**
     * Update game statistics
     */
    updateGameStats(userId, stats) {
        const user = this.users.get(userId);
        if (!user) throw new Error('User not found');
        
        user.gameStats = { ...user.gameStats, ...stats };
        user.updatedAt = Date.now();
        this.users.set(userId, user);
        this._saveUsers();
        return user.gameStats;
    }

    /**
     * Get current user (from session)
     */
    getCurrentUser(sessionId) {
        const userId = this.sessions.get(sessionId);
        return userId || null;
    }

    /**
     * Logout user
     */
    logout(sessionId) {
        this.sessions.delete(sessionId);
        this.currentUser = null;
    }

    /**
     * Get all users (for admin purposes)
     */
    getAllUsers() {
        return Array.from(this.users.values());
    }
}

// Create global instance
window.userManager = new UserManager();
window.userManager.initialize();

// Export the UserManager class for module imports
export { UserManager }; 
// Export the UserManager class for module imports
export { UserManager };
