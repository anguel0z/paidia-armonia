/**
 * iPhone matrix for true mobile rebuild (v248+).
 * Staff tabs + kid views on /m/, asserts m-page + no page overflow.
 *
 *   node scripts/qa-mobile-rebuild.mjs [--tag=m248]
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const TAG = (process.argv.find((a) => a.startsWith('--tag=')) || '--tag=m248').split('=')[1];
const OUT = path.join(ROOT, '.qa-screens', TAG);
fs.mkdirSync(OUT, { recursive: true });

const PHONE = { ...devices['iPhone 15 Pro'], viewport: { width: 393, height: 852 }, serviceWorkers: 'block' };
const STAFF = ['home', 'schedule', 'stock', 'shop', 'talk', 'kids', 'pocket', 'gallery', 'book', 'admin'];
const KIDS = ['today', 'games', 'rate', 'bonus', 'notes', 'plan', 'rewards', 'learn', 'gallery'];

const findings = [];

async function login(ctx, id, mode) {
  const res = await ctx.request.post(`${BASE}/api/auth/login`, {
    data: { profileId: id, mode, pin: pins[id], remember: false },
  });
  if (!res.ok()) throw new Error(`login ${id} ${res.status()}`);
  await ctx.request.post(`${BASE}/api/auth/onboarding/complete`, { data: { version: 3 } }).catch(() => {});
}

async function boot(page) {
  await page.goto(`${BASE}/m/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => typeof window.render === 'function' && !document.body.classList.contains('auth-pending'),
    { timeout: 60000 },
  );
}

async function capture(page, name) {
  await page.waitForTimeout(400);
  const data = await page.evaluate(() => {
    const vw = innerWidth;
    const mPage = document.querySelector('#view .m-page');
    const shell = document.documentElement.dataset.shell || document.body.getAttribute('data-shell');
    const overflow = document.documentElement.scrollWidth > vw + 1;
    const smallTaps = [...document.querySelectorAll('#view button.btn, #view .m-row, #view .btn')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 8 && r.height > 8 && r.height < 40 && r.top < innerHeight && r.bottom > 0;
      })
      .slice(0, 5)
      .map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 32));
    return {
      shell,
      hasMPage: !!mPage,
      mPageId: mPage?.dataset?.mPage || null,
      overflow,
      scrollW: document.documentElement.scrollWidth,
      smallTaps,
      css: [...document.styleSheets].some((s) => (s.href || '').includes('m-ui.css')),
    };
  });
  if (!data.css) findings.push({ name, sev: 'P0', detail: 'm-ui.css not loaded' });
  if (data.shell !== 'm') findings.push({ name, sev: 'P0', detail: `shell=${data.shell}` });
  if (!data.hasMPage) findings.push({ name, sev: 'P0', detail: 'missing .m-page' });
  if (data.overflow) findings.push({ name, sev: 'P0', detail: `overflow scrollW=${data.scrollW}` });
  if (data.smallTaps.length) findings.push({ name, sev: 'P2', detail: `small taps: ${data.smallTaps.join(' | ')}` });
  await page.screenshot({ path: path.join(OUT, `${name}.png`) }).catch(() => {});
  console.log(`  · ${name} m-page=${data.mPageId || '—'} overflow=${data.overflow}`);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext(PHONE);
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.setItem('paidia.lang', 'de');
  localStorage.setItem('paidia.uiMode', 'pro');
  localStorage.setItem('paidia.tourSeen', '1');
  localStorage.setItem('paidia.tipsSeen', '1');
  localStorage.setItem('paidia.pwaInstallDismiss', '1');
});

console.log('=== staff ===');
await login(ctx, 'e4', 'staff');
await boot(page);
for (const tab of STAFF) {
  await page.evaluate((t) => {
    state.tab = t;
    if (t === 'schedule') setScheduleView('day', { persist: false });
    if (t === 'admin') state.adminPane = 'ops';
    render();
    scrollTo(0, 0);
  }, tab);
  await capture(page, `staff-${tab}`);
}
await page.evaluate(() => {
  state.tab = 'schedule';
  setScheduleView('week', { persist: false });
  render();
});
await capture(page, 'staff-schedule-week');

console.log('=== kids ===');
await login(ctx, 'k1', 'child');
await boot(page);
for (const view of KIDS) {
  await page.evaluate((v) => {
    if (typeof goChildView === 'function') goChildView(v);
    else {
      state.childView = v;
      render();
    }
    scrollTo(0, 0);
  }, view);
  await capture(page, `kid-${view}`);
}

await browser.close();

const report = { tag: TAG, at: new Date().toISOString(), findings, count: findings.length };
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
let md = `# Mobile rebuild QA ${TAG}\n\nFindings: ${findings.length}\n\n`;
findings.forEach((f) => {
  md += `- [${f.sev}] ${f.name}: ${f.detail}\n`;
});
fs.writeFileSync(path.join(OUT, 'NOTES.md'), md);
console.log(JSON.stringify({ findings: findings.length, bySev: findings.reduce((a, f) => ((a[f.sev] = (a[f.sev] || 0) + 1), a), {}), out: OUT }, null, 2));
process.exit(findings.some((f) => f.sev === 'P0') ? 1 : 0);
