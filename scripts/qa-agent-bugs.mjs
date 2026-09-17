/**
 * Bug hunter for /m/ — stuck UI, dead taps, dock crush, layout collapse, sheet traps.
 *   node scripts/qa-agent-bugs.mjs
 * Output: .qa-screens/agent-bugs/
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'));
const OUT = path.join(ROOT, '.qa-screens', 'agent-bugs');
fs.mkdirSync(OUT, { recursive: true });

const PHONE = { ...devices['iPhone 15 Pro'], viewport: { width: 390, height: 844 }, serviceWorkers: 'block' };
const findings = [];
const consoleErrors = [];
const pageErrors = [];

function add(sev, title, detail, suspects = [], shot = null) {
  findings.push({ sev, title, detail, suspects, shot, at: new Date().toISOString() });
  console.log(`  [${sev}] ${title}: ${detail}`);
}

async function shot(page, name) {
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(OUT, file), fullPage: false }).catch(() => {});
  return file;
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

/** Probe overlays / pointer traps / layout collapse / content under dock */
async function probeChrome(page, label) {
  return page.evaluate((label) => {
    const vw = innerWidth;
    const vh = innerHeight;
    const dock = document.querySelector('nav.dock, nav.kid-dock, #bottomPanel .dock, #bottomPanel');
    const dockTop = dock ? dock.getBoundingClientRect().top : vh;
    const body = document.body;

    const isVis = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    };

    // Opaque / pointer-blocking layers covering most of the viewport (not dock/header)
    const traps = [];
    const candidates = [
      ...document.querySelectorAll(
        '.sheet, .sheet-open, #sheet, #sheetHost, #sheetBackdrop, .sheet-backdrop, ' +
        '#tutorial, .tutorial, .tutorial-overlay, #tipsLayer, .tip-layer, .zoai-tip, ' +
        '.overlay, .modal-backdrop, #gate, .gate-wrap, [aria-modal="true"], ' +
        '.pwa-banner, .install-banner, #toastHost > *, .scrim'
      ),
    ];
    // Also scan fixed/absolute full-viewport layers
    [...document.querySelectorAll('body > *, #app > *, #sheetHost *, .sheet *')].slice(0, 400).forEach((el) => {
      const s = getComputedStyle(el);
      if (!['fixed', 'absolute', 'sticky'].includes(s.position)) return;
      const r = el.getBoundingClientRect();
      if (r.width < vw * 0.6 || r.height < vh * 0.35) return;
      if (!isVis(el)) return;
      if (el.matches('nav.dock, nav.kid-dock, header, #bottomPanel, #view, main')) return;
      candidates.push(el);
    });

    const seen = new Set();
    for (const el of candidates) {
      if (!el || seen.has(el) || !isVis(el)) continue;
      seen.add(el);
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const pe = s.pointerEvents;
      const covers = r.width >= vw * 0.7 && r.height >= vh * 0.4;
      const id = (el.id || el.className || el.tagName || '').toString().slice(0, 80);
      if (covers && pe !== 'none') {
        const opaque = Number(s.opacity) > 0.05 && s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent';
        traps.push({
          id,
          pe,
          opacity: s.opacity,
          z: s.zIndex,
          bg: s.backgroundColor,
          top: Math.round(r.top),
          h: Math.round(r.height),
          opaque,
          bodySheetOpen: body.classList.contains('sheet-open'),
        });
      }
    }

    // Letter-stacking / zero-height collapse
    const collapses = [];
    [...document.querySelectorAll('#view h1, #view h2, #view h3, #view .pa, #view .m-title, #view button span, nav.dock button span, .kid-dock button span')]
      .slice(0, 200)
      .forEach((el) => {
        if (!isVis(el)) return;
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        const text = (el.textContent || '').trim();
        if (!text || text.length < 2) return;
        // letter stacking: very narrow width with multi-char text + vertical writing or tiny width
        if (r.width > 0 && r.width < 14 && text.length >= 3 && !/[\u{1F300}-\u{1FAFF}]/u.test(text)) {
          collapses.push({ kind: 'letter-stack', label: text.slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), wm: s.writingMode });
        }
        if (r.height < 2 && text.length >= 2) {
          collapses.push({ kind: 'zero-height', label: text.slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) });
        }
      });

    // Zero-height rows that should have content
    [...document.querySelectorAll('#view .m-row, #view .kid-dir-row, #view .stock-row, #view .plan-row, #view .card')]
      .slice(0, 120)
      .forEach((el) => {
        if (!isVis(el) && el.children.length) {
          const r = el.getBoundingClientRect();
          if (r.height < 2 && r.width > 40) {
            collapses.push({ kind: 'zero-row', label: (el.className || '').toString().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) });
          }
        }
      });

    // Content permanently under dock (interactive, visible, center in dock band)
    const underDock = [];
    const interactives = [...document.querySelectorAll(
      '#view button, #view a, #view [role="button"], #view input, #view select, #view .m-row, #view .kid-dir-card'
    )];
    for (const el of interactives) {
      if (!isVis(el)) continue;
      if (el.closest('nav.dock, nav.kid-dock, #bottomPanel')) continue;
      const r = el.getBoundingClientRect();
      // permanently under = majority of control sits below dock top and above vh bottom
      const mid = (r.top + r.bottom) / 2;
      if (mid > dockTop + 4 && mid < vh - 2 && r.bottom > dockTop + 12) {
        const label = (el.innerText || el.getAttribute('aria-label') || el.className || '').replace(/\s+/g, ' ').trim().slice(0, 56);
        underDock.push({ label, mid: Math.round(mid), dockTop: Math.round(dockTop), bottom: Math.round(r.bottom) });
      }
    }

    // Sheet state
    const sheetOpen = body.classList.contains('sheet-open') || !!document.querySelector('.sheet.on, #sheet.on, .sheet[aria-hidden="false"]');
    const sheetEl = document.querySelector('#sheet.on, .sheet.on, #sheetHost .sheet, [aria-modal="true"]');
    let sheetInfo = null;
    if (sheetEl && isVis(sheetEl)) {
      const closeBtn = sheetEl.querySelector('.sheet-close, [data-sheet-close], #sheetClose, button[aria-label*="close" i], button[aria-label*="schließen" i], button[aria-label*="Κλείσιμο" i]');
      sheetInfo = {
        id: (sheetEl.id || sheetEl.className || '').toString().slice(0, 60),
        hasClose: !!closeBtn,
        closeVis: closeBtn ? isVis(closeBtn) : false,
        pe: getComputedStyle(sheetEl).pointerEvents,
      };
    }

    // Center-point element (what's trapping the middle of the screen)
    const midEl = document.elementFromPoint(vw / 2, vh / 2);
    const midInfo = midEl
      ? {
          tag: midEl.tagName,
          id: midEl.id,
          cls: (midEl.className || '').toString().slice(0, 80),
          pe: getComputedStyle(midEl).pointerEvents,
        }
      : null;

    return {
      label,
      tab: body.dataset.tab || '',
      childView: body.dataset.childView || window.state?.childView || '',
      bodyClasses: body.className,
      sheetOpen,
      sheetInfo,
      traps: traps.slice(0, 8),
      collapses: collapses.slice(0, 10),
      underDock: underDock.slice(0, 8),
      dockTop: Math.round(dockTop),
      midInfo,
      scrollW: document.documentElement.scrollWidth,
      vw,
    };
  }, label);
}

