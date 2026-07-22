#!/usr/bin/env node
/**
 * Headless playthrough of BOTH sujet branches:
 *   run A — watch the prologue in real time (screenshots P2/P4/freeze),
 *           then STAKEOUT + TRIBUNAL.
 *   run B — skip everything fast, then PURSUIT + REHABILITATE.
 * Fails loudly on page errors. Screenshots land in shots/.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const GAME_URL = process.env.GAME_URL || 'http://127.0.0.1:8660/';
mkdirSync(new URL('../shots/', import.meta.url).pathname, { recursive: true });
const shot = (page, name) =>
  page.screenshot({ path: new URL(`../shots/${name}.png`, import.meta.url).pathname });

let failures = 0;

async function pumpUntil(page, predicate, { skip = true, clickThrough = true, timeout = 90000 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await page.evaluate(predicate)) return;
    await page.evaluate(({ skip, clickThrough }) => {
      if (skip) window.__test?.skip?.();
      if (clickThrough) {
        const sc1 = document.getElementById('sc1');
        const c = document.getElementById('sc1-confirm');
        if (sc1 && !sc1.classList.contains('hidden') && !sc1.classList.contains('mini') && c && !c.disabled) c.click();
        const go = document.getElementById('sc2-go');
        if (go && !go.classList.contains('hidden') && !document.getElementById('sc2').classList.contains('hidden')) go.click();
      }
    }, { skip, clickThrough });
    await page.waitForTimeout(350);
  }
  throw new Error(`pumpUntil timeout: ${predicate}`);
}

async function playRun(browser, tag, { watchPrologue, approach, verdict }) {
  console.log(`\n=== RUN ${tag} — approach:${approach} verdict:${verdict} ===`);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => { failures++; console.error('PAGE ERROR', e.message); });
  page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });

  await page.goto(GAME_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#begin:not(.hidden)', { timeout: 30000 });
  await page.evaluate(() => document.getElementById('begin').click());

  if (watchPrologue) {
    // Real-time prologue — screenshot mid-shot on each beat marker
    for (const [b, offset] of [['P2', 1800], ['P3', 1800], ['P4', 1800], ['P5', 900]]) {
      await page.waitForFunction((want) => window.__beat === want, b, { timeout: 20000 });
      await page.waitForTimeout(offset);
      await shot(page, `${tag}-${b.toLowerCase()}`);
    }
  }

  // Fast-forward the rest of the films, click through terminal + archive
  await pumpUntil(page, () => window.__test?.state() === 'SCAN');
  console.log('SCAN ready');
  await shot(page, `${tag}-scan`);

  for (let i = 0; i < 3; i++) {
    await page.evaluate((idx) => {
      window.__test.gotoBot(idx);
      window.__test.press('KeyE');
    }, i);
    await page.waitForTimeout(700);
  }
  console.log('scanned 3');

  await page.waitForSelector('#puzzle:not(.hidden)', { timeout: 15000 });
  await page.evaluate(() => window.__test.solvePuzzle());

  // CHOICE 1
  await page.waitForSelector('#choice:not(.hidden)', { timeout: 15000 });
  await shot(page, `${tag}-choice-approach`);
  await page.evaluate((w) => window.__test.choose(w), approach === 'stakeout' ? 'a' : 'b');
  console.log(`choice 1 → ${approach}`);

  if (approach === 'stakeout') {
    await page.waitForFunction(() => window.__beat === 'CAUGHT', { timeout: 20000 });
    await page.waitForTimeout(400);
    await shot(page, `${tag}-stakeout-caught`);
  }
  await pumpUntil(page, () => window.__test?.state() === 'CHASE', { clickThrough: false });
  console.log('CHASE');

  await page.evaluate(() => {
    window.__test.gotoGuilty();
    window.__test.press('Space');
  });

  // capture echo film runs first, then the record — pump skip until it shows
  await pumpUntil(page, () => {
    const b = document.getElementById('r-close');
    const r = document.getElementById('record');
    return r && !r.classList.contains('hidden') && b && b.style.display !== 'none';
  }, { clickThrough: false, timeout: 60000 });
  await shot(page, `${tag}-record`);
  await page.evaluate(() => document.getElementById('r-close').click());

  // CHOICE 2
  await page.waitForSelector('#choice:not(.hidden)', { timeout: 15000 });
  await shot(page, `${tag}-choice-verdict`);
  await page.evaluate((w) => window.__test.choose(w), verdict === 'tribunal' ? 'a' : 'b');
  console.log(`choice 2 → ${verdict}`);

  await page.waitForFunction(
    (want) => window.__beat === want,
    verdict === 'tribunal' ? 'TRIBUNAL' : 'REHAB',
    { timeout: 20000 }
  );
  await page.waitForTimeout(verdict === 'tribunal' ? 2500 : 3200);
  await shot(page, `${tag}-ending-${verdict}`);

  await pumpUntil(page, () => !document.getElementById('sc7').classList.contains('hidden'), { clickThrough: false, timeout: 60000 });
  await shot(page, `${tag}-moon`);
  console.log('MOON — full loop OK');

  const dbg = await page.evaluate(() => ({
    state: window.__test.state(),
    choices: window.__test.choices(),
    loaded: window.__dbg?.loaded?.length || 0,
    fails: window.__dbg?.loadFail || 0,
  }));
  console.log(JSON.stringify(dbg));
  await page.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await playRun(browser, 'A', { watchPrologue: true, approach: 'stakeout', verdict: 'tribunal' });
  await playRun(browser, 'B', { watchPrologue: false, approach: 'pursuit', verdict: 'rehabilitate' });
} finally {
  await browser.close();
}

if (failures > 0) {
  console.error(`\n${failures} page error(s) — FAIL`);
  process.exit(1);
}
console.log('\nBOTH BRANCHES OK');
process.exit(0);
