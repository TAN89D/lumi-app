// Tests automatiques de LUMI dans de vrais navigateurs (Chromium, WebKit) avec émulation Android, iPhone et tablette.
// Lancer : npm install && npx playwright install chromium webkit && npx playwright test
// ATTENTION : l'émulation n'est PAS un appareil réel (voir docs/RAPPORT-V3.1.md et docs/CHECKLIST-APPAREILS.md).
const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: 'tests/e2e',
  timeout: 120000,
  expect: { timeout: 15000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: { command: 'python3 -m http.server 4173 --bind 127.0.0.1', url: 'http://127.0.0.1:4173/index.html', reuseExistingServer: !process.env.CI, timeout: 30000, stdout: 'ignore', stderr: 'ignore' },   // le serveur de fichiers ne pollue plus le journal
  projects: [
    { name: 'chromium-bureau', use: { ...devices['Desktop Chrome'] } },
    { name: 'android-pixel7', use: { ...devices['Pixel 7'] } },
    { name: 'iphone14-webkit', use: { ...devices['iPhone 14'] } },
    { name: 'ipad-webkit', use: { ...devices['iPad (gen 7)'] } }
  ]
});
