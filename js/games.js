// Catégories et mini-jeux de LUMI. make(n, ctx) fabrique les manches : n = nombre de choix (3, ou 2 après 1 étoile), ctx.age = 3|4|5.
// Textes et phrases prononcées viennent de I18n (identifiants stables). Ajouter un jeu = ajouter une ligne dans la catégorie voulue.
window.Games = (function () {
  const L = LUMI, V = L.vocab, dr = Draw.svg, t = (k, v) => I18n.t(k, v), line = (k, v) => I18n.line(k, v);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
  const AKEY = { lion: 'lion', elephant: 'elephant', girafe: 'giraffe', zebre: 'zebra', singe: 'monkey', crocodile: 'crocodile', hippo: 'hippo', tortue: 'tortoise', perroquet: 'parrot', flamant: 'flamingo', poisson: 'fish', serpent: 'snake' };
  const COLS = ['#e5483c', '#2f7de1', '#f2c200', '#3fae49', '#8a55c9', '#f28c1b'];
  const letters = () => I18n.raw('letters');
  // Lettres mélangées ; si la mission du jour impose une lettre (ctx.letter), elle passe en premier.
  const lettersFor = ctx => { const all = shuffle(letters()), x = ctx && ctx.letter && all.find(y => y.l === ctx.letter); return x ? [x].concat(all.filter(y => y !== x)) : all; };
  const others = (all, ok, n) => shuffle(all.filter(x => x !== ok)).slice(0, n - 1).concat([ok]);
  const mangoes = k => Array.from({ length: k }, () => `<span class="it">${dr('mango')}</span>`).join('');
  const mg = n => I18n.mg(n);
  const cap = ctx => Rules.caps(ctx.age);
  const between = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  // ---- manches « choisir » ----
  const letterListen = (n, ctx) => lettersFor(ctx).slice(0, 4).map(x => ({
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
  // V3.4 — quantités à associer : on voit un chiffre, on choisit le groupe de mangues qui correspond (même plafond d'âge que « Compte les mangues »)
  const qtyMatch = (n, ctx) => { const mx = cap(ctx).countMax, pool = Array.from({ length: Math.max(mx, 3) }, (_, i) => i + 1);
    return [0, 1, 2, 3].map(() => { const k = between(1, mx); return { type: 'choose', ask: line('ask.qty', { n: k, m: mg(k) }), show: `<div class="bigl">${k}</div>`,
      choices: shuffle(others(pool, k, n)).map(v => ({ h: `<span class="grp">${mangoes(v)}</span>`, ok: v === k, say: line('say.count', { m: mg(k), n: k }) })) }; }); };
  const plus = (n, ctx) => {
    const mx = cap(ctx).plusMax, combos = [[1, 1], [2, 1], [1, 3], [2, 2], [3, 2], [4, 2]].filter(([a, b]) => a + b <= mx);
    return shuffle(combos).slice(0, 3).map(([a, b]) => {
      const k = a + b, pool = Array.from({ length: mx + 1 }, (_, i) => i + 1).filter(x => x >= 2);
      return { type: 'choose', ask: line('ask.plus', { a: mg(a), b: mg(b), na: a, nb: b }), show: `${mangoes(a)}<span class="op">+</span>${mangoes(b)}`, choices: shuffle(others(pool, k, n)).map(v => ({ h: String(v), ok: v === k, say: line('say.count', { m: mg(k), n: k }) })) };
    });
  };

  // ---- V3.5 : jeux des paliers 6, 7 et 8 ans (mêmes types de manches que les autres jeux ; plafonds dans rules.js) ----
  const cm = ctx => cap(ctx).calcMax || 20, nch = (n, ctx) => (n >= 3 ? (cap(ctx).choices || 3) : 2);
  // valeurs proches de la bonne réponse (pas de doublon, jamais négatives), par pas de `step`
  const nearby = (v, k, lo, hi, step) => { const s = new Set([v]); let g = 0; while (s.size < k && g++ < 80) { const c = v + between(1, 4) * step * (Math.random() < 0.5 ? -1 : 1); if (c >= lo && c <= hi) s.add(c); } for (let c = lo; s.size < k && c <= hi; c += step) s.add(c); return [...s]; };
  const numTiles = (v, k, lo, hi, step) => shuffle(nearby(v, k, lo, hi, step || 1)).map(x => ({ h: String(x), ok: x === v }));
  const calc = (a, b, sym, res, op, k, step = 1, max = Infinity) => ({ type: 'choose', ask: line('ask.calc', { a, b, op: t('op.' + op) }), show: `<div class="calc">${a} ${sym} ${b} = <span class="q">?</span></div>`, choices: numTiles(res, k, Math.max(0, res - 8 * step), Math.min(max, res + 8 * step), step) });
  const addG = (n, ctx) => {
    const max = cm(ctx);
    return Array.from({ length: 4 }, (_, i) => {
      const total = between(max === 100 && i >= 2 ? 51 : 3, max);
      const a = between(2, total - 1);
      return calc(a, total - a, '+', total, 'plus', nch(n, ctx), 1, max);
    });
  };
  const subG = (n, ctx) => {
    const max = cm(ctx);
    return Array.from({ length: 4 }, (_, i) => {
      const a = between(max === 100 && i >= 2 ? 51 : 6, max);
      const b = between(1, Math.min(a - 1, max > 20 ? 30 : 12));
      return calc(a, b, '−', a - b, 'minus', nch(n, ctx), 1, max);
    });
  };
  const tablesG = (n, ctx) => [0, 1, 2, 3].map(() => { const a = pick(cap(ctx).tables || [2, 5, 10]), b = between(2, 10); return calc(a, b, '×', a * b, 'times', nch(n, ctx), a); });
  const compareG = (n, ctx) => [0, 1, 2, 3].map((i) => {
    const mx = cm(ctx), k = n >= 3 ? 3 : 2, set = new Set(); while (set.size < k) set.add(between(1, mx));
    const vals = [...set], big = i % 2 === 0, tgt = big ? Math.max(...vals) : Math.min(...vals);
    return { type: 'choose', ask: line(big ? 'ask.bigger' : 'ask.smaller'), choices: shuffle(vals).map(v => ({ h: String(v), ok: v === tgt })) };
  });
  const COINS = [5, 10, 25, 50, 100, 500];
  const moneyG = (n, ctx) => [0, 1, 2].map(() => {
    const cs = Array.from({ length: between(2, 4) }, () => pick(COINS.slice(0, 5))), sum = cs.reduce((a, b) => a + b, 0);
    return { type: 'choose', ask: line('ask.money'), show: cs.map(c => `<span class="coin">${c}</span>`).join('<span class="op">+</span>'),
      choices: shuffle(nearby(sum, nch(n, ctx), 5, sum + 60, 5)).map(v => ({ h: `<span class="tx">${v} F</span>`, ok: v === sum })) };
  });
  const clockSvg = (h, m) => { const ha = ((h % 12) + m / 60) * 30, ma = m * 6, p = (a, r) => [(50 + r * Math.sin(a * Math.PI / 180)).toFixed(1), (50 - r * Math.cos(a * Math.PI / 180)).toFixed(1)];
    const ticks = Array.from({ length: 12 }, (_, i) => { const [x1, y1] = p(i * 30, 41), [x2, y2] = p(i * 30, 46); return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#5a2a12" stroke-width="${i % 3 ? 1.5 : 3}" stroke-linecap="round"/>`; }).join('');
    const [hx, hy] = p(ha, 24), [mx2, my2] = p(ma, 36);
    return `<svg viewBox="0 0 100 100" class="clock"><circle cx="50" cy="50" r="48" fill="#fff6df" stroke="#b8631f" stroke-width="4"/>${ticks}<path d="M50 50L${hx} ${hy}" stroke="#e4572e" stroke-width="5" stroke-linecap="round"/><path d="M50 50L${mx2} ${my2}" stroke="#2f7de1" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="50" r="3.5" fill="#5a2a12"/></svg>`; };
  const hhmm = (h, m) => (I18n.lang() === 'en' ? `${h}:${String(m).padStart(2, '0')}` : (m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`));
  const clockG = (n, ctx) => [0, 1, 2, 3].map(() => {
    const age = ctx && ctx.age, m = age >= 8 ? pick([0, 15, 30, 45]) : age >= 7 ? pick([0, 30]) : 0, h = between(1, 12), k = nch(n, ctx), opts = new Map([[hhmm(h, m), true]]);
    let g = 0; while (opts.size < k && g++ < 40) { const hh = ((h - 1 + between(-2, 2) + 12) % 12) + 1, mm = Math.random() < 0.4 ? (m === 0 ? 30 : 0) : m; opts.set(hhmm(hh, mm), opts.get(hhmm(hh, mm)) || false); }
    return { type: 'choose', ask: line('ask.clock'), show: `<div class="clockbox">${clockSvg(h, m)}</div>`, choices: shuffle([...opts.entries()]).map(([s, ok]) => ({ h: `<span class="tx">${s}</span>`, ok })) };
  });
  const missingG = (n, ctx) => shuffle(letters().filter(y => /^[A-Za-z]/.test(y.word))).slice(0, 4).map(y => {
    const w = y.word, first = w[0].toUpperCase(), pool = 'ABCDEFGHIJKLMNOPRSTUVZ'.split('').filter(c => c !== first);
    return { type: 'choose', ask: line('ask.missing'), show: `<span class="it">${dr(y.key)}</span><div class="word">_${w.slice(1)}</div>`, choices: shuffle(shuffle(pool).slice(0, nch(n, ctx) - 1).concat([first])).map(c => ({ h: c, ok: c === first })) };
  });
  // Les choix reprennent le même son initial : l'enfant doit lire la syllabe entière.
  const SYLLABLES = {
    fr: [['moto', 'mo', 'ma', 'mi', 'mu'], ['lapin', 'la', 'le', 'li', 'lo'],
      ['bateau', 'ba', 'bo', 'bi', 'bu'], ['tomate', 'to', 'ta', 'ti', 'tu'],
      ['vélo', 'vé', 'va', 'vi', 'vo'], ['pirate', 'pi', 'pa', 'po', 'pu']],
    en: [['robot', 'ro', 'ra', 're', 'ru'], ['tiger', 'ti', 'ta', 'to', 'tu'],
      ['piano', 'pi', 'pa', 'po', 'pu'], ['zebra', 'ze', 'za', 'zi', 'zo'],
      ['music', 'mu', 'ma', 'me', 'mo'], ['hotel', 'ho', 'ha', 'he', 'hi']]
  };
  const syllables = (n, ctx) => shuffle(SYLLABLES[I18n.lang()]).slice(0, 4).map(([word, first, ...distractors]) => ({
    type: 'choose',
    ask: line('ask.syllable', { word, id: word }),
    show: `<div class="word">${word}</div>`,
    choices: shuffle([first, ...shuffle(distractors).slice(0, nch(n, ctx) - 1)])
      .map(syllable => ({ h: syllable, ok: syllable === first }))
  }));
  // L'atelier d'assemblage présente uniquement des mots à deux syllabes écrites.
  const BUILD_WORDS = { fr: new Set(['moto', 'lapin', 'bateau', 'vélo']), en: new Set(['robot', 'tiger', 'zebra', 'music', 'hotel']) };
  const buildWord = (n, ctx) => shuffle(SYLLABLES[I18n.lang()].filter(([word]) => BUILD_WORDS[I18n.lang()].has(word))).slice(0, 4).map(([word, first, ...distractors]) => {
    const end = word.slice(first.length);
    return {
      type: 'choose',
      ask: line('ask.buildword'),
      show: `<div class="word word-parts"><span>${first}</span><span aria-hidden="true">+</span><span>${end}</span></div>`,
      choices: shuffle([first, ...shuffle(distractors).slice(0, nch(n, ctx) - 1)])
        .map(start => ({ h: `<span class="tx">${start}${end}</span>`, ok: start === first,
          say: { id: I18n.lang() + ':word.' + word, text: word } }))
    };
  });
  const RHYMES = {
    fr: [[['chat', '🐱'], ['rat', '🐀']], [['bateau', '⛵'], ['château', '🏰']],
      [['mouton', '🐑'], ['bouton', '🔘']], [['lapin', '🐇'], ['sapin', '🌲']]],
    en: [[['cat', '🐱'], ['hat', '🎩']], [['boat', '⛵'], ['goat', '🐐']],
      [['mouse', '🐭'], ['house', '🏠']], [['moon', '🌙'], ['spoon', '🥄']]]
  };
  const rhymeWord = ([word, picture]) => `<span class="rhyme-word"><span class="rhyme-picture" aria-hidden="true">${picture}</span><span>${word}</span></span>`;
  const rhymeGame = (n, ctx) => {
    const pairs = RHYMES[I18n.lang()];
    const answers = pairs.map(([, answer]) => answer);
    return shuffle(pairs).map(([target, answer]) => {
      const choices = shuffle(others(answers, answer, nch(n, ctx)));
      const options = choices.map(([word]) => word);
      return {
        type: 'choose', ask: line('ask.rhyme', { word: target[0], id: target[0] }),
        show: rhymeWord(target),
        listen: line('rhyme.options', { words: options.join(', '), id: options.join('-') }),
        choices: choices.map(item => ({ h: rhymeWord(item), ok: item === answer,
          say: line('rhyme.correct', { word: target[0], answer: answer[0], id: target[0] }) }))
      };
    });
  };
  const numseqG = (n, ctx) => [0, 1, 2, 3].map(() => {
    const step = pick(ctx && ctx.age >= 7 ? [2, 3, 5, 10] : [1, 2, 5, 10]), a = between(0, 10) * (step >= 5 ? 1 : 1), seq = [0, 1, 2, 3].map(i => a + i * step), res = a + 4 * step;
    return { type: 'choose', ask: line('ask.numseq'), show: seq.map(x => `<span class="it num">${x}</span>`).join('') + '<span class="q">?</span>', choices: numTiles(res, nch(n, ctx), Math.max(0, res - 3 * step), res + 3 * step, step) };
  });
  const RHYTHMS = {
    4: ['1100', '1010', '1001', '0110', '0101', '0011'],
    6: ['111000', '101010', '110010', '101100', '100101', '011010', '010101', '001110']
  };
  const rhythm = (n, ctx) => {
    const short = shuffle(RHYTHMS[4]), long = shuffle(RHYTHMS[6]);
    const rounds = ctx.age >= 8 ? long.slice(0, 3) : ctx.age === 7 ? [short[0], ...long.slice(0, 2)] : short.slice(0, 3);
    return rounds.map(sequence => ({
      type: 'choose',
      ask: line('ask.rhythm'),
      rhythm: sequence,
      choices: shuffle(others(RHYTHMS[sequence.length], sequence, nch(n, ctx))).map(pattern => {
        const beats = [...pattern];
        const labels = beats.map(beat => t(beat === '1' ? 'music.hit' : 'music.rest'));
        return {
          ok: pattern === sequence,
          h: `<span class="rhythm-pattern" role="img" aria-label="${labels.join(', ')}">${beats.map(beat =>
            `<span aria-hidden="true" class="rhythm-beat${beat === '1' ? ' rhythm-hit' : ''}">${beat === '1' ? '●' : '–'}</span>`).join('')}</span>`
        };
      })
    }));
  };
  const CAPITALS = { mali: 'Bamako', senegal: 'Dakar', civ: 'Yamoussoukro', burkina: 'Ouagadougou', guinee: 'Conakry', ghana: 'Accra', nigeria: 'Abuja', cameroun: 'Yaoundé', niger: 'Niamey', benin: 'Porto-Novo' };
  const capitalsG = (n, ctx) => shuffle(Object.keys(CAPITALS)).slice(0, 4).map(id => ({
    type: 'choose', ask: line('ask.capital', { of: t('v.countryof.' + id), name: t('v.country.' + id) }), show: `<div class="flagbox">${Art.flag(V.countries[id].flag)}</div>`,
    choices: shuffle(others(Object.keys(CAPITALS), id, nch(n, ctx))).map(c => ({ h: `<span class="tx">${CAPITALS[c]}</span>`, ok: c === id }))
  }));
  const mapCountries = (n, ctx) => {
    const younger = ctx.age <= 6;
    const pool = younger ? ['mali', 'senegal', 'guinee', 'civ', 'ghana', 'burkina'] : Object.keys(CAPITALS);
    return shuffle(pool).slice(0, 4).map(id => ({
      type: 'choose',
      ask: line('ask.countryMap'),
      show: `<div class="map-exercise">${AfricaMap.draw(id, t('map.description'))}
        <details class="map-clue"><summary>${t('map.hint')}</summary><p>${t('map.clue.' + id)}</p></details></div>`,
      choices: shuffle(others(pool, id, younger ? n : nch(n, ctx))).map(key => {
        const name = t('v.country.' + key);
        return { h: `<span class="tx">${name}</span>`, ok: key === id, say: line('say.country', { name, id: key }) };
      })
    }));
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
  const shapeColor = (n, ctx) => shuffle(Object.keys(L.shapes)).map(shape => {
    const colors = Object.keys(V.colors);
    const color = pick(colors);
    const otherColor = pick(colors.filter(c => c !== color));
    const otherShape = pick(Object.keys(L.shapes).filter(s => s !== shape));
    const figure = (s, c) => {
      const { hex, pat } = V.colors[c];
      const label = t('shapeColor.label', { shape: t('v.shape.' + s), color: t('v.color.' + c) });
      return `<span class="shape-color" role="img" aria-label="${label}">${Art.shape(s, hex, pat)}</span>`;
    };
    const k = nch(n, ctx);
    const wrong = shuffle([[shape, otherColor], [otherShape, color]]).concat([[otherShape, otherColor]]);
    return {
      type: 'choose',
      ask: line('ask.shapeColor', { shape: t('v.shape.' + shape), color: t('v.color.' + color), id: shape + '-' + color }),
      show: `<span class="shape-color-target">${figure(shape, color)}</span>`,
      choices: shuffle([[shape, color], ...wrong.slice(0, k - 1)]).map(([s, c]) => ({
        h: figure(s, c), ok: s === shape && c === color
      }))
    };
  });
  function symmetry(n, ctx) {
    const half = ctx.age >= 8 ? 3 : 2;
    const rows = ctx.age >= 7 ? 3 : 2;
    const positions = Array.from({ length: rows * half }, (_, i) => i + 1);
    return shuffle(positions).slice(0, 4).map(source => {
      const row = Math.floor((source - 1) / half);
      const col = (source - 1) % half;
      const answer = (row + 1) * half - col;
      const cells = positions.map((number, i) => {
        const x = (i % half) * 44;
        const y = Math.floor(i / half) * 44;
        const right = x + half * 44;
        return `<rect x="${x + 2}" y="${y + 2}" width="40" height="40" rx="7" fill="${number === source ? '#ffc84a' : '#fff6df'}"/>
          ${number === source ? `<circle cx="${x + 22}" cy="${y + 22}" r="7" fill="currentColor"/>` : ''}
          <rect x="${right + 2}" y="${y + 2}" width="40" height="40" rx="7" fill="#fff6df"/>
          <text x="${right + 22}" y="${y + 22}">${number}</text>`;
      }).join('');
      return {
        type: 'choose',
        ask: line('ask.symmetry'),
        show: `<svg class="symmetry-grid" viewBox="0 0 ${half * 88} ${rows * 44}" role="img" aria-label="${t('symmetry.grid', { row: row + 1, col: col + 1, half })}">
          ${cells}<path d="M${half * 44} 0v${rows * 44}" stroke="currentColor" stroke-width="2" stroke-dasharray="5 4"/></svg>`,
        choices: shuffle(others(positions, answer, nch(n, ctx))).map(value => ({ h: String(value), ok: value === answer }))
      };
    });
  }
  const POOL = ['mango', 'banana', 'apple', 'coconut', 'fish', 'sun'];
  const DIGITS = [1, 2, 3, 4];
  const SUDOKU = [0, 1, 2, 3, 2, 3, 0, 1, 1, 2, 3, 0, 3, 0, 1, 2];
  function sudoku(n, ctx) {
    return shuffle(SUDOKU.map((_, i) => i)).slice(0, 4).map(target => {
      const values = shuffle(DIGITS);
      const grid = SUDOKU.map(i => values[i]);
      const answer = grid[target];
      const row = Math.floor(target / 4), col = target % 4;
      const hidden = new Set([target]);
      if (ctx.age >= 8) {
        // Un trou en plus dans la ligne et la colonne, avec des valeurs distinctes.
        const inRow = pick(grid.map((_, i) => i).filter(i => i !== target && Math.floor(i / 4) === row));
        const inCol = pick(grid.map((_, i) => i).filter(i => i !== target && i % 4 === col && grid[i] !== grid[inRow]));
        hidden.add(inRow);
        hidden.add(inCol);
      }
      const rows = Array.from({ length: 4 }, (_, y) => `<tr>${Array.from({ length: 4 }, (_, x) => {
        const i = y * 4 + x;
        return `<td${i === target ? ' class="sudoku-target"' : ''}>${i === target ? '?' : hidden.has(i) ? '·' : grid[i]}</td>`;
      }).join('')}</tr>`).join('');
      return {
        type: 'choose',
        ask: line('ask.sudoku'),
        show: `<table class="sudoku-grid" aria-label="${t('sudoku.grid', { row: row + 1, col: col + 1 })}"><tbody>${rows}</tbody></table>`,
        choices: shuffle(others(DIGITS, answer, nch(n, ctx))).map(value => ({ h: String(value), ok: value === answer }))
      };
    });
  }
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
  const SCIENCE = {
    water: [
      ['fall', 'cloud', 'rain', 'sun', 'river', 'sprout'],
      ['heat', 'sun', 'evaporation', 'rain', 'cloud', 'river'],
      ['cool', 'cloud', 'condensation', 'evaporation', 'river', 'sprout'],
      ['flow', 'water', 'river', 'sun', 'cloud', 'evaporation']
    ],
    plants: [
      ['drink', 'sprout', 'water', 'rock', 'sand', 'cloud'],
      ['shine', 'leaf', 'sun', 'rock', 'sand', 'river'],
      ['begin', 'sprout', 'seed', 'leaf', 'rock', 'cloud'],
      ['roots', 'roots', 'rootsPart', 'leaf', 'flower', 'seed']
    ]
  };
  const SCIENCE_ART = {
    cloud: '<path d="M25 72a16 16 0 0 1-3-32 24 24 0 0 1 46-6 19 19 0 1 1 9 38Z" fill="#f6fbff" stroke="#517a9d" stroke-width="4"/>',
    sprout: '<path d="M12 77q38-14 76 0v13H12z" fill="#a6683d"/><path d="M50 77V36" stroke="#356f30" stroke-width="5"/><path d="M50 50Q16 53 17 27q29-1 33 23m0-9Q52 17 79 17q-3 25-29 24" fill="#4eab47"/>',
    roots: '<path d="M8 47h84v43H8z" fill="#a6683d"/><path d="M50 47v39m0-25-17 15m17-7 18 11" stroke="#ffe1ab" stroke-width="4"/><path d="M50 48V25" stroke="#356f30" stroke-width="5"/><path d="M50 33Q23 35 24 15q25 0 26 18m0-6Q52 9 73 9q-3 19-23 18" fill="#4eab47"/>'
  };
  const scienceArt = icon => SCIENCE_ART[icon] ? `<svg viewBox="0 0 100 100" aria-hidden="true">${SCIENCE_ART[icon]}</svg>` : dr(icon);
  const science = topic => (n, ctx) => SCIENCE[topic].map(([id, icon, answer, ...wrong]) => ({
    type: 'choose',
    ask: line('science.' + id),
    show: `<span class="it" aria-hidden="true">${scienceArt(icon)}</span>`,
    choices: shuffle([answer, ...shuffle(wrong).slice(0, nch(n, ctx) - 1)]).map(value => ({
      h: `<span class="tx">${t('science.' + value)}</span>`, ok: value === answer, say: line('science.' + value)
    }))
  }));
  const FOOD_CHAINS = [
    [['grass', 'zebra', 'lion'], 1, ['frog', 'lion', 'bird']],
    [['leaf', 'caterpillar', 'bird'], 2, ['grass', 'leaf', 'zebra']],
    [['grass', 'grasshopper', 'frog'], 1, ['zebra', 'grass', 'leaf']],
    [['grass', 'zebra', 'lion'], 0, ['lion', 'zebra', 'bird']]
  ];
  const FOOD_ART = {
    grass: '<path d="M21 86Q20 55 12 33q25 13 32 53M43 86Q37 44 53 15q10 34 8 71m-4 0q7-35 32-49-12 23-14 49" fill="#459d42"/><path d="M12 86h76" stroke="#94633e" stroke-width="6" stroke-linecap="round"/>',
    caterpillar: '<path d="M11 76Q46 48 90 70" stroke="#44853a" stroke-width="8" stroke-linecap="round"/><g fill="#87c850" stroke="#397342" stroke-width="3"><circle cx="26" cy="59" r="11"/><circle cx="45" cy="53" r="12"/><circle cx="64" cy="53" r="12"/><circle cx="82" cy="47" r="13"/></g><path d="m78 34-3-10m11 10 5-9" stroke="#397342" stroke-width="3"/><circle cx="86" cy="45" r="2.5" fill="#192620"/>',
    bird: '<path d="M14 55 6 75l25-8" fill="#35528a"/><ellipse cx="45" cy="61" rx="29" ry="19" fill="#528bdd"/><ellipse cx="39" cy="63" rx="16" ry="12" fill="#35528a"/><circle cx="69" cy="43" r="18" fill="#528bdd"/><path d="m84 43 15 5-16 8" fill="#f2a830"/><circle cx="74" cy="40" r="3" fill="#241b16"/>',
    grasshopper: '<path d="M34 64 19 83m29-20 15-20 12 40M76 34l11-19m-16 16 5-19" fill="none" stroke="#497336" stroke-width="4" stroke-linecap="round"/><ellipse cx="43" cy="58" rx="29" ry="11" transform="rotate(-20 43 58)" fill="#83bf49"/><circle cx="73" cy="41" r="13" fill="#74ab40"/><circle cx="77" cy="38" r="3" fill="#19351e"/>',
    frog: '<ellipse cx="50" cy="70" rx="33" ry="16" fill="#70ad43"/><circle cx="32" cy="40" r="15" fill="#83bc4c"/><circle cx="68" cy="40" r="15" fill="#83bc4c"/><ellipse cx="50" cy="55" rx="34" ry="23" fill="#83bc4c"/><circle cx="32" cy="39" r="4" fill="#24351d"/><circle cx="68" cy="39" r="4" fill="#24351d"/><path d="M37 57q13 13 26 0" fill="none" stroke="#35552c" stroke-width="3" stroke-linecap="round"/>'
  };
  const foodLabel = key => t('chain.' + key);
  const foodFigure = key => `<span class="food-figure">${FOOD_ART[key] ? `<svg viewBox="0 0 100 100" aria-hidden="true">${FOOD_ART[key]}</svg>` : `<span aria-hidden="true">${dr(key)}</span>`}<span>${foodLabel(key)}</span></span>`;
  const foodChain = (n, ctx) => FOOD_CHAINS.map(([chain, missing, wrong]) => {
    const answer = chain[missing];
    return {
      type: 'choose',
      ask: line('ask.chain'),
      show: `<ol class="food-chain" role="list" aria-label="${t('chain.diagram')}">${chain.map((key, i) => `<li>${i === missing ? `<span class="food-missing" role="img" aria-label="${t('chain.missing')}">?</span>` : foodFigure(key)}</li>`).join('')}</ol>`,
      choices: shuffle([answer, ...shuffle(wrong).slice(0, nch(n, ctx) - 1)]).map(key => ({
        h: foodFigure(key), ok: key === answer, say: line('chain.' + key)
      }))
    };
  });
  const flags = n => shuffle(Object.keys(V.countries)).slice(0, 4).map(id => ({
    type: 'choose', ask: line('ask.flag', { of: t('v.countryof.' + id), name: t('v.country.' + id), id }),
    choices: shuffle(others(Object.keys(V.countries), id, n)).map(c => ({ h: Art.flag(V.countries[c].flag), ok: c === id, say: line('say.country', { name: t('v.country.' + id), id }) }))
  }));

  // ---- manches « glisser » ----
  const letterDrag = (n, ctx) => lettersFor(ctx).slice(0, 3).map(x => ({
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
  const traceL = (n, ctx) => lettersFor(ctx).slice(0, cap(ctx).traces).map(x => ({ type: 'trace', glyph: x.l, ask: line('ask.letter.trace', { l: x.l }) }));
  const traceN = (n, ctx) => shuffle(['1', '2', '3', '4', '5', '6', '7', '8', '9']).slice(0, cap(ctx).traces).map(g => ({ type: 'trace', glyph: g, ask: line('ask.num.trace', { l: g }) }));
  const tpl = id => () => [{ type: 'color', tpl: id, ask: line('ask.paint') }];

  // lvl : niveau d'âge minimal conseillé (3, 4 ou 5) ; skills : voir skills.js
  const G = (id, ic, make, lvl) => ({ id, ic, make, lvl: lvl || 3 });
  const CATS = [
    { id: 'letters', c: 'turq', art: 'c_letters', games: [G('listen', 'lion', letterListen), G('drag', 'banana', letterDrag, 4), G('trace', 'c_art', traceL, 4), G('missing', 'lion', missingG, 6), G('syllables', 'c_letters', syllables, 5), G('buildword', 'c_letters', buildWord, 6), G('rhyme', 'c_letters', rhymeGame, 5)] },
    { id: 'numbers', c: 'sun', art: 'c_numbers', games: [G('count', 'mango', counting), G('match', 'mango', qtyMatch), G('basket', 'basket', fill), G('plus', 'apple', plus, 5), G('trace', 'c_art', traceN, 4),
      G('add', 'apple', addG, 6), G('sub', 'banana', subG, 6), G('compare', 'star', compareG, 6), G('tables', 'coconut', tablesG, 7), G('money', 'sun', moneyG, 7), G('clock', 'sun', clockG, 7)] },
    { id: 'colors', c: 'coral', art: 'c_colors', games: [G('touch', 'c_colors', colourTouch), G('sort', 'leaf', colourSort, 4), G('mix', 'fish', colourMix, 5)] },
    { id: 'shapes', c: 'violet', art: 'c_shapes', games: [G('drag', 'c_shapes', shapeDrag), G('build', 'boat', assemble, 4), G('find', 'star', shapeFind), G('symmetry', 'c_shapes', symmetry, 6), G('shapecolor', 'c_shapes', shapeColor, 4)] },
    { id: 'logic', c: 'leaf', art: 'c_logic', games: [G('suite', 'banana', suite, 4), G('odd', 'coconut', intrus, 4), G('puzzle', 'giraffe', swap, 4), G('memory', 'tortoise', memory('draw', 3)), G('numseq', 'banana', numseqG, 6), G('sudoku', 'c_logic', sudoku, 7)] },
    { id: 'art', c: 'turq', art: 'c_art', games: [G('soleil', 'sun', tpl('soleil')), G('case', 'house', tpl('case')), G('poisson', 'fish', tpl('poisson')), G('baobab', 'tree', tpl('baobab')),
      G('free', 'c_art', () => [{ type: 'free', ask: line('ask.free') }])] },
    { id: 'music', c: 'violet', art: 'c_music', games: [G('xylo', 'c_music', () => [{ type: 'xylo', ask: line('ask.xylo') }]), G('drum', 'drum', () => [{ type: 'drum', ask: line('ask.drum') }]),
      G('melody', 'star', (n, ctx) => cap(ctx).melody.map(len => ({ type: 'melody', len, ask: line('ask.melody') })), 4), G('rhythm', 'drum', rhythm, 6)] },
    { id: 'countries', c: 'coral', art: 'c_countries', games: [G('flags', 'c_countries', flags, 4), G('memory', 'star', memory('flag', 3), 4), G('capitals', 'c_countries', capitalsG, 7), G('map', 'c_countries', mapCountries, 6)] },
    { id: 'nature', c: 'leaf', art: 'c_nature', games: [G('animals', 'elephant', animals), G('habitat', 'parrot', habitat, 4), G('memory', 'monkey', memory('draw', 4), 4),
      G('plants', 'leaf', science('plants'), 5), G('water', 'water', science('water'), 6), G('chain', 'leaf', foodChain, 6)] },
    { id: 'stories', c: 'sun', art: 'c_stories', games: L.stories.map(s => ({ id: s.id, title: s.title, e: s.cover, lvl: 3, make: () => { const st = localStory(s); return [{ type: 'story', story: st, ask: { id: st.code + ':story.' + s.id + '.title', text: st.title, lang: st.speech } }]; } })) }
  ];
  // Histoires : version de la langue courante si elle existe (texte, titre, langue de la voix) ; sinon le français d'origine.
  function localStory(s) {
    const lg = I18n.lang(), tr = lg !== 'fr' && L.storiesByLang && L.storiesByLang[lg] && L.storiesByLang[lg][s.id];
    if (tr) return Object.assign({}, s, { title: tr.title, origin: tr.origin, pages: s.pages.map((p, i) => Object.assign({}, p, { text: tr.pages[i] })), code: lg, speech: I18n.speech() });
    return Object.assign({}, s, { code: 'fr', speech: 'fr-FR' });
  }
  const label = c => t('cat.' + c.id), gameName = (c, g) => (c.id === 'stories' ? localStory(L.stories.find(s => s.id === g.id)).title : t('g.' + c.id + '.' + g.id));
  // Les 8 « mondes » de l'accueil : chacun regroupe une ou deux catégories réelles (aucun écran fictif).
  const GROUPS = [
    { id: 'letters', cats: ['letters'], art: 'c_letters' }, { id: 'numbers', cats: ['numbers'], art: 'c_numbers' },
    { id: 'shapes', cats: ['shapes', 'logic'], art: 'c_shapes' }, { id: 'colors', cats: ['colors', 'art'], art: 'c_colors' },
    { id: 'music', cats: ['music'], art: 'c_music' }, { id: 'nature', cats: ['nature'], art: 'c_nature' },
    { id: 'countries', cats: ['countries'], art: 'c_countries' }, { id: 'stories', cats: ['stories'], art: 'c_stories' }];
  return { CATS, GROUPS, AKEY, shuffle, pick, COLS, label, gameName, localStory };
})();
