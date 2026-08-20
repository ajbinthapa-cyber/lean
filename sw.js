/* Lean — offline shell.
   Everything the app needs to run is cached on first visit, so it works
   with no signal. Only the AI/food-lookup calls need the internet. */
const V = 'lean-v1';
const ASSETS = [
  './', './index.html', './app.css', './manifest.webmanifest',
  './js/foods.js', './js/store.js', './js/ai.js', './js/coach.js', './js/workouts.js', './js/ui.js',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;      // never touch API traffic

  e.respondWith(
    caches.match(e.request).then(hit => {
      // Serve instantly from cache, then quietly refresh it for next launch.
      const net = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(V).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
