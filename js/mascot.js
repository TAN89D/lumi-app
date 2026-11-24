// Lumi le lion : mascotte VECTORIELLE découpée en parties animables (corps, tête, oreilles, paupières, bouche, deux pattes).
// Aucune photo : chaque partie est un élément SVG distinct, animé en CSS (transform / opacity uniquement, léger pour les téléphones modestes).
// États : repos, salut, parole, réflexion, encouragement, réussite, fête et pause.
// Animations coupées par « réduire les animations » (prefers-reduced-motion) et par le mode calme : la pose reste, l'image est statique.
// Ce module ne dépend d'aucun autre ; il est testable seul (voir tests/tests.js).
window.Mascot = (function () {
  const STATES = ['rest', 'wave', 'talk', 'think', 'happy', 'oops', 'cheer', 'pause'];
  const INK = '#5a2a12', GOLD = '#ffc84a', MANE = '#b8631f', CREAM = '#fff0c8', EAR = '#e9a23a', SHIRT = '#e4572e';

  let uidN = 0;
  function manePuffs(u) {
    let s = '';
    for (let i = 0; i < 14; i++) { const a = i * 2 * Math.PI / 14; s += `<circle cx="${(100 + 47 * Math.cos(a)).toFixed(1)}" cy="${(96 + 45 * Math.sin(a)).toFixed(1)}" r="17" fill="url(#${u}m)"/>`; }
    return s;
  }
  // Une patte : épaule en haut de l'élément (le CSS tourne autour de ce point), manche à motif, patte dorée avec petits doigts.
  const arm = (side, u) => `<g class="l-arm l-arm-${side}"><rect x="-9" y="0" width="18" height="38" rx="9" fill="url(#${u}f)"/><rect x="-6" y="30" width="12" height="30" rx="6" fill="url(#${u}f)"/>
    <circle cx="0" cy="62" r="11" fill="url(#${u}f)" stroke="${INK}" stroke-width="2"/><ellipse cx="-3" cy="58" rx="3.5" ry="2.4" fill="#fff" opacity=".45"/><path d="M-4 66v-5M0 67v-6M4 66v-5" stroke="${EAR}" stroke-width="1.6" stroke-linecap="round"/></g>`;

  // uid : évite les doublons d'identifiants si plusieurs Lumi sont affichés ensemble
  function markup(state) {
    const st = STATES.includes(state) ? state : 'rest', u = 'lm' + (uidN++) + '-';
    return `<svg class="lumi" viewBox="0 0 200 230" role="img" aria-label="Lumi" data-state="${st}" data-speaking="0" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="${u}f" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".55" stop-color="${GOLD}"/><stop offset="1" stop-color="#e29a2c"/></radialGradient>
        <radialGradient id="${u}m" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#d98a3a"/><stop offset=".6" stop-color="${MANE}"/><stop offset="1" stop-color="#8f4a14"/></radialGradient>
        <linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4724a"/><stop offset="1" stop-color="#c63f1c"/></linearGradient></defs>
      <ellipse cx="100" cy="226" rx="58" ry="7" fill="#000" opacity=".18"/>
      <g class="l-body">
        <path d="M150 218C178 214 186 190 174 172" stroke="#e29a2c" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M171 152C160 158 160 180 172 186 186 182 190 162 180 150z" fill="url(#${u}m)"/>
        <path d="M54 232C52 192 64 158 100 158S148 192 146 232z" fill="url(#${u}f)"/>
        <path d="M66 226C62 196 72 168 90 160L101 200 94 226z" fill="#ffcf3f" stroke="#d93a2b" stroke-width="3.5" stroke-linejoin="round"/><path d="M134 226C138 196 128 168 110 160L99 200 106 226z" fill="#ffcf3f" stroke="#d93a2b" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M72 200l9-14 9 14zM80 220l8-12 8 12z" fill="#2f7de1"/><path d="M84 186l8-13 8 13z" fill="#d93a2b"/><path d="M126 200l-9-14-9 14zM120 220l-8-12-8 12z" fill="#3fae49"/><path d="M116 186l-8-13-8 13z" fill="#2f7de1"/>
        <path d="M60 232V210h80v22z" fill="#ffd23f"/><path d="M60 210h80" stroke="#e0a81a" stroke-width="3"/><path d="M100 210v22" stroke="#e0a81a" stroke-width="2"/>
        <g transform="translate(62 168)">${arm('l', u)}</g><g transform="translate(138 168)">${arm('r', u)}</g>
      </g>
      <g class="l-head">
        ${manePuffs(u)}
        <g class="l-ear l-ear-l"><circle cx="62" cy="58" r="17" fill="url(#${u}f)"/><circle cx="62" cy="58" r="8" fill="${EAR}"/></g>
        <g class="l-ear l-ear-r"><circle cx="138" cy="58" r="17" fill="url(#${u}f)"/><circle cx="138" cy="58" r="8" fill="${EAR}"/></g>
        <circle cx="100" cy="98" r="45" fill="url(#${u}f)"/><path d="M70 78Q78 62 100 62Q84 68 76 84z" fill="#fff" opacity=".28"/>
        <path d="M58 76q42-26 84 0l-4 12q-38-16-76 0z" fill="#d93a2b"/><path d="M64 79l7-6 7 6z" fill="#ffd23f"/><path d="M78 74l7-6 7 6z" fill="#3fae49"/><path d="M93 71l7-6 7 6z" fill="#2f7de1"/><path d="M108 72l7-6 7 6z" fill="#ffd23f"/><path d="M122 77l7-6 7 6z" fill="#3fae49"/>
        <ellipse cx="100" cy="118" rx="22" ry="16" fill="${CREAM}"/><ellipse cx="94" cy="111" rx="9" ry="4" fill="#fff" opacity=".4"/><path d="M93 106h14l-7 8z" fill="${INK}"/><ellipse cx="98" cy="108" rx="2.6" ry="1.2" fill="#fff" opacity=".55"/>
        <g class="l-brows"><path class="l-brow l-brow-l" d="M72 84q9-5 17 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path class="l-brow l-brow-r" d="M111 84q9-5 17 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/></g>
        <g class="l-eyes"><circle cx="82" cy="97" r="6.2" fill="${INK}"/><circle cx="118" cy="97" r="6.2" fill="${INK}"/><circle cx="84" cy="95" r="2" fill="#fff"/><circle cx="120" cy="95" r="2" fill="#fff"/>
          <rect class="l-lid" x="74" y="88" width="16" height="18" rx="8" fill="${GOLD}"/><rect class="l-lid" x="110" y="88" width="16" height="18" rx="8" fill="${GOLD}"/></g>
        <circle cx="68" cy="116" r="7" fill="#ff8f8f" opacity=".5"/><circle cx="132" cy="116" r="7" fill="#ff8f8f" opacity=".5"/>
        <g class="l-mouth">
          <path class="m m-rest" d="M88 123q12 10 24 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
          <ellipse class="m m-talk" cx="100" cy="127" rx="8" ry="8" fill="#7a2a1a" stroke="${INK}" stroke-width="2"/>
          <path class="m m-happy" d="M86 121q14 22 28 0z" fill="#7a2a1a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
          <path class="m m-oops" d="M91 124q9 9 18 1" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
          <ellipse class="m m-pause" cx="100" cy="126" rx="6" ry="7" fill="${INK}"/>
        </g>
      </g>
      <g class="l-thought" fill="#fff6df" stroke="${INK}" stroke-width="2">
        <circle cx="151" cy="56" r="4"/><circle cx="161" cy="46" r="5"/><circle cx="174" cy="30" r="9"/>
      </g>
      <g class="l-pause-sign" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round">
        <path d="M151 52h9l-9 9h9M165 32h13l-13 13h13"/>
      </g>
    </svg>`;
  }

  const reduced = () => { try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };
  const calm = () => { try { return document.body.classList.contains('calm'); } catch (e) { return false; } };
  // true = les animations tournent ; false = pose statique de secours (mêmes parties, mêmes poses, sans mouvement)
  const isAnimated = () => !reduced() && !calm();

  const live = new Set();
  // Place Lumi dans un conteneur. Retourne un contrôleur ; destroy() nettoie les minuteries.
  function mount(el, opts) {
    if (!el) return null;
    opts = opts || {};
    el.innerHTML = markup(opts.state || 'rest');
    const svg = el.querySelector('svg');
    const base = STATES.includes(opts.state) ? opts.state : 'rest';
    let timer = null, speaking = false;
    const restingPose = () => speaking && ['rest', 'think'].includes(base) ? 'talk' : base;
    const ctl = {
      el: svg,
      get state() { return svg.getAttribute('data-state'); },
      // set('happy', 1600) : prend la pose, puis revient au repos (ou à « parle » si la voix parle encore)
      set(state, holdMs) {
        if (!STATES.includes(state)) state = 'rest';
        clearTimeout(timer); svg.setAttribute('data-state', state);
        if (holdMs) timer = setTimeout(() => { svg.setAttribute('data-state', restingPose()); }, holdMs);
        return ctl;
      },
      // Synchronisation avec la narration : la bouche bouge tant que la voix parle (sauf pose de fête / d'erreur en cours).
      setSpeaking(on) {
        speaking = !!on; svg.setAttribute('data-speaking', on ? '1' : '0');
        const s = svg.getAttribute('data-state');
        if (on && ['rest', 'think'].includes(s)) svg.setAttribute('data-state', 'talk');
        else if (!on && s === 'talk') svg.setAttribute('data-state', base);
        return ctl;
      },
      destroy() { clearTimeout(timer); live.delete(ctl); }
    };
    live.add(ctl);
    return ctl;
  }
  function destroyAll() { [...live].forEach(c => c.destroy()); }
  // Branche la narration : Sound.onSpeaking(cb) prévient quand une voix commence / s'arrête.
  function bindSpeech(sound) { if (sound && sound.onSpeaking) sound.onSpeaking(on => live.forEach(c => c.setSpeaking(on))); }

  return { STATES, markup, mount, destroyAll, bindSpeech, isAnimated, reduced, calm, count: () => live.size };
})();
