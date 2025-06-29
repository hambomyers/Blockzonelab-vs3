// Sonic Labs Network Configuration
window.SONIC_CONFIG = {
    // Sonic Labs Testnet (for development)
    testnet: {
        chainId: '0xAA36A7', // 11155420 - Correct Sonic Labs testnet chain ID
        chainName: 'Sonic Labs Testnet',
        nativeCurrency: {
            name: 'Sonic',
            symbol: 'S',
            decimals: 18
        },
        rpcUrls: ['https://rpc.testnet.soniclabs.com'],
        blockExplorerUrls: ['https://testnet.soniclabs.com']
    },
    
    // Sonic Labs Mainnet (for production)
    mainnet: {
        chainId: '0xAA36A7', // 11155420 - Sonic Labs mainnet chain ID
        chainName: 'Sonic Labs',
        nativeCurrency: {
            name: 'Sonic',
            symbol: 'S',
            decimals: 18
        },
        rpcUrls: ['https://rpc.soniclabs.com'],
        blockExplorerUrls: ['https://soniclabs.com']
    },
    
    // Contract addresses (will be deployed)
    contracts: {
        testnet: {
            QUARTERS: '0x0000000000000000000000000000000000000000',
            // STARDUST removed - no longer used
            NEONDROP_GAME: '0x0000000000000000000000000000000000000000',
            LEADERBOARD: '0x0000000000000000000000000000000000000000'
        },
        mainnet: {
            QUARTERS: '0x0000000000000000000000000000000000000000',
            // STARDUST removed - no longer used
            NEONDROP_GAME: '0x0000000000000000000000000000000000000000',
            LEADERBOARD: '0x0000000000000000000000000000000000000000'
        }
    }
};

// Auto-switch network helper
window.switchToSonic = async function(network = 'testnet') {
    const config = window.SONIC_CONFIG[network];
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: config.chainId }]
        });
    } catch (error) {
        if (error.code === 4902) {
            // Network not added, add it
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [config]
            });
        } else {
            throw error;
        }
    }
};
