/* Guia da Cana — funcionamento sem internet (cache guia-cana-v7).
   Os apps Daninhas e Calculadora têm seus próprios service workers nas pastas deles. */
const CACHE="guia-cana-v7";
const V="?v=6";
const FILES=["./","index.html","app.js"+V,"base.js"+V,"fichas.js"+V,"daninhas/dados.js"+V,"daninhas/fazendas.js"+V,"manifest.webmanifest","icone-192.png","icone-512.png","icone-maskable-512.png","icone-apple.png"];
const NOMES=FILES.map(f=>f.split("?")[0]);
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("guia-cana-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
/* rede primeiro, sem usar a cópia velha do navegador; sem internet usa a cópia do app */
const rede=(req,chave)=>fetch(req,{cache:"no-cache"}).then(r=>{ if(r.ok){const cp=r.clone(); caches.open(CACHE).then(c=>c.put(chave||req,cp));} return r; });
self.addEventListener("fetch",e=>{const req=e.request; if(req.method!=="GET") return; const u=new URL(req.url); if(u.origin!==location.origin) return;
  const rel=u.pathname.slice(new URL(self.registration.scope).pathname.length);
  if(req.mode==="navigate"){ if(rel.includes("/")) return; /* páginas das outras pastas: cada app cuida da sua */
    e.respondWith(rede(req,"index.html").catch(()=>caches.match("index.html"))); return; }
  if(rel.includes("/") && !NOMES.includes(rel)) return;
  if(/\.(js|html|webmanifest)$/.test(rel)){ e.respondWith(rede(req).catch(()=>caches.match(req).then(h=>h||caches.match(req,{ignoreSearch:true})))); return; }
  e.respondWith(caches.match(req).then(hit=>hit||rede(req)));
});
