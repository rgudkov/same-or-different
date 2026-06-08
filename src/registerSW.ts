// Registers the offline-first service worker. Scoped and pathed via Vite's
// BASE_URL so it works under the GitHub Pages subpath, and only in production
// builds — registering a caching worker in dev would serve stale modules and
// fight Vite's HMR.
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;

  const base = import.meta.env.BASE_URL;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      // Registration failures (unsupported, blocked) just mean no offline mode;
      // the app still works online, so there's nothing to surface to the player.
    });
  });
}
