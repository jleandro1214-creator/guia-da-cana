const CACHE = "livro-canavial-v1";
const FOTOS = "livro-canavial-fotos-v1";
const FILES = ["./", "index.html", "conteudo.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("livro-canavial-") && k !== CACHE && k !== FOTOS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  const own = u.origin === location.origin;
  const foto = u.hostname === "upload.wikimedia.org" || u.hostname === "commons.wikimedia.org" ||
    (u.hostname.endsWith(".wikipedia.org") && u.pathname.startsWith("/api/rest_v1/page/summary/"));
  if (!own && !foto) return;
  if (own && req.mode === "navigate") {
    e.respondWith(fetch(req, {cache: "no-store"}).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put("./", cp)); return r; })
      .catch(() => caches.match("./").then(r => r || caches.match("index.html"))));
    return;
  }
  if (own) { // rede primeiro para o conteúdo (pega atualizações), cache sem sinal
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req, {ignoreSearch: true})));
    return;
  }
  e.respondWith(caches.open(FOTOS).then(c => c.match(req, {ignoreVary: true}).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") c.put(req, r.clone());
    return r;
  }))));
});
