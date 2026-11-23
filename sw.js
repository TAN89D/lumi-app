// Service worker : usage hors ligne. Stratégie « cache d'abord, mise à jour en arrière-plan » :
// l'application s'ouvre tout de suite depuis le cache et récupère la nouvelle version pour la prochaine ouverture.
const CACHE = 'lumi-v3-0'; // à incrémenter pour forcer un nettoyage complet du cache
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'css/lumi2.css',
  'js/content.js', 'js/i18n.js', 'js/store.js', 'js/rules.js', 'js/skills.js', 'js/art.js', 'js/draw.js', 'js/audio.js', 'js/minigames.js', 'js/games.js', 'js/main.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.open(CACHE).then(cache => cache.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r && r.ok) cache.put(e.request, r.clone()); return r; }).catch(() => hit || cache.match('index.html'));
    return hit || net;
  })));
});
