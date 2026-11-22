/*
 * Service worker de GenLogs (PWA).
 * Guarda SOLO archivos públicos de la app, nunca datos:
 *   - /assets/* (JS y CSS con hash en el nombre: no cambian) → primero caché.
 *   - íconos, manifiesto y logo → caché y se actualizan en segundo plano.
 *   - páginas (navegación) → siempre la red; sin conexión, /offline.html.
 * No toca: el API (otro dominio), Cloudinary, cualquier otro dominio, peticiones con
 * Authorization ni nada que no sea GET. Al cerrar sesión no queda ningún dato en caché.
 */
const VERSION = 'v1';
const CACHE_APP = `genlogs-app-${VERSION}`;
const CACHE_ASSETS = `genlogs-assets-${VERSION}`;
const MAX_ASSETS = 80;
const PRECACHE = ['/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_APP).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(nombres
        .filter((n) => n.startsWith('genlogs-') && n !== CACHE_APP && n !== CACHE_ASSETS)
        .map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

async function recortar(cache) {
  const claves = await cache.keys();
  for (let i = 0; i < claves.length - MAX_ASSETS; i++) await cache.delete(claves[i]);
}

async function primeroCache(request) {
  const cache = await caches.open(CACHE_ASSETS);
  const guardada = await cache.match(request);
  if (guardada) return guardada;
  const respuesta = await fetch(request);
  if (respuesta.ok && respuesta.type === 'basic') {
    await cache.put(request, respuesta.clone());
    recortar(cache);
  }
  return respuesta;
}

async function cacheYActualiza(request) {
  const cache = await caches.open(CACHE_APP);
  const guardada = await cache.match(request);
  const red = fetch(request).then((r) => {
    if (r.ok && r.type === 'basic') cache.put(request, r.clone());
    return r;
  }).catch(() => guardada);
  return guardada || red;
}

async function paginaConRespaldo(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_APP);
    return (await cache.match('/offline.html')) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('Authorization')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // API, Cloudinary y otros dominios: sin caché
  if (request.mode === 'navigate') {
    event.respondWith(paginaConRespaldo(request));
    return;
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(primeroCache(request));
    return;
  }
  if (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest' || url.pathname === '/LOGO.png') {
    event.respondWith(cacheYActualiza(request));
  }
});
