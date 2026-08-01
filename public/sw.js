// Service worker — installable PWA + push notifications + app-shell caching.
//
// The app shell (HTML/CSS/JS/icons) is cached so it loads INSTANTLY on repeat
// visits, even while the Render free-tier server is still waking up from
// sleep. Chat data itself (socket.io) always goes to the network.
//
// Strategy: race the network against a short timeout. If the server answers
// quickly (it's warm), use that fresh response — this is what keeps the app
// from showing an old cached version after a deploy. If the server is slow
// (cold start / offline), fall back to the cached copy so the app still
// loads instantly instead of showing a blank/frozen screen. Either way, the
// cache gets updated in the background the moment the network responds.

const CACHE_NAME = "tycept-shell-v2";
const APP_SHELL = [
  "/",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/icon-192.png",
];
const NETWORK_TIMEOUT_MS = 1500;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache socket.io traffic or API calls — those need to be live.
  if (url.pathname.startsWith("/socket.io/") || url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      // Always kick this off — whichever path we take below, we still want
      // the cache to end up holding the freshest response we can get.
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);

      // Prefer a fresh response if the server answers within the timeout
      // (warm server) — this is what fixes stale content after a deploy.
      try {
        const fast = await Promise.race([
          networkFetch,
          new Promise((_, reject) => setTimeout(reject, NETWORK_TIMEOUT_MS)),
        ]);
        if (fast) return fast;
      } catch (_) {
        // Network didn't answer in time (cold start / offline) — fall
        // through to cache below instead of making the user wait.
      }

      if (cached) return cached;
      // No cache and the fast path didn't pan out — wait it out.
      const late = await networkFetch;
      return late || fetch(request);
    })()
  );
});

// --- Push notifications (fires even when the app is closed) ---

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "New message", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "New message in Tycept";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
