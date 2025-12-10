// Service Worker for offline content caching

const CACHE_NAME = 'textbook-v1';
const urlsToCache = [
  '/',
  '/docs/',
  '/docs/chapter-1/',
  '/docs/chapter-1/key-concepts',
  '/docs/chapter-1/examples',
  '/docs/chapter-1/exercises',
  '/docs/chapter-1/references',
  '/css/custom.css',
  '/js/main.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request since we need to use it twice
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response since we need to use it twice
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

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
    })
  );
});

// Handle background sync for user data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Handle push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Default notification body',
    icon: '/img/icon-192x192.png',
    badge: '/img/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Physical AI & Humanoid Robotics', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/docs/')
  );
});

// Background sync function for user data
async function syncUserData() {
  try {
    // Get pending data from IndexedDB or localStorage
    const pendingData = JSON.parse(localStorage.getItem('pendingUserData') || '[]');

    for (const data of pendingData) {
      const response = await fetch('/api/user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        // Remove successfully synced data from pending list
        const updatedPending = pendingData.filter(item => item.id !== data.id);
        localStorage.setItem('pendingUserData', JSON.stringify(updatedPending));
      }
    }
  } catch (error) {
    console.error('Error syncing user data:', error);
    // Re-queue failed sync for later
    setTimeout(() => {
      syncUserData();
    }, 30000); // Retry after 30 seconds
  }
}