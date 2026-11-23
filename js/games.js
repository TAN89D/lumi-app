// Catégories et mini-jeux de LUMI. Chaque jeu a une fonction make(n) qui fabrique ses manches (n = nombre de choix : 3, ou 2 si l'enfant a eu 1 étoile).
// Ajouter un jeu = ajouter une ligne dans la catégorie voulue.
window.Games = (function () {
  const L = LUMI, V = L.vocab, dr = Draw.svg;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
  const LKEY = { A: 'tree', B: 'banana', C: 'coconut', E: 'elephant', L: 'lion', M: 'mango', P: 'apple', S: 'sun', T: 'tortoise' };
  const AKEY = { lion: 'lion', elephant: 'elephant', girafe: 'giraffe', zebre: 'zebra', singe: 'monkey', crocodile: 'crocodile', hippo: 'hippo', tortue: 'tortoise', perroquet: 'parrot', flamant: 'flamingo', poisson: 'fish', serpent: 'snake' };
  const NF = ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit'];
  const mg = n => `${NF[n]} mangue${n > 1 ? 's' : ''}`;
  const COLS = ['#e5483c', '#2f7de1', '#f2c200', '#3fae49', '#8a55c9', '#f28c1b'];
  const others = (all, ok, n) => shuffle(all.filter(x => x !== ok)).slice(0, n - 1).concat([ok]);
  const mangoes = k => Array.from({ length: k }, () => `<span class="it">${dr('mango')}</span>`).join('');

  // ---- manches « choisir » ----
  const letterListen = n => shuffle(L.letters).slice(0, 4).map(x => ({
    type: 'choose', ask: `Quelle image commence par la lettre ${x.l} ?`, show: `<div class="bigl">${x.l}</div>`,
    choices: shuffle([x].concat(shuffle(L.letters.filter(y => y.l !== x.l)).slice(0, n - 1))).map(y => ({ h: dr(LKEY[y.l]), ok: y.l === x.l, say: `${y.l} comme ${y.word}` }))
  }));
  const counting = n => [[1, 3], [2, 4], [3, 5], [4, 6]].map(([a, b]) => {
    const k = a + Math.floor(Math.random() * (b - a + 1)), ch = others([1, 2, 3, 4, 5, 6, 7], k, n);
    return { type: 'choose', ask: 'Combien de mangues vois-tu ?', show: mangoes(k), choices: shuffle(ch).map(v => ({ h: String(v), ok: v === k, say: mg(k) })) };
  });
  const plus = n => [[1, 1], [2, 1], [1, 3], [2, 2]].slice(0, 3 + (Math.random() < 0.5 ? 1 : 0)).map(([a, b]) => {
    const k = a + b, ch = others([2, 3, 4, 5, 6], k, n);
    return { type: 'choose', ask: `${mg(a)} et ${mg(b)}. Combien en tout ?`, show: `${mangoes(a)}<span class="op">+</span>${mangoes(b)}`, choices: shuffle(ch).map(v => ({ h: String(v), ok: v === k, say: mg(k) })) };
  });
  const colourTouch = n => shuffle(Object.keys(V.colors)).slice(0, 4).map(id => {
    const ch = others(Object.keys(V.colors), id, n);
    return { type: 'choose', ask: `Touche la couleur ${V.colors[id].name}.`, choices: shuffle(ch).map(c => ({ h: Art.swatch(V.colors[c].hex, V.colors[c].pat), ok: c === id, say: V.colors[id].name })) };
  });
  const MIX = [['jaune', 'bleu', 'vert'], ['rouge', 'jaune', 'orange'], ['rouge', 'bleu', 'violet']];
  const colourMix = n => shuffle(MIX).map(([a, b, r]) => {
    const sw = c => `<span class="sw">${Art.swatch(V.colors[c].hex, V.colors[c].pat)}</span>`;
    return { type: 'choose', ask: `${V.colors[a].name} et ${V.colors[b].name}, ça fait quelle couleur ?`, show: `${sw(a)}<span class="op">+</span>${sw(b)}<span class="op">=</span><span class="q">?</span>`,
      choices: shuffle(others(Object.keys(V.colors).filter(c => c !== a && c !== b), r, n)).map(c => ({ h: Art.swatch(V.colors[c].hex, V.colors[c].pat), ok: c === r, say: V.colors[r].name })) };
  });
  const shapeFind = n => shuffle(Object.keys(L.shapes)).map(t => ({
    type: 'choose', ask: `Touche le ${L.shapes[t].name.toLowerCase()}.`,
    choices: shuffle(others(Object.keys(L.shapes), t, Math.max(n, 3))).map(s => ({ h: Art.shape(s, pick(COLS)), ok: s === t, say: L.shapes[t].name }))
  }));
  const POOL = ['mango', 'banana', 'apple', 'coconut', 'fish', 'sun'];
  const suite = n => ['AB', 'AAB', 'ABC'].map(p => {
    const ks = shuffle(POOL).slice(0, p.length), seq = [];
    for (let i = 0; i < p.length * 2 - 1; i++) seq.push(ks[p.charCodeAt(i % p.length) - 65]);
    const ans = ks[p.charCodeAt((p.length * 2 - 1) % p.length) - 65];
    return { type: 'choose', ask: 'Quelle image vient après ?', show: seq.map(k => `<span class="it">${dr(k)}</span>`).join('') + '<span class="q">?</span>',
      choices: shuffle(others(POOL, ans, n)).map(k => ({ h: dr(k), ok: k === ans })) };
  });
  const SETS = [['mango', 'banana', 'apple', 'coconut'], ['elephant', 'lion', 'monkey', 'giraffe', 'zebra'], ['fish', 'crocodile', 'hippo']];
  const intrus = () => shuffle(SETS).slice(0, 3).map((set, i) => {
    const other = pick(SETS.filter(s => s !== set)), odd = pick(other), three = shuffle(set).slice(0, 3);
    return { type: 'choose', ask: 'Touche celui qui n’est pas comme les autres.', choices: shuffle(three.map(k => ({ h: dr(k), ok: false })).concat([{ h: dr(odd), ok: true }])) };
  });
  const animals = n => shuffle(Object.keys(V.nature)).slice(0, 5).map(id => ({
    type: 'choose', ask: `Touche ${V.nature[id].say}.`,
    choices: shuffle(others(Object.keys(V.nature), id, n)).map(a => ({ h: dr(AKEY[a]), ok: a === id, say: V.nature[id].name }))
  }));
  const flags = n => shuffle(Object.keys(V.countries)).slice(0, 4).map(id => ({
    type: 'choose', ask: `Touche le drapeau ${V.countries[id].of}.`,
    choices: shuffle(others(Object.keys(V.countries), id, n)).map(c => ({ h: Art.flag(V.countries[c].flag), ok: c === id, say: V.countries[id].name }))
  }));

  // ---- manches « glisser » ----
  const letterDrag = () => shuffle(L.letters).slice(0, 3).map(x => ({
    type: 'drag', ask: `Glisse le ${x.l} sur l’image qui commence par ${x.l}.`,
    items: [{ id: x.l, h: `<span>${x.l}</span>`, to: x.l }],
    slots: shuffle([x].concat(shuffle(L.letters.filter(y => y.l !== x.l)).slice(0, 2))).map(y => ({ key: y.l, h: dr(LKEY[y.l]) }))
  }));
  const shapeDrag = () => [3, 4].map(k => {
    const ts = shuffle(Object.keys(L.shapes)).slice(0, k);
    return { type: 'drag', ask: 'Glisse chaque forme à sa place.', items: ts.map(t => ({ id: t, h: Art.shape(t, pick(COLS)), to: t })), slots: shuffle(ts).map(t => ({ key: t, h: Art.shape(t, '#e6dfc6') })) };
  });
  const SORTC = [
    { z: [['rouge', 'apple'], ['jaune', 'banana', 'sun']] },
    { z: [['vert', 'leaf'], ['orange', 'mango', 'fish']] }
  ];
  const colourSort = () => SORTC.map(r => {
    const slots = r.z.map(z => ({ key: z[0], zone: true, h: Art.swatch(V.colors[z[0]].hex, V.colors[z[0]].pat) }));
    const items = []; r.z.forEach(z => z.slice(1).forEach(k => items.push({ id: k, h: dr(k), to: z[0] })));
    return { type: 'drag', ask: `Range chaque image dans la bonne couleur : ${r.z.map(z => z[0]).join(' ou ')}.`, items: shuffle(items), slots };
  });
  const HAB = { parrot: 'sky', fish: 'water', crocodile: 'water', hippo: 'water', elephant: 'land', giraffe: 'land', monkey: 'land', tortoise: 'land', snake: 'land' };
  const habitat = () => [['parrot', 'fish', 'elephant', 'snake'], ['hippo', 'monkey', 'parrot', 'crocodile']].map(ks => ({
    type: 'drag', ask: 'Où vit chaque animal : dans le ciel, sur la terre ou dans l’eau ?', z3: true,
    items: shuffle(ks.map(k => ({ id: k, h: dr(k), to: HAB[k] }))), slots: [{ key: 'sky', zone: true, h: dr('sky') }, { key: 'land', zone: true, h: dr('land') }, { key: 'water', zone: true, h: dr('water') }]
  }));
  const P = (path, col, stretch) => `<svg viewBox="0 0 100 100" ${stretch ? 'preserveAspectRatio="none"' : ''}>${path.replace('COL', col)}</svg>`;
  const BOAT = [
    { key: 'hull', col: '#e8693a', path: '<path d="M0 0h100l-16 100H16z" fill="COL"/>', pos: 'left:10%;top:62%;width:80%;height:26%' },
    { key: 'mast', col: '#6b4a2a', path: '<rect width="100" height="100" fill="COL"/>', pos: 'left:48%;top:14%;width:5%;height:50%' },
    { key: 'sail', col: '#ffd23f', path: '<path d="M0 0L100 100H0z" fill="COL"/>', pos: 'left:54%;top:14%;width:30%;height:48%' }
  ];
  const HOUSE = [
    { key: 'walls', col: '#d9a35f', path: '<rect width="100" height="100" fill="COL"/>', pos: 'left:20%;top:46%;width:60%;height:42%' },
    { key: 'roof', col: '#b8742f', path: '<path d="M50 0L100 100H0z" fill="COL"/>', pos: 'left:10%;top:14%;width:80%;height:32%' },
    { key: 'door', col: '#6b4420', path: '<rect width="100" height="100" rx="12" fill="COL"/>', pos: 'left:44%;top:62%;width:12%;height:26%' }
  ];
  const assemble = () => [['Construis le bateau : glisse chaque morceau à sa place.', BOAT], ['Construis la case : glisse chaque morceau à sa place.', HOUSE]].map(([ask, parts]) => ({
    type: 'drag', ask, scene: true,
    items: shuffle(parts.map(p => ({ id: p.key, h: P(p.path, p.col), to: p.key }))),
    slots: parts.map(p => ({ key: p.key, pos: p.pos, h: P(p.path, '#d6e4ee', true), full: P(p.path, p.col, true) }))
  }));

  const fill = () => [2, 3, 5].map(n => ({ type: 'fill', n, ask: `Mets ${mg(n)} dans le panier.` }));
  const swap = () => shuffle(['elephant', 'giraffe', 'lion', 'fish', 'zebra']).slice(0, 2).map(k => ({ type: 'swap', key: k, ask: 'Remets le dessin dans le bon ordre : touche deux morceaux pour les échanger.' }));
  const memory = (kind, np) => () => [{ type: 'memory', kind, ask: 'Retrouve les deux images identiques.',
    pairs: kind === 'flag' ? shuffle(Object.keys(V.countries)).slice(0, np) : shuffle(Object.keys(AKEY).map(k => AKEY[k])).slice(0, np) }];
  const traceL = () => shuffle(L.letters).slice(0, 3).map(x => ({ type: 'trace', glyph: x.l, ask: `Trace la lettre ${x.l} avec ton doigt.` }));
  const traceN = () => shuffle(['1', '2', '3', '4', '5', '6', '7', '8', '9']).slice(0, 3).map(g => ({ type: 'trace', glyph: g, ask: `Trace le chiffre ${g} avec ton doigt.` }));
  const tpl = id => () => [{ type: 'color', tpl: id, ask: 'Touche une couleur, puis touche le dessin pour le colorier.' }];

  const CATS = [
    { id: 'letters', label: 'Lettres', c: 'turq', art: 'c_letters', games: [
      { id: 'listen', name: 'Écoute et choisis', ic: 'lion', make: letterListen },
      { id: 'drag', name: 'Glisse la lettre', ic: 'banana', make: letterDrag },
      { id: 'trace', name: 'Trace la lettre', ic: 'c_art', make: traceL }] },
    { id: 'numbers', label: 'Nombres', c: 'sun', art: 'c_numbers', games: [
      { id: 'count', name: 'Compte les mangues', ic: 'mango', make: counting },
      { id: 'basket', name: 'Remplis le panier', ic: 'basket', make: fill },
      { id: 'plus', name: 'Ajoute', ic: 'apple', make: plus },
      { id: 'trace', name: 'Trace le chiffre', ic: 'c_art', make: traceN }] },
    { id: 'colors', label: 'Couleurs', c: 'coral', art: 'c_colors', games: [
      { id: 'touch', name: 'Touche la couleur', ic: 'c_colors', make: colourTouch },
      { id: 'sort', name: 'Range par couleur', ic: 'leaf', make: colourSort },
      { id: 'mix', name: 'Mélange', ic: 'fish', make: colourMix }] },
    { id: 'shapes', label: 'Formes', c: 'violet', art: 'c_shapes', games: [
      { id: 'drag', name: 'Glisse les formes', ic: 'c_shapes', make: shapeDrag },
      { id: 'build', name: 'Construis', ic: 'boat', make: assemble },
      { id: 'find', name: 'Trouve la forme', ic: 'star', make: shapeFind }] },
    { id: 'logic', label: 'Logique', c: 'leaf', art: 'c_logic', games: [
      { id: 'suite', name: 'La suite', ic: 'banana', make: suite },
      { id: 'odd', name: 'L’intrus', ic: 'coconut', make: intrus },
      { id: 'puzzle', name: 'Puzzle', ic: 'giraffe', make: swap },
      { id: 'memory', name: 'Mémoire', ic: 'tortoise', make: memory('draw', 3) }] },
    { id: 'art', label: 'Art', c: 'turq', art: 'c_art', games: [
      { id: 'soleil', name: 'Colorie le soleil', ic: 'sun', make: tpl('soleil') },
      { id: 'case', name: 'Colorie la case', ic: 'house', make: tpl('case') },
      { id: 'poisson', name: 'Colorie le poisson', ic: 'fish', make: tpl('poisson') },
      { id: 'baobab', name: 'Colorie le baobab', ic: 'tree', make: tpl('baobab') },
      { id: 'free', name: 'Dessin libre', ic: 'c_art', make: () => [{ type: 'free', ask: 'Dessine ce que tu veux avec ton doigt.' }] }] },
    { id: 'music', label: 'Musique', c: 'violet', art: 'c_music', games: [
      { id: 'xylo', name: 'Le xylophone', ic: 'c_music', make: () => [{ type: 'xylo', ask: 'Touche les lames pour faire de la musique.' }] },
      { id: 'drum', name: 'Le djembé', ic: 'drum', make: () => [{ type: 'drum', ask: 'Tape sur le djembé !' }] },
      { id: 'melody', name: 'Écoute et répète', ic: 'star', make: () => [2, 3, 4].map(len => ({ type: 'melody', len, ask: 'Écoute, puis rejoue les mêmes lames.' })) }] },
    { id: 'countries', label: 'Pays', c: 'coral', art: 'c_countries', games: [
      { id: 'flags', name: 'Les drapeaux', ic: 'c_countries', make: flags },
      { id: 'memory', name: 'Mémoire des drapeaux', ic: 'star', make: memory('flag', 3) }] },
    { id: 'nature', label: 'Nature', c: 'leaf', art: 'c_nature', games: [
      { id: 'animals', name: 'Les animaux', ic: 'elephant', make: animals },
      { id: 'habitat', name: 'Où vivent-ils ?', ic: 'parrot', make: habitat },
      { id: 'memory', name: 'Mémoire des animaux', ic: 'monkey', make: memory('draw', 4) }] },
    { id: 'stories', label: 'Histoires', c: 'sun', art: 'c_stories', games: L.stories.map(s => ({ id: s.id, name: s.title, e: s.cover, make: () => [{ type: 'story', story: s, ask: s.title }] })) }
  ];
  return { CATS, LKEY, AKEY, shuffle, pick, COLS };
})();
