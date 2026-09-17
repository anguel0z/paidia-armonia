/**
 * Deep QA — Book + Admin + Talk on /m/
 *   node scripts/qa-deep-book-admin-talk.mjs
 * Output: .qa-screens/deep-book-admin-talk/
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT_ROOT = path.join(ROOT, '.qa-screens', 'deep-book-admin-talk');
fs.mkdirSync(OUT_ROOT, { recursive: true });

const ADMIN_PANES = [
  'ops',
  'team',
  'supplies',
  'receipts',
  'school',
  'review',
  'finance',
  'audit',
  'communications',
  'automations',
  'system',
];

const findings = [];

function add(area, sev, title, detail, selectors = [], shot = null, works = false, viewport = '390x844') {
  findings.push({ area, sev, title, detail, selectors, shot, works, viewport, at: new Date().toISOString() });
  console.log(`  [${area}/${sev}] ${title}: ${detail}${works ? ' (OK)' : ''}`);
}

async function shot(page, outDir, name) {
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(outDir, file), fullPage: false }).catch(() => {});
  return `deep-book-admin-talk/${path.basename(outDir)}/${file}`;
}

async function login(ctx, id, mode) {
  const res = await ctx.request.post(`${BASE}/api/auth/login`, {
    data: { profileId: id, mode, pin: pins[id], remember: false },
  });
  if (!res.ok()) throw new Error(`login ${id} ${res.status()} ${await res.text()}`);
  await ctx.request.post(`${BASE}/api/auth/onboarding/complete`, { data: { version: 3 } }).catch(() => {});
}

async function boot(page) {
  await page.goto(`${BASE}/m/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => typeof window.render === 'function' && !document.body.classList.contains('auth-pending'),
    { timeout: 60000 },
  );
  await page.waitForTimeout(400);
}

async function goTab(page, tab, extra = {}) {
  await page.evaluate(
    ({ tab, extra }) => {
      state.tab = tab;
      if (tab === 'admin') state.adminPane = extra.adminPane || 'ops';
      render();
      scrollTo(0, 0);
    },
    { tab, extra },
  );
  await page.waitForTimeout(350);
}

function scoreArea(area) {
  const items = findings.filter((f) => f.area === area && !f.works);
  const p0 = items.filter((f) => f.sev === 'P0').length;
  const p1 = items.filter((f) => f.sev === 'P1').length;
  const p2 = items.filter((f) => f.sev === 'P2').length;
  let s = 10;
  s -= p0 * 2.5;
  s -= p1 * 0.45;
  s -= p2 * 0.08;
  return { score: Math.max(1, Math.min(10, Math.round(s * 10) / 10)), p0, p1, p2 };
}

async function probeCommon(page) {
  return page.evaluate(() => {
    const vw = innerWidth;
    const vh = innerHeight;
    const doc = document.documentElement;
    const dock = document.querySelector('nav.dock[data-staff-dock], nav.dock');
    const dockTop = dock ? dock.getBoundingClientRect().top : vh;

    const isVis = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    };

    const handoff = [...document.querySelectorAll('.handoff-flow')].map((el) => ({
      vis: isVis(el),
      display: getComputedStyle(el).display,
    }));

    const overflow = doc.scrollWidth > vw + 8;

    const railClipped = [];
    for (const btn of document.querySelectorAll('.m-rail button')) {
      if (!isVis(btn)) continue;
      if (btn.scrollWidth > btn.clientWidth + 2) {
        railClipped.push((btn.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40));
      }
    }

    return { vw, dockTop: Math.round(dockTop), handoff, overflow, scrollW: doc.scrollWidth, railClipped };
  });
}

async function probeBook(page) {
  return page.evaluate(() => {
    const dock = document.querySelector('nav.dock');
    const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
    const isVis = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 8 && r.height > 8;
    };
    const underDock = [];
    for (const el of document.querySelectorAll(
      '#view button, #view a.btn, #view .page-act, #view .book-panes button, #view .m-book .btn',
    )) {
      if (!isVis(el) || el.closest('nav.dock')) continue;
      const r = el.getBoundingClientRect();
      const mid = (r.top + r.bottom) / 2;
      if (mid > dockTop - 8 && r.bottom > dockTop + 4) {
        underDock.push({
          sel: el.id ? `#${el.id}` : el.className?.toString().split(' ')[0] || el.tagName,
          label: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 36),
          bottom: Math.round(r.bottom),
        });
      }
    }
    const ctasAbove = [];
    for (const el of document.querySelectorAll('#view .m-book button, #view .m-book a.btn')) {
      if (!isVis(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.top > 60 && r.bottom < dockTop - 6) {
        ctasAbove.push((el.innerText || el.id || '').replace(/\s+/g, ' ').trim().slice(0, 30));
      }
    }
    return { underDock: underDock.slice(0, 8), ctasAbove: ctasAbove.slice(0, 6), dockTop: Math.round(dockTop) };
  });
}

async function probeAdminOps(page) {
  return page.evaluate(() => {
    const isVis = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    };
    const statTiles = [...document.querySelectorAll('.admin-ops-stat-tile')].filter(isVis).map((el) => {
      const r = el.getBoundingClientRect();
      return { h: Math.round(r.height), w: Math.round(r.width), label: (el.innerText || '').slice(0, 30) };
    });
    const metrics = [...document.querySelectorAll('.ops-metric')].filter(isVis).map((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        h: Math.round(r.height),
        display: s.display,
        strongSize: getComputedStyle(el.querySelector('strong') || el).fontSize,
      };
    });
    const sectionNav = document.querySelector('.admin-section-nav');
    const picker = document.querySelector('.admin-section-picker');
    const navVis = sectionNav ? isVis(sectionNav) : false;
    const pickerVis = picker ? isVis(picker) : false;
    const giantMetrics = metrics.filter((m) => m.h > 72);
    return { statTiles, metrics, navVis, pickerVis, giantMetrics };
  });
}

async function probeTalk(page) {
  return page.evaluate(() => {
    const dock = document.querySelector('nav.dock');
    const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
    const compose = document.querySelector('.talk-compose, .chat-compose');
    if (!compose) return { missing: true, dockTop: Math.round(dockTop) };
    const r = compose.getBoundingClientRect();
    const isVis = getComputedStyle(compose).display !== 'none';
    return {
      missing: false,
      vis: isVis,
      composeBottom: Math.round(r.bottom),
      composeTop: Math.round(r.top),
      dockTop: Math.round(dockTop),
      aboveDock: r.bottom <= dockTop + 2,
      clearGap: dockTop - r.bottom,
    };
  });
}

async function runViewport(vpLabel, width, height) {
  const outDir = path.join(OUT_ROOT, vpLabel);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    ...devices['iPhone 15 Pro'],
    viewport: { width, height },
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('paidia.lang', 'el');
    localStorage.setItem('paidia.uiMode', 'pro');
    localStorage.setItem('paidia.tourSeen', '1');
    localStorage.setItem('paidia.tipsSeen', '1');
    localStorage.setItem('paidia.pwaInstallDismiss', '1');
    localStorage.setItem('paidia.onboardingDone', '1');
  });

  console.log(`\n=== ${vpLabel} ===`);
  await login(ctx, 'e4', 'staff');
  await boot(page);

  // handoff on home (regression)
  await goTab(page, 'home');
  let common = await probeCommon(page);
  for (const h of common.handoff.filter((x) => x.vis)) {
    const f = await shot(page, outDir, 'home-handoff-visible');
    add('book', 'P0', 'handoff-flow visible on /m/', `display=${h.display}`, ['.handoff-flow'], f, false, vpLabel);
  }
  if (!common.handoff.some((x) => x.vis)) {
    add('book', 'P2', 'handoff-flow hidden', 'No visible .handoff-flow', ['.handoff-flow', 'm-ui.css'], null, true, vpLabel);
  }

  // BOOK
  await goTab(page, 'book');
  const bookShot = await shot(page, outDir, 'book-main');
  common = await probeCommon(page);
  if (common.overflow) {
    add('book', 'P0', 'horizontal overflow', `scrollW=${common.scrollW} vw=${common.vw}`, ['#view', 'body.shell-m'], bookShot, false, vpLabel);
  } else {
    add('book', 'P2', 'no page overflow', 'scrollWidth OK', ['#view'], bookShot, true, vpLabel);
  }
  for (const h of common.handoff.filter((x) => x.vis)) {
    add('book', 'P0', 'handoff-flow on book tab', 'Should be hidden on /m/', ['.handoff-flow'], bookShot, false, vpLabel);
  }
  const book = await probeBook(page);
  for (const u of book.underDock) {
    add('book', 'P1', 'book CTA under dock', `${u.label} bottom=${u.bottom} dock=${book.dockTop}`, [u.sel, 'nav.dock'], bookShot, false, vpLabel);
  }
  if (!book.underDock.length) {
    add('book', 'P2', 'book CTAs clear of dock', `${book.ctasAbove.length} CTAs above fold`, ['#view .m-book'], bookShot, true, vpLabel);
  }
  await page.evaluate(() => {
    const el = document.querySelector('#view .m-book, #view .book-shell');
    if (el) el.scrollTop = el.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(200);
  const bookScroll = await shot(page, outDir, 'book-scrolled');
  const bookScrollProbe = await probeBook(page);
  for (const u of bookScrollProbe.underDock) {
    add('book', 'P1', 'book scrolled CTA under dock', u.label, [u.sel], bookScroll, false, vpLabel);
  }

  // ADMIN ops + rail panes
  for (const pane of ADMIN_PANES) {
    await goTab(page, 'admin', { adminPane: pane });
    const af = await shot(page, outDir, `admin-${pane}`);
    common = await probeCommon(page);
    if (common.overflow) {
      add('admin', 'P1', `${pane}: horizontal overflow`, `scrollW=${common.scrollW}`, ['#view .m-admin'], af, false, vpLabel);
    }
    for (const label of common.railClipped) {
      add('admin', 'P1', `${pane}: clipped m-rail label`, `"${label}"`, ['.m-rail button'], af, false, vpLabel);
    }
    if (pane === 'ops') {
      const ops = await probeAdminOps(page);
      if (ops.navVis) {
        add('admin', 'P1', 'admin-section-nav visible', 'Should use picker on /m/', ['.admin-section-nav'], af, false, vpLabel);
      } else if (ops.pickerVis) {
        add('admin', 'P2', 'admin section picker', 'Text select nav on mobile', ['#adminSectionSelect'], af, true, vpLabel);
      }
      if (ops.statTiles.length) {
        const big = ops.statTiles.filter((t) => t.h > 64);
        if (big.length) {
          add(
            'admin',
            'P1',
            'admin desk stat tiles visible',
            `${ops.statTiles.length} tiles, maxH=${Math.max(...ops.statTiles.map((t) => t.h))}`,
            ['.admin-ops-desk-stats', '.admin-ops-stat-tile'],
            af,
            false,
            vpLabel,
          );
        } else {
          add('admin', 'P2', 'stat tiles compact', `${ops.statTiles.length} visible`, ['.admin-ops-stat-tile'], af, true, vpLabel);
        }
      }
      if (ops.giantMetrics.length) {
        add('admin', 'P0', 'ops-metric giant tiles', `heights=${ops.giantMetrics.map((m) => m.h).join(',')}`, ['.ops-metric'], af, false, vpLabel);
      } else if (ops.metrics.length) {
        add('admin', 'P2', 'ops metrics text rows', `${ops.metrics.length} rows`, ['.ops-metric', 'm-ui.css'], af, true, vpLabel);
      }
      const opsLinks = await page.evaluate(() => {
        const isVis = (el) => {
          const r = el.getBoundingClientRect();
          return r.width > 1 && getComputedStyle(el).display !== 'none';
        };
        return [...document.querySelectorAll('.ops-priority-actions a, .ops-priority-actions button')].filter(isVis).length;
      });
      if (opsLinks >= 2) {
        add('admin', 'P2', 'ops priority text actions', `${opsLinks} links/buttons`, ['.ops-priority-actions'], af, true, vpLabel);
      }
    }
    const paneTitle = await page.evaluate(() => {
      const h = document.querySelector('#view .admin-ops-hero h2, #view .admin-section-content h2, #view .m-admin h2');
      if (!h) return null;
      return { text: (h.innerText || '').slice(0, 40), clipped: h.scrollWidth > h.clientWidth + 2 };
    });
    if (paneTitle?.clipped) {
      add('admin', 'P2', `${pane}: clipped pane title`, paneTitle.text, ['.admin-ops-hero h2'], af, false, vpLabel);
    }
  }

  // TALK
  await goTab(page, 'talk');
  const talkShot = await shot(page, outDir, 'talk-main');
  common = await probeCommon(page);
  if (common.overflow) {
    add('talk', 'P1', 'talk horizontal overflow', `scrollW=${common.scrollW}`, ['#view .m-talk'], talkShot, false, vpLabel);
  }
  const talk = await probeTalk(page);
  if (talk.missing) {
    add('talk', 'P0', 'talk compose missing', 'No .talk-compose / .chat-compose', ['.talk-compose'], talkShot, false, vpLabel);
  } else if (!talk.aboveDock) {
    add(
      'talk',
      'P0',
      'talk compose overlaps dock',
      `composeBottom=${talk.composeBottom} dockTop=${talk.dockTop}`,
      ['.talk-compose', '.chat-compose', 'nav.dock'],
      talkShot,
      false,
      vpLabel,
    );
  } else {
    add('talk', 'P2', 'talk compose above dock', `gap=${talk.clearGap}px`, ['.talk-compose'], talkShot, true, vpLabel);
  }

  await browser.close();
}

console.log('Deep Book + Admin + Talk QA — /m/');
await runViewport('390x844', 390, 844);
await runViewport('375x667', 375, 667);

const rank = { P0: 0, P1: 1, P2: 2 };
const uniq = [];
const keys = new Set();
for (const f of findings.sort((a, b) => rank[a.sev] - rank[b.sev])) {
  const k = `${f.area}|${f.sev}|${f.title}|${f.detail.slice(0, 60)}|${f.viewport}`;
  if (keys.has(k)) continue;
  keys.add(k);
  uniq.push(f);
}

const scores = {
  book: scoreArea('book'),
  admin: scoreArea('admin'),
  talk: scoreArea('talk'),
};

const lines = [];
lines.push('# Deep QA — Book + Admin + Talk (`/m/`)');
lines.push('');
lines.push(`- **When:** ${new Date().toISOString()}`);
lines.push(`- **Base:** ${BASE}/m/`);
lines.push(`- **Auth:** e4 staff · EL · pro · SW blocked`);
lines.push(`- **Viewports:** 390×844, 375×667`);
lines.push('');
lines.push('## Scores (1–10)');
lines.push('');
lines.push(`| Area | Score | P0 | P1 | P2 |`);
lines.push(`|------|-------|----|----|-----|`);
for (const [area, s] of Object.entries(scores)) {
  lines.push(`| **${area}** | **${s.score}** | ${s.p0} | ${s.p1} | ${s.p2} |`);
}
lines.push('');

for (const area of ['book', 'admin', 'talk']) {
  lines.push(`## ${area.charAt(0).toUpperCase() + area.slice(1)} findings`);
  lines.push('');
  for (const sev of ['P0', 'P1', 'P2']) {
    const items = uniq.filter((f) => f.area === area && f.sev === sev && !f.works);
    if (!items.length) continue;
    lines.push(`### ${sev}`);
    lines.push('');
    for (const f of items) {
      lines.push(`- **${f.title}** (${f.viewport})`);
      lines.push(`  - ${f.detail}`);
      if (f.selectors?.length) lines.push(`  - Selectors: ${f.selectors.map((s) => `\`${s}\``).join(', ')}`);
      if (f.shot) lines.push(`  - Screenshot: \`.qa-screens/${f.shot}\``);
    }
    lines.push('');
  }
  const ok = uniq.filter((f) => f.area === area && f.works);
  if (ok.length) {
    lines.push('### Passes');
    lines.push('');
    [...new Set(ok.map((f) => f.title))].slice(0, 12).forEach((t) => lines.push(`- ${t}`));
    lines.push('');
  }
}

fs.writeFileSync(path.join(OUT_ROOT, 'REPORT.md'), lines.join('\n'));
fs.writeFileSync(
  path.join(OUT_ROOT, 'findings.json'),
  JSON.stringify({ scores, findings: uniq }, null, 2),
);

console.log(JSON.stringify({ scores, out: OUT_ROOT, findings: uniq.filter((f) => !f.works).length }, null, 2));
process.exit(scores.book.p0 + scores.admin.p0 + scores.talk.p0 > 0 ? 1 : 0);
