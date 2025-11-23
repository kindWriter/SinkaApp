const CACHE_NAME = 'shinka-cache-v2';
const RUNTIME_CACHE = 'shinka-runtime-v2';

// Список файлов для кэширования при установке
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.png',
  '/image.jpg',
  '/qrcode.png'
];

// Событие установки Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker установлен');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кэширование файлов...');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Ошибка кэширования:', err))
  );
  self.skipWaiting();
});

// Событие активации Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker активирован');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Событие перехвата запросов (fetch)
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Игнорируем не-GET запросы
  if (request.method !== 'GET') {
    return;
  }

  // Стратегия: сначала кэш, потом сеть (Cache First)
  event.respondWith(
    caches.match(request)
      .then(response => {
        // Если есть в кэше - возвращаем
        if (response) {
          console.log('Загружено из кэша:', request.url);
          return response;
        }

        // Если нет - загружаем из сети
        return fetch(request)
          .then(response => {
            // Если ответ не валиден - возвращаем как есть
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Клонируем ответ для кэширования
            const responseToCache = response.clone();

            // Кэшируем динамично загруженные ресурсы
            caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(request, responseToCache);
              })
              .catch(err => console.error('Ошибка при кэшировании:', err));

            return response;
          })
          .catch(err => {
            console.error('Ошибка загрузки:', request.url, err);
            // Возвращаем кэшированный ответ если есть
            return caches.match(request);
          });
      })
  );
});

// Обработка сообщений от клиента
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
