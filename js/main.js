/**
 * BLOCKZONE LAB - Main Site JavaScript
 * Premium Crypto Edutainment Platform
 */

// Wallet connection state
let walletConnected = false;
let userAddress = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkWalletConnection();
});

function initializeApp() {
    console.log('BlockZone Lab - Premium Crypto Edutainment Platform Initialized');
    
    // Initialize starfield background if not already present
    initializeStarfield();
    
    // Check for existing wallet connection
    checkWalletConnection();
}

function setupEventListeners() {
    // Wallet status click handler
    const walletStatus = document.getElementById('walletStatus');
    if (walletStatus) {
        walletStatus.addEventListener('click', showWalletModal);
    }
    
    // Modal close handlers
    const modalOverlay = document.getElementById('walletModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeWalletModal();
            }
        });
    }
    
    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeWalletModal();
        }
    });
}

function showWalletModal() {
    const modal = document.getElementById('walletModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeWalletModal() {
    const modal = document.getElementById('walletModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

async function connectWallet() {
    try {
        // Check if MetaMask or other wallet is available
        if (typeof window.ethereum !== 'undefined') {
            console.log('Connecting to wallet...');
            
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length > 0) {
                userAddress = accounts[0];
                walletConnected = true;
                
                updateWalletUI();
                closeWalletModal();
                
                console.log('Wallet connected:', userAddress);
                
                // Optional: Switch to Sonic Labs network
                await switchToSonicNetwork();
                
            } else {
                throw new Error('No accounts returned');
            }
        } else {
            alert('Please install MetaMask or another Web3 wallet to connect.');
        }
    } catch (error) {
        console.error('Wallet connection failed:', error);
        alert('Failed to connect wallet. Please try again.');
    }
}

async function switchToSonicNetwork() {
    try {
        // Sonic Labs network configuration
        const sonicNetwork = {
            chainId: '0xFA', // 250 in hex (Fantom/Sonic)
            chainName: 'Sonic Labs',
            nativeCurrency: {
                name: 'Fantom',
                symbol: 'FTM',
                decimals: 18
            },
            rpcUrls: ['https://rpc.sonic.fantom.network/'],
            blockExplorerUrls: ['https://sonicscan.org/']
        };
        
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [sonicNetwork]
        });
        
        console.log('Switched to Sonic Labs network');
    } catch (error) {
        console.log('Network switch failed or cancelled:', error);
    }
}

function updateWalletUI() {
    const walletStatus = document.getElementById('walletStatus');
    if (walletStatus && userAddress) {
        const shortAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        walletStatus.innerHTML = `
            <i class="fas fa-wallet"></i>
            <span>${shortAddress}</span>
        `;
        walletStatus.classList.remove('disconnected');
        walletStatus.classList.add('connected');
    }
}

async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });
            
            if (accounts.length > 0) {
                userAddress = accounts[0];
                walletConnected = true;
                updateWalletUI();
            }
        } catch (error) {
            console.log('Could not check wallet connection:', error);
        }
    }
}

function initializeStarfield() {
    // Add animated starfield if not already present
    if (!document.querySelector('.starfield')) {
        const starfield = document.createElement('div');
        starfield.className = 'starfield';
        starfield.setAttribute('aria-hidden', 'true');
        
        // Create star layers
        for (let i = 1; i <= 3; i++) {
            const stars = document.createElement('div');
            stars.className = `stars${i === 1 ? '' : i}`;
            starfield.appendChild(stars);
        }
        
        document.body.insertBefore(starfield, document.body.firstChild);
    }
}

// Premium animations and effects
function addPremiumEffects() {
    // Add subtle animations to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Add scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe premium sections
    const sectionsToAnimate = document.querySelectorAll('.premium-features, .sonic-partnership');
    sectionsToAnimate.forEach(section => {
        observer.observe(section);
    });
}

// Initialize premium effects after DOM load
document.addEventListener('DOMContentLoaded', addPremiumEffects);

// Export functions for global access
window.showWalletModal = showWalletModal;
window.closeWalletModal = closeWalletModal;
window.connectWallet = connectWallet;
