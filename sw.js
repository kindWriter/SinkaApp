const CACHE_NAME = 'shinka-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Обработка запросов (Cache First, Network Fallback)
self.addEventListener('fetch', (event) => {
  // Пропускаем API запросы Supabase (они должны идти в сеть)
  if (event.request.url.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Если нет интернета, возвращаем пустой ответ
          return new Response(JSON.stringify({ offline: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Для остального контента - Cache First
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // Не кэшируем нештатные ответы
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
      .catch(() => {
        // Возвращаем оффлайн страницу если есть
        return caches.match('/index.html');
      })
  );
});

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  const cache = await caches.open(CACHE_NAME);
  const syncQueue = localStorage.getItem('syncQueue');
  
  if (syncQueue) {
    try {
      // Здесь должна быть логика отправки на сервер
      console.log('Синхронизирую очередь запросов:', syncQueue);
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
    }
  }
}

// Получение пуш-уведомлений
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Новое уведомление',
    icon: '/icon-192x192.png',
    badge: '/favicon.png',
    tag: 'shinka-notification',
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Шинка', options)
  );
});

// Клик по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});function generateTimeSlots() {
    const container = document.getElementById('timeSlots');
    container.innerHTML = '';
    
    if (!selectedDate) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDateObj = new Date(selectedDate);
    const isToday = selectedDateObj.getTime() === today.getTime();

    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const day = selectedDateObj.getDay(); // 0 = воскресенье

    let start, end;
    if (day === 0) { // Вс
        start = 10; end = 16;
    } else if (day === 6) { // Сб
        start = 10; end = 18;
    } else { // Пн–Пт
        start = 9; end = 20;
    }

    const slots = [];
    for (let h = start; h < end; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
        slots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    // Фильтрация: если сегодня — убрать прошедшие слоты
    const filteredSlots = isToday
        ? slots.filter(slot => {
            const [slotH, slotM] = slot.split(':').map(Number);
            if (slotH < currentHours) return false;
            if (slotH === currentHours && slotM <= currentMinutes) return false;
            return true;
        })
        : slots;

    if (filteredSlots.length === 0 && isToday) {
        container.innerHTML = '<div style="color: var(--neon-yellow); text-align: center; padding: 20px;">Нет доступных слотов на сегодня</div>';
        return;
    }

    filteredSlots.forEach(slot => {
        const btn = document.createElement('div');
        btn.className = 'time-slot';
        btn.textContent = slot;
        btn.onclick = () => {
            document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
            btn.classList.add('selected');
            selectedTime = slot;
        };
        container.appendChild(btn);
    });
}

