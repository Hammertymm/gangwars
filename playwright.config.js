const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: path.join(__dirname),
  testMatch: 'ledger.graphics.spec.js',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  snapshotPathTemplate: '{testDir}/tests/ledger-baselines/{arg}{ext}',
  use: {
    baseURL: 'http://127.0.0.1:8765',
    actionTimeout: 10000,
  },
  webServer: {
    command: 'node scripts/ledger-test-server.js',
    port: 8765,
    reuseExistingServer: true,
  },
});
