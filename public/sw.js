// Mythayun Service Worker
// Version 1.0.0
// Last updated: 2025-06-13 02:32:33
// Created by: Sdiabate1337

// Log when the service worker is executed
console.log('[ServiceWorker] File loaded and parsed: 2025-06-13 02:32:33');

// Name for the cache
const CACHE_NAME = 'mythayun-cache-v1';

// Essential files to cache
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event triggered');
  
  // Force service worker activation without waiting
  self.skipWaiting();
  
  // Cache core assets
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Opened cache');
        
        // Attempt to cache each file, but don't fail if some are missing
        return Promise.allSettled(
          CORE_ASSETS.map(url => 
            fetch(url)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch ${url}: ${response.status}`);
                }
                return cache.put(url, response);
              })
              .catch(err => {
                console.warn(`[ServiceWorker] Failed to cache ${url}:`, err);
                // Don't fail the whole installation for individual files
                return null;
              })
          )
        ).then(() => {
          console.log('[ServiceWorker] Initial caching completed');
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event triggered');
  
  // Delete old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For HTML pages, use network-first strategy
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest version of the page
          let responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to return the cached HTML
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Cache the fetched resource
            let responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
            return fetchResponse;
          });
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received', event);
  
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }
  
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Mythayun';
    const options = {
      body: data.message || 'New notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/apple-touch-icon.png',
      data: {
        url: data.url || '/',
        timestamp: new Date().toISOString(),
      },
      vibrate: [100, 50, 100],
      timestamp: Date.now(),
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[ServiceWorker] Error showing notification:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click handled', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

console.log('[ServiceWorker] Script executed completely');