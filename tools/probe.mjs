// Temporary debug probe — dumps loader state and console traffic.
import { chromium } from 'playwright';

const URL = process.env.GAME_URL || 'http://127.0.0.1:8660/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
page.on('console', (m) => console.log(`[${m.type()}]`, m.text()));
page.on('requestfailed', (r) => console.log('REQ FAIL', r.url(), r.failure()?.errorText));

page.on('request', (r) => {
  if (/models|gstatic|draco/i.test(r.url())) console.log('REQ', r.url());
});
page.on('response', (r) => {
  if (/models|gstatic|draco/i.test(r.url())) console.log('RES', r.status(), r.url());
});

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(45000);

const info = await page.evaluate(() => ({
  loadtxt: document.getElementById('loadtxt')?.textContent,
  bar: document.getElementById('bar')?.style.width,
  beginHidden: document.getElementById('begin')?.classList.contains('hidden'),
  dbg: window.__dbg,
  resources: performance.getEntriesByType('resource')
    .filter((e) => /models|gstatic|draco/i.test(e.name))
    .map((e) => ({ name: e.name.split('/').pop(), dur: Math.round(e.duration), size: e.transferSize })),
}));
console.log(JSON.stringify(info, null, 2));
await browser.close();
