// Nouvelle identité visuelle de LUMI (V3.2) : composants HTML de l'accueil, du catalogue, des progrès et de la navigation.
// Ce fichier ne contient QUE de la présentation : toutes les données (profil, étoiles, mission, jeux) viennent de main.js par le paramètre `x`,
// et les illustrations sont des fichiers séparés (assets/img/) ou des dessins vectoriels (draw.js). Aucune donnée fictive.
window.Home = (function () {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const IMG = 'assets/img/';
  // Logo A (identité validée) : image optimisée, accessible (alt « LUMI »), avec texte de secours ; le slogan n'est JAMAIS dans l'image.
  const logo = () => `<h1 class="logo logo-wrap"><img class="logo-img" src="${IMG}logo-lumi-720.webp" srcset="${IMG}logo-lumi-480.webp 480w, ${IMG}logo-lumi-720.webp 720w" sizes="(max-width:520px) 74vw, 380px" width="720" height="496" alt="LUMI" decoding="async" fetchpriority="high" onerror="this.replaceWith(document.createTextNode('LUMI'))"></h1>`;

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

  // ----- écran de bienvenue (affiché une seule fois par ouverture de l'application) -----
  const welcome = x => `<div class="welcome">
      <div class="w-logo">${logo()}<div class="sign">${esc(x.t('tagline'))}</div></div>
      <img class="w-chars" src="${IMG}hero-941.jpg" srcset="${IMG}hero-640.jpg 640w, ${IMG}hero-941.jpg 941w" sizes="(max-width:760px) 100vw, 760px" width="941" height="435" alt="" decoding="async" fetchpriority="high">
      <section class="w-msg">${x.mascot ? `<div class="mascot-slot w-lumi" data-state="wave" role="img" aria-label="${esc(x.t('mascot.alt'))}"></div>` : ''}<div class="w-txt"><b>${esc(x.t('welcome.title'))}</b><span>${esc(x.t('welcome.sub'))}</span></div></section>
      <button class="h-start" data-act="begin"><span class="ic">${x.IC.play}</span>${esc(x.t('btn.start'))}</button>
      <button class="w-parents" data-act="go" data-to="gate"><span class="ic">${x.IC.people}</span>${esc(x.t('btn.parentsArea'))}</button>
    </div>`;

  // ----- page des profils (écran 7) : sélection, création ; modification/suppression restent protégées par le contrôle parental -----
  const profilesPage = x => `<div class="pagehead3 pg-prof"><button class="ib3" data-act="go" data-to="home" aria-label="${esc(x.t('back'))}">${x.IC.back}</button><h1>${esc(x.t('prof.title'))}</h1></div>
      <div class="plist">${x.profiles.map(p => `<button class="prow ${p.id === x.profile.id ? 'on' : ''}" data-act="switch" data-id="${p.id}" aria-pressed="${p.id === x.profile.id}" aria-label="${esc(x.t('prof.select'))} : ${esc(p.name || x.t('prof.default'))}">
        <span class="av">${avatar(x, x.avatarOf(p.avatar))}</span><span class="pn"><b>${esc(p.name || x.t('prof.default'))}</b><small>${esc(x.t('badge.age', { n: p.age }))}</small></span><span class="pc">${p.id === x.profile.id ? x.IC.check : ''}</span></button>`).join('')}</div>
      <button class="h-btn purple wide" data-act="addprof"><span class="ic">＋</span>${esc(x.t('prof.create'))}</button>
      <button class="h-btn cream slim" data-act="go" data-to="gate"><span class="ic">${x.IC.lock}</span>${esc(x.t('prof.manage'))}</button>
      <p class="pinfo"><span class="ic">i</span>${esc(x.t('prof.info'))}</p>`;

  // ----- Le Voyage de Lumi : huit étapes (les huit mondes), un autocollant par étape terminée, dans l'ordre que l'on veut, sans classement -----
  const voyage = x => `<div class="pagehead3 pg-prof"><button class="ib3" data-act="go" data-to="games" aria-label="${esc(x.t('back'))}">${x.IC.back}</button><h1>${esc(x.t('voy.title'))}</h1></div>
      <p class="voy-sub">${esc(x.t('voy.sub'))} <b>${esc(x.t('voy.count', { n: x.stickers.length }))}</b></p>
      <div class="voy-map">${x.groups.map((g, i) => `<div class="voy-stop ${i % 2 ? 'r' : ''}"><button class="vs-btn g-${g.id} ${x.stickers.includes(g.id) ? 'got' : ''}" data-act="vstop" data-id="${g.id}" aria-label="${esc(x.t('voy.start'))} : ${esc(x.t('grp.' + g.id))}${x.stickers.includes(g.id) ? ' ✔' : ''}"><span class="vi">${x.dr(g.art)}</span>${x.stickers.includes(g.id) ? '<span class="vk">★</span>' : ''}</button><div class="vs-txt"><b>${esc(x.t('grp.' + g.id))}</b><small>${esc(x.t(x.stickers.includes(g.id) ? 'voy.done' : 'voy.three'))}</small></div></div>`).join('')}</div>`;
  const voyageCard = x => `<button class="h-voyage" data-act="go" data-to="voyage"><span class="vc-i">${x.dr('c_countries')}</span><span class="vc-t"><b>${esc(x.t('voy.title'))}</b><small>${esc(x.t('voy.count', { n: x.stickers.length }))}</small></span></button>`;

  // ----- accueil -----
  function home(x) {
    const p = x.profile, name = p.name ? esc(p.name) : esc(x.t('prof.default'));
    return `<div class="home3">
      <section class="h-hero">
        <div class="h-top">
          <button class="h-parents" data-act="go" data-to="gate" aria-label="${esc(x.t('btn.parentsArea'))}"><span class="ic">${x.IC.people}</span><span>${esc(x.t('btn.parents'))}</span></button>
          <button class="h-profile" data-act="profiles" aria-label="${esc(x.t('btn.profile'))}"><span class="av">${avatar(x, x.avatar)}</span><b>${name}</b><span class="caret">${x.IC.caret}</span></button>
        </div>
        <div class="h-logo">${logo()}<div class="sign">${esc(x.t('tagline'))}</div></div>
        <div class="h-age" role="img" aria-label="${esc(x.t('p.age'))} : ${esc(x.t('badge.age', { n: p.age }))}"><b>${esc(x.t('badge.age', { n: p.age }))}</b></div>
        <img class="h-chars" src="${IMG}hero-941.jpg" srcset="${IMG}hero-640.jpg 640w, ${IMG}hero-941.jpg 941w" sizes="(max-width:760px) 100vw, 760px" width="941" height="435" alt="" decoding="async" fetchpriority="high">
      </section>
      <section class="h-welcome${x.mascot ? ' h-welcome-lumi' : ''}">
        ${x.mascot ? '<div class="mascot-slot h-lumi" data-state="wave" aria-hidden="true"></div>' : ''}
        <div><b>${esc(p.name ? x.t('helloName', { name: p.name }) : x.t('hello'))}</b><span>${esc(x.t('home.ready'))}</span>
        ${x.mascot ? `<button class="h-wave" type="button" data-act="wave-lumi">${esc(x.t('mascot.wave'))}</button>` : ''}</div>
      </section>
      <button class="h-start" data-act="auto"><span class="ic">${x.IC.play}</span>${esc(x.t('btn.start'))}</button>
      <div class="h-row">
        <button class="h-btn purple" data-act="profiles"><span class="ic">${x.IC.person}</span>${esc(x.t('btn.profile'))}</button>
        <button class="h-btn cream" data-act="go" data-to="gate"><span class="ic">${x.IC.people}</span>${esc(x.t('btn.parentsArea'))}</button>
      </div>
      ${mission(x)}${voyageCard(x)}${progress(x)}${catalog(x)}
    </div>`;
  }

  // ----- onglet « Jeux » : les huit mondes + la Récré -----
  const games = x => `<div class="pagehead3"><h1>${esc(x.t('games.title'))}</h1></div>${voyageCard(x)}${catalog(x)}
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
  const activeTab = screen => ({ home: 'home', games: 'games', grp: 'games', cat: 'games', recre: 'games', missions: 'games', garage: 'games', trophies: 'trophies', progress: 'progress', voyage: 'games' }[screen] || 'home');

  // ----- écran d'activité : personnage-guide + bulle de consigne (la vraie consigne, traduite) pour les exercices à choix -----
  const guide = (x, ask, compact = false) => `<div class="guide${x.mascot ? ' guide-lumi' : ''}${compact ? ' guide-compact' : ''}">${x.mascot ? '<div class="mascot-slot g-lumi" data-state="think" aria-hidden="true"></div>' : `<img src="${IMG}guide-boy.jpg" width="540" height="490" alt="" decoding="async">`}<button class="bubble" id="ask" data-act="say"><span class="spk" aria-hidden="true">${x.IC.speaker}</span><span>${esc(ask)}</span></button></div>`;

  // ----- écran de réussite : le nombre d'étoiles est celui réellement gagné -----
  const result = (x, r) => `<div class="result3">${x.mascot ? `<div class="mascot-slot r-lumi" data-state="cheer" role="img" aria-label="${esc(x.t('mascot.alt'))}"></div>` : `<img class="lion3" src="${IMG}lion-cheer.jpg" width="550" height="402" alt="" decoding="async">`}
      <h1>${esc(r.name ? x.t('res.bravo', { name: r.name }) : x.t('res.bravo0'))}</h1><p class="sub">${esc(x.t('res.well'))}</p>
      <div class="big-stars" role="img" aria-label="${esc(x.t('res.stars', { n: r.stars }))}">${[0, 1, 2].map(i => `<span class="star ${i < r.stars ? 'on' : ''}" style="--star-delay:${i * 0.25}s">★</span>`).join('')}</div>
      ${r.sticker ? `<div class="newc sticker"><div class="pic">${r.sticker}</div><span>${esc(x.t('voy.sticker'))}</span></div>` : ''}${r.reward ? `<div class="newc"><div class="pic">${r.reward}</div><span>${esc(x.t('newReward'))}</span></div>` : ''}${r.recre || ''}
      <button class="h-start cont" data-act="${r.nextAct}" ${r.nextData}>${esc(x.t('btn.continue'))}<span class="ic">${x.IC.play}</span></button>
      <div class="row3"><button class="ib" data-act="game" data-c="${r.cat}" data-g="${r.gid}" aria-label="${esc(x.t('replay'))}">${x.IC.replay}</button><button class="ib" data-act="go" data-to="home" aria-label="${esc(x.t('tab.home'))}">${x.IC.home}</button></div></div>`;

  // ----- livre illustré des histoires (écran 5) -----
  const book = (x, o) => `<div class="book">${o.scene}<div class="bk-title">${x.mascot ? `<div class="mascot-slot b-lumi" data-state="rest" role="img" aria-label="${esc(x.t('mascot.alt'))}"></div>` : ''}<div class="bk-txt"><b>${esc(o.title)}</b><small>${esc(x.t('story.progress', { a: o.page + 1, b: o.pages }))}</small></div></div>
      <div class="pbar2 small" role="progressbar" aria-valuemin="0" aria-valuemax="${o.pages}" aria-valuenow="${o.page + 1}"><i style="width:${Math.round((o.page + 1) / o.pages * 100)}%"></i></div>${o.text}${o.tools}</div>`;

  // ----- question de compréhension (fin d'une histoire) : question illustrée, 2 ou 3 réponses, « Passer » toujours possible -----
  const quiz = (x, qz) => `<div class="quiz"><div class="q-top">${x.mascot ? `<div class="mascot-slot q-lumi" data-state="rest" role="img" aria-label="${esc(x.t('mascot.alt'))}"></div>` : ''}
      <button class="bubble q-bubble" id="qbub" data-act="qsay" aria-label="${esc(x.t('quiz.listen'))}"><span class="spk">${x.IC.speaker}</span><span><small>${esc(x.t('quiz.title'))}</small>${esc(qz.q)}</span></button></div>
      <div class="q-choices c${qz.choices.length}" role="group" aria-label="${esc(qz.q)}">${qz.choices.map((c, i) => `<button class="q-ch" data-act="qpick" data-i="${i}"><span class="qe" aria-hidden="true">${c.e}</span><span class="ql">${esc(c.label)}</span></button>`).join('')}</div>
      <button class="q-skip" data-act="qskip">${esc(x.t('quiz.skip'))} ${x.IC.play}</button></div>`;

  return { home, games, group, progressPage, nav, activeTab, avatar, welcome, profilesPage, guide, result, book, quiz, voyage };
})();
