// Offline-first service worker for "Same or Different". Hand-written (no build step) so it
// stays a plain static asset served under the GitHub Pages subpath. All paths are
// relative to this script's location, so the same file works at "/" in dev and
// "/mini-games/" in production.
//
// Strategy:
//   - App shell (index.html, manifest, icon) is precached on install so the very
//     first offline navigation works.
//   - Navigations are network-first: a fresh deploy's HTML (which references new
//     content-hashed asset URLs) is fetched when online, with the cached shell as
//     the offline fallback.
//   - Other same-origin GETs (the hashed JS/CSS, icons) are cache-first and
//     populate the cache on first fetch, so the app runs fully offline after one
//     load. Because asset filenames are content-hashed, a new build requests new
//     URLs and never serves stale code.
//
// Bump CACHE_VERSION to force old caches to be dropped on the next activation.
const CACHE_VERSION = "v1";
const CACHE_NAME = `same-or-different-${CACHE_VERSION}`;

const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL))
      // Activate this worker immediately rather than waiting for old tabs to close.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for page navigations so new deploys are picked up online.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() =>
          caches.match("./index.html").then((cached) => cached || caches.match("./")),
        ),
    );
    return;
  }

  // Cache-first for everything else, populating the cache on first fetch.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache successful, same-origin (basic) responses.
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
