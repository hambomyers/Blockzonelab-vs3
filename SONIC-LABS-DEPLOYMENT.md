# 🚀 Sonic Labs Integration & Deployment Guide

## **Overview**
This guide will help you deploy BlockZone Lab to Sonic Labs Network and get real test tokens using their new testnet account system.

## **🎯 Why Sonic Labs?**
- **Free Test Tokens**: Sonic Labs provides test tokens for development via their account system
- **Fast & Cheap**: Low gas fees and fast transactions
- **Web3 Native**: Built for social and gaming applications
- **Real Network**: Test on a real blockchain, not a mock system
- **Account System**: New integrated account management at testnet.soniclabs.com/account

## **📋 Prerequisites**

### **1. Install Dependencies**
```bash
cd contracts
npm install
```

### **2. Setup Environment**
```bash
# Copy environment template
cp env.example .env

# Edit .env with your values
PRIVATE_KEY=your_private_key_here
SONICSCAN_API_KEY=your_soniclabs_api_key_here
```

### **3. Get Test Tokens via Sonic Labs Account System**
1. Visit [Sonic Labs Testnet Account](https://testnet.soniclabs.com/account)
2. Connect your wallet (Rabby recommended for best experience)
3. Use the account system to get test tokens
4. Wait for tokens to arrive (usually 1-2 minutes)

## **🔧 Deployment Steps**

### **Step 1: Compile Contracts**
```bash
cd contracts
npm run compile
```

### **Step 2: Deploy to Testnet**
```bash
npm run deploy:testnet
```

### **Step 3: Update Contract Addresses**
After deployment, update the addresses in:
- `shared/web3/sonic-integration.js`
- `core-systems/sonic-config.js`

### **Step 4: Verify Contracts (Optional)**
```bash
npm run verify:testnet
```

## **🎮 Game Integration**

### **1. Update Game Files**
The game has been updated to use Sonic Labs integration:
- Removed bypass system
- Added real wallet connection
- Integrated with QUARTERS token
- Added test token faucet

### **2. Test the Integration**
1. Open the game in browser
2. Click "Connect Wallet"
3. Switch to Sonic Labs testnet
4. Get test QUARTERS tokens via account system
5. Join tournament and play!

## **💰 Token Economics**

### **QUARTERS Token**
- **Symbol**: QTR
- **Decimals**: 18
- **Exchange Rate**: 1 USD = 4 QUARTERS (25 cents each)
- **Tournament Entry**: 0.25 QUARTERS ($0.25)

### **Test Token Distribution**
- **Faucet Amount**: 100 QUARTERS per request
- **Cooldown**: 1 hour between requests
- **Purpose**: Testing and development only

## **🔗 Network Information**

### **Sonic Labs Testnet**
- **Chain ID**: 11155420 (0xAA36A7)
- **RPC URL**: https://rpc.testnet.soniclabs.com
- **Explorer**: https://testnet.soniclabs.com
- **Account System**: https://testnet.soniclabs.com/account

### **Sonic Labs Mainnet**
- **Chain ID**: 11155420 (0xAA36A7)
- **RPC URL**: https://rpc.soniclabs.com
- **Explorer**: https://soniclabs.com

## **📱 User Experience Flow**

### **New User Journey**
1. **Visit Game**: User opens Neon Drop
2. **Connect Wallet**: Click "Connect Wallet" button
3. **Switch Network**: Automatically switches to Sonic Labs testnet
4. **Get Test Tokens**: Use Sonic Labs account system for free QUARTERS
5. **Join Tournament**: Pay 0.25 QUARTERS entry fee
6. **Play & Earn**: Compete for real prizes!

### **Returning User Journey**
1. **Auto-Connect**: Wallet connects automatically
2. **Check Balance**: See QUARTERS balance
3. **Join Tournament**: Pay entry fee if needed
4. **Play & Compete**: Earn rewards

## **🛠️ Development Workflow**

### **Local Development**
```bash
# Start local blockchain
npx hardhat node

# Deploy to local network
npm run deploy:local

# Test contracts
npm test
```

### **Testnet Development**
```bash
# Deploy to testnet
npm run deploy:testnet

# Test integration
# Open game and test full flow
```

### **Mainnet Deployment**
```bash
# Deploy to mainnet
npm run deploy:mainnet

# Verify contracts
npm run verify:mainnet
```

## **🔒 Security Considerations**

### **Smart Contract Security**
- All contracts use OpenZeppelin libraries
- Reentrancy protection enabled
- Access control implemented
- Pausable functionality for emergencies

### **User Security**
- Private keys never stored in browser
- All transactions require user approval
- Secure wallet integration with Rabby
- Test tokens only for development

## **🎯 Sonic Labs Account System**

### **Features**
- **Integrated Wallet Management**: Connect and manage wallets directly
- **Test Token Distribution**: Get free test tokens for development
- **Transaction History**: View all your testnet transactions
- **Network Status**: Real-time network information
- **Developer Tools**: Built-in tools for contract interaction

### **Getting Started**
1. Visit https://testnet.soniclabs.com/account
2. Connect your wallet (Rabby recommended)
3. Navigate to the token distribution section
4. Request test tokens for your development needs
5. Use tokens to test your smart contracts

## **🚀 Next Steps**

1. **Deploy Contracts**: Use the updated configuration to deploy to Sonic Labs testnet
2. **Test Integration**: Verify wallet connection and token faucet work
3. **Update Addresses**: Update contract addresses in configuration files
4. **Test Game**: Verify tournament system works with real tokens
5. **Go Live**: Deploy to mainnet when ready

## **📞 Support**

- **Sonic Labs Documentation**: https://docs.soniclabs.com
- **Testnet Account System**: https://testnet.soniclabs.com/account
- **Community**: Join Sonic Labs Discord for support

---

**🎯 This is true "falling forward" - we're building something real that people will actually use and pay for!** 