/** Click visible buttons and detect no-ops (DOM unchanged + no navigation) */
async function probeDeadTaps(page, scopeLabel, maxClicks = 12) {
  const buttons = await page.evaluate(() => {
    const vw = innerWidth;
    const vh = innerHeight;
    const dock = document.querySelector('nav.dock, nav.kid-dock, #bottomPanel');
    const dockTop = dock ? dock.getBoundingClientRect().top : vh;
    const out = [];
    const els = [...document.querySelectorAll(
      '#view button:not([disabled]), header button:not([disabled]), .sheet.on button:not([disabled]), #sheet.on button:not([disabled])'
    )];
    for (const el of els) {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 20 || r.height < 16) continue;
      if (r.top >= dockTop - 2) continue; // dock handled separately
      if (r.bottom < 0 || r.top > vh) continue;
      // Skip intentional rail chips that only scroll
      if (el.closest('.m-rail, .kids-pane-tabs, .planner-seg, .shop-panel-seg, .arcade-rail')) continue;
      const label = (el.innerText || el.getAttribute('aria-label') || el.id || '').replace(/\s+/g, ' ').trim().slice(0, 48);
      if (!label) continue;
      // Prefer primary-looking CTAs
      const primary = /btn-primary|primary|cta|Άνοιξε|Αποθήκ|Speichern|Save|Νέο|Neu|Hinzufügen|Έλεγχος|Kontrolle|Logout|Έξοδος/i.test(
        `${el.className} ${label}`
      );
      out.push({
        label,
        primary,
        x: Math.round(r.left + r.width / 2),
        y: Math.round(r.top + r.height / 2),
        cls: (el.className || '').toString().slice(0, 40),
      });
    }
    out.sort((a, b) => Number(b.primary) - Number(a.primary));
    return out.slice(0, 40);
  });

  const dead = [];
  let n = 0;
  for (const b of buttons) {
    if (n >= maxClicks) break;
    // Skip known chrome that opens sheets we will test separately
    if (/Mehr|Περισσότερα|More|Mitteil|Ειδοπ|Profil|Προφίλ/i.test(b.label) && scopeLabel.includes('dead')) continue;

    const before = await page.evaluate(() => ({
      html: document.querySelector('#view')?.innerHTML?.length || 0,
      tab: document.body.dataset.tab || '',
      sheet: document.body.classList.contains('sheet-open'),
      child: window.state?.childView || '',
      hash: location.hash,
      toast: document.querySelector('#toastHost')?.textContent || '',
    }));

    try {
      await page.mouse.click(b.x, b.y);
    } catch {
      continue;
    }
    n++;
    await page.waitForTimeout(280);

    const after = await page.evaluate(() => ({
      html: document.querySelector('#view')?.innerHTML?.length || 0,
      tab: document.body.dataset.tab || '',
      sheet: document.body.classList.contains('sheet-open'),
      child: window.state?.childView || '',
      hash: location.hash,
      toast: document.querySelector('#toastHost')?.textContent || '',
      disabledLooking: false,
    }));

    const changed =
      before.html !== after.html ||
      before.tab !== after.tab ||
      before.sheet !== after.sheet ||
      before.child !== after.child ||
      before.hash !== after.hash ||
      before.toast !== after.toast;

    if (!changed && b.primary) {
      dead.push(b);
    }

    // Close accidental sheets so we don't trap subsequent taps
    if (after.sheet && !before.sheet) {
      await page.evaluate(() => {
        document.querySelector('#sheetClose, .sheet-close, [data-sheet-close]')?.click();
        if (typeof closeSheet === 'function') closeSheet();
        document.body.classList.remove('sheet-open');
      });
      await page.waitForTimeout(150);
    }
  }
  return dead;
}

