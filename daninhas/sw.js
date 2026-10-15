/* Daninhas da Cana — funciona sem internet, inclusive dados técnicos e fotos */
const CACHE="daninhas-v5";
const FILES=["./","index.html","app.js","dados.js","fazendas.js","manifest.webmanifest","icone2-192.png","icone2-512.png","icone2-maskable-512.png","icone2-apple.png"];
const FOTOS=["https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Ipomoea_purpurea_2400px.jpg/960px-Ipomoea_purpurea_2400px.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Ipomoea_nil_leaf.JPG/960px-Ipomoea_nil_leaf.JPG", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Amaranthus_viridis_25042014_1.jpg/960px-Amaranthus_viridis_25042014_1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Amaranthus_viridis_W3_IMG_3850.jpg/960px-Amaranthus_viridis_W3_IMG_3850.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Bidens_pilosa_01.jpg/960px-Bidens_pilosa_01.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Bidens_pilosa_-_Anamadinika_fleurs_et_graines.jpg/960px-Bidens_pilosa_-_Anamadinika_fleurs_et_graines.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Euphorbia_heterophylla_%28Painted_Euphorbia%29_in_Hyderabad%2C_AP_W_IMG_9720.jpg/960px-Euphorbia_heterophylla_%28Painted_Euphorbia%29_in_Hyderabad%2C_AP_W_IMG_9720.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/ARS_-_Commelina_benghalensis.jpg/960px-ARS_-_Commelina_benghalensis.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Commelina_benghalensis_W_IMG_1549.jpg/960px-Commelina_benghalensis_W_IMG_1549.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Urochloa_decumbens_plant9_%287429385348%29.jpg/960px-Urochloa_decumbens_plant9_%287429385348%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Starr_050419-0386_Digitaria_insularis.jpg/960px-Starr_050419-0386_Digitaria_insularis.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Digitaria_sanguinalis.jpg/960px-Digitaria_sanguinalis.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Harig_vingergras_plant_%28Digitaria_sanguinalis%29.jpg/960px-Harig_vingergras_plant_%28Digitaria_sanguinalis%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Cyperus_rotundus_by_kadavoor.JPG/960px-Cyperus_rotundus_by_kadavoor.JPG", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Cyperus_rotundus_tuber01.jpg/960px-Cyperus_rotundus_tuber01.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Cynodon_dactylon_01.jpg/960px-Cynodon_dactylon_01.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Bermuda_grass%2C_Cynodon_dactylon_%2816434099448%29.jpg/960px-Bermuda_grass%2C_Cynodon_dactylon_%2816434099448%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Starr-050525-1924-Megathyrsus_maximus-habit-Lua_Makika-Kahoolawe_%2824735828436%29.jpg/960px-Starr-050525-1924-Megathyrsus_maximus-habit-Lua_Makika-Kahoolawe_%2824735828436%29.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Starr-050414-6325-Megathyrsus_maximus-restoration_site-Kanaha_Beach-Maui_%2824449590060%29.jpg/960px-Starr-050414-6325-Megathyrsus_maximus-restoration_site-Kanaha_Beach-Maui_%2824449590060%29.jpg"];
const EXT=["upload.wikimedia.org","commons.wikimedia.org"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(async c=>{
    await c.addAll(FILES);
    await Promise.allSettled(FOTOS.map(u=>fetch(u,{mode:"cors"}).then(r=>{ if(r.ok) return c.put(u,r); })));
  }).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("daninhas-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  const url=new URL(req.url);
  if(EXT.includes(url.hostname)){
    e.respondWith(caches.match(req.url).then(hit=> hit || fetch(req).then(r=>{
      if(r.ok||r.type==="opaque"){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(req.url,cp)); }
      return r; })));
    return;
  }
  if(url.origin!==location.origin) return;
  /* páginas e código: rede primeiro (para receber atualizações), cópia guardada sem sinal */
  if(req.mode==="navigate" || /\.(js|html|webmanifest)$/.test(url.pathname)){
    const key = req.mode==="navigate" ? "index.html" : req;
    e.respondWith(fetch(req).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(key,cp)); } return r; }).catch(()=>caches.match(key)));
    return;
  }
  e.respondWith(caches.match(req).then(hit=> hit || fetch(req).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); } return r; })));
});
