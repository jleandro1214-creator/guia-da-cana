const CACHE = "cafe-arabica-v2";
const FOTOS = "cafe-arabica-fotos";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("cafe-arabica-") && k !== CACHE && k !== FOTOS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Fotos de referência (Wikipédia / Wikimedia): guarda no aparelho para usar sem internet
  if (url.hostname.endsWith("wikipedia.org") || url.hostname.endsWith("wikimedia.org")) {
    e.respondWith(caches.open(FOTOS).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit || Response.error());
      return hit ? hit : net;
    })).catch(() => caches.match(req)));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(fetch(req, {cache: "no-store"}).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put("./", cp)); return r; })
      .catch(() => caches.match("./").then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