async function testSheetClose(page, openAction, name) {
  await openAction();
  await page.waitForTimeout(350);
  const opened = await page.evaluate(() => {
    return document.body.classList.contains('sheet-open') || !!document.querySelector('.sheet.on, #sheet.on, [aria-modal="true"]');
  });
  if (!opened) {
    add('P2', `${name}: sheet did not open`, 'Open action produced no sheet-open state');
    await shot(page, `${name}-no-open`);
    return;
  }
  const beforeShot = await shot(page, `${name}-open`);

  // Try close button
  const closedByBtn = await page.evaluate(() => {
    const btn = document.querySelector('#sheetClose, .sheet-close, [data-sheet-close], .sheet.on button[aria-label*="close" i]');
    if (btn) {
      btn.click();
      return true;
    }
    if (typeof closeSheet === 'function') {
      closeSheet();
      return true;
    }
    return false;
  });
  await page.waitForTimeout(300);
  let stillOpen = await page.evaluate(
    () => document.body.classList.contains('sheet-open') || !!document.querySelector('.sheet.on, #sheet.on')
  );

  if (stillOpen) {
    // backdrop tap
    await page.mouse.click(20, 40);
    await page.waitForTimeout(250);
    stillOpen = await page.evaluate(
      () => document.body.classList.contains('sheet-open') || !!document.querySelector('.sheet.on, #sheet.on')
    );
  }
  if (stillOpen) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    stillOpen = await page.evaluate(
      () => document.body.classList.contains('sheet-open') || !!document.querySelector('.sheet.on, #sheet.on')
    );
  }

  if (stillOpen) {
    const afterShot = await shot(page, `${name}-stuck`);
    add(
      'P0',
      `${name}: sheet cannot close`,
      `closeBtnAttempted=${closedByBtn}; body.sheet-open or .sheet.on remains`,
      ['sheet-open leftover', 'mobile/m-ui.css sheet-close', 'ui-v294.css'],
      afterShot
    );
    // Force cleanup for continued probing
    await page.evaluate(() => {
      try {
        if (typeof closeSheet === 'function') closeSheet();
      } catch {}
      document.body.classList.remove('sheet-open');
      document.querySelectorAll('.sheet.on, #sheet.on').forEach((el) => el.classList.remove('on'));
    });
  } else {
    await shot(page, `${name}-closed`);
    console.log(`  [ok] ${name} closed (shot ${beforeShot})`);
  }
}

