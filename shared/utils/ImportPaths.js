/**
 * ImportPaths.js - Centralized Import Path Management
 * Single source of truth for all module paths across the platform
 */

// Base path constants
const SHARED_BASE = '/shared';
const GAMES_BASE = '/games';

// Platform Core Paths
export const PLATFORM_PATHS = {
    // Core platform systems
    CORE: {
        GAME_REGISTRY: `${SHARED_BASE}/platform/core/GameRegistry.js`,
        PLATFORM_CONFIG: `${SHARED_BASE}/platform/core/PlatformConfig.js`,
        PLATFORM_MANAGER: `${SHARED_BASE}/platform/core/PlatformManager.js` // Future
    },
    
    // Platform systems
    SYSTEMS: {
        UNIVERSAL_IDENTITY: `${SHARED_BASE}/platform/systems/UniversalIdentity.js`,
        UNIVERSAL_PAYMENTS: `${SHARED_BASE}/platform/systems/UniversalPayments.js`,
        TOURNAMENT_MANAGER: `${SHARED_BASE}/platform/systems/TournamentManager.js`, // Future
        ANALYTICS_TRACKER: `${SHARED_BASE}/platform/systems/AnalyticsTracker.js` // Future
    },
    
    // Platform UI components
    UI: {
        PLATFORM_CARD: `${SHARED_BASE}/platform/ui/PlatformCard.js`,
        PLATFORM_HEADER: `${SHARED_BASE}/platform/ui/PlatformHeader.js`, // Future
        PLATFORM_MODALS: `${SHARED_BASE}/platform/ui/PlatformModals.js` // Future
    }
};

// Shared Utilities Paths
export const UTILS_PATHS = {
    EVENT_EMITTER: `${SHARED_BASE}/utils/EventEmitter.js`,
    LOGGER: `${SHARED_BASE}/utils/Logger.js`, // Future
    HELPERS: `${SHARED_BASE}/utils/Helpers.js`, // Future
    IMPORT_PATHS: `${SHARED_BASE}/utils/ImportPaths.js` // Self-reference for meta operations
};

// Web3 & Blockchain Paths
export const WEB3_PATHS = {
    WALLET_CONNECTOR: `${SHARED_BASE}/web3/WalletConnector.js`, // Future consolidated
    CONTRACT_MANAGER: `${SHARED_BASE}/web3/ContractManager.js`, // Future consolidated
    BLOCKCHAIN_UTILS: `${SHARED_BASE}/web3/BlockchainUtils.js` // Future consolidated
};

// API & Services Paths
export const API_PATHS = {
    API_CLIENT: `${SHARED_BASE}/api/APIClient.js`, // Future consolidated
    ROBUST_API_CLIENT: `${SHARED_BASE}/api/robust-api-client.js`, // Current legacy
    ENDPOINTS: `${SHARED_BASE}/api/endpoints/`, // Directory for endpoint configs
    RESPONSE_HANDLERS: `${SHARED_BASE}/api/ResponseHandlers.js` // Future
};

