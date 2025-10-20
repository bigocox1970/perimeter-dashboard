const CACHE_NAME = 'perim-maint-v4';
const urlsToCache = [
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache v4');
        // Only cache manifest - let HTML/JS/CSS fetch fresh
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Cache installation failed:', err);
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event - network first for JS/CSS, cache only manifest
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache JS, CSS, or HTML files - always fetch fresh
  if (url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/') {
    event.respondWith(fetch(event.request));
    return;
  }

  // For other resources, try cache first
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});
