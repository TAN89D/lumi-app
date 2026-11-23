// Sauvegarde locale (localStorage, versionnée). Aucune donnée ne quitte l'appareil.
(function () {
  const KEY = 'lumi.v1';
  const defaults = () => ({
    v: 1, active: null, profiles: {},
    settings: { lang: 'fr', voice: true, sfx: true, volume: 0.9, big: false, calm: false, contrast: false, limitMin: 0, minis: true, rec: false, vname: '', rate: 0.85, pitch: 1.1 }
  });
  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)) || defaults(); } catch (e) { data = defaults(); }
  data.settings = Object.assign(defaults().settings, data.settings);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };
  const today = () => new Date().toISOString().slice(0, 10);

  window.Store = {
    data, save, today,
    s: () => data.settings,
    profile: () => data.profiles[data.active] || null,
    createProfile(name, avatar) {
      const id = 'p' + Date.now();
      data.profiles[id] = { id, name: (name || '').trim().slice(0, 20), avatar: avatar || 'awa', created: Date.now(), progress: {}, rewards: [], playTime: {}, storiesRead: [] };
      data.active = id; save(); return data.profiles[id];
    },
    deleteProfile(id) {
      delete data.profiles[id];
      if (data.active === id) data.active = Object.keys(data.profiles)[0] || null;
      save();
    },
    addTime(sec) {
      const p = this.profile(); if (!p) return;
      p.playTime[today()] = (p.playTime[today()] || 0) + sec; save();
    },
    // Enregistre une réussite : on garde toujours le meilleur nombre d'étoiles.
    record(stepId, stars, errors, hints) {
      const p = this.profile(); if (!p) return { first: false };
      const old = p.progress[stepId];
      const first = !old;
      p.progress[stepId] = {
        stars: Math.max(stars, old ? old.stars : 0), last: stars,
        plays: (old ? old.plays : 0) + 1,
        errors: (old ? old.errors : 0) + errors, hints: (old ? old.hints : 0) + hints,
        updated: today()
      };
      save(); return { first };
    },
    addReward(type, item) {
      const p = this.profile(); if (!p) return;
      if (!p.rewards.some(r => r.type === type && r.item === item)) {
        p.rewards.push({ id: type + ':' + item, type, item, date: today() }); save();
      }
    },
    exportJSON: () => JSON.stringify(data, null, 2),
    resetAll() { const d = defaults(); Object.keys(data).forEach(k => delete data[k]); Object.assign(data, d); save(); }
  };
})();
