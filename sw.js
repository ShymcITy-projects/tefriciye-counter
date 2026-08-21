// Tefriciye Prayer Counter — service worker
// Caches the app shell on install so the app works fully offline
// after the first successful load.

const CACHE_NAME = "tefriciye-cache-v8";
const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
  "./icon.png"
];

self.addEventListener("install", event => {
  // Note: no self.skipWaiting() here on purpose — a new service worker
  // stays "waiting" until the page asks it to take over (see the
  // SKIP_WAITING message below). That pause is what makes the
  // "new version available" prompt in app.js possible.
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

// The page sends this once the person taps "Update" in the prompt.
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Cache-first, falling back to network, falling back to the
// cached app shell for navigations (so it still opens offline
// even if a specific request was never cached).
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
