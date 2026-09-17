/**
 * Deep screen map probe — scores + evidence for /m/
 * node scripts/qa-mobile-deep-map.mjs
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT = path.join(ROOT, '.qa-screens', 'deep-map-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-'));
fs.mkdirSync(OUT, { recursive: true });

const STAFF = ['home', 'schedule', 'stock', 'shop', 'talk', 'kids', 'pocket', 'gallery', 'book', 'admin'];
const KID = ['today', 'games', 'rate', 'pocket', 'notes', 'bonus', 'plan', 'rewards', 'learn'];
const map = { staff: {}, kid: {}, meta: { out: OUT, at: new Date().toISOString() } };

async function login(ctx, id, mode) {
  await ctx.request.post(`${BASE}/api/auth/login`, {
    data: { profileId: id, mode, pin: pins[id], remember: false },
  });
  await ctx.request.post(`${BASE}/api/auth/onboarding/complete`, { data: { version: 3 } }).catch(() => {});
}

async function boot(page) {
  await page.goto(`${BASE}/m/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => typeof window.render === 'function' && !document.body.classList.contains('auth-pending'),
    { timeout: 60000 },
  );
  await page.waitForTimeout(350);
}

async function probe(page, key, dockSel) {
  const data = await page.evaluate((dockSel) => {
    const dock = document.querySelector(dockSel);
    const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
    const overflow = document.documentElement.scrollWidth > innerWidth + 2;
    const under = [];
    const clipped = [];
    for (const el of document.querySelectorAll('#view button, #view a, #view [role="button"]')) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') continue;
      const label = (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 36);
      const inRail = !!el.closest(
        '.m-rail, .house-selector, .stock-house-rail, .shop-house-rail, .week-jump, .book-day-strip, .book-cal-strip, .book-panes, .pocket-kids-rail, .kids-pane-tabs, .planner-focus-switch, .shop-panel-seg, .paidia-cal',
      );
      if (!inRail && (r.right > innerWidth + 6 || r.left < -6)) clipped.push(label);
      if (r.bottom > dockTop + 6 && r.top < dockTop && r.top > 40 && !el.closest('nav.dock, nav.kid-dock, #bottomPanel')) {
        under.push(label);
      }
    }
    return {
      overflow,
      scrollW: document.documentElement.scrollWidth,
      dockTop: Math.round(dockTop),
      underDock: [...new Set(under)].slice(0, 8),
      clipped: [...new Set(clipped)].slice(0, 6),
      mPage: !!document.querySelector('#view .m-page'),
      title: document.querySelector('header.app-chrome h1')?.innerText?.trim() || '',
    };
  }, dockSel);

  let score = 10;
  const issues = [];
  if (data.overflow) {
    score -= 3;
    issues.push({ sev: 'P0', detail: `overflow scrollW=${data.scrollW}` });
  }
  if (!data.mPage) {
    score -= 2;
    issues.push({ sev: 'P0', detail: 'missing .m-page' });
  }
  data.clipped.forEach((c) => {
    score -= 1;
    issues.push({ sev: 'P0', detail: `clipped: ${c}` });
  });
  data.underDock.forEach((c) => {
    score -= 0.4;
    issues.push({ sev: 'P1', detail: `under dock: ${c}` });
  });
  score = Math.max(1, Math.round(score * 10) / 10);
  return { ...data, score, issues };
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  ...devices['iPhone 15 Pro'],
  viewport: { width: 390, height: 844 },
  serviceWorkers: 'block',
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.addInitScript(() => {
  localStorage.setItem('paidia.lang', 'el');
  localStorage.setItem('paidia.uiMode', 'pro');
  localStorage.setItem('paidia.tourSeen', '1');
  localStorage.setItem('paidia.tipsSeen', '1');
  localStorage.setItem('paidia.pwaInstallDismiss', '1');
});

await login(ctx, 'e4', 'staff');
await boot(page);

const cssOk = await page.evaluate(() =>
  [...document.styleSheets].some((s) => (s.href || '').includes('ui-v294')),
);
map.meta.cssOk = cssOk;

for (const tab of STAFF) {
  await page.evaluate((t) => {
    state.tab = t;
    if (t === 'schedule') {
      if (typeof setScheduleView === 'function') setScheduleView('day', { persist: false });
    }
    if (t === 'admin') state.adminPane = 'ops';
    render();
    scrollTo(0, 0);
  }, tab);
  await page.waitForTimeout(280);
  const r = await probe(page, tab, 'nav.dock');
  await page.screenshot({ path: path.join(OUT, `staff-${tab}.png`) });
  map.staff[tab] = r;
  console.log(`staff/${tab} score=${r.score} under=${r.underDock.length} clipped=${r.clipped.length}`);
}

// schedule week
await page.evaluate(() => {
  state.tab = 'schedule';
  setScheduleView('week', { persist: false });
  render();
  scrollTo(0, 0);
});
await page.waitForTimeout(280);
map.staff['schedule-week'] = await probe(page, 'schedule-week', 'nav.dock');
await page.screenshot({ path: path.join(OUT, 'staff-schedule-week.png') });

// hit tests home
await page.evaluate(() => {
  state.tab = 'home';
  render();
  scrollTo(0, 0);
});
await page.waitForTimeout(250);
map.staff.homeHits = await page.evaluate(() => {
  const dockTop = document.querySelector('nav.dock').getBoundingClientRect().top;
  const check = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, missing: true };
    const r = el.getBoundingClientRect();
    const t = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    return {
      sel,
      clear: r.bottom < dockTop - 4,
      hitDock: !!(t && t.closest('nav.dock')),
      bottom: Math.round(r.bottom),
    };
  };
  return {
    journal: check('#homeShiftJournal'),
    stock: check('#homeShiftStock'),
    cta: check('.m-cta .btn.m-primary'),
    bento: document.querySelectorAll('.home-bento-tile').length,
    bentoIco: document.querySelectorAll('.home-bento-ico').length,
  };
});

await login(ctx, 'k1', 'child');
await boot(page);

map.kid.dock = await page.evaluate(() =>
  [...document.querySelectorAll('nav.kid-dock button')].map((b) =>
    (b.innerText || '').replace(/\s+/g, ' ').trim(),
  ),
);

for (const view of KID) {
  await page.evaluate((v) => {
    if (typeof goChildView === 'function') goChildView(v);
    else {
      state.childView = v;
      render();
    }
    scrollTo(0, 0);
  }, view);
  await page.waitForTimeout(280);
  const r = await probe(page, view, 'nav.kid-dock, #bottomPanel');
  await page.screenshot({ path: path.join(OUT, `kid-${view}.png`) });
  map.kid[view] = r;
  console.log(`kid/${view} score=${r.score} under=${r.underDock.length}`);
}

map.kid.homeHits = await page.evaluate(() => {
  if (typeof goChildView === 'function') goChildView('today');
  else {
    state.childView = 'today';
    render();
  }
  return null;
});
await page.waitForTimeout(300);
map.kid.homeHits = await page.evaluate(() => {
  const dockTop = document.querySelector('nav.kid-dock, #bottomPanel').getBoundingClientRect().top;
  const tiles = [...document.querySelectorAll('.kid-home-cta-tile')].map((el) => {
    const r = el.getBoundingClientRect();
    const t = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    return {
      id: el.dataset.childView,
      clear: r.bottom < dockTop - 4,
      hitDock: !!(t && t.closest('nav.kid-dock, #bottomPanel')),
    };
  });
  const next = document.querySelector('button.next-up[data-child-view="games"]');
  let nextHit = null;
  if (next) {
    const r = next.getBoundingClientRect();
    const t = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    nextHit = {
      clear: r.bottom < dockTop - 4,
      hitDock: !!(t && t.closest('nav.kid-dock, #bottomPanel')),
      belowFold: r.top > innerHeight,
    };
  }
  return { tiles, nextHit, dock: mapDock() };
  function mapDock() {
    return [...document.querySelectorAll('nav.kid-dock button')].map((b) =>
      (b.innerText || '').replace(/\s+/g, ' ').trim(),
    );
  }
});

map.meta.pageerrors = errors;
map.meta.staffAvg =
  Object.values(map.staff)
    .filter((v) => v && typeof v.score === 'number')
    .reduce((a, v, _, arr) => a + v.score / arr.length, 0);
map.meta.kidAvg =
  Object.values(map.kid)
    .filter((v) => v && typeof v.score === 'number')
    .reduce((a, v, _, arr) => a + v.score / arr.length, 0);

// overall
const hitOk =
  map.staff.homeHits?.journal?.clear &&
  !map.staff.homeHits?.journal?.hitDock &&
  map.kid.dock?.length === 4;
map.meta.overall = Math.round(
  ((map.meta.staffAvg + map.meta.kidAvg) / 2) * (hitOk ? 1 : 0.92) * 10,
) / 10;

fs.writeFileSync(path.join(OUT, 'MAP.json'), JSON.stringify(map, null, 2));
console.log('\nOVERALL', map.meta.overall, 'staffAvg', map.meta.staffAvg.toFixed(1), 'kidAvg', map.meta.kidAvg.toFixed(1));
console.log('OUT', OUT);
await browser.close();
