// =============================================
// 🔄 NG TAREFAS - SERVICE WORKER (VERSÃO REFORÇADA v3)
// =============================================

const CACHE_NAME = 'ng-tarefas-v3';
const API_URL_PATTERN = 'script.google.com';  // evita cachear chamadas à API

// Lista atualizada de recursos essenciais
const urlsToCache = [
  './',
  './index.html',
  './404.html',                     // 🆕 página 404 personalizada
  './pages/login.html',
  './pages/recuperacao.html',
  './pages/participante.html',
  './pages/admin.html',
  './pages/custom.html',
  './pages/podio.html',            // 🆕 página do pódio
  './css/comum.css',
  './css/login.css',
  './css/participante.css',
  './css/admin.css',
  './css/podio.css',               // 🆕 estilos do pódio
  './js/api.js',
  './js/auth.js',
  './js/utils.js',
  './js/participante.js',
  './js/admin.js',
  './js/podio.js',                 // 🆕 script do pódio
  './assets/imagens/logo.png',
  './assets/imagens/icon-192.png',
  './assets/imagens/icon-512.png',
  './manifest.json'
];

// ----- INSTALAÇÃO -----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('🔄 SW: Cache em andamento...');
      return Promise.allSettled(
        urlsToCache.map(url =>
          cache.add(url).catch(err => {
            console.warn(`⚠️ SW: Falha ao cachear ${url}`, err);
          })
        )
      );
    }).then(() => {
      console.log('✅ SW: Cache inicial concluído');
      return self.skipWaiting(); // força ativação imediata
    })
  );
});

// ----- ATIVAÇÃO (limpa caches antigos) -----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('🗑️ SW: Removendo cache antigo:', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      console.log('✅ SW: Ativado e controlando todos os clientes');
      return self.clients.claim();
    })
  );
});

// ----- FETCH (estratégia mista melhorada) -----
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignora requisições que não sejam GET
  if (event.request.method !== 'GET') return;

  // Não cachear chamadas à API do Google Apps Script
  if (url.hostname.includes(API_URL_PATTERN)) {
    return; // deixa o navegador fazer a requisição normalmente
  }

  // Para navegação (HTML), network first com fallback offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Atualiza cache em background
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Se offline, tenta servir do cache; fallback final: index.html
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Para outros recursos (CSS, JS, imagens), cache-first com atualização em background
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Dispara atualização da cache em segundo plano
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {});

      // Retorna resposta cacheada imediatamente, ou aguarda a rede
      return cachedResponse || fetchPromise;
    })
  );
});

// ----- MENSAGENS (para controle externo) -----
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});