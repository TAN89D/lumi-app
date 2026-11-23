// Audio : voix enregistrée (prioritaire), sinon voix de synthèse du navigateur, plus de petits effets sonores générés.
// Chaque phrase est identifiée par un ID STABLE (voir I18n.line) : on peut reformuler un texte sans perdre les enregistrements.
window.Sound = (function () {
  let ctx, voice = null, voiceLang = '';
  const synth = window.speechSynthesis;
  const st = () => Store.s();
  const vol = () => { const v = +st().volume; return isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.9; };   // toujours entre 0 et 1

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
  const noVoice = () => !!synth && !voice && synth.getVoices().length > 0;   // des voix existent mais aucune dans la langue

  // ---- voix enregistrée : IndexedDB, clés = identifiants de phrases ----
  const clips = new Map(), norm = t => String(t).toLowerCase().replace(/\s+/g, ' ').trim();
  let db = null, playing = null, dbReady = null;
  function openDB() {
    if (dbReady) return dbReady;
    dbReady = new Promise(res => {
      try {
        const rq = indexedDB.open('lumi-voice', 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore('clips');
        rq.onsuccess = () => { db = rq.result; db.onversionchange = () => { try { db.close(); } catch (e) {} db = null; dbReady = null; };   // un effacement lancé depuis un autre onglet ne reste pas bloqué
          db.transaction('clips').objectStore('clips').openCursor().onsuccess = e => { const c = e.target.result; if (c) { clips.set(c.key, URL.createObjectURL(c.value)); c.continue(); } else res(db); }; };
        rq.onerror = () => res(null); rq.onblocked = () => res(null);
      } catch (e) { res(null); }
    });
    return dbReady;
  }
  openDB();
  const keyOf = l => (typeof l === 'string' ? norm(l) : l.id);
  const clipFor = l => (typeof l === 'string' ? clips.get(norm(l)) : clips.get(l.id) || clips.get(norm(l.text)));   // l'ancien format (texte) reste lisible
  function saveClip(l, blob) {
    const k = keyOf(l); const old = clips.get(k); if (old) { try { URL.revokeObjectURL(old); } catch (e) {} }
    clips.set(k, URL.createObjectURL(blob));
    try { db && db.transaction('clips', 'readwrite').objectStore('clips').put(blob, k); } catch (e) {}
  }
  // Efface les clips ET supprime la base : rien ne subsiste.
  function clearClips() {
    clips.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); clips.clear();
    return new Promise(res => {
      try { if (db) { db.close(); db = null; } dbReady = null; const r = indexedDB.deleteDatabase('lumi-voice'); r.onsuccess = r.onerror = r.onblocked = () => { openDB(); res(true); }; } catch (e) { res(false); }
    });
  }
  Store.addWiper(clearClips);
  function playClip(url) {
    try { if (playing) playing.pause(); playing = new Audio(url); playing.volume = vol(); playing.play().catch(() => {}); } catch (e) {}
  }
  let onMiss = null, seq = 0;

  // l = { id, text } (phrase localisée) ou simple chaîne
  function speak(l) {
    const s = st(); if (!s.voice || !l) return;
    const text = typeof l === 'string' ? l : l.text, url = clipFor(l);
    if (url) { try { synth && synth.cancel(); } catch (e) {} playClip(url); return; }
    if (s.rec && onMiss) { onMiss(typeof l === 'string' ? { id: norm(l), text: l } : l); return; }
    if (!synth) return;
    const my = ++seq, lang = (typeof l === 'object' && l.lang) ? l.lang : I18n.speech();
    const ready = tries => {
      if (my !== seq) return;
      if (voiceLang !== lang) { const keep = I18n.speech(); voice = null; refresh(); void keep; }
      const base = lang.slice(0, 2).toLowerCase();
      const vs = synth.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith(base));
      const v = (voice && voice.lang.toLowerCase().startsWith(base)) ? voice : (vs[0] || null);
      if (!v && !synth.getVoices().length && tries < 12) { setTimeout(() => ready(tries + 1), 150); return; }   // la liste des voix arrive en retard sur téléphone
      if (!v && synth.getVoices().length) return;   // des voix existent mais aucune dans la langue : on se tait plutôt que de mal prononcer
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
  function unlock() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      if (synth) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = I18n.speech(); synth.speak(u); }
    } catch (e) {}
  }
  document.addEventListener('pointerdown', unlock, { once: true });
  function stop() { seq++; try { synth && synth.cancel(); if (playing) playing.pause(); } catch (e) {} }
  // Volume : s'applique tout de suite à ce qui joue, et aux prochaines phrases / effets.
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
    voiceName: () => { if (!voice) refresh(); return voice ? voice.name : null; },
    missing: () => { if (!voice) refresh(); return noVoice(); },
    tap: () => tone([520], 0.08), good: () => tone([523, 659, 784, 1047], 0.12), soft: () => tone([330, 294], 0.14), star: () => tone([784, 988, 1175], 0.1)
  };
})();
