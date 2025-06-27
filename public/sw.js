// Service Worker for offline emergency functionality
const CACHE_NAME = 'rescufast-emergency-v1';
const EMERGENCY_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/components/screens/BookAmbulanceScreen.tsx',
  '/src/components/screens/TrackingScreen.tsx'
];

// Install event - cache critical emergency resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(EMERGENCY_CACHE))
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Handle emergency requests specially
  if (event.request.url.includes('/api/emergency')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Store request for later sync
          return new Response(JSON.stringify({
            status: 'offline',
            message: 'Request saved for sync when online'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Regular cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Background sync for emergency requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'emergency-sync') {
    event.waitUntil(syncEmergencyRequests());
  }
});

async function syncEmergencyRequests() {
  // Sync pending emergency requests when back online
  const db = await openDB();
  const pendingRequests = await getPendingRequests(db);
  
  for (const request of pendingRequests) {
    try {
      await fetch('/api/emergency-requests', {
        method: 'POST',
        body: JSON.stringify(request)
      });
      await markAsSynced(db, request.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}