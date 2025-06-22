# 🗂️ COMPLETE BLOCKZONE LAB WEBSITE FILE TREE

## 📁 ROOT LEVEL FILES
```
BlockZoneLabWEBSITE/
├── 📄 index.html                          ← Main landing page
├── 📄 package.json                        ← Project configuration
├── 📄 manifest.json                       ← PWA manifest
├── 📄 README.md                           ← Project documentation
├── 📄 wrangler.toml                       ← Cloudflare Workers config
├── 📄 _headers                            ← HTTP headers config
├── 📄 _redirects                          ← URL redirects config
├── 📄 _deploy-trigger.txt                 ← Deployment trigger
├── 📄 favicon.ico                         ← Site favicon
├── 📄 .gitignore                          ← Git ignore rules
├── 📄 CLAUDE_CLEANUP_PACKAGE.md           ← 🆕 Cleanup documentation
├── 📄 UNIFIED_SYSTEMS_COMPLETE.md         ← 🆕 Completion report
├── 📄 test-unified-systems.js             ← 🆕 Test suite
└── 📄 unified-systems-demo.html           ← 🆕 Interactive demo
```

## 🎓 ACADEMY SYSTEM
```
academy/
├── 📄 index.html                          ← Academy main page
├── core/
│   └── 📄 academy-styles.css              ← Academy styling
├── lessons/
│   ├── 01-computing-binary/
│   │   ├── 📄 index.html
│   │   └── 📄 lesson-script.js
│   ├── 02-money-scarcity/
│   │   ├── 📄 index.html
│   │   ├── 📄 lesson-script.js
│   │   └── 📄 mining-demo.html
│   ├── 03-blockchain-fundamentals/
│   │   ├── 📄 index.html
│   │   └── 📄 lesson-script.js
│   ├── 04-smart-contracts/
│   │   ├── 📄 index.html
│   │   └── 📄 lesson-script.js
│   ├── 05-defi-dexes/
│   │   ├── 📄 index.html
│   │   └── 📄 lesson-script.js
│   └── 06-sonic-labs/
│       ├── 📄 index.html
│       └── 📄 lesson-script.js
└── shared/
    └── 📄 academy-main.js                 ← Academy core logic
```

## 🎨 ASSETS & STYLING
```
assets/
├── 📄 favicon.svg                         ← Vector favicon
├── css/
│   ├── 📄 01-variables.css                ← CSS variables
│   ├── 📄 02-base.css                     ← Base styles
│   ├── 📄 03-game.css                     ← Game-specific styles
│   ├── 📄 blockzone-header.css            ← Header component
│   ├── 📄 blockzone-system.css            ← System-wide styles
│   ├── 📄 components.css                  ← UI components
│   ├── 📄 core-variables.css              ← Core CSS variables
│   ├── 📄 design-system.css               ← Design system
│   ├── 📄 games-landing-fix.css           ← Landing page fixes
│   ├── 📄 main.css                        ← Main stylesheet
│   ├── 📄 mobile.css                      ← Mobile responsive
│   └── 📄 utilities.css                   ← Utility classes
└── icons/
    ├── 📄 icon-512.svg                    ← App icon
    └── 📄 README.md                       ← Icons documentation
```

## ⛓️ SMART CONTRACTS
```
contracts/
├── 📄 BlockzoneGame.sol                   ← Main game contract
├── 📄 MockUSDC.sol                        ← Test USDC contract
├── 📄 NeonDropTournamentVault.sol         ← Tournament vault
└── 📄 QUARTERSToken.sol                   ← QUARTERS token
```

## 🔧 CORE SYSTEMS
```
core-systems/
├── 📄 bitcoin-price.js                    ← Bitcoin price feed
├── 📄 sonic-config.js                     ← Sonic blockchain config
├── 📄 sonic-web3-config.html              ← Web3 configuration
└── core/
    ├── 📄 blockchain.js                    ← Blockchain utilities
    └── 📄 wallet-onboarding.js             ← Wallet setup
```

