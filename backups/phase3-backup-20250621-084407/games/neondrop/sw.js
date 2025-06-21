// NeonDrop Service Worker - Local scope
// This fixes the scope issue by placing the SW in the same directory

const CACHE_NAME = 'neondrop-v1.0.0';
const GAME_ASSETS = [
  './',
  './index.html',
  './main.js',
  './config.js',
  './style.css',
  './manifest.json',
  './core/game-engine.js',
  './core/renderer.js',
  './core/input-controller.js',
  './core/audio-system.js',
  './core/viewport-manager.js',
  './ui/ui-state-manager.js',
  './ui/guide-panel.js',
  './ui/stats-panel.js',
  './UniversalPlayerIdentity.js',
  './UniversalPaymentSystem.js'
];

// Install event - cache game assets
self.addEventListener('install', event => {
  console.log('[NeonDrop SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[NeonDrop SW] Caching game assets');
        return cache.addAll(GAME_ASSETS);
      })
      .catch(error => {
        console.log('[NeonDrop SW] Cache failed (non-critical):', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[NeonDrop SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[NeonDrop SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Only handle requests within our scope
  if (!event.request.url.includes('/games/neondrop/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch(() => {
          // Fallback for offline
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Message handling for game communication
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[NeonDrop SW] Service Worker loaded');
