// Audio : voix de synthèse du navigateur (DÉMO, à remplacer par de vraies voix enregistrées)
// et petits effets sonores générés. Aucun fichier audio fabriqué.
window.Sound = (function () {
  let ctx, voice = null;
  const synth = window.speechSynthesis;

  // Cherche une VRAIE voix française (sinon le navigateur lit le français avec une voix anglaise).
  function pickVoice() {
    if (!synth) return null;
    const lang = (LUMI.config.speechLang[Store.s().lang] || 'fr-FR').toLowerCase();
    const base = lang.slice(0, 2);
    const vs = synth.getVoices().filter(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(base));
    if (!vs.length) return null;
    const chosen = Store.s().vname && vs.find(v => v.name === Store.s().vname);
    if (chosen) return chosen;
    // même choix que la première version : voix naturelle / en ligne d'abord, puis les voix françaises connues
    const score = v => (v.lang.toLowerCase().replace('_', '-') === lang ? 4 : 0)
      + (/natural|online/i.test(v.name) ? 5 : 0) + (/google|hortense|denise|julie|amelie|thomas|audrey/i.test(v.name) ? 2 : 0)
      + (v.localService ? 1 : 0);
    return vs.sort((a, b) => score(b) - score(a))[0];
  }
  function voices() {
    if (!synth) return [];
    const base = (LUMI.config.speechLang[Store.s().lang] || 'fr-FR').slice(0, 2).toLowerCase();
    return synth.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith(base)).map(v => v.name);
  }
  function refresh() { voice = pickVoice(); }
  if (synth) { refresh(); synth.addEventListener && synth.addEventListener('voiceschanged', refresh); }

  // Vrai quand la liste de voix est chargée mais ne contient aucun français (cas d'un PC sans voix française).
  const noFrench = () => !!synth && !voice && synth.getVoices().length > 0;
  // ---- Voix enregistrée (la vraie voix d'un proche, gardée sur l'appareil dans IndexedDB) : prioritaire sur la synthèse ----
  const clips = new Map(), norm = t => String(t).toLowerCase().replace(/\s+/g, ' ').trim();
  let db = null, playing = null;
  try {
    const rq = indexedDB.open('lumi-voice', 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore('clips');
    rq.onsuccess = () => {
      db = rq.result;
      db.transaction('clips').objectStore('clips').openCursor().onsuccess = e => { const c = e.target.result; if (c) { clips.set(c.key, URL.createObjectURL(c.value)); c.continue(); } };
    };
  } catch (e) {}
  function saveClip(text, blob) {
    clips.set(norm(text), URL.createObjectURL(blob));
    try { db && db.transaction('clips', 'readwrite').objectStore('clips').put(blob, norm(text)); } catch (e) {}
  }
  function clearClips() { clips.clear(); try { db && db.transaction('clips', 'readwrite').objectStore('clips').clear(); } catch (e) {} }
  function playClip(url) {
    try { if (playing) playing.pause(); playing = new Audio(url); playing.volume = Store.s().volume; playing.play().catch(() => {}); } catch (e) {}
  }
  let onMiss = null, seq = 0;
  function speak(text) {
    const s = Store.s();
    if (!s.voice) return;
    const url = clips.get(norm(text));
    if (url) { try { synth && synth.cancel(); } catch (e) {} playClip(url); return; }
    if (s.rec && onMiss) { onMiss(text); return; }   // mode enregistrement : on propose d'enregistrer cette phrase
    if (!synth) return;
    const my = ++seq;
    // Sur téléphone la liste des voix arrive en retard : on l'attend avant de parler, sinon le système lit en anglais.
    const ready = tries => {
      if (my !== seq) return;   // une phrase plus récente a pris la place
      refresh();
      if (!voice && !synth.getVoices().length && tries < 12) { setTimeout(() => ready(tries + 1), 150); return; }
      if (noFrench()) return;   // des voix existent mais aucune en français : on se tait plutôt que de lire en anglais
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = voice ? voice.lang : (LUMI.config.speechLang[s.lang] || 'fr-FR');
        if (voice) u.voice = voice;   // voix française choisie explicitement
        u.rate = s.rate || 0.85; u.pitch = s.pitch || 1.1;   // réglages de la première version, celle dont la voix plaisait u.volume = s.volume;
        window._lumiUtt = u;     // garde une référence (Chrome Android coupe sinon la lecture)
        const go = () => { if (my === seq) synth.speak(u); };
        if (synth.speaking || synth.pending) { synth.cancel(); setTimeout(go, 80); } else go();
      } catch (e) {}
    };
    ready(0);
  }
  // Débloque la parole et les sons au premier toucher (exigé par iPhone et Android).
  function unlock() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      if (synth) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = 'fr-FR'; synth.speak(u); }
    } catch (e) {}
  }
  document.addEventListener('pointerdown', unlock, { once: true });
  function stop() { seq++; try { synth && synth.cancel(); if (playing) playing.pause(); } catch (e) {} }
  function tone(freqs, dur) {
    const s = Store.s();
    if (!s.sfx) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        const t = ctx.currentTime + i * dur;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.25 * s.volume, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur);
      });
    } catch (e) {}
  }
  // Note de xylophone : timbre doux (triangle) avec une courte résonance.
  function note(freq) {
    const s = Store.s(); if (!s.sfx) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * s.volume, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.75);
    } catch (e) {}
  }
  return {
    speak, stop, note, voices, refresh, saveClip, clearClips, playClip,
    clipCount: () => clips.size, hasClip: t => clips.has(norm(t)), setOnMiss: f => { onMiss = f; },
    voiceName: () => { if (!voice) refresh(); return voice ? voice.name : null; },
    missing: () => { if (!voice) refresh(); return noFrench(); },
    tap: () => tone([520], 0.08),
    good: () => tone([523, 659, 784, 1047], 0.12),
    soft: () => tone([330, 294], 0.14),
    star: () => tone([784, 988, 1175], 0.1)
  };
})();
