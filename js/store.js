// Sauvegarde locale de LUMI (localStorage). Aucune donnée ne quitte l'appareil.
// Données VERSIONNÉES (SCHEMA) avec migrations automatiques ; la clé reste « lumi.v1 » pour ne perdre aucune progression.
(function () {
  const KEY = 'lumi.v1', SCHEMA = 2, MAX_IMPORT = 2 * 1024 * 1024, BAD = ['__proto__', 'constructor', 'prototype'];
  const AVATARS = ['awa', 'abdou', 'fanta', 'moussa'];
  const defSettings = () => ({ lang: 'fr', voice: true, sfx: true, volume: 0.9, textScale: 1, big: false, calm: false, contrast: false, breakMin: 0, lockMin: 0, minis: true, rec: false, vname: '', rate: 0.85, pitch: 1.1 });
  const defaults = () => ({ v: SCHEMA, active: null, profiles: {}, settings: defSettings() });
  const wipers = [], errListeners = [];
  const st = { level: 'ok', msg: '' };    // ok | fail | corrupt | unavailable
  const notify = () => errListeners.forEach(f => { try { f(st); } catch (e) {} });
  const setStatus = (level, msg) => { st.level = level; st.msg = msg || ''; notify(); };

  // Date LOCALE (et non UTC) : la journée de jeu change à minuit chez l'enfant, pas à l'heure de Greenwich.
  const localDay = d => { d = d || new Date(); const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };

  const newProfile = (id, name, avatar, age) => ({ id, name: String(name || '').trim().slice(0, 20), avatar: AVATARS.includes(avatar) ? avatar : 'awa', age: [3, 4, 5].includes(+age) ? +age : 4,
    created: Date.now(), progress: {}, rewards: [], playTime: {}, storiesRead: [], skills: {}, recre: 0 });

  // ---- migrations : MIGRATIONS[n] fait passer de la version n à n+1 ----
  const MIGRATIONS = {
    1: o => {
      const s = o.settings || {};
      if (s.limitMin !== undefined) { s.breakMin = +s.limitMin || 0; delete s.limitMin; }   // l'ancienne « limite » n'était qu'un rappel
      o.settings = Object.assign(defSettings(), s);
      Object.values(o.profiles || {}).forEach(p => {
        p.age = [3, 4, 5].includes(+p.age) ? +p.age : 4; p.skills = p.skills || {}; p.recre = +p.recre || 0;
        p.progress = p.progress || {}; p.rewards = Array.isArray(p.rewards) ? p.rewards : []; p.playTime = p.playTime || {}; p.storiesRead = Array.isArray(p.storiesRead) ? p.storiesRead : [];
      });
      o.v = 2; return o;
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
    const out = { v: +o.v || 1, active: null, profiles: {}, settings: isObj(o.settings) ? o.settings : {} };
    ids.forEach(id => {
      const p = o.profiles[id]; if (!isObj(p)) return;
      const c = newProfile(id, typeof p.name === 'string' ? p.name : '', p.avatar, p.age);
      c.created = int(p.created, 0, 4e12, Date.now());
      if (isObj(p.progress)) Object.keys(p.progress).filter(okKey).forEach(k => { const x = p.progress[k]; if (isObj(x)) c.progress[k] = { stars: int(x.stars, 0, 3, 0), last: int(x.last, 0, 3, 0), plays: int(x.plays, 0, 1e6, 0), errors: int(x.errors, 0, 1e6, 0), hints: int(x.hints, 0, 1e6, 0), updated: typeof x.updated === 'string' ? x.updated.slice(0, 10) : '' }; });
      if (Array.isArray(p.rewards)) p.rewards.slice(0, 500).forEach(r => { if (isObj(r) && typeof r.type === 'string' && typeof r.item === 'string') c.rewards.push({ id: (r.type + ':' + r.item).slice(0, 80), type: r.type.slice(0, 20), item: r.item.slice(0, 40), date: typeof r.date === 'string' ? r.date.slice(0, 10) : '' }); });
      if (isObj(p.playTime)) Object.keys(p.playTime).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).forEach(k => { c.playTime[k] = int(p.playTime[k], 0, 86400, 0); });
      if (Array.isArray(p.storiesRead)) c.storiesRead = p.storiesRead.filter(x => typeof x === 'string').slice(0, 100).map(x => x.slice(0, 40));
      if (isObj(p.skills)) Object.keys(p.skills).filter(okKey).forEach(k => { const x = p.skills[k]; if (isObj(x)) c.skills[k] = { score: Math.min(1, Math.max(0, +x.score || 0)), plays: int(x.plays, 0, 1e6, 0) }; });
      c.recre = int(p.recre, 0, 1e6, 0);
      if (isObj(p.garage)) c.garage = { vehicle: String(p.garage.vehicle || '').slice(0, 8), pilot: String(p.garage.pilot || '').slice(0, 8) };
      ['minis', 'missions'].forEach(m => { if (isObj(p[m])) { c[m] = {}; Object.keys(p[m]).filter(okKey).forEach(k => { c[m][k] = int(p[m][k], 0, 1e6, 0); }); } });
      out.profiles[id] = c;
    });
    if (!Object.keys(out.profiles).length) return { ok: false, why: 'aucun profil lisible' };
    const S = defSettings(), s = {};   // réglages : seulement les clés connues, du bon type
    Object.keys(S).forEach(k => { const v = out.settings[k]; if (v !== undefined && typeof v === typeof S[k]) s[k] = v; });
    ['volume'].forEach(k => { if (s[k] !== undefined) s[k] = Math.min(1, Math.max(0, s[k])); });
    if (s.lang && !['fr', 'en'].includes(s.lang)) delete s.lang;
    out.settings = s; out.v = SCHEMA;
    return { ok: true, data: out };
  }
  // mode : 'merge' (garde le meilleur de chaque côté, ne perd rien) ou 'replace'
  function importData(text, mode) {
    const r = validate(text); if (!r.ok) return r;
    try { localStorage.setItem(KEY + '.backup', JSON.stringify(data)); } catch (e) {}   // copie de sécurité de l'état actuel
    const inc = r.data;
    if (mode === 'replace') { data = Object.assign(defaults(), { profiles: inc.profiles, settings: Object.assign(defSettings(), inc.settings) }); data.active = Object.keys(data.profiles)[0]; }
    else {
      Object.values(inc.profiles).forEach(ip => {
        const cp = data.profiles[ip.id];
        if (!cp) { data.profiles[ip.id] = ip; return; }
        Object.keys(ip.progress).forEach(k => { const a = cp.progress[k], b = ip.progress[k]; cp.progress[k] = !a ? b : { stars: Math.max(a.stars, b.stars), last: b.last, plays: Math.max(a.plays, b.plays), errors: Math.max(a.errors, b.errors), hints: Math.max(a.hints, b.hints), updated: a.updated > b.updated ? a.updated : b.updated }; });
        ip.rewards.forEach(rw => { if (!cp.rewards.some(x => x.id === rw.id)) cp.rewards.push(rw); });
        Object.keys(ip.playTime).forEach(d => { cp.playTime[d] = Math.max(cp.playTime[d] || 0, ip.playTime[d]); });
        ip.storiesRead.forEach(s => { if (!cp.storiesRead.includes(s)) cp.storiesRead.push(s); });
        cp.recre = Math.max(cp.recre || 0, ip.recre || 0); cp.skills = {};   // les compétences sont recalculées depuis la progression
      });
    }
    if (!data.profiles[data.active]) data.active = Object.keys(data.profiles)[0] || null;
    const ok = save();
    return ok ? { ok: true, n: Object.keys(inc.profiles).length } : { ok: false, why: 'sauvegarde impossible après import (stockage plein ?)' };
  }

  const Store = {
    SCHEMA, AVATARS, data: () => data, save, localDay, today: () => localDay(), status: st, validate, importData, defSettings,
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
    // Enregistre une réussite : on garde toujours le meilleur nombre d'étoiles.
    record(id, stars, errors, hints) {
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
    // Effacement TOTAL : réglages, profils, progression, copies de sécurité, préférences d'installation et enregistrements vocaux (IndexedDB).
    async wipeAll() {
      try { const ks = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('lumi.') === 0) ks.push(k); } ks.forEach(k => localStorage.removeItem(k)); } catch (e) {}
      data = defaults();
      for (const w of wipers) { try { await w(); } catch (e) {} }
      return true;
    }
  };
  Store.MIGRATIONS = MIGRATIONS; Store._migrate = migrate; Store.MAX_IMPORT = MAX_IMPORT;
  window.Store = Store;
})();
