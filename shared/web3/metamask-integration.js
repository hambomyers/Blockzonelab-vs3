/**
 * MetaMask Integration for Sonic Labs
 * Optimized for seamless Sonic Labs experience with MetaMask
 */

class MetaMaskIntegration {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.network = 'testnet';
        this.isConnected = false;
        this.walletType = 'metamask';
        
        // Contract ABIs
        this.contractABIs = {
            QUARTERS: [
                "function balanceOf(address owner) view returns (uint256)",
                "function transfer(address to, uint256 amount) returns (bool)",
                "function transferFrom(address from, address to, uint256 amount) returns (bool)",
                "function approve(address spender, uint256 amount) returns (bool)",
                "function allowance(address owner, address spender) view returns (uint256)",
                "function mintFromPayment(address recipient, uint256 usdAmount) external",
                "event Transfer(address indexed from, address indexed to, uint256 value)"
            ],
            GAME: [
                "function joinDailyTournament() external",
                "function submitScore(uint256 score, bytes32 gameHash) external",
                "function getDailyTournament() external view returns (uint256, uint256, uint256, uint256, uint256, bool, bool)",
                "function getPlayerScore(address player) external view returns (uint256)",
                "function createChallenge(uint256 fee, bytes32 pieceSequenceHash) external returns (uint256)",
                "function acceptChallenge(uint256 challengeId) external",
                "function submitChallengeScore(uint256 challengeId, uint256 score) external",
                "event DailyTournamentStarted(uint256 startTime, uint256 endTime, uint256 entryFee)",
                "event TournamentJoined(address indexed player, uint256 entryFee)",
                "event ScoreSubmitted(address indexed player, uint256 score, bytes32 gameHash)"
            ],
            FAUCET: [
                "function requestTokens() external",
                "function canRequest(address user) external view returns (bool)",
                "function timeUntilNextRequest(address user) external view returns (uint256)",
                "function getFaucetStatus() external view returns (uint256, uint256, uint256)",
                "event TokensRequested(address indexed user, uint256 amount, uint256 timestamp)"
            ]
        };
        
        // Contract addresses (will be updated after deployment)
        this.contractAddresses = {
            testnet: {
                QUARTERS: '0x0000000000000000000000000000000000000000', // Will be updated
                GAME: '0x0000000000000000000000000000000000000000', // Will be updated
                FAUCET: '0x0000000000000000000000000000000000000000' // Will be updated
            },
            mainnet: {
                QUARTERS: '0x0000000000000000000000000000000000000000', // Will be updated
                GAME: '0x0000000000000000000000000000000000000000', // Will be updated
                FAUCET: '0x0000000000000000000000000000000000000000' // Will be updated
            }
        };
        
