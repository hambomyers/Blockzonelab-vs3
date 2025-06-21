/**
 * Identity Manager Worker - Sonic Wallet-Based Player Identity
 * Handles invisible wallet generation, cross-device sync, and identity management
 * Built for BlockZone Lab gaming platform
 */

// Simple ethers.js alternative using Web Crypto API for Cloudflare Worker compatibility
class WalletGenerator {
    static async generateWallet() {
        // Generate 32 random bytes for private key
        const privateKeyArray = crypto.getRandomValues(new Uint8Array(32));
        const privateKey = '0x' + Array.from(privateKeyArray, byte => 
            byte.toString(16).padStart(2, '0')
        ).join('');
        
        // For now, generate a mock address (we'll improve this with proper derivation)
        const addressArray = crypto.getRandomValues(new Uint8Array(20));
        const address = '0x' + Array.from(addressArray, byte => 
            byte.toString(16).padStart(2, '0')
        ).join('');
        
        // Get last 4 characters for display
        const shortCode = address.slice(-4).toUpperCase();
        
        return {
            address,
            privateKey,
            shortCode
        };
    }
    
    static generateDeviceId() {
        // Generate unique device identifier
        const deviceArray = crypto.getRandomValues(new Uint8Array(16));
        return Array.from(deviceArray, byte => 
            byte.toString(16).padStart(2, '0')
        ).join('');
    }
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // CORS headers for all responses
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };
        
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }
        
        try {
            // Identity API Routes
            if (path === '/api/identity/create' && request.method === 'POST') {
                return await createIdentity(request, env, corsHeaders);
            }
            
            if (path === '/api/identity/get' && request.method === 'POST') {
                return await getIdentity(request, env, corsHeaders);
            }
            
            if (path === '/api/identity/recover' && request.method === 'POST') {
                return await recoverIdentity(request, env, corsHeaders);
            }
            
            if (path === '/api/identity/device-check' && request.method === 'POST') {
                return await checkDeviceIdentity(request, env, corsHeaders);
            }
            
            // Payment tier endpoints
            if (path === '/api/identity/update-tier' && request.method === 'POST') {
                return await updatePaymentTier(request, env, corsHeaders);
            }
            
            if (path === '/api/identity/check-access' && request.method === 'POST') {
                return await checkGameAccess(request, env, corsHeaders);
            }
            
            // Tournament integration (proxy to tournament-manager)
            if (path.startsWith('/api/tournament/')) {
                return await proxyToTournament(request, env, corsHeaders);
            }
            
            // Health check
            if (path === '/api/health') {
                return new Response(JSON.stringify({ 
                    status: 'ok', 
                    service: 'identity-manager',
                    timestamp: new Date().toISOString()
                }), { headers: corsHeaders });
            }
            
            return new Response('Not Found', { status: 404, headers: corsHeaders });
            
        } catch (error) {
            console.error('Identity Manager Error:', error);
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Internal server error',
                timestamp: new Date().toISOString()
            }), { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};

// === IDENTITY MANAGEMENT FUNCTIONS ===

