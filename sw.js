// Simple app-shell cache for offline usage
const CACHE = "ksr-cache-v3.4";
const ASSETS = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./steels.json",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((resp) => {
        // Cache successful GET responses for future offline use
        if (request.method === "GET" && resp.status === 200 && resp.type === "basic") {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return resp;
      }).catch(() => {
        // Offline fallback: return index for navigation requests
        if (request.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});

