// Environnement de LUMI : production ou prévisualisation.
// Sur GitHub Pages, TOUS les sites d'un même compte partagent la même origine (tan89d.github.io) : localStorage, IndexedDB et caches
// seraient donc partagés entre la production et une prévisualisation. On sépare les données par CHEMIN :
//  • production (tan89d.github.io/lumi-app/) → clés historiques « lumi.v1 » (aucune progression perdue) ;
//  • toute autre adresse (localhost, /lumi-app-preview/, autre domaine…) → clés préfixées par l'adresse, bandeau « PRÉVISUALISATION ».
window.Env = (function () {
  const PROD_HOSTS = ['tan89d.github.io'], PROD_DIR = '/lumi-app/';
  const dir = location.pathname.replace(/[^/]*$/, '');
  const prod = PROD_HOSTS.indexOf(location.hostname) >= 0 && dir === PROD_DIR;
  const slug = (location.host + dir).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'local';
  // clé de stockage : « lumi.<suffixe> » en production, « lumi.<slug>.<suffixe> » ailleurs
  const k = suffix => 'lumi.' + (prod ? '' : slug + '.') + suffix;
  // une clé nous appartient-elle ? (on n'efface JAMAIS celles d'une autre version ou d'une autre application du domaine)
  const owns = key => (prod ? /^lumi\.(v1(\.(backup|corrupt|tmp|pre-v\d+))?|installNo)$/.test(key) : key.indexOf('lumi.' + slug + '.') === 0);
  return { prod, slug, dir, k, owns, dbName: prod ? 'lumi-voice' : 'lumi-voice-' + slug, label: prod ? '' : 'PRÉVISUALISATION' };
})();
