# NEONDROP5 🎮

A professional Tetris-style game featuring Japanese MA (間) inspired design principles, built for the BlockZone Lab gaming platform.

## ✨ Features

- **Core Tetris Gameplay**: Classic mechanics with modern polish
- **Japanese MA Design**: Thoughtful spacing and minimal aesthetic 
- **Professional Game Over UI**: Elegant transitions and user experience
- **Local Leaderboard**: Score persistence and ranking system
- **Touch Controls**: Mobile-friendly interface
- **Responsive Design**: Works on all screen sizes

## 🚀 Quick Start

1. **Local Development**:
   ```bash
   cd games/NEONDROP5
   python -m http.server 3000
   ```
   Open http://localhost:3000

2. **Production**: Deploy files to any static web host

## 🎯 Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Move Left | ← / A | Touch Left |
| Move Right | → / D | Touch Right |
| Rotate | ↑ / W / Space | Touch Rotate |
| Soft Drop | ↓ / S | Touch Down |
| Hard Drop | Enter | Touch Drop |
| Hold Piece | C / Shift | Touch Hold |

## 🏗️ Architecture

```
NEONDROP5/
├── index.html              # Main game page
├── main.js                 # Game initialization
├── game-engine.js          # Core game logic
├── renderer.js             # Canvas rendering
├── game-over-sequence.js   # Japanese MA-inspired game over UI
├── input-controller.js     # Input handling
├── leaderboard.js          # Score management
├── style.css              # Complete styling
└── README.md              # This file
```

## 🔮 Web3 Integration (Planned)

**Current Status**: Game runs fully standalone

**Planned Features**:
- Sonic Labs testnet integration
- QUARTERS token rewards
- STARDUST achievement NFTs
- Cross-game wallet system
- On-chain leaderboards

**Philosophy**: Web3 features will enhance the game experience but never break core functionality. The game will always work with or without wallet connection.

## 🎨 Design Philosophy

**Japanese MA (間)**: The concept of negative space and thoughtful pauses
- Generous spacing in UI elements
- Thoughtful timing in game over sequence
- Minimal, purposeful design choices
- Beauty through restraint and placement

## 🛠️ Development

**Current State**: Production-ready standalone game

**Code Quality**:
- Clean, documented JavaScript modules
- Responsive CSS with mobile-first approach
- Error handling and graceful degradation
- Professional game architecture

## 📱 Compatibility

- **Desktop**: All modern browsers
- **Mobile**: Touch-optimized controls
- **Offline**: Fully functional without internet
- **Progressive**: Enhances with available features

## 🏆 Credits

Part of the BlockZone Lab educational gaming platform.

---

*Built with attention to detail and Japanese design principles.*