async function createIdentity(request, env, corsHeaders) {
    try {
        const { displayName, deviceId } = await request.json();
        
        if (!displayName || displayName.length < 3) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Display name must be at least 3 characters'
            }), { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // Generate new wallet
        const wallet = await WalletGenerator.generateWallet();
        const finalDeviceId = deviceId || WalletGenerator.generateDeviceId();
        
        // Create identity record
        const identityData = {
            displayName,
            walletAddress: wallet.address,
            shortCode: wallet.shortCode,
            created: new Date().toISOString(),
            devices: [finalDeviceId],
            totalGames: 0,
            bestScore: 0,
            paymentTier: 'free',
            tierExpiry: null,
            paidGamesRemaining: 0
        };
        
        // Store in WALLETS KV
        await env.WALLETS.put(wallet.address, JSON.stringify(identityData));
        
        // Store device mapping
        await env.DEVICES.put(finalDeviceId, JSON.stringify({
            walletAddress: wallet.address,
            lastAccess: new Date().toISOString(),
            userAgent: request.headers.get('User-Agent') || 'unknown'
        }));
        
        // Return public identity (no private key)
        return new Response(JSON.stringify({
            success: true,
            identity: {
                displayName,
                walletAddress: wallet.address,
                shortCode: wallet.shortCode,
                displayFormat: `${displayName} #${wallet.shortCode}`,
                deviceId: finalDeviceId,
                paymentTier: 'free'
            },
            // Include recovery data (encrypted in real implementation)
            recovery: {
                seed: wallet.privateKey, // TODO: Encrypt this
                qrCode: `data:text/plain;base64,${btoa(wallet.privateKey)}`
            }
        }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Create Identity Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to create identity'
        }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function getIdentity(request, env, corsHeaders) {
    try {
        const { walletAddress, deviceId } = await request.json();
        
        let targetWallet = walletAddress;
        
        // If no wallet provided, try to find by device
        if (!targetWallet && deviceId) {
            const deviceData = await env.DEVICES.get(deviceId);
            if (deviceData) {
                const device = JSON.parse(deviceData);
                targetWallet = device.walletAddress;
            }
        }
        
        if (!targetWallet) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No identity found for this device'
            }), { 
                status: 404, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // Get identity data
        const identityData = await env.WALLETS.get(targetWallet);
        if (!identityData) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Identity not found'
            }), { 
                status: 404, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        const identity = JSON.parse(identityData);
        
        return new Response(JSON.stringify({
            success: true,
            identity: {
                displayName: identity.displayName,
                walletAddress: identity.walletAddress,
                shortCode: identity.shortCode,
                displayFormat: `${identity.displayName} #${identity.shortCode}`,
                paymentTier: identity.paymentTier,
                tierExpiry: identity.tierExpiry,
                totalGames: identity.totalGames,
                bestScore: identity.bestScore,
                paidGamesRemaining: identity.paidGamesRemaining
            }
        }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Get Identity Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to get identity'
        }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function checkDeviceIdentity(request, env, corsHeaders) {
    try {
        const { deviceId } = await request.json();
        
        if (!deviceId) {
            return new Response(JSON.stringify({
                success: false,
                hasIdentity: false
            }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        const deviceData = await env.DEVICES.get(deviceId);
        const hasIdentity = !!deviceData;
        
        if (hasIdentity) {
            const device = JSON.parse(deviceData);
            const identityData = await env.WALLETS.get(device.walletAddress);
            
            if (identityData) {
                const identity = JSON.parse(identityData);
                return new Response(JSON.stringify({
                    success: true,
                    hasIdentity: true,
                    identity: {
                        displayName: identity.displayName,
                        walletAddress: identity.walletAddress,
                        shortCode: identity.shortCode,
                        displayFormat: `${identity.displayName} #${identity.shortCode}`,
                        paymentTier: identity.paymentTier
                    }
                }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }
        
        return new Response(JSON.stringify({
            success: true,
            hasIdentity: false
        }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Check Device Identity Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to check device identity'
        }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function updatePaymentTier(request, env, corsHeaders) {
    try {
        const { walletAddress, tier, duration } = await request.json();
        
        const identityData = await env.WALLETS.get(walletAddress);
        if (!identityData) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Identity not found'
            }), { 
                status: 404, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        const identity = JSON.parse(identityData);
        const now = new Date();
        
        // Update payment tier
        identity.paymentTier = tier;
        
        switch(tier) {
            case 'single':
                identity.paidGamesRemaining = (identity.paidGamesRemaining || 0) + 1;
                break;
            case 'daily':
                identity.tierExpiry = new Date(now.getTime() + (24 * 60 * 60 * 1000)).toISOString();
                break;
            case 'monthly':
                identity.tierExpiry = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();
                break;
        }
        
        await env.WALLETS.put(walletAddress, JSON.stringify(identity));
        
        return new Response(JSON.stringify({
            success: true,
            identity: {
                displayName: identity.displayName,
                walletAddress: identity.walletAddress,
                shortCode: identity.shortCode,
                displayFormat: `${identity.displayName} #${identity.shortCode}`,
                paymentTier: identity.paymentTier,
                tierExpiry: identity.tierExpiry,
                paidGamesRemaining: identity.paidGamesRemaining
            }
        }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Update Payment Tier Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to update payment tier'
        }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function checkGameAccess(request, env, corsHeaders) {
    try {
        const { walletAddress } = await request.json();
        
        const identityData = await env.WALLETS.get(walletAddress);
        if (!identityData) {
            return new Response(JSON.stringify({
                success: false,
                hasAccess: false,
                reason: 'Identity not found'
            }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        const identity = JSON.parse(identityData);
        const now = new Date();
        
        // Check payment tier access
        if (identity.paymentTier === 'monthly' || identity.paymentTier === 'daily') {
            if (identity.tierExpiry && new Date(identity.tierExpiry) > now) {
                return new Response(JSON.stringify({
                    success: true,
                    hasAccess: true,
                    accessType: identity.paymentTier,
                    expiresAt: identity.tierExpiry
                }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }
        
        // Check paid games remaining
        if (identity.paidGamesRemaining > 0) {
            return new Response(JSON.stringify({
                success: true,
                hasAccess: true,
                accessType: 'single',
                gamesRemaining: identity.paidGamesRemaining
            }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // Check free daily game (TODO: implement daily tracking)
        return new Response(JSON.stringify({
            success: true,
            hasAccess: true,
            accessType: 'free',
            reason: 'Free daily game available'
        }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Check Game Access Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to check game access'
        }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Placeholder for tournament proxy (will integrate with existing tournament-manager)
async function proxyToTournament(request, env, corsHeaders) {
    // TODO: Proxy to tournament-manager worker with wallet-based identity
    return new Response(JSON.stringify({
        success: false,
        error: 'Tournament integration coming soon'
    }), { 
        status: 501, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
