// Minimal production service worker with network-first for dynamic data
const CACHE_NAME = "ksr-static-v1";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/app.css",
  "/app.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Install: cache core assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS.map((p) => new Request(p, { cache: "no-cache" })));
    })
  );
});

// Activate: claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Message handler to support skipWaiting from the page
self.addEventListener("message", (evt) => {
  if (!evt.data) return;
  if (evt.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch: network-first for steels.json and navigation, cache-first for others
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Network-first for steels.json (always try network)
  if (url.pathname.endsWith("/steels.json")) {
    event.respondWith(
      fetch(req).then((res) => {
        // Update cache copy
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => {
        return caches.match(req);
      })
    );
    return;
  }

  // Network-first for navigation requests (index.html)
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy));
        return res;
      }).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Optionally cache fetched static assets
        if (req.method === "GET" && res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // fallback: nothing
      });
    })
  );
});
