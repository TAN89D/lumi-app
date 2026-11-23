// Règles de LUMI, sans interface (donc testables) : porte parentale, limites de temps, difficulté selon l'âge.
window.Rules = (function () {
  // ---- porte parentale : un calcul d'adulte (un enfant de 3 à 5 ans ne sait pas additionner au-delà de 10) ----
  function gateChallenge(rnd) { rnd = rnd || Math.random; const a = 11 + Math.floor(rnd() * 8), b = 3 + Math.floor(rnd() * 7); return { a, b, answer: a + b }; }
  const gateCheck = (ch, input) => /^\d{1,3}$/.test(String(input).trim()) && Number(input) === ch.answer;
  // Après 3 mauvaises réponses, la porte se bloque 30 secondes.
  const GATE = { holdMs: 2000, maxTries: 3, coolMs: 30000, idleMs: 120000 };

  // ---- limites de temps : deux notions DIFFÉRENTES ----
  //  • rappel de pause (breakMin) : doux, l'enfant peut continuer ; il revient après un nouvel intervalle.
  //  • limite de la journée (lockMin) : verrouille le jeu ; seul un adulte (porte parentale) peut prolonger.
  // Entrées en secondes : playedToday (jour LOCAL), sinceBreak (temps depuis le dernier rappel), extra (prolongation accordée aujourd'hui).
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
  return { gateChallenge, gateCheck, GATE, sessionState, caps, CAPS };
})();