async function assertInteractable(page, label) {
  const data = await probeChrome(page, label);
  const file = await shot(page, label);

  if (data.scrollW > data.vw + 8) {
    // Ignore intentional horizontal rails — only flag if mid-page element is trapping
    add('P1', `${label}: horizontal page overflow`, `scrollW=${data.scrollW} vw=${data.vw}`, ['mobile/m-ui.css overflow-x'], file);
  }

  for (const t of data.traps) {
    // Ignore known intentional dimmers while sheet is intentionally open — those are tested separately
    if (data.sheetOpen && /sheet|backdrop|scrim/i.test(t.id)) continue;
    if (/gate/i.test(t.id) && data.bodyClasses.includes('auth-pending')) continue;
    add(
      t.opaque ? 'P0' : 'P1',
      `${label}: pointer trap / leftover overlay`,
      `${t.id} pe=${t.pe} opacity=${t.opacity} z=${t.z} bg=${t.bg} sheetOpen=${t.bodySheetOpen}`,
      ['body.sheet-open', 'tutorial overlay', 'pointer-events', 'mobile/mobile.css'],
      file
    );
  }

  for (const c of data.collapses) {
    add(
      'P0',
      `${label}: layout collapse (${c.kind})`,
      `"${c.label}" ${c.w}×${c.h}`,
      ['grid-template-columns', 'writing-mode', 'mobile/m-ui.css !important'],
      file
    );
  }

  // Deduplicate under-dock by label prefix
  const seen = new Set();
  for (const u of data.underDock) {
    const key = u.label.slice(0, 24);
    if (seen.has(key)) continue;
    seen.add(key);
    add(
      'P1',
      `${label}: content under dock`,
      `"${u.label}" mid=${u.mid} dockTop=${u.dockTop}`,
      ['--m-dock-h', 'padding-bottom !important', 'mobile/m-ui.css #view', 'mobile/mobile.css'],
      file
    );
  }

  // Mid-point trap when sheet supposedly closed
  if (!data.sheetOpen && data.midInfo && /overlay|backdrop|tutorial|scrim|tip/i.test(`${data.midInfo.id} ${data.midInfo.cls}`)) {
    if (data.midInfo.pe !== 'none') {
      add(
        'P0',
        `${label}: mid-viewport blocked`,
        `elementFromPoint → ${data.midInfo.tag}#${data.midInfo.id}.${data.midInfo.cls}`,
        ['tutorial', 'tips overlay'],
        file
      );
    }
  }

  return data;
}

