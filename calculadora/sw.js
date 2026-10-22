/* Calculadora da Cana — funciona sem internet */
const CACHE="calculadora-v5-s1";
const FILES=["./","index.html","app.js","calcs.js","referencias.js","fazendas.js","manifest.webmanifest","icone2-192.png","icone2-512.png","icone2-maskable-512.png","icone2-apple.png"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("calculadora-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  /* página e código: rede primeiro (recebe atualizações), cópia guardada sem sinal */
  if(req.mode==="navigate" || /\.(js|html|webmanifest)$/.test(url.pathname)){
    const key=req.mode==="navigate"?"index.html":req;
    e.respondWith(fetch(req).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(key,cp)); } return r; }).catch(()=>caches.match(key)));
    return;
  }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req)));
});