        this.init();
    }
    
    async init() {
        console.log('🦊 Initializing MetaMask integration for Sonic Labs...');
        
        // Check if MetaMask is available
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
            console.log('✅ MetaMask detected');
            await this.setupProvider();
        } else {
            console.log('❌ MetaMask not detected');
            this.showMetaMaskPrompt();
        }
    }
    
    async setupProvider() {
        try {
            // Load ethers dynamically
            const { ethers } = await import('https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js');
            this.ethers = ethers;
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('👤 Account changed:', accounts[0]);
                this.handleAccountChange(accounts[0]);
            });
            
            // Listen for network changes
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('🌐 Network changed:', chainId);
                this.handleNetworkChange(chainId);
            });
            
            console.log('✅ Provider setup complete');
        } catch (error) {
            console.error('❌ Provider setup failed:', error);
        }
    }
    
    async connectWallet() {
        try {
            console.log('🔌 Connecting MetaMask...');
            
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length > 0) {
                this.signer = this.provider.getSigner();
                this.isConnected = true;
                
                const address = await this.signer.getAddress();
                console.log('✅ MetaMask connected:', address);
                
                // Check current network
                const network = await this.provider.getNetwork();
                console.log('🌐 Current network:', network.chainId);
                
                // If not on Sonic Labs, switch automatically
                if (network.chainId !== 57054) {
                    console.log('🔄 Not on Sonic Labs, switching automatically...');
                    await this.switchToSonicLabs();
                } else {
                    // Already on Sonic Labs
                    this.network = 'testnet';
                    console.log('✅ Already on Sonic Labs testnet');
                }
                
                // Initialize contracts
                await this.initializeContracts();
                
                return {
                    success: true,
                    address: address,
                    network: this.network,
                    walletType: this.walletType
                };
            }
        } catch (error) {
            console.error('❌ MetaMask connection failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async switchToSonicLabs(network = 'testnet') {
        try {
            console.log(`🌐 Switching to Sonic Labs ${network}...`);
            
            const chainId = '0xDEB6'; // 57054 in hex
            const networkConfig = {
                testnet: {
                    chainId: '0xDEB6',
                    chainName: 'Sonic Blaze Testnet',
                    nativeCurrency: {
                        name: 'Sonic',
                        symbol: 'S',
                        decimals: 18
                    },
                    rpcUrls: ['https://rpc.sonic.oasys.games'],
                    blockExplorerUrls: ['https://testnet.sonicscan.org']
                },
                mainnet: {
                    chainId: '0xDEB6',
                    chainName: 'Sonic Labs',
                    nativeCurrency: {
                        name: 'Sonic',
                        symbol: 'S',
                        decimals: 18
                    },
                    rpcUrls: ['https://rpc.sonic.oasys.games'],
                    blockExplorerUrls: ['https://sonicscan.org']
                }
            };
            
            try {
                // Try to switch to the network
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: chainId }]
                });
            } catch (error) {
                if (error.code === 4902) {
                    // Network not added, add it
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [networkConfig[network]]
                    });
                } else {
                    throw error;
                }
            }
            
            this.network = network;
            console.log(`✅ Switched to Sonic Labs ${network}`);
            
            return { success: true, network: network };
        } catch (error) {
            console.error('❌ Network switch failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    async initializeContracts() {
        try {
            console.log('📋 Initializing contracts...');
            
            const addresses = this.contractAddresses[this.network];
            
            // Initialize QUARTERS contract
            this.contracts.QUARTERS = new this.ethers.Contract(
                addresses.QUARTERS,
                this.contractABIs.QUARTERS,
                this.signer
            );
            
            // Initialize Game contract
            this.contracts.GAME = new this.ethers.Contract(
                addresses.GAME,
                this.contractABIs.GAME,
                this.signer
            );
            
            // Initialize Faucet contract
            this.contracts.FAUCET = new this.ethers.Contract(
                addresses.FAUCET,
                this.contractABIs.FAUCET,
                this.signer
            );
            
            console.log('✅ Contracts initialized');
        } catch (error) {
            console.error('❌ Contract initialization failed:', error);
        }
    }
    
    async getQuartersBalance(address = null) {
        try {
            if (!this.contracts.QUARTERS) {
                throw new Error('Contracts not initialized');
            }
            
            const targetAddress = address || await this.signer.getAddress();
            const balance = await this.contracts.QUARTERS.balanceOf(targetAddress);
            
            return this.ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('❌ Failed to get QUARTERS balance:', error);
            return '0';
        }
    }
    
    async requestTestTokens() {
        try {
            console.log('🪙 Requesting test tokens from faucet...');
            
            if (!this.contracts.FAUCET) {
                throw new Error('Faucet contract not initialized');
            }
            
            // Check if user can request
            const canRequest = await this.contracts.FAUCET.canRequest(await this.signer.getAddress());
            if (!canRequest) {
                const timeUntilNext = await this.contracts.FAUCET.timeUntilNextRequest(await this.signer.getAddress());
                const minutes = Math.ceil(timeUntilNext / 60);
                throw new Error(`Can request again in ${minutes} minutes`);
            }
            
            // Request tokens
            const tx = await this.contracts.FAUCET.requestTokens();
            await tx.wait();
            
            console.log('✅ Test tokens requested successfully');
            return { success: true, txHash: tx.hash };
        } catch (error) {
            console.error('❌ Failed to request test tokens:', error);
            return { success: false, error: error.message };
        }
    }
    
    async joinDailyTournament() {
        try {
            console.log('🎮 Joining daily tournament...');
            
            if (!this.contracts.GAME) {
                throw new Error('Game contract not initialized');
            }
            
            // First approve QUARTERS spending
            const entryFee = this.ethers.utils.parseEther('0.25'); // 0.25 QUARTERS
            await this.contracts.QUARTERS.approve(this.contracts.GAME.address, entryFee);
            
            // Join tournament
            const tx = await this.contracts.GAME.joinDailyTournament();
            await tx.wait();
            
            console.log('✅ Joined daily tournament');
            return { success: true, txHash: tx.hash };
        } catch (error) {
            console.error('❌ Failed to join tournament:', error);
            return { success: false, error: error.message };
        }
    }
    
    async submitScore(score, gameHash) {
        try {
            console.log('📊 Submitting score:', score);
            
            if (!this.contracts.GAME) {
                throw new Error('Game contract not initialized');
            }
            
            const tx = await this.contracts.GAME.submitScore(score, gameHash);
            await tx.wait();
            
            console.log('✅ Score submitted');
            return { success: true, txHash: tx.hash };
        } catch (error) {
            console.error('❌ Failed to submit score:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getDailyTournamentInfo() {
        try {
            if (!this.contracts.GAME) {
                throw new Error('Game contract not initialized');
            }
            
            const tournament = await this.contracts.GAME.getDailyTournament();
            
            return {
                startTime: tournament[0].toNumber(),
                endTime: tournament[1].toNumber(),
                entryFee: this.ethers.utils.formatEther(tournament[2]),
                prizePool: this.ethers.utils.formatEther(tournament[3]),
                participants: tournament[4].toNumber(),
                isActive: tournament[5],
                isCompleted: tournament[6]
            };
        } catch (error) {
            console.error('❌ Failed to get tournament info:', error);
            return null;
        }
    }
    
    handleAccountChange(address) {
        console.log('👤 Account changed to:', address);
        // Re-initialize contracts with new signer
        if (this.provider) {
            this.signer = this.provider.getSigner();
            this.initializeContracts();
        }
    }
    
    handleNetworkChange(chainId) {
        console.log('🌐 Network changed to:', chainId);
        // Check if it's Sonic Labs
        if (chainId === '0xDEB6' || parseInt(chainId) === 57054) {
            this.network = 'testnet';
            console.log('✅ Now on Sonic Labs testnet');
        } else {
            console.log('⚠️ Not on Sonic Labs network');
        }
    }
    
    showMetaMaskPrompt() {
        const prompt = document.createElement('div');
        prompt.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    text-align: center;
                    max-width: 400px;
                    margin: 20px;
                ">
                    <h2 style="color: #f6851b; margin-bottom: 20px;">🦊 MetaMask Required</h2>
                    <p style="margin-bottom: 20px;">
                        BlockZone Lab requires MetaMask to interact with Sonic Labs blockchain.
                    </p>
                    <div style="margin-bottom: 20px;">
                        <a href="https://metamask.io/download/" target="_blank" style="
                            background: #f6851b;
                            color: white;
                            padding: 12px 24px;
                            text-decoration: none;
                            border-radius: 5px;
                            display: inline-block;
                            margin: 5px;
                        ">Download MetaMask</a>
                    </div>
                    <p style="font-size: 14px; color: #666;">
                        After installing MetaMask, refresh this page to continue.
                    </p>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        background: #ccc;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-top: 10px;
                    ">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(prompt);
    }
    
    updateContractAddresses(addresses, network = 'testnet') {
        this.contractAddresses[network] = { ...this.contractAddresses[network], ...addresses };
        console.log(`📝 Updated contract addresses for ${network}:`, addresses);
    }
    
    getWalletType() {
        return this.walletType;
    }
    
    isOptimalWallet() {
        return this.walletType === 'metamask';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetaMaskIntegration;
} else {
    window.MetaMaskIntegration = MetaMaskIntegration;
} 