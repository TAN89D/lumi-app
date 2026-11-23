// Lumi le lion : mascotte VECTORIELLE découpée en parties animables (corps, tête, oreilles, paupières, bouche, deux pattes).
// Aucune photo : chaque partie est un élément SVG distinct, animé en CSS (transform / opacity uniquement, léger pour les téléphones modestes).
// États : rest (repos), wave (salue), talk (parle), happy (bonne réponse), oops (erreur douce), cheer (récompense).
// Animations coupées par « réduire les animations » (prefers-reduced-motion) et par le mode calme : la pose reste, l'image est statique.
// Ce module ne dépend d'aucun autre ; il est testable seul (voir tests/tests.js).
window.Mascot = (function () {
  const STATES = ['rest', 'wave', 'talk', 'happy', 'oops', 'cheer'];
  const INK = '#5a2a12', GOLD = '#ffc84a', MANE = '#b8631f', CREAM = '#fff0c8', EAR = '#e9a23a', SHIRT = '#e4572e';

  function manePuffs() {
    let s = '';
    for (let i = 0; i < 14; i++) { const a = i * 2 * Math.PI / 14; s += `<circle cx="${(100 + 47 * Math.cos(a)).toFixed(1)}" cy="${(96 + 45 * Math.sin(a)).toFixed(1)}" r="17" fill="${MANE}"/>`; }
    return s;
  }
  // Une patte : épaule en haut de l'élément (le CSS tourne autour de ce point), manche à motif, patte dorée avec petits doigts.
  const arm = side => `<g class="l-arm l-arm-${side}"><rect x="-9" y="0" width="18" height="38" rx="9" fill="${SHIRT}"/><rect x="-9" y="14" width="18" height="6" fill="#ffd23f"/><rect x="-6" y="30" width="12" height="30" rx="6" fill="${GOLD}"/>
    <circle cx="0" cy="62" r="11" fill="${GOLD}" stroke="${INK}" stroke-width="2"/><path d="M-4 66v-5M0 67v-6M4 66v-5" stroke="${EAR}" stroke-width="1.6" stroke-linecap="round"/></g>`;

  // uid : évite les doublons d'identifiants si plusieurs Lumi sont affichés ensemble
  function markup(state) {
    const st = STATES.includes(state) ? state : 'rest';
    return `<svg class="lumi" viewBox="0 0 200 230" role="img" aria-label="Lumi" data-state="${st}" data-speaking="0" xmlns="http://www.w3.org/2000/svg">
      <g class="l-body">
        <path d="M54 232C52 192 64 158 100 158S148 192 146 232z" fill="${SHIRT}"/>
        <path d="M70 188l8-12 8 12zM88 188l8-12 8 12zM106 188l8-12 8 12zM124 188l-8-12 8-12z" fill="#ffd23f" opacity=".95"/>
        <path d="M66 204h68v10H66z" fill="#2f7de1"/><path d="M72 214l6-8 6 8zM90 214l6-8 6 8zM108 214l6-8 6 8zM122 214l6-8 6 8z" fill="#3fae49"/>
        <g transform="translate(62 168)">${arm('l')}</g><g transform="translate(138 168)">${arm('r')}</g>
      </g>
      <g class="l-head">
        ${manePuffs()}
        <g class="l-ear l-ear-l"><circle cx="62" cy="58" r="17" fill="${GOLD}"/><circle cx="62" cy="58" r="8" fill="${EAR}"/></g>
        <g class="l-ear l-ear-r"><circle cx="138" cy="58" r="17" fill="${GOLD}"/><circle cx="138" cy="58" r="8" fill="${EAR}"/></g>
        <circle cx="100" cy="98" r="45" fill="${GOLD}"/>
        <path d="M58 76q42-26 84 0l-4 12q-38-16-76 0z" fill="#e4572e"/><path d="M66 78l7-6 7 6zM92 72l8-7 8 7zM120 78l7-6 7 6z" fill="#ffd23f"/>
        <ellipse cx="100" cy="118" rx="22" ry="16" fill="${CREAM}"/><path d="M93 106h14l-7 8z" fill="${INK}"/>
        <g class="l-brows"><path class="l-brow l-brow-l" d="M72 84q9-5 17 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path class="l-brow l-brow-r" d="M111 84q9-5 17 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/></g>
        <g class="l-eyes"><circle cx="82" cy="97" r="6.2" fill="${INK}"/><circle cx="118" cy="97" r="6.2" fill="${INK}"/><circle cx="84" cy="95" r="2" fill="#fff"/><circle cx="120" cy="95" r="2" fill="#fff"/>
          <rect class="l-lid" x="74" y="88" width="16" height="18" rx="8" fill="${GOLD}"/><rect class="l-lid" x="110" y="88" width="16" height="18" rx="8" fill="${GOLD}"/></g>
        <circle cx="68" cy="116" r="7" fill="#ff8f8f" opacity=".5"/><circle cx="132" cy="116" r="7" fill="#ff8f8f" opacity=".5"/>
        <g class="l-mouth">
          <path class="m m-rest" d="M88 123q12 10 24 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
          <ellipse class="m m-talk" cx="100" cy="127" rx="8" ry="8" fill="#7a2a1a" stroke="${INK}" stroke-width="2"/>
          <path class="m m-happy" d="M86 121q14 22 28 0z" fill="#7a2a1a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
          <path class="m m-oops" d="M91 127q9-5 18 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
        </g>
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
    const svg = el.querySelector('svg'); let timer = null, base = opts.state || 'rest', speaking = false;
    const ctl = {
      el: svg,
      get state() { return svg.getAttribute('data-state'); },
      // set('happy', 1600) : prend la pose, puis revient au repos (ou à « parle » si la voix parle encore)
      set(state, holdMs) {
        if (!STATES.includes(state)) state = 'rest';
        clearTimeout(timer); svg.setAttribute('data-state', state);
        if (holdMs) timer = setTimeout(() => { svg.setAttribute('data-state', speaking ? 'talk' : base); }, holdMs);
        return ctl;
      },
      // Synchronisation avec la narration : la bouche bouge tant que la voix parle (sauf pose de fête / d'erreur en cours).
      setSpeaking(on) {
        speaking = !!on; svg.setAttribute('data-speaking', on ? '1' : '0');
        const s = svg.getAttribute('data-state');
        if (on && s === 'rest') svg.setAttribute('data-state', 'talk'); else if (!on && s === 'talk') svg.setAttribute('data-state', base);
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
