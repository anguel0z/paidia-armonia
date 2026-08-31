// PWA worker.
//
// v83 went network-first-on-everything with `cache: 'no-store'` to stop stale
// app bundles. It worked, but it also meant ~1.1 MB re-fetched on EVERY load
// (index.html + app.js alone are ~1 MB) and bypassed the browser's own HTTP
// cache, which is why the app crawled on mobile data.
//
// A `?v=N` URL is immutable by construction: shipping v(N+1) changes the URL,
// so the client cannot get a stale bundle. That makes versioned assets safe to
// cache-first — fresh on release, instant on every load in between. The shell
// and build.json stay network-first so a release is picked up immediately, with
// a cached copy as the offline fallback.
const CACHE = 'paidia-v175';
const ASSETS = ['./manifest.webmanifest'];

// Fresh every time: the shell and the version manifest that drives the banner.
const ALWAYS_FRESH = /(?:^|\/)(?:index\.html|build\.json|sw\.js)(?:\?|$)/i;

function safeAppUrl(url) {
  const raw = String(url || './');
  if (raw.startsWith('./') || (raw.startsWith('/') && !raw.startsWith('//'))) return raw;
  try {
    const parsed = new URL(raw, self.location.origin);
    if (parsed.origin === self.location.origin) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch (_) {
    /* ignore */
  }
  return './';
}

// Anything carrying an explicit ?v= build stamp, plus icons.
function isImmutable(url) {
  if (ALWAYS_FRESH.test(url.pathname + url.search)) return false;
  if (/[?&]v=\d+/.test(url.search)) return true;
  return url.pathname.startsWith('/icons/') || url.pathname.startsWith('/kids-games/');
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      // Drop only OTHER builds; wiping every cache on activate meant even
      // icons were re-fetched after each release.
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function fetchDeadline(request, ms, init) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('sw-timeout')), ms);
    fetch(request, init).then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache the API — hard timeout so hung backends cannot spin the UI forever.
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetchDeadline(e.request, 10000, { cache: 'no-store' }).catch(() =>
        new Response(JSON.stringify({ error: 'Gateway Timeout', code: 'timeout' }), {
          status: 504,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Immutable, version-stamped assets: serve from cache, fill on first miss.
  // Always .catch — a hung caches.match / network must never stall <script> tags.
  if (isImmutable(url)) {
    e.respondWith(
      caches.match(e.request).then((hit) => {
        if (hit) return hit;
        return fetchDeadline(e.request, 8000).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          }
          return res;
        });
      }).catch(() =>
        fetchDeadline(e.request, 8000).catch(() => Response.error())
      )
    );
    return;
  }

  // Shell and build.json: network-first with timeout → cached offline fallback.
  e.respondWith(
    fetchDeadline(e.request, 4000)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || Response.error()))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action || '';
  let target = safeAppUrl((event.notification.data && event.notification.data.url) || './');
  if (action === 'there' || action === 'late' || action === 'open' ||
     (event.notification.data && event.notification.data.open === 'presence')) {
    target = './?tab=home&presence=1';
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.focus();
          try { client.postMessage({ type: 'presence-open', action }); } catch (_) {}
          if (client.navigate) {
            try { client.navigate(target); } catch (_) {}
          }
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Armonia Thassos', body: '', url: './' };
  try {
    if (event.data) data = Object.assign(data, event.data.json());
  } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Armonia Thassos', {
      body: data.body || '',
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      data: { url: safeAppUrl(data.url || './') },
    })
  );
});
