const CACHE_NAME = 'prayer-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon.png'
];

// Install the files into the phone's cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Serve the cached files when there is no internet
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});