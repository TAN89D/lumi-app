// Tests de bout en bout : la page de tests unitaires, le hors ligne, et des parcours en émulation Android / iPhone / tablette.
const { test, expect } = require('@playwright/test');

// L'application s'ouvre sur l'écran de bienvenue ; « Commencer » mène à l'accueil.
const openHome = async page => { await page.goto('/index.html'); await page.locator('[data-act="begin"]').click(); };

test.beforeEach(async ({ page }) => {
  // Les parcours de jeu commencent après le report de l'installation de la PWA.
  await page.addInitScript(() => {
    if (location.pathname === '/index.html') {
      const slug = location.host.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      localStorage.setItem('lumi.' + slug + '.installNo', String(Date.now()));
    }
  });
});

test('les syllabes font réagir Lumi et alimentent le suivi du profil', async ({ page }) => {
  await openHome(page);
  const age = await page.evaluate(() => {
    Store.s().voice = false;
    return Store.profile().age;
  });
  await page.locator('.h-cats .gcat').first().click();
  await page.locator('[data-g="syllables"]').click();
  const mascot = page.locator('.g-lumi .lumi');
  await expect(mascot).toHaveAttribute('data-state', 'think');
  for (let round = 0; round < 4; round++) {
    const { good, bad } = await page.evaluate(() => {
      const game = LumiApp.game;
      const choices = game.rounds[game.idx].choices;
      const svg = document.querySelector('.g-lumi .lumi');
      window.lumiTestPoses = [];
      new MutationObserver(() => window.lumiTestPoses.push(svg.dataset.state))
        .observe(svg, { attributes: true, attributeFilter: ['data-state'] });
      return { good: choices.findIndex(c => c.ok), bad: choices.findIndex(c => !c.ok) };
    });
    if (round === 0) {
      await page.locator('.tile').nth(bad).click();
      expect(await page.evaluate(() => window.lumiTestPoses)).toContain('oops');
    }
    await page.locator('.tile').nth(good).click();
    expect(await page.evaluate(() => window.lumiTestPoses)).toContain('happy');
    if (round < 3) await expect(mascot).toHaveAttribute('data-state', 'think');
  }
  await expect(page.locator('.r-lumi[data-state="cheer"] .lumi')).toBeVisible();
  const profile = await page.evaluate(() => ({
    age: Store.profile().age,
    plays: Skills.summary(Store.profile()).find(s => s.id === 'letters.syllables').plays
  }));
  expect(profile).toEqual({ age, plays: 1 });
});

test.describe('Tests automatiques de LUMI (page tests/index.html)', () => {
  test('tous les tests intégrés réussissent', async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    // Le banc de tests remplace les méthodes du moteur vocal, absent sur certains WebKit.
    await page.addInitScript(() => {
      if (!window.speechSynthesis) window.speechSynthesis = { getVoices: () => [], speak() {}, cancel() {} };
    });
    await page.goto('/tests/index.html');
    test.setTimeout(300000);
    try { await page.waitForFunction(() => window.__lumiTestResult || document.querySelector('#sum .ko'), null, { timeout: 240000 }); }
    catch (e) { throw new Error('La page de tests ne se termine pas. Dernier groupe démarré : ' + await page.evaluate(() => window.__lumiGroup).catch(() => '?') + ' | erreurs de page : ' + errors.join(' ; ')); }
    const res = await page.evaluate(() => window.__lumiTestResult);
    expect(res, 'le lanceur de tests a planté').toBeTruthy();
    if (res.fail) console.log('ÉCHECS :\n' + res.failures.map(f => ' - ' + f.group + ' :: ' + f.name + ' :: ' + f.detail).join('\n'));
    expect(res.failures, JSON.stringify(res.failures, null, 1)).toEqual([]);
    expect(res.total).toBeGreaterThan(120);
    expect(errors).toEqual([]);
  });
});

