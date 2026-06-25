/**
 * sw.js — Service Worker Rajasa Presensi
 * Branch: feature/prd-3-pwa
 *
 * Strategi:
 *   - API calls (/api/*): Network-first, fallback JSON offline
 *   - Static assets (.js, .css, images): Cache-first, update in background
 *   - Navigasi (HTML): Network-first, fallback ke /offline.html
 */

const CACHE_NAME    = 'rajasa-presensi-v1';
const OFFLINE_URL   = '/offline.html';

// ── Asset yang di-precache saat install ─────────────────────────────────────
const PRECACHE_URLS = [
  '/',
  OFFLINE_URL,
  '/images/logo/Rajasa-Logo.png',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())   // aktif langsung tanpa tunggu tab lama ditutup
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)   // hapus cache versi lama
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())         // ambil alih semua tab sekarang
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Lewati metode non-GET (POST, PATCH, DELETE, dll.)
  if (request.method !== 'GET') return;

  // Lewati chrome-extension dan non-http
  if (!url.protocol.startsWith('http')) return;

  // ── API calls: Network-first ────────────────────────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => new Response(
          JSON.stringify({
            success: false,
            message: 'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.',
            offline: true,
          }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
              'X-Offline': 'true',
            },
          }
        ))
    );
    return;
  }

  // ── Static assets: Cache-first + update in background ──────────────────────
  const isStaticAsset = (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.js')  ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
          const fetchPromise = fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
          return cached || fetchPromise;   // sajikan cache dulu jika ada
        })
      )
    );
    return;
  }

  // ── Navigasi HTML: Network-first, offline fallback ──────────────────────────
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // ── Default: Network-first ──────────────────────────────────────────────────
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