// ── CSS conflict skim (static) ─────────────────────────────────────────────
function skimCssConflicts() {
  const files = [
    path.join(ROOT, 'mobile', 'm-ui.css'),
    path.join(ROOT, 'mobile', 'mobile.css'),
    path.join(ROOT, 'ui-v294.css'),
  ];
  const notes = [];
  for (const f of files) {
    if (!fs.existsSync(f)) {
      notes.push({ file: path.basename(f), missing: true });
      continue;
    }
    const text = fs.readFileSync(f, 'utf8');
    const important = (text.match(/!important/g) || []).length;
    const pointerNone = (text.match(/pointer-events\s*:\s*none/gi) || []).length;
    const padBottomImp = (text.match(/padding-bottom:[^;]*!important/gi) || []).length;
    const displayNoneImp = (text.match(/display\s*:\s*none\s*!important/gi) || []).length;
    notes.push({
      file: path.relative(ROOT, f).replace(/\\/g, '/'),
      bytes: text.length,
      important,
      pointerNone,
      padBottomImp,
      displayNoneImp,
    });
  }

  // Specific conflict heuristics
  const mui = fs.readFileSync(path.join(ROOT, 'mobile', 'm-ui.css'), 'utf8');
  const mob = fs.readFileSync(path.join(ROOT, 'mobile', 'mobile.css'), 'utf8');
  if (/padding-bottom:\s*calc\(var\(--m-dock-h\)[^)]*\)\s*!important/.test(mui) && /padding-bottom:\s*12px\s*!important/.test(mui)) {
    notes.push({
      conflict: true,
      detail:
        'm-ui.css sets #view padding-bottom ~dock+56px !important, then .m-pocket/.pocket-cal-wrap padding-bottom:12px !important — can leave pocket calendar under dock',
      suspects: ['mobile/m-ui.css body.shell-m #view', 'mobile/m-ui.css .m-pocket / .pocket-cal-wrap'],
    });
  }
  if (/padding-bottom:\s*calc\(72px/.test(mob) && /padding-bottom:\s*calc\(var\(--m-dock-h\)/.test(mui)) {
    notes.push({
      conflict: true,
      detail: 'mobile.css uses fixed 72px bottom padding while m-ui.css uses --m-dock-h + 56px !important — order/specificity dependent',
      suspects: ['mobile/mobile.css', 'mobile/m-ui.css'],
    });
  }
  if (/section-shell-nav\s*\{\s*display:\s*none\s*!important/.test(mui) && /section-shell-nav\s*\{\s*display:\s*none\s*!important/.test(fs.readFileSync(path.join(ROOT, 'ui-v294.css'), 'utf8'))) {
    notes.push({
      conflict: false,
      detail: 'ui-v294.css duplicates section-shell-nav hide from m-ui.css (harmless redundancy outside #view sheets)',
      suspects: ['ui-v294.css', 'mobile/m-ui.css'],
    });
  }
  return notes;
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext(PHONE);
const page = await ctx.newPage();

page.on('pageerror', (err) => {
  pageErrors.push(err.message);
  console.log(`  [P0] pageerror: ${err.message}`);
});
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    const t = msg.text();
    if (/favicon|Download the React|net::ERR_FAILED|Failed to load resource/i.test(t)) return;
    consoleErrors.push(t);
  }
});

await page.addInitScript(() => {
  localStorage.setItem('paidia.lang', 'el');
  localStorage.setItem('paidia.uiMode', 'pro');
  localStorage.setItem('paidia.tourSeen', '1');
  localStorage.setItem('paidia.tipsSeen', '1');
  localStorage.setItem('paidia.pwaInstallDismiss', '1');
  localStorage.setItem('paidia.onboardingDone', '1');
});

const cssNotes = skimCssConflicts();
console.log('=== CSS skim ===');
cssNotes.forEach((n) => console.log(' ', JSON.stringify(n)));

// ═══ STAFF ════════════════════════════════════════════════════════════════
console.log('=== staff e4 ===');
await login(ctx, 'e4', 'staff');
await boot(page);
await assertInteractable(page, 'staff-home');

const staffTabs = ['schedule', 'stock', 'shop', 'talk', 'kids', 'pocket', 'gallery', 'book', 'admin'];
for (const tab of staffTabs) {
  await page.evaluate((t) => {
    state.tab = t;
    if (t === 'schedule') setScheduleView('day', { persist: false });
    if (t === 'admin') state.adminPane = 'ops';
    render();
    scrollTo(0, 0);
  }, tab);
  await page.waitForTimeout(300);
  await assertInteractable(page, `staff-${tab}`);
}

// Schedule week / calendar
for (const view of ['week', 'calendar']) {
  await page.evaluate((v) => {
    state.tab = 'schedule';
    setScheduleView(v, { persist: false });
    render();
    scrollTo(0, 0);
  }, view);
  await page.waitForTimeout(300);
  await assertInteractable(page, `staff-schedule-${view}`);
}

// Dead taps on home + stock + kids
await page.evaluate(() => {
  state.tab = 'home';
  render();
  scrollTo(0, 0);
});
await page.waitForTimeout(250);
let dead = await probeDeadTaps(page, 'staff-home-dead', 10);
for (const d of dead) {
  const file = await shot(page, `dead-staff-home-${d.label.replace(/\W+/g, '_').slice(0, 24)}`);
  add('P1', 'staff-home: button looks active but does nothing', `"${d.label}" @${d.x},${d.y}`, ['onclick missing', 'disabled styling'], file);
}

await page.evaluate(() => {
  state.tab = 'stock';
  render();
  scrollTo(0, 0);
});
await page.waitForTimeout(250);
dead = await probeDeadTaps(page, 'staff-stock-dead', 8);
for (const d of dead) {
  const file = await shot(page, `dead-staff-stock-${d.label.replace(/\W+/g, '_').slice(0, 24)}`);
  add('P1', 'staff-stock: dead primary tap', `"${d.label}"`, [], file);
}

// Sheets: notifs, user, more, stock check
await page.evaluate(() => {
  state.tab = 'home';
  render();
});
await testSheetClose(
  page,
  async () => {
    await page.locator('#btnNotifs').click({ timeout: 4000 }).catch(() => {});
  },
  'staff-notifs'
);

await testSheetClose(
  page,
  async () => {
    await page.locator('#btnUser').click({ timeout: 4000 }).catch(() => {});
  },
  'staff-user'
);

await testSheetClose(
  page,
  async () => {
    const clicked = await page.evaluate(() => {
      const b = document.querySelector('nav.dock button[data-tab="more"], #dockMore, #btnMore');
      if (b) {
        b.click();
        return true;
      }
      const byText = [...document.querySelectorAll('nav.dock button')].find((el) => /Mehr|Περισσότερα|More/i.test(el.textContent || ''));
      if (byText) {
        byText.click();
        return true;
      }
      return false;
    });
    if (!clicked) console.log('  more button missing');
  },
  'staff-more'
);

await page.evaluate(() => {
  state.tab = 'stock';
  render();
});
await testSheetClose(
  page,
  async () => {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('#view button')].find((el) => /Έλεγχος|Kontrolle|Check/i.test(el.textContent || ''));
      b?.click();
    });
  },
  'staff-stock-check'
);

