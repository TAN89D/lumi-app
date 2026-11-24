// Décors africains de LUMI (vectoriels, légers, hors ligne) : un paysage en bas, une frise bogolan en haut, des visiteurs qui passent (oiseaux, papillons).
// Ils vivent DERRIÈRE tous les écrans (accueil, jeux, histoires, résultats, parents…) ; la zone centrale reste calme pour ne jamais gêner l'enfant.
// Un thème par monde : letters, numbers, shapes, colors, music, nature, countries, stories, recre ; + home, parent, night.
// Le module ne dépend d'aucun autre ; Decor.html(theme) est testable seul. Animations coupées en « réduire les animations » et en mode calme (CSS).
window.Decor = (function () {
  const THEMES = ['home', 'letters', 'numbers', 'shapes', 'colors', 'music', 'nature', 'countries', 'stories', 'recre', 'parent', 'night'];
  const BR = '#7a3f12', TERRE = '#c98a47', PAILLE = '#e8c56a', CREME = '#fff6df';

  // ---- éléments de paysage (coordonnées dans une vue 400 × 300, l'horizon est vers y = 190) ----
  const hills = (c1, c2) => `<path d="M0 205C60 170 120 175 190 200S320 175 400 195V300H0z" fill="${c1}"/><path d="M0 235C80 210 150 225 230 232S350 215 400 228V300H0z" fill="${c2}"/>`;
  const baobab = (x, y, s, leaf) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-14 0C-12-24-22-44-18-70h36C22-44 12-24 14 0z" fill="#8a5a33"/><path d="M-18-70C-34-82-44-98-34-104M18-70C34-82 44-98 34-104M0-70C0-84 0-96 0-106" stroke="#8a5a33" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="-34" cy="-108" r="15" fill="${leaf}"/><circle cx="0" cy="-114" r="17" fill="${leaf}"/><circle cx="34" cy="-108" r="15" fill="${leaf}"/><circle cx="-18" cy="-98" r="12" fill="${leaf}"/><circle cx="18" cy="-98" r="12" fill="${leaf}"/></g>`;
  const acacia = (x, y, s, leaf) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-3 0C-2-22-5-34-12-46M3 0C2-22 6-34 14-48" stroke="#6b4a2a" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="-52" rx="40" ry="11" fill="${leaf}"/><ellipse cx="-18" cy="-60" rx="24" ry="8" fill="${leaf}"/><ellipse cx="22" cy="-58" rx="22" ry="8" fill="${leaf}"/></g>`;
  const hut = (x, y, s, roof) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-20" y="-24" width="40" height="24" rx="4" fill="${TERRE}"/><path d="M-28-22L0-52 28-22z" fill="${roof}"/><path d="M-18-26l6 6M-6-36l6 8M8-36l-4 8M16-26l-6 6" stroke="${BR}" stroke-width="1.4" opacity=".5"/><path d="M-6 0v-14a6 6 0 0 1 12 0V0z" fill="#5a3416"/></g>`;
  const palm = (x, y, s, leaf) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0C4-20 2-40 6-62" stroke="#8a5a33" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M6-62C-10-74-26-68-34-56M6-62C22-76 36-70 42-56M6-62C-4-82 8-92 18-90M6-62C-14-60-24-50-26-40M6-62C20-58 32-48 34-38" stroke="${leaf}" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;
  const grass = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"><path d="M0 0C-2-10-6-14-10-16M0 0C0-12 0-18 2-22M0 0C3-9 7-13 12-14"/></g>`;
  const flower = (x, y, c) => `<g transform="translate(${x} ${y})"><path d="M0 0v-10" stroke="#2f8f2a" stroke-width="2"/><circle cx="0" cy="-14" r="3" fill="#ffd23f"/>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-20" rx="3" ry="5" fill="${c}" transform="rotate(${a} 0 -14)"/>`).join('')}</g>`;
  const sun = (x, y, r) => `<g transform="translate(${x} ${y})"><circle class="dc-halo" r="${r + 8}" fill="#fff3a6" opacity=".45"/><circle r="${r}" fill="#ffd62e"/></g>`;
  const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="dc-cloud" fill="#fff" opacity=".9"><ellipse cx="0" cy="0" rx="22" ry="9"/><ellipse cx="-12" cy="-6" rx="12" ry="9"/><ellipse cx="8" cy="-9" rx="14" ry="10"/></g></g>`;
  const star = (x, y, r) => `<path d="M${x} ${y - r}l${r * .3} ${r * .7} ${r * .75} .1-${r * .6} ${r * .5} ${r * .22} ${r * .75}-${r * .67}-${r * .42}-${r * .67} ${r * .42} ${r * .22}-${r * .75}-${r * .6}-${r * .5} ${r * .75}-.1z" fill="#fff3a6" opacity=".9"/>`;
  // objets de thème
  const stall = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-26" y="-30" width="4" height="30" fill="#6b4a2a"/><rect x="22" y="-30" width="4" height="30" fill="#6b4a2a"/><path d="M-32-30h64l-6-14h-52z" fill="#e4572e"/><path d="M-26-44l4 14M-14-44l4 14M-2-44l4 14M10-44l4 14M22-44l4 14" stroke="#fff6df" stroke-width="3"/><rect x="-24" y="-12" width="48" height="12" rx="3" fill="#b8631f"/><circle cx="-14" cy="-16" r="6" fill="#f28c1b"/><circle cx="0" cy="-17" r="6" fill="#ffd62e"/><circle cx="14" cy="-16" r="6" fill="#3fb52a"/></g>`;
  const drum = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-16-34h32C14-20 20-10 12 0h-24C-20-10-14-20-16-34z" fill="#b8631f"/><ellipse cx="0" cy="-34" rx="16" ry="5" fill="#f3d9a0"/><path d="M-14-30l8 28M-4-30l4 28M6-30l-4 28M14-30l-8 28" stroke="#fff6df" stroke-width="1.6" opacity=".8"/></g>`;
  const board = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-34" y="-44" width="68" height="40" rx="4" fill="#2f5d3a" stroke="#8a5a33" stroke-width="4"/><path d="M-22-18l5-14 5 14M-20-23h8M-6-32v14h8a4 4 0 0 0 0-7 4 4 0 0 0 0-7zM12-32c-8 0-8 14 0 14" stroke="#fff6df" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="-4" y="-4" width="8" height="8" fill="#6b4a2a"/></g>`;
  const pagnes = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-44-40Q0-30 44-40" stroke="#6b4a2a" stroke-width="2.5" fill="none"/>${[['#e4572e', -34], ['#2f7de1', -12], ['#ffd62e', 10], ['#3fb52a', 30]].map(([c, px]) => `<g transform="translate(${px} ${-36 + (px === -12 || px === 10 ? 3 : 0)})"><rect width="16" height="30" fill="${c}"/><path d="M0 8l16 0M0 16l16 0M0 24l16 0" stroke="#fff6df" stroke-width="2" opacity=".7"/><path d="M0 12l8-8 8 8" stroke="#fff6df" stroke-width="2" fill="none" opacity=".7"/></g>`).join('')}</g>`;
  const camp = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-16 0l32-6M-16-6l32 6" stroke="#6b4a2a" stroke-width="5" stroke-linecap="round"/><path class="dc-fire" d="M0-6C-12-14-6-26 0-34 6-26 12-14 0-6z" fill="#ff8a1f"/><path d="M0-8C-6-12-3-18 0-22 3-18 6-12 0-8z" fill="#ffd62e"/></g>`;
  const dunes = () => `<path d="M0 215C70 175 140 185 210 212S340 185 400 205V300H0z" fill="#e8b66b"/><path d="M0 250C90 225 170 240 250 248S360 232 400 242V300H0z" fill="#d89b4a"/>`;
  const mapScroll = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-30-30h60v40h-60z" fill="#f3e2b3" stroke="#a8760f" stroke-width="2.5"/><path d="M-20-10c8-10 16-4 22-12s14 0 18 6" stroke="#2f8f2a" stroke-width="3" fill="none"/><path d="M-22 2l6 0M-8 2l5 0M6 2l5 0" stroke="#e4572e" stroke-width="2.4" stroke-dasharray="3 3"/><path d="M16-6l6 6m0-6l-6 6" stroke="#e4572e" stroke-width="2.4"/></g>`;
  const bogoBand = (y, h, c1, c2) => { let s = `<rect x="0" y="${y}" width="400" height="${h}" fill="${c1}"/>`; for (let i = 0; i < 14; i++) { const x = i * 30; s += `<path d="M${x} ${y + h / 2} l15 ${-h / 2.6} 15 ${h / 2.6} -15 ${h / 2.6}z" fill="${c2}"/><circle cx="${x + 15}" cy="${y + h / 2}" r="${h / 11}" fill="${c1}"/>`; } return s; };

  // ---- composition par thème ----
  const SCENES = {
    home:      { sky: 'day',   ground: () => hills('#7fd24a', '#4fae33') + baobab(70, 215, 1.1, '#3fa02f') + hut(318, 214, 1, '#d8a84a') + hut(352, 226, 0.7, '#c99a3e') + acacia(250, 205, .8, '#4b9b36') + grass(30, 262, 1, '#2f8f2a') + grass(180, 268, 1.2, '#2f8f2a') + grass(380, 270, 1, '#2f8f2a') + flower(120, 268, '#ff5fa8') + flower(300, 272, '#ff8a3f') },
    letters:   { sky: 'day',   ground: () => hills('#86d24f', '#58b238') + baobab(330, 218, 1, '#3fa02f') + board(70, 232, 1.1) + grass(150, 266, 1.2, '#2f8f2a') + flower(210, 270, '#ff5fa8') + flower(262, 266, '#ffd23f') },
    numbers:   { sky: 'warm',  ground: () => hills('#9ad04a', '#6dba34') + stall(70, 240, 1.2) + stall(330, 238, 1.1) + palm(200, 224, .8, '#2f9a35') + grass(140, 268, 1, '#2f8f2a') },
    shapes:    { sky: 'violet', ground: () => hills('#9bd16a', '#6bb64a') + bogoBand(262, 38, BR, '#f3d9a0') + hut(70, 232, 1, '#d8a84a') + acacia(330, 226, .9, '#4b9b36') },
    colors:    { sky: 'day',   ground: () => hills('#86d24f', '#58b238') + pagnes(80, 246, 1.5) + pagnes(320, 244, 1.3) + flower(190, 270, '#e4572e') + flower(222, 268, '#2f7de1') + flower(158, 272, '#ffd23f') },
    music:     { sky: 'sunset', ground: () => hills('#7a9a3a', '#56802a') + drum(70, 250, 1.3) + drum(110, 256, 1) + hut(330, 226, 1.1, '#c99a3e') + acacia(230, 214, .9, '#3d7a2f') },
    nature:    { sky: 'day',   ground: () => hills('#8bd04a', '#5fb23a') + acacia(80, 222, 1.2, '#4b9b36') + acacia(320, 214, .9, '#4b9b36') + grass(150, 264, 1.3, '#2f8f2a') + grass(240, 270, 1.1, '#2f8f2a') + flower(200, 266, '#ff8a3f') },
    countries: { sky: 'warm',  ground: () => hills('#e0c070', '#c99a45') + mapScroll(80, 248, 1.5) + baobab(320, 222, .9, '#5a9a3a') + grass(200, 268, 1, '#7a6a2a') },
    stories:   { sky: 'dusk',  ground: () => hills('#4f7a3a', '#37602b') + baobab(80, 222, 1.4, '#2f7a2f') + camp(300, 252, 1.4) + hut(350, 226, .8, '#c99a3e') + star(60, 40, 7) + star(330, 70, 6) + star(200, 30, 5) },
    recre:     { sky: 'warm',  ground: () => dunes() + acacia(320, 214, .8, '#7a8a30') + grass(60, 262, 1, '#a07a30') },
    parent:    { sky: 'soft',  ground: () => hills('#bfe3a0', '#9fd080') + baobab(340, 226, .8, '#6fb04f') },
    night:     { sky: 'night', ground: () => hills('#2f5a4a', '#244a3c') + baobab(90, 228, 1.2, '#1f5a3a') + star(60, 40, 7) + star(160, 70, 5) + star(300, 36, 8) + star(350, 90, 5) }
  };
  // frise du haut : bogolan discret + soleil / lune / nuages
  const top = sky => `<svg class="dc dc-top" viewBox="0 0 400 90" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">${bogoBand(0, 22, 'rgba(122,63,18,.55)', 'rgba(255,246,223,.55)')}${sky === 'night' ? '<circle cx="340" cy="52" r="14" fill="#fff3a6"/><circle cx="346" cy="48" r="12" fill="#243b6b"/>' : sky === 'dusk' ? '<circle cx="60" cy="62" r="14" fill="#ffb347" opacity=".9"/>' : sky === 'soft' ? '' : sun(352, 52, 16)}${sky === 'night' || sky === 'dusk' ? '' : cloud(80, 48, 1) + cloud(230, 66, .8)}</svg>`;
  const fly = sky => (sky === 'night' ? '<span class="dc-fly f1">✨</span><span class="dc-fly f2">✨</span>' : '<span class="dc-fly f1">🦋</span><span class="dc-fly f2">🐦</span>');

  const themeFor = (screen, p, g) => {
    if (screen === 'play' || screen === 'result') return (g && ({ letters: 'letters', numbers: 'numbers', shapes: 'shapes', logic: 'shapes', colors: 'colors', art: 'colors', music: 'music', nature: 'nature', countries: 'countries', stories: 'stories' }[g.cat])) || 'home';
    if (screen === 'grp') return ({ letters: 'letters', numbers: 'numbers', shapes: 'shapes', colors: 'colors', music: 'music', nature: 'nature', countries: 'countries', stories: 'stories' }[p && p.id]) || 'home';
    if (screen === 'cat') return ({ letters: 'letters', numbers: 'numbers', shapes: 'shapes', logic: 'shapes', colors: 'colors', art: 'colors', music: 'music', nature: 'nature', countries: 'countries', stories: 'stories' }[p && p.id]) || 'home';
    if (screen === 'voyage') return 'countries';
    if (['recre', 'missions', 'garage', 'moto', 'course'].includes(screen)) return 'recre';
    if (screen === 'parent' || screen === 'gate') return 'parent';
    if (screen === 'lock') return 'night';
    return 'home';
  };
  const skyOf = theme => (SCENES[theme] || SCENES.home).sky;
  function html(theme) {
    const sc = SCENES[theme] || SCENES.home;
    return `<svg class="dc dc-ground" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">${sc.ground()}</svg>${top(sc.sky)}${fly(sc.sky)}`;
  }
  let cur = null;
  // Place le décor derrière l'application (un seul conteneur #decor, jamais interactif, invisible pour les lecteurs d'écran).
  function set(theme) {
    if (typeof document === 'undefined') return;
    theme = SCENES[theme] ? theme : 'home';
    let el = document.getElementById('decor');
    if (!el) { el = document.createElement('div'); el.id = 'decor'; el.setAttribute('aria-hidden', 'true'); document.body.insertBefore(el, document.body.firstChild); }
    if (cur !== theme) { el.innerHTML = html(theme); cur = theme; }
    document.body.setAttribute('data-decor', theme); document.body.setAttribute('data-sky', skyOf(theme));
  }
  return { THEMES, themeFor, html, set, skyOf, current: () => cur };
})();
