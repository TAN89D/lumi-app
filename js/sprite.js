// Lecteur de planches d'animation (sprite sheets) : prêt pour les personnages 3D / animations générés plus tard (voir docs/BRIEF-CHATGPT-ANIMATIONS-V4.md).
// Une planche = une image PNG transparente découpée en colonnes × lignes régulières (ex. lumi-wave-4x2.png = 4 colonnes, 2 lignes, 8 images).
// En « réduire les animations » ou mode calme : seule la PREMIÈRE image est affichée (image fixe de secours). Aucune dépendance.
window.Sprite = (function () {
  // Position (en pourcentage de la planche) de l'image n : { x, y } pour background-position.
  function frame(i, cols, rows) {
    const c = i % cols, r = Math.floor(i / cols);
    return { x: cols > 1 ? c * 100 / (cols - 1) : 0, y: rows > 1 ? r * 100 / (rows - 1) : 0 };
  }
  // Lit « nom-4x2.png » → { cols: 4, rows: 2, frames: 8 } (null si le nom n'a pas la forme attendue)
  function parseName(src) {
    const m = /-(\d{1,2})x(\d{1,2})\.(png|webp)(\?.*)?$/i.exec(String(src)); if (!m) return null;
    return { cols: +m[1], rows: +m[2], frames: +m[1] * +m[2] };
  }
  const still = () => { try { return (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || document.body.classList.contains('calm'); } catch (e) { return false; } };
  const html = o => {
    const g = parseName(o.src) || { cols: o.cols || 1, rows: o.rows || 1, frames: (o.cols || 1) * (o.rows || 1) }, n = o.frames || g.frames;
    return `<span class="sprite" role="img" aria-label="${String(o.label || '').replace(/"/g, '')}" data-cols="${g.cols}" data-rows="${g.rows}" data-frames="${n}" data-fps="${o.fps || 8}" data-loop="${o.loop === false ? 0 : 1}" style="background-image:url('${o.src}');background-size:${g.cols * 100}% ${g.rows * 100}%;width:${o.size || 128}px;height:${o.size || 128}px"></span>`;
  };
  // Démarre l'animation d'un élément .sprite. Retourne { stop() }.
  function play(el) {
    if (!el) return { stop() {} };
    const cols = +el.dataset.cols, rows = +el.dataset.rows, n = +el.dataset.frames, fps = Math.max(1, +el.dataset.fps || 8), loop = el.dataset.loop !== '0';
    const show = i => { const f = frame(i, cols, rows); el.style.backgroundPosition = f.x + '% ' + f.y + '%'; el.dataset.i = i; };
    show(0); if (still() || n < 2) return { stop() {} };
    let i = 0; const iv = setInterval(() => { if (!document.body.contains(el)) { clearInterval(iv); return; } i++; if (i >= n) { if (!loop) { clearInterval(iv); return; } i = 0; } show(i); }, 1000 / fps);
    return { stop() { clearInterval(iv); } };
  }
  return { frame, parseName, html, play, still };
})();
