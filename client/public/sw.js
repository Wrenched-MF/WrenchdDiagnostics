const CACHE_NAME = 'wrenchd-ivhc-v2';
const API_CACHE_NAME = 'wrenchd-api-cache-v1';
const IMAGE_CACHE_NAME = 'wrenchd-images-v1';

// Assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints that should be cached
const API_ENDPOINTS = [
  '/api/user',
  '/api/jobs',
  '/api/dvla/lookup',
  '/api/postcode/lookup'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)),
      caches.open(API_CACHE_NAME),
      caches.open(IMAGE_CACHE_NAME)
    ]).then(() => {
      console.log('Service Worker installed successfully');
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE_NAME && 
              cacheName !== IMAGE_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests with cache-first strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle image requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Network-first strategy for API requests (better for authentication)
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Always try network first for API requests
    const networkResponse = await fetch(request);
    
    // Cache successful responses (not auth failures)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network request failed, checking cache:', error);
    
    // Only serve from cache if network is completely unavailable
    const cachedResponse = await cache.match(request);
    if (cachedResponse && !navigator.onLine) {
      return cachedResponse;
    }
    
    // Let the network error pass through normally
    throw error;
  }
}

// Cache-first strategy for images
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a placeholder or cached version
    return cachedResponse || new Response('', { status: 404 });
  }
}

// Network-first strategy for static assets
async function handleStaticRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Network failed, serving from cache');
  }

  // Fallback to cache
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  return cachedResponse || new Response('Offline', { 
    status: 503, 
    statusText: 'Service Unavailable' 
  });
}

// Background sync for data synchronization
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(syncPendingData());
  }
});

// Sync pending data when back online
async function syncPendingData() {
  try {
    // This would sync any pending data stored in IndexedDB
    console.log('Syncing pending data...');
    
    // Notify all clients that sync is happening
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_START' });
    });

    // Perform sync operations here
    // This would involve reading from IndexedDB and POSTing to server
    
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
    
    console.log('Data sync completed');
  } catch (error) {
    console.error('Data sync failed:', error);
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/wrenchd_ivhc_icon_192x192.png',
      badge: '/wrenchd_ivhc_icon_192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification('Wrench\'d IVHC', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});