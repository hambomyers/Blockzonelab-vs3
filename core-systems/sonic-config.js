// Sonic Labs Network Configuration
window.SONIC_CONFIG = {
    // Sonic Labs Testnet (Sonic Blaze Testnet)
    testnet: {
        chainId: '0xDEB6', // 57054 - Correct Sonic Blaze Testnet chain ID
        chainName: 'Sonic Blaze Testnet',
        nativeCurrency: {
            name: 'Sonic',
            symbol: 'S',
            decimals: 18
        },
        rpcUrls: ['https://rpc.sonic.oasys.games'],
        blockExplorerUrls: ['https://testnet.sonicscan.org']
    },
    
    // Sonic Labs Mainnet
    mainnet: {
        chainId: '0xDEB6', // 57054 - Sonic Labs mainnet chain ID
        chainName: 'Sonic Labs',
        nativeCurrency: {
            name: 'Sonic',
            symbol: 'S',
            decimals: 18
        },
        rpcUrls: ['https://rpc.sonic.oasys.games'],
        blockExplorerUrls: ['https://sonicscan.org']
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
