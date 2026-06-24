/* Top Shelf service worker — makes the game installable and fully offline.
   App shell is cached on install; Google Fonts are runtime-cached on first
   online load. Bump CACHE to ship an update. */
const CACHE = "topshelf-v30";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./favicon.ico",
  "./favicon-16.png",
  "./favicon-32.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const url = new URL(req.url);
      const cacheable = res.ok &&
        (url.origin === location.origin ||
         url.host.indexOf("gstatic") >= 0 || url.host.indexOf("googleapis") >= 0);
      if (cacheable) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match("./index.html") || caches.match("./")))
  );
});
