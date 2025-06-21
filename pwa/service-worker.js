/**
 * BlockZone Lab PWA Service Worker
 * Following Web3 gaming industry best practices (Axie Infinity, Gods Unchained)
 * Optimized for gaming performance and Web3 functionality
 */

const CACHE_NAME = 'blockzone-lab-v1.0.0';
const GAME_CACHE = 'blockzone-games-v1.0.0';
const API_CACHE = 'blockzone-api-v1.0.0';

// Critical files for instant loading (like top Web3 games)
const CORE_FILES = [
  '/',
  '/index.html',
  '/games/',
  '/games/index.html',
  '/assets/css/design-system.css',
  '/assets/css/blockzone-system.css',
  '/assets/favicon.svg',
  '/manifest.json'
];

// Game assets for offline play
const GAME_FILES = [  '/games/neondrop/',
  '/games/neondrop/index.html',
  '/games/neondrop/style.css',
  '/games/neondrop/main.js',
  '/shared/components/game-framework.js',
  '/shared/web3/web3-integration.js'
];

// Web3/API endpoints that can be cached
const CACHEABLE_APIS = [
  '/shared/api/',
  '/shared/tournaments/',
  '/shared/economics/'
];

// Install event - preload critical assets
self.addEventListener('install', event => {
  console.log('[SW] Installing BlockZone Lab PWA...');
  
  event.waitUntil(
    Promise.all([
      // Cache core platform files
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(CORE_FILES);
      }),
      // Cache game files
      caches.open(GAME_CACHE).then(cache => {
        return cache.addAll(GAME_FILES);
      })
    ]).then(() => {
      console.log('[SW] BlockZone Lab PWA installed successfully');
      self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating BlockZone Lab PWA...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old versions
          if (cacheName !== CACHE_NAME && 
              cacheName !== GAME_CACHE && 
              cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] BlockZone Lab PWA activated');
      self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - smart caching strategy for Web3 games
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip Web3 wallet requests (must be online)
  if (isWeb3Request(url)) {
    return; // Let it go to network
  }
  
  // Game assets - cache first (for performance)
  if (isGameAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, GAME_CACHE));
    return;
  }
  
  // API requests - network first with cache fallback
  if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }
  
  // Core platform - cache first with network fallback
  event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
});

// Cache-first strategy (for games and static assets)
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update cache in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(() => {}); // Ignore network errors
      
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    console.log('[SW] Cache-first failed:', error);
    return new Response('Offline - Game temporarily unavailable', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network-first strategy (for API calls)
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline - API unavailable', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Helper functions
function isWeb3Request(url) {
  return url.pathname.includes('wallet') || 
         url.pathname.includes('metamask') ||
         url.pathname.includes('walletconnect') ||
         url.hostname.includes('infura') ||
         url.hostname.includes('alchemy');
}

function isGameAsset(url) {
  return url.pathname.includes('/games/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.svg');
}

function isAPIRequest(url) {
  return url.pathname.includes('/api/') ||
         url.pathname.includes('/shared/api/') ||
         url.pathname.includes('/tournaments/');
}

// Background sync for tournament scores (like Axie Infinity)
self.addEventListener('sync', event => {
  if (event.tag === 'tournament-score-sync') {
    event.waitUntil(syncTournamentScores());
  }
});

async function syncTournamentScores() {
  // Sync cached tournament scores when back online
  console.log('[SW] Syncing tournament scores...');
  // Implementation would integrate with your tournament system
}

// Push notifications for tournaments
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/badge-72.png',
        tag: 'tournament',
        data: data.url
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
