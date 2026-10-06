/**
 * Service Worker для ORB MASTERS PWA
 * Кэширование статических ресурсов для оффлайн-работы
 */

const CACHE_PREFIX = 'orb-masters-orb-mastera-';
const CACHE_NAME = `${CACHE_PREFIX}v4`;
const APP_SCOPE = self.registration.scope;
const STATIC_ASSETS = [
  '',
  'index.html',
  'manifest.json',
  'styles/main.css',
  'styles/animations.css',
  'src/engine.js',
  'src/main.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'src/core/DifficultyManager.js',
  'src/core/GameConfig.js',
  'src/core/LevelSystem.js',
  'src/core/OnboardingManager.js',
  'src/core/OrbsManager.js',
  'src/core/PlayerProfile.js',
  'src/game/AudioManager.js',
  'src/game/ArcadeMusic.js',
  'src/game/SettingsModal.js',
  'src/game/SoundEffects.js',
  'src/game/bricks_breaker/Ball.js',
  'src/game/bricks_breaker/Block.js',
  'src/game/bricks_breaker/BlockManager.js',
  'src/game/bricks_breaker/Effects.js',
  'src/game/bricks_breaker/Physics.js',
  'src/game/bricks_breaker/Renderer.js',
  'src/game/bricks_breaker/SpecialElements.js',
  'src/game/match3/Match3Game.js',
  'src/i18n/LanguageManager.js',
  'src/i18n/translations.js',
  'src/scenes/level_catch.js',
  'src/scenes/level_knockout_zuma.js',
  'src/scenes/level_match3.js',
  'src/scenes/level_stack.js',
  'src/scenes/menuScene.js',
  'src/ui/DailyChallenges.js',
  'src/ui/GameResultScreen.js',
  'src/ui/LevelSelectScreen.js',
  'src/ui/MainMenu.js',
  'src/ui/Records.js',
  'src/ui/Shop.js',
  'src/ui/Tutorial.js',
].map((path) => new URL(path, APP_SCOPE).href);

// Установка: кэшируем статические ресурсы
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
});

// Активация: удаляем старые кэши
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch: стратегия Network First, затем Cache
self.addEventListener('fetch', (event) => {
  // Пропускаем не-GET запросы
  if (event.request.method !== 'GET') {
    return;
  }

  // Пропускаем внешние запросы
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // This worker only owns requests inside the app's registered scope.
  if (!event.request.url.startsWith(APP_SCOPE)) {
    return;
  }

  event.respondWith(
    // Сначала пробуем сеть
    fetch(event.request)
      .then((response) => {
        // Клонируем ответ для кэширования
        const responseClone = response.clone();

        // Кэшируем успешные ответы
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        // Если сеть недоступна, берём из кэша
        return caches.open(CACHE_NAME).then((cache) => cache.match(event.request)).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Для HTML возвращаем оффлайн-страницу
          if ((event.request.headers.get('accept') || '').includes('text/html')) {
            return caches.open(CACHE_NAME)
              .then((cache) => cache.match(new URL('index.html', APP_SCOPE).href));
          }

          // Иначе возвращаем ошибку
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        });
      })
  );
});

// Обработка push-уведомлений (для будущего использования)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Новое уведомление от ORB MASTERS',
    icon: new URL('icons/icon-192.png', APP_SCOPE).href,
    badge: new URL('icons/icon-192.png', APP_SCOPE).href,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ORB MASTERS', options)
  );
});

// Клик по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Если уже есть открытое окно, фокусируемся на нём
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Иначе открываем новое окно
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('[SW] Service Worker loaded');
