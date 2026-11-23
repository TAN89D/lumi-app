// Sauvegarde locale de LUMI (localStorage). Aucune donnée ne quitte l'appareil.
// Données VERSIONNÉES (SCHEMA) avec migrations automatiques ; la clé de production reste « lumi.v1 » pour ne perdre aucune progression.
// Les clés sont isolées par environnement (voir env.js) : une prévisualisation ne lit ni n'efface jamais les données de la production.
(function () {
  const KEY = Env.k('v1'), SCHEMA = 3, MAX_IMPORT = 2 * 1024 * 1024, BAD = ['__proto__', 'constructor', 'prototype'];
  const AVATARS = ['awa', 'abdou', 'fanta', 'moussa'];
  const defSettings = () => ({ lang: 'fr', voice: true, sfx: true, volume: 0.9, textScale: 1, big: false, calm: false, contrast: false, breakMin: 0, lockMin: 0, minis: true, rec: false, vname: '', rate: 0.85, pitch: 1.1 });
  const defaults = () => ({ v: SCHEMA, active: null, profiles: {}, settings: defSettings() });
  const wipers = [], errListeners = [];
  const st = { level: 'ok', msg: '' };    // ok | fail | corrupt | unavailable
  const notify = () => errListeners.forEach(f => { try { f(st); } catch (e) {} });
  const setStatus = (level, msg) => { st.level = level; st.msg = msg || ''; notify(); };

  // Date LOCALE (et non UTC) : la journée de jeu change à minuit chez l'enfant, pas à l'heure de Greenwich.
  const localDay = d => { d = d || new Date(); const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
  const newProfile = (id, name, avatar, age) => ({ id, name: String(name || '').trim().slice(0, 20), avatar: AVATARS.includes(avatar) ? avatar : 'awa', age: [3, 4, 5, 6, 7, 8].includes(+age) ? +age : 4,
    created: Date.now(), progress: {}, rewards: [], playTime: {}, storiesRead: [], skills: {}, recre: 0, stickers: [] });

  // ---- migrations : MIGRATIONS[n] fait passer de la version n à n+1 (additives : on n'enlève jamais de données) ----
  const MIGRATIONS = {
    1: o => {
      const s = o.settings || {};
      if (s.limitMin !== undefined) { s.breakMin = +s.limitMin || 0; delete s.limitMin; }   // l'ancienne « limite » n'était qu'un rappel
      o.settings = Object.assign(defSettings(), s);
      Object.values(o.profiles || {}).forEach(p => {
        p.age = [3, 4, 5, 6, 7, 8].includes(+p.age) ? +p.age : 4; p.skills = p.skills || {}; p.recre = +p.recre || 0;
        p.progress = p.progress || {}; p.rewards = Array.isArray(p.rewards) ? p.rewards : []; p.playTime = p.playTime || {}; p.storiesRead = Array.isArray(p.storiesRead) ? p.storiesRead : [];
      });
      o.v = 2; return o;
    },
    2: o => {   // compétences : on AJOUTE l'historique (h), le nombre de jours (d) et le dernier jour, sans toucher au score ni au nombre de parties
      Object.values(o.profiles || {}).forEach(p => { Object.keys(p.skills || {}).forEach(k => { const s = p.skills[k]; if (s && typeof s === 'object') { if (!Array.isArray(s.h)) s.h = []; if (typeof s.d !== 'number') s.d = 0; if (typeof s.last !== 'string') s.last = ''; } }); });
      o.v = 3; return o;
    }
  };
  function migrate(o) {
    let v = +o.v || 1;
    if (v > SCHEMA) throw new Error('version');
    if (v < SCHEMA) { try { localStorage.setItem(KEY + '.pre-v' + v, JSON.stringify(o)); } catch (e) {} }   // copie de sécurité avant migration
    while (v < SCHEMA) { o = MIGRATIONS[v](o); v = +o.v; }
    o.settings = Object.assign(defSettings(), o.settings || {});
    return o;
  }

  // ---- chargement ----
  let data = defaults(), raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { setStatus('unavailable', 'stockage indisponible'); }
  if (raw) {
    try { const o = JSON.parse(raw); if (!o || typeof o !== 'object' || typeof o.profiles !== 'object' || o.profiles === null) throw new Error('forme'); data = migrate(o); }
    catch (e) { try { localStorage.setItem(KEY + '.corrupt', raw); } catch (_) {} data = defaults(); setStatus('corrupt', String(e.message)); }
  }
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); if (st.level === 'fail') setStatus('ok'); return true; }
    catch (e) { setStatus('fail', String(e && e.name)); return false; }
  };

  // ---- validation d'un fichier importé : liste blanche, bornes, aucune clé dangereuse ----
  const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
  const okKey = k => typeof k === 'string' && k.length <= 60 && !BAD.includes(k) && /^[\w:.\-]+$/.test(k);
  const int = (x, a, b, d) => { x = Math.round(+x); return isFinite(x) ? Math.min(b, Math.max(a, x)) : d; };
  function validate(text) {
    if (typeof text !== 'string' || !text.trim()) return { ok: false, why: 'fichier vide' };
    if (text.length > MAX_IMPORT) return { ok: false, why: 'fichier trop volumineux' };
    let o; try { o = JSON.parse(text); } catch (e) { return { ok: false, why: 'ce n’est pas un fichier JSON valide' }; }
    if (!isObj(o) || !isObj(o.profiles)) return { ok: false, why: 'ce n’est pas une sauvegarde LUMI' };
    if (o.v !== undefined && (+o.v > SCHEMA || +o.v < 1)) return { ok: false, why: 'version de sauvegarde inconnue (' + o.v + ')' };
    const ids = Object.keys(o.profiles).filter(okKey);
    if (!ids.length) return { ok: false, why: 'aucun profil dans le fichier' };
    if (ids.length > 12) return { ok: false, why: 'trop de profils' };
    const out = { v: SCHEMA, active: null, profiles: {}, settings: isObj(o.settings) ? Object.assign({}, o.settings) : {} };
    if (out.settings.limitMin !== undefined && out.settings.breakMin === undefined) out.settings.breakMin = +out.settings.limitMin || 0;   // sauvegarde V1 : l'ancienne limite devient un rappel
    ids.forEach(id => {
      const p = o.profiles[id]; if (!isObj(p)) return;
      const c = newProfile(id, typeof p.name === 'string' ? p.name : '', p.avatar, p.age);
      c.created = int(p.created, 0, 4e12, Date.now());
      if (isObj(p.progress)) Object.keys(p.progress).filter(okKey).forEach(k => { const x = p.progress[k]; if (isObj(x)) c.progress[k] = { stars: int(x.stars, 0, 3, 0), last: int(x.last, 0, 3, 0), plays: int(x.plays, 0, 1e6, 0), errors: int(x.errors, 0, 1e6, 0), hints: int(x.hints, 0, 1e6, 0), updated: typeof x.updated === 'string' ? x.updated.slice(0, 10) : '' }; });
      if (Array.isArray(p.rewards)) p.rewards.slice(0, 500).forEach(r => { if (isObj(r) && typeof r.type === 'string' && typeof r.item === 'string') c.rewards.push({ id: (r.type + ':' + r.item).slice(0, 80), type: r.type.slice(0, 20), item: r.item.slice(0, 40), date: typeof r.date === 'string' ? r.date.slice(0, 10) : '' }); });
      if (isObj(p.playTime)) Object.keys(p.playTime).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).forEach(k => { c.playTime[k] = int(p.playTime[k], 0, 86400, 0); });
      if (Array.isArray(p.storiesRead)) c.storiesRead = p.storiesRead.filter(x => typeof x === 'string').slice(0, 100).map(x => x.slice(0, 40));
      if (isObj(p.skills)) Object.keys(p.skills).filter(okKey).forEach(k => { const x = p.skills[k]; if (isObj(x)) c.skills[k] = { score: Math.min(1, Math.max(0, +x.score || 0)), plays: int(x.plays, 0, 1e6, 0), h: Array.isArray(x.h) ? x.h.slice(-10).map(n => int(n, 0, 3, 0)) : [], d: int(x.d, 0, 1e5, 0), last: typeof x.last === 'string' ? x.last.slice(0, 10) : '' }; });
      c.recre = int(p.recre, 0, 1e6, 0);
      c.stickers = Array.isArray(p.stickers) ? p.stickers.filter(x => typeof x === 'string' && /^[a-z]{3,12}$/.test(x)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 20) : [];   // autocollants du Voyage de Lumi
      if (isObj(p.garage)) c.garage = { vehicle: String(p.garage.vehicle || '').slice(0, 8), pilot: String(p.garage.pilot || '').slice(0, 8) };
      ['minis', 'missions'].forEach(m => { if (isObj(p[m])) { c[m] = {}; Object.keys(p[m]).filter(okKey).forEach(k => { c[m][k] = int(p[m][k], 0, 1e6, 0); }); } });
      out.profiles[id] = c;
    });
    if (!Object.keys(out.profiles).length) return { ok: false, why: 'aucun profil lisible' };
    const S = defSettings(), s = {};   // réglages : seulement les clés connues, du bon type
    Object.keys(S).forEach(k => { const v = out.settings[k]; if (v !== undefined && typeof v === typeof S[k]) s[k] = v; });
    if (s.volume !== undefined) s.volume = Math.min(1, Math.max(0, s.volume));
    if (s.lang && !['fr', 'en'].includes(s.lang)) delete s.lang;
    out.settings = s;
    return { ok: true, data: out, from: +o.v || 1 };
  }
  const clone = x => JSON.parse(JSON.stringify(x));
  const betterSkill = (a, b) => (!a ? b : !b ? a : (b.plays || 0) > (a.plays || 0) ? b : a);
  function mergeData(cur, inc) {
    Object.values(inc.profiles).forEach(ip => {
      const cp = cur.profiles[ip.id];
      if (!cp) { cur.profiles[ip.id] = ip; return; }
      Object.keys(ip.progress).forEach(k => { const a = cp.progress[k], b = ip.progress[k]; cp.progress[k] = !a ? b : { stars: Math.max(a.stars, b.stars), last: b.last, plays: Math.max(a.plays, b.plays), errors: Math.max(a.errors, b.errors), hints: Math.max(a.hints, b.hints), updated: a.updated > b.updated ? a.updated : b.updated }; });
      ip.rewards.forEach(rw => { if (!cp.rewards.some(x => x.id === rw.id)) cp.rewards.push(rw); });
      Object.keys(ip.playTime).forEach(d => { cp.playTime[d] = Math.max(cp.playTime[d] || 0, ip.playTime[d]); });
      ip.storiesRead.forEach(s => { if (!cp.storiesRead.includes(s)) cp.storiesRead.push(s); });
      cp.recre = Math.max(cp.recre || 0, ip.recre || 0);
      Object.keys(ip.skills || {}).forEach(k => { cp.skills[k] = betterSkill(cp.skills[k], ip.skills[k]); });   // l'historique le plus riche est gardé, jamais remis à zéro
    });
    return cur;
  }
  // Import : les nouvelles données sont PRÉPARÉES à part, leur écriture est vérifiée possible (écriture d'essai), puis seulement
  // alors elles remplacent l'état actuel. En cas d'échec, l'état précédent reste intact (en mémoire ET dans le stockage).
  // mode : 'merge' (garde le meilleur de chaque côté) ou 'replace'.
  function importData(text, mode) {
    const r = validate(text); if (!r.ok) return r;
    const inc = r.data; let next;
    if (mode === 'replace') { next = Object.assign(defaults(), { profiles: inc.profiles, settings: Object.assign(defSettings(), inc.settings) }); }
    else { next = mergeData(clone(data), inc); }
    if (!next.profiles[next.active]) next.active = Object.keys(next.profiles)[0] || null;
    next.v = SCHEMA;
    const str = JSON.stringify(next), before = (() => { try { return localStorage.getItem(KEY); } catch (e) { return null; } })();
    try { localStorage.setItem(KEY + '.tmp', str); localStorage.removeItem(KEY + '.tmp'); }   // écriture d'essai de la taille exacte
    catch (e) { try { localStorage.removeItem(KEY + '.tmp'); } catch (_) {} setStatus('fail', String(e && e.name)); return { ok: false, kept: true, why: 'stockage plein ou bloqué : l’import est annulé, vos données actuelles sont conservées' }; }
    try { localStorage.setItem(KEY + '.backup', JSON.stringify(data)); } catch (e) { /* la copie est un plus ; l'import peut continuer si l'écriture principale passe */ }
    try { localStorage.setItem(KEY, str); if (localStorage.getItem(KEY) !== str) throw new Error('relecture'); }
    catch (e) {
      try { if (before === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, before); } catch (_) {}   // on remet l'état d'avant
      setStatus('fail', String(e && e.name || e.message)); return { ok: false, kept: true, why: 'écriture impossible : l’import est annulé, vos données actuelles sont conservées' };
    }
    data = next; if (st.level === 'fail') setStatus('ok');
    return { ok: true, n: Object.keys(inc.profiles).length, from: r.from };
  }

  const Store = {
    SCHEMA, AVATARS, KEY, data: () => data, save, localDay, today: () => localDay(), status: st, validate, importData, defSettings,
    onStatus: f => { errListeners.push(f); }, addWiper: f => { wipers.push(f); },
    s: () => data.settings,
    profile: () => data.profiles[data.active] || null,
    profiles: () => Object.values(data.profiles),
    ensureProfile() {
      if (this.profile()) return this.profile();
      const k = Object.keys(data.profiles)[0]; if (k) { data.active = k; save(); return data.profiles[k]; }
      return this.createProfile('', 'awa', 4);
    },
    createProfile(name, avatar, age) {
      if (Object.keys(data.profiles).length >= 8) return null;
      const id = 'p' + Date.now() + Math.floor(Math.random() * 1000);
      data.profiles[id] = newProfile(id, name, avatar, age); data.active = id; save(); return data.profiles[id];
    },
    setActive(id) { if (data.profiles[id]) { data.active = id; save(); } },
    deleteProfile(id) {
      delete data.profiles[id];
      if (data.active === id) data.active = Object.keys(data.profiles)[0] || null;
      if (!data.active) this.createProfile('', 'awa', 4); else save();
    },
    addTime(sec) { const p = this.profile(); if (!p) return; const d = localDay(); p.playTime[d] = (p.playTime[d] || 0) + sec; save(); },
    playedToday() { const p = this.profile(); return p ? (p.playTime[localDay()] || 0) : 0; },
    record(id, stars, errors, hints) {   // on garde toujours le meilleur nombre d'étoiles
      const p = this.profile(); if (!p) return { first: false };
      const old = p.progress[id], first = !old;
      p.progress[id] = { stars: Math.max(stars, old ? old.stars : 0), last: stars, plays: (old ? old.plays : 0) + 1, errors: (old ? old.errors : 0) + errors, hints: (old ? old.hints : 0) + hints, updated: localDay() };
      save(); return { first };
    },
    addReward(type, item) {
      const p = this.profile(); if (!p) return;
      if (!p.rewards.some(r => r.type === type && r.item === item)) { p.rewards.push({ id: type + ':' + item, type, item, date: localDay() }); save(); }
    },
    exportJSON: () => JSON.stringify(Object.assign({ exported: new Date().toISOString(), note: 'Les enregistrements vocaux restent sur l’appareil et ne sont pas inclus.' }, data), null, 2),
    // Effacement TOTAL, étape par étape. Chaque opération est CONTRÔLÉE (relecture) ; le résultat dit précisément ce qui a réussi ou non.
    // Il peut être relancé : refaire l'appel ne fait que terminer ce qui reste. Aucune fausse confirmation : ok = vrai SEULEMENT si tout est effacé.
    async wipeAll() {
      const steps = [], ls = { name: 'localStorage', ok: true, failed: [] };
      try {
        const ks = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && Env.owns(k)) ks.push(k); }
        ks.forEach(k => { try { localStorage.removeItem(k); } catch (e) { ls.failed.push(k); } });
        ks.forEach(k => { try { if (localStorage.getItem(k) !== null && ls.failed.indexOf(k) < 0) ls.failed.push(k); } catch (e) { if (ls.failed.indexOf(k) < 0) ls.failed.push(k); } });
        ls.ok = ls.failed.length === 0; if (!ls.ok) ls.why = 'clés non supprimées : ' + ls.failed.join(', ');
      } catch (e) { ls.ok = false; ls.why = String(e && e.name || e); }
      steps.push(ls);
      for (const w of wipers) {
        let r; try { r = await w(); } catch (e) { r = { ok: false, name: 'effaceur', why: String(e && e.name || e) }; }
        if (r === true || r === undefined) r = { ok: true, name: 'effaceur' }; else if (r === false) r = { ok: false, name: 'effaceur', why: 'échec' };
        steps.push(r);
      }
      if (ls.ok) data = defaults();   // la mémoire n'est vidée que si le stockage l'est vraiment : sinon on ne ré-écrase rien
      const ok = steps.every(s => s.ok);
      const res = { ok, partial: !ok && steps.some(s => s.ok), steps, failed: steps.filter(s => !s.ok) };
      Store.lastWipe = res; return res;
    }
  };
  Store.MIGRATIONS = MIGRATIONS; Store._migrate = migrate; Store.MAX_IMPORT = MAX_IMPORT;
  window.Store = Store;
})();
