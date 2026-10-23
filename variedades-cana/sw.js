const CACHE = "variedades-cana-v4-s1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"].concat(["img/ctc1007-card.jpg", "img/ctc1007.jpg", "img/ctc2994-card.jpg", "img/ctc2994.jpg", "img/ctc9003-card.jpg", "img/ctc9003.jpg", "img/ctc9006-card.jpg", "img/ctc9006.jpg", "img/cv7870-card.jpg", "img/cv7870.jpg", "img/iacsp01-5503-card.jpg", "img/iacsp01-5503.jpg", "img/iacsp95-5094-card.jpg", "img/iacsp95-5094.jpg", "img/rb005014-card.jpg", "img/rb005014.jpg", "img/rb966928-card.jpg", "img/rb966928.jpg", "img/rb975033-card.jpg", "img/rb975033.jpg", "img/rb975242-card.jpg", "img/rb975242.jpg", "img/rb985476-card.jpg", "img/rb985476.jpg"]);
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("variedades-cana-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req, {cache: "no-store"}).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put("./", cp)); return r; })
      .catch(() => caches.match("./").then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  })));
});
