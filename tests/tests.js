// Tests automatisés de LUMI V3.1. Ouvrir tests/index.html dans un navigateur (ou via Playwright : voir tests/e2e).
// Les tests de stockage utilisent un faux localStorage : ils ne touchent jamais aux vraies données. Les tests IndexedDB utilisent la base
// de l'environnement courant (nom propre à l'adresse de la page de test, jamais celle de la production : voir js/env.js).
(function () {
  const results = [];
  let current = '';
  const group = n => { current = n; window.__lumiGroup = n + ' @' + Math.round(performance.now() / 1000) + ' s'; };
  const ok = (cond, name, detail) => results.push({ group: current, name, pass: !!cond, detail: cond ? '' : String(detail || '') });
  const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), name, 'obtenu ' + JSON.stringify(a) + ' attendu ' + JSON.stringify(b));
  const has = (fn, name) => { try { fn(); ok(true, name); } catch (e) { ok(false, name, e && e.message); } };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const mkFake = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, key: i => Object.keys(m)[i], get length() { return Object.keys(m).length; }, _m: m }; };
  // Environnement « production » factice : clés historiques lumi.v1…
  const prodEnv = { k: s => 'lumi.' + s, owns: key => /^lumi\.(v1(\.(backup|corrupt|tmp|pre-v\d+))?|installNo)$/.test(key) };

  // Copie isolée de store.js avec un faux localStorage. opts : full (toute écriture échoue), failSet(clé) → échec ciblé, failRemove(clé).
  async function freshStore(initial, opts) {
    opts = opts || {};
    const src = await (await fetch('../js/store.js', { cache: 'no-store' })).text();
    const fake = mkFake(); Object.keys(initial || {}).forEach(k => fake.setItem(k, initial[k]));
    const baseSet = fake.setItem, baseRem = fake.removeItem;
    fake.setItem = (k, v) => { if (opts.full || (opts.failSet && opts.failSet(k, v))) throw new DOMException('quota', 'QuotaExceededError'); baseSet(k, v); };
    fake.removeItem = k => { if (opts.failRemove && opts.failRemove(k)) throw new DOMException('verrou', 'SecurityError'); baseRem(k); };
    const f = new Function('localStorage', 'window', 'Env', src + ';return window.Store;');
    const S = f(fake, {}, opts.env || prodEnv); return { S, fake, opts };
  }
  const v1 = () => JSON.stringify({ v: 1, active: 'p1', profiles: { p1: { id: 'p1', name: 'Awa', avatar: 'awa', created: 1, progress: { 'g:letters:listen': { stars: 3, plays: 4, errors: 1, hints: 0, last: 3, updated: '2026-01-01' }, 'L-A': { stars: 2, plays: 1, errors: 0, hints: 0, last: 2, updated: '2025-12-01' } }, rewards: [{ id: 'draw:lion', type: 'draw', item: 'lion', date: '2026-01-01' }], playTime: { '2026-01-01': 300 }, storiesRead: ['mangue'] } }, settings: { lang: 'fr', voice: true, sfx: true, volume: 0.5, limitMin: 15 } });
  const v2 = () => JSON.stringify({ v: 2, active: 'p2', profiles: { p2: { id: 'p2', name: 'Moussa', avatar: 'moussa', age: 5, created: 2, progress: { 'g:numbers:count': { stars: 2, plays: 3, errors: 2, hints: 1, last: 2, updated: '2026-03-03' } }, rewards: [], playTime: { '2026-03-03': 120 }, storiesRead: [], skills: { 'numbers.count': { score: 0.82, plays: 3 } }, recre: 2 } }, settings: { lang: 'en', voice: true, sfx: false, volume: 0.7, breakMin: 10, lockMin: 30, textScale: 1.25 } });

  async function run() {
    // ============ 1. Stockage : migrations ============
    group('Stockage — migration V1 → V3 et V2 → V3');
    let { S, fake } = await freshStore({ 'lumi.v1': v1() });
    let p = S.profile();
    ok(S.data().v === 3, 'une sauvegarde V1 passe au schéma 3');
    ok(p.progress['g:letters:listen'].stars === 3 && p.progress['L-A'].stars === 2, 'V1 : progression intacte');
    ok(p.rewards.length === 1 && p.storiesRead[0] === 'mangue' && p.playTime['2026-01-01'] === 300, 'V1 : récompenses, histoires, temps de jeu conservés');
    ok(S.s().breakMin === 15 && S.s().limitMin === undefined, 'V1 : l’ancienne limite devient un rappel de pause');
    ok(fake.getItem('lumi.v1.pre-v1') !== null && JSON.parse(fake.getItem('lumi.v1.pre-v1')).profiles.p1.progress['L-A'].stars === 2, 'V1 : copie de sécurité avant migration');
    ({ S, fake } = await freshStore({ 'lumi.v1': v2() }));
    p = S.profile();
    ok(S.data().v === 3 && p.name === 'Moussa' && p.age === 5, 'une sauvegarde V2 passe au schéma 3');
    ok(p.skills['numbers.count'].score === 0.82 && p.skills['numbers.count'].plays === 3, 'V2 : score et parties des compétences conservés');
    ok(Array.isArray(p.skills['numbers.count'].h) && p.skills['numbers.count'].d === 0, 'V2 : historique ajouté sans rien supprimer');
    ok(S.s().lockMin === 30 && S.s().textScale === 1.25 && S.s().lang === 'en', 'V2 : réglages conservés');
    ok(fake.getItem('lumi.v1.pre-v2') !== null, 'V2 : copie de sécurité avant migration');

    group('Stockage — données illisibles et échecs d’écriture');
    ({ S, fake } = await freshStore({ 'lumi.v1': '{pas du json' }));
    ok(S.status.level === 'corrupt' && fake.getItem('lumi.v1.corrupt') === '{pas du json', 'données corrompues détectées et copiées');
    ok(S.ensureProfile() && S.profiles().length === 1, 'LUMI redémarre avec un profil neuf');
    ({ S } = await freshStore({ 'lumi.v1': JSON.stringify({ v: 99, profiles: {} }) }));
    ok(S.status.level === 'corrupt', 'une version future est refusée (aucun écrasement silencieux)');
    ({ S } = await freshStore({}, { full: true }));
    S.ensureProfile(); ok(S.save() === false && S.status.level === 'fail', 'localStorage plein : échec d’écriture signalé');
    ({ S } = await freshStore({}, { failSet: () => true, full: false }));
    const seen = []; S.onStatus(st => seen.push(st.level)); S.ensureProfile(); S.record('g:a:b', 2, 0, 0);
    ok(seen.indexOf('fail') >= 0, 'les écouteurs d’état reçoivent « fail » (bandeau affiché à l’écran)');
    const ssName = 'lumi.v1';
    ok(typeof S.record('g:x:y', 3, 0, 0).first === 'boolean', 'l’enregistrement d’une partie ne plante pas quand le stockage échoue');

    group('Dates — fuseau horaire local');
    ({ S } = await freshStore({}));
    eq(S.localDay(new Date(2026, 0, 5, 23, 30)), '2026-01-05', 'à 23h30 locale, c’est encore le 5');
    eq(S.localDay(new Date(2026, 0, 6, 0, 10)), '2026-01-06', 'à 00h10 locale, on est le 6');

    // ============ 2. Import ============
    group('Import — validation et sécurité');
    ({ S } = await freshStore({})); S.ensureProfile();
    ok(!S.validate('').ok && !S.validate('pas du json').ok && !S.validate('{"a":1}').ok, 'vide, non JSON, non LUMI : refusés');
    ok(!S.validate(JSON.stringify({ v: 9, profiles: { a: {} } })).ok && !S.validate('x'.repeat(S.MAX_IMPORT + 1)).ok && !S.validate(JSON.stringify({ profiles: {} })).ok, 'version inconnue, trop gros, sans profil : refusés');
    const evil = '{"v":2,"profiles":{"p9":{"id":"p9","name":"<img src=x onerror=alert(1)>","avatar":"zzz","age":99,"progress":{"__proto__":{"stars":3},"g:ok:1":{"stars":9,"plays":-5}},"rewards":[{"type":1}]}},"settings":{"volume":7,"evil":true,"lang":"xx"}}';
    const rv = S.validate(evil);
    ok(rv.ok && rv.data.profiles.p9.avatar === 'awa' && rv.data.profiles.p9.age === 4, 'fichier piégé nettoyé : avatar et âge ramenés à des valeurs sûres');
    ok(rv.data.profiles.p9.progress['g:ok:1'].stars === 3 && rv.data.profiles.p9.progress['g:ok:1'].plays === 0 && !Object.prototype.hasOwnProperty.call(rv.data.profiles.p9.progress, '__proto__'), 'étoiles bornées, « __proto__ » ignoré');
    ok(rv.data.settings.evil === undefined && rv.data.settings.volume === 1 && rv.data.settings.lang === undefined, 'réglages inconnus ou hors bornes écartés');

    group('Import — sauvegardes V1 et V2, fusion sans perte');
    ({ S, fake } = await freshStore({ 'lumi.v1': v2() }));
    let r = S.importData(v1(), 'merge');
    ok(r.ok && r.from === 1, 'une sauvegarde V1 s’importe (fusion)');
    ok(S.data().profiles.p1.progress['L-A'].stars === 2 && S.data().profiles.p2.progress['g:numbers:count'].stars === 2, 'V1 fusionnée : rien n’est perdu des deux côtés');
    ok(S.data().profiles.p1.progress['g:letters:listen'].stars === 3 && S.s().lang === 'en', 'V1 fusionnée : étoiles gardées, réglages actuels conservés');
    ok(S.data().v === 3 && JSON.parse(fake.getItem('lumi.v1')).v === 3, 'les données écrites sont au schéma 3');
    ({ S } = await freshStore({ 'lumi.v1': v1() }));
    r = S.importData(v2(), 'merge');
    ok(r.ok && r.from === 2 && S.data().profiles.p2.skills['numbers.count'].plays === 3, 'une sauvegarde V2 s’importe (compétences et historique gardés)');
    const incoming = JSON.stringify({ v: 2, profiles: { p1: { id: 'p1', name: 'Awa', progress: { 'g:letters:listen': { stars: 1, plays: 9, errors: 0, hints: 0, last: 1, updated: '2026-02-01' }, 'g:numbers:count': { stars: 3, plays: 1, errors: 0, hints: 0, last: 3, updated: '2026-02-01' } }, rewards: [{ type: 'draw', item: 'mango', date: '2026-02-01' }], playTime: { '2026-01-01': 100 }, storiesRead: ['baobab'], skills: { 'letters.recognize': { score: 0.9, plays: 8 } } } }, settings: {} });
    ({ S } = await freshStore({ 'lumi.v1': JSON.stringify(Object.assign(JSON.parse(v1()), { v: 3 })) }));
    S.data().profiles.p1.skills = { 'letters.recognize': { score: 0.5, plays: 2, h: [2, 2], d: 1, last: '2026-01-01' } };
    r = S.importData(incoming, 'merge');
    ok(r.ok && S.data().profiles.p1.progress['g:letters:listen'].stars === 3 && S.data().profiles.p1.playTime['2026-01-01'] === 300, 'fusion : meilleure étoile et temps maximal gardés');
    ok(S.data().profiles.p1.skills['letters.recognize'].plays === 8, 'fusion : l’historique de compétences le plus riche est gardé (jamais remis à zéro)');
    ({ S } = await freshStore({ 'lumi.v1': v1() }));
    r = S.importData(v2(), 'replace');
    ok(r.ok && Object.keys(S.data().profiles).length === 1 && S.data().profiles.p2 && !S.data().profiles.p1, 'le mode « remplacer » remplace');

    group('Import — atomicité : l’ancien état survit à un échec');
    let before;
    ({ S, fake } = await freshStore({ 'lumi.v1': v1() })); before = fake.getItem('lumi.v1');
    S.save(); before = fake.getItem('lumi.v1');
    fake.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); };   // le stockage devient plein
    r = S.importData(v2(), 'merge');
    ok(!r.ok && r.kept === true, 'stockage plein : import refusé avec « données conservées »');
    ok(fake.getItem('lumi.v1') === before && S.data().profiles.p1 && !S.data().profiles.p2, 'stockage plein : ni le stockage ni la mémoire n’ont changé');
    ok(S.status.level === 'fail', 'stockage plein : l’état d’erreur est signalé');
    ({ S, fake } = await freshStore({ 'lumi.v1': v1() }, { failSet: k => k === 'lumi.v1' && false }));
    S.save(); before = fake.getItem('lumi.v1');
    const baseSet2 = fake.setItem; let n = 0; fake.setItem = (k, v) => { if (k === 'lumi.v1') { n++; if (n >= 1) throw new DOMException('quota', 'QuotaExceededError'); } baseSet2(k, v); };   // l'écriture d'essai passe, l'écriture finale échoue
    r = S.importData(v2(), 'merge');
    ok(!r.ok && fake.getItem('lumi.v1') === before && !S.data().profiles.p2, 'échec à l’écriture finale : état précédent restauré');
    ok(fake.getItem('lumi.v1.tmp') === null, 'l’écriture d’essai ne laisse aucune trace');
    ({ S, fake } = await freshStore({ 'lumi.v1': v1() })); before = fake.getItem('lumi.v1');
    r = S.importData('{"v":2,"profiles":"non"}', 'merge');
    ok(!r.ok && fake.getItem('lumi.v1') === before, 'un fichier invalide ne modifie rien');
    group('Export');
    ({ S } = await freshStore({ 'lumi.v1': v1() }));
    ok(S.validate(S.exportJSON()).ok, 'un export se réimporte tel quel');

    // ============ 3. Effacement global ============
    group('Effacement global — contrôlé, partiel, relançable');
    ({ S, fake } = await freshStore({ 'lumi.v1': v1(), 'lumi.v1.backup': '{}', 'lumi.v1.pre-v1': '{}', 'lumi.installNo': '1', autre: 'garder', 'lumi.preview-x.v1': 'autre-version' }));
    let wipedCalled = false; S.addWiper(async () => { wipedCalled = true; return { ok: true, name: 'voix enregistrées' }; });
    let w = await S.wipeAll();
    ok(w.ok && !w.partial && w.failed.length === 0, 'tout effacé : résultat ok');
    ok(fake.getItem('lumi.v1') === null && fake.getItem('lumi.v1.backup') === null && fake.getItem('lumi.v1.pre-v1') === null && fake.getItem('lumi.installNo') === null, 'toutes les clés de LUMI supprimées');
    ok(fake.getItem('autre') === 'garder' && fake.getItem('lumi.preview-x.v1') === 'autre-version', 'les clés d’une autre application ou d’une prévisualisation ne sont pas touchées');
    ok(wipedCalled && Object.keys(S.data().profiles).length === 0, 'les effaceurs sont appelés et la mémoire est vidée');
    ({ S, fake } = await freshStore({ 'lumi.v1': v1(), 'lumi.v1.backup': '{}' }, { failRemove: k => k === 'lumi.v1.backup' }));
    S.addWiper(async () => ({ ok: true, name: 'voix enregistrées' }));
    w = await S.wipeAll();
    ok(!w.ok && w.partial && w.failed.length === 1 && /backup/.test(w.failed[0].why), 'suppression partielle SIGNALÉE (clé qui résiste nommée), ok = faux');
    ok(fake.getItem('lumi.v1') === null && fake.getItem('lumi.v1.backup') === '{}', 'ce qui pouvait l’être est effacé, le reste est toujours là (pas de fausse confirmation)');
    ok(Object.keys(S.data().profiles).length > 0, 'si le stockage résiste, la mémoire n’est pas vidée à tort');
    ({ S, fake } = await freshStore({ 'lumi.v1': v1() }));
    let allow = false; S.addWiper(async () => (allow ? { ok: true, name: 'voix enregistrées' } : { ok: false, name: 'voix enregistrées', state: 'blocked', why: 'autre onglet' }));
    w = await S.wipeAll(); ok(!w.ok && w.partial && w.failed[0].state === 'blocked', 'effaceur bloqué (voix) : résultat non réussi, état « blocked » transmis');
    allow = true; w = await S.wipeAll(); ok(w.ok, 'on peut recommencer : le second essai réussit');
    ({ S, fake } = await freshStore({ 'lumi.v1': v1() }));
    S.addWiper(async () => { throw new Error('boum'); }); w = await S.wipeAll(); ok(!w.ok && w.failed.length === 1, 'un effaceur qui plante est traité comme un échec (pas d’exception, pas de succès)');

    group('Environnement — production et prévisualisation isolées');
    const envSrc = await (await fetch('../js/env.js', { cache: 'no-store' })).text();
    const mkEnv = (host, path) => new Function('location', 'window', envSrc + ';return window.Env;')({ hostname: host.split(':')[0], host, pathname: path }, {});
    const eProd = mkEnv('tan89d.github.io', '/lumi-app/'), ePrev = mkEnv('tan89d.github.io', '/lumi-app-preview/'), eLoc = mkEnv('localhost:5173', '/v3.1/');
    ok(eProd.prod && eProd.k('v1') === 'lumi.v1' && eProd.dbName === 'lumi-voice', 'production : clés historiques (lumi.v1, lumi-voice) inchangées');
    ok(!ePrev.prod && ePrev.k('v1') !== 'lumi.v1' && ePrev.dbName !== 'lumi-voice' && ePrev.label, 'prévisualisation sur la MÊME origine : clés et base différentes + bandeau');
    ok(ePrev.k('v1') !== eLoc.k('v1'), 'deux prévisualisations ne partagent pas leurs clés');
    ok(eProd.owns('lumi.v1') && !eProd.owns(ePrev.k('v1')) && !ePrev.owns('lumi.v1') && ePrev.owns(ePrev.k('v1.backup')), 'chaque environnement n’efface que ses propres clés');

    // ============ 4. IndexedDB : effacement des voix ============
    group('IndexedDB — clearClips : succès, blocage, indisponible, autre onglet');
    const NAME = Env.dbName, blob = () => new Blob([new Uint8Array(50)], { type: 'audio/webm' });
    const countDb = () => new Promise(res => { const q = indexedDB.open(NAME, 1); q.onupgradeneeded = () => q.result.createObjectStore('clips'); q.onsuccess = () => { const c = q.result.transaction('clips').objectStore('clips').count(); c.onsuccess = () => { q.result.close(); res(c.result); }; }; q.onerror = () => res(-1); });
    await Sound.ready(); await Sound.clearClips();
    // Certains moteurs (WebKit en contexte de test sans profil persistant) refusent de stocker un Blob dans IndexedDB : on le détecte par une sonde,
    // puis on vérifie que LUMI le DIT (saveClip renvoie faux et le clip reste utilisable en mémoire) au lieu de prétendre l'avoir gardé.
    const canStoreBlob = await new Promise(res => { try { const q = indexedDB.open('lumi-probe-' + Env.slug, 1); q.onupgradeneeded = () => q.result.createObjectStore('s'); q.onerror = () => res(false);
      q.onsuccess = () => { try { const d = q.result, tx = d.transaction('s', 'readwrite'); tx.objectStore('s').put(blob(), 'k'); tx.oncomplete = () => { d.close(); indexedDB.deleteDatabase('lumi-probe-' + Env.slug); res(true); }; tx.onerror = tx.onabort = () => { d.close(); indexedDB.deleteDatabase('lumi-probe-' + Env.slug); res(false); }; } catch (e) { res(false); } }; } catch (e) { res(false); } });
    let saved = await Sound.saveClip({ id: 'fr:test.a', text: 'a' }, blob()); await Sound.saveClip({ id: 'fr:test.b', text: 'b' }, blob());
    if (canStoreBlob) ok(saved === true && await countDb() === 2, 'saveClip confirme l’écriture dans IndexedDB');
    else ok(saved === false && Sound.hasClip({ id: 'fr:test.a', text: 'a' }), 'ce moteur ne stocke pas les Blob dans IndexedDB : saveClip renvoie faux (non conservé) et le clip reste utilisable en mémoire');
    let cr = await Sound.clearClips();
    ok(cr.ok === true && cr.state === 'success' && cr.remaining === 0, 'succès : état « success », 0 restant');
    ok(await countDb() === 0 && Sound.clipCount() === 0, 'succès VÉRIFIÉ : la base est vide et la mémoire aussi');
    await Sound.saveClip({ id: 'fr:test.c', text: 'c' }, blob());
    const hold = await new Promise(res => { const q = indexedDB.open(NAME, 1); q.onsuccess = () => res(q.result); });   // un « autre onglet » garde la base ouverte et refuse de la fermer
    cr = await Sound.clearClips({ timeoutMs: 500 });
    ok(cr.ok === false && cr.state === 'blocked' && /onglet/.test(cr.why), 'base bloquée : JAMAIS déclarée réussie, état « blocked » et raison lisible');
    ok(Sound.clipCount() === 1, 'base bloquée : les enregistrements existent toujours (pas de fausse suppression en mémoire)');
    hold.close(); await wait(400);
    ok(await countDb() === 0 && Sound.clipCount() === 0, 'le blocage levé, la suppression en attente aboutit et la mémoire est mise à jour');
    cr = await Sound.clearClips(); ok(cr.ok && cr.state === 'success', 'on peut recommencer après un blocage');
    await Sound.saveClip({ id: 'fr:test.d', text: 'd' }, blob());
    const friend = await new Promise(res => { const q = indexedDB.open(NAME, 1); q.onsuccess = () => { q.result.onversionchange = () => q.result.close(); res(q.result); }; });   // autre onglet LUMI coopératif
    cr = await Sound.clearClips({ timeoutMs: 800 }); ok(cr.ok && cr.state === 'success', 'un autre onglet LUMI se déconnecte tout seul : l’effacement n’est pas bloqué');
    try { friend.close(); } catch (e) {}
    const realIDB = Object.getOwnPropertyDescriptor(window, 'indexedDB');
    Object.defineProperty(window, 'indexedDB', { configurable: true, get: () => undefined });
    cr = await Sound.clearClips(); ok(cr.ok === true && cr.state === 'unavailable', 'IndexedDB indisponible : état explicite « unavailable » (rien à effacer), sans exception');
    const sv = await Sound.saveClip({ id: 'fr:test.e', text: 'e' }, blob()); ok(sv === false, 'IndexedDB indisponible : saveClip renvoie faux (non conservé), l’app continue');
    if (realIDB) Object.defineProperty(window, 'indexedDB', realIDB); else delete window.indexedDB;
    await Sound.clearClips();

    // ============ 5. Règles ============
    group('Porte parentale');
    const ch = Rules.gateChallenge(() => 0.5);
    ok(ch.a + ch.b === ch.answer && ch.answer > 10 && Rules.gateCheck(ch, String(ch.answer)) && !Rules.gateCheck(ch, String(ch.answer + 1)) && !Rules.gateCheck(ch, '') && !Rules.gateCheck(ch, '1e1'), 'addition d’adulte, bonne/mauvaise réponses, saisies invalides');
    ok(Rules.GATE.maxTries === 3 && Rules.GATE.coolMs >= 30000 && Rules.GATE.holdMs >= 2000, 'blocage après 3 erreurs, maintien 2 s');
    group('Limites de temps : pause ≠ restriction');
    eq(Rules.sessionState({ playedToday: 100, breakMin: 0, lockMin: 0, sinceBreak: 9999 }), { lock: false, breakDue: false }, 'sans réglage : ni rappel ni verrou');
    eq(Rules.sessionState({ playedToday: 100, breakMin: 10, lockMin: 0, sinceBreak: 600 }), { lock: false, breakDue: true }, 'rappel de pause : l’enfant peut continuer');
    eq(Rules.sessionState({ playedToday: 1800, breakMin: 10, lockMin: 30, sinceBreak: 700 }), { lock: true, breakDue: false }, 'limite de la journée : verrou');
    eq(Rules.sessionState({ playedToday: 1800, breakMin: 0, lockMin: 30, sinceBreak: 0, extra: 600 }), { lock: false, breakDue: false }, 'prolongation parentale : verrou levé');

    group('Difficulté et choix des jeux selon l’âge');
    ok(Rules.caps(3).countMax < Rules.caps(4).countMax && Rules.caps(4).countMax < Rules.caps(5).countMax && Rules.caps(99).countMax === Rules.caps(4).countMax, 'la difficulté monte avec l’âge ; âge inconnu = niveau 4');
    const CATS = Games.CATS, none = () => 0, all3 = () => 3;
    for (const age of [3, 4, 5]) {
      let bad = 0; const lvlOf = (c, g) => CATS.find(x => x.id === c).games.find(x => x.id === g).lvl;
      [none, all3, (c, g) => (g.length % 3)].forEach(fn => { for (let i = 0; i < 60; i++) { const t = Rules.nextGame(CATS, age, fn, () => (i * 0.137) % 1); if (lvlOf(t[0], t[1]) > age) bad++; } });
      ok(bad === 0, `âge ${age} ans : jamais de jeu trop difficile, même quand tout est terminé ou rien commencé`);
    }
    const done3 = (c, g) => { const lv = CATS.find(x => x.id === c).games.find(x => x.id === g).lvl; return lv <= 3 ? 3 : 0; };
    let t3 = Rules.nextGame(CATS, 3, done3, () => 0.99); ok(CATS.find(x => x.id === t3[0]).games.find(x => x.id === t3[1]).lvl <= 3, 'RÉGRESSION : à 3 ans, toutes les activités adaptées terminées → un jeu de niveau 3 est encore proposé (pas un jeu de 4 ou 5 ans)');
    const seenSet = new Set(); for (let i = 0; i < 200; i++) { const x = Rules.nextGame(CATS, 3, all3, () => i / 200); seenSet.add(x.join('/')); } ok(seenSet.size > 3, 'quand tout est fini, le choix varie parmi les jeux adaptés');
    const f1 = Rules.nextGame(CATS, 5, (c, g) => (c === 'letters' && g === 'listen' ? 3 : 0), () => 0); ok(!(f1[0] === 'letters' && f1[1] === 'listen'), 'un jeu jamais joué passe avant un jeu déjà réussi');
    const fAll = Rules.nextGame(CATS, 4, (c, g) => (c === 'colors' && g === 'sort' ? 1 : 3), () => 0); eq(fAll, ['colors', 'sort'], 'un jeu à 1 étoile est proposé avant de rejouer des jeux à 3 étoiles');
    ok(Rules.nextGame([{ id: 'x', games: [{ id: 'y', lvl: 5 }] }], 3, none, () => 0) !== undefined, 'aucun jeu à l’âge demandé : repli sur les plus faciles, sans planter');
    ok(Games.CATS.every(c => c.games.every(g => [3, 4, 5, 6, 7, 8].includes(g.lvl))), 'chaque jeu a un niveau d’âge (3 à 8 ans)');

    // ============ 6. Compétences ============
    group('Compétences — réussite, répétition, maîtrise');
    const pr = { progress: {}, skills: {} };
    Skills.update(pr, 'letters', 'listen', 3, 'd1'); Skills.update(pr, 'letters', 'listen', 3, 'd1'); Skills.update(pr, 'letters', 'listen', 3, 'd1');
    ok(Skills.level(pr.skills['letters.recognize']) === 1, 'RÉPÉTITION ≠ maîtrise : 3 réussites le même jour = « en cours » seulement');
    Skills.update(pr, 'letters', 'listen', 3, 'd2');
    ok(Skills.level(pr.skills['letters.recognize']) === 2 && pr.skills['letters.recognize'].d === 2, 'réussite régulière sur 2 jours = maîtrisé');
    Skills.update(pr, 'letters', 'listen', 1, 'd3');
    ok(Skills.level(pr.skills['letters.recognize']) === 2, 'une seule mauvaise partie ne fait PAS perdre la maîtrise');
    Skills.update(pr, 'letters', 'listen', 1, 'd3'); Skills.update(pr, 'letters', 'listen', 1, 'd3');
    ok(Skills.level(pr.skills['letters.recognize']) === 1, 'des difficultés répétées ramènent à « en cours » (jamais à « à découvrir »)');
    const one = { progress: {}, skills: {} }; Skills.update(one, 'colors', 'touch', 1, 'a');
    ok(Math.abs(one.skills['colors.name'].score - Skills.WEIGHT[1]) < 1e-9 && Skills.WEIGHT[1] === 0.5, '1 étoile compte pour 50 % (et non 33 %) : on ne punit pas l’erreur');
    ok(Skills.level(one.skills['colors.name']) === 1, 'une première partie à 1 étoile = déjà « en cours »');
    const legacy = { progress: {}, skills: { 'numbers.count': { score: 0.9, plays: 5 } } };
    ok(Skills.level(legacy.skills['numbers.count']) === 2, 'ancien format (sans historique) : le niveau d’avant est conservé');
    Skills.update(legacy, 'numbers', 'count', 3, 'z'); ok(legacy.skills['numbers.count'].plays === 6 && legacy.skills['numbers.count'].h.length === 1, 'ancien format : l’historique existant est conservé et enrichi');
    const rb = { progress: { 'g:numbers:count': { stars: 3, updated: '2026-01-01' }, 'L-A': { stars: 3 } }, skills: {} }; Skills.rebuild(rb);
    ok(rb.skills['numbers.count'] && !rb.skills['letters.recognize'], 'reconstruction depuis la progression (anciennes clés ignorées)');
    group('Compétences — conseils aux parents');
    const fresh = { progress: {}, skills: {} }, adv0 = Skills.advice(fresh, 3, CATS);
    ok(adv0.length > 0 && adv0.length <= 4 && adv0.every(a => a.kind === 'try'), 'profil neuf : propositions « à découvrir » (4 au plus)');
    ok(adv0.every(a => a.game && CATS.find(c => c.id === a.game[0]).games.find(g => g.id === a.game[1]).lvl <= 3), 'les jeux conseillés respectent l’âge');
    const pp = { progress: {}, skills: {} }; ['a', 'b', 'c'].forEach((d, i) => Skills.update(pp, 'colors', 'touch', i === 1 ? 1 : 2, d));
    ok(Skills.advice(pp, 4, CATS).some(a => a.kind === 'practice' && a.skill === 'colors.name'), 'résultats fragiles : conseil « rejouer sans insister »');
    const rr = { progress: {}, skills: {} }; ['a', 'b', 'c'].forEach(d => Skills.update(rr, 'colors', 'mix', 3, d));
    ok(Skills.advice(rr, 4, CATS).some(a => a.kind === 'ready' && a.skill === 'colors.mix'), 'compétence maîtrisée : conseil « prêt pour la suite »');
    ok(Skills.summary(fresh).length === Skills.ALL.length, 'le résumé liste toutes les compétences');

    // ============ 7. Localisation ============
    group('Localisation FR / EN');
    eq(I18n.missingKeys(), [], 'aucune clé manquante entre le français et l’anglais');
    I18n.setLang('en'); ok(I18n.t('play') === 'Play' && I18n.t('cat.letters') === 'Letters', 'l’anglais fonctionne');
    const en1 = I18n.line('ask.letter.listen', { l: 'A' }); I18n.setLang('fr'); const fr1 = I18n.line('ask.letter.listen', { l: 'A' });
    ok(en1.text !== fr1.text && en1.id !== fr1.id && I18n.line('ask.count').id === 'fr:ask.count', 'texte et identifiant propres à chaque langue ; identifiant stable');
    ok(I18n.line('ask.plus', { a: 'une mangue', b: 'deux mangues', na: 1, nb: 2 }).id === 'fr:ask.plus|na=1,nb=2', 'l’identifiant ne dépend pas du texte traduit');
    group('Anglais complet — histoires, installation, vocabulaire');
    const EN = LUMI.storiesByLang && LUMI.storiesByLang.en;
    ok(EN && LUMI.stories.every(s => EN[s.id]), 'les 10 histoires existent en anglais');
    ok(LUMI.stories.every(s => EN[s.id] && EN[s.id].pages.length === s.pages.length && EN[s.id].pages.every(x => typeof x === 'string' && x.length > 10)), 'chaque histoire anglaise a le même nombre de pages, toutes remplies');
    ok(LUMI.stories.every(s => EN[s.id] && EN[s.id].title && EN[s.id].title !== s.title && (!s.origin || EN[s.id].origin)), 'titres traduits ; origine traduite pour les contes');
    ok(LUMI.stories.every(s => EN[s.id].pages.every(x => !/[éèêàùçôîû]/i.test(x))), 'aucun texte d’histoire anglais ne contient d’accents français');
    I18n.setLang('en'); const ls = Games.localStory(LUMI.stories[0]); ok(ls.code === 'en' && ls.speech === 'en-US' && ls.pages[0].text === EN.mangue.pages[0] && ls.pages[0].img === LUMI.stories[0].pages[0].img, 'l’histoire anglaise garde les images et passe la voix en en-US');
    I18n.setLang('fr'); const lf = Games.localStory(LUMI.stories[0]); ok(lf.code === 'fr' && lf.speech === 'fr-FR' && lf.pages[0].text === LUMI.stories[0].pages[0].text, 'l’histoire française est inchangée');
    ok(LUMI.missions.every(m => I18n.D.fr['mission.' + m.id] && I18n.D.en['mission.' + m.id]) && LUMI.vehicles.every(v => I18n.D.en['veh.' + v.name]) && LUMI.pilots.every(p => I18n.D.en['pil.' + p.name]), 'missions, véhicules et pilotes traduits');
    ['inst.inapp', 'inst.ios', 'inst.samsung', 'inst.firefox', 'inst.edge', 'inst.opera', 'inst.generic', 'inst.generic.short', 'inst.title', 'inst.bar', 'inst.button', 'voice.none', 'voice.nosynth', 'p.wipeOk', 'p.wipePartial', 'p.clipsBlocked'].forEach(k => { if (!(I18n.D.fr[k] && I18n.D.en[k] && I18n.D.fr[k] !== I18n.D.en[k])) ok(false, 'clé non traduite : ' + k); });
    ok(true, 'instructions d’installation, messages de voix et d’effacement traduits');
    I18n.setLang('en'); const howEn = LumiInstall.howTo().txt; I18n.setLang('fr'); const howFr = LumiInstall.howTo().txt; ok(howEn !== howFr && !/[éèêàù]/.test(howEn), 'les instructions d’installation changent avec la langue (aucun accent français en anglais)');
    let leaks = [];
    I18n.setLang('en'); Games.CATS.forEach(c => { if (/[éèêàùç]/.test(Games.label(c))) leaks.push('cat ' + c.id); c.games.forEach(g => { if (/[éèêàùç]/.test(Games.gameName(c, g))) leaks.push('jeu ' + c.id + '/' + g.id); [3].forEach(age => g.make(3, { age }).forEach(rd => { if (/[éèêàùç]/.test(rd.ask.text) && rd.type !== 'story') leaks.push('consigne ' + c.id + '/' + g.id + ': ' + rd.ask.text); })); }); });
    I18n.setLang('fr'); ok(leaks.length === 0, 'anglais : aucun nom ni consigne ne contient de français', leaks.slice(0, 4).join(' | '));

    // ============ 8. Jeux ============
    group('Jeux — cohérence des manches (3 âges × 2 langues)');
    for (const lg of ['fr', 'en']) for (const age of [3, 4, 5]) {
      I18n.setLang(lg); const bad = [];
      Games.CATS.forEach(c => c.games.forEach(g => [3, 2].forEach(nn => {
        let rounds; try { rounds = g.make(nn, { age }); } catch (e) { bad.push(c.id + '/' + g.id + ' erreur ' + e.message); return; }
        if (!rounds.length) bad.push(c.id + '/' + g.id + ' aucune manche');
        rounds.forEach((rd, i) => {
          const where = `${lg}/${age}/${c.id}/${g.id}#${i}`;
          if (!rd.ask || !rd.ask.id || !rd.ask.text || /\{|undefined|NaN/.test(rd.ask.text)) bad.push(where + ' consigne invalide');
          if (rd.type === 'choose') { if (rd.choices.filter(x => x.ok).length !== 1) bad.push(where + ' bonnes réponses ≠ 1'); if (rd.choices.length < 2) bad.push(where + ' < 2 choix'); }
          if (rd.type === 'drag') { const keys = rd.slots.map(s => s.key); rd.items.forEach(it => { if (!keys.includes(it.to)) bad.push(where + ' élément sans place'); }); }
          if (rd.type === 'fill' && !(rd.n >= 1 && rd.n <= 5)) bad.push(where + ' panier hors bornes');
          if (rd.type === 'memory' && (rd.pairs.length < 2 || rd.pairs.length > Rules.caps(age).pairs)) bad.push(where + ' paires hors bornes');
          if (rd.type === 'melody' && rd.len > Rules.caps(age).melody[2]) bad.push(where + ' mélodie trop longue');
          if (rd.type === 'story' && rd.story.pages.some(pg => !pg.text)) bad.push(where + ' page vide');
        });
      })));
      ok(bad.length === 0, `toutes les manches valides (${lg}, ${age} ans)`, bad.slice(0, 4).join(' | '));
    }
    I18n.setLang('fr');

    // ============ 9. Voix et volume (synthèse simulée) ============
    group('Voix — volume, langue, absence de voix, enregistrements par identifiant');
    const sS = Store.s(), keep = Object.assign({}, sS), capt = [], oSpeak = speechSynthesis.speak, oGet = speechSynthesis.getVoices;
    const oUtt = window.SpeechSynthesisUtterance; window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    speechSynthesis.speak = u => { capt.push(u); };
    const V = (name, lang) => ({ name, lang, localService: true });
    const setVoices = list => { speechSynthesis.getVoices = () => list; Sound.refresh(); };
    const say = async l => { capt.length = 0; Sound.speak(l); await wait(400); return capt[0]; };
    Object.assign(sS, { voice: true, rec: false, vname: '', rate: 0.85, pitch: 1.1 }); I18n.setLang('fr'); setVoices([V('Voix FR', 'fr-FR'), V('Voice EN', 'en-US')]);
    sS.volume = 0.3; let u = await say(I18n.line('hello')); ok(u && Math.abs(u.volume - 0.3) < 1e-9, 'le volume réglé est appliqué à la synthèse');
    Sound.setVolume(0); u = await say(I18n.line('hello')); ok(u && u.volume === 0, 'volume 0 = silence réel');
    Sound.setVolume(7); u = await say(I18n.line('hello')); ok(u && u.volume === 1, 'volume hors bornes ramené à 1'); Sound.setVolume(0.8);
    u = await say(I18n.line('hello')); ok(u && u.voice.name === 'Voix FR' && u.lang === 'fr-FR', 'voix française choisie en français');
    I18n.setLang('en'); Sound.refresh(); u = await say(I18n.line('hello')); ok(u && u.voice.name === 'Voice EN', 'voix anglaise choisie en anglais');
    u = await say({ id: 'en:story.x.p0', text: 'Once upon a time', lang: 'en-US' }); ok(u && u.voice.name === 'Voice EN', 'une histoire anglaise est lue avec la voix anglaise');
    I18n.setLang('fr'); u = await say({ id: 'fr:story.x.p0', text: 'Il était une fois', lang: 'fr-FR' }); ok(u && u.voice.name === 'Voix FR', 'une histoire française est lue avec la voix française');
    I18n.setLang('en'); u = await say({ id: 'fr:story.y.p0', text: 'Il était une fois', lang: 'fr-FR' }); ok(u && u.voice.name === 'Voix FR', 'même quand l’interface est en anglais, un texte français est lu en français');
    I18n.setLang('fr');
    let warned = []; Sound.onNoVoice(lang => warned.push(lang)); Sound.resetNoVoiceWarnings();
    setVoices([V('Voice EN', 'en-US')]); u = await say(I18n.line('hello'));
    ok(u === undefined && warned.length === 1 && warned[0] === 'fr-FR', 'aucune voix française : silence ET message explicite (une fois)');
    u = await say(I18n.line('hello')); ok(warned.length === 1, 'le message n’est pas répété à chaque phrase');
    Sound.resetNoVoiceWarnings(); setVoices([V('Voix FR', 'fr-FR')]); u = await say(I18n.line('hello')); ok(u && warned.length === 1, 'avec une voix compatible, aucun message');
    const l1 = I18n.line('ask.count'); Sound.saveClip(l1, new Blob([new Uint8Array(200)], { type: 'audio/webm' }));
    ok(Sound.hasClip(l1) && Sound.hasClip({ id: l1.id, text: 'autre formulation' }), 'un enregistrement se retrouve par identifiant');
    u = await say({ id: l1.id, text: 'reformulé' }); ok(u === undefined, 'la voix enregistrée a priorité sur la synthèse');
    await Sound.clearClips();
    Object.assign(sS, keep); Store.save(); speechSynthesis.speak = oSpeak; speechSynthesis.getVoices = oGet; window.SpeechSynthesisUtterance = oUtt; Sound.refresh(); Sound.onNoVoice(null);

    // ============ 10. Service worker et hors ligne ============
    group('Service worker — version, caches, hors ligne');
    const swText = await (await fetch('../sw.js', { cache: 'no-store' })).text();
    const files = JSON.parse('[' + /const FILES = \[([\s\S]*?)\];/.exec(swText)[1].replace(/'/g, '"').replace(/\s+/g, ' ') + ']');
    const resps = await Promise.all(files.map(f => fetch('../' + (f === './' ? '' : f), { cache: 'no-store' }).then(x => x.status).catch(() => 0)));
    ok(resps.every(s => s === 200), `les ${files.length} fichiers du cache existent tous (hors ligne garanti)`, files.filter((f, i) => resps[i] !== 200).join(', '));
    const scripts = [...document.scripts].map(s => s.getAttribute('src')).filter(x => x && x.startsWith('../js/')).map(x => x.replace('../', ''));
    const idx = await (await fetch('../index.html', { cache: 'no-store' })).text(); const idxScripts = [...idx.matchAll(/src="(js\/[^"]+)"/g)].map(m => m[1]);
    ok(idxScripts.every(s => files.includes(s)) && files.includes('css/lumi2.css'), 'tout script appelé par index.html est dans la liste du cache');
    ok(/const VERSION = '3-[2-9]-\d+'/.test(swText), 'la version du cache est incrémentée (3-2-x)');
    ok(/new Request\(f, \{ cache: 'reload' \}\)/.test(swText) && /LEGACY = \/\^lumi-v/.test(swText) && /req\.url\.indexOf\(SCOPE\) !== 0/.test(swText), 'installation sans cache HTTP périmé ; anciens caches LUMI ciblés ; requêtes hors de LUMI ignorées');
    ok(/k\.indexOf\(PREFIX\) === 0 && k !== CACHE\) \|\| LEGACY\.test\(k\)/.test(swText), 'seuls les caches de LUMI (préfixe + anciens noms) sont supprimés');
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      for (const r0 of await navigator.serviceWorker.getRegistrations()) await r0.unregister();   // départ propre : une installation précédente ne doit pas fausser le test
      for (const k of await caches.keys()) if (/^(lumi-app::|lumi-v|autre-app|test-foreign)/.test(k)) await caches.delete(k);
      const foreign = await caches.open('autre-app-cache-v1'); await foreign.put('/x', new Response('ne pas toucher'));
      const legacyCache = await caches.open('lumi-v24'); await legacyCache.put('/x', new Response('ancien'));
      const reg = await navigator.serviceWorker.register('../sw.js', { scope: '../' });
      const sw = reg.installing || reg.waiting || reg.active;
      await new Promise(res => { if (sw.state === 'activated') return res(); sw.addEventListener('statechange', () => { if (sw.state === 'activated') res(); }); setTimeout(res, 30000); });
      for (let i = 0; i < 40 && !(await caches.keys()).some(k => k.indexOf('lumi-app::') === 0); i++) await wait(250);   // l'installation (27 fichiers dont des images) peut prendre quelques secondes
      const keys = await caches.keys(), mine = keys.filter(k => k.indexOf('lumi-app::') === 0);
      ok(keys.includes('autre-app-cache-v1'), 'le cache d’une autre application du domaine n’est PAS supprimé');
      ok(!keys.includes('lumi-v24'), 'l’ancien cache de LUMI est supprimé');
      ok(mine.length === 1 && /::3-[2-9]-\d+$/.test(mine[0]), 'un seul cache LUMI courant, nommé avec l’adresse et la version');
      const cache = await caches.open(mine[0]); const cached = await Promise.all(files.map(f => cache.match(new Request('../' + (f === './' ? '' : f)), { ignoreSearch: true }).then(x => !!x)));
      ok(cached.every(Boolean), 'tous les fichiers sont présents dans le cache (le jeu démarre sans connexion)', files.filter((f, i) => !cached[i]).join(', '));
      await caches.delete('autre-app-cache-v1'); await reg.unregister(); for (const k of await caches.keys()) if (k.indexOf('lumi-app::') === 0 && k.indexOf(location.origin) >= 0) await caches.delete(k);
    } else ok(true, 'service worker non disponible dans ce contexte : test ignoré');

    // ============ 10b. Nouveau design V3.2 ============
    group('Design V3.2 — mission du jour');
    const info0 = () => null, CATS2 = Games.CATS, letters2 = I18n.raw('letters').map(l => l.l);
    const lv = (c, g) => CATS2.find(x => x.id === c).games.find(x => x.id === g).lvl;
    const m1 = Rules.dailyMission(CATS2, 4, '2026-05-10', 'pA', info0, letters2), m1b = Rules.dailyMission(CATS2, 4, '2026-05-10', 'pA', info0, letters2);
    eq(m1, m1b, 'même profil, même date, même âge : même mission');
    const days = new Set(), profs = new Set();
    for (let d = 1; d <= 20; d++) { const x = Rules.dailyMission(CATS2, 4, '2026-05-' + String(d).padStart(2, '0'), 'pA', info0, letters2); days.add(x.cat + '/' + x.game); }
    for (const pid of ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']) { const x = Rules.dailyMission(CATS2, 4, '2026-05-10', pid, info0, letters2); profs.add(x.cat + '/' + x.game); }
    ok(days.size >= 5, 'la mission varie d’un jour à l’autre (' + days.size + ' missions différentes sur 20 jours)');
    ok(profs.size >= 2, 'la mission varie d’un profil à l’autre');
    let bad = 0; for (const age of [3, 4, 5]) for (let d = 1; d <= 40; d++) { const x = Rules.dailyMission(CATS2, age, '2026-06-' + String(d).padStart(2, '0'), 'pZ' + d, info0, letters2); if (!x || lv(x.cat, x.game) > age || (x.letter && !letters2.includes(x.letter))) bad++; }
    ok(bad === 0, 'la mission respecte toujours l’âge, pointe vers un jeu existant et une lettre disponible dans la langue');
    const base = Rules.dailyMission(CATS2, 5, '2026-07-01', 'pK', info0, letters2);
    const after = Rules.dailyMission(CATS2, 5, '2026-07-01', 'pK', (c, g) => (c === base.cat && g === base.game ? { stars: 3, updated: '2026-07-01' } : null), letters2);
    ok(after.cat === base.cat && after.game === base.game && after.done === true && base.done === false, 'la mission ne change pas quand l’enfant la joue ; elle passe à « accomplie »');
    let mastered = 0; for (let d = 1; d <= 30; d++) { const x = Rules.dailyMission(CATS2, 5, '2026-08-' + String(d).padStart(2, '0'), 'pM', (c, g) => (c === 'letters' && g === 'listen' ? { stars: 3, updated: '2026-01-01' } : null), letters2); if (x.cat === 'letters' && x.game === 'listen') mastered++; }
    ok(mastered === 0, 'un jeu déjà maîtrisé (3 étoiles un autre jour) n’est pas reproposé tant qu’il reste autre chose');
    const lm = Rules.dailyMission(CATS2, 3, '2026-09-01', 'pL', info0, letters2); ok(lm !== null, 'une mission existe même à 3 ans');

    group('Design V3.2 — accueil, mondes, navigation');
    const gids = Games.GROUPS.reduce((a, g) => a.concat(g.cats), []);
    eq(gids.slice().sort(), CATS2.map(c => c.id).sort(), 'les 8 mondes couvrent exactement les 10 catégories réelles (aucun module oublié ni inventé)');
    eq(Games.GROUPS.length, 8, 'huit grandes cartes');
    const A2 = window.LumiApp, P2 = Store.profile(), keep2 = { name: P2.name, age: P2.age, avatar: P2.avatar, progress: JSON.stringify(P2.progress), rewards: JSON.stringify(P2.rewards) };
    const s2 = Store.s(), keepS = { lock: s2.lockMin, br: s2.breakMin, lang: s2.lang };
    P2.name = 'Awa'; P2.age = 4; P2.avatar = 'abdou'; P2.progress = {}; P2.rewards = [];
    A2.go('home'); const H = document.getElementById('app');
    ok(H.querySelectorAll('.h-cats .gcat').length === 8, 'accueil : huit cartes');
    ok(/Bonjour Awa !/.test(H.querySelector('.h-welcome').textContent) && /Prêt à apprendre en jouant \?/.test(H.querySelector('.h-welcome').textContent), 'message de bienvenue avec le prénom du profil actif');
    ok(H.querySelector('.h-profile b').textContent === 'Awa' && H.querySelector('.h-profile img'), 'profil actif : prénom et portrait');
    ok(/4 ans/.test(H.querySelector('.h-age').textContent), 'badge d’âge = âge du profil');
    P2.age = 5; A2.go('home'); ok(/5 ans/.test(document.querySelector('.h-age').textContent), 'le badge suit l’âge du profil');
    ok(document.querySelector('.h-start') && /Commencer/.test(document.querySelector('.h-start').textContent) && document.querySelector('.h-parents') && document.querySelector('.h-mission'), 'boutons Commencer, Parents et mission présents');
    P2.progress = { 'g:letters:listen': { stars: 3, plays: 1, errors: 0, hints: 0, last: 3, updated: '2026-01-01' }, 'g:numbers:count': { stars: 2, plays: 1, errors: 0, hints: 0, last: 2, updated: '2026-01-01' } }; A2.go('home');
    ok(/5 étoiles/.test(document.querySelector('.h-prog .chip2').textContent), 'étoiles affichées = étoiles réellement gagnées (3 + 2)');
    ok(document.querySelector('.g-letters .gs').textContent.indexOf('★ 3/' + Games.CATS.find(c => c.id === 'letters').games.length * 3) >= 0 && document.querySelector('.g-numbers .gs').textContent.indexOf('★ 2/' + Games.CATS.find(c => c.id === 'numbers').games.length * 3) >= 0, 'étoiles par monde calculées depuis la progression');
    P2.progress = {}; A2.go('home'); ok(/0 étoiles/.test(document.querySelector('.h-prog .chip2').textContent) && /0 \/ \d+ trophées/.test(document.querySelector('.h-prog').textContent), 'profil vierge : 0 étoile, 0 trophée (aucune donnée fictive)');
    let opened = 0, listed = 0;
    for (const g of Games.GROUPS) { A2.go('home'); document.querySelector('.gcat[data-id="' + g.id + '"]').click(); if (A2.screen === 'grp') { opened++; listed += document.querySelectorAll('.hub .gcard').length; } }
    ok(opened === 8 && listed === CATS2.reduce((a, c) => a + c.games.length, 0), 'chaque carte ouvre son monde ; tous les jeux et histoires sont accessibles (' + listed + ')');
    let started = 0; A2.go('grp', { id: 'shapes' }); const ids2 = [...document.querySelectorAll('.hub .gcard')].map(b => [b.dataset.c, b.dataset.g]);
    ids2.forEach(([c0, g0]) => { A2.go('grp', { id: 'shapes' }); document.querySelector('.hub .gcard[data-c="' + c0 + '"][data-g="' + g0 + '"]').click(); if (A2.screen === 'play') started++; });
    ok(started === ids2.length && started >= 7, 'les jeux de « Formes et logique » (deux catégories) démarrent tous');
    const tabs = ['home', 'games', 'trophies', 'progress'], navOk = [];
    tabs.forEach((t0, i) => { A2.go('home'); document.querySelectorAll('.nav4 button')[i].click(); navOk.push(A2.screen === t0 && document.querySelector('.nav4 button.on') === document.querySelectorAll('.nav4 button')[i] && document.querySelector('.nav4 [aria-current="page"]')); });
    ok(document.querySelectorAll('.nav4 button').length === 4 && navOk.every(Boolean), 'quatre onglets, tous fonctionnels, l’onglet actif est signalé (aria-current)');
    A2.go('progress'); ok(!!document.querySelector('.pg-row') && !/essai|aide|minute/i.test(document.querySelector('#app').textContent), 'page Progrès : réussites simples, aucune statistique détaillée (réservée aux parents)');
    A2.go('home'); document.querySelector('.h-mission').click(); const mg = A2.game; ok(A2.screen === 'play' && mg && lv(mg.cat, mg.gid) <= P2.age, 'la mission démarre un vrai jeu adapté à l’âge');
    A2.go('home'); document.querySelector('.h-start').click(); const sg = A2.game; ok(A2.screen === 'play' && lv(sg.cat, sg.gid) <= P2.age, '« Commencer » utilise la sélection automatique (filtre d’âge respecté)');
    P2.age = 3; A2.go('home'); document.querySelector('.h-start').click(); ok(A2.screen === 'play' && A2.game.gd.lvl <= 3, 'à 3 ans, « Commencer » ne propose que des jeux de niveau 3');
    s2.lockMin = 1; P2.playTime[Store.today()] = 600; A2.go('home'); document.querySelector('.h-start').click(); ok(A2.screen === 'lock', '« Commencer » respecte la limite de temps (écran verrouillé)');
    A2.go('home'); document.querySelector('.h-mission').click(); ok(A2.screen === 'lock', 'la mission respecte aussi la limite de temps');
    s2.lockMin = keepS.lock; delete P2.playTime[Store.today()];
    I18n.setLang('en'); s2.lang = 'en'; A2.go('home'); const txt = document.querySelector('.home3').textContent;
    ok(/Start/.test(txt) && /Today’s mission:/.test(txt) && /Hello Awa!/.test(txt) && !/[éèêàùç]/.test(txt.replace(/Awa/g, '')), 'accueil en anglais : aucun texte français résiduel');
    A2.go('games'); ok(!/[éèêàùç]/.test(document.querySelector('#app').textContent), 'onglet Jeux en anglais : aucun texte français');
    I18n.setLang('fr'); s2.lang = keepS.lang; P2.name = keep2.name; P2.age = keep2.age; P2.avatar = keep2.avatar; P2.progress = JSON.parse(keep2.progress); P2.rewards = JSON.parse(keep2.rewards); Store.save(); A2.go('home');

    group('Design V3.2 — images optimisées et hors ligne');
    const imgs = ['assets/img/hero-941.jpg', 'assets/img/hero-640.jpg', 'assets/img/avatar-boy.jpg', 'assets/img/avatar-girl.jpg', 'assets/img/leaves.svg'];
    const sizes = await Promise.all(imgs.map(f => fetch('../' + f, { cache: 'no-store' }).then(r => r.ok ? r.blob().then(b => b.size) : 0)));
    ok(sizes.every(s => s > 0), 'toutes les images existent', imgs.filter((f, i) => !sizes[i]).join(', '));
    ok(sizes[0] < 130000 && sizes[1] < 80000 && sizes[2] < 25000 && sizes[3] < 25000 && sizes[4] < 5000, 'images légères pour les téléphones : ' + sizes.map(s => Math.round(s / 1024) + ' Ko').join(', '));
    ok(imgs.every(f => swText.indexOf("'" + f + "'") >= 0) && swText.indexOf("'css/design.css'") >= 0 && swText.indexOf("'js/home.js'") >= 0, 'images, feuille de style et composant d’accueil sont dans le cache hors ligne');
    const heroTag = await (await fetch('../js/home.js', { cache: 'no-store' })).text();
    ok(/srcset=/.test(heroTag) && /decoding="async"/.test(heroTag) && /width="941" height="435"/.test(heroTag) && /alt=""/.test(heroTag), 'image du héros : srcset, décodage asynchrone, dimensions réservées, décorative (alt vide)');
    ok(!/https?:\/\//.test(heroTag.replace(/http:\/\/www\.w3\.org[^'"]*/g, '')) && !/url\(\s*https?:/.test(await (await fetch('../css/design.css', { cache: 'no-store' })).text()), 'aucune ressource externe : chemins relatifs compatibles GitHub Pages');

    // ============ 10c. Refonte V3.3 ============
    group('Design V3.3 — bienvenue, réussite, profils, parents');
    const imgs3 = ['assets/img/guide-boy.jpg', 'assets/img/lion-cheer.jpg'];
    const sizes3 = await Promise.all(imgs3.map(f => fetch('../' + f, { cache: 'no-store' }).then(r => r.ok ? r.blob().then(b => b.size) : 0)));
    ok(sizes3.every(s => s > 0 && s < 90000) && imgs3.every(f => swText.indexOf("'" + f + "'") >= 0), 'nouvelles illustrations : légères (< 90 Ko) et dans le cache hors ligne (' + sizes3.map(s => Math.round(s / 1024) + ' Ko').join(', ') + ')');
    const cssText = await (await fetch('../css/design.css', { cache: 'no-store' })).text();
    ok(/prefers-reduced-motion:reduce/.test(cssText) && /body\.calm \.w-chars/.test(cssText), 'animations coupées si « réduire les animations » ou mode calme');
    const A3 = window.LumiApp, P3 = Store.profile(), keep3 = { lang: Store.s().lang, name: P3.name };
    if (A3) {
      A3.go('welcome'); const wtxt = document.querySelector('.welcome').textContent;
      ok(/Bienvenue !/.test(wtxt) && /Prêt\(e\) à apprendre, jouer et explorer le monde avec nous \?/.test(wtxt) && !!document.querySelector('.w-chars') && !document.querySelector('.nav4'), 'écran de bienvenue : message, personnages, pas de barre d’onglets');
      document.querySelector('[data-act="begin"]').click(); const afterBegin = A3.screen;
      ['games', 'trophies', 'progress', 'home'].forEach(s0 => A3.go(s0)); ok(afterBegin === 'home' && A3.screen === 'home' && !document.querySelector('.welcome'), '« Commencer » ouvre l’accueil ; la bienvenue ne revient pas en changeant d’onglet');
      I18n.setLang('en'); A3.go('welcome'); ok(/Welcome!/.test(document.querySelector('.welcome').textContent) && !/[éèêàùç]/.test(document.querySelector('.welcome').textContent), 'bienvenue en anglais sans texte français'); I18n.setLang('fr');
      const fakeCtx = { t: I18n.t, IC: { play: '', replay: '', home: '' } };
      [0, 1, 2, 3].forEach(n => { const box = document.createElement('div'); box.innerHTML = Home.result(fakeCtx, { name: 'Abdou', stars: n, reward: '', recre: '', nextAct: 'cat', nextData: '', cat: 'x', gid: 'y' }); box.__n = n; if (box.querySelectorAll('.star.on').length !== n || box.querySelectorAll('.star').length !== 3) throw new Error('étoiles affichées ≠ étoiles gagnées (' + n + ')'); });
      ok(/Bravo Abdou !/.test(Home.result(fakeCtx, { name: 'Abdou', stars: 1, reward: '', recre: '', nextAct: 'cat', nextData: '', cat: 'x', gid: 'y' })), 'réussite : « Bravo [Prénom] ! » ; le nombre d’étoiles affichées est exactement celui gagné (0 à 3)');
      A3.go('profiles'); const nProf = Store.profiles().length;
      ok(document.querySelectorAll('.prow').length === nProf && !document.querySelector('[data-act="delprof"]') && !!document.querySelector('[data-act="addprof"]'), 'page des profils : sélection et création ; la suppression n’y est pas (réservée aux parents)');
      A3.go('parent'); const ptabs = [...document.querySelectorAll('.ptab')], seen = {};
      ['follow', 'limits', 'content', 'settings'].forEach(id => { document.querySelector('.ptab[data-tab="' + id + '"]').click(); const k = document.querySelector('.ptab.on').dataset.tab; seen[k] = { lock: !!document.querySelector('[data-chg="lockMin"]'), add: !!document.querySelector('[data-act="addprof"]'), wipe: !!document.querySelector('[data-act="wipe"]'), soon: document.querySelectorAll('.row.soon').length, skills: !!document.querySelector('.bline') }; });
      ok(ptabs.length === 4 && seen.limits.lock && seen.content.add && seen.settings.wipe && seen.settings.soon === 2 && seen.follow.skills && !seen.follow.wipe, 'espace parents : 4 sections (Suivi, Limites, Contenus, Paramètres) ; effacement réservé aux Paramètres ; bambara/espagnol « Bientôt »');
      A3.go('home');
    }
    Store.s().lang = keep3.lang; P3.name = keep3.name; Store.save();

    // ============ 10d. V3.4 : mascotte animée + questions de compréhension ============
    group('V3.4 — mascotte Lumi (vectorielle, animable, repli statique)');
    const holder = document.createElement('div'); document.body.appendChild(holder);
    const mc = Mascot.mount(holder, { state: 'rest' }), parts = ['l-body', 'l-head', 'l-ear-l', 'l-ear-r', 'l-lid', 'l-arm-l', 'l-arm-r', 'm-rest', 'm-talk', 'm-happy', 'm-oops'];
    ok(Mascot.STATES.join() === 'rest,wave,talk,happy,oops,cheer' && parts.every(c => holder.querySelector('.' + c)) && !holder.querySelector('image,img'), 'Lumi est un vrai personnage vectoriel : corps, tête, oreilles, paupières, deux pattes, quatre bouches (aucune photo)');
    ok(Mascot.STATES.every(s => { mc.set(s); return mc.state === s; }) && (mc.set('inconnu'), mc.state === 'rest'), 'les six états (repos, salut, parole, bonne réponse, erreur, fête) sont réglables ; un état inconnu retombe au repos');
    mc.set('happy', 60); await wait(160); ok(mc.state === 'rest', 'une pose temporaire (bonne réponse) revient d’elle-même au repos');
    mc.setSpeaking(true); const talkSt = mc.state, talkAttr = mc.el.getAttribute('data-speaking'); mc.setSpeaking(false); ok(talkSt === 'talk' && talkAttr === '1' && mc.state === 'rest', 'la bouche suit l’état de narration (parle / se tait)');
    mc.set('cheer'); mc.setSpeaking(true); ok(mc.state === 'cheer', 'une narration ne casse pas la pose de fête'); mc.setSpeaking(false);
    const oMM = window.matchMedia, keepCalm = document.body.classList.contains('calm');
    document.body.classList.remove('calm'); window.matchMedia = () => ({ matches: false }); const animOn = Mascot.isAnimated();
    window.matchMedia = () => ({ matches: true }); const animReduced = Mascot.isAnimated(); window.matchMedia = () => ({ matches: false });
    document.body.classList.add('calm'); const animCalm = Mascot.isAnimated(); document.body.classList.toggle('calm', keepCalm); window.matchMedia = oMM;
    ok(animOn === true && animReduced === false && animCalm === false, 'animations coupées si « réduire les animations » ou mode calme (statique de secours)');
    const cssV34 = await (await fetch('../css/design.css', { cache: 'no-store' })).text();
    ok(/prefers-reduced-motion:reduce\)\{\.lumi,\.lumi \*\{animation:none!important/.test(cssV34) && /body\.calm \.lumi,body\.calm \.lumi \*\{animation:none!important/.test(cssV34) && /\.lumi\[data-state=cheer\] \.l-arm-r\{transform:rotate/.test(cssV34), 'la feuille de style fige Lumi (mêmes poses, aucune boucle) en animations réduites et en mode calme');
    const n0 = Mascot.count(); mc.destroy(); ok(Mascot.count() === n0 - 1, 'une mascotte détruite se désinscrit (pas de fuite)'); holder.remove();

    group('V3.4 — questions des dix histoires (français et anglais)');
    const LS = LUMI.stories, norm2 = s => s.toLowerCase().replace(/[’']/g, '’'), hasWord = (text, kw) => new RegExp('(^|[^a-zà-ÿ])' + norm2(kw).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-zà-ÿ]|$)', 'i').test(norm2(text));
    ok(LS.length === 10 && StoryQuiz.ids().length === 10 && LS.every(s => StoryQuiz.has(s.id)), 'les dix histoires ont chacune une question');
    const textOf = (s, lg) => lg === 'en' ? LUMI.storiesByLang.en[s.id].pages.join(' ') : s.pages.map(p => p.text).join(' ');
    const bad34 = [];
    LS.forEach(s => ['fr', 'en'].forEach(lg => {
      const r = StoryQuiz.raw(s.id, lg), txt = textOf(s, lg);
      if (!r || !r.q || /\{|undefined|NaN/.test(r.q)) { bad34.push(s.id + '/' + lg + ' question vide'); return; }
      if (!hasWord(txt, r.kwOk)) bad34.push(s.id + '/' + lg + ' : la bonne réponse « ' + r.kwOk + ' » n’est pas dans le texte');
      r.kwKo.forEach(k => { if (hasWord(txt, k)) bad34.push(s.id + '/' + lg + ' : le distracteur « ' + k + ' » apparaît dans le texte'); });
      if (r.ko.length < 2) bad34.push(s.id + '/' + lg + ' : pas assez de distracteurs');
    }));
    ok(bad34.length === 0, 'chaque bonne réponse est prouvée par le texte du conte, aucun distracteur n’y figure (fr + en)', bad34.join(' | '));
    ok(LS.every(s => !/[éèêàùç]/.test(StoryQuiz.raw(s.id, 'en').q + [StoryQuiz.raw(s.id, 'en').ok.en].concat(StoryQuiz.raw(s.id, 'en').ko.map(k => k.en)).join(' '))), 'les questions et réponses anglaises ne contiennent aucun accent français');
    const cnt34 = [];
    LS.forEach(s => ['fr', 'en'].forEach(lg => [3, 4, 5].forEach(age => { const q = StoryQuiz.build(s.id, lg, age); cnt34.push(q.choices.length === (age === 3 ? 2 : 3) && q.choices.filter(c => c.ok).length === 1 && q.choices.every(c => c.label && c.e) && StoryQuiz.check(q, q.choices.findIndex(c => c.ok)) && q.choices.every((c, i) => c.ok || !StoryQuiz.check(q, i))); })));
    ok(cnt34.length === 60 && cnt34.every(Boolean), 'une seule bonne réponse par question ; 2 choix à 3 ans, 3 choix à 4 et 5 ans ; la validation n’accepte que la bonne réponse');
    const pos = [0, 0, 0]; for (let i = 0; i < 90; i++) { const q = StoryQuiz.build('mangue', 'fr', 5); pos[q.choices.findIndex(c => c.ok)]++; }
    ok(pos.every(n => n > 8), 'la bonne réponse change de place (' + pos.join(' / ') + ' sur 90 tirages)');
    ok(StoryQuiz.build('inconnue', 'fr', 4) === null && StoryQuiz.check(null, 0) === false, 'histoire sans question : pas de question (l’histoire se termine normalement)');

    group('V3.4 — déroulement dans l’application (passer, réessayer, audio, progression)');
    const A4 = window.LumiApp, P4 = Store.profile();
    if (A4) {
      const snap4 = JSON.stringify({ progress: P4.progress, rewards: P4.rewards, storiesRead: P4.storiesRead, skills: P4.skills, recre: P4.recre, age: P4.age, playTime: P4.playTime }), settings4 = JSON.stringify(Store.s());
      const toQuiz = (id, age) => { P4.age = age; A4.go('home'); A4.startGame('stories', id); for (let i = 0; i < 12 && !document.querySelector('.quiz'); i++) document.querySelector('[data-act="spg"][data-d="1"]').click(); return !!document.querySelector('.quiz'); };
      const oStop = Sound.stop; let stops = 0; Sound.stop = () => { stops++; return oStop(); };
      ok(toQuiz('tortue', 5) && document.querySelectorAll('.q-ch').length === 3 && !!document.querySelector('.q-skip') && /tortue/.test(document.querySelector('.q-bubble').textContent) && document.querySelectorAll('.mascot-slot svg.lumi').length >= 1, 'à la fin de l’histoire : question illustrée, 3 réponses à 5 ans, bouton « Passer », Lumi présent');
      ok(toQuiz('tortue', 3) && document.querySelectorAll('.q-ch').length === 2, 'à 3 ans : seulement 2 réponses');
      const before = stops; A4.go('home'); ok(stops > before, 'quitter l’écran arrête la voix (Sound.stop appelé à chaque changement d’écran)');
      toQuiz('mangue', 4); const errBefore = A4.game.err, wrongIdx = [...document.querySelectorAll('.q-ch')].findIndex((b, i) => !A4.game.quiz.choices[i].ok);
      document.querySelectorAll('.q-ch')[wrongIdx].click();
      ok(A4.screen === 'play' && !!document.querySelector('.quiz') && A4.game.err === errBefore && document.querySelectorAll('.q-ch.bad').length === 1, 'mauvaise réponse : douce, sans pénalité (aucune erreur comptée), on reste sur la question pour réessayer');
      document.querySelectorAll('.q-ch')[wrongIdx].click(); ok(document.querySelectorAll('.q-ch.bad').length === 1, 'une réponse déjà essayée ne se compte pas deux fois');
      const okIdx = A4.game.quiz.choices.findIndex(c => c.ok); document.querySelectorAll('.q-ch')[okIdx].click(); await wait(2200);
      ok(A4.screen === 'result' && A4.game.stars === 3 && P4.storiesRead.includes('mangue'), 'bonne réponse : encouragement puis fin de l’histoire (3 étoiles, histoire marquée lue)');
      toQuiz('baobab', 4); document.querySelector('.q-skip').click(); ok(A4.screen === 'result' && A4.game.stars === 3 && P4.storiesRead.includes('baobab'), 'l’enfant peut terminer l’histoire sans répondre (« Passer »)');
      const progressMid = JSON.stringify(P4.progress);
      toQuiz('pluie', 4); const keyBefore = Object.keys(P4.progress).length; document.querySelectorAll('.q-ch')[A4.game.quiz.choices.findIndex(c => !c.ok)].click(); ok(Object.keys(P4.progress).length === keyBefore && JSON.stringify(P4.progress) === progressMid, 'aucune progression perdue ni ajoutée tant que l’enfant n’a pas fini');
      ok(JSON.stringify(Store.s()) === settings4, 'les réglages parentaux (limites, voix, accessibilité) sont intacts après les histoires');
      // arrêt de la narration programmée : une phrase en attente de voix n'est jamais dite après un changement d'écran
      const sx = Store.s(), keepV = Object.assign({}, sx), cap4 = [], oSp = speechSynthesis.speak, oGv = speechSynthesis.getVoices, oUt = window.SpeechSynthesisUtterance;
      window.SpeechSynthesisUtterance = function (t) { this.text = t; }; speechSynthesis.speak = u => cap4.push(u); speechSynthesis.getVoices = () => []; sx.voice = true; sx.rec = false; Sound.refresh();
      Sound.speak({ id: 'fr:quiz.x.q', text: 'Une question', lang: 'fr-FR' }); Sound.stop(); speechSynthesis.getVoices = () => [{ name: 'Voix FR', lang: 'fr-FR', localService: true }]; Sound.refresh(); await wait(700);
      ok(cap4.filter(u => u.text === 'Une question').length === 0, 'une narration en attente est annulée à l’arrêt : jamais de voix tardive par-dessus la page suivante');
      Object.assign(sx, keepV); speechSynthesis.speak = oSp; speechSynthesis.getVoices = oGv; window.SpeechSynthesisUtterance = oUt; Sound.refresh();
      Sound.stop = oStop;
      const swT = await (await fetch('../sw.js', { cache: 'no-store' })).text();
      ok(swT.indexOf("'js/mascot.js'") >= 0 && swT.indexOf("'js/story-quiz.js'") >= 0 && /const VERSION = '3-[4-9]-/.test(swT), 'mascotte et questions sont dans le cache hors ligne (version 3-x)');
      const old = JSON.parse(snap4); P4.progress = old.progress; P4.rewards = old.rewards; P4.storiesRead = old.storiesRead; P4.skills = old.skills; P4.recre = old.recre; P4.age = old.age; P4.playTime = old.playTime; Store.save(); A4.go('home');
    } else ok(false, 'application non chargée dans la page de test');


    // ============ 10e. V3.5 : niveaux 3 à 8 ans, décors, séances variées, Voyage de Lumi ============
    group('V3.5 — niveaux 3 à 8 ans');
    ok([3, 4, 5, 6, 7, 8].every(a => Rules.caps(a) && Rules.caps(a).choices >= 3) && Rules.caps(8).calcMax === 100 && Rules.caps(6).calcMax === 20 && Rules.caps(5).countMax <= Rules.caps(7).countMax + 10, 'paliers 3, 4, 5, 6, 7 et 8 ans définis (calculs jusqu’à 20, 50 puis 100)');
    ok(Rules.caps(7).pairs > Rules.caps(4).pairs && Rules.caps(8).suiteLen.length === 3, 'la difficulté monte avec l’âge (mémoire, suites)');
    const imp = Store.validate(JSON.stringify({ v: 3, active: 'p1', settings: {}, profiles: { p1: { id: 'p1', name: 'Aïssa', avatar: 'awa', age: 8, progress: {}, stickers: ['letters', 'nature', '<b>x</b>', 'letters'] }, p2: { id: 'p2', name: 'Old', avatar: 'awa', age: 9, progress: {} } } }));
    ok(imp.ok && imp.data.profiles.p1.age === 8 && imp.data.profiles.p2.age === 4 && imp.data.profiles.p1.stickers.join() === 'letters,nature', 'un profil de 8 ans est accepté ; un âge hors 3-8 revient à 4 ; autocollants filtrés et sans doublon');
    const NEWG = [['numbers', 'add'], ['numbers', 'sub'], ['numbers', 'compare'], ['numbers', 'tables'], ['numbers', 'money'], ['numbers', 'clock'], ['letters', 'missing'], ['logic', 'numseq'], ['countries', 'capitals']];
    const badN = [];
    ['fr', 'en'].forEach(lg => { I18n.setLang(lg); NEWG.forEach(([c0, g0]) => { const cd = Games.CATS.find(c => c.id === c0), gd = cd && cd.games.find(g => g.id === g0); if (!gd) { badN.push('absent ' + c0 + '/' + g0); return; }
      if (gd.lvl < 6) badN.push(c0 + '/' + g0 + ' niveau');
      [3, 4, 5, 6, 7, 8].forEach(age => [2, 3].forEach(n => { let rs; try { rs = gd.make(n, { age }); } catch (e) { badN.push(c0 + '/' + g0 + ' plante à ' + age + ' ans : ' + e.message); return; }
        rs.forEach(r => { const okc = r.choices.filter(x => x.ok).length; if (okc !== 1) badN.push(c0 + '/' + g0 + ' ' + lg + ' ' + age + ' : ' + okc + ' bonnes réponses'); if (new Set(r.choices.map(x => x.h)).size !== r.choices.length) badN.push(c0 + '/' + g0 + ' réponses en double'); if (!r.ask.text || /\{|undefined|NaN/.test(r.ask.text)) badN.push(c0 + '/' + g0 + ' consigne invalide : ' + r.ask.text); if (lg === 'en' && /[éèêàùç]/.test(r.ask.text)) badN.push(c0 + '/' + g0 + ' consigne française en anglais'); if (r.choices.length > 4 || r.choices.length < 2) badN.push(c0 + '/' + g0 + ' nombre de choix'); }); })); }); });
    I18n.setLang('fr');
    ok(badN.length === 0, 'les 9 nouveaux jeux (6-8 ans) : une seule bonne réponse, pas de doublon, consignes valides en français et en anglais, aucun plantage à tous les âges', badN.slice(0, 4).join(' | '));
    const calcOk = []; for (let i = 0; i < 40; i++) { Games.CATS.find(c => c.id === 'numbers').games.filter(g => ['add', 'sub', 'tables'].includes(g.id)).forEach(g => g.make(3, { age: 8 }).forEach(r => { const m = /(\d+) ([+−×]) (\d+) =/.exec(r.show.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')); const v = m && (m[2] === '+' ? +m[1] + +m[3] : m[2] === '−' ? m[1] - m[3] : m[1] * m[3]); calcOk.push(m && r.choices.find(c => c.ok).h === String(v)); })); }
    ok(calcOk.length > 100 && calcOk.every(Boolean), 'additions, soustractions et tables : la bonne réponse est mathématiquement juste (' + calcOk.length + ' vérifiées)');
    ok(Rules.adaptAge(5, [3, 3]) === 6 && Rules.adaptAge(8, [3, 3]) === 8 && Rules.adaptAge(5, [1, 1]) === 4 && Rules.adaptAge(3, [1, 1]) === 3 && Rules.adaptAge(5, [3, 1]) === 5 && Rules.adaptAge(5, [3]) === 5, 'difficulté adaptative douce : +1 après deux réussites, -1 après deux échecs, bornée à 3-8');

    group('V3.5 — lecteur de planches d’animation (personnages 3D à venir)');
    ok(Sprite.parseName('lumi-wave-4x2.png').frames === 8 && Sprite.parseName('x-6x1.webp').cols === 6 && Sprite.parseName('sans-grille.png') === null, 'le nom d’une planche donne sa grille (4x2 = 8 images)');
    ok(Sprite.frame(0, 4, 2).x === 0 && Sprite.frame(3, 4, 2).x === 100 && Sprite.frame(4, 4, 2).y === 100 && Sprite.frame(5, 4, 2).x > 30 && Sprite.frame(5, 4, 2).x < 40, 'position exacte de chaque image dans la planche');
    const spH = document.createElement('div'); document.body.appendChild(spH); spH.innerHTML = Sprite.html({ src: 'data:image/png;base64,AAAA', cols: 2, rows: 2, fps: 40, label: 'Test' }); const spE = spH.firstChild, spC = Sprite.play(spE); await wait(150); const moved = +spE.dataset.i; spC.stop();
    ok(moved > 0 && spE.getAttribute('role') === 'img' && spE.getAttribute('aria-label') === 'Test', 'la planche s’anime (images qui défilent) et reste accessible');
    const oMM2 = window.matchMedia; window.matchMedia = () => ({ matches: true }); const spE2 = document.createElement('span'); spE2.className = 'sprite'; Object.assign(spE2.dataset, { cols: 2, rows: 2, frames: 4, fps: 40, loop: 1 }); spH.appendChild(spE2); Sprite.play(spE2); await wait(150); const frozen = +spE2.dataset.i; window.matchMedia = oMM2; spH.remove();
    ok(frozen === 0, 'animations réduites ou mode calme : seule la première image est affichée (image fixe)');

    group('V3.5 — décors africains');
    ok(Decor.THEMES.length === 12 && Decor.THEMES.every(th => /<svg class="dc dc-ground"/.test(Decor.html(th)) && /dc-top/.test(Decor.html(th)) && /aria-hidden="true"/.test(Decor.html(th))), 'douze décors (un par monde + accueil, parents, nuit), vectoriels, cachés aux lecteurs d’écran');
    ok(Object.keys({ letters: 1, numbers: 1, shapes: 1, colors: 1, music: 1, nature: 1, countries: 1, stories: 1 }).every(w => Decor.themeFor('grp', { id: w }, null) === w) && Decor.themeFor('play', {}, { cat: 'logic' }) === 'shapes' && Decor.themeFor('play', {}, { cat: 'stories' }) === 'stories' && Decor.themeFor('lock') === 'night' && Decor.themeFor('parent') === 'parent' && Decor.themeFor('voyage') === 'countries', 'chaque monde et chaque jeu a son décor');
    const A5 = window.LumiApp; if (A5) { ['home', 'games', 'trophies', 'progress', 'voyage', 'recre', 'profiles', 'welcome'].forEach(s0 => A5.go(s0)); A5.go('grp', { id: 'nature' }); const dEl = document.getElementById('decor'); ok(!!dEl && dEl.getAttribute('aria-hidden') === 'true' && document.body.dataset.decor === 'nature' && dEl.querySelector('svg.dc-ground'), 'le décor est présent derrière chaque écran et change avec le monde'); A5.go('home'); }
    const cssV35 = await (await fetch('../css/design.css', { cache: 'no-store' })).text();
    ok(/#decor\{position:fixed;inset:0;z-index:0;pointer-events:none/.test(cssV35) && /body\.calm #decor \.dc-fly/.test(cssV35) && /prefers-reduced-motion:reduce\)\{#decor/.test(cssV35), 'décors : jamais cliquables, derrière l’interface, animations coupées en mode calme et en animations réduites');

    group('V3.5 — séance variée et Voyage de Lumi');
    const cats5 = Games.CATS, st5 = () => 0, pl = Rules.sessionPlan(cats5, 5, st5, Math.random, 5);
    ok(pl.length === 5 && new Set(pl.map(x => x[0])).size === 5 && pl.every(([c, g]) => cats5.find(z => z.id === c).games.find(z => z.id === g).lvl <= 5), 'une séance = 5 activités de familles différentes, toutes adaptées à l’âge');
    ok(Rules.sessionPlan(cats5, 3, st5, Math.random, 5).every(([c, g]) => cats5.find(z => z.id === c).games.find(z => z.id === g).lvl <= 3), 'à 3 ans, la séance ne propose que des jeux de niveau 3');
    const P5 = Store.profile(), snap5 = JSON.stringify({ progress: P5.progress, rewards: P5.rewards, storiesRead: P5.storiesRead, skills: P5.skills, recre: P5.recre, age: P5.age, stickers: P5.stickers, playTime: P5.playTime });
    if (A5) {
      P5.age = 5; A5.go('home'); document.querySelector('.h-start').click(); const g1 = A5.game, dots = document.querySelectorAll('.sdots i').length;
      ok(A5.screen === 'play' && dots === 5 && !!document.querySelector('.sdots i.now'), '« Commencer » lance une séance de 5 activités avec ses points de progression');
      A5.go('voyage'); ok(document.querySelectorAll('.vs-btn').length === 8 && !!document.querySelector('.h-voyage') === false, 'le Voyage de Lumi montre les huit étapes');
      A5.go('home'); ok(!!document.querySelector('.h-voyage'), 'accès au Voyage depuis l’accueil');
      A5.go('voyage'); document.querySelector('.vs-btn.g-nature').click(); const first5 = A5.game; ok(A5.screen === 'play' && first5.cat === 'nature' && document.querySelectorAll('.sdots i').length === 3, 'une étape lance une mini-séance de 3 jeux du monde choisi');
      const keepSk = (P5.stickers || []).slice(); P5.stickers = [];
      for (let k = 0; k < 3; k++) { A5.finish(); if (k < 2) document.querySelector('[data-act="snext"]').click(); }
      ok(A5.screen === 'result' && P5.stickers.length === 1 && P5.stickers[0] === 'nature' && !!document.querySelector('.newc.sticker'), 'finir les 3 jeux d’une étape donne l’autocollant du monde (une seule fois)');
      A5.go('voyage'); document.querySelector('.vs-btn.g-nature').click(); for (let k = 0; k < 3; k++) { A5.finish(); if (k < 2) document.querySelector('[data-act="snext"]').click(); }
      ok(P5.stickers.length === 1 && !document.querySelector('.newc.sticker'), 'refaire une étape ne donne pas deux fois le même autocollant');
      const ex = JSON.parse(Store.exportJSON()), im = Store.validate(JSON.stringify(ex)); ok(im.ok && im.data.profiles[P5.id].stickers.join() === 'nature', 'les autocollants sont sauvegardés et restaurés (export / import)');
      P5.stickers = keepSk;
    }
    Object.assign(P5, JSON.parse(snap5)); Store.save(); if (A5) A5.go('home');


    // ============ 10f. V4 : logo A validé (image) + slogan en vrai texte ============
    group('V4 — logo A (identité validée)');
    const lsz = await Promise.all(['logo-lumi-480.webp', 'logo-lumi-720.webp'].map(f => fetch('../assets/img/' + f, { cache: 'no-store' }).then(r => r.ok ? r.blob().then(b => b.size) : 0)));
    const swV4 = await (await fetch('../sw.js', { cache: 'no-store' })).text();
    ok(lsz.every(n => n > 0 && n < 100000) && swV4.indexOf("'assets/img/logo-lumi-480.webp'") >= 0 && swV4.indexOf("'assets/img/logo-lumi-720.webp'") >= 0, 'logo A : deux largeurs WebP légères (' + lsz.map(n => Math.round(n / 1024) + ' Ko').join(', ') + '), mises en cache hors ligne');
    const AV = window.LumiApp; if (AV) {
      ['welcome', 'home'].forEach(sc => { AV.go(sc); const im = document.querySelector('.logo-img'), h1 = im && im.closest('h1'), sg = document.querySelector('.sign');
        ok(!!im && im.getAttribute('alt') === 'LUMI' && !!h1 && /srcset=|srcset/.test(im.outerHTML) && sg && sg.textContent === I18n.t('tagline') && !/<img/.test(sg.innerHTML), 'écran « ' + sc + ' » : logo A (alt « LUMI », titre h1) et slogan en vrai texte traduisible, jamais dans l’image'); });
      AV.go('welcome'); const im2 = document.querySelector('.logo-img'); im2.dispatchEvent(new Event('error')); ok(!document.querySelector('.logo-img') && /LUMI/.test(document.querySelector('.w-logo h1').textContent), 'si l’image du logo ne charge pas, le texte « LUMI » prend le relais');
      I18n.setLang('en'); AV.go('welcome'); ok(/Learning by playing/.test(document.querySelector('.sign').textContent), 'slogan anglais sous le logo'); I18n.setLang('fr'); AV.go('home');
    }

    group('V3.6.1 — mises à jour visibles');
    const mainSrc = await (await fetch('../js/main.js', { cache: 'no-store' })).text();
    ok(/updateViaCache: 'none'/.test(mainSrc) && /controllerchange/.test(mainSrc) && /pendingReload/.test(mainSrc), 'le service worker est redemandé au réseau et la nouvelle version se recharge d’elle-même (jamais en plein jeu)');
    if (window.LumiApp) { LumiApp.go('parent'); document.querySelector('.ptab[data-tab="settings"]').click(); ok(/version \d+\.\d+/.test(document.querySelector('.appver').textContent), 'la version de LUMI est affichée dans l’espace parents (Paramètres)'); LumiApp.go('home'); }

    // ============ 11. Application ============
    group('Application — écrans');
    const A = window.LumiApp;
    if (A) {
      has(() => { A.go('home'); if (document.querySelectorAll('.h-cats .gcat').length !== 8) throw new Error('accueil : 8 cartes attendues'); }, 'accueil affiché');
      has(() => { A.go('trophies'); if (!document.querySelector('.coll')) throw new Error('trophées vides'); }, 'trophées affichés');
      has(() => { A.go('recre'); A.go('missions'); A.go('garage'); }, 'écrans de récré affichés');
      const done = []; Games.CATS.forEach(c => c.games.forEach(g => { try { A.startGame(c.id, g.id); done.push(document.querySelector('.play') ? 1 : 0); } catch (e) { done.push(0); } }));
      ok(done.every(x => x === 1) && done.length >= 40, `les ${done.length} jeux et histoires s’ouvrent`);
      has(() => { A.openGate('parent'); if (!document.getElementById('hold')) throw new Error('pas de maintien'); }, 'la porte parentale demande d’abord un maintien');
      I18n.setLang('en'); has(() => { A.go('cat', { id: 'stories' }); if (!/Abdou and the mango/.test(document.getElementById('app').textContent)) throw new Error('titres non traduits'); }, 'les titres d’histoires s’affichent en anglais');
      has(() => { A.startGame('stories', 'anansi'); if (!/very long time ago/.test(document.getElementById('app').textContent)) throw new Error('texte non traduit'); }, 'une histoire s’ouvre en anglais');
      I18n.setLang('fr'); A.go('home');
    } else ok(false, 'application non chargée dans la page de test');
    return results;
  }
  window.__runLumiTests = run;
})();
