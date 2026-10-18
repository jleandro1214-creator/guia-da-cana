const CACHE="preco-na-mao-v1";
const LOCAIS=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png"];
const CDN=[];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(async c=>{await c.addAll(LOCAIS);for(const u of CDN){try{await c.add(new Request(u,{mode:"cors"}))}catch(_){}}}).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  if(r.mode==="navigate"){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put("./index.html",cp));return res}).catch(()=>caches.match("./index.html",{ignoreSearch:true})));return;
  }
  const externo=u.origin!==location.origin;
  if(externo&&!/jsdelivr\.net|projectnaptha\.com|unpkg\.com/.test(u.hostname))return;
  e.respondWith(caches.match(r,{ignoreSearch:!externo}).then(hit=>hit||fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque")){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})));
});