## 🎮 GAMES DIRECTORY
```
games/
├── 📄 index.html                          ← Games landing page
└── neondrop/
    ├── 📄 index.html                      ← NeonDrop game page
    ├── 📄 main.js                         ← Game entry point
    ├── 📄 config.js                       ← Game configuration
    ├── 📄 game-specific.css               ← Game styling
    ├── 📄 manifest.json                   ← Game PWA manifest
    ├── 📄 README.md                       ← Game documentation
    ├── 📄 UniversalPaymentSystem.js       ← Payment integration
    ├── 📄 _headers                        ← Game headers config
    ├── core/                              ← Game engine
    │   ├── 📄 audio-system.js             ← Audio management
    │   ├── 📄 game-engine.js              ← Main game engine
    │   ├── 📄 input-controller.js         ← Input handling
    │   ├── 📄 physics-pure.js             ← Physics system
    │   ├── 📄 renderer.js                 ← Rendering system
    │   └── 📄 viewport-manager.js         ← Viewport management
    ├── gameplay/                          ← Game mechanics
    │   ├── 📄 chiclet.js                  ← Game pieces
    │   ├── 📄 particles.js                ← Particle effects
    │   ├── 📄 scoring.js                  ← Scoring system
    │   └── 📄 starfield.js                ← Background effects
    └── ui/                                ← Game UI components
        ├── 📄 EverythingCard.js            ← 🔄 Legacy UI (to be replaced)
        ├── 📄 EverythingCard.animations.js ← 🔄 Legacy animations
        ├── 📄 EverythingCard.systems.js    ← 🔄 Legacy systems
        ├── 📄 EverythingCard.templates.js  ← 🔄 Legacy templates
        ├── 📄 game-menu-card.css           ← Menu styling
        ├── 📄 game-over-sequence.css       ← Game over styling
        ├── 📄 game-over-sequence.js        ← Game over logic
        ├── 📄 guide-panel.css              ← Guide styling
        ├── 📄 guide-panel.js               ← Guide panel
        ├── 📄 README.txt                   ← UI documentation
        ├── 📄 stats-panel.js               ← Stats display
        ├── 📄 tournament-ui.js             ← Tournament UI
        ├── 📄 ui-panels.js                 ← UI panels
        └── 📄 ui-state-manager.js          ← UI state management
```

## 📱 PWA FEATURES
```
pwa/
├── 📄 install-prompt.js                   ← App install prompt
└── 📄 service-worker.js                   ← Service worker
```

