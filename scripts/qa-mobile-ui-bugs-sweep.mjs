/**
 * Mobile UI bug sweep — visual/layout beyond overflow
 *   node scripts/qa-mobile-ui-bugs-sweep.mjs
 * Output: .qa-screens/agent-ui-bugs-sweep-v294/
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT = path.join(ROOT, '.qa-screens', 'agent-ui-bugs-sweep-v294');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: '390x844', ...devices['iPhone 15 Pro'], viewport: { width: 390, height: 844 } },
  { name: '280x653', viewport: { width: 280, height: 653 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: '844x390', viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];

const STAFF_TABS = ['home', 'stock', 'schedule', 'shop', 'kids', 'pocket', 'book', 'admin', 'talk'];
const KID_TABS = ['today', 'games', 'rate', 'pocket', 'notes'];

const findings = [];

function add(sev, area, title, detail, { selectors = [], shot = null, viewport = '390x844' } = {}) {
  findings.push({ sev, area, title, detail, selectors, shot, viewport, at: new Date().toISOString() });
  console.log(`  [${sev}/${area}] ${title}`);
}

async function shot(page, vp, name) {
  const dir = path.join(OUT, vp);
  fs.mkdirSync(dir, { recursive: true });
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(dir, file), fullPage: false }).catch(() => {});
  return `.qa-screens/agent-ui-bugs-sweep-v294/${vp}/${file}`;
}

async function login(ctx, id, mode) {
  const res = await ctx.request.post(`${BASE}/api/auth/login`, {
    data: { profileId: id, mode, pin: pins[id], remember: false },
  });
  if (!res.ok()) throw new Error(`login ${id} ${res.status()} ${await res.text()}`);
  await ctx.request.post(`${BASE}/api/auth/onboarding/complete`, { data: { version: 3 } }).catch(() => {});
}

async function boot(page) {
  await page.addInitScript(() => {
    localStorage.setItem('paidia.lang', 'el');
    localStorage.setItem('paidia.uiMode', 'pro');
    localStorage.setItem('paidia.tour.done', '1');
    localStorage.setItem('paidia.tips.dismissed', '1');
    localStorage.setItem('paidia.pwa.banner.dismissed', '1');
  });
  await page.goto(`${BASE}/m/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => typeof window.render === 'function' && !document.body.classList.contains('auth-pending'),
    { timeout: 60000 },
  );
  await page.waitForTimeout(450);
}

async function goTab(page, tab, extra = {}) {
  await page.evaluate(
    ({ tab, extra }) => {
      state.tab = tab;
      if (tab === 'admin') state.adminPane = extra.adminPane || 'ops';
      if (extra.kidView) state.kidView = extra.kidView;
      render();
      scrollTo(0, 0);
    },
    { tab, extra },
  );
  await page.waitForTimeout(400);
}

/** Core visual/layout probe */
async function probe(page) {
  return page.evaluate(() => {
    const vw = innerWidth;
    const vh = innerHeight;
    const dock =
      document.querySelector('nav.dock[data-staff-dock], nav.dock, nav.kid-dock, #bottomPanel nav.dock') ||
      document.querySelector('#bottomPanel');
    const dockR = dock ? dock.getBoundingClientRect() : null;
    const dockTop = dockR ? dockR.top : vh;

    const isVis = (el) => {
      if (!el) return false;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    };

    const textOf = (el) => (el?.innerText || el?.textContent || '').replace(/\s+/g, ' ').trim();

    // --- Sticky / fixed stack ---
    const stickies = [];
    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el);
      if (!['fixed', 'sticky'].includes(s.position)) continue;
      if (!isVis(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.height < 8 || r.width < 20) continue;
      if (el.closest('nav.dock, nav.kid-dock, #bottomPanel') && el.matches('nav.dock, nav.kid-dock, #bottomPanel, #bottomPanel *')) {
        // include dock once
      }
      const id = el.id
        ? `#${el.id}`
        : (el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : el.tagName);
      stickies.push({
        id: String(id).slice(0, 72),
        pos: s.position,
        z: s.zIndex,
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        h: Math.round(r.height),
        pe: s.pointerEvents,
        isDock: !!(el.matches?.('nav.dock, nav.kid-dock') || el.closest?.('#bottomPanel') === el || el.id === 'bottomPanel'),
      });
    }
    // Dedup by approx rect
    const stickyUnique = [];
    for (const s of stickies.sort((a, b) => a.top - b.top)) {
      const prev = stickyUnique[stickyUnique.length - 1];
      if (prev && Math.abs(prev.top - s.top) < 4 && Math.abs(prev.h - s.h) < 4 && prev.id === s.id) continue;
      stickyUnique.push(s);
    }

    // Sticky overlaps with each other (bottom chrome wars)
    const stickyWars = [];
    const bottomish = stickyUnique.filter((s) => s.bottom > vh * 0.55 && s.h < vh * 0.45);
    for (let i = 0; i < bottomish.length; i++) {
      for (let j = i + 1; j < bottomish.length; j++) {
        const a = bottomish[i];
        const b = bottomish[j];
        const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlap > 12) {
          stickyWars.push({ a: a.id, b: b.id, overlap: Math.round(overlap), aZ: a.z, bZ: b.z });
        }
      }
    }

    // Store finish vs dock
    const finish = document.querySelector('.store-finish, .store-finish.bottom-dock');
    let shopFinish = null;
    if (finish && isVis(finish)) {
      const r = finish.getBoundingClientRect();
      shopFinish = {
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        h: Math.round(r.height),
        z: getComputedStyle(finish).zIndex,
        dockTop: Math.round(dockTop),
        overlapDock: Math.round(Math.max(0, r.bottom - dockTop)),
        padBottom: getComputedStyle(document.querySelector('.store-page, #view') || document.body).paddingBottom,
      };
    }

    // Talk compose
    const talkCompose = document.querySelector(
      '.talk-compose, #talkCompose, .m-talk-compose, [data-talk-compose], .chat-compose, .wa-compose',
    );
    let talk = null;
    if (talkCompose && isVis(talkCompose)) {
      const r = talkCompose.getBoundingClientRect();
      talk = {
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        aboveDock: r.bottom <= dockTop + 4,
        overlapDock: Math.round(Math.max(0, Math.min(r.bottom, vh) - dockTop)),
        id: talkCompose.id || talkCompose.className?.toString?.().slice(0, 40),
      };
    } else {
      // fallback: find fixed bottom input area on talk tab
      const inputs = [...document.querySelectorAll('#view textarea, #view input[type="text"], #view .composer')];
      for (const el of inputs) {
        if (!isVis(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.bottom > dockTop - 40) {
          talk = {
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            aboveDock: r.bottom <= dockTop + 4,
            overlapDock: Math.round(Math.max(0, Math.min(r.bottom, vh) - dockTop)),
            id: el.id || 'talk-input',
            note: 'fallback-input',
          };
          break;
        }
      }
    }

    // Book save
    const save = document.querySelector('#shiftNoteSave');
    let bookSave = null;
    if (save && isVis(save)) {
      const r = save.getBoundingClientRect();
      bookSave = {
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        mid: Math.round((r.top + r.bottom) / 2),
        underDock: (r.top + r.bottom) / 2 > dockTop - 8 && r.bottom > dockTop + 4,
        dockTop: Math.round(dockTop),
      };
    }

    // Dock label truncation (meaningful loss)
    const dockLabels = [];
    const dockBtns = document.querySelectorAll('nav.dock button, nav.kid-dock button, #bottomPanel nav.dock button');
    for (const btn of dockBtns) {
      if (!isVis(btn)) continue;
      const label = btn.querySelector('span, .dock-label, .label') || btn;
      const full = textOf(label) || btn.getAttribute('aria-label') || '';
      const visible = textOf(label);
      const clipped = label.scrollWidth > label.clientWidth + 2;
      const truncatedShort = visible.length > 0 && visible.length <= 3 && (full.length > 4 || (btn.getAttribute('aria-label') || '').length > 4);
      const ellipsis = /…|\.\.\.$/.test(visible) || (clipped && visible.length < 6);
      dockLabels.push({
        text: visible.slice(0, 24),
        aria: (btn.getAttribute('aria-label') || '').slice(0, 32),
        clipped,
        truncatedShort,
        ellipsis,
        w: Math.round(btn.getBoundingClientRect().width),
      });
    }

    // Duplicate titles: shell header vs in-body H1
    const shellTitle = textOf(document.querySelector('header .title, header h1, .topbar-title, #topTitle, .m-header-title'));
    const h1s = [...document.querySelectorAll('#view h1, #view .page-title, #view .m-title')]
      .filter(isVis)
      .map((el) => ({
        text: textOf(el).slice(0, 48),
        top: Math.round(el.getBoundingClientRect().top),
      }));
    const dupTitles = [];
    if (shellTitle) {
      for (const h of h1s) {
        if (h.text && (h.text === shellTitle || shellTitle.includes(h.text) || h.text.includes(shellTitle.slice(0, 8)))) {
          dupTitles.push({ shell: shellTitle.slice(0, 40), body: h.text, bodyTop: h.top });
        }
      }
    }
    // Also two similar H1s in view
    for (let i = 0; i < h1s.length; i++) {
      for (let j = i + 1; j < h1s.length; j++) {
        if (h1s[i].text && h1s[i].text === h1s[j].text) {
          dupTitles.push({ shell: null, body: h1s[i].text, twin: true });
        }
      }
    }

    // Overlapping text: sample visible text nodes' boxes
    const textEls = [...document.querySelectorAll('#view h1, #view h2, #view h3, #view .pa, #view label, #view .btn, #view button, #view .chip, #view .m-card *')]
      .filter(isVis)
      .slice(0, 180);
    const overlaps = [];
    const rects = textEls.map((el) => {
      const r = el.getBoundingClientRect();
      return { el, r, text: textOf(el).slice(0, 28), tag: el.tagName };
    }).filter((x) => x.text.length > 1 && x.r.height > 6 && x.r.width > 10);

    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < Math.min(i + 12, rects.length); j++) {
        const a = rects[i];
        const b = rects[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (ox > 8 && oy > 8) {
          // same parent row often OK — flag if different parents and substantial
          if (a.el.parentElement !== b.el.parentElement && ox * oy > 80) {
            overlaps.push({
              a: a.text,
              b: b.text,
              ox: Math.round(ox),
              oy: Math.round(oy),
            });
          }
        }
      }
    }

    // Empty states that look broken
    const emptyBroken = [];
    for (const el of document.querySelectorAll('#view .empty, #view .empty-state, #view .m-empty, #view [data-empty], #view .no-items')) {
      if (!isVis(el)) continue;
      const t = textOf(el);
      const r = el.getBoundingClientRect();
      if (!t || t.length < 3) emptyBroken.push({ reason: 'no-copy', h: Math.round(r.height) });
      if (r.height < 24) emptyBroken.push({ reason: 'collapsed', h: Math.round(r.height), t: t.slice(0, 40) });
      if (/undefined|null|\[object/i.test(t)) emptyBroken.push({ reason: 'bad-string', t: t.slice(0, 60) });
    }
    // zero/zero/zero week strip
    const zeroStrip = [...document.querySelectorAll('#view *')].find((el) => {
      const t = textOf(el);
      return /^0\s*\/\s*0\s*\/\s*0$/.test(t) || (t.includes('0 / 0 / 0') && t.length < 20);
    });
    if (zeroStrip && isVis(zeroStrip)) {
      emptyBroken.push({ reason: 'zero-week-strip', t: textOf(zeroStrip).slice(0, 20) });
    }

    // pointer-events:none on interactive-looking controls in view
    const peNone = [];
    for (const el of document.querySelectorAll('#view button, #view a.btn, #view .btn, #view input, #view select, #view textarea, #view [role="button"]')) {
      if (!isVis(el)) continue;
      const s = getComputedStyle(el);
      if (s.pointerEvents === 'none') {
        const r = el.getBoundingClientRect();
        // ignore decorative if fully outside or tiny
        if (r.bottom < 0 || r.top > vh) continue;
        peNone.push({
          id: el.id || textOf(el).slice(0, 28) || el.className?.toString?.().slice(0, 28),
          pe: 'none',
          top: Math.round(r.top),
        });
      }
    }

    // Admin desk stats
    const deskStats = document.querySelector('.admin-ops-desk-stats');
    let admin = null;
    if (deskStats) {
      const s = getComputedStyle(deskStats);
      admin = {
        display: s.display,
        vis: isVis(deskStats),
        tiles: document.querySelectorAll('.admin-ops-stat-tile').length,
        h: Math.round(deskStats.getBoundingClientRect().height),
      };
    }

    // Controls under dock (midpoint in dock band)
    const underDock = [];
    for (const el of document.querySelectorAll('#view button, #view a.btn, #view .btn, #view input, #view textarea')) {
      if (!isVis(el) || el.closest('nav.dock, nav.kid-dock, #bottomPanel')) continue;
      const r = el.getBoundingClientRect();
      const mid = (r.top + r.bottom) / 2;
      if (mid > dockTop - 6 && r.bottom > dockTop + 4 && r.top < vh) {
        underDock.push({
          id: el.id || textOf(el).slice(0, 32),
          bottom: Math.round(r.bottom),
          mid: Math.round(mid),
        });
      }
    }

    // Header sticky vs second sticky
    const header = document.querySelector('header, .topbar, #topbar');
    let headerSticky = null;
    if (header && isVis(header)) {
      const s = getComputedStyle(header);
      const r = header.getBoundingClientRect();
      headerSticky = { pos: s.position, z: s.zIndex, h: Math.round(r.height), bottom: Math.round(r.bottom) };
    }

    // Landscape: dock crush
    const landscapeCrush = vh < 500 && dockR ? Math.round(dockR.height) : null;

    return {
      vw,
      vh,
      dockTop: Math.round(dockTop),
      dockH: dockR ? Math.round(dockR.height) : 0,
      stickyUnique: stickyUnique.slice(0, 30),
      stickyWars,
      shopFinish,
      talk,
      bookSave,
      dockLabels,
      dupTitles,
      overlaps: overlaps.slice(0, 15),
      emptyBroken,
      peNone: peNone.slice(0, 12),
      admin,
      underDock: underDock.slice(0, 12),
      headerSticky,
      landscapeCrush,
      shellTitle: shellTitle?.slice(0, 40),
      h1s,
    };
  });
}