test.describe('Parcours (émulation de l’appareil du projet)', () => {
  test('l’accueil s’affiche sans débordement horizontal', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('.h-cats .gcat')).toHaveCount(8);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over).toBeLessThanOrEqual(1);
    await expect(page.locator('.ribbon')).toContainText('PRÉVISUALISATION');   // jamais confondu avec la production
  });
  test('un jeu s’ouvre, se joue et donne des étoiles', async ({ page }) => {
    await openHome(page);
    await page.locator('.h-cats .gcat').first().click();
    await page.locator('.gcard').first().click();
    await expect(page.locator('.play')).toBeVisible();
    for (let i = 0; i < 4; i++) {   // on touche la bonne tuile d'après les données du jeu courant
      const idx = await page.evaluate(() => { const G = window.LumiApp.game, r = G.rounds[G.idx]; return r.choices.findIndex(c => c.ok); });
      await page.locator('.tile').nth(idx).click();
      await page.waitForTimeout(1200);
      if (await page.locator('.result').count()) break;
    }
    await expect(page.locator('.result')).toBeVisible();
    await expect(page.locator('.big-stars .star.on').first()).toBeVisible();
  });
  test('la porte parentale demande un maintien puis un calcul', async ({ page }) => {
    await openHome(page);
    await page.locator('.h-parents').click();
    await expect(page.locator('#hold')).toBeVisible();
    const box = await page.locator('#hold').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(2300); await page.mouse.up();
    await expect(page.locator('.keypad')).toBeVisible();
  });
  test('le zoom du navigateur n’est pas bloqué', async ({ page }) => {
    await page.goto('/index.html');
    const vp = await page.locator('meta[name=viewport]').getAttribute('content');
    expect(vp).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/);
  });
  test('passage en anglais : histoires et consignes traduites', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => { Store.s().lang = 'en'; Store.save(); });
    await page.reload();
    await expect(page.locator('.h-start')).toContainText('Start');
    await page.evaluate(() => window.LumiApp.go('cat', { id: 'stories' }));
    await expect(page.locator('.glist')).toContainText('Abdou and the mango');
  });
});

test.describe('Nouvel accueil (V3.2)', () => {
  test('mission du jour, Commencer et navigation par onglets', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('.h-mission')).toBeVisible();
    await page.locator('.nav4 button').nth(1).click(); await expect(page.locator('.gcat').first()).toBeVisible();
    await page.locator('.nav4 button').nth(3).click(); await expect(page.locator('.pg-row').first()).toBeVisible();
    await page.locator('.nav4 button').nth(2).click(); await expect(page.locator('.coll')).toBeVisible();
    await page.locator('.nav4 button').nth(0).click();
    await page.locator('.h-mission').click(); await expect(page.locator('.play')).toBeVisible();
  });
  test('captures d’écran du nouvel accueil (jointes au rapport)', async ({ page }, info) => {
    await page.goto('/index.html'); await page.waitForTimeout(1200);
    await info.attach('1-bienvenue', { body: await page.screenshot(), contentType: 'image/png' });
    await page.locator('[data-act="begin"]').click(); await page.waitForTimeout(900);
    await info.attach('accueil-haut', { body: await page.screenshot(), contentType: 'image/png' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(300);
    await info.attach('accueil-bas', { body: await page.screenshot(), contentType: 'image/png' });
    await page.locator('.nav4 button').nth(1).click(); await page.waitForTimeout(300);
    await info.attach('jeux', { body: await page.screenshot(), contentType: 'image/png' });
    await page.locator('.h-cats .gcat, .gcat').first().click(); await page.waitForTimeout(300);
    await info.attach('monde', { body: await page.screenshot(), contentType: 'image/png' });
    await page.locator('.gcard').first().click(); await page.waitForTimeout(600);
    await info.attach('jeu', { body: await page.screenshot(), contentType: 'image/png' });
    await page.evaluate(() => window.LumiApp.go('profiles')); await page.waitForTimeout(300);
    await info.attach('profils', { body: await page.screenshot(), contentType: 'image/png' });
    await page.evaluate(() => window.LumiApp.go('parent')); await page.waitForTimeout(300);
    await info.attach('parents-suivi', { body: await page.screenshot(), contentType: 'image/png' });
    await page.locator('.ptab[data-tab="settings"]').click(); await page.waitForTimeout(300);
    await info.attach('parents-parametres', { body: await page.screenshot(), contentType: 'image/png' });
  });
  test('la bienvenue apparaît une fois ; « Commencer » ouvre l’accueil ; les onglets n’y ramènent pas', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('.welcome')).toBeVisible();
    await expect(page.locator('.nav4')).toHaveCount(0);
    await page.locator('[data-act="begin"]').click();
    await expect(page.locator('.h-cats .gcat')).toHaveCount(8);
    await page.locator('.nav4 button').nth(1).click(); await page.locator('.nav4 button').nth(0).click();
    await expect(page.locator('.welcome')).toHaveCount(0);
  });
});

