#!/usr/bin/env node
/* Static file server for Crime Ledger Playwright tests (port 8765) */

const { startStaticServer } = require('./ledger-test-helpers.js');

const PORT = Number(process.env.LEDGER_TEST_PORT || 8765);

startStaticServer(PORT).then(() => {
  console.log(`Ledger test server http://127.0.0.1:${PORT}/gangwars.html`);
});