function classifyStaff(p, tab, vp, shotPath) {
  const area = tab;

  if (p.shopFinish && p.shopFinish.overlapDock > 20) {
    add('P0', area, 'Shop finish overlaps dock', `finish↔dock overlap ${p.shopFinish.overlapDock}px (finish bottom ${p.shopFinish.bottom}, dockTop ${p.shopFinish.dockTop})`, {
      selectors: ['.store-finish', 'nav.dock'],
      shot: shotPath,
      viewport: vp,
    });
  }

  for (const w of p.stickyWars || []) {
    if (w.overlap > 24 && !(w.a.includes('dock') && w.b.includes('dock'))) {
      add(
        w.overlap > 40 ? 'P0' : 'P1',
        area,
        'Stacked sticky/fixed bottom chrome',
        `${w.a} ∩ ${w.b} by ${w.overlap}px (z ${w.aZ}/${w.bZ})`,
        { selectors: [w.a, w.b], shot: shotPath, viewport: vp },
      );
    }
  }

  if (tab === 'talk' && p.talk && !p.talk.aboveDock && p.talk.overlapDock > 10) {
    add('P0', area, 'Talk compose under/into dock', `compose overlap ${p.talk.overlapDock}px bottom=${p.talk.bottom} dockTop=${p.dockTop}`, {
      selectors: ['.talk-compose', 'nav.dock'],
      shot: shotPath,
      viewport: vp,
    });
  } else if (tab === 'talk' && !p.talk) {
    // compose might be below fold — check underDock for textarea
    const ud = (p.underDock || []).find((x) => /talk|compose|msg|message|send/i.test(x.id) || true);
    if (p.underDock?.length) {
      add('P1', area, 'Talk controls collide with dock', `underDock: ${p.underDock.map((x) => x.id).join(', ')}`, {
        selectors: ['#view textarea', 'nav.dock'],
        shot: shotPath,
        viewport: vp,
      });
    }
  }

  if (tab === 'book' && p.bookSave?.underDock) {
    add('P1', area, 'Book save CTA under dock', `save mid ${p.bookSave.mid} > dockTop ${p.bookSave.dockTop}`, {
      selectors: ['#shiftNoteSave', 'nav.dock'],
      shot: shotPath,
      viewport: vp,
    });
  }

  const badDock = (p.dockLabels || []).filter((d) => d.clipped || d.truncatedShort || d.ellipsis);
  if (badDock.length && (vp.startsWith('280') || badDock.some((d) => d.truncatedShort || (d.text && d.text.length <= 2)))) {
    add(
      vp.startsWith('280') ? 'P1' : 'P2',
      area,
      'Dock labels truncated (meaning loss)',
      badDock.map((d) => `"${d.text}" aria=${d.aria} clip=${d.clipped}`).join('; '),
      { selectors: ['nav.dock button'], shot: shotPath, viewport: vp },
    );
  }

  if (p.dupTitles?.length) {
    add('P2', area, 'Duplicate page titles', p.dupTitles.map((d) => `shell="${d.shell}" body="${d.body}"`).join('; '), {
      selectors: ['header', '#view h1'],
      shot: shotPath,
      viewport: vp,
    });
  }

  if (p.overlaps?.length >= 2) {
    add('P1', area, 'Overlapping text/controls', p.overlaps.slice(0, 4).map((o) => `"${o.a}"∩"${o.b}" ${o.ox}x${o.oy}`).join('; '), {
      selectors: ['#view'],
      shot: shotPath,
      viewport: vp,
    });
  }

  for (const e of p.emptyBroken || []) {
    add(e.reason === 'bad-string' ? 'P0' : 'P2', area, `Broken empty state (${e.reason})`, JSON.stringify(e), {
      selectors: ['.empty', '.empty-state'],
      shot: shotPath,
      viewport: vp,
    });
  }

  if (p.peNone?.length) {
    add('P1', area, 'Interactive controls with pointer-events:none', p.peNone.map((x) => x.id).join(', '), {
      selectors: p.peNone.map((x) => x.id),
      shot: shotPath,
      viewport: vp,
    });
  }

  if (tab === 'admin' && p.admin?.vis && p.admin.display !== 'none') {
    add('P1', area, 'Admin desk stat tiles still visible on /m/', `display=${p.admin.display} tiles=${p.admin.tiles} h=${p.admin.h}`, {
      selectors: ['.admin-ops-desk-stats'],
      shot: shotPath,
      viewport: vp,
    });
  }

  // under-dock CTAs (exclude list tails that are only barely in band)
  const meaningful = (p.underDock || []).filter((x) => x.id && !/^div$/i.test(x.id));
  if (meaningful.length && ['home', 'shop', 'book', 'talk', 'admin'].includes(tab)) {
    add(
      meaningful.some((x) => /save|send|finish|Αποθήκ|Αποστολ|Σάρωση/i.test(x.id)) ? 'P0' : 'P1',
      area,
      'Primary controls under dock band',
      meaningful.map((x) => `${x.id}@${x.mid}`).join(', '),
      { selectors: meaningful.map((x) => x.id), shot: shotPath, viewport: vp },
    );
  }

  if (p.landscapeCrush != null && p.landscapeCrush > p.vh * 0.28) {
    add('P1', area, 'Landscape dock eats viewport', `dockH=${p.landscapeCrush} vh=${p.vh}`, {
      selectors: ['nav.dock'],
      shot: shotPath,
      viewport: vp,
    });
  }
}

