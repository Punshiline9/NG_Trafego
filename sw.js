// =============================================
// 🔄 NG TAREFAS - SERVICE WORKER (VERSÃO REFORÇADA)
// =============================================

const CACHE_NAME = 'ng-tarefas-v2';
const API_URL_PATTERN = 'script.google.com';  // evita cachear chamadas à API

// Lista de recursos essenciais (caminhos relativos à raiz do projeto)
const urlsToCache = [
  './',
  './index.html',
  './pages/login.html',
  './pages/recuperacao.html',
  './pages/participante.html',
  './pages/admin.html',
  './pages/custom.html',
  './css/comum.css',
  './css/login.css',
  './css/participante.css',
  './css/admin.css',
  './js/api.js',
  './js/auth.js',
  './js/utils.js',
  './js/participante.js',
  './js/admin.js',
  './assets/imagens/logo.png',
  './manifest.json'
];

// ----- INSTALAÇÃO -----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Adiciona cada recurso individualmente, ignorando erros
      return Promise.allSettled(
        urlsToCache.map(url =>
          cache.add(url).catch(err => {
            console.warn(`⚠️ SW: Falha ao cachear ${url}`, err);
          })
        )
      );
    }).then(() => {
      console.log('✅ SW: Cache inicial concluído');
      return self.skipWaiting();
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
      console.log('✅ SW: Ativado e controlando clientes');
      return self.clients.claim();
    })
  );
});

// ----- FETCH (estratégia mista) -----
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignora requisições que não sejam GET
  if (event.request.method !== 'GET') return;

  // Não cachear chamadas à API do Google Apps Script
  if (url.hostname.includes(API_URL_PATTERN)) {
    return; // deixa o navegador fazer a requisição normalmente
  }

  // Para navegação (HTML), usa network first com fallback para cache
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
          // Se offline, tenta servir do cache (ou fallback index.html)
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
      // Inicia busca na rede para atualizar cache
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {});

      // Retorna resposta cacheada imediatamente, ou espera pela rede
      return cachedResponse || fetchPromise;
    })
  );
});