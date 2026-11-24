/**
 * CrossCart service worker.
 *
 * Rules:
 * - Never intercept cross-origin requests (Facebook, Clarity, analytics, ...).
 *   Proxying them through the SW makes the page CSP block them and can leak
 *   authenticated cookies to third parties.
 * - Never intercept API requests; auth/session responses must not be cached.
 * - Navigations are network-first, with a cached copy only as an offline
 *   fallback.
 * - Only content-hashed Next.js assets are cache-first.
 */
const CACHE_NAME = "crosscart-v2";
const PRECACHE_ASSETS = [
  "/",
  "/logo.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

const STATIC_ASSET_PATTERN =
  /\.(?:css|js|mjs|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(PRECACHE_ASSETS.map((asset) => cache.add(asset)))
      )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Let the browser handle third-party requests directly.
  if (url.origin !== self.location.origin) return;

  // Never cache or proxy API traffic (auth, notifications, orders, ...).
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clone))
              .catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match("/");
          return fallback || Response.error();
        })
    );
    return;
  }

  // Only cache immutable, content-hashed build assets and static media.
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    STATIC_ASSET_PATTERN.test(url.pathname);

  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clone))
              .catch(() => {});
          }
          return response;
        })
    )
  );
});
