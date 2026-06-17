const CACHE_NAME = 'ng-tarefas-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/pages/login.html',
  '/pages/recuperacao.html',
  '/pages/participante.html',
  '/pages/admin.html',
  '/pages/podio.html',
  '/pages/custom.html',
  '/css/comum.css',
  '/css/login.css',
  '/css/participante.css',
  '/css/admin.css',
  '/css/podio.css',
  '/js/api.js',
  '/js/auth.js',
  '/js/utils.js',
  '/js/participante.js',
  '/js/admin.js',
  '/js/podio.js',
  '/assets/imagens/logo.png',
  '/assets/imagens/fundo.jpg',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});