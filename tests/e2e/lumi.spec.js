// Tests de bout en bout : la page de tests unitaires, le hors ligne, et des parcours en émulation Android / iPhone / tablette.
const { test, expect } = require('@playwright/test');

test.describe('Tests automatiques de LUMI (page tests/index.html)', () => {
  test('tous les tests intégrés réussissent', async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('/tests/index.html');
    await page.waitForFunction(() => window.__lumiTestResult || /planté/.test(document.getElementById('sum').textContent), null, { timeout: 100000 });
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
    await page.goto('/index.html');
    await expect(page.locator('.cat')).toHaveCount(11);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over).toBeLessThanOrEqual(1);
    await expect(page.locator('.ribbon')).toContainText('PRÉVISUALISATION');   // jamais confondu avec la production
  });
  test('un jeu s’ouvre, se joue et donne des étoiles', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('.cat').first().click();
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
    await page.goto('/index.html');
    await page.locator('.tabs button').nth(2).click();
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
    await expect(page.locator('.hero .go')).toContainText('Play');
    await page.evaluate(() => window.LumiApp.go('cat', { id: 'stories' }));
    await expect(page.locator('.glist')).toContainText('Abdou and the mango');
  });
});

test.describe('Hors ligne', () => {
  test('après la première visite, LUMI démarre et se joue sans connexion', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'le hors ligne est vérifié sur Chromium');
    await page.goto('/index.html');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(async () => { const ks = await caches.keys(); const k = ks.find(x => x.indexOf('lumi-app::') === 0); if (!k) return false; const c = await caches.open(k); return (await c.keys()).length >= 18; }, null, { timeout: 30000 });
    await page.reload(); await page.waitForTimeout(500);   // la page est maintenant contrôlée par le service worker
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.cat')).toHaveCount(11);
    await page.locator('.cat').first().click(); await page.locator('.gcard').first().click();
    await expect(page.locator('.play')).toBeVisible();
    await context.setOffline(false);
  });
});
