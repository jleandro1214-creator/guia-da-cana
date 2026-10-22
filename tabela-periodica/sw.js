const CACHE = "tabela-campo-v4-s1";
const FILES = ["./", "index.html", "dados.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
importScripts("dados.js");
async function guardarFotos(){
  const c = await caches.open(CACHE);
  for (const id of Object.keys(FOTOS)) { try { await c.add(fotoUrl(id)); } catch (e) {} }
}
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("message", e => { if (e.data === "fotos") e.waitUntil(guardarFotos()); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("tabela-campo-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()).then(() => guardarFotos())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req, {cache: "no-store"}).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put("./", cp)); return r; })
      .catch(() => caches.match("./").then(r => r || caches.match("index.html"))));
    return;
  }
  const local = new URL(req.url).origin === location.origin;
  if (local && req.url.endsWith("dados.js")) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  })));
});
