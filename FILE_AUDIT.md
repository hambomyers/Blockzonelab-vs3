# BlockZone Lab File Audit

## ✅ Active Game Files (games/neondrop/)
- [x] index.html - Game entry point
- [x] main.js - Core game logic  
- [x] style.css - Game styles
- [x] game-engine.js - Game engine (40KB, active)
- [x] renderer.js - Graphics rendering (57KB, active)
- [x] physics-pure.js - Game physics
- [x] audio-system.js - Sound management
- [x] game-over-sequence.js - End game UI (17KB, active)
- [x] tournament-ui.js - Tournament integration
- [x] arcade-leaderboard-ui.js - Leaderboard UI (13KB, active)
- [x] leaderboard.js - Leaderboard logic (11KB, active)
- [x] particles.js - Particle effects (6KB, active)
- [x] scoring.js - Scoring system (6KB, active)
- [x] guide-panel.js - Guide UI (12KB, active)
- [x] config.js - Game configuration

## ❌ DUPLICATE FILES TO DELETE (games/neondrop/modules/)
- [ ] arcade-leaderboard-ui.js (0 bytes - EMPTY DUPLICATE)
- [ ] game-engine.js (0 bytes - EMPTY DUPLICATE)
- [ ] game-over-sequence.js (0 bytes - EMPTY DUPLICATE)
- [ ] guide-panel.js (0 bytes - EMPTY DUPLICATE)
- [ ] leaderboard.js (0 bytes - EMPTY DUPLICATE)
- [ ] particles.js (0 bytes - EMPTY DUPLICATE)
- [ ] renderer.js (0 bytes - EMPTY DUPLICATE)
- [ ] scoring.js (0 bytes - EMPTY DUPLICATE)

**ACTION**: Remove entire `games/neondrop/modules/` directory

## 📁 SCATTERED SHARED FILES TO ORGANIZE (17 files)

### Web3 & Blockchain → shared/web3/
- [ ] wallet-connector.js

### API Clients → shared/api/
- [ ] api-client.js
- [ ] robust-api-client.js
- [ ] neondrop-api.js

### Tournament System → shared/tournaments/
- [ ] daily-tournament.js
- [ ] daily-tournament-v2.js
- [ ] daily-tournament-ui.js
- [ ] leaderboard-v2.js

### Economics & Payments → shared/economics/
- [ ] prize-calculator.js
- [ ] usdc-payment.js
- [ ] quarters-payment.js
- [ ] apple-pay.js

### UI Components → shared/ui/
- [ ] challenge-ui.js
- [ ] challenge-system.js

### Platform Features → shared/platform/
- [ ] identity.js
- [ ] free-daily-game.js
- [ ] revenue-dashboard.js

## 🎯 REORGANIZATION PRIORITY
1. **IMMEDIATE**: Delete empty `modules/` directory (prevents file restoration)
2. **HOUR 2**: Create new organized structure 
3. **HOUR 3**: Move files and update imports
4. **HOUR 4**: Test and deploy

**CRITICAL**: All main game files are active and working - DO NOT DELETE THESE!
