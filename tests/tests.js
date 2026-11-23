// Tests automatisés de LUMI V3. Ouvrir tests/index.html dans un navigateur (aucun outil à installer).
// Les tests utilisent des copies : ils ne touchent jamais aux vraies données (localStorage est remplacé par une version factice).
(function () {
  const results = [];
  let current = '';
  const group = n => { current = n; };
  const ok = (cond, name, detail) => results.push({ group: current, name, pass: !!cond, detail: cond ? '' : String(detail || '') });
  const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), name, 'obtenu ' + JSON.stringify(a) + ' attendu ' + JSON.stringify(b));
  const has = (fn, name) => { try { fn(); ok(true, name); } catch (e) { ok(false, name, e && e.message); } };
  const throws = (fn, name) => { try { fn(); ok(false, name, 'aucune erreur levée'); } catch (e) { ok(true, name); } };
  const mkFake = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, key: i => Object.keys(m)[i], get length() { return Object.keys(m).length; }, _m: m }; };

  // Charge une copie isolée de store.js avec un faux localStorage, pour tester migration, import et échecs de stockage.
  async function freshStore(initial, opts) {
    const src = await (await fetch('../js/store.js')).text();
    const fake = mkFake(); Object.keys(initial || {}).forEach(k => fake.setItem(k, initial[k]));
    if (opts && opts.full) fake.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); };
    const f = new Function('localStorage', 'window', src + ';return window.Store;');
    const w = {}; const S = f(fake, w); return { S, fake };
  }
  const v1 = () => JSON.stringify({ v: 1, active: 'p1', profiles: { p1: { id: 'p1', name: 'Awa', avatar: 'awa', created: 1, progress: { 'g:letters:listen': { stars: 3, plays: 4, errors: 1, hints: 0, last: 3, updated: '2026-01-01' }, 'L-A': { stars: 2, plays: 1, errors: 0, hints: 0, last: 2, updated: '2025-12-01' } }, rewards: [{ id: 'draw:lion', type: 'draw', item: 'lion', date: '2026-01-01' }], playTime: { '2026-01-01': 300 }, storiesRead: ['mangue'] } }, settings: { lang: 'fr', voice: true, sfx: true, volume: 0.5, limitMin: 15 } });

  async function run() {
    // ---------- 1. Stockage : migration ----------
    group('Stockage — migration v1 → v2');
    let { S, fake } = await freshStore({ 'lumi.v1': v1() });
    const p = S.profile();
    ok(S.data().v === 2, 'schéma passé à la version 2');
    ok(p && p.progress['g:letters:listen'].stars === 3 && p.progress['L-A'].stars === 2, 'la progression existante est intacte');
    ok(p.rewards.length === 1 && p.storiesRead[0] === 'mangue' && p.playTime['2026-01-01'] === 300, 'récompenses, histoires et temps de jeu conservés');
    ok(S.s().breakMin === 15 && S.s().limitMin === undefined, 'l’ancienne limite devient un rappel de pause');
    ok(p.age === 4 && typeof p.skills === 'object', 'nouveaux champs ajoutés (âge, compétences)');
    ok(fake.getItem('lumi.v1.pre-v1') !== null, 'copie de sécurité faite avant migration');
    eq(JSON.parse(fake.getItem('lumi.v1.pre-v1')).profiles.p1.progress['L-A'].stars, 2, 'la copie de sécurité contient les données d’origine');

    group('Stockage — données illisibles et échecs');
    ({ S, fake } = await freshStore({ 'lumi.v1': '{pas du json' }));
    ok(S.status.level === 'corrupt', 'données corrompues détectées');
    ok(fake.getItem('lumi.v1.corrupt') === '{pas du json', 'copie des données illisibles conservée');
    ok(S.ensureProfile() && S.profiles().length === 1, 'LUMI redémarre avec un profil neuf');
    ({ S } = await freshStore({ 'lumi.v1': JSON.stringify({ v: 99, profiles: {} }) }));
    ok(S.status.level === 'corrupt', 'une version future est refusée (aucune écrasement silencieux)');
    ({ S } = await freshStore({}, { full: true }));
    S.ensureProfile(); const saved = S.save();
    ok(saved === false && S.status.level === 'fail', 'échec d’écriture (stockage plein) signalé');

    group('Dates — fuseau horaire local');
    ({ S } = await freshStore({}));
    const d1 = new Date(2026, 0, 5, 23, 30), d2 = new Date(2026, 0, 6, 0, 10);   // heure locale
    eq(S.localDay(d1), '2026-01-05', 'à 23h30 locale, c’est encore le 5');
    eq(S.localDay(d2), '2026-01-06', 'à 00h10 locale, on est le 6');
    ok(S.localDay(new Date(2026, 5, 1)) === '2026-06-01', 'mois et jour sur deux chiffres');
    const utc = new Date(2026, 0, 5, 23, 30).toISOString().slice(0, 10);
    ok(utc === '2026-01-05' || utc === '2026-01-06', 'comparaison : l’ancienne méthode UTC pouvait décaler le jour (fuseau ' + (-new Date().getTimezoneOffset() / 60) + ' h)');

    // ---------- 2. Import / export ----------
    group('Import — validation et sécurité');
    ({ S } = await freshStore({}));
    S.ensureProfile();
    ok(!S.validate('').ok, 'fichier vide refusé');
    ok(!S.validate('pas du json').ok, 'texte non JSON refusé');
    ok(!S.validate('{"a":1}').ok, 'JSON qui n’est pas une sauvegarde LUMI refusé');
    ok(!S.validate(JSON.stringify({ v: 9, profiles: { a: {} } })).ok, 'version inconnue refusée');
    ok(!S.validate('x'.repeat(S.MAX_IMPORT + 1)).ok, 'fichier trop gros refusé');
    ok(!S.validate(JSON.stringify({ profiles: {} })).ok, 'aucun profil refusé');
    const evil = '{"v":2,"profiles":{"p9":{"id":"p9","name":"<img src=x onerror=alert(1)>","avatar":"zzz","age":99,"progress":{"__proto__":{"stars":3},"g:ok:1":{"stars":9,"plays":-5}},"rewards":[{"type":1}]}},"settings":{"volume":7,"evil":true,"lang":"xx"}}';
    const rv = S.validate(evil);
    ok(rv.ok, 'un fichier piégé est nettoyé et non exécuté');
    ok(rv.data.profiles.p9.avatar === 'awa' && rv.data.profiles.p9.age === 4, 'avatar et âge hors liste ramenés aux valeurs sûres');
    ok(rv.data.profiles.p9.progress['g:ok:1'].stars === 3 && rv.data.profiles.p9.progress['g:ok:1'].plays === 0, 'étoiles et compteurs bornés');
    ok(({}).stars === undefined && !Object.prototype.hasOwnProperty.call(rv.data.profiles.p9.progress, '__proto__'), 'clé « __proto__ » ignorée (pas de pollution)');
    ok(rv.data.settings.evil === undefined && rv.data.settings.volume === 1 && rv.data.settings.lang === undefined, 'réglages inconnus ou hors bornes écartés');
    ok(rv.data.profiles.p9.rewards.length === 0, 'récompense invalide ignorée');
    group('Import — fusion sans perte');
    ({ S, fake } = await freshStore({ 'lumi.v1': v1() }));
    const incoming = JSON.stringify({ v: 2, profiles: { p1: { id: 'p1', name: 'Awa', progress: { 'g:letters:listen': { stars: 1, plays: 9, errors: 0, hints: 0, last: 1, updated: '2026-02-01' }, 'g:numbers:count': { stars: 3, plays: 1, errors: 0, hints: 0, last: 3, updated: '2026-02-01' } }, rewards: [{ type: 'draw', item: 'mango', date: '2026-02-01' }], playTime: { '2026-01-01': 100, '2026-02-01': 50 }, storiesRead: ['baobab'] }, p2: { id: 'p2', name: 'Moussa', progress: {} } }, settings: {} });
    const rm = S.importData(incoming, 'merge');
    ok(rm.ok && rm.n === 2, 'fusion acceptée (2 profils)');
    ok(S.data().profiles.p1.progress['g:letters:listen'].stars === 3, 'la meilleure note est gardée (3 étoiles, pas 1)');
    ok(S.data().profiles.p1.progress['g:numbers:count'].stars === 3 && S.data().profiles.p1.progress['L-A'].stars === 2, 'les nouvelles étoiles sont ajoutées, les anciennes gardées');
    ok(S.data().profiles.p1.rewards.length === 2 && S.data().profiles.p1.storiesRead.length === 2, 'récompenses et histoires fusionnées');
    ok(S.data().profiles.p1.playTime['2026-01-01'] === 300 && S.data().profiles.p2, 'temps de jeu : maximum conservé ; nouveau profil ajouté');
    ok(fake.getItem('lumi.v1.backup') !== null && JSON.parse(fake.getItem('lumi.v1.backup')).profiles.p1.progress['L-A'].stars === 2, 'copie de sécurité de l’état d’avant import');
    ({ S } = await freshStore({ 'lumi.v1': v1() }));
    const rr = S.importData(incoming, 'replace');
    ok(rr.ok && Object.keys(S.data().profiles).length === 2 && S.data().profiles.p1.progress['L-A'] === undefined, 'le mode « remplacer » remplace bien');
    ({ S } = await freshStore({ 'lumi.v1': v1() }));
    const bad = S.importData('{"v":2,"profiles":"non"}', 'merge');
    ok(!bad.ok && S.data().profiles.p1.progress['L-A'].stars === 2, 'un fichier invalide ne modifie rien');
    group('Export');
    ({ S } = await freshStore({ 'lumi.v1': v1() }));
    const back = S.validate(S.exportJSON());
    ok(back.ok && back.data.profiles.p1.progress['g:letters:listen'].stars === 3, 'un export se réimporte tel quel');

    // ---------- 3. Effacement global ----------
    group('Effacement global');
    ({ S, fake } = await freshStore({ 'lumi.v1': v1(), 'lumi.v1.backup': '{}', 'lumi.v1.pre-v1': '{}', 'lumi.installNo': '1', autre: 'garder' }));
    let wiped = false; S.addWiper(async () => { wiped = true; });
    await S.wipeAll();
    ok(Object.keys(fake._m).filter(k => k.indexOf('lumi.') === 0).length === 0, 'toutes les clés « lumi.* » supprimées (données, copies, installation)');
    ok(fake.getItem('autre') === 'garder', 'les clés d’autres sites ne sont pas touchées');
    ok(wiped, 'les effaceurs enregistrés (enregistrements vocaux) sont appelés');
    ok(Object.keys(S.data().profiles).length === 0, 'plus aucun profil en mémoire');
    // vraie base IndexedDB de voix : testée seulement en local (jamais sur un site publié, pour ne pas effacer de vrais enregistrements)
    if (!(/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === 'file:')) { ok(true, 'test IndexedDB ignoré hors machine locale (protection des enregistrements)'); } else {
    await new Promise(r => setTimeout(r, 200));
    const probe = new Promise(res => { const q = indexedDB.open('lumi-voice', 1); q.onupgradeneeded = () => q.result.createObjectStore('clips'); q.onsuccess = () => { const tx = q.result.transaction('clips', 'readwrite'); tx.objectStore('clips').put(new Blob(['x']), 'fr:test'); tx.oncomplete = () => { q.result.close(); res(true); }; }; q.onerror = () => res(false); });
    await probe;
    await Sound.clearClips();
    const count = await new Promise(res => { const q = indexedDB.open('lumi-voice', 1); q.onupgradeneeded = () => q.result.createObjectStore('clips'); q.onsuccess = () => { const c = q.result.transaction('clips').objectStore('clips').count(); c.onsuccess = () => { q.result.close(); res(c.result); }; }; q.onerror = () => res(-1); });
    ok(count === 0 && Sound.clipCount() === 0, 'IndexedDB des voix vidée par clearClips'); }

    // ---------- 4. Règles parentales ----------
    group('Porte parentale');
    const ch = Rules.gateChallenge(() => 0.5);
    ok(ch.a + ch.b === ch.answer && ch.answer > 10, 'le défi est une addition d’adulte (réponse > 10)');
    ok(Rules.gateCheck(ch, String(ch.answer)) && !Rules.gateCheck(ch, String(ch.answer + 1)), 'bonne réponse acceptée, mauvaise refusée');
    ok(!Rules.gateCheck(ch, '') && !Rules.gateCheck(ch, 'abc') && !Rules.gateCheck(ch, '1e1'), 'saisies vides ou non numériques refusées');
    ok(Rules.GATE.maxTries === 3 && Rules.GATE.coolMs >= 30000 && Rules.GATE.holdMs >= 2000, 'blocage après 3 erreurs, maintien 2 s');
    group('Limites de temps : pause ≠ restriction');
    eq(Rules.sessionState({ playedToday: 100, breakMin: 0, lockMin: 0, sinceBreak: 9999 }), { lock: false, breakDue: false }, 'sans réglage : jamais de rappel ni de verrou');
    eq(Rules.sessionState({ playedToday: 100, breakMin: 10, lockMin: 0, sinceBreak: 600 }), { lock: false, breakDue: true }, 'rappel de pause après 10 min : l’enfant peut continuer (pas de verrou)');
    eq(Rules.sessionState({ playedToday: 1800, breakMin: 10, lockMin: 30, sinceBreak: 700 }), { lock: true, breakDue: false }, 'limite de la journée atteinte : verrou (le rappel s’efface)');
    eq(Rules.sessionState({ playedToday: 1800, breakMin: 0, lockMin: 30, sinceBreak: 0, extra: 600 }), { lock: false, breakDue: false }, 'une prolongation parentale de 10 min lève le verrou');
    eq(Rules.sessionState({ playedToday: 2400, breakMin: 0, lockMin: 30, sinceBreak: 0, extra: 600 }), { lock: true, breakDue: false }, '…mais le verrou revient quand la prolongation est épuisée');
    group('Difficulté par âge');
    ok(Rules.caps(3).countMax < Rules.caps(4).countMax && Rules.caps(4).countMax < Rules.caps(5).countMax, 'le comptage monte avec l’âge');
    ok(Rules.caps(3).pairs <= 2 && Rules.caps(5).pairs >= 3, 'mémoire : 2 paires à 3 ans, 4 à 5 ans');
    ok(Rules.caps(99).countMax === Rules.caps(4).countMax, 'âge inconnu : niveau intermédiaire');

    // ---------- 5. Compétences ----------
    group('Compétences (séparées des récompenses)');
    const pr = { progress: {}, skills: {} };
    Skills.update(pr, 'letters', 'listen', 3); Skills.update(pr, 'letters', 'listen', 3); Skills.update(pr, 'letters', 'listen', 3);
    eq(Skills.level(pr.skills['letters.recognize']), 2, '3 réussites parfaites → compétence acquise');
    Skills.update(pr, 'letters', 'listen', 0); Skills.update(pr, 'letters', 'listen', 0);
    ok(Skills.level(pr.skills['letters.recognize']) < 2, 'la compétence peut redescendre (les étoiles, non)');
    const p2 = { progress: { 'g:numbers:count': { stars: 3 }, 'L-A': { stars: 3 } }, skills: {} };
    Skills.rebuild(p2);
    ok(p2.skills['numbers.count'] && !p2.skills['letters.recognize'], 'reconstruction depuis la progression (anciennes clés ignorées)');
    ok(Skills.summary(p2).length === Skills.ALL.length, 'le résumé liste toutes les compétences');
    Games.CATS.forEach(c => c.games.forEach(g => { if (c.id !== 'stories' && !Skills.forGame(c.id, g.id).length) ok(false, 'jeu sans compétence : ' + c.id + '/' + g.id); }));
    ok(true, 'chaque jeu entraîne au moins une compétence');

    // ---------- 6. Localisation ----------
    group('Localisation FR / EN');
    eq(I18n.missingKeys(), [], 'aucune clé manquante entre le français et l’anglais');
    I18n.setLang('en'); ok(I18n.t('play') === 'Play' && I18n.t('cat.letters') === 'Letters', 'l’anglais fonctionne');
    const en = I18n.line('ask.letter.listen', { l: 'A' }); I18n.setLang('fr'); const fr = I18n.line('ask.letter.listen', { l: 'A' });
    ok(en.text !== fr.text && en.id !== fr.id, 'même phrase, texte et identifiant propres à chaque langue');
    ok(I18n.line('ask.plus', { a: 'une mangue', b: 'deux mangues', na: 1, nb: 2 }).id === 'fr:ask.plus|na=1,nb=2', 'l’identifiant ne dépend pas du texte traduit');
    ok(I18n.line('ask.count').id === 'fr:ask.count', 'identifiant stable sans paramètre');
    ok(/\{/.test(I18n.t('ask.letter.listen', { l: 'A' })) === false, 'aucun paramètre non remplacé');

    // ---------- 7. Jeux ----------
    group('Jeux — cohérence des manches (3 âges × 2 langues)');
    const langs = ['fr', 'en'];
    for (const lg of langs) for (const age of [3, 4, 5]) {
      I18n.setLang(lg); let bad = [];
      Games.CATS.forEach(c => c.games.forEach(g => {
        [3, 2].forEach(n => {
          let rounds; try { rounds = g.make(n, { age }); } catch (e) { bad.push(c.id + '/' + g.id + ' erreur ' + e.message); return; }
          if (!rounds.length) bad.push(c.id + '/' + g.id + ' aucune manche');
          rounds.forEach((r, i) => {
            const where = `${lg}/${age}/${c.id}/${g.id}#${i}`;
            if (!r.ask || !r.ask.id || !r.ask.text || /\{|undefined|NaN/.test(r.ask.text)) bad.push(where + ' consigne invalide: ' + (r.ask && r.ask.text));
            if (r.type === 'choose') {
              if (r.choices.filter(x => x.ok).length !== 1) bad.push(where + ' il faut exactement 1 bonne réponse');
              if (r.choices.length < 2) bad.push(where + ' moins de 2 choix');
              r.choices.forEach(x => { if (x.say && /undefined|NaN|\{/.test(x.say.text)) bad.push(where + ' phrase de réponse invalide'); });
            }
            if (r.type === 'drag') {
              const keys = r.slots.map(s => s.key);
              r.items.forEach(it => { if (!keys.includes(it.to)) bad.push(where + ' élément sans emplacement: ' + it.id); });
              if (r.scene) r.slots.forEach(s => { if (!s.full) bad.push(where + ' emplacement sans version remplie'); });
            }
            if (r.type === 'fill' && !(r.n >= 1 && r.n <= 5)) bad.push(where + ' panier hors bornes');
            if (r.type === 'memory' && (r.pairs.length < 2 || r.pairs.length > Rules.caps(age).pairs)) bad.push(where + ' paires hors bornes pour l’âge');
            if (r.type === 'melody' && r.len > Rules.caps(age).melody[2]) bad.push(where + ' mélodie trop longue pour l’âge');
          });
        });
      }));
      ok(bad.length === 0, `toutes les manches valides (${lg}, ${age} ans)`, bad.slice(0, 5).join(' | '));
    }
    I18n.setLang('fr');
    group('Jeux — adaptation à l’âge');
    const maxCount = age => { let m = 0; for (let i = 0; i < 30; i++) Games.CATS.find(c => c.id === 'numbers').games[0].make(3, { age }).forEach(r => { const k = (r.show.match(/class="it"/g) || []).length; m = Math.max(m, k); }); return m; };
    ok(maxCount(3) <= 3 && maxCount(4) <= 5 && maxCount(5) <= 7, 'à 3 ans on compte jusqu’à 3 au plus, à 4 ans 5, à 5 ans 7');
    const plusMax = age => { let m = 0; for (let i = 0; i < 30; i++) Games.CATS.find(c => c.id === 'numbers').games[2].make(3, { age }).forEach(r => { m = Math.max(m, +r.choices.find(x => x.ok).h); }); return m; };
    ok(plusMax(3) <= 3 && plusMax(4) <= 5, 'les additions restent petites pour les plus jeunes');
    ok(Games.CATS.every(c => c.games.every(g => [3, 4, 5].includes(g.lvl))), 'chaque jeu a un niveau d’âge (3, 4 ou 5)');
    ok(Games.CATS.find(c => c.id === 'colors').games.find(g => g.id === 'mix').lvl === 5, 'le mélange de couleurs est réservé aux 5 ans');

    // ---------- 7b. Voix et volume (synthèse simulée) ----------
    group('Voix — volume, langue et enregistrements par identifiant');
    const sS = Store.s(), keep = Object.assign({}, sS), capt = [], oSpeak = speechSynthesis.speak, oGet = speechSynthesis.getVoices;
    const oUtt = window.SpeechSynthesisUtterance; window.SpeechSynthesisUtterance = function (text) { this.text = text; };   // énoncé simulé : accepte des voix factices
    speechSynthesis.speak = u => { capt.push(u); };
    const V = (name, lang) => ({ name, lang, localService: true });
    const setVoices = list => { speechSynthesis.getVoices = () => list; Sound.refresh(); };
    const say = async l => { capt.length = 0; Sound.speak(l); await new Promise(r => setTimeout(r, 400)); return capt[0]; };
    Object.assign(sS, { voice: true, rec: false, vname: '', rate: 0.85, pitch: 1.1 }); I18n.setLang('fr'); setVoices([V('Voix FR', 'fr-FR'), V('Voice EN', 'en-US')]);
    sS.volume = 0.3; let u = await say(I18n.line('hello'));
    ok(u && Math.abs(u.volume - 0.3) < 1e-9, 'le volume réglé (0,3) est appliqué à la voix de synthèse');
    Sound.setVolume(0); u = await say(I18n.line('hello')); ok(u && u.volume === 0, 'volume 0 = silence réel (et non « volume par défaut »)');
    Sound.setVolume(7); u = await say(I18n.line('hello')); ok(u && u.volume === 1, 'volume hors bornes ramené à 1');
    Sound.setVolume(-3); ok(Sound.vol() === 0, 'volume négatif ramené à 0');
    sS.volume = 'abc'; ok(Sound.vol() === 0.9, 'volume corrompu → valeur par défaut sûre');
    Sound.setVolume(0.8);
    u = await say(I18n.line('hello')); ok(u && u.voice && u.voice.name === 'Voix FR' && u.lang === 'fr-FR', 'voix française choisie en français');
    I18n.setLang('en'); Sound.refresh(); u = await say(I18n.line('hello')); ok(u && u.voice && u.voice.name === 'Voice EN', 'voix anglaise choisie en anglais');
    I18n.setLang('fr'); setVoices([V('Voice EN', 'en-US')]); u = await say(I18n.line('hello'));
    ok(u === undefined, 'aucune voix française : silence (jamais de français lu avec une voix anglaise)');
    setVoices([V('Voix FR', 'fr-FR')]);
    const l1 = I18n.line('ask.count'); capt.length = 0;
    Sound.saveClip(l1, new Blob([new Uint8Array(200)], { type: 'audio/webm' }));
    ok(Sound.hasClip(l1) && Sound.hasClip({ id: l1.id, text: 'une toute autre formulation' }), 'un enregistrement se retrouve par identifiant, même si le texte change');
    u = await say({ id: l1.id, text: 'texte reformulé' }); ok(u === undefined, 'la voix enregistrée a priorité sur la synthèse');
    ok(!Sound.hasClip(I18n.line('ask.letter.listen', { l: 'A' })), 'une autre phrase n’est pas confondue');
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) await Sound.clearClips();
    Object.assign(sS, keep); Store.save(); speechSynthesis.speak = oSpeak; speechSynthesis.getVoices = oGet; window.SpeechSynthesisUtterance = oUtt; Sound.refresh();

    // ---------- 8. Application (copie vivante) ----------
    group('Application — écrans');
    const A = window.LumiApp;
    if (A) {
      has(() => { A.go('home'); if (!document.querySelector('.cat')) throw new Error('accueil vide'); }, 'accueil affiché');
      has(() => { A.go('trophies'); if (!document.querySelector('.coll')) throw new Error('trophées vides'); }, 'trophées affichés');
      has(() => { A.go('recre'); A.go('missions'); A.go('garage'); }, 'écrans de récré affichés');
      const done = [];
      Games.CATS.forEach(c => c.games.forEach(g => { try { A.startGame(c.id, g.id); done.push(document.querySelector('.play') ? 1 : 0); } catch (e) { done.push(0); } }));
      ok(done.every(x => x === 1) && done.length >= 38, `les ${done.length} jeux et histoires s’ouvrent`);
      has(() => { A.openGate('parent'); if (!document.getElementById('hold')) throw new Error('pas de maintien'); }, 'la porte parentale demande d’abord un maintien');
      ok(!document.querySelector('.hold') === false, 'le bouton de maintien est présent');
      A.go('home');
    } else ok(false, 'application non chargée dans la page de test');
    return results;
  }
  window.__runLumiTests = run;
})();
