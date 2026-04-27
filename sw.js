// PicFit Service Worker v1.1
// Correção: fallback index.html apenas para navegação (não para imagens/assets)
const CACHE = 'picfit-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Cache-first com fallback inteligente:
// só retorna index.html se for requisição de navegação (não para assets)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith('chrome-extension://')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => {
        // Só faz fallback para index.html em requisições de navegação
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        // Para assets (imagens, etc.), retorna undefined (falha silenciosa)
      });
    })
  );
});