function classifyKid(p, tab, vp, shotPath) {
  const area = `kid-${tab}`;
  if (p.dupTitles?.length) {
    add('P2', area, 'Duplicate kid titles', JSON.stringify(p.dupTitles.slice(0, 2)), {
      shot: shotPath,
      viewport: vp,
    });
  }
  const badDock = (p.dockLabels || []).filter((d) => d.clipped || d.truncatedShort);
  if (badDock.length && vp.startsWith('280')) {
    add('P1', area, 'Kid dock labels truncated', badDock.map((d) => d.text).join(', '), {
      shot: shotPath,
      viewport: vp,
    });
  }
  if (p.underDock?.length) {
    add('P1', area, 'Kid controls under dock', p.underDock.map((x) => x.id).join(', '), {
      shot: shotPath,
      viewport: vp,
    });
  }
  if (p.overlaps?.length >= 2) {
    add('P1', area, 'Kid overlapping text', p.overlaps.slice(0, 3).map((o) => `${o.a}∩${o.b}`).join('; '), {
      shot: shotPath,
      viewport: vp,
    });
  }
  if (p.peNone?.length) {
    add('P1', area, 'Kid pointer-events:none controls', p.peNone.map((x) => x.id).join(', '), {
      shot: shotPath,
      viewport: vp,
    });
  }
}