// Game-Specific Paths
export const GAME_PATHS = {
    NEONDROP: {
        MAIN: `${GAMES_BASE}/neondrop/main.js`,
        CONFIG: `${GAMES_BASE}/neondrop/config.js`,
        
        // Core game systems
        CORE: {
            GAME_ENGINE: `${GAMES_BASE}/neondrop/core/game-engine.js`,
            RENDERER: `${GAMES_BASE}/neondrop/core/renderer.js`,
            INPUT_CONTROLLER: `${GAMES_BASE}/neondrop/core/input-controller.js`,
            AUDIO_SYSTEM: `${GAMES_BASE}/neondrop/core/audio-system.js`,
            VIEWPORT_MANAGER: `${GAMES_BASE}/neondrop/core/viewport-manager.js`
        },
        
        // Game UI components
        UI: {
            EVERYTHING_CARD: `${GAMES_BASE}/neondrop/ui/EverythingCard.js`,
            EVERYTHING_CARD_TEMPLATES: `${GAMES_BASE}/neondrop/ui/EverythingCard.templates.js`,
            EVERYTHING_CARD_SYSTEMS: `${GAMES_BASE}/neondrop/ui/EverythingCard.systems.js`,
            EVERYTHING_CARD_ANIMATIONS: `${GAMES_BASE}/neondrop/ui/EverythingCard.animations.js`,
            TOURNAMENT_LEADERBOARD: `${GAMES_BASE}/neondrop/ui/TournamentLeaderboard.js`,
            UI_STATE_MANAGER: `${GAMES_BASE}/neondrop/ui/ui-state-manager.js`,
            GUIDE_PANEL: `${GAMES_BASE}/neondrop/ui/guide-panel.js`,
            STATS_PANEL: `${GAMES_BASE}/neondrop/ui/stats-panel.js`,
            TOURNAMENT_UI: `${GAMES_BASE}/neondrop/ui/tournament-ui.js`
        },
        
        // Game identity and payments
        IDENTITY: {
            UNIVERSAL_PLAYER_IDENTITY: `${GAMES_BASE}/neondrop/UniversalPlayerIdentity.js`,
            UNIVERSAL_PAYMENT_SYSTEM: `${GAMES_BASE}/neondrop/UniversalPaymentSystem.js`
        }
    }
};

// Legacy Paths (for migration tracking)
export const LEGACY_PATHS = {
    // These will be consolidated/removed
    SHARED_TOURNAMENTS: `${SHARED_BASE}/tournaments/daily-tournament.js`,
    SHARED_ECONOMICS: `${SHARED_BASE}/economics/usdc-payment.js`,
    SHARED_UI: `${SHARED_BASE}/ui/TournamentLeaderboard.js`,
    // ... other legacy paths to track during migration
};

// Utility functions for path resolution
export class PathResolver {
    /**
     * Get a platform path by category and key
     * @param {string} category - CORE, SYSTEMS, UI
     * @param {string} key - Specific component key
     * @returns {string} Full import path
     */
    static getPlatformPath(category, key) {
        return PLATFORM_PATHS[category]?.[key] || null;
    }
    
    /**
     * Get a game path by game ID, category, and key
     * @param {string} gameId - Game identifier (e.g., 'NEONDROP')
     * @param {string} category - UI, CORE, IDENTITY, etc.
     * @param {string} key - Specific component key
     * @returns {string} Full import path
     */
    static getGamePath(gameId, category, key) {
        return GAME_PATHS[gameId.toUpperCase()]?.[category]?.[key] || null;
    }
    
    /**
     * Validate that a path exists in our constants
     * @param {string} path - Path to validate
     * @returns {boolean} True if path is defined in constants
     */
    static isValidPath(path) {
        const allPaths = [
            ...Object.values(PLATFORM_PATHS.CORE),
            ...Object.values(PLATFORM_PATHS.SYSTEMS),
            ...Object.values(PLATFORM_PATHS.UI),
            ...Object.values(UTILS_PATHS),
            ...Object.values(WEB3_PATHS),
            ...Object.values(API_PATHS)
        ];
        
        return allPaths.includes(path);
    }
    
    /**
     * Get all paths for a specific category
     * @param {string} category - Category to retrieve
     * @returns {Object} All paths in category
     */
    static getCategory(category) {
        switch(category.toUpperCase()) {
            case 'PLATFORM': return PLATFORM_PATHS;
            case 'UTILS': return UTILS_PATHS;
            case 'WEB3': return WEB3_PATHS;
            case 'API': return API_PATHS;
            case 'GAMES': return GAME_PATHS;
            case 'LEGACY': return LEGACY_PATHS;
            default: return null;
        }
    }
}

// Export default constants for simple access
export default {
    PLATFORM_PATHS,
    UTILS_PATHS,
    WEB3_PATHS,
    API_PATHS,
    GAME_PATHS,
    LEGACY_PATHS,
    PathResolver
};
