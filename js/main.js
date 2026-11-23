// LUMI v3 : interface en panneaux de couleur, catégories libres, jeux variés, espace parent renforcé.
(function () {
  const L = LUMI, C = L.config, CATS = Games.CATS, V = L.vocab;
  const $app = document.getElementById('app'), $modal = document.getElementById('modal');
  const t = (k, v) => I18n.t(k, v), line = (k, v) => I18n.line(k, v);
  const pick = Games.pick, shuffle = Games.shuffle, dr = Draw.svg;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  Object.entries(C.colors).forEach(([k, v]) => document.documentElement.style.setProperty('--' + k, v));

  // ---- profil local + langue + migration des compétences ----
  Store.ensureProfile(); I18n.setLang(Store.s().lang);
  Store.profiles().forEach(p => { if (!Object.keys(p.skills || {}).length && Object.keys(p.progress).length) Skills.rebuild(p); });
  Store.save();
  const P = () => Store.profile();
  const avatarOf = id => L.avatars.find(a => a.id === id) || L.avatars[0];
  const starsOf = (c, g) => { const x = P().progress['g:' + c + ':' + g]; return x ? x.stars : 0; };
  const catStars = c => c.games.reduce((a, g) => a + starsOf(c.id, g.id), 0);
  const totalStars = () => Object.values(P().progress).reduce((a, x) => a + (x.stars || 0), 0);
  const cat = id => CATS.find(c => c.id === id);
  const COLLECT = Draw.keys, mg = n => I18n.mg(n);
  const NOTES = () => I18n.raw('notes');

  // ---- icônes d'interface ----
  const sv = (inner, fill) => `<svg viewBox="0 0 24 24" aria-hidden="true" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"'}>${inner}</svg>`;
  const IC = {
    home: sv('<path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z"/>', 1),
    trophy: sv('<path d="M7 3h10v4a5 5 0 0 1-4 4.9V15h3v2H8v-2h3v-3.1A5 5 0 0 1 7 7zM3 4h3v3a3 3 0 0 1-3-3zm18 0h-3v3a3 3 0 0 0 3-3zM8 19h8v2H8z"/>', 1),
    lock: sv('<path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V8a3 3 0 0 0-6 0z"/>', 1),
    close: sv('<path d="M5 5l14 14M19 5L5 19"/>'), back: sv('<path d="M15 4 7 12l8 8"/>'),
    speaker: sv('<path d="M3 9v6h4l5 4V5L7 9z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" stroke-width="2.4"/>'),
    check: sv('<path d="M4 12.5l5 5L20 6.5" stroke-width="4"/>'), replay: sv('<path d="M5 12a7 7 0 1 0 2.2-5.1M5 4v4h4"/>'),
    play: sv('<path d="M7 4l13 8-13 8z"/>', 1), erase: sv('<path d="M4 20h16M6 16l9-11 5 4-8 10H8z"/>'), del: sv('<path d="M21 5H9l-6 7 6 7h12zM15 9l-4 6M11 9l4 6"/>'),
    people: sv('<circle cx="9" cy="8" r="3.6"/><circle cx="17.5" cy="9" r="3"/><path d="M2.5 20c0-4.2 3-6.2 6.5-6.2s6.5 2 6.5 6.2zM15.4 14.4c3.6-.5 6.6 1 6.6 5.6h-5.2"/>', 1),
    person: sv('<circle cx="12" cy="8" r="4.2"/><path d="M4 21c0-5 3.6-7 8-7s8 2 8 7z"/>', 1),
    pad: sv('<path d="M7 7h10a5 5 0 0 1 5 5v2.4a3.6 3.6 0 0 1-6.2 2.5L14.4 15H9.6l-1.4 1.9A3.6 3.6 0 0 1 2 14.4V12a5 5 0 0 1 5-5z"/><path d="M7.4 9.6v3.2M5.8 11.2H9" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><circle cx="16.4" cy="10.6" r="1.1" fill="#fff"/><circle cx="18.6" cy="12.4" r="1.1" fill="#fff"/>', 1),
    book: sv('<path d="M2 5.5c3.2-1.6 6.4-1.4 10 1v13.5c-3.6-2.4-6.8-2.6-10-1zM22 5.5c-3.2-1.6-6.4-1.4-10 1v13.5c3.6-2.4 6.8-2.6 10-1z"/>', 1),
    caret: sv('<path d="M5.5 9h13L12 16.5z"/>', 1)
  };

  // ---- état ----
  let S = { screen: 'welcome', p: {} }, G = null, elapsed = 0, sinceBreak = 0, MH = null, lastTouch = Date.now(), nudgeT = null;
  const NOTABS = ['welcome', 'profiles', 'play', 'result', 'gate', 'parent', 'moto', 'course', 'lock'];
  function go(screen, p) { S = { screen, p: p || {} }; render(); window.scrollTo(0, 0); }
  function render() {
    Sound.stop(); clearTimeout(nudgeT);
    $app.className = (NOTABS.includes(S.screen) ? 'noTabs' : '') + (S.screen === 'home' ? ' homeApp' : '') + (S.screen === 'welcome' ? ' homeApp welcomeApp' : '');
    $app.innerHTML = screens[S.screen]() + (NOTABS.includes(S.screen) ? '' : tabsHTML());
    if (hooks[S.screen]) hooks[S.screen]();
  }
  const tabsHTML = () => Home.nav(homeCtx(), Home.activeTab(S.screen));   // barre à 4 onglets (voir home.js)
  const say = l => Sound.speak(l);
  const showModal = h => { $modal.innerHTML = h; $modal.setAttribute('role', 'dialog'); $modal.setAttribute('aria-modal', 'true'); };
  const hideModal = () => { $modal.innerHTML = ''; };
  const modalOpen = () => $modal.innerHTML !== '';
  const fb = document.createElement('div'); fb.className = 'fb'; fb.setAttribute('role', 'status'); fb.setAttribute('aria-live', 'polite'); document.body.appendChild(fb);
  let fbT; function toast(msg, ok) { fb.textContent = msg; fb.className = 'fb on' + (ok ? '' : ' no'); clearTimeout(fbT); fbT = setTimeout(() => { fb.className = 'fb'; }, 1100); }
  function confetti() {
    if (Store.s().calm) return;
    const d = document.createElement('div'); d.className = 'confetti';
    for (let i = 0; i < 26; i++) d.innerHTML += `<i style="left:${Math.random() * 100}%;animation-delay:${Math.random() * 0.8}s">${pick(['⭐', '✨', '🎉', '🌟'])}</i>`;
    document.body.appendChild(d); setTimeout(() => d.remove(), 3500);
  }
  const starRow = n => `<span class="stars" aria-label="${n} / 3">${[0, 1, 2].map(i => `<span class="star ${i < n ? 'on' : ''}">★</span>`).join('')}</span>`;

  if (Env.label) { const rb = document.createElement('div'); rb.className = 'ribbon'; rb.textContent = Env.label + ' — ' + Env.slug; document.body.appendChild(rb); }
  // ---- bandeau d'avertissement (stockage plein, données illisibles…) ----
  const notice = document.createElement('div'); notice.className = 'notice'; notice.hidden = true; notice.setAttribute('role', 'alert'); document.body.appendChild(notice);
  function showNotice(msg) { notice.innerHTML = `<span>${esc(msg)}</span><button aria-label="${t('close')}" data-n="x">✕</button>`; notice.hidden = false; }
  notice.addEventListener('click', e => { if (e.target.closest('[data-n]')) notice.hidden = true; });
  function statusNotice() {
    const s = Store.status;
    if (s.level === 'fail' || s.level === 'unavailable') showNotice(t('p.storageFail'));
    else if (s.level === 'corrupt') showNotice(t('p.storageCorrupt'));
    else notice.hidden = true;
  }
  Store.onStatus(statusNotice); statusNotice();

  // ---- préférences d'affichage (zoom autorisé, taille du texte, gros boutons, contraste, animations) ----
  function applyPrefs() {
    const s = Store.s(), d = document.documentElement;
    d.lang = I18n.lang(); d.style.fontSize = Math.round(100 * (s.textScale || 1)) + '%';
    document.body.classList.toggle('big', !!s.big); document.body.classList.toggle('calm', !!s.calm); document.body.classList.toggle('contrast', !!s.contrast);
  }
  applyPrefs();

  // ================= LIMITES DE TEMPS =================
  const extra = () => { const p = P(); return p && p.ext && p.ext.d === Store.today() ? p.ext.sec : 0; };
  const limitState = () => Rules.sessionState({ playedToday: Store.playedToday(), breakMin: Store.s().breakMin, lockMin: Store.s().lockMin, sinceBreak, extra: extra() });
  function checkLock() { if (limitState().lock && S.screen !== 'lock' && S.screen !== 'gate' && S.screen !== 'parent') { hideModal(); go('lock'); return true; } return false; }

  // ================= DONNÉES DE L'ACCUEIL (réelles : profil actif, étoiles, mission du jour) =================
  const GROUPS = Games.GROUPS;
  const groupCats = g => g.cats.map(cat);
  const groupStars = g => groupCats(g).reduce((a, c) => a + catStars(c), 0);
  const groupMax = g => groupCats(g).reduce((a, c) => a + c.games.length * 3, 0);
  // Mission du jour : même profil + même date locale = même mission ; elle pointe vers un vrai jeu adapté à l'âge.
  function missionInfo() {
    const p = P(), m = Rules.dailyMission(CATS, p.age, Store.today(), p.id, (c, g) => { const z = p.progress['g:' + c + ':' + g]; return z ? { stars: z.stars, updated: z.updated } : null; }, I18n.raw('letters').map(l => l.l));
    if (!m) return null;
    const c = cat(m.cat), g = c.games.find(z => z.id === m.game), k = 'dm.' + m.cat + '.' + m.game;
    m.text = I18n.raw(k) !== undefined ? t(k, { l: m.letter }) : m.cat === 'stories' ? t('dm.stories', { name: Games.gameName(c, g) }) : t('dm.generic', { name: Games.gameName(c, g) });
    return m;
  }
  function homeCtx() {
    const p = P(), gs = GROUPS.reduce((a, g) => a + groupStars(g), 0), mx = GROUPS.reduce((a, g) => a + groupMax(g), 0);
    return { t, dr, IC, art: Art, profile: p, profiles: Store.profiles(), avatarOf, avatar: avatarOf(p.avatar), groups: GROUPS, cat, label: Games.label, gameName: Games.gameName, starRow, starsOf, groupStars, groupMax,
      totalStars: totalStars(), pct: Math.round(gs / Math.max(1, mx) * 100), rewardsGot: p.rewards.filter(r => r.type === 'draw').length, rewardsMax: COLLECT.length, mission: missionInfo(),
      mastered: Skills.summary(p).filter(s => s.level === 2).map(s => t('skill.' + s.id)) };
  }

  // ================= ÉCRANS =================
  const screens = {
    welcome() { return Home.welcome(homeCtx()); },
    profiles() { return Home.profilesPage(homeCtx()); },
    home() { return Home.home(homeCtx()); },
    games() { return Home.games(homeCtx()); },
    progress() { return Home.progressPage(homeCtx()); },
    grp() { return Home.group(homeCtx(), GROUPS.find(g => g.id === S.p.id) || GROUPS[0]); },
    cat() {
      const c = cat(S.p.id), age = P().age;
      return `<div class="hub" style="--b:var(--${c.c});--bd:var(--${c.c}D)"><div class="hubtop"><button class="ib" data-act="go" data-to="home" aria-label="${t('back')}">${IC.back}</button><h1>${Games.label(c)}</h1><div class="pic">${dr(c.art)}</div></div>
      <div class="glist">${c.games.map(g => `<button class="gcard" data-act="game" data-c="${c.id}" data-g="${g.id}"><div class="gi">${g.e || dr(g.ic)}</div><div><b>${esc(Games.gameName(c, g))}</b>${starRow(starsOf(c.id, g.id))}${g.lvl > age ? `<span class="lvl">${g.lvl}+</span>` : ''}</div></button>`).join('')}</div></div>`;
    },
    play() { return playHTML(); },
    result() {
      const c = G.cd, rw = G.newReward, nxt = c.games[c.games.findIndex(g => g.id === G.gid) + 1];
      const recre = G.recre ? `<button class="recre" data-act="mission" data-m="${pick(L.missions).id}"><div class="pic">${dr('c_recre')}</div>${t('recreTour')}</button>` : '';
      return `<div class="result result3-wrap" style="--b:var(--${c.c});--bd:var(--${c.c}D)">` + Home.result(homeCtx(), { name: P().name || '', stars: G.stars, reward: rw ? dr(rw) : '', recre,
        nextAct: nxt ? 'game' : 'cat', nextData: `data-c="${G.cat}" data-g="${nxt ? nxt.id : ''}" data-id="${G.cat}"`, cat: G.cat, gid: G.gid }) + '</div>';
    },
    trophies() {
      const have = P().rewards.filter(r => r.type === 'draw').map(r => r.item), p = P(), g = garage();
      return `<div class="pagehead"><h1>${t('trophies')}</h1><div class="chip">${dr('star')}${totalStars()}</div></div>
      <div class="sec"><div class="coll">${COLLECT.map(k => `<div class="${have.includes(k) ? '' : 'lock'}">${dr(k)}</div>`).join('')}</div></div>
      <div class="sec"><div class="row"><span>${t('garage')}</span><button class="btn sun" data-act="go" data-to="garage">${g.vehicle} ${g.pilot}</button></div>
      <div class="row"><span>${t('storiesRead')}</span><b>${p.storiesRead.length}/${L.stories.length}</b></div></div>`;
    },
    recre() {
      const g = garage();
      return `<div class="hub" style="--b:var(--coral);--bd:var(--coralD)"><div class="hubtop"><button class="ib" data-act="go" data-to="home" aria-label="${t('back')}">${IC.back}</button><h1>${t('recre')}</h1><div class="pic">${dr('c_recre')}</div></div>
      <div class="glist"><button class="gcard" data-act="go" data-to="missions"><div class="gi">${g.vehicle}</div><div><b>${t('missions')}</b></div></button>
      <button class="gcard" data-act="go" data-to="course"><div class="gi">🏁</div><div><b>${t('race')}</b></div></button>
      <button class="gcard" data-act="go" data-to="garage"><div class="gi">${g.pilot}</div><div><b>${t('garage')}</b></div></button></div></div>`;
    },
    missions() {
      return `<div class="hub" style="--b:var(--coral);--bd:var(--coralD)"><div class="hubtop"><button class="ib" data-act="go" data-to="recre" aria-label="${t('back')}">${IC.back}</button><h1>${t('missions')}</h1></div><div class="glist">${L.missions.map(m => `<button class="gcard" data-act="mission" data-m="${m.id}"><div class="gi">${m.icon}</div><div><b>${esc(t('mission.' + m.id))}</b><small>${m.goal} ${m.items.join('')}</small></div></button>`).join('')}</div></div>`;
    },
    garage() {
      const g = garage(), n = totalStars();
      const nm = (key, v) => t((key === 'vehicle' ? 'veh.' : 'pil.') + v.name);
      const grid = (list, key) => list.map(v => { const ok = n >= v.need; return `<button class="gtile ${g[key] === v.e ? 'on' : ''} ${ok ? '' : 'off'}" data-act="pickg" data-k="${key}" data-e="${v.e}" aria-label="${nm(key, v)}">${v.e}<small>${ok ? nm(key, v) : '★ ' + v.need}</small></button>`; }).join('');
      return `<div class="pagehead"><button class="ib" data-act="go" data-to="recre" aria-label="${t('back')}">${IC.back}</button><h1>${t('garage')}</h1><div class="chip">${dr('star')}${n}</div></div>
      <div class="sec"><div class="center" style="font-size:4rem">${g.vehicle} ${g.pilot}</div></div>
      <div class="sec"><h2>${t('vehicles')}</h2><div class="ggrid">${grid(L.vehicles, 'vehicle')}</div></div><div class="sec"><h2>${t('pilots')}</h2><div class="ggrid">${grid(L.pilots, 'pilot')}</div></div>`;
    },
    moto() {
      const m = L.missions.find(x => x.id === S.p.m) || L.missions[0];
      return `<div class="ptop" style="margin-bottom:10px"><button class="ib" data-act="go" data-to="missions" aria-label="${t('close')}">${IC.close}</button><div class="chip">${m.icon} <span id="mgot">0</span> / ${m.goal}</div></div>
      <canvas id="cv" class="cv" aria-label="${t('race')}"></canvas>
      <div class="ctrl" style="margin-top:12px"><button class="ib" data-act="mleft" aria-label="←">${IC.back}</button><button class="ib" data-act="mright" aria-label="→" style="transform:scaleX(-1)">${IC.back}</button></div>`;
    },
    course() {
      const g = garage(), fr = shuffle(L.pilots.filter(p => p.e !== g.pilot)).slice(0, 2).map(p => p.e);
      const lane = (id, e) => `<div class="lane"><span class="run" id="${id}">${e}</span><span class="flag">🏁</span></div>`;
      return `<div class="ptop" style="margin-bottom:10px"><button class="ib" data-act="go" data-to="recre" aria-label="${t('close')}">${IC.close}</button><h1 style="margin:0;font-size:1.3rem">${t('race')}</h1></div>
      <div class="sec">${lane('r0', g.pilot)}${lane('r1', fr[0])}${lane('r2', fr[1])}<div class="pbx"><i id="cbar" style="width:0"></i></div></div>
      <button class="okb" id="ctap" style="max-width:none;font-size:2rem;padding:34px" aria-label="${t('play')}">${IC.play}</button>`;
    },
    lock() {
      return `<div class="result"><div class="lu" style="filter:grayscale(.4)">${dr('lion')}</div><h1 style="margin:0">${t('p.locked')}</h1>
        <div class="row3"><button class="ib main" data-act="unlock" aria-label="${t('p.unlock')}">${IC.lock}</button></div><p>${t('p.unlock')}</p></div>`;
    },
    gate() {
      if (G_.step === 1) return `<div class="pagehead"><button class="ib" data-act="go" data-to="home" aria-label="${t('back')}">${IC.back}</button><h1>${t('p.gate.title')}</h1></div>
        <div class="sec" style="text-align:center"><p>${t('p.gate.hold')}</p><button class="hold" id="hold" aria-label="${t('p.gate.hold')}">${IC.lock}<i id="holdp"></i></button></div>`;
      const cool = Date.now() < G_.until;
      return `<div class="pagehead"><button class="ib" data-act="go" data-to="home" aria-label="${t('back')}">${IC.back}</button><h1>${t('p.gate.title')}</h1></div>
        <div class="sec" style="text-align:center"><h2 style="font-size:1.6rem">${t('p.gate.calc', { a: G_.ch.a, b: G_.ch.b })}</h2><div class="gin" id="gin" aria-live="polite">${esc(G_.input) || '&nbsp;'}</div>
        <div class="msg" id="gmsg">${G_.msg ? esc(G_.msg) : ''}</div>
        <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-act="key" data-k="${n}" ${cool ? 'disabled' : ''}>${n}</button>`).join('')}<button data-act="key" data-k="del" aria-label="⌫">${IC.del}</button><button data-act="key" data-k="0" ${cool ? 'disabled' : ''}>0</button><button class="ok" data-act="key" data-k="ok" aria-label="${t('done')}" ${cool ? 'disabled' : ''}>${IC.check}</button></div></div>`;
    },
    parent: parentHTML
  };

  // ================= PORTE PARENTALE =================
  // Deux étapes : maintenir 2 s, puis résoudre une addition. 3 erreurs = blocage 30 s. L'espace parent se referme après 2 minutes d'inactivité.
  let G_ = { step: 1, ch: null, input: '', tries: 0, until: 0, msg: '', purpose: 'parent' };
  function openGate(purpose) { G_ = { step: 1, ch: Rules.gateChallenge(), input: '', tries: 0, until: G_.until || 0, msg: '', purpose: purpose || 'parent' }; go('gate'); }
  function gateKey(k) {
    if (Date.now() < G_.until) return;
    if (k === 'del') G_.input = G_.input.slice(0, -1);
    else if (k === 'ok') {
      if (Rules.gateCheck(G_.ch, G_.input)) { const pur = G_.purpose; G_.step = 1; G_.input = ''; G_.tries = 0; gateDone(pur); return; }
      G_.tries++; G_.input = ''; G_.msg = t('p.gate.wrong'); Sound.soft();
      if (G_.tries >= Rules.GATE.maxTries) { G_.until = Date.now() + Rules.GATE.coolMs; G_.tries = 0; G_.ch = Rules.gateChallenge(); setTimeout(() => { if (S.screen === 'gate') { G_.msg = ''; render(); } }, Rules.GATE.coolMs + 50); }
      else G_.ch = Rules.gateChallenge();
    } else if (G_.input.length < 3) G_.input += k;
    render();
  }
  function gateDone(purpose) {
    if (purpose === 'unlock') { const p = P(); p.ext = { d: Store.today(), sec: extra() + 600 }; Store.save(); sinceBreak = 0; go('home'); }
    else { lastTouch = Date.now(); go('parent'); }
  }

  // ================= PARTIE =================
  const cur = () => G.rounds[G.idx];
  function startGame(cid, gid, opts) {
    if (checkLock()) return;
    const cd = cat(cid), gd = cd.games.find(g => g.id === gid), prev = starsOf(cid, gid);
    G = { cat: cid, gid, cd, gd, prev, idx: 0, err: 0, hints: 0, rounds: gd.make(prev === 1 ? 2 : 3, { age: P().age, letter: opts && opts.letter }), fresh: true };
    G.free = ['color', 'free', 'xylo', 'drum', 'story'].includes(G.rounds[0].type);
    go('play');
  }
  function playHTML() {
    const r = cur(), c = G.cd;
    return `<div class="play" style="--b:var(--${c.c});--bd:var(--${c.c}D)"><div class="ptop"><button class="ib" data-act="leave" aria-label="${t('close')}">${IC.close}</button><div class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="${G.rounds.length}" aria-valuenow="${G.idx}"><i style="width:${Math.round(G.idx / G.rounds.length * 100)}%"></i></div></div>
      ${r.type === 'choose' ? Home.guide(homeCtx(), r.ask.text) : `<button class="ask" id="ask" data-act="say"><span class="spk">${IC.speaker}</span><span>${esc(r.ask.text)}</span></button>`}<div class="area">${body(r)}</div></div>`;
  }
  const okBtn = (act, dis) => `<button class="okb" id="okb" data-act="${act}" ${dis ? 'disabled' : ''} aria-label="${t('done')}">${IC.check}</button>`;
  const palette = () => `<div class="palette">${Object.values(V.colors).map(c => c.hex).concat(['#ffffff']).map((h, i) => `<button class="pal ${i === 0 ? 'on' : ''}" data-act="pal" data-c="${h}" style="background:${h}" aria-label="${h}"></button>`).join('')}</div>`;
  function body(r) {
    if (r.type === 'choose') return `${r.show ? `<div class="show">${r.show}</div>` : ''}<div class="tiles t${r.choices.length}">${r.choices.map((c, i) => `<button class="tile" data-act="pick" data-i="${i}">${c.h}</button>`).join('')}</div>`;
    if (r.type === 'drag') {
      const slots = r.scene ? `<div class="dz scene">${r.slots.map(s => `<div class="slot pos" data-key="${s.key}" style="${s.pos}">${s.h}</div>`).join('')}</div>`
        : `<div class="dz">${r.slots.map(s => s.zone ? `<div class="slot zone ${r.z3 ? 'z3' : ''}" data-key="${s.key}"><div class="zl">${s.h}</div><div class="in"></div></div>` : `<div class="slot" data-key="${s.key}">${s.h}</div>`).join('')}</div>`;
      return slots + `<div class="tray">${r.items.map(i => `<div class="drag" role="button" tabindex="0" data-to="${i.to}" data-id="${i.id}">${i.h}</div>`).join('')}</div>`;
    }
    if (r.type === 'fill') return `<div class="cnt" id="cnt">0</div><div class="basket"><div class="bk">${dr('basket')}</div><div class="in" id="bin"></div></div><div class="pool" id="pool"></div>${okBtn('fillok')}`;
    if (r.type === 'swap') return `<div class="puz" id="puz"></div>`;
    if (r.type === 'memory') {
      const deck = shuffle(r.pairs.concat(r.pairs)); G.deck = deck; G.up = []; G.found = 0; G.mm = 0;
      return `<div class="mem ${deck.length > 6 ? 'c4' : ''}">${deck.map((k, i) => `<button class="card2" data-act="flip" data-i="${i}" aria-label="${i + 1}"><i class="back">?</i><i class="front">${r.kind === 'flag' ? Art.flag(V.countries[k].flag) : dr(k)}</i></button>`).join('')}</div>`;
    }
    if (r.type === 'trace') return `<div class="tracebox"><canvas id="tc" class="tc" role="img" aria-label="${esc(r.ask.text)}"></canvas></div><div class="tools"><button class="ib" data-act="tclear" aria-label="${t('p.none')}">${IC.erase}</button><button class="ib main" style="background:var(--leaf);color:#fff" data-act="tdone" aria-label="${t('done')}">${IC.check}</button></div>`;
    if (r.type === 'color') { G.fills = {}; G.col = '#e8453c'; return `<div class="tbox">${Art.template(r.tpl, {}, false)}</div>${palette()}${okBtn('adone', true)}`; }
    if (r.type === 'free') { G.col = '#e8453c'; G.strokes = 0; return `<div class="tracebox"><canvas id="tc" class="tc" role="img" aria-label="${esc(r.ask.text)}"></canvas></div>${palette()}<div class="tools"><button class="ib" data-act="fclear" aria-label="${t('p.none')}">${IC.erase}</button></div>${okBtn('adone', true)}`; }
    if (r.type === 'xylo' || r.type === 'melody') {
      G.taps = 0; const nn = NOTES();
      return `<div class="xylo">${L.notes.map((n, i) => `<button class="bar" data-note="${i}" style="background:${n.c};height:${r.type === 'melody' ? 200 : 110 + i * 20}px" aria-label="${nn[i]}">${nn[i]}</button>`).join('')}</div>${r.type === 'xylo' ? okBtn('adone', true) : ''}`;
    }
    if (r.type === 'drum') { G.taps = 0; return `<button class="djembe" id="dj" aria-label="${esc(r.ask.text)}">${dr('drum')}</button>${okBtn('adone', true)}`; }
    if (r.type === 'story') {
      const s = r.story, pg = s.pages[G.pg || 0], last = (G.pg || 0) === s.pages.length - 1;
      const sc = s.tale ? Art.storyScene(pg.scene, pg.chars) : `<div class="emj" aria-hidden="true">${pg.img}</div>`;
      return Home.book(homeCtx(), { scene: sc, title: Games.gameName(G.cd, G.gd), page: G.pg || 0, pages: s.pages.length,
        text: `<div class="stext" lang="${s.code}">${pg.text}${last && s.origin ? `<div class="origin">${s.origin}</div>` : ''}</div>`,
        tools: `<div class="tools"><button class="ib" data-act="spg" data-d="-1" aria-label="${t('back')}">${IC.back}</button><button class="ib" data-act="sread" aria-label="${t('play')}">${IC.speaker}</button><button class="ib" data-act="sstop" aria-label="${t('story.pause')}">❚❚</button><button class="ib" style="background:var(--leaf);color:#fff" data-act="spg" data-d="1" aria-label="${last ? t('done') : t('next')}">${last ? IC.check : IC.play}</button></div>` });
    }
    return '';
  }
  const storyLine = (s, i) => ({ id: s.code + ':story.' + s.id + '.p' + i, text: s.pages[i].text, lang: s.speech });
  function afterPlay() {
    const r = cur(), first = G.fresh; G.fresh = false;
    if (r.type === 'story') { if (first || G.pgChanged) { G.pgChanged = false; setTimeout(() => say(storyLine(r.story, G.pg || 0)), 300); } }
    else if (first) setTimeout(() => say(r.ask), 350);
    if (r.type === 'fill') { G.put = new Set(); paintFill(); }
    if (r.type === 'swap') initSwap();
    if (r.type === 'trace' || r.type === 'free') initCanvas(r.type);
    if (r.type === 'melody' && first) setTimeout(playMelody, 2200);
    armNudge();
  }
  // Coup de pouce : si l'enfant ne touche rien pendant 12 s, la consigne se répète et le haut-parleur pulse.
  function armNudge() {
    clearTimeout(nudgeT);
    if (S.screen !== 'play' || !G || ['story', 'free', 'xylo', 'drum', 'color'].includes(cur().type)) return;
    let n = 0; const tick = () => { if (S.screen !== 'play' || modalOpen()) return; const a = document.getElementById('ask'); if (a) { a.classList.add('pulse'); setTimeout(() => a.classList.remove('pulse'), 2500); } say(cur().ask); if (++n < 2) nudgeT = setTimeout(tick, 12000); };
    nudgeT = setTimeout(tick, 12000);
  }
  const hooks = {
    cat() { setTimeout(() => { if (S.screen === 'cat') say(line('chooseGame')); }, 300); },
    play() { afterPlay(); },
    result() { Sound.good(); confetti(); setTimeout(() => say(line(G.stars === 3 ? 'win3' : 'win')), 500); },
    moto() {
      const token = S, got = document.getElementById('mgot'), g = garage(), m = L.missions.find(x => x.id === S.p.m) || L.missions[0];
      MH = Mini.moto({ canvas: document.getElementById('cv'), calm: Store.s().calm, alive: () => S === token, mission: m, vehicle: g.vehicle, pilot: g.pilot, obstacles: L.obstacles,
        onCollect: n => { got.textContent = n; Sound.tap(); }, onBump: () => Sound.soft(), onWin: () => miniDone('moto', m.id) });
    },
    course() { const token = S; Mini.course({ runners: ['r0', 'r1', 'r2'].map(id => document.getElementById(id)), bar: document.getElementById('cbar'), btn: document.getElementById('ctap'), alive: () => S === token, onTap: () => Sound.tap(), onWin: () => miniDone('course') }); },
    lock() { setTimeout(() => say(line('p.locked')), 300); },
    gate() {
      const b = document.getElementById('hold'); if (!b) return;
      let t0 = 0, iv;
      const stop = () => { clearInterval(iv); t0 = 0; const e = document.getElementById('holdp'); if (e) e.style.setProperty('--p', '0%'); };
      const begin = e => { e.preventDefault(); if (t0) return; t0 = Date.now(); iv = setInterval(() => { const r = (Date.now() - t0) / Rules.GATE.holdMs, e2 = document.getElementById('holdp'); if (e2) e2.style.setProperty('--p', Math.min(100, r * 100) + '%'); if (r >= 1) { clearInterval(iv); G_.step = 2; render(); } }, 50); };
      b.addEventListener('pointerdown', begin); b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') begin(e); });   // accessible au clavier
      ['pointerup', 'pointerleave', 'pointercancel', 'keyup'].forEach(ev => b.addEventListener(ev, stop));
    }
  };

  // ---- avancer / terminer ----
  function roundDone() { const tk = G, ix = G.idx; setTimeout(() => { if (!G || G !== tk || G.idx !== ix || S.screen !== 'play') return; if (G.idx + 1 < G.rounds.length) { G.idx++; G.fresh = true; G.pg = 0; render(); } else finish(); }, 900); }
  function finish() {
    const tt = G.err + G.hints, stars = G.free ? 3 : tt === 0 ? 3 : tt <= 2 ? 2 : 1;
    const rec = Store.record('g:' + G.cat + ':' + G.gid, stars, G.err, G.hints), p = P();
    Skills.update(p, G.cat, G.gid, stars);   // compétences : suivi pédagogique, séparé des récompenses
    G.stars = stars; G.newReward = null;
    if (rec.first) { const n = p.rewards.filter(r => r.type === 'draw').length; if (n < COLLECT.length) { G.newReward = COLLECT[n]; Store.addReward('draw', COLLECT[n]); } }
    if (G.cat === 'stories' && !p.storiesRead.includes(G.gid)) p.storiesRead.push(G.gid);
    p.recre = (p.recre || 0) + 1; Store.save(); G.recre = Store.s().minis && p.recre % 3 === 0;
    go('result');
  }
  function wrongMsg() { Sound.soft(); const l = I18n.pickLine('tryAgain'); toast(l.text, false); say(l); }
  const praise = () => { const l = I18n.pickLine('praise'); toast(l.text, true); say(l); };

  function pickTile(el) {
    const r = cur(); if (r.locked) return;
    const c = r.choices[+el.dataset.i];
    if (c.ok) { r.locked = true; el.classList.add('good'); Sound.good(); const l = I18n.pickLine('praise'); toast(l.text, true); say(c.say || l); roundDone(); }
    else {
      G.err++; r.wrong = (r.wrong || 0) + 1; el.classList.add('bad'); wrongMsg(); armNudge();
      if (r.wrong === 2) { G.hints++; const i = r.choices.findIndex(x => x.ok), tl = document.querySelector(`.tile[data-i="${i}"]`); if (tl) tl.classList.add('hint'); }
    }
  }

  // ---- glisser-déposer (le doigt déplace, ou on touche l'objet puis la place ; clavier : Entrée) ----
  function slotAt(x, y) { return document.elementsFromPoint(x, y).find(n => n.classList && n.classList.contains('slot')); }
  function drop(el, slot) {
    if (!slot || !el || slot.classList.contains('ok')) return;
    G.sel = null; document.querySelectorAll('.drag.sel').forEach(d => d.classList.remove('sel')); document.querySelectorAll('.hint').forEach(h => h.classList.remove('hint'));
    const r = cur();
    if (el.dataset.to === slot.dataset.key) {
      Sound.good(); el.classList.add('placed');
      const item = r.items.find(i => i.id === el.dataset.id), sd = r.slots.find(s => s.key === slot.dataset.key);
      if (slot.classList.contains('pos')) { slot.innerHTML = sd.full; slot.classList.add('ok'); }
      else if (slot.classList.contains('zone')) { const d = document.createElement('div'); d.innerHTML = item.h; slot.querySelector('.in').appendChild(d); }
      else { slot.classList.add('ok'); if (/^<svg/.test(item.h)) slot.innerHTML = item.h; else slot.insertAdjacentHTML('beforeend', `<b style="position:absolute;right:6px;bottom:2px;font-size:1.8rem;color:var(--b)">${item.id}</b>`); }
      if (!document.querySelector('.drag:not(.placed)')) { praise(); roundDone(); }
    } else {
      G.err++; el.dataset.w = (+el.dataset.w || 0) + 1; Sound.soft(); slot.style.animation = 'shake .4s'; setTimeout(() => { slot.style.animation = ''; }, 420); say(I18n.pickLine('tryAgain'));
      if (+el.dataset.w === 2) { G.hints++; const s = document.querySelector(`.slot[data-key="${el.dataset.to}"]`); if (s) s.classList.add('hint'); el.classList.add('hint'); }
    }
  }
  $app.addEventListener('pointerdown', e => {
    lastTouch = Date.now();
    const el = e.target.closest('.drag'); if (!el || el.classList.contains('ghost') || el.classList.contains('placed')) return;
    e.preventDefault();
    const r = el.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top, sx = e.clientX, sy = e.clientY;
    const g = el.cloneNode(true); g.classList.add('ghost'); g.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    document.body.appendChild(g); el.classList.add('lift'); let moved = false, over = null;
    const mv = ev => { if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 8) moved = true; g.style.left = (ev.clientX - ox) + 'px'; g.style.top = (ev.clientY - oy) + 'px'; const s = slotAt(ev.clientX, ev.clientY); if (over && over !== s) over.classList.remove('over'); over = s; if (s) s.classList.add('over'); };
    const up = ev => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      g.remove(); el.classList.remove('lift'); if (over) over.classList.remove('over');
      if (!moved) { document.querySelectorAll('.drag.sel').forEach(d => d.classList.remove('sel')); G.sel = el; el.classList.add('sel'); Sound.tap(); } else drop(el, slotAt(ev.clientX, ev.clientY));
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  });
  $app.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const d = e.target.closest && e.target.closest('.drag'); if (d && !d.classList.contains('placed')) { e.preventDefault(); document.querySelectorAll('.drag.sel').forEach(x => x.classList.remove('sel')); G.sel = d; d.classList.add('sel'); }
    else { const sl = e.target.closest && e.target.closest('.slot'); if (sl && G && G.sel) { e.preventDefault(); drop(G.sel, sl); } }
  });

  // ---- panier ----
  function paintFill() {
    const r = cur(), pool = document.getElementById('pool'), bin = document.getElementById('bin'); if (!pool) return;
    const mk = i => `<button class="mc" data-act="put" data-i="${i}" aria-label="${I18n.t('mg.one')}">${dr('mango')}</button>`;
    pool.innerHTML = Array.from({ length: r.n + 2 }, (_, i) => i).filter(i => !G.put.has(i)).map(mk).join('');
    bin.innerHTML = [...G.put].map(mk).join(''); document.getElementById('cnt').textContent = G.put.size;
  }
  // ---- puzzle ----
  function initSwap() { let o; do { o = shuffle([0, 1, 2, 3]); } while (o.every((v, i) => v === i)); G.order = o; G.swSel = null; paintSwap(); }
  function paintSwap() {
    const r = cur(), el = document.getElementById('puz'); if (!el) return;
    el.innerHTML = G.order.map((pc, i) => `<button data-act="sw" data-i="${i}" class="${G.swSel === i ? 'sel' : ''}" aria-label="${i + 1}"><svg viewBox="${(pc % 2) * 50} ${Math.floor(pc / 2) * 50} 50 50" aria-hidden="true"><rect width="100" height="100" fill="#eaf4fb"/>${Draw.inner(r.key)}</svg></button>`).join('');
  }
  // ---- mémoire ----
  function flip(el) {
    const i = +el.dataset.i; if (G.lock || G.up.includes(i) || el.classList.contains('done')) return;
    el.classList.add('up'); G.up.push(i); Sound.tap();
    if (G.up.length === 2) {
      const [a, b] = G.up, ea = document.querySelector(`.card2[data-i="${a}"]`), eb = el;
      if (G.deck[a] === G.deck[b]) { ea.classList.add('done'); eb.classList.add('done'); G.up = []; G.found++; Sound.good(); if (G.found === cur().pairs.length) { praise(); roundDone(); } }
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
    const stc = document.createElement('canvas'); stc.width = W; stc.height = H;
    const sc = stc.getContext('2d'); sc.lineCap = 'round'; sc.lineJoin = 'round';
    const trace = type === 'trace'; sc.lineWidth = trace ? Math.max(26, H * 0.1) : 12; sc.strokeStyle = trace ? '#7a9a2e' : G.col;
    let mask = null, font, cy;
    if (trace) {
      font = `800 ${Math.round(H * 0.84)}px "Arial Rounded MT Bold","Trebuchet MS",Arial,sans-serif`; cy = H / 2 + H * 0.05;
      const mk = document.createElement('canvas'); mk.width = W; mk.height = H; const mc = mk.getContext('2d'); mc.font = font; mc.textAlign = 'center'; mc.textBaseline = 'middle'; mc.fillStyle = '#000'; mc.fillText(r.glyph, W / 2, cy); mask = mc.getImageData(0, 0, W, H).data;
    }
    const paint = () => { ctx.clearRect(0, 0, W, H); if (trace) { ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#efe6c8'; ctx.fillText(r.glyph, W / 2, cy); ctx.setLineDash([10, 12]); ctx.lineWidth = 4; ctx.strokeStyle = '#b9a56a'; ctx.strokeText(r.glyph, W / 2, cy); ctx.setLineDash([]); } ctx.drawImage(stc, 0, 0, W, H); };
    TR = { W, H, mask, st: stc, sc, paint, last: null, type }; paint();
    const pt = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * (W / b.width), (e.clientY - b.top) * (H / b.height)]; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); TR.last = pt(e); if (!trace) sc.strokeStyle = G.col; sc.beginPath(); sc.moveTo(...TR.last); sc.lineTo(TR.last[0] + 0.1, TR.last[1]); sc.stroke(); paint(); armNudge(); });
    cv.addEventListener('pointermove', e => { if (!TR.last) return; const p = pt(e); sc.beginPath(); sc.moveTo(...TR.last); sc.lineTo(...p); sc.stroke(); TR.last = p; paint(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => cv.addEventListener(ev, () => { if (TR.last && !trace) { G.strokes++; const b = document.getElementById('okb'); if (b && G.strokes >= 2) b.disabled = false; } TR.last = null; }));
  }
  function traceCheck() {
    const { W, H, mask, st } = TR, sd = st.getContext('2d').getImageData(0, 0, W, H).data; let body = 0, cov = 0, ink = 0;
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
    const r = cur(); if (!r) return; Sound.note(L.notes[i].f); flashBar(i);
    if (r.type === 'xylo') { G.taps++; if (G.taps >= 8) { const b = document.getElementById('okb'); if (b) b.disabled = false; } }
    if (r.type === 'melody' && r.seq && !r.listen && !r.locked) {
      if (i === r.seq[r.pos]) { r.pos++; if (r.pos >= r.seq.length) { r.locked = true; praise(); roundDone(); } }
      else { G.err++; r.pos = 0; wrongMsg(); setTimeout(() => { if (cur() === r) r.seq.forEach((n, k) => setTimeout(() => { Sound.note(L.notes[n].f); flashBar(n); }, 600 * k)); }, 900); }
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
    Sound.good(); confetti(); setTimeout(() => say(line('bravoWin')), 400);
    showModal(`<div class="dlg"><div style="width:120px;height:120px;margin:0 auto">${dr('lion')}</div><h1>${t('bravoWin')}</h1><div class="btns">
      <button style="background:var(--coral)" ${mid ? `data-act="mission" data-m="${mid}"` : 'data-act="go" data-to="course"'} aria-label="${t('replay')}">${IC.replay}</button>
      <button style="background:var(--turq)" data-act="go" data-to="home" aria-label="${t('tab.home')}">${IC.home}</button></div></div>`);
  }

  // ================= ESPACE PARENT =================
  const sw = (k, label) => `<div class="row"><span>${label}</span><button class="sw ${Store.s()[k] ? 'on' : ''}" data-act="tog" data-k="${k}" role="switch" aria-checked="${!!Store.s()[k]}" aria-label="${label}"></button></div>`;
  const sel = (k, opts, cur_, label) => `<div class="row"><span>${label}</span><select data-chg="${k}" aria-label="${label}">${opts.map(([v, l]) => `<option value="${v}" ${String(cur_) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
  function parentHTML() {
    const s = Store.s(), p = P(), pt = p.playTime || {}, days = Object.keys(pt).sort().slice(-7).reverse(), mins = x => t('p.min', { n: Math.round(x / 60) });
    const profs = Store.profiles().map((x, i) => `<div class="prof ${x.id === p.id ? 'on' : ''}"><div class="pav">${Art.child(avatarOf(x.avatar))}</div>
      <div class="pf"><input type="text" value="${esc(x.name)}" maxlength="20" placeholder="${t('p.name')}" data-chg="rename" data-id="${x.id}" aria-label="${t('p.name')}">
      <select data-chg="age" data-id="${x.id}" aria-label="${t('p.age')}">${[3, 4, 5].map(a => `<option value="${a}" ${x.age === a ? 'selected' : ''}>${t('p.years', { n: a })}</option>`).join('')}</select></div>
      <div class="pb2">${x.id === p.id ? `<span class="tag">${t('p.active')}</span>` : `<button class="btn" data-act="switch" data-id="${x.id}">${IC.check}</button>`}<button class="btn warn" data-act="delprof" data-id="${x.id}" aria-label="${t('p.delete')}">${IC.close}</button></div></div>`).join('');
    const skills = Skills.summary(p).map(k => `<div class="bline"><span style="width:150px;font-size:.85rem">${t('skill.' + k.id)}${k.plays ? `<br><small>${t('sk.stats', { n: k.plays, d: k.days || 1 })}</small>` : ''}</span><div class="pbx"><i style="width:${Math.round(k.score * 100)}%"></i></div><span class="lv l${k.level}">${t('skill.level.' + k.level)}</span></div>`).join('');
    const adv = Skills.advice(p, p.age, CATS).map(a => { const sk = t('skill.' + a.skill), cg = a.game && cat(a.game[0]), gm = cg ? Games.gameName(cg, cg.games.find(g => g.id === a.game[1])) : '';
      return `<p class="adv">${a.kind === 'ready' ? t('adv.ready', { skill: sk }) + (a.game ? t('adv.ready.next', { game: gm }) : t('adv.ready.keep')) : t('adv.' + a.kind, { skill: sk, game: gm })}</p>`; }).join('') || `<p>${t('adv.none')}</p>`;
    const ls = [0, 10, 15, 20, 30].map(m => [m, m ? t('p.min', { n: m }) : t('p.none')]), lk = [0, 20, 30, 45, 60, 90].map(m => [m, m ? t('p.min', { n: m }) : t('p.none')]);
    const fm = Sound.voices();
    const tab = ['follow', 'limits', 'content', 'settings'].includes(S.p.tab) ? S.p.tab : 'follow';
    const secs = {
      follow: `
      <div class="sec"><h2>${t('adv.title')}</h2>${adv}</div>
      <div class="sec"><h2>${t('p.skills')} — ${esc(p.name || '')}</h2>${skills}<p class="note">${t('p.skillsHelp')}</p></div>
      <div class="sec"><h2>${t('p.progress')}</h2>${CATS.map(c => { const done = c.games.filter(g => starsOf(c.id, g.id) > 0).length; return `<div class="bline"><span>${Games.label(c)}</span><div class="pbx"><i style="width:${Math.round(catStars(c) / (c.games.length * 3) * 100)}%"></i></div><span style="width:44px;text-align:right">${done}/${c.games.length}</span></div>`; }).join('')}
        <div class="row"><span>${t('p.hints')}</span><b>${Object.values(p.progress).reduce((a, x) => a + (x.hints || 0), 0)}</b></div><div class="row"><span>${t('p.recres')}</span><b>${p.minis ? Object.values(p.minis).reduce((a, b) => a + b, 0) : 0}</b></div></div>`,
      limits: `
      <div class="sec"><h2>${t('p.time')}</h2><div class="row"><span>${t('p.today')}</span><b>${mins(Store.playedToday())}</b></div>${days.map(d => `<div class="row"><span>${d}</span><span>${mins(pt[d])}</span></div>`).join('')}${sel('breakMin', ls, s.breakMin, t('p.break'))}${sel('lockMin', lk, s.lockMin, t('p.lock'))}</div>`,
      content: `
      <div class="sec"><h2>${t('p.profiles')}</h2>${profs}<button class="btn sun" data-act="addprof">＋ ${t('p.addProfile')}</button></div>
      <div class="sec"><h2>${t('p.myvoice')}</h2><p style="margin:0 0 6px">${t('p.myvoiceHelp')}</p>${sw('rec', t('p.rec'))}<div class="row"><span>${t('p.clips')}</span><b>${Sound.clipCount()}</b></div><button class="btn warn" data-act="clearclips">${t('p.clearClips')}</button></div>`,
      settings: `
      <div class="sec"><h2>${t('p.settings')}</h2>${sel('lang', I18n.LANGS.map(l => [l.code, l.label]), s.lang, t('p.language'))}<div class="row soon"><span>Bamanankan</span><em>${t('lang.soon')}</em></div><div class="row soon"><span>Español</span><em>${t('lang.soon')}</em></div>${sw('voice', t('p.voice'))}
        <div class="row"><span>${t('p.voiceFr')}</span><span style="text-align:right;font-size:.85rem">${Sound.voiceName() ? '✔ ' + esc(Sound.voiceName()) : Sound.missing() ? '⚠ ' + t('p.voiceMissing', { lang: I18n.speech() }) : '—'}</span></div>
        ${fm.length ? sel('vname', [['', t('p.voiceAuto')]].concat(fm.map(n => [n, n])), s.vname, t('p.voiceChoose')) : ''}
        <div class="row"><span>${t('p.rate')}</span><input type="range" min="0.5" max="1.1" step="0.05" value="${s.rate}" data-inp="rate" aria-label="${t('p.rate')}"></div>
        <div class="row"><span>${t('p.pitch')}</span><input type="range" min="0.6" max="1.3" step="0.05" value="${s.pitch}" data-inp="pitch" aria-label="${t('p.pitch')}"></div>
        <div class="row"><span>${t('p.volume')}</span><input type="range" min="0" max="1" step="0.1" value="${s.volume}" data-inp="volume" aria-label="${t('p.volume')}"></div>
        <button class="btn" data-act="testvoice">${t('p.testVoice')}</button><button class="btn sun" data-act="howinstall">${t('p.install')}</button>${sw('sfx', t('p.sfx'))}
        ${sel('textScale', [[1, '100 %'], [1.25, '125 %'], [1.5, '150 %']], s.textScale, t('p.textSize'))}${sw('big', t('p.bigButtons'))}${sw('calm', t('p.calm'))}${sw('contrast', t('p.contrast'))}${sw('minis', t('p.minis'))}</div>
      <div class="sec"><h2>${t('p.data')}</h2><p style="margin:0">${t('p.dataText')}</p><button class="btn" data-act="export">${t('p.export')}</button><button class="btn sun" data-act="import">${t('p.import')}</button><button class="btn warn" data-act="wipe">${t('p.wipe')}</button>
        <input type="file" id="imp" accept="application/json,.json" hidden></div>`
    };
    return `<div class="pagehead parenthead"><button class="ib" data-act="go" data-to="home" aria-label="${t('back')}">${IC.back}</button><h1>${t('p.title')}</h1></div>
      <div class="ptabs" role="tablist">${[['follow', 'pt.follow'], ['limits', 'pt.limits'], ['content', 'pt.content'], ['settings', 'pt.settings']].map(([id, k]) => `<button class="ptab ${tab === id ? 'on' : ''}" role="tab" aria-selected="${tab === id}" data-act="ptab" data-tab="${id}">${t(k)}</button>`).join('')}</div>${secs[tab]}`;
  }
  function confirmBox(msg, yes) {
    window._lumiYes = yes;
    showModal(`<div class="dlg"><h1 style="font-size:1.2rem">${esc(msg)}</h1><div class="btns"><button style="background:var(--coral)" data-act="yes" aria-label="${t('yes')}">${IC.check}</button><button style="background:var(--leaf)" data-act="stay" aria-label="${t('no')}">${IC.close}</button></div></div>`);
  }
  function addProfileForm() {
    let av = 'awa'; window._lumiAv = av;
    showModal(`<div class="dlg" style="text-align:left"><h1>${t('p.addProfile')}</h1>
      <input type="text" id="np" maxlength="20" placeholder="${t('p.name')}" aria-label="${t('p.name')}" style="width:100%;font:inherit;padding:10px;border-radius:12px;border:2px solid #d9ceaa">
      <div class="avs">${L.avatars.map(a => `<button class="avb ${a.id === 'awa' ? 'on' : ''}" data-act="pickav" data-a="${a.id}" aria-label="${a.id}">${Art.child(a)}</button>`).join('')}</div>
      <select id="na" aria-label="${t('p.age')}" style="width:100%;font:inherit;padding:10px;border-radius:12px;border:2px solid #d9ceaa">${[3, 4, 5].map(a => `<option value="${a}" ${a === 4 ? 'selected' : ''}>${t('p.years', { n: a })}</option>`).join('')}</select>
      <div class="btns"><button style="background:var(--leaf)" data-act="saveprof" aria-label="${t('done')}">${IC.check}</button><button style="background:var(--coral)" data-act="stay" aria-label="${t('close')}">${IC.close}</button></div></div>`);
  }
  function profilesModal() {
    const ps = Store.profiles();
    showModal(`<div class="dlg"><div class="avs big">${ps.map(x => `<button class="avb ${x.id === P().id ? 'on' : ''}" data-act="switch" data-id="${x.id}" aria-label="${esc(x.name || t('p.profiles'))}">${Home.avatar({ art: Art }, avatarOf(x.avatar))}<small>${esc(x.name || '')}</small></button>`).join('')}</div>
      <div class="btns"><button style="background:var(--coral)" data-act="stay" aria-label="${t('close')}">${IC.close}</button></div></div>`);
  }
  let importText = '';
  function importChoice() {
    showModal(`<div class="dlg"><h1 style="font-size:1.2rem">${t('p.import')}</h1><div class="btns" style="flex-direction:column"><button style="background:var(--leaf);padding:12px" data-act="doimport" data-mode="merge">${t('p.importMerge')}</button><button style="background:var(--coral);padding:12px" data-act="doimport" data-mode="replace">${t('p.importReplace')}</button><button style="background:#8a7c52;padding:12px" data-act="stay">${t('close')}</button></div></div>`);
  }
  function afterDataChange() { I18n.setLang(Store.s().lang); applyPrefs(); Sound.refresh(); Store.profiles().forEach(p => { if (!Object.keys(p.skills || {}).length) Skills.rebuild(p); }); Store.ensureProfile(); Store.save(); }

  // Effacement total : on affiche le résultat RÉEL de chaque étape. « Tout a été effacé » seulement si tout l'est vraiment ; sinon, ce qui reste + « Recommencer ».
  async function runWipe() {
    const r = await Store.wipeAll(), lab = s => (s.name === 'localStorage' ? t('wipe.localStorage') : /voix/.test(s.name) ? t('wipe.voices') : t('wipe.effaceur'));
    if (r.ok) { showModal(`<div class="dlg"><h1 style="font-size:1.2rem">${t('p.wipeOk')}</h1><div class="btns"><button style="background:var(--leaf)" data-act="reload" aria-label="${t('inst.ok')}">${IC.check}</button></div></div>`); return; }
    showModal(`<div class="dlg" style="text-align:left"><h1 style="font-size:1.1rem">${r.partial ? t('p.wipePartial') : t('p.wipeFailed')}</h1>
      <ul style="padding-left:18px">${r.steps.map(s => `<li>${s.ok ? '✔' : '✘'} ${esc(lab(s))}${s.ok ? '' : ' — ' + esc(s.why || s.state || '')}</li>`).join('')}</ul>
      <div class="btns"><button style="background:var(--coral);padding:0 16px" data-act="retrywipe">${t('p.wipeRetry')}</button><button style="background:#8a7c52" data-act="stay" aria-label="${t('close')}">${IC.close}</button></div></div>`);
  }

  // ================= ACTIONS =================
  const actions = {
    go: el => { hideModal(); if (el.dataset.to === 'gate') openGate('parent'); else go(el.dataset.to); },
    cat: el => go('cat', { id: el.dataset.id }),
    grp: el => go('grp', { id: el.dataset.id }),
    dmission() { if (checkLock()) return; const mi = missionInfo(); if (mi) startGame(mi.cat, mi.game, { letter: mi.letter }); },
    game: el => { hideModal(); startGame(el.dataset.c, el.dataset.g); },
    auto() { const tgt = Rules.nextGame(CATS, P().age, starsOf); startGame(tgt[0], tgt[1]); },   // le filtre d'âge reste actif même quand tout est terminé
    say() { const r = cur(); if (!r) return; if (r.type === 'story') say(storyLine(r.story, G.pg || 0)); else { say(r.ask); if (r.type === 'melody') playMelody(); armNudge(); } },
    leave() { if (G && G.idx > 0) confirmBox(t('quit'), () => { hideModal(); go('cat', { id: G.cat }); }); else go('cat', { id: G.cat }); },
    yes() { const f = window._lumiYes; window._lumiYes = null; hideModal(); if (f) f(); },
    stay() { hideModal(); if (limitState().breakDue) { sinceBreak = 0; } },
    pick: pickTile,
    put(el) { const i = +el.dataset.i; if (G.put.has(i)) G.put.delete(i); else G.put.add(i); Sound.tap(); paintFill(); },
    fillok() {
      const r = cur();
      if (G.put.size === r.n) { praise(); Sound.good(); say(line('say.count', { m: mg(r.n), n: r.n })); document.getElementById('okb').disabled = true; roundDone(); }
      else { G.err++; wrongMsg(); say(G.put.size > r.n ? line('fill.many') : line('fill.few', { n: G.put.size })); }
    },
    sw(el) {
      const i = +el.dataset.i;
      if (G.swSel === null) { G.swSel = i; Sound.tap(); } else { const j = G.swSel; G.swSel = null; if (j !== i) { [G.order[i], G.order[j]] = [G.order[j], G.order[i]]; Sound.tap(); } }
      paintSwap(); if (G.order.every((v, k) => v === k)) { Sound.good(); praise(); roundDone(); }
    },
    flip,
    tclear() { if (TR) { TR.sc.clearRect(0, 0, TR.W, TR.H); TR.paint(); } },
    tdone() { const k = traceCheck(); if (k.cov >= 0.5 && k.ratio <= 3.6) { Sound.good(); praise(); roundDone(); } else { G.err++; wrongMsg(); say(line(k.ratio > 3.6 ? 'trace.erase' : 'trace.follow')); } },
    fclear() { if (TR) { TR.sc.clearRect(0, 0, TR.W, TR.H); TR.paint(); } },
    pal(el) { G.col = el.dataset.c; document.querySelectorAll('.pal').forEach(p => p.classList.toggle('on', p === el)); if (TR && TR.type === 'free') TR.sc.strokeStyle = G.col; Sound.tap(); },
    reg(el) { el.setAttribute('fill', G.col); G.fills[el.dataset.r] = G.col; Sound.tap(); const n = Object.keys(G.fills).length, b = document.getElementById('okb'); if (b && n >= 3) b.disabled = false; },
    adone() { Sound.good(); roundDone(); },
    spg(el) {
      const r = cur(), n = r.story.pages.length, d = +el.dataset.d, pg = (G.pg || 0) + d;
      if (pg < 0) return; if (pg >= n) { Sound.good(); finish(); return; }
      G.pg = pg; G.pgChanged = true; Sound.tap(); render(); const pb = document.querySelector('.pbar i'); if (pb) pb.style.width = Math.round(pg / n * 100) + '%';
    },
    sread() { const r = cur(); say(storyLine(r.story, G.pg || 0)); },
    mission: el => { hideModal(); if (checkLock()) return; go('moto', { m: el.dataset.m }); },
    mleft() { if (MH) MH.left(); }, mright() { if (MH) MH.right(); },
    pickg(el) { const v = (el.dataset.k === 'vehicle' ? L.vehicles : L.pilots).find(x => x.e === el.dataset.e); if (totalStars() < v.need) { toast('★ ' + v.need, false); return; } P().garage = Object.assign(garage(), { [el.dataset.k]: v.e }); Store.save(); render(); },
    // -- profils --
    begin() { go('home'); },
    profiles() { go('profiles'); },
    ptab: el => { S.p.tab = el.dataset.tab; render(); },
    sstop() { Sound.stop(); },
    switch(el) { Store.setActive(el.dataset.id); sinceBreak = 0; hideModal(); if (!checkLock()) render(); },
    addprof() { addProfileForm(); },
    pickav(el) { window._lumiAv = el.dataset.a; document.querySelectorAll('.avb').forEach(b => b.classList.toggle('on', b === el)); },
    saveprof() { const n = document.getElementById('np').value, a = document.getElementById('na').value; const np = Store.createProfile(n, window._lumiAv || 'awa', a); hideModal(); if (!np) showNotice(t('p.maxProfiles')); render(); },
    delprof(el) { const id = el.dataset.id; confirmBox(t('p.confirmDelete'), () => { Store.deleteProfile(id); sinceBreak = 0; render(); }); },
    // -- réglages --
    tog(el) { const s = Store.s(); s[el.dataset.k] = !s[el.dataset.k]; Store.save(); applyPrefs(); render(); },
    testvoice() { say(line('hello')); },
    howinstall() { LumiInstall.open(); }, doinstall() { hideModal(); LumiInstall.ask(); },
    clearclips() { confirmBox(t('p.clearClips') + ' ?', async () => { const r = await Sound.clearClips(); showNotice(r.ok ? t('p.clipsOk') : r.state === 'blocked' ? t('p.clipsBlocked') : t('p.clipsError', { why: r.why })); render(); }); },
    reload() { location.reload(); },
    key(el) { gateKey(el.dataset.k); },
    unlock() { openGate('unlock'); },
    // -- données --
    export() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Store.exportJSON()], { type: 'application/json' })); a.download = 'lumi-donnees.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); },
    import() { const f = document.getElementById('imp'); if (f) { f.value = ''; f.click(); } },
    doimport(el) {
      hideModal(); const r = Store.importData(importText, el.dataset.mode); importText = '';
      if (r.ok) { afterDataChange(); showNotice(t('p.importOk', { n: r.n })); render(); } else showNotice(t('p.importBad', { why: r.why }));
    },
    wipe() { confirmBox(t('p.wipeConfirm'), () => runWipe()); },
    retrywipe() { hideModal(); runWipe(); }
  };
  const onAct = e => {
    lastTouch = Date.now();
    const el = e.target.closest('[data-act]');
    if (el && actions[el.dataset.act]) { actions[el.dataset.act](el, e); return; }
    const sl = e.target.closest('.slot'); if (sl && G && G.sel && S.screen === 'play') drop(G.sel, sl);
  };
  $app.addEventListener('click', onAct); $modal.addEventListener('click', onAct);
  $app.addEventListener('change', e => {
    const k = e.target.dataset.chg, ip = e.target.dataset.inp, s = Store.s();
    if (ip === 'rate' || ip === 'pitch') { Store.save(); say(line('hello')); return; }
    if (!k) {
      if (e.target.id === 'imp' && e.target.files && e.target.files[0]) {   // import : lecture locale, validation stricte avant toute écriture
        const f = e.target.files[0];
        if (f.size > Store.MAX_IMPORT) { showNotice(t('p.importBad', { why: 'fichier trop volumineux' })); return; }
        const rd = new FileReader(); rd.onerror = () => showNotice(t('p.importBad', { why: 'lecture impossible' }));
        rd.onload = () => { const v = Store.validate(String(rd.result)); if (!v.ok) { showNotice(t('p.importBad', { why: v.why })); return; } importText = String(rd.result); importChoice(); };
        rd.readAsText(f);
      }
      return;
    }
    if (k === 'vname') { s.vname = e.target.value; Store.save(); Sound.refresh(); say(line('hello')); }
    if (k === 'rename') { const pp = Store.data().profiles[e.target.dataset.id]; if (pp) { pp.name = e.target.value.trim().slice(0, 20); Store.save(); } }
    if (k === 'age') { const pp = Store.data().profiles[e.target.dataset.id]; if (pp) { pp.age = +e.target.value; Store.save(); } }
    if (k === 'breakMin' || k === 'lockMin') { s[k] = +e.target.value; sinceBreak = 0; Store.save(); }
    if (k === 'textScale') { s.textScale = +e.target.value; Store.save(); applyPrefs(); }
    if (k === 'lang') { s.lang = e.target.value; I18n.setLang(s.lang); Store.save(); Sound.resetNoVoiceWarnings(); Sound.refresh(); applyPrefs(); render(); }
  });
  $app.addEventListener('input', e => {
    const k = e.target.dataset.inp, s = Store.s();
    if (k === 'volume') Sound.setVolume(e.target.value);
    else if (k === 'rate' || k === 'pitch') s[k] = +e.target.value;
  });

  // ---- mode enregistrement : un adulte enregistre sa propre voix, phrase après phrase (gardée sur l'appareil, par identifiant) ----
  const recBox = document.createElement('div'); recBox.className = 'rec'; recBox.hidden = true; document.body.appendChild(recBox);
  let rc = null;
  function paintRec(msg) {
    if (!rc) { recBox.hidden = true; recBox.innerHTML = ''; return; }
    recBox.hidden = false;
    recBox.innerHTML = `<div class="rt">« ${esc(rc.l.text)} »</div><div class="rm">${esc(msg || (rc.blob ? '▶ ✔' : '●'))}<small> ${esc(rc.l.id)}</small></div>
      <div class="rb"><button data-r="rec" class="${rc.mr ? 'live' : ''}">${rc.mr ? '■' : rc.blob ? '● ↺' : '●'}</button>${rc.blob ? '<button data-r="play">▶</button><button data-r="ok" class="ok">✔</button>' : ''}<button data-r="skip">✕</button></div>`;
  }
  function closeRec() { if (rc && rc.stream) rc.stream.getTracks().forEach(x => x.stop()); rc = null; paintRec(); }
  Sound.onNoVoice(lang => showNotice('speechSynthesis' in window ? t('voice.none', { lang }) : t('voice.nosynth')));
  Sound.setOnMiss(l => { if (rc && rc.l.id === l.id) return; closeRec(); rc = { l }; paintRec(); });
  recBox.addEventListener('click', async e => {
    const b = e.target.closest('[data-r]'); if (!b || !rc) return; const a = b.dataset.r;
    if (a === 'skip') closeRec(); else if (a === 'play') Sound.playClip(URL.createObjectURL(rc.blob));
    else if (a === 'ok') { const l = rc.l; Sound.saveClip(l, rc.blob).then(ok => toast(ok ? t('rec.saved') : t('rec.notsaved'), ok)); closeRec(); }
    else if (a === 'rec') {
      if (rc.mr) { rc.mr.stop(); return; }
      try {
        rc.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(rc.stream), chunks = []; rc.mr = mr; rc.blob = null;
        mr.ondataavailable = ev => chunks.push(ev.data);
        mr.onstop = () => { if (!rc) return; rc.blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' }); rc.mr = null; rc.stream.getTracks().forEach(x => x.stop()); paintRec(); };
        mr.start(); paintRec('…');
      } catch (err) { paintRec(t('rec.nomic')); }
    }
  });

  // ---- minuterie : temps de jeu (jour LOCAL), rappel de pause, limite de la journée, fermeture de l'espace parent ----
  setInterval(() => {
    if (document.hidden) return;
    if (S.screen === 'parent' && Date.now() - lastTouch > Rules.GATE.idleMs) { go('home'); return; }
    if (S.screen === 'parent' || S.screen === 'gate' || S.screen === 'lock') return;
    elapsed += 5; sinceBreak += 5; Store.addTime(5);
    const ls = limitState();
    if (ls.lock) { Sound.stop(); hideModal(); go('lock'); }
    else if (ls.breakDue && !modalOpen()) {
      Sound.stop();
      showModal(`<div class="dlg"><div style="width:110px;height:110px;margin:0 auto">${dr('lion')}</div><h1>${t('pause')}</h1><div class="btns"><button style="background:var(--turq)" data-act="go" data-to="home" aria-label="${t('pauseHome')}">${IC.home}</button><button style="background:var(--violet)" data-act="stay" aria-label="${t('pauseKeep')}">${IC.play}</button></div></div>`);
      say(line('pause'));
    }
  }, 5000);
  const chip = document.createElement('div'); chip.className = 'chipoff'; chip.textContent = t('offline'); document.body.appendChild(chip);
  const net = () => { chip.style.display = navigator.onLine ? 'none' : 'block'; chip.textContent = t('offline'); };
  addEventListener('online', net); addEventListener('offline', net); net();

  // ================= INSTALLATION =================
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const bar = document.createElement('div'); bar.className = 'install'; bar.hidden = true; document.body.appendChild(bar);
  let deferred = null, askedOnce = false;
  const dismissed = () => { try { return Date.now() - (+localStorage.getItem(Env.k('installNo')) || 0) < 7 * 864e5; } catch (e) { return false; } };
  const hideBar = remember => { bar.hidden = true; if (remember) try { localStorage.setItem(Env.k('installNo'), Date.now()); } catch (e) {} };
  const ua = navigator.userAgent, isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua) || isIOS;
  function howTo() {
    if (/FBAN|FBAV|Instagram|Line\/|MicroMessenger|; wv\)|TikTok|Snapchat/i.test(ua)) return { name: 'in-app', txt: t('inst.inapp') };
    if (isIOS) return { name: 'Safari', txt: t('inst.ios') };
    if (/SamsungBrowser/i.test(ua)) return { name: 'Samsung Internet', txt: t('inst.samsung') };
    if (/Firefox|FxiOS/i.test(ua)) return { name: 'Firefox', txt: t('inst.firefox') };
    if (/EdgA|EdgiOS|Edg\//i.test(ua)) return { name: 'Edge', txt: t('inst.edge') };
    if (/OPR|Opera/i.test(ua)) return { name: 'Opera', txt: t('inst.opera') };
    return { name: 'Browser', short: t('inst.generic.short'), txt: t('inst.generic') };
  }
  function showBar() {
    if (standalone || dismissed()) return;
    if (deferred) bar.innerHTML = `<span>${t('inst.bar')}</span><button class="go" data-inst="yes">${t('inst.button')}</button><button class="no" data-inst="no" aria-label="${t('close')}">✕</button>`;
    else if (isMobile) bar.innerHTML = `<span>${t('inst.title')} : ${howTo().short || howTo().txt}</span><button class="no" data-inst="no" aria-label="${t('close')}">✕</button>`;
    else return; bar.hidden = false;
  }
  window.LumiInstall = {
    open() { const h = howTo(); showModal(`<div class="dlg"><h1>${t('inst.title')}</h1><p style="text-align:left">${t('inst.detected', { name: h.name })}<br><br>${deferred ? '' : esc(h.txt)}</p><div class="btns">${deferred ? `<button style="background:var(--leaf);padding:0 16px" data-act="doinstall">${t('inst.button')}</button>` : ''}<button style="background:var(--turq)" data-act="stay">${t('inst.ok')}</button></div></div>`); },
    ask: () => askInstall(), howTo
  };
  async function askInstall() { if (!deferred) return; const ev = deferred; deferred = null; askedOnce = true; try { ev.prompt(); const r = await ev.userChoice; hideBar(r.outcome !== 'accepted'); } catch (e) {} }
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; if (!standalone && !dismissed()) showBar(); });
  addEventListener('appinstalled', () => { deferred = null; hideBar(false); });
  bar.addEventListener('click', e => { const b = e.target.closest('[data-inst]'); if (!b) return; if (b.dataset.inst === 'yes') { deferred ? askInstall() : hideBar(false); } else hideBar(true); });
  document.addEventListener('pointerup', () => { if (deferred && !askedOnce && !dismissed() && !standalone) setTimeout(askInstall, 400); });
  if (isMobile) setTimeout(() => { if (!deferred) showBar(); }, 3000);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  window.LumiApp = { go, get screen() { return S.screen; }, get game() { return G; }, startGame, limitState, openGate };   // accès pour les tests
  if (!checkLock()) render();
})();
