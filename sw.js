// =============================================
// 🔄 NG TRAFEGO - SERVICE WORKER
// =============================================

const CACHE_NAME = 'ng-tarefas-v2';
const urlsToCache = [
  '/NG_Trafego/',
  '/NG_Trafego/index.html',
  '/NG_Trafego/pages/login.html',
  '/NG_Trafego/pages/recuperacao.html',
  '/NG_Trafego/pages/participante.html',
  '/NG_Trafego/pages/admin.html',
  '/NG_Trafego/pages/podio.html',
  '/NG_Trafego/pages/custom.html',
  '/NG_Trafego/css/comum.css',
  '/NG_Trafego/css/login.css',
  '/NG_Trafego/css/participante.css',
  '/NG_Trafego/css/admin.css',
  '/NG_Trafego/css/podio.css',
  '/NG_Trafego/js/api.js',
  '/NG_Trafego/js/auth.js',
  '/NG_Trafego/js/utils.js',
  '/NG_Trafego/js/participante.js',
  '/NG_Trafego/js/admin.js',
  '/NG_Trafego/js/podio.js',
  '/NG_Trafego/assets/imagens/logo.png',
  '/NG_Trafego/assets/imagens/fundo.jpg',
  '/NG_Trafego/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.error('❌ Erro ao fazer cache:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      return fetch(event.request).then(fetchResponse => {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return fetchResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/NG_Trafego/index.html');
        }
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});