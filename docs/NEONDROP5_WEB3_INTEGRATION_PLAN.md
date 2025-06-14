# NEONDROP5 Web3 Integration Plan

## Current Status: ✅ STANDALONE GAME FULLY FUNCTIONAL
- Core Tetris gameplay working perfectly
- Japanese MA-inspired game over UI implemented
- Local leaderboard system active
- No Web3 dependencies blocking game functionality

## Phase 2: Sonic Labs Integration Plan

### 1. Prerequisites
- [ ] Sonic Labs testnet properly configured
- [ ] QUARTERS and STARDUST token contracts deployed
- [ ] Cross-game wallet system architecture finalized

### 2. Integration Points

#### A. Wallet Connection
- **File**: `../shared/blockzone-web3.js`
- **Purpose**: Connect to Sonic Labs testnet
- **Features**: MetaMask integration, network switching

#### B. Token Integration
- **QUARTERS Token**: In-game currency and rewards
- **STARDUST Token**: Cross-game achievements and NFTs
- **Smart Contracts**: Located in `../../contracts/`

#### C. Leaderboard Blockchain Storage
- **Current**: Local storage fallback
- **Future**: On-chain leaderboard with token rewards
- **Migration**: Seamless upgrade path planned

### 3. Implementation Steps (When Ready)

1. **Enable wallet UI** in `index.html` (remove `display: none`)
2. **Load Web3 modules** properly with correct paths
3. **Integrate token rewards** into scoring system
4. **Add blockchain leaderboard** alongside local fallback
5. **Test on Sonic Labs testnet** before mainnet

### 4. Files to Modify Later
- `index.html` - Enable wallet UI
- `main.js` - Add Web3 event listeners
- `game-over-sequence.js` - Add token reward notifications
- `leaderboard.js` - Add blockchain storage option

## Development Philosophy
- **Core game first**: Game must work perfectly without Web3
- **Progressive enhancement**: Web3 features enhance but don't break
- **Graceful degradation**: Always have offline fallbacks
- **User choice**: Players can play with or without wallet connection

---
*This plan ensures BlockZone Lab maintains AAA quality while building toward Web3 integration.*
