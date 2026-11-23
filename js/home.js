// Nouvelle identité visuelle de LUMI (V3.2) : composants HTML de l'accueil, du catalogue, des progrès et de la navigation.
// Ce fichier ne contient QUE de la présentation : toutes les données (profil, étoiles, mission, jeux) viennent de main.js par le paramètre `x`,
// et les illustrations sont des fichiers séparés (assets/img/) ou des dessins vectoriels (draw.js). Aucune donnée fictive.
window.Home = (function () {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const IMG = 'assets/img/';

  // Avatar du profil : portraits illustrés pour Abdou et la fillette, dessin vectoriel pour les autres.
  function avatar(x, av) {
    if (av.id === 'abdou') return `<img src="${IMG}avatar-boy.jpg" width="90" height="90" alt="" decoding="async">`;
    if (av.id === 'fanta') return `<img src="${IMG}avatar-girl.jpg" width="90" height="90" alt="" decoding="async">`;
    return x.art.child(av);
  }

  // ----- carte « monde » du catalogue (grande carte arrondie, ouvre le vrai module) -----
  const groupCard = (x, g) => `<button class="gcat g-${g.id}" data-act="grp" data-id="${g.id}" aria-label="${esc(x.t('grp.' + g.id))}">
      <span class="gl">${esc(x.t('grp.' + g.id))}</span><span class="gp">${x.dr(g.art)}</span><span class="gs">★ ${x.groupStars(g)}/${x.groupMax(g)}</span></button>`;
  const catalog = x => `<div class="h-cats">${x.groups.map(g => groupCard(x, g)).join('')}</div>`;

  // ----- mission du jour -----
  function mission(x) {
    const m = x.mission; if (!m) return '';
    return `<button class="h-mission ${m.done ? 'done' : ''}" data-act="dmission" aria-label="${esc(x.t('dm.title') + ' ' + m.text)}">
      <span class="mi">${x.dr('star')}</span><span class="mt"><small>${esc(x.t('dm.title'))}</small><b>${esc(m.text)}</b>${m.done ? `<em>${x.IC.check}${esc(x.t('dm.done'))}</em>` : ''}</span></button>`;
  }

  // ----- progression réelle -----
  const progress = x => `<section class="h-prog" aria-label="${esc(x.t('prog.title'))}">
      <div class="pt"><b>${esc(x.t('prog.title'))}</b><span class="chip2">${x.dr('star')}${esc(x.t('prog.stars', { n: x.totalStars }))}</span></div>
      <div class="pbar2" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${x.pct}"><i style="width:${Math.max(3, x.pct)}%"></i></div>
      <button class="h-btn cream slim" data-act="go" data-to="trophies"><span class="ic">${x.IC.trophy}</span>${esc(x.t('prog.rewards'))} <small>${esc(x.t('prog.rewardsCount', { n: x.rewardsGot, m: x.rewardsMax }))}</small></button></section>`;

  // ----- accueil -----
  function home(x) {
    const p = x.profile, name = p.name ? esc(p.name) : esc(x.t('prof.default'));
    return `<div class="home3">
      <section class="h-hero">
        <div class="h-top">
          <button class="h-parents" data-act="go" data-to="gate" aria-label="${esc(x.t('btn.parentsArea'))}"><span class="ic">${x.IC.people}</span><span>${esc(x.t('btn.parents'))}</span></button>
          <button class="h-profile" data-act="profiles" aria-label="${esc(x.t('btn.profile'))}"><span class="av">${avatar(x, x.avatar)}</span><b>${name}</b><span class="caret">${x.IC.caret}</span></button>
        </div>
        <div class="h-logo"><h1 class="logo">LUMI</h1><div class="sign">${esc(x.t('tagline'))}</div></div>
        <div class="h-age" role="img" aria-label="${esc(x.t('p.age'))} : ${esc(x.t('badge.age', { n: p.age }))}"><b>${esc(x.t('badge.age', { n: p.age }))}</b></div>
        <img class="h-chars" src="${IMG}hero-941.jpg" srcset="${IMG}hero-640.jpg 640w, ${IMG}hero-941.jpg 941w" sizes="(max-width:760px) 100vw, 760px" width="941" height="435" alt="" decoding="async" fetchpriority="high">
      </section>
      <section class="h-welcome"><b>${esc(p.name ? x.t('helloName', { name: p.name }) : x.t('hello'))}</b><span>${esc(x.t('home.ready'))}</span></section>
      <button class="h-start" data-act="auto"><span class="ic">${x.IC.play}</span>${esc(x.t('btn.start'))}</button>
      <div class="h-row">
        <button class="h-btn purple" data-act="profiles"><span class="ic">${x.IC.person}</span>${esc(x.t('btn.profile'))}</button>
        <button class="h-btn cream" data-act="go" data-to="gate"><span class="ic">${x.IC.people}</span>${esc(x.t('btn.parentsArea'))}</button>
      </div>
      ${mission(x)}${progress(x)}${catalog(x)}
    </div>`;
  }

  // ----- onglet « Jeux » : les huit mondes + la Récré -----
  const games = x => `<div class="pagehead3"><h1>${esc(x.t('games.title'))}</h1></div>${catalog(x)}
      <button class="gcat g-recre wide" data-act="go" data-to="recre"><span class="gl">${esc(x.t('recre'))}</span><span class="gp">${x.dr('c_recre')}</span></button>`;

  // ----- hub d'un monde (plusieurs catégories possibles : « Formes et logique », « Couleurs et dessin ») -----
  function group(x, g) {
    const blocks = g.cats.map(cid => {
      const c = x.cat(cid);
      return `${g.cats.length > 1 ? `<h2 class="sub">${esc(x.label(c))}</h2>` : ''}<div class="glist">${c.games.map(gm => `<button class="gcard" data-act="game" data-c="${c.id}" data-g="${gm.id}"><div class="gi">${gm.e || x.dr(gm.ic)}</div><div><b>${esc(x.gameName(c, gm))}</b>${x.starRow(x.starsOf(c.id, gm.id))}${gm.lvl > x.profile.age ? `<span class="lvl">${gm.lvl}+</span>` : ''}</div></button>`).join('')}</div>`;
    }).join('');
    return `<div class="hub g-${g.id}"><div class="hubtop"><button class="ib" data-act="go" data-to="games" aria-label="${esc(x.t('back'))}">${x.IC.back}</button><h1>${esc(x.t('grp.' + g.id))}</h1><div class="pic">${x.dr(g.art)}</div></div>${blocks}</div>`;
  }

  // ----- onglet « Progrès » (pour l'enfant : réussites simples ; le détail reste dans l'espace parents) -----
  function progressPage(x) {
    const done = x.mastered;
    return `<div class="pagehead3"><h1>${esc(x.t('prog.page'))}</h1><span class="chip2">${x.dr('star')}${esc(x.t('prog.stars', { n: x.totalStars }))}</span></div>
      <section class="sec3"><h2>${esc(x.t('prog.byGroup'))}</h2>${x.groups.map(g => `<div class="pg-row g-${g.id}"><span class="pgi">${x.dr(g.art)}</span><span class="pgn">${esc(x.t('grp.' + g.id))}</span><div class="pbar2 small"><i style="width:${Math.max(2, Math.round(x.groupStars(g) / Math.max(1, x.groupMax(g)) * 100))}%"></i></div><span class="pgs">★ ${x.groupStars(g)}/${x.groupMax(g)}</span></div>`).join('')}</section>
      <section class="sec3"><h2>${esc(x.t('prog.mastered'))}</h2>${done.length ? `<div class="chips">${done.map(n => `<span class="okchip">${x.IC.check}${esc(n)}</span>`).join('')}</div>` : `<p>${esc(x.t('prog.none'))}</p>`}</section>
      <button class="h-btn cream slim" data-act="go" data-to="gate"><span class="ic">${x.IC.lock}</span>${esc(x.t('prog.parents'))}</button>`;
  }

  // ----- navigation inférieure : 4 onglets -----
  function nav(x, active) {
    const tabs = [['home', 'tab.home', x.IC.home], ['games', 'tab.games', x.IC.pad], ['trophies', 'tab.rewards', x.IC.trophy], ['progress', 'tab.progress', x.IC.book]];
    return `<nav class="nav4" aria-label="${esc(x.t('nav.label'))}">${tabs.map(([id, k, ic]) => `<button class="${active === id ? 'on' : ''}" data-act="go" data-to="${id}" ${active === id ? 'aria-current="page"' : ''}><span class="ni">${ic}</span><span class="nl">${esc(x.t(k))}</span></button>`).join('')}</nav>`;
  }
  // Quel onglet est actif selon l'écran affiché
  const activeTab = screen => ({ home: 'home', games: 'games', grp: 'games', cat: 'games', recre: 'games', missions: 'games', garage: 'games', trophies: 'trophies', progress: 'progress' }[screen] || 'home');

  return { home, games, group, progressPage, nav, activeTab, avatar };
})();
