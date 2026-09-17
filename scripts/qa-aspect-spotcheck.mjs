import { chromium } from 'playwright';
import fs from 'fs';

const pins = JSON.parse(fs.readFileSync('docs/marketing/.local-auth/pins.json', 'utf8'));
const browser = await chromium.launch({ headless: true });

async function check(w, h, mode) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    isMobile: true,
    hasTouch: true,
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
  const id = mode === 'staff' ? 'e4' : 'k1';
  await ctx.request.post('http://127.0.0.1:5173/api/auth/login', {
    data: { profileId: id, mode, pin: pins[id], remember: false },
  });
  await page.goto('http://127.0.0.1:5173/m/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => typeof window.render === 'function' && !document.body.classList.contains('auth-pending'),
  );
  await page.waitForTimeout(350);
  const r = await page.evaluate(() => {
    const dock = document.querySelector('nav.dock, nav.kid-dock, #bottomPanel');
    const dockTop = dock.getBoundingClientRect().top;
    const labels = [...document.querySelectorAll('nav.kid-dock button, nav.dock button')].map((b) =>
      (b.innerText || '').replace(/\s+/g, ' ').trim(),
    );
    const hit = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      const t = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2);
      return {
        text: (el.innerText || '').slice(0, 28).replace(/\s+/g, ' '),
        bottom: Math.round(b.bottom),
        clear: b.bottom < dockTop - 4,
        hitDock: !!(t && t.closest('nav.dock, nav.kid-dock, #bottomPanel')),
      };
    };
    return {
      dockTop: Math.round(dockTop),
      labels,
      journal: hit(document.querySelector('#homeShiftJournal')),
      bonus: hit(document.querySelector('.kid-home-cta-tile[data-child-view="bonus"]')),
      more: hit(document.querySelector('#homeInboxAll')),
    };
  });
  console.log(mode, `${w}x${h}`, JSON.stringify(r));
  await ctx.close();
}

await check(375, 667, 'staff');
await check(390, 844, 'kid');
await check(360, 740, 'kid');
await check(320, 568, 'staff');
await browser.close();
