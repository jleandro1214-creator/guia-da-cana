const CACHE = 'corpo-v7';
const IMGS = 'corpo-img-v1';
const FILES = ['./', './index.html', './art.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'].concat(["./img/antebraco.jpg", "./img/baco.jpg", "./img/bexiga.jpg", "./img/biceps.jpg", "./img/cerebro.jpg", "./img/clavicula.jpg", "./img/coracao.jpg", "./img/deltoide.jpg", "./img/estomago.jpg", "./img/femur.jpg", "./img/figado.jpg", "./img/intestinos.jpg", "./img/maospes.jpg", "./img/pancreas.jpg", "./img/peitoral.jpg", "./img/pele.jpg", "./img/pelve.jpg", "./img/pulmoes.jpg", "./img/rins.jpg", "./img/tibia.jpg", "./img/umero.jpg"]);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('corpo-') && k !== CACHE && k !== IMGS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Imagens do Wikimedia: guarda no aparelho depois da primeira vez
  if (url.hostname.endsWith('wikimedia.org')) {
    e.respondWith(
      caches.open(IMGS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
        return res;
      })))
    );
    return;
  }
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }))
  );
});
