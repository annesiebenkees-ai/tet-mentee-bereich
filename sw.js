/* Service Worker für die App-Installation.
   Immer zuerst frisch aus dem Netz laden; nur offline greift der gespeicherte Stand. */
const CACHE = "tet-mentees-v1";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      const kopie = res.clone();
      caches.open(CACHE).then(c => c.put(req, kopie)).catch(() => {});
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
