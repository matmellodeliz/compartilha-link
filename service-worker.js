const CACHE_NAME = 'link-sharer-cache-v1';
const STATIC_ASSETS = [
    '/', // A raiz do site
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/components/link-form.js',
    '/components/link-item.js',
    '/components/link-list.js',
    '/icons/icon-192.png',
    'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js' // URL externa pro QR
];

// Evento de Instalação: Cacheia os assets estáticos
self.addEventListener('install', event => {
    console.log('[Service Worker] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Cacheando assets estáticos');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Assets estáticos cacheados com sucesso.');
                return self.skipWaiting(); // Força o SW a ativar imediatamente
            })
            .catch(error => {
                console.error('[Service Worker] Falha ao cachear assets estáticos:', error);
            })
    );
});

// Evento de Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
    console.log('[Service Worker] Ativando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Ativado e caches antigos limpos.');
            return self.clients.claim(); // Garante controle imediato da página
        })
    );
});


// Evento Fetch: Estratégia Cache First para assets estáticos
self.addEventListener('fetch', event => {
    // Ignora requisições não-GET
    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);

    // Verifica se a URL da requisição corresponde a um asset estático conhecido
    // Trata o caso da raiz e normaliza caminhos
    const isStaticAssetRequest = STATIC_ASSETS.some(assetUrl => {
        // Normaliza './' para corresponder à raiz do escopo
        if (assetUrl === './') {
            return requestUrl.pathname === self.registration.scope || requestUrl.pathname + '/' === self.registration.scope;
        }
        // Compara URLs completas ou caminhos relativos ao escopo
        const assetPath = new URL(assetUrl, self.location.origin).pathname;
        return requestUrl.pathname === assetPath;
    });

    // Aplica Cache First para assets estáticos
    if (isStaticAssetRequest) {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    // Se encontrado no cache, retorna
                    if (cachedResponse) {
                        // console.log('[Service Worker] Servindo do cache:', event.request.url);
                        return cachedResponse;
                    }
                    // Se não encontrado, busca na rede
                    // console.log('[Service Worker] Buscando da rede (asset estático):', event.request.url);
                    return fetch(event.request).then(networkResponse => {
                        // Opcional: Clonar e adicionar ao cache se não estava lá
                        // const responseToCache = networkResponse.clone();
                        // caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                        return networkResponse;
                    });
                })
                .catch(error => {
                    console.error('[Service Worker] Erro no fetch (cache first):', error);
                    // return caches.match('./offline.html');
                })
        );
    } else {
        // console.log('[Service Worker] Buscando da rede (não-asset):', event.request.url);
        event.respondWith(
            fetch(event.request).catch(error => {
                console.warn('[Service Worker] Falha ao buscar da rede (não-asset):', error);
            })
        );
    }
});
