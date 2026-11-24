// Service worker de LUMI : usage hors ligne. Stratégie « cache d'abord, mise à jour en arrière-plan ».
// Sur GitHub Pages, toutes les applications d'un compte partagent la même origine ET les mêmes caches : le nom du cache contient donc
// l'adresse (scope) de LUMI, et on ne supprime JAMAIS un cache qui n'est pas à nous.
const VERSION = '4-0-0-lot5';   // à incrémenter à chaque livraison : l'ancien cache de LUMI est alors supprimé proprement
const SCOPE = self.registration.scope;
const PREFIX = 'lumi-app::' + SCOPE + '::';
const CACHE = PREFIX + VERSION;
const LEGACY = /^lumi-v[\d-]+$/;   // anciens noms de caches de LUMI (v17, v24, v3-0…), jamais ceux d'autres applications
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'css/lumi2.css', 'css/design.css', 'assets/img/hero-941.jpg', 'assets/img/hero-640.jpg', 'assets/img/avatar-boy.jpg', 'assets/img/avatar-girl.jpg', 'assets/img/leaves.svg', 'assets/img/logo-lumi-480.webp', 'assets/img/logo-lumi-720.webp', 'assets/img/guide-boy.jpg', 'assets/img/lion-cheer.jpg',
  'js/env.js', 'js/content.js', 'js/stories.en.js', 'js/i18n.js', 'js/store.js', 'js/rules.js', 'js/skills.js', 'js/art.js', 'js/draw.js', 'js/audio.js', 'js/minigames.js', 'js/games.js', 'js/sprite.js', 'js/decor.js', 'js/mascot.js', 'js/story-quiz.js', 'js/home.js', 'js/main.js'];

self.addEventListener('install', e => {
  // 'reload' : on récupère la version fraîche du réseau (pas une copie périmée du cache HTTP) ; tout ou rien : si un fichier manque, l'installation échoue et l'ancien cache continue de servir
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => (k.indexOf(PREFIX) === 0 && k !== CACHE) || LEGACY.test(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.url.indexOf(SCOPE) !== 0) return;   // hors de LUMI (autres applications du domaine, autres sites) : on ne touche à rien
  e.respondWith(caches.open(CACHE).then(cache => cache.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(r => { if (r && r.ok && r.type === 'basic') cache.put(req, r.clone()); return r; })
      .catch(() => hit || (req.mode === 'navigate' ? cache.match('index.html') : Response.error()));
    return hit || net;
  })));
});
