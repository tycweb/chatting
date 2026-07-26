// Minimal service worker — just enough to make this a valid, installable PWA.
// It doesn't need to cache anything for a live chat app (you always want
// fresh content), so it simply passes requests straight through.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
