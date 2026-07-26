// Service worker — installable PWA + push notifications + app-shell caching.
//
// The app shell (HTML/CSS/JS/icons) is cached so it loads INSTANTLY on repeat
// visits, even while the Render free-tier server is still waking up from
// sleep. That means the branded loading screen shows right away instead of
// a blank white page. Chat data itself (socket.io) always goes to the network.

const CACHE_NAME = "tycept-shell-v1";
const APP_SHELL = [
  "/",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/icon-192.png",
];

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

  // App shell: cache-first, so it renders instantly even if the server
  // is still waking up. Falls back to network if not cached yet, and
  // updates the cache in the background when it does hit the network.
  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached); // offline / server asleep: fall back to cache

        return cached || networkFetch;
      })
    );
  }
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
