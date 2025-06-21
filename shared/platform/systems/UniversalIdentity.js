/**
 * UniversalIdentity.js - Cross-Game Player Identity System
 * Updated with standardized imports
 */

// Standardized imports using path constants
import { UTILS_PATHS, PLATFORM_PATHS } from '../../utils/ImportPaths.js';
import EventEmitter from '../../utils/EventEmitter.js';
import platformConfig from '../core/PlatformConfig.js';

class UniversalIdentity extends EventEmitter {
    constructor() {
        super();
        this.player = null;
        this.stats = new Map();
        this.achievements = new Map();
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            await this.loadPlayerData();
            this.isInitialized = true;
            this.emit('identity:ready', this.player);
            console.log('✅ UniversalIdentity initialized');
        } catch (error) {
            console.error('❌ UniversalIdentity init failed:', error);
        }
    }

    async loadPlayerData() {
        // Try to load from localStorage first
        const savedPlayer = localStorage.getItem('blockzone:player');
        if (savedPlayer) {
            this.player = JSON.parse(savedPlayer);
            this.loadStats();
            this.loadAchievements();
            return;
        }

        // Create new anonymous player
        this.player = {
            id: this.generatePlayerId(),
            name: null,
            avatar: null,
            walletAddress: null,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            level: 1,
            experience: 0,
            totalGamesPlayed: 0,
            favoriteGame: null
        };

        await this.savePlayerData();
    }

    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async connectWallet(walletAddress) {
        if (!walletAddress) return false;

        this.player.walletAddress = walletAddress;
        this.player.lastActive = new Date().toISOString();
        
        // Check if player exists on-chain
        await this.syncWithBlockchain();
        await this.savePlayerData();
        
        this.emit('identity:wallet-connected', { address: walletAddress, player: this.player });
        console.log(`🔗 Wallet connected: ${walletAddress}`);
        return true;
    }

    async syncWithBlockchain() {
        if (!this.player.walletAddress) return;

        try {
            // This would typically fetch player data from smart contracts
            // For now, we'll simulate it
            console.log('🔄 Syncing player data with blockchain...');
            
            // Future: Load player stats, achievements, NFTs from contracts
            // const playerContract = await getPlayerContract();
            // const onChainData = await playerContract.getPlayer(this.player.walletAddress);
            
        } catch (error) {
            console.warn('⚠️ Blockchain sync failed:', error);
        }
    }

    async updateGameStats(gameId, stats) {
        if (!this.stats.has(gameId)) {
            this.stats.set(gameId, {
                gamesPlayed: 0,
                totalScore: 0,
                bestScore: 0,
                totalTimePlayed: 0,
                achievements: [],
                lastPlayed: null
            });
        }

        const gameStats = this.stats.get(gameId);
        
        // Update stats
        gameStats.gamesPlayed += 1;
        gameStats.totalScore += stats.score || 0;
        gameStats.bestScore = Math.max(gameStats.bestScore, stats.score || 0);
        gameStats.totalTimePlayed += stats.timePlayed || 0;
        gameStats.lastPlayed = new Date().toISOString();

        // Update player global stats
        this.player.totalGamesPlayed += 1;
        this.player.lastActive = new Date().toISOString();
        this.addExperience(this.calculateExperience(stats));

        await this.savePlayerData();
        this.emit('identity:stats-updated', { gameId, stats: gameStats, player: this.player });
    }

    calculateExperience(gameStats) {
        // Base XP for playing
        let xp = 10;
        
        // Bonus XP for performance
        if (gameStats.score) {
            xp += Math.floor(gameStats.score / 100);
        }
        
        // Time bonus (1 XP per minute played)
        if (gameStats.timePlayed) {
            xp += Math.floor(gameStats.timePlayed / 60000);
        }
        
        return Math.min(xp, 100); // Cap at 100 XP per game
    }

    addExperience(amount) {
        const oldLevel = this.player.level;
        this.player.experience += amount;
        
        // Level up calculation (100 XP per level)
        const newLevel = Math.floor(this.player.experience / 100) + 1;
        
        if (newLevel > oldLevel) {
            this.player.level = newLevel;
            this.emit('identity:level-up', { oldLevel, newLevel, player: this.player });
            console.log(`🎉 Level up! ${oldLevel} → ${newLevel}`);
        }
    }

    async unlockAchievement(achievementId, gameId = null) {
        const achievementKey = gameId ? `${gameId}:${achievementId}` : achievementId;
        
        if (this.achievements.has(achievementKey)) {
            return false; // Already unlocked
        }

        this.achievements.set(achievementKey, {
            id: achievementId,
            gameId,
            unlockedAt: new Date().toISOString()
        });

        await this.savePlayerData();
        this.emit('identity:achievement-unlocked', { achievementId, gameId, player: this.player });
        console.log(`🏆 Achievement unlocked: ${achievementId}`);
        return true;
    }

    getPlayerData() {
        return {
            ...this.player,
            stats: Object.fromEntries(this.stats),
            achievements: Array.from(this.achievements.values())
        };
    }

    getGameStats(gameId) {
        return this.stats.get(gameId) || null;
    }

    isWalletConnected() {
        return !!this.player?.walletAddress;
    }

    getLevel() {
        return this.player?.level || 1;
    }

    getExperience() {
        return this.player?.experience || 0;
    }

    loadStats() {
        const savedStats = localStorage.getItem('blockzone:player:stats');
        if (savedStats) {
            const statsArray = JSON.parse(savedStats);
            this.stats = new Map(statsArray);
        }
    }

    loadAchievements() {
        const savedAchievements = localStorage.getItem('blockzone:player:achievements');
        if (savedAchievements) {
            const achievementsArray = JSON.parse(savedAchievements);
            this.achievements = new Map(achievementsArray);
        }
    }

    async savePlayerData() {
        try {
            localStorage.setItem('blockzone:player', JSON.stringify(this.player));
            localStorage.setItem('blockzone:player:stats', JSON.stringify([...this.stats]));
            localStorage.setItem('blockzone:player:achievements', JSON.stringify([...this.achievements]));
        } catch (error) {
            console.error('❌ Failed to save player data:', error);
        }
    }

    // Admin/debug methods
    resetPlayerData() {
        localStorage.removeItem('blockzone:player');
        localStorage.removeItem('blockzone:player:stats');
        localStorage.removeItem('blockzone:player:achievements');
        this.player = null;
        this.stats.clear();
        this.achievements.clear();
        console.log('🔄 Player data reset');
    }
}

// Export singleton instance
const universalIdentity = new UniversalIdentity();
export default universalIdentity;
