// ============================================================
// Knife Steel Reference — Production Service Worker
// Scope-safe, cache-clean, cache-busting
// ============================================================

// --- Version & Cache Name ---
const APP_VERSION = "4.1.1";
const CACHE_NAME = "ksr-static-" + APP_VERSION;

// --- Core Assets to Precache ---
// These are the essential files for offline use.
// Note: query strings use APP_VERSION for cache-busting.
const CORE_ASSETS = [
  "./",
  "./index.html?v=" + APP_VERSION,
  "./app.css?v=" + APP_VERSION,
  "./app.js?v=" + APP_VERSION,
  "./manifest.webmanifest?v=" + APP_VERSION,
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// ============================================================
// Install Event — precache core assets
// ============================================================
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(
        CORE_ASSETS.map((p) => new Request(p, { cache: "no-cache" }))
      );
    })
  );
});

// ============================================================
// Activate Event — clean up old caches
// ============================================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
      await self.clients.claim();
    })()
  );
});

// ============================================================
// Message Event — allow SKIP_WAITING from app.js
// ============================================================
self.addEventListener("message", (evt) => {
  if (evt.data && evt.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ============================================================
// Fetch Event — network-first for steels.json & HTML,
// cache-first fallback for other assets
// ============================================================
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // --- Special handling for steels.json ---
  if (url.pathname.endsWith("steels.json")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // --- Navigation requests (HTML pages) ---
  if (
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html")
  ) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req.url, copy));
          return res;
        })
        .catch(() => caches.match("./index.html?v=" + APP_VERSION))
    );
    return;
  }

  // --- Default: cache-first for other assets ---
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (
            req.method === "GET" &&
            res &&
            res.status === 200 &&
            res.type === "basic"
          ) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => undefined);
    })
  );
});