test.describe('V3.4 : histoires interactives et mascotte animée', () => {
  test('question de compréhension : réessayer sans pénalité, répondre, ou passer', async ({ page }, info) => {
    await openHome(page);
    await page.evaluate(() => window.LumiApp.startGame('stories', 'mangue'));
    for (let i = 0; i < 6 && !(await page.locator('.quiz').count()); i++) { await page.locator('[data-act="spg"][data-d="1"]').click(); }
    await expect(page.locator('.quiz')).toBeVisible();
    await info.attach('quiz', { body: await page.screenshot(), contentType: 'image/png' });
    const bad = await page.evaluate(() => window.LumiApp.game.quiz.choices.findIndex(c => !c.ok));
    await page.locator('.q-ch').nth(bad).click();
    await expect(page.locator('.quiz')).toBeVisible();   // on peut réessayer
    expect(await page.evaluate(() => window.LumiApp.game.err)).toBe(0);   // aucune pénalité
    const good = await page.evaluate(() => window.LumiApp.game.quiz.choices.findIndex(c => c.ok));
    await page.locator('.q-ch').nth(good).click();
    await expect(page.locator('.result')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.big-stars .star.on')).toHaveCount(3);
  });
  test('on peut terminer l’histoire sans répondre', async ({ page }) => {
    await openHome(page);
    await page.evaluate(() => window.LumiApp.startGame('stories', 'baobab'));
    for (let i = 0; i < 8 && !(await page.locator('.quiz').count()); i++) { await page.locator('[data-act="spg"][data-d="1"]').click(); }
    await page.locator('.q-skip').click();
    await expect(page.locator('.result')).toBeVisible();
  });
  test('Lumi est animé, et immobile si les animations sont réduites', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('.w-lumi svg.lumi')).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.lumi .l-body')).animationName)).not.toBe('none');
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload();
    await expect(page.locator('.w-lumi svg.lumi')).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.lumi .l-body')).animationName)).toBe('none');
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.lumi .l-arm-r')).animationName)).toBe('none');
  });
});

test.describe('Hors ligne', () => {
  test('après la première visite, LUMI démarre et se joue sans connexion', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'le hors ligne est vérifié sur Chromium');
    await page.goto('/index.html');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(async () => { const ks = await caches.keys(); const k = ks.find(x => x.indexOf('lumi-app::') === 0); if (!k) return false; const c = await caches.open(k); return (await c.keys()).length >= 25; }, null, { timeout: 30000 });
    await page.reload(); await page.waitForTimeout(500);   // la page est maintenant contrôlée par le service worker
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.w-chars')).toBeVisible();
    await page.locator('[data-act="begin"]').click();
    await expect(page.locator('.h-cats .gcat')).toHaveCount(8);
    await expect(page.locator('.h-chars')).toBeVisible();
    await page.locator('.h-cats .gcat').first().click(); await page.locator('.gcard').first().click();
    await expect(page.locator('.play')).toBeVisible();
    await context.setOffline(false);
  });
});