## 🔗 SHARED PLATFORM (Main Architecture)
```
shared/
├── api/
│   └── 📄 api-client.js                   ← API communication
├── components/
│   └── 📄 game-framework.js               ← Game framework
├── economics/
│   ├── 📄 apple-pay.js                    ← Apple Pay integration
│   ├── 📄 prize-calculator.js             ← Prize calculations
│   └── 📄 usdc-payment.js                 ← USDC payments
├── platform/                             ← 🆕 UNIFIED PLATFORM SYSTEMS
│   ├── 📄 free-daily-game.js              ← Free game management
│   ├── 📄 revenue-dashboard.js            ← Revenue tracking
│   ├── 📄 UnifiedSystemsIntegration.js    ← 🆕 Integration helper
│   ├── api/
│   │   └── 📄 UnifiedAPIClient.js         ← Unified API client
│   ├── compatibility/
│   │   └── 📄 LegacyBridge.js             ← Legacy compatibility
│   ├── core/
│   │   ├── 📄 GameRegistry.js             ← Game registration
│   │   ├── 📄 PlatformConfig.js           ← Platform config
│   │   └── 📄 UnifiedManager.js           ← Unified manager
│   ├── realtime/
│   │   └── 📄 LeaderboardSocket.js        ← Real-time updates
│   ├── security/
│   │   ├── 📄 AntiAbuseManager.js         ← Anti-abuse system
│   │   └── 📄 DeviceFingerprinter.js      ← Device tracking
│   ├── systems/                          ← 🆕 CORE UNIFIED SYSTEMS
│   │   ├── 📄 UnifiedIdentity.js          ← Identity management
│   │   ├── 📄 UnifiedPlayerSystem.js      ← 🆕 MAIN PLAYER SYSTEM
│   │   ├── 📄 UnifiedTournamentSystem.js  ← 🆕 MAIN TOURNAMENT SYSTEM
│   │   ├── 📄 UniversalIdentity.js        ← Universal identity
│   │   └── 📄 UniversalPayments.js        ← Universal payments
│   ├── tournaments/                       ← Tournament management
│   └── ui/
│       ├── 📄 LeaderboardComponents.js    ← Leaderboard components
│       └── 📄 PlatformCard.js             ← Platform card UI
├── responsive/
│   ├── 📄 mobile-detection.js             ← Mobile detection
│   └── 📄 mobile-game-framework.js        ← Mobile framework
├── styles/
│   └── 📄 wallet-ui.css                   ← Wallet UI styling
├── tournaments/
│   └── 📄 daily-tournament.js             ← Daily tournament logic
├── ui/                                    ← 🆕 UNIFIED UI SYSTEM
│   ├── 📄 BlockZoneHeader.js              ← Site header
│   ├── 📄 challenge-system.js             ← Challenge system
│   ├── 📄 challenge-ui.js                 ← Challenge UI
│   ├── 📄 daily-tournament-ui.js          ← Tournament UI
│   ├── 📄 SimpleNameInput.js              ← Name input component
│   ├── 📄 TournamentLeaderboard.js        ← 🔄 Legacy leaderboard
│   └── 📄 UnifiedPlayerCard.js            ← 🆕 MAIN UI COMPONENT
├── utils/
│   ├── 📄 EventEmitter.js                 ← Event system
│   └── 📄 ImportPaths.js                  ← Import utilities
├── web3/
│   ├── 📄 blockzone-web3.js               ← Web3 integration
│   ├── 📄 wallet-connector.js             ← Wallet connection
│   └── 📄 web3-integration.js             ← Web3 utilities
└── workers/
    └── 📄 universal-backend.js             ← Universal backend
```

## ⚙️ CLOUDFLARE WORKERS
```
worker/
├── 📄 leaderboard.js                      ← Leaderboard worker
├── 📄 tournament-manager.js               ← Tournament worker
└── node_modules/                          ← Worker dependencies
```

## 🔧 DEVELOPMENT FILES
```
.vscode/
├── 📄 settings.json                       ← VS Code settings
└── 📄 tasks.json                          ← VS Code tasks

.wrangler/                                 ← Cloudflare Wrangler cache
node_modules/                              ← Project dependencies
```

---

## 🎯 KEY UNIFIED SYSTEMS (NEW ARCHITECTURE)

### 🆕 **CORE UNIFIED SYSTEMS**
1. **`shared/platform/systems/UnifiedPlayerSystem.js`** - Complete player management
2. **`shared/platform/systems/UnifiedTournamentSystem.js`** - Complete tournament system
3. **`shared/ui/UnifiedPlayerCard.js`** - Complete UI system

### 🆕 **INTEGRATION & TESTING**
1. **`shared/platform/UnifiedSystemsIntegration.js`** - Ready-to-use integration
2. **`test-unified-systems.js`** - Comprehensive test suite
3. **`unified-systems-demo.html`** - Interactive demo

### 🔄 **LEGACY FILES (To be migrated/removed)**
- `games/neondrop/ui/EverythingCard.*` files (replaced by UnifiedPlayerCard)
- Various scattered identity and tournament files (consolidated into unified systems)

---

## 📊 SUMMARY STATS

- **Total Directories**: 35+
- **Total Files**: 100+
- **New Unified Systems**: 3 core systems + 1 integration helper
- **Ready for Migration**: ✅ All systems complete and tested
- **Clean Architecture**: ✅ Clear separation of concerns

Your BlockZone Lab website now has a **clean, professional structure** with the new unified systems ready for production use!
