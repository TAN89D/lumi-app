// Compétences : suivi pédagogique SÉPARÉ des récompenses (étoiles, trophées, garage).
// Trois notions distinctes pour chaque compétence :
//   • RÉUSSITE  : une partie terminée avec au moins 2 étoiles ;
//   • RÉPÉTITION : le nombre de parties et de JOURS différents où l'enfant a joué ;
//   • MAÎTRISE  : réussite régulière et récente (3 parties au moins, sur 2 jours au moins, 3 dernières parties à 2 étoiles ou plus,
//                 moyenne récente solide). Une seule mauvaise partie ne fait pas perdre la maîtrise.
// Une erreur ne coûte presque rien : 1 étoile compte encore pour 50 % (au lieu de 33 %), et le score est une moyenne glissante douce.
window.Skills = (function () {
  const MAP = {
    'letters:listen': ['letters.recognize'], 'letters:drag': ['letters.recognize'], 'letters:trace': ['letters.write'],
    'numbers:count': ['numbers.count'], 'numbers:match': ['numbers.count'], 'numbers:basket': ['numbers.count', 'numbers.compose'], 'numbers:plus': ['numbers.compose'], 'numbers:trace': ['numbers.write'], 'numbers:add': ['numbers.compose'], 'numbers:sub': ['numbers.compose'], 'numbers:compare': ['numbers.count'], 'numbers:tables': ['numbers.compose'], 'numbers:money': ['numbers.compose'], 'numbers:clock': ['numbers.count'], 'letters:missing': ['letters.recognize'], 'logic:numseq': ['logic.pattern'], 'countries:capitals': ['world.geo'],
    'colors:touch': ['colors.name'], 'colors:sort': ['colors.name'], 'colors:mix': ['colors.mix'],
    'shapes:drag': ['shapes.recognize'], 'shapes:find': ['shapes.recognize'], 'shapes:build': ['shapes.build', 'logic.spatial'],
    'logic:suite': ['logic.pattern'], 'logic:odd': ['logic.classify'], 'logic:puzzle': ['logic.spatial'], 'logic:memory': ['logic.memory'],
    'art:soleil': ['art.create'], 'art:case': ['art.create'], 'art:poisson': ['art.create'], 'art:baobab': ['art.create'], 'art:free': ['art.create'],
    'music:xylo': ['music.rhythm'], 'music:drum': ['music.rhythm'], 'music:melody': ['music.rhythm', 'logic.memory'],
    'countries:flags': ['world.geo'], 'countries:memory': ['world.geo', 'logic.memory'],
    'nature:animals': ['world.nature'], 'nature:habitat': ['world.nature', 'logic.classify'], 'nature:memory': ['world.nature', 'logic.memory']
  };
  const ALL = Array.from(new Set([].concat.apply([], Object.values(MAP)).concat(['language.listen'])));
  const WEIGHT = { 0: 0.2, 1: 0.5, 2: 0.8, 3: 1 };   // 1 étoile = 50 %, 2 étoiles = 80 %
  const ALPHA = 0.3, HIST = 10;
  const forGame = (cat, gid) => cat === 'stories' ? ['language.listen'] : (MAP[cat + ':' + gid] || []);
  const gamesFor = skill => Object.keys(MAP).filter(k => MAP[k].indexOf(skill) >= 0).map(k => k.split(':'));
  // niveau : 0 à découvrir, 1 en cours, 2 maîtrisé
  function level(s) {
    if (!s || !s.plays) return 0;
    const h = s.h || [];
    if (h.length >= 3) {   // nouvelle règle (avec historique)
      // sur les 5 dernières parties : au plus UNE partie à 1 étoile est tolérée (dès qu'on a 5 parties) → une mauvaise partie ne fait pas perdre la maîtrise
      const rec = h.slice(-5), weak = rec.filter(x => x < 2).length, solid = weak <= (rec.length >= 4 ? 1 : 0), avg = rec.reduce((a, x) => a + WEIGHT[x], 0) / rec.length;
      if (s.plays >= 3 && (s.d || 0) >= 2 && solid && avg >= 0.8) return 2;
      return 1;
    }
    // données anciennes (avant l'historique) : règle d'origine conservée, pour ne rien changer au résultat d'avant
    return s.plays >= 3 && s.score >= 0.8 ? 2 : s.score >= 0.34 ? 1 : (s.plays >= 1 ? 1 : 0);
  }
  function update(profile, cat, gid, stars, day) {
    profile.skills = profile.skills || {}; day = day || (window.Store ? Store.localDay() : '');
    const st = Math.max(0, Math.min(3, stars | 0)), r = WEIGHT[st];
    forGame(cat, gid).forEach(k => {
      const s = profile.skills[k] || { score: 0, plays: 0, h: [], d: 0, last: '' };
      if (!Array.isArray(s.h)) s.h = []; if (typeof s.d !== 'number') s.d = 0;
      s.score = s.plays ? s.score * (1 - ALPHA) + r * ALPHA : r; s.plays++;
      s.h.push(st); if (s.h.length > HIST) s.h = s.h.slice(-HIST);
      if (s.last !== day) { s.d++; s.last = day; }
      profile.skills[k] = s;
    });
  }
  // Reconstruit les compétences depuis la progression existante (uniquement si elles sont vides : l'historique existant n'est jamais écrasé).
  function rebuild(profile) {
    profile.skills = {};
    Object.keys(profile.progress || {}).forEach(k => {
      const m = /^g:([^:]+):(.+)$/.exec(k); if (!m) return;
      const p = profile.progress[k]; update(profile, m[1], m[2], p.stars, p.updated || '');
    });
  }
  function summary(profile) {
    return ALL.map(k => { const s = (profile.skills || {})[k] || {}; return { id: k, level: level(s.plays ? s : null), score: s.score || 0, plays: s.plays || 0, days: s.d || 0, recent: (s.h || []).slice(-3) }; });
  }
  // Recommandations pour les parents : liste de { kind, skill, game:[cat,gid] }. kind = try | practice | ready | keep
  //  try      : compétence jamais travaillée → proposer un jeu facile ;
  //  practice : en cours, résultats encore fragiles → rejouer en s'amusant, sans insister ;
  //  ready    : maîtrisée → on peut passer à un jeu plus difficile ;
  // Jamais de « mauvais résultat » : on parle d'étapes, pas d'échecs.
  function advice(profile, age, gamesMeta) {
    const out = [], sum = summary(profile), lvlOf = (c, g) => { const cc = (gamesMeta || []).find(x => x.id === c); const gg = cc && cc.games.find(x => x.id === g); return gg ? gg.lvl : 3; };
    const easiest = sk => { const gs = gamesFor(sk).filter(([c, g]) => lvlOf(c, g) <= age).sort((a, b) => lvlOf(a[0], a[1]) - lvlOf(b[0], b[1])); return gs[0] || null; };   // jamais de jeu au-dessus de l'âge : si aucun n'est adapté, pas de conseil pour cette compétence
    sum.forEach(s => {
      if (s.id === 'language.listen') return;
      if (s.level === 0 && s.plays === 0) { const g = easiest(s.id); if (g) out.push({ kind: 'try', skill: s.id, game: g }); }
      else if (s.level === 1 && s.plays >= 3 && s.recent.length && s.recent.some(x => x <= 1)) { const g = easiest(s.id); if (g) out.push({ kind: 'practice', skill: s.id, game: g }); }
      else if (s.level === 2) { const harder = gamesFor(s.id).filter(([c, g]) => lvlOf(c, g) > age).sort((a, b) => lvlOf(a[0], a[1]) - lvlOf(b[0], b[1]))[0]; out.push({ kind: 'ready', skill: s.id, game: harder || null }); }
    });
    // 4 conseils au plus, bien répartis : d'abord ce qui est fragile (2 max), puis un encouragement « prêt pour la suite » (1), puis des découvertes
    const by = k => out.filter(a => a.kind === k), fragile = by('practice').slice(0, 2), ready = by('ready').slice(0, 1);
    return fragile.concat(ready).concat(by('try')).slice(0, 4);
  }
  return { MAP, ALL, forGame, gamesFor, level, update, rebuild, summary, advice, WEIGHT };
})();
