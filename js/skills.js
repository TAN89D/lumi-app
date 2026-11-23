// Compétences : un suivi pédagogique SÉPARÉ des récompenses (étoiles, trophées, garage).
// Chaque jeu entraîne une ou deux compétences. Le score d'une compétence est une moyenne glissante des résultats récents
// (0 à 1) : il peut monter ET descendre, contrairement aux étoiles qui ne sont jamais retirées.
window.Skills = (function () {
  const MAP = {
    'letters:listen': ['letters.recognize'], 'letters:drag': ['letters.recognize'], 'letters:trace': ['letters.write'],
    'numbers:count': ['numbers.count'], 'numbers:basket': ['numbers.count', 'numbers.compose'], 'numbers:plus': ['numbers.compose'], 'numbers:trace': ['numbers.write'],
    'colors:touch': ['colors.name'], 'colors:sort': ['colors.name'], 'colors:mix': ['colors.mix'],
    'shapes:drag': ['shapes.recognize'], 'shapes:find': ['shapes.recognize'], 'shapes:build': ['shapes.build', 'logic.spatial'],
    'logic:suite': ['logic.pattern'], 'logic:odd': ['logic.classify'], 'logic:puzzle': ['logic.spatial'], 'logic:memory': ['logic.memory'],
    'art:soleil': ['art.create'], 'art:case': ['art.create'], 'art:poisson': ['art.create'], 'art:baobab': ['art.create'], 'art:free': ['art.create'],
    'music:xylo': ['music.rhythm'], 'music:drum': ['music.rhythm'], 'music:melody': ['music.rhythm', 'logic.memory'],
    'countries:flags': ['world.geo'], 'countries:memory': ['world.geo', 'logic.memory'],
    'nature:animals': ['world.nature'], 'nature:habitat': ['world.nature', 'logic.classify'], 'nature:memory': ['world.nature', 'logic.memory']
  };
  const ALL = Array.from(new Set([].concat.apply([], Object.values(MAP)).concat(['language.listen'])));
  const ALPHA = 0.4;   // poids du dernier résultat
  const forGame = (cat, gid) => cat === 'stories' ? ['language.listen'] : (MAP[cat + ':' + gid] || []);
  // niveau : 0 à découvrir, 1 en cours, 2 acquis (au moins 3 parties et un score récent solide)
  const level = s => (!s || !s.plays ? 0 : s.plays >= 3 && s.score >= 0.8 ? 2 : s.score >= 0.5 || s.plays >= 1 && s.score >= 0.34 ? 1 : 0);
  function update(profile, cat, gid, stars) {
    profile.skills = profile.skills || {};
    forGame(cat, gid).forEach(k => {
      const s = profile.skills[k] || { score: 0, plays: 0 }, r = Math.max(0, Math.min(3, stars)) / 3;
      s.score = s.plays ? s.score * (1 - ALPHA) + r * ALPHA : r; s.plays++; profile.skills[k] = s;
    });
  }
  // Reconstruit les compétences depuis la progression existante (migration : aucune donnée perdue).
  function rebuild(profile) {
    profile.skills = {};
    Object.keys(profile.progress || {}).forEach(k => {
      const m = /^g:([^:]+):(.+)$/.exec(k); if (!m) return;
      const p = profile.progress[k]; update(profile, m[1], m[2], p.stars);
    });
  }
  function summary(profile) { return ALL.map(k => ({ id: k, level: level((profile.skills || {})[k]), score: ((profile.skills || {})[k] || {}).score || 0, plays: ((profile.skills || {})[k] || {}).plays || 0 })); }
  return { MAP, ALL, forGame, level, update, rebuild, summary };
})();
