const CACHE = "laboratorio-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
const EXTRA = ["../aplicador/icon-192.png","../banco-posts/icon-192.png","../biblioteca/icon-192.png","../bichos/icon-192.png","../bom-dia/icon-192.png","../bora-treinar/icon-192.png","../caderno/icon-192.png","../calculadora/icone2-192.png","../cartao-do-dia/icon-192.png","../casa-em-ordem/icon-192.png","../chave-certa/icon-192.png","../corpo-em-foco/icon-192.png","../curriculo/icon-192.png","../daninhas/icone2-192.png","../dia-leve/icon-192.png","../epi/icon-192.png","../estudo-agro/icon-192.png","../evolucao/icon-192.png","../fazendas/icon-192.png","../grana-em-dia/icon-192.png","../icone2-192.png","../livro-canavial/icon-192.png","../logistica-vinhaca/icon-192.png","../metas-localizada/icon-192.png","../norte-gestor/icon-192.png","../nutri-cana/icon-192.png","../palitirinhas/icon-192.png","../podcasts/icon-192.png","../precos/icon-192.png","../proverbios/icon-192.png","../role-dividido/icon-192.png","../rotulo/icon-192.png","../simulador-gs3/icon-192.png","../tabela-periodica/icon-192.png","../variedades-cana/icon-192.png","../vinhaca-produtiva/icon-192.png","../viva-lembrado/icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES).then(() => Promise.all(EXTRA.map(u => c.add(u).catch(() => {})))))  .then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("laboratorio-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    if (!new URL(req.url).pathname.includes("/laboratorio/")) return;
    e.respondWith(fetch(req, {cache: "no-store"}).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put("./", cp)); return r; }).catch(() => caches.match("./")));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok && new URL(req.url).origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })));
});