// After sheet cycle, verify no leftover trap on home
await page.evaluate(() => {
  try {
    if (typeof closeSheet === 'function') closeSheet();
  } catch {}
  document.body.classList.remove('sheet-open');
  state.tab = 'home';
  render();
  scrollTo(0, 0);
});
await page.waitForTimeout(300);
await assertInteractable(page, 'staff-home-after-sheets');

// Tutorial leftover simulation: if tour can re-open
await page.evaluate(() => {
  try {
    localStorage.removeItem('paidia.tourSeen');
    if (typeof startTutorial === 'function') startTutorial();
    else if (typeof showTutorial === 'function') showTutorial();
  } catch {}
});
await page.waitForTimeout(400);
const tourProbe = await probeChrome(page, 'staff-tutorial');
if (tourProbe.traps.length || (tourProbe.midInfo && /tour|tutorial/i.test(`${tourProbe.midInfo.id} ${tourProbe.midInfo.cls}`))) {
  const file = await shot(page, 'staff-tutorial-trap');
  add(
    'P1',
    'staff: tutorial overlay present',
    `traps=${JSON.stringify(tourProbe.traps.slice(0, 2))} mid=${JSON.stringify(tourProbe.midInfo)}`,
    ['tutorial overlay', 'paidia.tourSeen'],
    file
  );
  await page.evaluate(() => {
    localStorage.setItem('paidia.tourSeen', '1');
    document.querySelectorAll('#tutorial, .tutorial, .tutorial-overlay').forEach((el) => el.remove());
    try {
      if (typeof endTutorial === 'function') endTutorial();
    } catch {}
  });
}

// ═══ CHILD ════════════════════════════════════════════════════════════════
console.log('=== child k1 ===');
await login(ctx, 'k1', 'child');
await boot(page);
await assertInteractable(page, 'kid-today');

const kidViews = ['games', 'rate', 'bonus', 'notes', 'plan', 'rewards', 'learn', 'gallery', 'pocket', 'regeln'];
for (const view of kidViews) {
  await page.evaluate((v) => {
    if (typeof goChildView === 'function') goChildView(v);
    else {
      state.childView = v;
      render();
    }
    scrollTo(0, 0);
  }, view);
  await page.waitForTimeout(300);
  await assertInteractable(page, `kid-${view}`);
}

await page.evaluate(() => {
  if (typeof goChildView === 'function') goChildView('today');
  else {
    state.childView = 'today';
    render();
  }
});
dead = await probeDeadTaps(page, 'kid-today-dead', 8);
for (const d of dead) {
  const file = await shot(page, `dead-kid-${d.label.replace(/\W+/g, '_').slice(0, 24)}`);
  add('P1', 'kid-today: dead primary tap', `"${d.label}"`, [], file);
}

