// Illustrations vectorielles originales (démo) : faciles à remplacer par de vraies images.
window.Art = (function () {
  function child(av, cls) {
    av = av || { hair: 'short', shirt: '#2e9e5b' };
    const hair = '#2b1608', skin = '#7a4423';
    let top = '';
    if (av.hair === 'buns') top = `<circle cx="28" cy="30" r="13" fill="${hair}"/><circle cx="92" cy="30" r="13" fill="${hair}"/><path d="M26 58 Q28 22 60 22 Q92 22 94 58 Q60 40 26 58Z" fill="${hair}"/><circle cx="28" cy="30" r="4" fill="#ff7bb0"/><circle cx="92" cy="30" r="4" fill="#ff7bb0"/>`;
    else if (av.hair === 'wrap') top = `<path d="M22 60 Q24 14 60 14 Q96 14 98 60 Q60 40 22 60Z" fill="#ffc533"/><path d="M30 30 Q60 18 90 30" stroke="#f0605a" stroke-width="5" fill="none"/>`;
    else top = `<path d="M24 58 Q26 20 60 20 Q94 20 96 58 Q60 38 24 58Z" fill="${hair}"/>`;
    return `<svg class="${cls || ''}" viewBox="0 0 120 130" role="img" aria-label="Personnage">
      <path d="M18 130 Q20 94 60 94 Q100 94 102 130Z" fill="${av.shirt}"/>
      <path d="M44 100 L60 114 L76 100" stroke="#ffc533" stroke-width="4" fill="none"/>
      <circle cx="60" cy="62" r="36" fill="${skin}"/>${top}
      <ellipse cx="46" cy="64" rx="6" ry="7" fill="#fff"/><ellipse cx="74" cy="64" rx="6" ry="7" fill="#fff"/>
      <circle cx="47" cy="65" r="3.5" fill="#2b1608"/><circle cx="75" cy="65" r="3.5" fill="#2b1608"/>
      <circle cx="37" cy="78" r="5" fill="#e0805a" opacity=".6"/><circle cx="83" cy="78" r="5" fill="#e0805a" opacity=".6"/>
      <path d="M44 80 Q60 98 76 80Z" fill="#fff" stroke="#3a1f1a" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
  }
  function lion(cls) {
    let mane = '';
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; mane += `<circle cx="${60 + 38 * Math.cos(a)}" cy="${62 + 38 * Math.sin(a)}" r="15" fill="#b8631f"/>`; }
    return `<svg class="${cls || ''}" viewBox="0 0 120 130" role="img" aria-label="Lumi le lion">${mane}
      <circle cx="60" cy="62" r="34" fill="#b8631f"/><circle cx="60" cy="64" r="30" fill="#ffc84a"/>
      <circle cx="38" cy="38" r="9" fill="#ffc84a"/><circle cx="82" cy="38" r="9" fill="#ffc84a"/>
      <circle cx="49" cy="58" r="4.5" fill="#3a1f1a"/><circle cx="71" cy="58" r="4.5" fill="#3a1f1a"/>
      <circle cx="50.5" cy="56.5" r="1.5" fill="#fff"/><circle cx="72.5" cy="56.5" r="1.5" fill="#fff"/>
      <ellipse cx="60" cy="70" rx="14" ry="10" fill="#fff0c8"/><path d="M54 66 H66 L60 73Z" fill="#3a1f1a"/>
      <path d="M50 76 Q60 86 70 76" stroke="#3a1f1a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="40" cy="72" r="4" fill="#f0805a" opacity=".5"/><circle cx="80" cy="72" r="4" fill="#f0805a" opacity=".5"/></svg>`;
  }
  function shape(type, fill) {
    const f = fill || '#7a45c4', s = '#3a1f5c';
    const body = {
      circle: `<circle cx="50" cy="50" r="38" fill="${f}" stroke="${s}" stroke-width="4"/>`,
      square: `<rect x="14" y="14" width="72" height="72" rx="6" fill="${f}" stroke="${s}" stroke-width="4"/>`,
      triangle: `<path d="M50 10 L92 86 H8Z" fill="${f}" stroke="${s}" stroke-width="4" stroke-linejoin="round"/>`,
      rectangle: `<rect x="6" y="26" width="88" height="48" rx="6" fill="${f}" stroke="${s}" stroke-width="4"/>`
    }[type];
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
  }
  function star(on) { return `<span class="star ${on ? 'on' : ''}" aria-hidden="true">★</span>`; }
  function stars(n, max) { let s = ''; for (let i = 0; i < (max || 3); i++) s += star(i < n); return `<span class="stars" aria-label="${n} étoiles">${s}</span>`; }
  function scene() {
    return `<div class="scene" aria-hidden="true"><svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice">
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0ee"/><stop offset=".65" stop-color="#fdeec0"/></linearGradient></defs>
      <rect width="400" height="800" fill="url(#sky)"/><circle cx="335" cy="95" r="38" fill="#ffd44d"/>
      <path d="M0 600 Q100 550 200 595 T400 580 V800 H0Z" fill="#cfe39a"/>
      <path d="M0 670 Q120 625 240 670 T400 650 V800 H0Z" fill="#9fcf6a"/>
      <path d="M52 650 q-10 -90 -2 -140 h46 q8 50 -2 140z" fill="#8b5a2b"/>
      <ellipse cx="73" cy="500" rx="50" ry="26" fill="#5fa84a"/><ellipse cx="45" cy="488" rx="30" ry="18" fill="#6fba55"/><ellipse cx="102" cy="490" rx="30" ry="18" fill="#6fba55"/>
      <path d="M330 665 v-60" stroke="#6b4a2a" stroke-width="6"/><ellipse cx="330" cy="598" rx="44" ry="13" fill="#5fa84a"/>
      <path d="M255 600 h14 v-30 h12 v30 h14 v36 h-40z" fill="#d6a867" opacity=".8"/></svg></div>`;
  }
  // Scène de conte : décor SVG (ciel, collines, baobabs, village, fleuve) + personnages posés devant.
  function storyScene(theme, chars) {
    const P = {
      savane: ['#8fd3f0', '#fdeec0', '#b9d97a', '#8fbf55'], nuit: ['#18214f', '#3a4a8a', '#3f7a52', '#2f5f40'],
      village: ['#9bd6f2', '#fde7b0', '#e3c27a', '#c9a35a'], fleuve: ['#8fd3f0', '#e6f4d4', '#a9d27a', '#5bb8de'],
      baobab: ['#a6dcf3', '#fdeec0', '#c3dc86', '#9cc267']
    }[theme] || ['#8fd3f0', '#fdeec0', '#b9d97a', '#8fbf55'];
    const night = theme === 'nuit';
    const baobab = (x, s) => `<g transform="translate(${x} 150) scale(${s})"><path d="M-14 70 q-6 -50 -2 -75 h32 q4 25 -2 75z" fill="${night ? '#4b3a2a' : '#8b5a2b'}"/><ellipse cx="0" cy="-12" rx="38" ry="17" fill="${night ? '#2d6a44' : '#5fa84a'}"/><ellipse cx="-20" cy="-22" rx="20" ry="11" fill="${night ? '#357a50' : '#6fba55'}"/><ellipse cx="22" cy="-20" rx="20" ry="11" fill="${night ? '#357a50' : '#6fba55'}"/></g>`;
    let sky = `<defs><linearGradient id="g${theme}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient></defs><rect width="400" height="240" fill="url(#g${theme})"/>`;
    sky += night ? '<circle cx="330" cy="50" r="26" fill="#fff6cf"/><circle cx="342" cy="44" r="22" fill="#18214f"/>' + [[50, 30], [120, 60], [210, 25], [270, 70], [380, 110], [20, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#fff"/>`).join('')
      : '<circle cx="335" cy="50" r="30" fill="#ffd44d"/><circle cx="335" cy="50" r="40" fill="#ffd44d" opacity=".25"/>';
    sky += `<path d="M0 150 Q100 110 200 145 T400 135 V240 H0Z" fill="${P[2]}"/><path d="M0 185 Q120 155 240 188 T400 175 V240 H0Z" fill="${P[3]}"/>`;
    if (theme === 'fleuve') sky += `<path d="M120 240 C 140 200 230 200 190 150 S 300 140 270 100" stroke="${P[3]}" stroke-width="44" fill="none" stroke-linecap="round" opacity=".9"/><path d="M110 225 q15 -8 30 0 t30 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`;
    if (theme === 'village') sky += `<g font-size="34" text-anchor="middle"><text x="60" y="165">🛖</text><text x="330" y="160">🛖</text><text x="270" y="172">🌴</text></g>`;
    if (theme === 'baobab') sky += baobab(70, 1.5) + baobab(340, 0.9);
    if (theme === 'savane' || theme === 'nuit') sky += baobab(55, 1.1) + baobab(345, 0.8);
    const stars = '';
    return `<div class="sscene"><svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${sky}${stars}</svg><div class="chars">${(chars || []).map((c, i) => `<span style="animation-delay:${i * 0.25}s">${c}</span>`).join('')}</div></div>`;
  }
  /* ---- Couleurs : une pastille de couleur + un MOTIF (la couleur n'est jamais le seul indice) ---- */
  let pid = 0;
  function swatch(hex, pat) {
    const id = 'sw' + (pid++), W = 'rgba(255,255,255,.5)';
    const P = {
      dots: `<pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="3.5" fill="${W}"/></pattern>`,
      stripes: `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="7" height="16" fill="${W}"/></pattern>`,
      waves: `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 8Q4 2 8 8T16 8" stroke="${W}" stroke-width="3" fill="none"/></pattern>`,
      checks: `<pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${W}"/><rect x="12" y="12" width="12" height="12" fill="${W}"/></pattern>`,
      cross: `<pattern id="${id}" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M9 3V15M3 9H15" stroke="${W}" stroke-width="3"/></pattern>`,
      diag: `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 14L14 0" stroke="${W}" stroke-width="4"/></pattern>`
    }[pat] || '';
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs>${P}</defs><rect x="6" y="6" width="88" height="88" rx="22" fill="${hex}" stroke="rgba(0,0,0,.25)" stroke-width="3"/><rect x="6" y="6" width="88" height="88" rx="22" fill="url(#${id})"/></svg>`;
  }
  /* ---- Drapeaux d'Afrique de l'Ouest et centrale (bandes simples, dessinés ici) ---- */
  function starPath(cx, cy, R, r) {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); }
    return d + 'Z';
  }
  function flag(f) {
    const c = f.c; let b = '';
    if (f.o === 'v') b = c.map((x, i) => `<rect x="${i * 30}" width="30" height="60" fill="${x}"/>`).join('');
    else if (f.o === 'h') b = c.map((x, i) => `<rect y="${i * 60 / c.length}" width="90" height="${60 / c.length + 0.5}" fill="${x}"/>`).join('');
    else if (f.o === 'benin') b = `<rect width="36" height="60" fill="${c[0]}"/><rect x="36" width="54" height="30" fill="${c[1]}"/><rect x="36" y="30" width="54" height="30" fill="${c[2]}"/>`;
    const emblem = f.star ? `<path d="${starPath(45, 30, 11, 4.6)}" fill="${f.star}"/>` : f.dot ? `<circle cx="45" cy="30" r="8" fill="${f.dot}"/>` : '';
    return `<svg viewBox="0 0 90 60" aria-hidden="true"><g>${b}${emblem}</g><rect x=".75" y=".75" width="88.5" height="58.5" rx="3" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1.5"/></svg>`;
  }
  /* ---- Modèles de coloriage : chaque zone (.reg) se remplit d'un toucher ---- */
  // fills : {zone: couleur} pour réafficher un dessin sauvegardé ; fixed = vignette non cliquable
  function template(id, fills, fixed) {
    const R = (k, tag, attrs) => `<${tag} class="reg" ${fixed ? '' : 'data-act="reg"'} data-r="${k}" fill="${(fills && fills[k]) || '#ffffff'}" stroke="#3a2f1c" stroke-width="3" stroke-linejoin="round" ${attrs}/>`;
    let regs = [];
    if (id === 'soleil') {
      regs.push(R(0, 'circle', 'cx="100" cy="80" r="34"'));
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, p = (r, d) => [(100 + r * Math.cos(a + d)).toFixed(1), (80 + r * Math.sin(a + d)).toFixed(1)].join(','); regs.push(R(i + 1, 'polygon', `points="${p(42, -0.2)} ${p(72, 0)} ${p(42, 0.2)}"`)); }
    } else if (id === 'case') {
      regs = [R(0, 'rect', 'x="10" y="130" width="180" height="22"'), R(1, 'rect', 'x="55" y="70" width="90" height="60"'), R(2, 'polygon', 'points="40,72 100,22 160,72"'),
        R(3, 'rect', 'x="90" y="96" width="22" height="34"'), R(4, 'circle', 'cx="68" cy="92" r="9"'), R(5, 'circle', 'cx="130" cy="92" r="9"'), R(6, 'circle', 'cx="170" cy="28" r="15"')];
    } else if (id === 'poisson') {
      regs = [R(0, 'ellipse', 'cx="95" cy="82" rx="52" ry="34"'), R(1, 'polygon', 'points="140,82 184,48 184,116"'), R(2, 'polygon', 'points="78,54 100,28 118,56"'),
        R(3, 'circle', 'cx="66" cy="74" r="7"'), R(4, 'circle', 'cx="28" cy="40" r="9"'), R(5, 'circle', 'cx="46" cy="22" r="6"'), R(6, 'polygon', 'points="82,112 100,136 116,112"')];
    } else if (id === 'baobab') {
      regs = [R(0, 'rect', 'x="0" y="132" width="200" height="28"'), R(1, 'path', 'd="M78 132 q-12 -46 -6 -74 h56 q6 28 -6 74z"'), R(2, 'ellipse', 'cx="100" cy="52" rx="58" ry="22"'),
        R(3, 'ellipse', 'cx="58" cy="62" rx="30" ry="14"'), R(4, 'ellipse', 'cx="142" cy="60" rx="30" ry="14"'), R(5, 'circle', 'cx="172" cy="26" r="15"')];
    }
    return `<svg class="tpl" viewBox="0 0 200 160" role="img" aria-label="Dessin à colorier">${regs.join('')}</svg>`;
  }
  return { child, lion, shape, star, stars, scene, storyScene, swatch, flag, template };
})();
