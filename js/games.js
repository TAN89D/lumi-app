// Catégories et mini-jeux de LUMI. make(n, ctx) fabrique les manches : n = nombre de choix (3, ou 2 après 1 étoile), ctx.age = 3|4|5.
// Textes et phrases prononcées viennent de I18n (identifiants stables). Ajouter un jeu = ajouter une ligne dans la catégorie voulue.
window.Games = (function () {
  const L = LUMI, V = L.vocab, dr = Draw.svg, t = (k, v) => I18n.t(k, v), line = (k, v) => I18n.line(k, v);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
  const AKEY = { lion: 'lion', elephant: 'elephant', girafe: 'giraffe', zebre: 'zebra', singe: 'monkey', crocodile: 'crocodile', hippo: 'hippo', tortue: 'tortoise', perroquet: 'parrot', flamant: 'flamingo', poisson: 'fish', serpent: 'snake' };
  const COLS = ['#e5483c', '#2f7de1', '#f2c200', '#3fae49', '#8a55c9', '#f28c1b'];
  const letters = () => I18n.raw('letters');
  const others = (all, ok, n) => shuffle(all.filter(x => x !== ok)).slice(0, n - 1).concat([ok]);
  const mangoes = k => Array.from({ length: k }, () => `<span class="it">${dr('mango')}</span>`).join('');
  const mg = n => I18n.mg(n);
  const cap = ctx => Rules.caps(ctx.age);
  const between = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  // ---- manches « choisir » ----
  const letterListen = (n, ctx) => shuffle(letters()).slice(0, 4).map(x => ({
    type: 'choose', ask: line('ask.letter.listen', { l: x.l }), show: `<div class="bigl">${x.l}</div>`,
    choices: shuffle([x].concat(shuffle(letters().filter(y => y.l !== x.l)).slice(0, n - 1))).map(y => ({ h: dr(y.key), ok: y.l === x.l, say: line('say.letter', { l: y.l, word: y.word }) }))
  }));
  const counting = (n, ctx) => {
    const mx = cap(ctx).countMax, steps = [[1, Math.min(2, mx)], [1, Math.min(3, mx)], [Math.min(2, mx), mx], [Math.min(3, mx), mx]];
    return steps.map(([a, b]) => {
      const k = between(a, b), pool = Array.from({ length: Math.max(mx, 3) + 1 }, (_, i) => i + 1);
      return { type: 'choose', ask: line('ask.count'), show: mangoes(k), choices: shuffle(others(pool, k, n)).map(v => ({ h: String(v), ok: v === k, say: line('say.count', { m: mg(k), n: k }) })) };
    });
  };
  const plus = (n, ctx) => {
    const mx = cap(ctx).plusMax, combos = [[1, 1], [2, 1], [1, 3], [2, 2], [3, 2], [4, 2]].filter(([a, b]) => a + b <= mx);
    return shuffle(combos).slice(0, 3).map(([a, b]) => {
      const k = a + b, pool = Array.from({ length: mx + 1 }, (_, i) => i + 1).filter(x => x >= 2);
      return { type: 'choose', ask: line('ask.plus', { a: mg(a), b: mg(b), na: a, nb: b }), show: `${mangoes(a)}<span class="op">+</span>${mangoes(b)}`, choices: shuffle(others(pool, k, n)).map(v => ({ h: String(v), ok: v === k, say: line('say.count', { m: mg(k), n: k }) })) };
    });
  };
  const colourTouch = n => shuffle(Object.keys(V.colors)).slice(0, 4).map(id => ({
    type: 'choose', ask: line('ask.color.touch', { c: t('v.color.' + id), id }),
    choices: shuffle(others(Object.keys(V.colors), id, n)).map(c => ({ h: Art.swatch(V.colors[c].hex, V.colors[c].pat), ok: c === id, say: line('say.color', { c: t('v.color.' + id), id }) }))
  }));
  const MIX = [['jaune', 'bleu', 'vert'], ['rouge', 'jaune', 'orange'], ['rouge', 'bleu', 'violet']];
  const colourMix = n => shuffle(MIX).map(([a, b, r]) => {
    const sw = c => `<span class="sw">${Art.swatch(V.colors[c].hex, V.colors[c].pat)}</span>`;
    return { type: 'choose', ask: line('ask.color.mix', { a: t('v.color.' + a), b: t('v.color.' + b), ia: a, ib: b }), show: `${sw(a)}<span class="op">+</span>${sw(b)}<span class="op">=</span><span class="q">?</span>`,
      choices: shuffle(others(Object.keys(V.colors).filter(c => c !== a && c !== b), r, n)).map(c => ({ h: Art.swatch(V.colors[c].hex, V.colors[c].pat), ok: c === r, say: line('say.color', { c: t('v.color.' + r), id: r }) })) };
  });
  const shapeFind = n => shuffle(Object.keys(L.shapes)).map(s => ({
    type: 'choose', ask: line('ask.shape.find', { s: t('v.shape.' + s), id: s }),
    choices: shuffle(others(Object.keys(L.shapes), s, Math.max(n, 3))).map(k => ({ h: Art.shape(k, pick(COLS)), ok: k === s, say: line('say.shape', { s: t('v.shape.' + s), id: s }) }))
  }));
  const POOL = ['mango', 'banana', 'apple', 'coconut', 'fish', 'sun'];
  const suite = (n, ctx) => cap(ctx).suiteLen.map(p => {
    const ks = shuffle(POOL).slice(0, p.length), seq = [];
    for (let i = 0; i < p.length * 2 - 1; i++) seq.push(ks[p.charCodeAt(i % p.length) - 65]);
    const ans = ks[p.charCodeAt((p.length * 2 - 1) % p.length) - 65];
    return { type: 'choose', ask: line('ask.suite'), show: seq.map(k => `<span class="it">${dr(k)}</span>`).join('') + '<span class="q">?</span>', choices: shuffle(others(POOL, ans, n)).map(k => ({ h: dr(k), ok: k === ans })) };
  });
  const SETS = [['mango', 'banana', 'apple', 'coconut'], ['elephant', 'lion', 'monkey', 'giraffe', 'zebra'], ['fish', 'crocodile', 'hippo']];
  const intrus = () => shuffle(SETS).slice(0, 3).map(set => {
    const other = pick(SETS.filter(s => s !== set)), odd = pick(other), three = shuffle(set).slice(0, 3);
    return { type: 'choose', ask: line('ask.odd'), choices: shuffle(three.map(k => ({ h: dr(k), ok: false })).concat([{ h: dr(odd), ok: true }])) };
  });
  const animals = n => shuffle(Object.keys(V.nature)).slice(0, 5).map(id => ({
    type: 'choose', ask: line('ask.animal', { say: t('v.animalsay.' + id), id }),
    choices: shuffle(others(Object.keys(V.nature), id, n)).map(a => ({ h: dr(AKEY[a]), ok: a === id, say: line('say.animal', { a: t('v.animal.' + id), id }) }))
  }));
  const flags = n => shuffle(Object.keys(V.countries)).slice(0, 4).map(id => ({
    type: 'choose', ask: line('ask.flag', { of: t('v.countryof.' + id), name: t('v.country.' + id), id }),
    choices: shuffle(others(Object.keys(V.countries), id, n)).map(c => ({ h: Art.flag(V.countries[c].flag), ok: c === id, say: line('say.country', { name: t('v.country.' + id), id }) }))
  }));

  // ---- manches « glisser » ----
  const letterDrag = () => shuffle(letters()).slice(0, 3).map(x => ({
    type: 'drag', ask: line('ask.letter.drag', { l: x.l }), items: [{ id: x.l, h: `<span>${x.l}</span>`, to: x.l }],
    slots: shuffle([x].concat(shuffle(letters().filter(y => y.l !== x.l)).slice(0, 2))).map(y => ({ key: y.l, h: dr(y.key) }))
  }));
  const shapeDrag = (n, ctx) => cap(ctx).shapeCounts.map(k => {
    const ts = shuffle(Object.keys(L.shapes)).slice(0, k);
    return { type: 'drag', ask: line('ask.shape.drag'), items: ts.map(s => ({ id: s, h: Art.shape(s, pick(COLS)), to: s })), slots: shuffle(ts).map(s => ({ key: s, h: Art.shape(s, '#e6dfc6') })) };
  });
  const SORTC = [{ z: [['rouge', 'apple'], ['jaune', 'banana', 'sun']] }, { z: [['vert', 'leaf'], ['orange', 'mango', 'fish']] }];
  const colourSort = () => SORTC.map(r => {
    const slots = r.z.map(z => ({ key: z[0], zone: true, h: Art.swatch(V.colors[z[0]].hex, V.colors[z[0]].pat) }));
    const items = []; r.z.forEach(z => z.slice(1).forEach(k => items.push({ id: k, h: dr(k), to: z[0] })));
    return { type: 'drag', ask: line('ask.color.sort', { a: t('v.color.' + r.z[0][0]), b: t('v.color.' + r.z[1][0]), ia: r.z[0][0], ib: r.z[1][0] }), items: shuffle(items), slots };
  });
  const HAB = { parrot: 'sky', fish: 'water', crocodile: 'water', hippo: 'water', elephant: 'land', giraffe: 'land', monkey: 'land', tortoise: 'land', snake: 'land' };
  const habitat = () => [['parrot', 'fish', 'elephant', 'snake'], ['hippo', 'monkey', 'parrot', 'crocodile']].map(ks => ({
    type: 'drag', ask: line('ask.habitat'), z3: true, items: shuffle(ks.map(k => ({ id: k, h: dr(k), to: HAB[k] }))),
    slots: [{ key: 'sky', zone: true, h: dr('sky') }, { key: 'land', zone: true, h: dr('land') }, { key: 'water', zone: true, h: dr('water') }]
  }));
  const P = (path, col, stretch) => `<svg viewBox="0 0 100 100" ${stretch ? 'preserveAspectRatio="none"' : ''}>${path.replace('COL', col)}</svg>`;
  const BOAT = [
    { key: 'hull', col: '#e8693a', path: '<path d="M0 0h100l-16 100H16z" fill="COL"/>', pos: 'left:10%;top:62%;width:80%;height:26%' },
    { key: 'mast', col: '#6b4a2a', path: '<rect width="100" height="100" fill="COL"/>', pos: 'left:48%;top:14%;width:5%;height:50%' },
    { key: 'sail', col: '#ffd23f', path: '<path d="M0 0L100 100H0z" fill="COL"/>', pos: 'left:54%;top:14%;width:30%;height:48%' }];
  const HOUSE = [
    { key: 'walls', col: '#d9a35f', path: '<rect width="100" height="100" fill="COL"/>', pos: 'left:20%;top:46%;width:60%;height:42%' },
    { key: 'roof', col: '#b8742f', path: '<path d="M50 0L100 100H0z" fill="COL"/>', pos: 'left:10%;top:14%;width:80%;height:32%' },
    { key: 'door', col: '#6b4420', path: '<rect width="100" height="100" rx="12" fill="COL"/>', pos: 'left:44%;top:62%;width:12%;height:26%' }];
  const assemble = () => [['ask.shape.boat', BOAT], ['ask.shape.house', HOUSE]].map(([k, parts]) => ({
    type: 'drag', ask: line(k), scene: true, items: shuffle(parts.map(p => ({ id: p.key, h: P(p.path, p.col), to: p.key }))),
    slots: parts.map(p => ({ key: p.key, pos: p.pos, h: P(p.path, '#d6e4ee', true), full: P(p.path, p.col, true) }))
  }));

  const fill = (n, ctx) => cap(ctx).basket.map(k => ({ type: 'fill', n: k, ask: line('ask.basket', { a: mg(k), n: k }) }));
  const swap = () => shuffle(['elephant', 'giraffe', 'lion', 'fish', 'zebra']).slice(0, 2).map(k => ({ type: 'swap', key: k, ask: line('ask.puzzle') }));
  const memory = (kind, np) => (n, ctx) => [{ type: 'memory', kind, ask: line('ask.memory'),
    pairs: kind === 'flag' ? shuffle(Object.keys(V.countries)).slice(0, Math.min(np, cap(ctx).pairs)) : shuffle(Object.keys(AKEY).map(k => AKEY[k])).slice(0, Math.min(np, cap(ctx).pairs)) }];
  const traceL = (n, ctx) => shuffle(letters()).slice(0, cap(ctx).traces).map(x => ({ type: 'trace', glyph: x.l, ask: line('ask.letter.trace', { l: x.l }) }));
  const traceN = (n, ctx) => shuffle(['1', '2', '3', '4', '5', '6', '7', '8', '9']).slice(0, cap(ctx).traces).map(g => ({ type: 'trace', glyph: g, ask: line('ask.num.trace', { l: g }) }));
  const tpl = id => () => [{ type: 'color', tpl: id, ask: line('ask.paint') }];

  // lvl : niveau d'âge minimal conseillé (3, 4 ou 5) ; skills : voir skills.js
  const G = (id, ic, make, lvl) => ({ id, ic, make, lvl: lvl || 3 });
  const CATS = [
    { id: 'letters', c: 'turq', art: 'c_letters', games: [G('listen', 'lion', letterListen), G('drag', 'banana', letterDrag, 4), G('trace', 'c_art', traceL, 4)] },
    { id: 'numbers', c: 'sun', art: 'c_numbers', games: [G('count', 'mango', counting), G('basket', 'basket', fill), G('plus', 'apple', plus, 5), G('trace', 'c_art', traceN, 4)] },
    { id: 'colors', c: 'coral', art: 'c_colors', games: [G('touch', 'c_colors', colourTouch), G('sort', 'leaf', colourSort, 4), G('mix', 'fish', colourMix, 5)] },
    { id: 'shapes', c: 'violet', art: 'c_shapes', games: [G('drag', 'c_shapes', shapeDrag), G('build', 'boat', assemble, 4), G('find', 'star', shapeFind)] },
    { id: 'logic', c: 'leaf', art: 'c_logic', games: [G('suite', 'banana', suite, 4), G('odd', 'coconut', intrus, 4), G('puzzle', 'giraffe', swap, 4), G('memory', 'tortoise', memory('draw', 3))] },
    { id: 'art', c: 'turq', art: 'c_art', games: [G('soleil', 'sun', tpl('soleil')), G('case', 'house', tpl('case')), G('poisson', 'fish', tpl('poisson')), G('baobab', 'tree', tpl('baobab')),
      G('free', 'c_art', () => [{ type: 'free', ask: line('ask.free') }])] },
    { id: 'music', c: 'violet', art: 'c_music', games: [G('xylo', 'c_music', () => [{ type: 'xylo', ask: line('ask.xylo') }]), G('drum', 'drum', () => [{ type: 'drum', ask: line('ask.drum') }]),
      G('melody', 'star', (n, ctx) => cap(ctx).melody.map(len => ({ type: 'melody', len, ask: line('ask.melody') })), 4)] },
    { id: 'countries', c: 'coral', art: 'c_countries', games: [G('flags', 'c_countries', flags, 4), G('memory', 'star', memory('flag', 3), 4)] },
    { id: 'nature', c: 'leaf', art: 'c_nature', games: [G('animals', 'elephant', animals), G('habitat', 'parrot', habitat, 4), G('memory', 'monkey', memory('draw', 4), 4)] },
    { id: 'stories', c: 'sun', art: 'c_stories', games: L.stories.map(s => ({ id: s.id, title: s.title, e: s.cover, lvl: 3, make: () => [{ type: 'story', story: s, ask: { id: 'fr:story.' + s.id + '.title', text: s.title, lang: 'fr-FR' } }] })) }
  ];
  const label = c => t('cat.' + c.id), gameName = (c, g) => g.title || t('g.' + c.id + '.' + g.id);
  return { CATS, AKEY, shuffle, pick, COLS, label, gameName };
})();
