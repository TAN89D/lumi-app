// Tests automatisés de LUMI V3.1. Ouvrir tests/index.html dans un navigateur (ou via Playwright : voir tests/e2e).
// Les tests de stockage utilisent un faux localStorage : ils ne touchent jamais aux vraies données. Les tests IndexedDB utilisent la base
// de l'environnement courant (nom propre à l'adresse de la page de test, jamais celle de la production : voir js/env.js).
(function () {
  const results = [];
  let current = '';
  const group = n => { current = n; };
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
    let saved = await Sound.saveClip({ id: 'fr:test.a', text: 'a' }, blob()); await Sound.saveClip({ id: 'fr:test.b', text: 'b' }, blob());
    ok(saved === true && await countDb() === 2, 'saveClip confirme l’écriture dans IndexedDB');
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
    ok(Games.CATS.every(c => c.games.every(g => [3, 4, 5].includes(g.lvl))), 'chaque jeu a un niveau d’âge');

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
    ok(/const VERSION = '3-1-\d+'/.test(swText), 'la version du cache est incrémentée (3-1-x)');
    ok(/new Request\(f, \{ cache: 'reload' \}\)/.test(swText) && /LEGACY = \/\^lumi-v/.test(swText) && /req\.url\.indexOf\(SCOPE\) !== 0/.test(swText), 'installation sans cache HTTP périmé ; anciens caches LUMI ciblés ; requêtes hors de LUMI ignorées');
    ok(/k\.indexOf\(PREFIX\) === 0 && k !== CACHE\) \|\| LEGACY\.test\(k\)/.test(swText), 'seuls les caches de LUMI (préfixe + anciens noms) sont supprimés');
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      for (const k of await caches.keys()) if (/^(lumi-app::|lumi-v|autre-app|test-foreign)/.test(k)) await caches.delete(k);
      const foreign = await caches.open('autre-app-cache-v1'); await foreign.put('/x', new Response('ne pas toucher'));
      const legacyCache = await caches.open('lumi-v24'); await legacyCache.put('/x', new Response('ancien'));
      const reg = await navigator.serviceWorker.register('../sw.js', { scope: '../' });
      const sw = reg.installing || reg.waiting || reg.active;
      await new Promise(res => { if (sw.state === 'activated') return res(); sw.addEventListener('statechange', () => { if (sw.state === 'activated') res(); }); setTimeout(res, 8000); });
      const keys = await caches.keys(), mine = keys.filter(k => k.indexOf('lumi-app::') === 0);
      ok(keys.includes('autre-app-cache-v1'), 'le cache d’une autre application du domaine n’est PAS supprimé');
      ok(!keys.includes('lumi-v24'), 'l’ancien cache de LUMI est supprimé');
      ok(mine.length === 1 && /::3-1-\d+$/.test(mine[0]), 'un seul cache LUMI courant, nommé avec l’adresse et la version');
      const cache = await caches.open(mine[0]); const cached = await Promise.all(files.map(f => cache.match(new Request('../' + (f === './' ? '' : f)), { ignoreSearch: true }).then(x => !!x)));
      ok(cached.every(Boolean), 'tous les fichiers sont présents dans le cache (le jeu démarre sans connexion)', files.filter((f, i) => !cached[i]).join(', '));
      await caches.delete('autre-app-cache-v1'); await reg.unregister(); for (const k of await caches.keys()) if (k.indexOf('lumi-app::') === 0 && k.indexOf(location.origin) >= 0) await caches.delete(k);
    } else ok(true, 'service worker non disponible dans ce contexte : test ignoré');

    // ============ 11. Application ============
    group('Application — écrans');
    const A = window.LumiApp;
    if (A) {
      has(() => { A.go('home'); if (!document.querySelector('.cat')) throw new Error('accueil vide'); }, 'accueil affiché');
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
