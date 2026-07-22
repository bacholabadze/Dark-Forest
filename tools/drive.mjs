#!/usr/bin/env node
/** Headless CDP playthrough — verifies the 7-scene loop ends without crash. */
import { chromium } from 'playwright';

const URL = process.env.GAME_URL || 'http://127.0.0.1:8660/';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.error('CONSOLE', m.text());
});

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('#begin:not(.hidden)', { timeout: 30000 });
await page.evaluate(() => document.getElementById('begin').click());

// Scene 1 — sandwich
await page.waitForSelector('#sc1:not(.hidden)');
await page.evaluate(() => document.getElementById('sc1-confirm').click());
await page.locator('#sc1').waitFor({ state: 'hidden', timeout: 15000 });

// Scene 2 — activate
await page.waitForSelector('#sc2-go:not(.hidden)', { timeout: 15000 });
await page.evaluate(() => document.getElementById('sc2-go').click());

// Wait for descent → SCAN
await page.waitForFunction(() => window.__test?.state() === 'SCAN', { timeout: 20000 });
console.log('SCAN ready');

for (let i = 0; i < 3; i++) {
  await page.evaluate((idx) => {
    window.__test.gotoBot(idx);
    window.__test.press('KeyE');
  }, i);
  await page.waitForTimeout(800);
}
console.log('scanned 3');

await page.waitForSelector('#puzzle:not(.hidden)', { timeout: 10000 });
await page.evaluate(() => window.__test.solvePuzzle());
await page.waitForFunction(() => window.__test?.state() === 'CHASE', { timeout: 15000 });
console.log('CHASE');

await page.evaluate(() => {
  window.__test.gotoGuilty();
  window.__test.press('Space');
});

await page.waitForSelector('#record:not(.hidden)', { timeout: 15000 });
await page.waitForFunction(() => {
  const b = document.getElementById('r-close');
  return b && b.style.display !== 'none' && !document.getElementById('record').classList.contains('hidden');
}, { timeout: 12000 });
await page.click('#r-close');

await page.locator('#sc7').waitFor({ state: 'visible', timeout: 20000 });
console.log('MOON — full loop OK');

const dbg = await page.evaluate(() => ({
  state: window.__test.state(),
  loaded: window.__dbg?.loaded?.length || 0,
  fails: window.__dbg?.loadFail || 0,
}));
console.log(JSON.stringify(dbg));

await browser.close();
process.exit(0);
