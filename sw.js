/* Guia da Cana — funcionamento sem internet (cache guia-cana-v4).
   Os apps Daninhas e Calculadora têm seus próprios service workers nas pastas deles. */
const CACHE="guia-cana-v4";
const FILES=["./","index.html","app.js","base.js","fichas.js","daninhas/dados.js","daninhas/fazendas.js","manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("guia-cana-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const req=e.request; if(req.method!=="GET") return; const u=new URL(req.url); if(u.origin!==location.origin) return;
  const rel=u.pathname.slice(new URL(self.registration.scope).pathname.length);
  if(req.mode==="navigate"){ if(rel.includes("/")) return; /* páginas das outras pastas: cada app cuida da sua */
    e.respondWith(fetch(req).then(r=>{ if(r.ok){const cp=r.clone(); caches.open(CACHE).then(c=>c.put("index.html",cp));} return r; }).catch(()=>caches.match("index.html"))); return; }
  if(rel.includes("/") && !FILES.includes(rel)) return;
  if(/\.(js|html|webmanifest)$/.test(rel)){ /* rede primeiro: pega atualização; sem internet usa a cópia */
    e.respondWith(fetch(req).then(r=>{ if(r.ok){const cp=r.clone(); caches.open(CACHE).then(c=>c.put(req,cp));} return r; }).catch(()=>caches.match(req,{ignoreSearch:true}))); return; }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{ if(r.ok){const cp=r.clone(); caches.open(CACHE).then(c=>c.put(req,cp));} return r; })));
});
