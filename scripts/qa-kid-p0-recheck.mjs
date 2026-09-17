import { chromium, devices } from 'playwright';
import fs from 'fs';

const pins = JSON.parse(fs.readFileSync('docs/marketing/.local-auth/pins.json', 'utf8'));
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  ...devices['iPhone 15 Pro'],
  viewport: { width: 390, height: 844 },
  serviceWorkers: 'block',
});
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.setItem('paidia.lang', 'el');
  localStorage.setItem('paidia.uiMode', 'pro');
  localStorage.setItem('paidia.tourSeen', '1');
  localStorage.setItem('paidia.tipsSeen', '1');
  localStorage.setItem('paidia.pwaInstallDismiss', '1');
});
await ctx.request.post('http://127.0.0.1:5173/api/auth/login', {
  data: { profileId: 'k1', mode: 'child', pin: pins.k1, remember: false },
});
await page.goto('http://127.0.0.1:5173/m/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(
  () => typeof window.render === 'function' && !document.body.classList.contains('auth-pending'),
);
await page.waitForTimeout(400);

const before = await page.evaluate(() => {
  const dock = document.querySelector('nav.kid-dock, #bottomPanel');
  const dockTop = dock.getBoundingClientRect().top;
  const chip = document.querySelector('#view .chip.on[data-child-view="games"]');
  const next = document.querySelector('#view button.next-up[data-child-view="games"], #view .next-up-idle');
  const plan = document.querySelector('.kid-home-cta-tile[data-child-view="plan"]');
  const rewards = document.querySelector('.kid-home-cta-tile[data-child-view="rewards"]');
  const hit = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const t = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    return {
      bottom: Math.round(r.bottom),
      clear: r.bottom < dockTop - 4,
      hitDock: !!(t && t.closest('nav.kid-dock, #bottomPanel')),
      display: getComputedStyle(el).display,
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  };
  return {
    dockTop: Math.round(dockTop),
    oldChip: !!chip,
    next: hit(next),
    plan: hit(plan),
    rewards: hit(rewards),
    view: state.childView,
  };
});
console.log('before', JSON.stringify(before));

if (before.next && !before.next.hitDock) {
  await page.click('#view button.next-up[data-child-view="games"]');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => state.childView);
  console.log('afterClick', after);
}

await browser.close();
