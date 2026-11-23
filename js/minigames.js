// Mini-jeux récompenses : courts, sans chronomètre, impossibles à « perdre ».
window.Mini = (function () {
  // ---- Course de moto : changer de voie pour ramasser 8 mangues, les cailloux ralentissent seulement ----
  function moto(o) {
    const cv = o.canvas, ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
    const M = o.mission, goal = M.goal, W = cv.clientWidth, H = cv.clientHeight;
    const TH = { savane: ['#9fcf6a', '#6e6a7c'], desert: ['#f0d08a', '#8a6f55'], nuit: ['#2b2f6b', '#3b3b55'] }[M.theme] || ['#9fcf6a', '#6e6a7c'];
    const pick = a => a[Math.floor(Math.random() * a.length)];
    cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
    const lw = W * 0.8 / 3, laneX = l => W * 0.1 + lw * (l + 0.5), my = H - 90;
    let lane = 1, x = laneX(1), got = 0, items = [], spawn = 0.3, slow = 0, wob = 0, road = 0, done = false, t = 0, last = performance.now();
    const set = n => { if (done) return; lane = Math.max(0, Math.min(2, n)); };
    const key = e => { if (e.key === 'ArrowLeft') set(lane - 1); if (e.key === 'ArrowRight') set(lane + 1); };
    document.addEventListener('keydown', key);
    cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(); set(lane + (e.clientX - r.left < r.width / 2 ? -1 : 1)); });

    function frame(now) {
      if (!o.alive() || done) { document.removeEventListener('keydown', key); return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      const speed = H * (o.calm ? 0.3 : M.speed) * (slow > 0 ? 0.5 : 1);
      slow = Math.max(0, slow - dt); wob = Math.max(0, wob - dt); road = (road + speed * dt) % 60;
      spawn -= dt;
      if (spawn <= 0) { spawn = 0.9 + Math.random() * 0.5; const good = Math.random() >= M.bad; items.push({ l: Math.floor(Math.random() * 3), y: -30, mango: good, e: good ? pick(M.items) : pick(o.obstacles) }); }
      x += (laneX(lane) - x) * Math.min(1, dt * 12);
      items.forEach(it => {
        it.y += speed * dt;
        if (!it.hit && it.l === lane && Math.abs(it.y - my) < 38) {
          it.hit = true;
          if (it.mango) { got++; it.gone = true; o.onCollect(got, goal); } else { slow = 1; wob = 0.6; o.onBump(); }
        }
      });
      items = items.filter(it => !it.gone && it.y < H + 40);
      draw();
      if (got >= goal) { done = true; document.removeEventListener('keydown', key); setTimeout(o.onWin, 400); return; }
      requestAnimationFrame(frame);
    }
    function draw() {
      ctx.fillStyle = TH[0]; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = TH[1]; ctx.fillRect(W * 0.1, 0, W * 0.8, H);
      ctx.fillStyle = '#fff'; ctx.fillRect(W * 0.1 - 4, 0, 4, H); ctx.fillRect(W * 0.9, 0, 4, H);
      for (let l = 1; l < 3; l++) for (let y = -60 + road; y < H; y += 60) ctx.fillRect(W * 0.1 + lw * l - 2, y, 4, 30);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '40px serif';
      items.forEach(it => ctx.fillText(it.e, laneX(it.l), it.y));
      ctx.save(); ctx.translate(x, my + Math.sin(t * 25) * 1.5); ctx.rotate(Math.PI / 2 + Math.sin(t * 30) * wob * 0.5); ctx.font = '58px serif'; ctx.fillText(o.vehicle, 0, 0); ctx.restore();
      // pilote au-dessus du véhicule
      ctx.beginPath(); ctx.arc(x, my - 38, 17, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill();
      ctx.font = '24px serif'; ctx.fillStyle = '#000'; ctx.fillText(o.pilot, x, my - 37);
    }
    requestAnimationFrame(frame);
    return { left: () => set(lane - 1), right: () => set(lane + 1) };
  }

  // ---- Course d'amis : toucher pour avancer, tout le monde arrive, personne ne perd ----
  function course(o) {
    let me = 0, a = 0, b = 0, done = false;
    const paint = () => {
      o.runners[0].style.left = me * 0.82 + '%'; o.runners[1].style.left = a * 0.82 + '%'; o.runners[2].style.left = b * 0.82 + '%';
      o.bar.style.width = me + '%';
    };
    const iv = setInterval(() => {
      if (!o.alive() || done) return clearInterval(iv);
      a = Math.min(88, a + 1 * (0.7 + Math.random() * 0.6)); b = Math.min(84, b + 0.8 * (0.7 + Math.random() * 0.6)); paint();
    }, 300);
    o.btn.addEventListener('pointerdown', e => {
      e.preventDefault(); if (done) return;
      me = Math.min(100, me + 4); paint(); o.onTap();
      if (me >= 100) { done = true; clearInterval(iv); setTimeout(o.onWin, 300); }
    });
    paint();
  }
  return { moto, course };
})();