async function runViewport(browser, vp) {
  console.log(`\n=== ${vp.name} ===`);
  const ctx = await browser.newContext({
    ...vp,
    serviceWorkers: 'block',
    locale: 'el-GR',
  });
  await login(ctx, 'e4', 'staff');
  const page = await ctx.newPage();
  await boot(page);

  for (const tab of STAFF_TABS) {
    await goTab(page, tab, tab === 'admin' ? { adminPane: 'ops' } : {});
    // open more sheet briefly for dock label check on home
    const shotPath = await shot(page, vp.name, `staff-${tab}`);
    const p = await probe(page);
    fs.writeFileSync(path.join(OUT, vp.name, `staff-${tab}.json`), JSON.stringify(p, null, 2));
    classifyStaff(p, tab, vp.name, shotPath);
  }

  // More menu open (staff)
  await goTab(page, 'home');
  await page.evaluate(() => {
    const btn = document.querySelector('nav.dock button[data-tab="more"], nav.dock button.more, #dockMore, button[aria-label*="Άλλα"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(350);
  await shot(page, vp.name, 'staff-more-open');
  await page.keyboard.press('Escape').catch(() => {});
  await page.evaluate(() => {
    document.body.classList.remove('sheet-open');
    const sheet = document.querySelector('.sheet-open, #sheet.open');
    if (sheet) sheet.classList.remove('open', 'sheet-open');
  });

  await ctx.close();

  // Kid session
  const ctxK = await browser.newContext({ ...vp, serviceWorkers: 'block', locale: 'el-GR' });
  await login(ctxK, 'k1', 'child');
  const pageK = await ctxK.newPage();
  await boot(pageK);

  for (const tab of KID_TABS) {
    await pageK.evaluate((tab) => {
      // kid tabs vary — try state then dock click
      if (typeof state !== 'undefined') {
        state.tab = tab === 'today' ? 'home' : tab;
        if (tab === 'today') state.kidView = 'today';
        try {
          render();
        } catch (_) {}
        scrollTo(0, 0);
      }
    }, tab);
    await pageK.waitForTimeout(300);
    // also try clicking dock
    await pageK.evaluate((tab) => {
      const map = { today: 'today', games: 'games', rate: 'rate', pocket: 'pocket', notes: 'notes' };
      const btn = document.querySelector(
        `nav.kid-dock button[data-tab="${map[tab]}"], nav.dock button[data-tab="${map[tab]}"], button[data-kid-tab="${map[tab]}"]`,
      );
      if (btn) btn.click();
    }, tab);
    await pageK.waitForTimeout(400);
    const shotPath = await shot(pageK, vp.name, `kid-${tab}`);
    const p = await probe(pageK);
    fs.writeFileSync(path.join(OUT, vp.name, `kid-${tab}.json`), JSON.stringify(p, null, 2));
    classifyKid(p, tab, vp.name, shotPath);
  }

  // Kid more + bonus/plan/rewards if reachable
  await pageK.evaluate(() => {
    const more = document.querySelector('button[aria-label*="Άλλα"], nav.kid-dock button.more, #kidMore');
    if (more) more.click();
  });
  await pageK.waitForTimeout(350);
  await shot(pageK, vp.name, 'kid-more-open');

  await ctxK.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const vp of VIEWPORTS) {
      await runViewport(browser, vp);
    }
  } finally {
    await browser.close();
  }

  // Deduplicate similar findings (same title+area across noise)
  const key = (f) => `${f.sev}|${f.area}|${f.title}|${f.viewport}`;
  const seen = new Set();
  const unique = [];
  for (const f of findings) {
    const k = key(f);
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(f);
  }

  const report = {
    when: new Date().toISOString(),
    base: `${BASE}/m/`,
    viewports: VIEWPORTS.map((v) => v.name),
    counts: {
      P0: unique.filter((f) => f.sev === 'P0').length,
      P1: unique.filter((f) => f.sev === 'P1').length,
      P2: unique.filter((f) => f.sev === 'P2').length,
    },
    findings: unique,
  };
  fs.writeFileSync(path.join(OUT, 'findings.json'), JSON.stringify(report, null, 2));
  console.log('\nDone.', report.counts, '→', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
