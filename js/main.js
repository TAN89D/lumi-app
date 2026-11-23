// LUMI v2 : interface en panneaux de couleur, catégories libres, jeux variés.
(function () {
  const L = LUMI, C = L.config, T = L.strings.fr, CATS = Games.CATS, V = L.vocab;
  const $app = document.getElementById('app'), $modal = document.getElementById('modal');
  const pick = Games.pick, shuffle = Games.shuffle, dr = Draw.svg;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  Object.entries(C.colors).forEach(([k, v]) => document.documentElement.style.setProperty('--' + k, v));

  // ---- profil local (créé sans rien demander ; le prénom se règle dans l'espace parent) ----
  if (!Store.profile()) { const k = Object.keys(Store.data.profiles)[0]; if (k) { Store.data.active = k; Store.save(); } else Store.createProfile('', 'awa'); }
  const P = () => Store.profile();
  const avatarOf = id => L.avatars.find(a => a.id === id) || L.avatars[0];
  const starsOf = (c, g) => { const x = P().progress['g:' + c + ':' + g]; return x ? x.stars : 0; };
  const catStars = c => c.games.reduce((a, g) => a + starsOf(c.id, g.id), 0);
  const totalStars = () => Object.values(P().progress).reduce((a, x) => a + (x.stars || 0), 0);
  const cat = id => CATS.find(c => c.id === id);
  const COLLECT = Draw.keys;
  const NF = ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit'];
  const mg = n => `${NF[n]} mangue${n > 1 ? 's' : ''}`;

  // ---- icônes d'interface (dessinées ici) ----
  const sv = (inner, fill) => `<svg viewBox="0 0 24 24" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"'}>${inner}</svg>`;
  const IC = {
    home: sv('<path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z"/>', 1),
    trophy: sv('<path d="M7 3h10v4a5 5 0 0 1-4 4.9V15h3v2H8v-2h3v-3.1A5 5 0 0 1 7 7zM3 4h3v3a3 3 0 0 1-3-3zm18 0h-3v3a3 3 0 0 0 3-3zM8 19h8v2H8z"/>', 1),
    lock: sv('<path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V8a3 3 0 0 0-6 0z"/>', 1),
    close: sv('<path d="M5 5l14 14M19 5L5 19"/>'), back: sv('<path d="M15 4 7 12l8 8"/>'),
    speaker: sv('<path d="M3 9v6h4l5 4V5L7 9z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" stroke-width="2.4"/>'),
    check: sv('<path d="M4 12.5l5 5L20 6.5" stroke-width="4"/>'), replay: sv('<path d="M5 12a7 7 0 1 0 2.2-5.1M5 4v4h4"/>'),
    play: sv('<path d="M7 4l13 8-13 8z"/>', 1), erase: sv('<path d="M4 20h16M6 16l9-11 5 4-8 10H8z"/>')
  };

  // ---- état ----
  let S = { screen: 'home', p: {} }, G = null, elapsed = 0, limitShown = false, MH = null;
  const TABS = ['home', 'trophies'];
  const NOTABS = ['play', 'result', 'gate', 'parent', 'moto', 'course'];
  function go(screen, p) { S = { screen, p: p || {} }; render(); window.scrollTo(0, 0); }
  function render() {
    Sound.stop();
    $app.className = NOTABS.includes(S.screen) ? 'noTabs' : '';
    $app.innerHTML = screens[S.screen]() + (NOTABS.includes(S.screen) ? '' : tabsHTML());
    if (hooks[S.screen]) hooks[S.screen]();
  }
  const tabsHTML = () => `<nav class="tabs"><button class="${S.screen === 'home' ? 'on' : ''}" data-act="go" data-to="home" aria-label="Accueil">${IC.home}</button><button class="${S.screen === 'trophies' ? 'on' : ''}" data-act="go" data-to="trophies" aria-label="Trophées">${IC.trophy}</button><button data-act="go" data-to="gate" aria-label="Parents">${IC.lock}</button></nav>`;
  const say = t => Sound.speak(t);
  const showModal = h => { $modal.innerHTML = h; };
  const hideModal = () => { $modal.innerHTML = ''; };
  const fb = document.createElement('div'); fb.className = 'fb'; document.body.appendChild(fb);
  let fbT; function toast(msg, ok) { fb.textContent = msg; fb.className = 'fb on' + (ok ? '' : ' no'); clearTimeout(fbT); fbT = setTimeout(() => { fb.className = 'fb'; }, 1100); }
  function confetti() {
    if (Store.s().calm) return;
    const d = document.createElement('div'); d.className = 'confetti';
    for (let i = 0; i < 26; i++) d.innerHTML += `<i style="left:${Math.random() * 100}%;animation-delay:${Math.random() * 0.8}s">${pick(['⭐', '✨', '🎉', '🌟'])}</i>`;
    document.body.appendChild(d); setTimeout(() => d.remove(), 3500);
  }
  const starRow = n => `<span class="stars">${[0, 1, 2].map(i => `<span class="star ${i < n ? 'on' : ''}">★</span>`).join('')}</span>`;

  // ================= ÉCRANS =================
  const screens = {
    home() {
      const p = P(), av = avatarOf(p.avatar);
      return `<div class="hello"><div class="av">${Art.child(av)}</div><div class="say">${p.name ? 'Bonjour ' + esc(p.name) + ' !' : 'Bonjour !'}</div><div class="chip">${dr('star')}${totalStars()}</div></div>
      <div class="hero"><div class="lu">${dr('lion')}</div><button class="go" data-act="auto">${IC.play}Jouer</button></div>
      <div class="cats">${CATS.map(c => `<button class="cat" style="--b:var(--${c.c});--bd:var(--${c.c}D)" data-act="cat" data-id="${c.id}"><span class="lab">${c.label}</span><div class="pic">${dr(c.art)}</div><span class="st">★ ${catStars(c)}/${c.games.length * 3}</span></button>`).join('')}
      <button class="cat wide" style="--b:var(--coral);--bd:var(--coralD)" data-act="go" data-to="recre"><span class="lab">Récré</span><div class="pic">${dr('c_recre')}</div></button></div>`;
    },
    cat() {
      const c = cat(S.p.id);
      return `<div class="hub" style="--b:var(--${c.c});--bd:var(--${c.c}D)"><div class="hubtop"><button class="ib" data-act="go" data-to="home" aria-label="Retour">${IC.back}</button><h1>${c.label}</h1><div class="pic">${dr(c.art)}</div></div>
      <div class="glist">${c.games.map(g => `<button class="gcard" data-act="game" data-c="${c.id}" data-g="${g.id}"><div class="gi">${g.e || dr(g.ic)}</div><div><b>${esc(g.name)}</b>${starRow(starsOf(c.id, g.id))}</div></button>`).join('')}</div></div>`;
    },
    play() { return playHTML(); },
    result() {
      const c = G.cd, rw = G.newReward, nxt = c.games[c.games.findIndex(g => g.id === G.gid) + 1];
      return `<div class="result" style="--b:var(--${c.c});--bd:var(--${c.c}D)"><div class="lu">${dr('lion')}</div>
        <div class="big-stars">${[0, 1, 2].map(i => `<span class="star ${i < G.stars ? 'on' : ''}" style="animation-delay:${i * 0.25}s">★</span>`).join('')}</div>
        ${rw ? `<div class="newc"><div class="pic">${dr(rw)}</div><span>Nouveau !</span></div>` : ''}
        ${G.recre ? `<button class="recre" data-act="mission" data-m="${pick(L.missions).id}"><div class="pic">${dr('c_recre')}</div>Tour de récré !</button>` : ''}
        <div class="row3"><button class="ib" data-act="game" data-c="${G.cat}" data-g="${G.gid}" aria-label="Rejouer">${IC.replay}</button>
        <button class="ib main" data-act="${nxt ? 'game' : 'cat'}" data-c="${G.cat}" data-g="${nxt ? nxt.id : ''}" data-id="${G.cat}" aria-label="Suite">${IC.play}</button>
        <button class="ib" data-act="go" data-to="home" aria-label="Accueil">${IC.home}</button></div></div>`;
    },
    trophies() {
      const have = P().rewards.filter(r => r.type === 'draw').map(r => r.item), p = P();
      return `<div class="pagehead"><h1>Mes trophées</h1><div class="chip">${dr('star')}${totalStars()}</div></div>
      <div class="sec"><div class="coll">${COLLECT.map(k => `<div class="${have.includes(k) ? '' : 'lock'}">${dr(k)}</div>`).join('')}</div></div>
      <div class="sec"><div class="row"><span>Mon garage</span><button class="btn sun" data-act="go" data-to="garage">${(garage().vehicle)} ${garage().pilot}</button></div>
      <div class="row"><span>Histoires lues</span><b>${p.storiesRead.length}/${L.stories.length}</b></div></div>`;
    },
    recre() {
      const g = garage();
      return `<div class="hub" style="--b:var(--coral);--bd:var(--coralD)"><div class="hubtop"><button class="ib" data-act="go" data-to="home" aria-label="Retour">${IC.back}</button><h1>Récré</h1><div class="pic">${dr('c_recre')}</div></div>
      <div class="glist"><button class="gcard" data-act="go" data-to="missions"><div class="gi">${g.vehicle}</div><div><b>Missions</b></div></button>
      <button class="gcard" data-act="go" data-to="course"><div class="gi">🏁</div><div><b>Course d’amis</b></div></button>
      <button class="gcard" data-act="go" data-to="garage"><div class="gi">${g.pilot}</div><div><b>Mon garage</b></div></button></div></div>`;
    },
    missions() {
      const done = P().missions || {};
      return `<div class="hub" style="--b:var(--coral);--bd:var(--coralD)"><div class="hubtop"><button class="ib" data-act="go" data-to="recre" aria-label="Retour">${IC.back}</button><h1>Missions</h1></div><div class="glist">${L.missions.map(m => `<button class="gcard" data-act="mission" data-m="${m.id}"><div class="gi">${m.icon}</div><div><b>${m.title}</b><small>Ramasse ${m.goal} ${m.items.join('')}</small></div></button>`).join('')}</div></div>`;
    },
    garage() {
      const g = garage(), n = totalStars();
      const grid = (list, key) => list.map(v => { const ok = n >= v.need; return `<button class="gtile ${g[key] === v.e ? 'on' : ''} ${ok ? '' : 'off'}" data-act="pickg" data-k="${key}" data-e="${v.e}" aria-label="${v.name}">${v.e}<small>${ok ? v.name : '★ ' + v.need}</small></button>`; }).join('');
      return `<div class="pagehead"><button class="ib" data-act="go" data-to="recre" aria-label="Retour">${IC.back}</button><h1>Mon garage</h1><div class="chip">${dr('star')}${n}</div></div>
      <div class="sec"><div class="center" style="font-size:4rem">${g.vehicle} ${g.pilot}</div></div>
      <div class="sec"><h2>Véhicules</h2><div class="ggrid">${grid(L.vehicles, 'vehicle')}</div></div><div class="sec"><h2>Pilotes</h2><div class="ggrid">${grid(L.pilots, 'pilot')}</div></div>`;
    },
    moto() {
      const m = L.missions.find(x => x.id === S.p.m) || L.missions[0];
      return `<div class="ptop" style="margin-bottom:10px"><button class="ib" data-act="go" data-to="missions" aria-label="Quitter">${IC.close}</button><div class="chip">${m.icon} <span id="mgot">0</span> / ${m.goal}</div></div>
      <canvas id="cv" class="cv" aria-label="Course"></canvas>
      <div class="ctrl" style="margin-top:12px"><button class="ib" data-act="mleft" aria-label="Gauche">${IC.back}</button><button class="ib" data-act="mright" aria-label="Droite" style="transform:scaleX(-1)">${IC.back}</button></div>`;
    },
    course() {
      const g = garage(), fr = shuffle(L.pilots.filter(p => p.e !== g.pilot)).slice(0, 2).map(p => p.e);
      const lane = (id, e) => `<div class="lane"><span class="run" id="${id}">${e}</span><span class="flag">🏁</span></div>`;
      return `<div class="ptop" style="margin-bottom:10px"><button class="ib" data-act="go" data-to="recre" aria-label="Quitter">${IC.close}</button><h1 style="margin:0;font-size:1.3rem">Course d’amis</h1></div>
      <div class="sec">${lane('r0', g.pilot)}${lane('r1', fr[0])}${lane('r2', fr[1])}<div class="pbx"><i id="cbar" style="width:0"></i></div></div>
      <button class="okb" id="ctap" style="max-width:none;font-size:2rem;padding:34px">${IC.play}</button>`;
    },
    gate() {
      return `<div class="pagehead"><button class="ib" data-act="go" data-to="home" aria-label="Retour">${IC.back}</button><h1>Espace adulte</h1></div>
      <div class="sec" style="text-align:center"><p>Maintiens le bouton pendant 2 secondes.</p><button class="hold" id="hold" aria-label="Maintenir">${IC.lock}<i id="holdp"></i></button></div>`;
    },
    parent() {
      const s = Store.s(), p = P(), pt = p.playTime || {}, days = Object.keys(pt).sort().slice(-7).reverse(), mins = x => Math.round(x / 60);
      const sw = (k, label) => `<div class="row"><span>${label}</span><button class="sw ${s[k] ? 'on' : ''}" data-act="tog" data-k="${k}" role="switch" aria-checked="${!!s[k]}" aria-label="${label}"></button></div>`;
      return `<div class="pagehead"><button class="ib" data-act="go" data-to="home" aria-label="Retour">${IC.back}</button><h1>Espace parent</h1></div>
      <div class="sec"><h2>Profil</h2><div class="row"><span>Prénom (facultatif)</span><input type="text" value="${esc(p.name)}" maxlength="20" data-chg="rename"></div></div>
      <div class="sec"><h2>Progrès</h2>${CATS.map(c => { const done = c.games.filter(g => starsOf(c.id, g.id) > 0).length; return `<div class="bline"><span>${c.label}</span><div class="pbx"><i style="width:${Math.round(catStars(c) / (c.games.length * 3) * 100)}%"></i></div><span style="width:44px;text-align:right">${done}/${c.games.length}</span></div>`; }).join('')}
        <div class="row"><span>Aides utilisées</span><b>${Object.values(p.progress).reduce((a, x) => a + (x.hints || 0), 0)}</b></div>
        <div class="row"><span>Récrés jouées</span><b>${p.minis ? Object.values(p.minis).reduce((a, b) => a + b, 0) : 0}</b></div></div>
      <div class="sec"><h2>Temps de jeu</h2><div class="row"><span>Aujourd’hui</span><b>${mins(pt[Store.today()] || 0)} min</b></div>${days.map(d => `<div class="row"><span>${d}</span><span>${mins(pt[d])} min</span></div>`).join('')}</div>
      <div class="sec"><h2>Ma propre voix</h2><p style="margin:0 0 6px">Pour une voix douce, claire et africaine : enregistrez la vôtre (ou celle d’un proche). Activez le mode, puis jouez : à chaque phrase pas encore enregistrée, un bandeau apparaît. Les enregistrements restent sur cet appareil et remplacent la voix de synthèse.</p>
        ${sw('rec', 'Mode enregistrement')}<div class="row"><span>Phrases enregistrées</span><b>${Sound.clipCount()}</b></div><button class="btn warn" data-act="clearclips">Effacer mes enregistrements</button></div>
      <div class="sec"><h2>Réglages</h2>${sw('voice', 'Voix / consignes')}
        <div class="row"><span>Voix française</span><span style="text-align:right;font-size:.85rem">${Sound.voiceName() ? '✔ ' + esc(Sound.voiceName()) : Sound.missing() ? '⚠ non installée sur cet appareil' : 'voix du système'}</span></div>
        ${Sound.voices().length ? `<div class="row"><span>Choisir la voix</span><select data-chg="vname"><option value="">Automatique (la plus douce)</option>${Sound.voices().map(n => `<option value="${esc(n)}" ${s.vname === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>` : ''}
        <div class="row"><span>Vitesse</span><input type="range" min="0.5" max="1.1" step="0.05" value="${s.rate}" data-inp="rate"></div>
        <div class="row"><span>Hauteur (grave ↔ aiguë)</span><input type="range" min="0.6" max="1.3" step="0.05" value="${s.pitch}" data-inp="pitch"></div>
        <button class="btn" data-act="testvoice">Tester la voix</button><button class="btn sun" data-act="howinstall">Installer LUMI</button>
        ${sw('sfx', 'Effets sonores')}<div class="row"><span>Volume</span><input type="range" min="0.1" max="1" step="0.1" value="${s.volume}" data-inp="volume"></div>
        ${sw('big', 'Grands textes')}${sw('calm', 'Réduire les animations')}${sw('contrast', 'Contraste renforcé')}
        <div class="row"><span>Durée de session</span><select data-chg="limit">${[0, 10, 15, 20, 30].map(m => `<option value="${m}" ${s.limitMin === m ? 'selected' : ''}>${m ? m + ' min' : 'Sans limite'}</option>`).join('')}</select></div></div>
      <div class="sec"><h2>Données</h2><p style="margin:0">Tout reste sur cet appareil : prénom facultatif, progrès, récompenses, temps de jeu, réglages. Rien n’est envoyé sur Internet. Aucune publicité, aucun achat.</p>
        <button class="btn" data-act="export">Exporter</button><button class="btn warn" data-act="wipe">Tout effacer</button></div>`;
    }
  };

  // ================= PARTIE =================
  const cur = () => G.rounds[G.idx];
  function startGame(cid, gid) {
    const cd = cat(cid), gd = cd.games.find(g => g.id === gid), prev = starsOf(cid, gid);
    G = { cat: cid, gid, cd, gd, prev, idx: 0, err: 0, hints: 0, rounds: gd.make(prev === 1 ? 2 : 3), fresh: true };
    G.free = ['color', 'free', 'xylo', 'drum', 'story'].includes(G.rounds[0].type);
    go('play');
  }
  function playHTML() {
    const r = cur(), c = G.cd;
    const head = `<div class="play" style="--b:var(--${c.c});--bd:var(--${c.c}D)"><div class="ptop"><button class="ib" data-act="leave" aria-label="Quitter">${IC.close}</button><div class="pbar"><i style="width:${Math.round(G.idx / G.rounds.length * 100)}%"></i></div></div>
      <button class="ask" data-act="say"><span class="spk">${IC.speaker}</span><span>${esc(r.ask)}</span></button><div class="area">`;
    return head + body(r) + '</div></div>';
  }
  const okBtn = (act, dis) => `<button class="okb" id="okb" data-act="${act}" ${dis ? 'disabled' : ''} aria-label="Terminé">${IC.check}</button>`;
  function body(r) {
    if (r.type === 'choose') {
      const n = r.choices.length;
      return `${r.show ? `<div class="show">${r.show}</div>` : ''}<div class="tiles t${n}">${r.choices.map((c, i) => `<button class="tile" data-act="pick" data-i="${i}">${c.h}</button>`).join('')}</div>`;
    }
    if (r.type === 'drag') {
      const slots = r.scene ? `<div class="dz scene">${r.slots.map(s => `<div class="slot pos" data-key="${s.key}" style="${s.pos}">${s.h}</div>`).join('')}</div>`
        : `<div class="dz">${r.slots.map(s => s.zone ? `<div class="slot zone ${r.z3 ? 'z3' : ''}" data-key="${s.key}"><div class="zl">${s.h}</div><div class="in"></div></div>` : `<div class="slot" data-key="${s.key}">${s.h}</div>`).join('')}</div>`;
      return slots + `<div class="tray">${r.items.map(i => `<div class="drag" data-to="${i.to}" data-id="${i.id}">${i.h}</div>`).join('')}</div>`;
    }
    if (r.type === 'fill') return `<div class="cnt" id="cnt">0</div><div class="basket"><div class="bk">${dr('basket')}</div><div class="in" id="bin"></div></div><div class="pool" id="pool"></div>${okBtn('fillok')}`;
    if (r.type === 'swap') return `<div class="puz" id="puz"></div>`;
    if (r.type === 'memory') {
      const deck = shuffle(r.pairs.concat(r.pairs));
      G.deck = deck; G.up = []; G.found = 0; G.mm = 0;
      return `<div class="mem ${deck.length > 6 ? 'c4' : ''}">${deck.map((k, i) => `<button class="card2" data-act="flip" data-i="${i}"><i class="back">?</i><i class="front">${r.kind === 'flag' ? Art.flag(V.countries[k].flag) : dr(k)}</i></button>`).join('')}</div>`;
    }
    if (r.type === 'trace') return `<div class="tracebox"><canvas id="tc" class="tc" aria-label="Zone de tracé"></canvas></div><div class="tools"><button class="ib" data-act="tclear" aria-label="Effacer">${IC.erase}</button><button class="ib main" style="background:var(--leaf);color:#fff" data-act="tdone" aria-label="Fini">${IC.check}</button></div>`;
    if (r.type === 'color') {
      G.fills = {}; G.col = '#e8453c';
      return `<div class="tbox">${Art.template(r.tpl, {}, false)}</div>${palette()}${okBtn('adone', true)}`;
    }
    if (r.type === 'free') { G.col = '#e8453c'; G.strokes = 0; return `<div class="tracebox"><canvas id="tc" class="tc" aria-label="Dessin libre"></canvas></div>${palette()}<div class="tools"><button class="ib" data-act="fclear" aria-label="Effacer">${IC.erase}</button></div>${okBtn('adone', true)}`; }
    if (r.type === 'xylo' || r.type === 'melody') {
      G.taps = 0;
      return `<div class="xylo">${L.notes.map((n, i) => `<button class="bar" data-note="${i}" style="background:${n.c};height:${r.type === 'melody' ? 200 : 110 + i * 20}px" aria-label="${n.n}">${n.n}</button>`).join('')}</div>${r.type === 'xylo' ? okBtn('adone', true) : ''}`;
    }
    if (r.type === 'drum') { G.taps = 0; return `<button class="djembe" id="dj" aria-label="Djembé">${dr('drum')}</button>${okBtn('adone', true)}`; }
    if (r.type === 'story') {
      const s = r.story, pg = s.pages[G.pg || 0], last = (G.pg || 0) === s.pages.length - 1;
      const sc = s.tale ? Art.storyScene(pg.scene, pg.chars) : `<div class="emj">${pg.img}</div>`;
      return `${sc}<div class="stext">${pg.text}${last && s.origin ? `<div class="origin">${s.origin}</div>` : ''}</div>
      <div class="tools"><button class="ib" data-act="spg" data-d="-1" aria-label="Page précédente">${IC.back}</button><button class="ib" data-act="sread" aria-label="Écouter">${IC.speaker}</button><button class="ib" style="background:var(--leaf);color:#fff" data-act="spg" data-d="1" aria-label="${last ? 'Fin' : 'Page suivante'}">${last ? IC.check : IC.play}</button></div>`;
    }
    return '';
  }
  const palette = () => `<div class="palette">${Object.values(V.colors).map(c => c.hex).concat(['#ffffff']).map((h, i) => `<button class="pal ${i === 0 ? 'on' : ''}" data-act="pal" data-c="${h}" style="background:${h}" aria-label="Couleur"></button>`).join('')}</div>`;

  function afterPlay() {
    const r = cur(), first = G.fresh; G.fresh = false;
    if (r.type === 'story') { if (first || G.pgChanged) { G.pgChanged = false; setTimeout(() => say(r.story.pages[G.pg || 0].text), 300); } }
    else if (first) setTimeout(() => say(r.ask), 350);
    if (r.type === 'fill') { G.put = new Set(); paintFill(); }
    if (r.type === 'swap') { initSwap(); }
    if (r.type === 'trace' || r.type === 'free') initCanvas(r.type);
    if (r.type === 'melody' && first) setTimeout(playMelody, 2200);
  }
  const hooks = {
    play() { afterPlay(); },
    result() { Sound.good(); confetti(); setTimeout(() => say(G.stars === 3 ? 'Bravo, tu as gagné trois étoiles !' : 'Bien joué !'), 500); },
    moto() {
      const token = S, got = document.getElementById('mgot'), g = garage(), m = L.missions.find(x => x.id === S.p.m) || L.missions[0];
      MH = Mini.moto({ canvas: document.getElementById('cv'), calm: Store.s().calm, alive: () => S === token, mission: m, vehicle: g.vehicle, pilot: g.pilot, obstacles: L.obstacles,
        onCollect: n => { got.textContent = n; Sound.tap(); }, onBump: () => Sound.soft(), onWin: () => miniDone('moto', m.id) });
    },
    course() { const token = S; Mini.course({ runners: ['r0', 'r1', 'r2'].map(id => document.getElementById(id)), bar: document.getElementById('cbar'), btn: document.getElementById('ctap'), alive: () => S === token, onTap: () => Sound.tap(), onWin: () => miniDone('course') }); },
    gate() {
      const b = document.getElementById('hold'); if (!b) return;
      let t0 = 0, iv;
      const stop = () => { clearInterval(iv); t0 = 0; const e = document.getElementById('holdp'); if (e) e.style.setProperty('--p', '0%'); };
      b.addEventListener('pointerdown', e => { e.preventDefault(); t0 = Date.now(); iv = setInterval(() => { const r = (Date.now() - t0) / C.parentHoldMs, e2 = document.getElementById('holdp'); if (e2) e2.style.setProperty('--p', Math.min(100, r * 100) + '%'); if (r >= 1) { clearInterval(iv); go('parent'); } }, 50); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
    }
  };

  // ---- avancer / terminer ----
  function roundDone() { const tk = G, ix = G.idx; setTimeout(() => { if (!G || G !== tk || G.idx !== ix || S.screen !== 'play') return; if (G.idx + 1 < G.rounds.length) { G.idx++; G.fresh = true; G.pg = 0; render(); } else finish(); }, 900); }
  function finish() {
    const t = G.err + G.hints, stars = G.free ? 3 : t === 0 ? 3 : t <= 2 ? 2 : 1;
    const rec = Store.record('g:' + G.cat + ':' + G.gid, stars, G.err, G.hints), p = P();
    G.stars = stars; G.newReward = null;
    if (rec.first) { const n = p.rewards.filter(r => r.type === 'draw').length; if (n < COLLECT.length) { G.newReward = COLLECT[n]; Store.addReward('draw', COLLECT[n]); } }
    if (G.cat === 'stories' && !p.storiesRead.includes(G.gid)) { p.storiesRead.push(G.gid); }
    p.recre = (p.recre || 0) + 1; Store.save(); G.recre = Store.s().minis && p.recre % 3 === 0;
    go('result');
  }
  function wrongMsg() { Sound.soft(); toast(pick(T.tryAgain), false); say(pick(T.tryAgain)); }

  // ---- choisir ----
  function pickTile(el) {
    const r = cur(); if (r.locked) return;
    const c = r.choices[+el.dataset.i];
    if (c.ok) { r.locked = true; el.classList.add('good'); Sound.good(); toast(pick(T.praise), true); say(c.say || pick(T.praise)); roundDone(); }
    else {
      G.err++; r.wrong = (r.wrong || 0) + 1; el.classList.add('bad'); wrongMsg();
      if (r.wrong === 2) { G.hints++; const i = r.choices.findIndex(x => x.ok), t = document.querySelector(`.tile[data-i="${i}"]`); if (t) t.classList.add('hint'); }
    }
  }

  // ---- glisser-déposer (le doigt déplace, ou on touche l'objet puis la place) ----
  function slotAt(x, y) { return document.elementsFromPoint(x, y).find(n => n.classList && n.classList.contains('slot')); }
  function drop(el, slot) {
    if (!slot || !el || slot.classList.contains('ok')) return;
    G.sel = null; document.querySelectorAll('.drag.sel').forEach(d => d.classList.remove('sel'));
    document.querySelectorAll('.hint').forEach(h => h.classList.remove('hint'));
    const r = cur();
    if (el.dataset.to === slot.dataset.key) {
      Sound.good(); el.classList.add('placed');
      const item = r.items.find(i => i.id === el.dataset.id), sd = r.slots.find(s => s.key === slot.dataset.key);
      if (slot.classList.contains('pos')) { slot.innerHTML = sd.full; slot.classList.add('ok'); }
      else if (slot.classList.contains('zone')) { const d = document.createElement('div'); d.innerHTML = item.h; slot.querySelector('.in').appendChild(d); }
      else { slot.classList.add('ok'); if (/^<svg/.test(item.h)) slot.innerHTML = item.h; else slot.insertAdjacentHTML('beforeend', `<b style="position:absolute;right:6px;bottom:2px;font-size:1.8rem;color:var(--b)">${item.id}</b>`); }
      if (!document.querySelector('.drag:not(.placed)')) { toast(pick(T.praise), true); say(pick(T.praise)); roundDone(); }
    } else {
      G.err++; el.dataset.w = (+el.dataset.w || 0) + 1; Sound.soft(); slot.style.animation = 'shake .4s'; setTimeout(() => { slot.style.animation = ''; }, 420); say(pick(T.tryAgain));
      if (+el.dataset.w === 2) { G.hints++; const s = document.querySelector(`.slot[data-key="${el.dataset.to}"]`); if (s) s.classList.add('hint'); el.classList.add('hint'); }
    }
  }
  $app.addEventListener('pointerdown', e => {
    const el = e.target.closest('.drag'); if (!el || el.classList.contains('ghost') || el.classList.contains('placed')) return;
    e.preventDefault();
    const r = el.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top, sx = e.clientX, sy = e.clientY;
    const g = el.cloneNode(true); g.classList.add('ghost'); g.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    document.body.appendChild(g); el.classList.add('lift'); let moved = false, over = null;
    const mv = ev => { if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 8) moved = true; g.style.left = (ev.clientX - ox) + 'px'; g.style.top = (ev.clientY - oy) + 'px'; const s = slotAt(ev.clientX, ev.clientY); if (over && over !== s) over.classList.remove('over'); over = s; if (s) s.classList.add('over'); };
    const up = ev => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      g.remove(); el.classList.remove('lift'); if (over) over.classList.remove('over');
      if (!moved) { document.querySelectorAll('.drag.sel').forEach(d => d.classList.remove('sel')); G.sel = el; el.classList.add('sel'); Sound.tap(); }
      else drop(el, slotAt(ev.clientX, ev.clientY));
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  });

  // ---- panier ----
  function paintFill() {
    const r = cur(), pool = document.getElementById('pool'), bin = document.getElementById('bin'); if (!pool) return;
    const mk = i => `<button class="mc" data-act="put" data-i="${i}">${dr('mango')}</button>`;
    pool.innerHTML = Array.from({ length: r.n + 2 }, (_, i) => i).filter(i => !G.put.has(i)).map(mk).join('');
    bin.innerHTML = [...G.put].map(mk).join('');
    document.getElementById('cnt').textContent = G.put.size;
  }

  // ---- puzzle (on échange deux morceaux) ----
  function initSwap() {
    let o; do { o = shuffle([0, 1, 2, 3]); } while (o.every((v, i) => v === i));
    G.order = o; G.swSel = null; paintSwap();
  }
  function paintSwap() {
    const r = cur(), el = document.getElementById('puz'); if (!el) return;
    el.innerHTML = G.order.map((pc, i) => `<button data-act="sw" data-i="${i}" class="${G.swSel === i ? 'sel' : ''}"><svg viewBox="${(pc % 2) * 50} ${Math.floor(pc / 2) * 50} 50 50"><rect width="100" height="100" fill="#eaf4fb"/>${Draw.inner(r.key)}</svg></button>`).join('');
  }

  // ---- mémoire ----
  function flip(el) {
    const i = +el.dataset.i; if (G.lock || G.up.includes(i) || el.classList.contains('done')) return;
    el.classList.add('up'); G.up.push(i); Sound.tap();
    if (G.up.length === 2) {
      const [a, b] = G.up, ea = document.querySelector(`.card2[data-i="${a}"]`), eb = el;
      if (G.deck[a] === G.deck[b]) { ea.classList.add('done'); eb.classList.add('done'); G.up = []; G.found++; Sound.good(); if (G.found === cur().pairs.length) { toast(pick(T.praise), true); say('Bravo !'); roundDone(); } }
      else { G.lock = true; G.mm++; if (G.mm > cur().pairs.length + 2) G.err++; setTimeout(() => { ea.classList.remove('up'); eb.classList.remove('up'); G.up = []; G.lock = false; }, 900); }
    }
  }

  // ---- tracé et dessin libre ----
  let TR = null;
  function initCanvas(type) {
    const cv = document.getElementById('tc'); if (!cv) return;
    const r = cur(), W = cv.clientWidth, H = cv.clientHeight, dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const st = document.createElement('canvas'); st.width = W; st.height = H;
    const sc = st.getContext('2d'); sc.lineCap = 'round'; sc.lineJoin = 'round';
    const trace = type === 'trace';
    sc.lineWidth = trace ? Math.max(26, H * 0.1) : 12; sc.strokeStyle = trace ? '#7a9a2e' : G.col;
    let mask = null, font, cy;
    if (trace) {
      font = `800 ${Math.round(H * 0.84)}px "Arial Rounded MT Bold","Trebuchet MS",Arial,sans-serif`; cy = H / 2 + H * 0.05;
      const mk = document.createElement('canvas'); mk.width = W; mk.height = H;
      const mc = mk.getContext('2d'); mc.font = font; mc.textAlign = 'center'; mc.textBaseline = 'middle'; mc.fillStyle = '#000'; mc.fillText(r.glyph, W / 2, cy); mask = mc.getImageData(0, 0, W, H).data;
    }
    const paint = () => {
      ctx.clearRect(0, 0, W, H);
      if (trace) { ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#efe6c8'; ctx.fillText(r.glyph, W / 2, cy); ctx.setLineDash([10, 12]); ctx.lineWidth = 4; ctx.strokeStyle = '#b9a56a'; ctx.strokeText(r.glyph, W / 2, cy); ctx.setLineDash([]); }
      ctx.drawImage(st, 0, 0, W, H);
    };
    TR = { W, H, mask, st, sc, paint, last: null, type }; paint();
    const pt = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); TR.last = pt(e); if (!trace) sc.strokeStyle = G.col; sc.beginPath(); sc.moveTo(...TR.last); sc.lineTo(TR.last[0] + 0.1, TR.last[1]); sc.stroke(); paint(); });
    cv.addEventListener('pointermove', e => { if (!TR.last) return; const p = pt(e); sc.beginPath(); sc.moveTo(...TR.last); sc.lineTo(...p); sc.stroke(); TR.last = p; paint(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => cv.addEventListener(ev, () => { if (TR.last && !trace) { G.strokes++; const b = document.getElementById('okb'); if (b && G.strokes >= 2) b.disabled = false; } TR.last = null; }));
  }
  function traceCheck() {
    const { W, H, mask, st } = TR, sd = st.getContext('2d').getImageData(0, 0, W, H).data;
    let body = 0, cov = 0, ink = 0;
    for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) { const i = (y * W + x) * 4 + 3; if (mask[i] > 128) { body++; if (sd[i] > 0) cov++; } if (sd[i] > 0) ink++; }
    return { cov: body ? cov / body : 0, ratio: body ? ink / body : 9 };
  }

  // ---- musique ----
  const flashBar = i => { const b = document.querySelector(`.bar[data-note="${i}"]`); if (b) { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 220); } };
  function playMelody() {
    const r = cur(); if (!r || r.type !== 'melody') return;
    r.seq = Array.from({ length: r.len }, () => Math.floor(Math.random() * 5)); r.pos = 0; r.listen = true;
    const token = G; r.seq.forEach((n, i) => setTimeout(() => { if (G !== token) return; Sound.note(L.notes[n].f); flashBar(n); if (i === r.seq.length - 1) r.listen = false; }, 600 * i));
  }
  function pressNote(i) {
    const r = cur(); if (!r) return;
    Sound.note(L.notes[i].f); flashBar(i);
    if (r.type === 'xylo') { G.taps++; if (G.taps >= 8) { const b = document.getElementById('okb'); if (b) b.disabled = false; } }
    if (r.type === 'melody' && r.seq && !r.listen && !r.locked) {
      if (i === r.seq[r.pos]) { r.pos++; if (r.pos >= r.seq.length) { r.locked = true; toast(pick(T.praise), true); say('Bravo !'); roundDone(); } }
      else { G.err++; r.pos = 0; wrongMsg(); setTimeout(() => { if (cur() === r) { r.seq.forEach((n, k) => setTimeout(() => { Sound.note(L.notes[n].f); flashBar(n); }, 600 * k)); } }, 900); }
    }
  }
  $app.addEventListener('pointerdown', e => {
    const b = e.target.closest('[data-note]'); if (b) { e.preventDefault(); pressNote(+b.dataset.note); return; }
    const d = e.target.closest('#dj'); if (d) { e.preventDefault(); Sound.note(pick([98, 110, 131, 147])); d.classList.add('hit'); setTimeout(() => d.classList.remove('hit'), 90); G.taps++; if (G.taps >= 10) { const o = document.getElementById('okb'); if (o) o.disabled = false; } }
  });

  // ---- récré ----
  function garage() { const g = P().garage || {}; return { vehicle: g.vehicle || L.vehicles[0].e, pilot: g.pilot || L.pilots[0].e }; }
  function miniDone(g, mid) {
    const p = P(); p.minis = p.minis || {}; p.minis[g] = (p.minis[g] || 0) + 1; if (mid) { p.missions = p.missions || {}; p.missions[mid] = (p.missions[mid] || 0) + 1; } Store.save();
    Sound.good(); confetti(); setTimeout(() => say('Bravo, tu as gagné !'), 400);
    showModal(`<div class="dlg"><div style="width:120px;height:120px;margin:0 auto">${dr('lion')}</div><h1>Bravo !</h1><div class="btns">
      <button style="background:var(--coral)" ${mid ? `data-act="mission" data-m="${mid}"` : 'data-act="go" data-to="course"'} aria-label="Rejouer">${IC.replay}</button>
      <button style="background:var(--turq)" data-act="go" data-to="home" aria-label="Accueil">${IC.home}</button></div></div>`);
  }

  // ================= ACTIONS =================
  const actions = {
    go: el => { hideModal(); go(el.dataset.to); },
    cat: el => go('cat', { id: el.dataset.id }),
    game: el => { hideModal(); startGame(el.dataset.c, el.dataset.g); },
    auto() {
      let t = null; const max = Math.max(...CATS.map(c => c.games.length));
      for (let j = 0; j < max && !t; j++) CATS.forEach(c => { if (!t && c.games[j] && starsOf(c.id, c.games[j].id) === 0) t = [c.id, c.games[j].id]; });
      for (let j = 0; j < max && !t; j++) CATS.forEach(c => { if (!t && c.games[j] && starsOf(c.id, c.games[j].id) < 3) t = [c.id, c.games[j].id]; });
      if (!t) { const c = pick(CATS), g = pick(c.games); t = [c.id, g.id]; }
      startGame(t[0], t[1]);
    },
    say() { const r = cur(); if (!r) return; if (r.type === 'story') say(r.story.pages[G.pg || 0].text); else { say(r.ask); if (r.type === 'melody') playMelody(); } },
    leave() { if (G && G.idx > 0) showModal(`<div class="dlg"><h1>${T.quit}</h1><div class="btns"><button style="background:var(--coral)" data-act="quit" aria-label="Oui">${IC.check}</button><button style="background:var(--leaf)" data-act="stay" aria-label="Non">${IC.close}</button></div></div>`); else actions.quit(); },
    quit() { hideModal(); go('cat', { id: G.cat }); }, stay: hideModal,
    pick: pickTile,
    put(el) { const i = +el.dataset.i; if (G.put.has(i)) G.put.delete(i); else G.put.add(i); Sound.tap(); paintFill(); },
    fillok() {
      const r = cur();
      if (G.put.size === r.n) { toast(pick(T.praise), true); Sound.good(); say(mg(r.n)); document.getElementById('okb').disabled = true; roundDone(); }
      else { G.err++; wrongMsg(); say(G.put.size > r.n ? 'Il y en a trop. Retires-en un.' : 'Il en faut encore. Comptons : ' + (G.put.size)); }
    },
    sw(el) {
      const i = +el.dataset.i;
      if (G.swSel === null) { G.swSel = i; Sound.tap(); } else { const j = G.swSel; G.swSel = null; if (j !== i) { [G.order[i], G.order[j]] = [G.order[j], G.order[i]]; Sound.tap(); } }
      paintSwap();
      if (G.order.every((v, k) => v === k)) { Sound.good(); toast(pick(T.praise), true); say('Bravo !'); roundDone(); }
    },
    flip,
    tclear() { if (!TR) return; TR.sc.clearRect(0, 0, TR.W, TR.H); TR.paint(); },
    tdone() {
      const k = traceCheck();
      if (k.cov >= 0.5 && k.ratio <= 3.6) { Sound.good(); toast(pick(T.praise), true); say('Bravo !'); roundDone(); }
      else { G.err++; wrongMsg(); say(k.ratio > 3.6 ? 'Efface et recommence doucement.' : 'Suis tout le trait pointillé.'); }
    },
    fclear() { if (TR) { TR.sc.clearRect(0, 0, TR.W, TR.H); TR.paint(); } },
    pal(el) {
      G.col = el.dataset.c; document.querySelectorAll('.pal').forEach(p => p.classList.toggle('on', p === el));
      if (TR && TR.type === 'free') TR.sc.strokeStyle = G.col; Sound.tap();
    },
    reg(el) {
      el.setAttribute('fill', G.col); G.fills[el.dataset.r] = G.col; Sound.tap();
      const n = Object.keys(G.fills).length, b = document.getElementById('okb'); if (b && n >= 3) b.disabled = false;
    },
    adone() { Sound.good(); roundDone(); },
    spg(el) {
      const r = cur(), n = r.story.pages.length, d = +el.dataset.d, pg = (G.pg || 0) + d;
      if (pg < 0) return; if (pg >= n) { Sound.good(); finish(); return; }
      G.pg = pg; G.pgChanged = true; Sound.tap(); render(); const p = document.querySelector('.pbar i'); if (p) p.style.width = Math.round(pg / n * 100) + '%';
    },
    sread() { const r = cur(); say(r.story.pages[G.pg || 0].text); },
    mission: el => { hideModal(); go('moto', { m: el.dataset.m }); },
    mleft() { if (MH) MH.left(); }, mright() { if (MH) MH.right(); },
    pickg(el) { const v = (el.dataset.k === 'vehicle' ? L.vehicles : L.pilots).find(x => x.e === el.dataset.e); if (totalStars() < v.need) { toast('★ ' + v.need, false); return; } P().garage = Object.assign(garage(), { [el.dataset.k]: v.e }); Store.save(); render(); },
    tog(el) { const s = Store.s(); s[el.dataset.k] = !s[el.dataset.k]; Store.save(); applyPrefs(); render(); },
    clearclips() { if (confirm('Effacer tous les enregistrements de voix ?')) { Sound.clearClips(); render(); } },
    testvoice() { say('Bonjour ! Je suis Lumi. Aujourd’hui, on apprend en jouant.'); },
    howinstall() { LumiInstall.open(); },
    doinstall() { hideModal(); LumiInstall.ask(); },
    export() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Store.exportJSON()], { type: 'application/json' })); a.download = 'lumi-donnees.json'; a.click(); },
    wipe() { if (confirm('Tout effacer ? Les progrès seront perdus.')) { Store.resetAll(); location.reload(); } }
  };
  const onAct = e => {
    const el = e.target.closest('[data-act]');
    if (el && actions[el.dataset.act]) { actions[el.dataset.act](el, e); return; }
    const sl = e.target.closest('.slot');
    if (sl && G && G.sel && S.screen === 'play') drop(G.sel, sl);
  };
  $app.addEventListener('click', onAct); $modal.addEventListener('click', onAct);
  $app.addEventListener('change', e => {
    const k = e.target.dataset.chg; if (!k) return; const s = Store.s();
    if (k === 'vname') { s.vname = e.target.value; Store.save(); Sound.refresh(); say('Bonjour ! Je suis Lumi.'); }
    if (k === 'rename') { P().name = e.target.value.trim().slice(0, 20); Store.save(); }
    if (k === 'limit') { s.limitMin = +e.target.value; limitShown = false; elapsed = 0; Store.save(); }
  });
  $app.addEventListener('input', e => { const k = e.target.dataset.inp; if (k === 'volume' || k === 'rate' || k === 'pitch') { Store.s()[k] = +e.target.value; Store.save(); } });
  $app.addEventListener('change', e => { if (e.target.dataset.inp === 'rate' || e.target.dataset.inp === 'pitch') say('Bonjour ! Aujourd’hui, on apprend en jouant.'); });
  function applyPrefs() { const s = Store.s(); document.body.classList.toggle('big', !!s.big); document.body.classList.toggle('calm', !!s.calm); document.body.classList.toggle('contrast', !!s.contrast); }
  applyPrefs();

  // ---- mode enregistrement : un adulte enregistre sa propre voix, phrase après phrase (gardée sur l'appareil) ----
  const recBox = document.createElement('div'); recBox.className = 'rec'; recBox.hidden = true; document.body.appendChild(recBox);
  let rc = null;
  function paintRec(msg) {
    if (!rc) { recBox.hidden = true; recBox.innerHTML = ''; return; }
    recBox.hidden = false;
    recBox.innerHTML = `<div class="rt">« ${esc(rc.text)} »</div><div class="rm">${msg || (rc.blob ? 'Écoute, puis garde ou recommence.' : 'Appuie sur Enregistrer et lis la phrase.')}</div>
      <div class="rb"><button data-r="rec" class="${rc.mr ? 'live' : ''}">${rc.mr ? '■ Arrêter' : rc.blob ? '● Refaire' : '● Enregistrer'}</button>${rc.blob ? '<button data-r="play">▶ Écouter</button><button data-r="ok" class="ok">✔ Garder</button>' : ''}<button data-r="skip">Passer</button></div>`;
  }
  function closeRec() { if (rc && rc.stream) rc.stream.getTracks().forEach(t => t.stop()); rc = null; paintRec(); }
  Sound.setOnMiss(text => { if (rc && rc.text === text) return; closeRec(); rc = { text }; paintRec(); });
  recBox.addEventListener('click', async e => {
    const b = e.target.closest('[data-r]'); if (!b || !rc) return; const a = b.dataset.r;
    if (a === 'skip') closeRec();
    else if (a === 'play') Sound.playClip(URL.createObjectURL(rc.blob));
    else if (a === 'ok') { Sound.saveClip(rc.text, rc.blob); closeRec(); toast('Enregistré', true); }
    else if (a === 'rec') {
      if (rc.mr) { rc.mr.stop(); return; }
      try {
        rc.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(rc.stream), chunks = []; rc.mr = mr; rc.blob = null;
        mr.ondataavailable = ev => chunks.push(ev.data);
        mr.onstop = () => { if (!rc) return; rc.blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' }); rc.mr = null; rc.stream.getTracks().forEach(t => t.stop()); paintRec(); };
        mr.start(); paintRec('Je t’écoute… parle doucement et clairement.');
      } catch (err) { paintRec('Micro indisponible : autorise le micro pour LUMI dans le navigateur.'); }
    }
  });

  // ---- temps de jeu et pause ----
  setInterval(() => {
    if (document.hidden) return; elapsed += 5; Store.addTime(5);
    const lim = Store.s().limitMin;
    if (lim && elapsed >= lim * 60 && !limitShown) { limitShown = true; Sound.stop(); showModal(`<div class="dlg"><div style="width:110px;height:110px;margin:0 auto">${dr('lion')}</div><h1>On a bien joué !</h1><p>On fait une petite pause ?</p><div class="btns"><button style="background:var(--turq)" data-act="go" data-to="home" aria-label="Accueil">${IC.home}</button><button style="background:var(--violet)" data-act="stay" aria-label="Continuer">${IC.play}</button></div></div>`); }
  }, 5000);
  const chip = document.createElement('div'); chip.className = 'chipoff'; chip.textContent = T.offline; document.body.appendChild(chip);
  const net = () => { chip.style.display = navigator.onLine ? 'none' : 'block'; };
  addEventListener('online', net); addEventListener('offline', net); net();

  // ================= INSTALLATION =================
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const bar = document.createElement('div'); bar.className = 'install'; bar.hidden = true; document.body.appendChild(bar);
  let deferred = null, askedOnce = false;
  const dismissed = () => { try { return Date.now() - (+localStorage.getItem('lumi.installNo') || 0) < 7 * 864e5; } catch (e) { return false; } };
  const hideBar = remember => { bar.hidden = true; if (remember) try { localStorage.setItem('lumi.installNo', Date.now()); } catch (e) {} };
  const ua = navigator.userAgent, isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
  function howTo() {
    if (/FBAN|FBAV|Instagram|Line\/|MicroMessenger|; wv\)|TikTok|Snapchat/i.test(ua)) return { name: 'cette application', txt: 'Ouvre ce lien dans ton navigateur (menu ⋮ puis <b>« Ouvrir dans le navigateur »</b>), puis installe LUMI.' };
    if (isIOS) return { name: 'Safari', txt: 'Touche <b>Partager</b> ⬆️ puis <b>« Sur l’écran d’accueil »</b>. (Dans Chrome ou Firefox sur iPhone, ouvre plutôt le lien dans <b>Safari</b>.)' };
    if (/SamsungBrowser/i.test(ua)) return { name: 'Samsung Internet', txt: 'Touche le menu <b>☰</b> puis <b>« Ajouter la page à »</b> → <b>« Écran d’accueil »</b>.' };
    if (/Firefox|FxiOS/i.test(ua)) return { name: 'Firefox', txt: 'Touche le menu <b>⋮</b> puis <b>« Installer »</b> (ou « Ajouter à l’écran d’accueil »).' };
    if (/EdgA|EdgiOS|Edg\//i.test(ua)) return { name: 'Edge', txt: 'Touche le menu <b>⋯</b> puis <b>« Ajouter au téléphone »</b> (ou « Installer »).' };
    if (/OPR|Opera/i.test(ua)) return { name: 'Opera', txt: 'Touche le menu <b>⋮</b> puis <b>« Écran d’accueil »</b>.' };
    return { name: 'ton navigateur', short: 'menu du navigateur (⋮ ☰ ⋯) puis <b>« Ajouter à l’écran d’accueil »</b>.',
      txt: 'Touche le menu du navigateur (<b>⋮</b>, <b>☰</b> ou <b>⋯</b>), puis <b>« Ajouter à l’écran d’accueil »</b> (ou « Ajouter un raccourci », « Installer l’application »). À défaut, ajoute la page aux <b>favoris</b> : LUMI marche quand même.' };
  }
  function showBar() {
    if (standalone || dismissed()) return;
    if (deferred) bar.innerHTML = `<span>Installer LUMI sur le téléphone</span><button class="go" data-inst="yes">Installer</button><button class="no" data-inst="no" aria-label="Fermer">✕</button>`;
    else if (isMobile) bar.innerHTML = `<span>Installer LUMI : ${howTo().short || howTo().txt}</span><button class="no" data-inst="no" aria-label="Fermer">✕</button>`;
    else return;
    bar.hidden = false;
  }
  window.LumiInstall = {
    open() { const h = howTo(); showModal(`<div class="dlg"><h1>Installer LUMI</h1><p style="text-align:left">Navigateur détecté : <b>${h.name}</b><br><br>${deferred ? 'Touche le bouton ci-dessous.' : h.txt}</p><div class="btns">${deferred ? '<button style="background:var(--leaf)" data-act="doinstall">Installer</button>' : ''}<button style="background:var(--turq)" data-act="stay">OK</button></div></div>`); },
    ask: () => askInstall()
  };
  async function askInstall() { if (!deferred) return; const ev = deferred; deferred = null; askedOnce = true; try { ev.prompt(); const r = await ev.userChoice; hideBar(r.outcome !== 'accepted'); } catch (e) {} }
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; if (!standalone && !dismissed()) showBar(); });
  addEventListener('appinstalled', () => { deferred = null; hideBar(false); });
  bar.addEventListener('click', e => { const b = e.target.closest('[data-inst]'); if (!b) return; if (b.dataset.inst === 'yes') { deferred ? askInstall() : hideBar(false); } else hideBar(true); });
  document.addEventListener('pointerup', () => { if (deferred && !askedOnce && !dismissed() && !standalone) setTimeout(askInstall, 400); });
  if (isMobile) setTimeout(() => { if (!deferred) showBar(); }, 3000);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  render();
})();
