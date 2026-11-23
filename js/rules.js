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

  // ---- difficulté selon l'âge du profil (3, 4 ou 5 ans) ----
  const CAPS = {
    3: { countMax: 3, plusMax: 3, basket: [1, 2, 3], melody: [2, 2, 3], pairs: 2, traces: 2, shapeCounts: [2, 3], suiteLen: ['AB', 'AB', 'AAB'], choices: 3 },
    4: { countMax: 5, plusMax: 5, basket: [2, 3, 4], melody: [2, 3, 3], pairs: 3, traces: 3, shapeCounts: [3, 3], suiteLen: ['AB', 'AAB', 'ABC'], choices: 3 },
    5: { countMax: 7, plusMax: 6, basket: [2, 4, 5], melody: [2, 3, 4], pairs: 4, traces: 3, shapeCounts: [3, 4], suiteLen: ['AAB', 'ABC', 'ABC'], choices: 3 }
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
  return { gateChallenge, gateCheck, GATE, sessionState, caps, CAPS, nextGame };
})();
