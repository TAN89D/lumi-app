// Règles de LUMI, sans interface (donc testables) : porte parentale, limites de temps, difficulté et choix des jeux selon l'âge.
window.Rules = (function () {
  // ---- porte parentale : un calcul d'adulte (un enfant de 3 à 5 ans ne sait pas additionner au-delà de 10) ----
  function gateChallenge(rnd) { rnd = rnd || Math.random; const a = 11 + Math.floor(rnd() * 8), b = 3 + Math.floor(rnd() * 7); return { a, b, answer: a + b }; }
  const gateCheck = (ch, input) => /^\d{1,3}$/.test(String(input).trim()) && Number(input) === ch.answer;
  const GATE = { holdMs: 2000, maxTries: 3, coolMs: 30000, idleMs: 120000 };   // 3 erreurs = blocage 30 s ; espace parent fermé après 2 min

  // ---- limites de temps : deux notions DIFFÉRENTES ----
  //  • rappel de pause (breakMin) : doux, l'enfant peut continuer ; il revient après un nouvel intervalle.
  //  • limite de la journée (lockMin) : verrouille le jeu ; seul un adulte (porte parentale) peut prolonger.
  function sessionState(o) {
    const lock = o.lockMin > 0 && o.playedToday >= o.lockMin * 60 + (o.extra || 0);
    const breakDue = !lock && o.breakMin > 0 && o.sinceBreak >= o.breakMin * 60;
    return { lock, breakDue };
  }

  // ---- difficulté selon l'âge du profil (3 à 8 ans) ----
  const CAPS = {
    3: { countMax: 3, plusMax: 3, basket: [1, 2, 3], melody: [2, 2, 3], pairs: 2, traces: 2, shapeCounts: [2, 3], suiteLen: ['AB', 'AB', 'AAB'], choices: 3 },
    4: { countMax: 5, plusMax: 5, basket: [2, 3, 4], melody: [2, 3, 3], pairs: 3, traces: 3, shapeCounts: [3, 3], suiteLen: ['AB', 'AAB', 'ABC'], choices: 3 },
    5: { countMax: 7, plusMax: 6, basket: [2, 4, 5], melody: [2, 3, 4], pairs: 4, traces: 3, shapeCounts: [3, 4], suiteLen: ['AAB', 'ABC', 'ABC'], choices: 3 },
    // V3.5 : paliers 6, 7 et 8 ans (plus de nombres, mémoire plus grande, suites plus longues, plus de choix)
    6: { countMax: 9, plusMax: 10, basket: [4, 5, 6], melody: [3, 4, 4], pairs: 5, traces: 4, shapeCounts: [4, 4], suiteLen: ['ABC', 'AABB', 'ABCD'], choices: 4, calcMax: 20, tables: [2, 5, 10] },
    7: { countMax: 10, plusMax: 10, basket: [5, 6, 8], melody: [4, 4, 5], pairs: 6, traces: 4, shapeCounts: [4, 5], suiteLen: ['AABB', 'ABCD', 'ABCD'], choices: 4, calcMax: 50, tables: [2, 3, 4, 5, 10] },
    8: { countMax: 10, plusMax: 10, basket: [6, 8, 9], melody: [4, 5, 6], pairs: 6, traces: 5, shapeCounts: [5, 5], suiteLen: ['ABCD', 'AABB', 'ABCD'], choices: 4, calcMax: 100, tables: [2, 3, 4, 5, 6, 10] }
  };
  const caps = age => CAPS[age] || CAPS[4];

  // ---- choix automatique du jeu (bouton « Jouer ») ----
  // Le filtre d'âge reste TOUJOURS actif : on ne propose que des jeux dont le niveau (lvl) est ≤ âge de l'enfant.
  // 1) un jeu jamais joué, 2) un jeu pas encore à 3 étoiles, 3) quand tout est fini, un jeu adapté au hasard (jamais un jeu trop difficile).
  // cats : [{id, games:[{id, lvl}]}] ; starsOf(catId, gameId) → 0..3 ; rnd : fonction aléatoire (injectable pour les tests).
  function nextGame(cats, age, starsOf, rnd) {
    rnd = rnd || Math.random;
    const ok = [];
    const max = Math.max.apply(null, cats.map(c => c.games.length));
    for (let j = 0; j < max; j++) cats.forEach(c => { const g = c.games[j]; if (g && (g.lvl || 3) <= age) ok.push([c.id, g.id]); });   // ordre : un jeu de chaque catégorie à tour de rôle
    if (!ok.length) {   // sécurité : aucun jeu à l'âge demandé → les plus faciles (lvl minimal), jamais « n'importe lequel »
      const lo = Math.min.apply(null, cats.reduce((a, c) => a.concat(c.games.map(g => g.lvl || 3)), []));
      cats.forEach(c => c.games.forEach(g => { if ((g.lvl || 3) === lo) ok.push([c.id, g.id]); }));
    }
    const fresh = ok.find(([c, g]) => starsOf(c, g) === 0); if (fresh) return fresh;
    const partial = ok.find(([c, g]) => starsOf(c, g) < 3); if (partial) return partial;
    return ok[Math.floor(rnd() * ok.length) % ok.length];
  }
  // ---- séance variée (V3.5) : « Commencer » enchaîne des activités de familles DIFFÉRENTES, jamais la même cinq fois ----
  // Une activité par catégorie (celles de l'âge de l'enfant), les moins jouées d'abord, ordre légèrement aléatoire. n = nombre d'activités (5 par défaut).
  function sessionPlan(cats, age, starsOf, rnd, n) {
    rnd = rnd || Math.random; n = n || 5;
    const sh = a => a.map(x => [rnd(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
    const cands = [];
    sh(cats).forEach(c => {
      const ok = c.games.filter(g => (g.lvl || 3) <= age); if (!ok.length) return;
      const best = Math.min.apply(null, ok.map(g => starsOf(c.id, g.id))), low = ok.filter(g => starsOf(c.id, g.id) === best);
      cands.push({ pick: [c.id, low[Math.floor(rnd() * low.length) % low.length].id], stars: best + rnd() * 0.9 });   // moins jouées d'abord, avec un peu de hasard
    });
    return cands.sort((a, b) => a.stars - b.stars).slice(0, n).map(c => c.pick);
  }
  // Difficulté qui s'adapte DOUCEMENT : deux parties à 3 étoiles de suite → un cran de plus ; deux parties à 1 étoile → un cran de moins. Jamais hors de 3-8.
  function adaptAge(age, recent) {
    const r = (recent || []).slice(-2); if (r.length < 2) return age;
    if (r.every(s => s >= 3)) return Math.min(8, age + 1);
    if (r.every(s => s <= 1)) return Math.max(3, age - 1);
    return age;
  }
  // ---- mission du jour ----
  // Déterministe : même profil + même date LOCALE + même âge = même mission, toute la journée (elle ne change pas quand l'enfant joue).
  // Elle varie d'un jour à l'autre et d'un profil à l'autre, ne propose que des jeux adaptés à l'âge, et évite les jeux déjà maîtrisés (3 étoiles
  // obtenues un jour précédent). info(catId, gameId) → { stars, updated } ; letters : lettres disponibles dans la langue (facultatif).
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function dailyMission(cats, age, day, profileId, info, letters) {
    const all = [];
    cats.forEach(c => c.games.forEach(g => { if ((g.lvl || 3) <= age) all.push([c.id, g.id]); }));
    if (!all.length) return null;
    const open = all.filter(([c, g]) => { const i = info(c, g) || {}; return !(i.stars >= 3 && i.updated !== day); });
    const list = open.length ? open : all, seed = hash(String(profileId) + '|' + day + '|' + age);
    const pickIdx = list.length ? seed % list.length : 0, m = { cat: list[pickIdx][0], game: list[pickIdx][1] };
    if (m.cat === 'letters' && letters && letters.length) m.letter = letters[hash(String(profileId) + '#' + day) % letters.length];
    const i = info(m.cat, m.game) || {}; m.done = i.updated === day && i.stars > 0;
    return m;
  }
  return { gateChallenge, gateCheck, GATE, sessionState, caps, CAPS, nextGame, dailyMission, hash, sessionPlan, adaptAge };
})();
