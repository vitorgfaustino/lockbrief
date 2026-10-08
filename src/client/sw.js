const CACHE_NAME = "lockbrief-static-__STATIC_CACHE_VERSION__";

const STATIC_PATHS = [
  "/client.js",
  "/styles.css",
  "/manifest.webmanifest",
  "/assets/favicon.ico",
  "/assets/favicon-96x96.png",
  "/assets/lockbrief.png",
  "/assets/apple-touch-icon.png",
  "/assets/web-app-manifest-192x192.png",
  "/assets/web-app-manifest-512x512.png",
];

const STATIC_PATH_SET = new Set(STATIC_PATHS);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_PATHS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("lockbrief-static-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate" || url.pathname === "/" || url.pathname.startsWith("/api/")) return;
  if (!STATIC_PATH_SET.has(url.pathname)) return;

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}
