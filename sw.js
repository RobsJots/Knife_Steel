// Production service worker — scope-safe, cache-clean, cache-busting
const APP_VERSION = "4.1.1";
const CACHE_NAME = "ksr-static-" + APP_VERSION;
const CORE_ASSETS = [
  "./",
  "./index.html?v=4.1.0",
  "./app.css?v=4.1.0",
  "./app.js?v=4.1.0",
  "./manifest.webmanifest?v=4.1.0",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS.map((p) => new Request(p, { cache: "no-cache" })));
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (evt) => {
  if (evt.data && evt.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.pathname.endsWith("steels.json")) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req.url, copy));
        return res;
      }).catch(() => caches.match("./index.html?v=4.1.0"))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (req.method === "GET" && res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => undefined);
    })
  );
});