// Kid more sheet
await testSheetClose(
  page,
  async () => {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('nav.kid-dock button, .kid-dock button, nav.dock button')].find((el) =>
        /Mehr|Περισσότερα|More|Άλλα/i.test(el.textContent || '')
      );
      b?.click();
    });
  },
  'kid-more'
);

await browser.close();

// Attach console/page errors as findings
for (const e of [...new Set(pageErrors)]) {
  add('P0', 'pageerror during navigation', e, ['app.js']);
}
for (const e of [...new Set(consoleErrors)].slice(0, 12)) {
  add('P1', 'console error during navigation', e.slice(0, 200), []);
}

// Rank
const rank = { P0: 0, P1: 1, P2: 2 };
findings.sort((a, b) => rank[a.sev] - rank[b.sev] || a.title.localeCompare(b.title));

// Deduplicate similar titles+detail
const uniq = [];
const keys = new Set();
for (const f of findings) {
  const k = `${f.sev}|${f.title}|${f.detail.slice(0, 80)}`;
  if (keys.has(k)) continue;
  keys.add(k);
  uniq.push(f);
}

const bySev = uniq.reduce((a, f) => ((a[f.sev] = (a[f.sev] || 0) + 1), a), {});

// Write REPORT.md
const lines = [];
lines.push('# Agent bugs — Armonia Paidia `/m/`');
lines.push('');
lines.push(`- **When:** ${new Date().toISOString()}`);
lines.push(`- **Server:** ${BASE}/m/`);
lines.push(`- **Auth:** pins.json staff \`e4\` / child \`k1\``);
lines.push(`- **Viewport:** iPhone 15 Pro 390×844`);
lines.push(`- **Counts:** ${JSON.stringify(bySev)} (unique ${uniq.length})`);
lines.push('');
lines.push('## Ranked findings');
lines.push('');

let i = 1;
for (const f of uniq) {
  lines.push(`### ${i}. [${f.sev}] ${f.title}`);
  lines.push('');
  lines.push(`- **Detail:** ${f.detail}`);
  if (f.suspects?.length) lines.push(`- **Suspects:** ${f.suspects.join(', ')}`);
  if (f.shot) lines.push(`- **Screenshot:** \`${f.shot}\``);
  lines.push('- **Repro:**');
  if (f.title.startsWith('staff') || f.title.includes('staff')) {
    lines.push('  1. Open `http://127.0.0.1:5173/m/` on phone viewport');
    lines.push('  2. Login staff profile `e4` with fixture PIN');
    lines.push('  3. Navigate to the screen named in the title');
    lines.push('  4. Observe the failure (trap / under-dock / dead tap / sheet)');
  } else if (f.title.startsWith('kid') || f.title.includes('kid')) {
    lines.push('  1. Open `http://127.0.0.1:5173/m/` on phone viewport');
    lines.push('  2. Login child profile `k1` with fixture PIN');
    lines.push('  3. Open the child view named in the title');
    lines.push('  4. Observe the failure');
  } else {
    lines.push('  1. Boot `/m/` authenticated as above');
    lines.push('  2. Navigate across staff + child docks while watching console');
  }
  lines.push('');
  i++;
}

lines.push('## CSS conflict skim');
lines.push('');
for (const n of cssNotes) {
  lines.push(`- ${JSON.stringify(n)}`);
}
lines.push('');
lines.push('## Notes');
lines.push('');
lines.push('- Intentional horizontal rails (`.m-rail`, pane tabs, shop seg) were excluded from dead-tap and overflow noise where possible.');
lines.push('- Under-dock findings flag controls whose vertical midpoint sits below the dock top — primary UX blockers.');
lines.push('- Sheet close tested via close button → backdrop → Escape; leftover `body.sheet-open` after all three is P0.');
lines.push('');

fs.writeFileSync(path.join(OUT, 'REPORT.md'), lines.join('\n'));
fs.writeFileSync(path.join(OUT, 'findings.json'), JSON.stringify({ at: new Date().toISOString(), cssNotes, findings: uniq, pageErrors, consoleErrors }, null, 2));

console.log(JSON.stringify({ unique: uniq.length, bySev, out: OUT }, null, 2));
process.exit(uniq.some((f) => f.sev === 'P0') ? 1 : 0);
