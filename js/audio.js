// Audio : voix enregistrée (prioritaire), sinon voix de synthèse du navigateur, plus de petits effets sonores générés.
// Chaque phrase est identifiée par un ID STABLE (voir I18n.line) : on peut reformuler un texte sans perdre les enregistrements.
window.Sound = (function () {
  let ctx, voice = null, voiceLang = '';
  const synth = window.speechSynthesis;
  const st = () => Store.s();
  const vol = () => { const v = +st().volume; return isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.9; };   // toujours entre 0 et 1
  let noVoiceCb = null, noVoiceShown = {};

  // ---- choix de la voix de synthèse (jamais une voix d'une autre langue) ----
  function pickVoice() {
    if (!synth) return null;
    const lang = I18n.speech().toLowerCase(), base = lang.slice(0, 2);
    const vs = synth.getVoices().filter(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(base));
    if (!vs.length) return null;
    const chosen = st().vname && vs.find(v => v.name === st().vname);
    if (chosen) return chosen;
    const score = v => (v.lang.toLowerCase().replace('_', '-') === lang ? 4 : 0) + (/natural|online/i.test(v.name) ? 5 : 0)
      + (/google|hortense|denise|julie|amelie|thomas|audrey|aria|jenny|samantha/i.test(v.name) ? 2 : 0) + (v.localService ? 1 : 0);
    return vs.sort((a, b) => score(b) - score(a))[0];
  }
  function voices() {
    if (!synth) return [];
    const base = I18n.speech().slice(0, 2).toLowerCase();
    return synth.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith(base)).map(v => v.name);
  }
  function refresh() { voice = pickVoice(); voiceLang = I18n.speech(); }
  if (synth) { refresh(); synth.addEventListener && synth.addEventListener('voiceschanged', refresh); }
  const noVoice = () => !synth || (!voice && synth.getVoices().length > 0);   // pas de synthèse, ou des voix mais aucune dans la langue

  // ---- voix enregistrée : IndexedDB, clés = identifiants de phrases ----
  const clips = new Map(), norm = t => String(t).toLowerCase().replace(/\s+/g, ' ').trim();
  const DB = () => Env.dbName;
  let db = null, playing = null, dbReady = null;
  function openDB() {
    if (dbReady) return dbReady;
    dbReady = new Promise(res => {
      if (!window.indexedDB) { res(null); return; }
      try {
        const rq = indexedDB.open(DB(), 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore('clips');
        rq.onsuccess = () => {
          db = rq.result;
          db.onversionchange = () => { try { db.close(); } catch (e) {} db = null; dbReady = null; };   // un effacement lancé depuis un autre onglet ne reste pas bloqué
          db.transaction('clips').objectStore('clips').openCursor().onsuccess = e => { const c = e.target.result; if (c) { clips.set(c.key, URL.createObjectURL(c.value)); c.continue(); } else res(db); };
        };
        rq.onerror = () => { dbReady = null; res(null); }; rq.onblocked = () => { /* attend la fermeture de l'autre onglet */ };
      } catch (e) { dbReady = null; res(null); }
    });
    return dbReady;
  }
  openDB();
  const keyOf = l => (typeof l === 'string' ? norm(l) : l.id);
  const clipFor = l => (typeof l === 'string' ? clips.get(norm(l)) : clips.get(l.id) || clips.get(norm(l.text)));   // l'ancien format (texte) reste lisible
  // Enregistre un clip. Renvoie une promesse : vrai seulement si l'écriture dans IndexedDB est confirmée.
  function saveClip(l, blob) {
    const k = keyOf(l); const old = clips.get(k); if (old) { try { URL.revokeObjectURL(old); } catch (e) {} }
    clips.set(k, URL.createObjectURL(blob));   // utilisable tout de suite, même si l'écriture échoue
    if (!window.indexedDB) return Promise.resolve(false);   // pas de stockage : le clip reste seulement en mémoire pour cette session
    return openDB().then(d => new Promise(res => {
      if (!d) { res(false); return; }
      try { const tx = d.transaction('clips', 'readwrite'); tx.objectStore('clips').put(blob, k); tx.oncomplete = () => res(true); tx.onerror = tx.onabort = () => res(false); } catch (e) { res(false); }
    }));
  }
  // Efface les enregistrements en supprimant la base, puis VÉRIFIE. Renvoie toujours un résultat exploitable :
  //  { ok, state: 'success'|'blocked'|'error'|'unavailable', remaining, why }  — jamais « réussi » si la suppression est bloquée ou échoue.
  // Si la suppression était seulement bloquée (autre onglet) et aboutit plus tard, les clips en mémoire sont alors vidés.
  function clearClips(opts) {
    const wait = (opts && opts.timeoutMs) || 3000, name = 'voix enregistrées';
    return new Promise(res => {
      if (!window.indexedDB) { res({ ok: true, state: 'unavailable', name, remaining: 0, why: 'IndexedDB indisponible : aucun enregistrement à effacer' }); return; }
      let settled = false, timer;
      const finish = r => { if (settled) return false; settled = true; clearTimeout(timer); r.name = name; res(r); return true; };
      const dropMemory = () => { clips.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); clips.clear(); };
      // vérification : on rouvre la base (neuve) et on compte ce qu'elle contient
      const verify = () => {
        let q; try { q = indexedDB.open(DB(), 1); } catch (e) { finish({ ok: false, state: 'error', why: String(e && e.name || e) }); return; }
        q.onupgradeneeded = () => q.result.createObjectStore('clips');
        q.onerror = () => finish({ ok: false, state: 'error', why: 'vérification impossible' });
        q.onsuccess = () => {
          const d = q.result; let n = -1;
          try { const c = d.transaction('clips').objectStore('clips').count(); c.onsuccess = () => { n = c.result; d.close(); dropMemoryIf(n); }; c.onerror = () => { d.close(); finish({ ok: false, state: 'error', why: 'comptage impossible' }); }; }
          catch (e) { try { d.close(); } catch (_) {} finish({ ok: false, state: 'error', why: String(e && e.name || e) }); }
        };
      };
      const dropMemoryIf = n => {
        if (n === 0) { dropMemory(); dbReady = null; openDB(); finish({ ok: true, state: 'success', remaining: 0 }); }
        else finish({ ok: false, state: 'error', remaining: n, why: n + ' enregistrement(s) encore présent(s)' });
      };
      try {
        if (db) { try { db.close(); } catch (e) {} db = null; } dbReady = null;
        const rq = indexedDB.deleteDatabase(DB());
        rq.onsuccess = () => { if (settled) { dropMemory(); dbReady = null; openDB(); return; } verify(); };   // aboutit après un blocage : on met la mémoire à jour
        rq.onerror = () => finish({ ok: false, state: 'error', why: String(rq.error && rq.error.name || 'erreur') });
        rq.onblocked = () => { clearTimeout(timer); timer = setTimeout(() => finish({ ok: false, state: 'blocked', remaining: clips.size, why: 'la base est ouverte dans un autre onglet : fermez les autres onglets de LUMI puis recommencez' }), wait); };
      } catch (e) { finish({ ok: false, state: 'error', why: String(e && e.name || e) }); }
    });
  }
  Store.addWiper(() => clearClips());
  function playClip(url) { try { if (playing) playing.pause(); playing = new Audio(url); playing.volume = vol(); playing.play().catch(() => {}); } catch (e) {} }
  let onMiss = null, seq = 0;

  // l = { id, text, lang? } (phrase localisée) ou simple chaîne
  function speak(l) {
    const s = st(); if (!s.voice || !l) return;
    const text = typeof l === 'string' ? l : l.text, url = clipFor(l);
    if (url) { try { synth && synth.cancel(); } catch (e) {} playClip(url); return; }
    if (s.rec && onMiss) { onMiss(typeof l === 'string' ? { id: norm(l), text: l } : l); return; }
    const lang = (typeof l === 'object' && l.lang) ? l.lang : I18n.speech();
    if (!synth) { warnNoVoice(lang); return; }
    const my = ++seq;
    const ready = tries => {
      if (my !== seq) return;
      if (voiceLang !== lang) { voice = null; refresh(); }
      const base = lang.slice(0, 2).toLowerCase();
      const vs = synth.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith(base));
      const v = (voice && voice.lang.toLowerCase().startsWith(base)) ? voice : (vs[0] || null);
      if (!v && !synth.getVoices().length && tries < 12) { setTimeout(() => ready(tries + 1), 150); return; }   // la liste des voix arrive en retard sur téléphone
      if (!v && synth.getVoices().length) { warnNoVoice(lang); return; }   // des voix existent mais aucune dans la langue : silence + message explicite
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = v ? v.lang : lang; if (v) u.voice = v;
        u.rate = s.rate || 0.85; u.pitch = s.pitch || 1.1; u.volume = vol();
        window._lumiUtt = u;
        const go = () => { if (my === seq) synth.speak(u); };
        if (synth.speaking || synth.pending) { synth.cancel(); setTimeout(go, 80); } else go();
      } catch (e) {}
    };
    ready(0);
  }
  // Aucune voix compatible : on prévient (une fois par langue et par session) au lieu de se taire sans explication.
  function warnNoVoice(lang) { if (noVoiceCb && !noVoiceShown[lang]) { noVoiceShown[lang] = true; try { noVoiceCb(lang); } catch (e) {} } }
  function unlock() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      if (synth) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = I18n.speech(); synth.speak(u); }
    } catch (e) {}
  }
  document.addEventListener('pointerdown', unlock, { once: true });
  function stop() { seq++; try { synth && synth.cancel(); if (playing) playing.pause(); } catch (e) {} }
  function setVolume(v) { st().volume = Math.min(1, Math.max(0, +v || 0)); Store.save(); if (playing) playing.volume = vol(); }
  function tone(freqs, dur) {
    if (!st().sfx) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
        const t = ctx.currentTime + i * dur;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.25 * vol()), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur);
      });
    } catch (e) {}
  }
  function note(freq) {
    if (!st().sfx) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime; o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.5 * vol()), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.75);
    } catch (e) {}
  }
  return {
    speak, stop, note, voices, refresh, saveClip, clearClips, playClip, setVolume, vol, ready: openDB,
    clipCount: () => clips.size, hasClip: l => !!clipFor(l), setOnMiss: f => { onMiss = f; },
    onNoVoice: f => { noVoiceCb = f; }, resetNoVoiceWarnings: () => { noVoiceShown = {}; }, noVoice,
    voiceName: () => { if (!voice) refresh(); return voice ? voice.name : null; },
    missing: () => { if (!voice) refresh(); return noVoice(); },
    tap: () => tone([520], 0.08), good: () => tone([523, 659, 784, 1047], 0.12), soft: () => tone([330, 294], 0.14), star: () => tone([784, 988, 1175], 0.1)
  };
})();
