/**
 * Mobile tap-honesty auditor for /m/ (v294).
 * Hit-tests elementFromPoint vs dock at scrollY=0.
 *
 *   node scripts/qa-mobile-agent-tap-map.mjs
 *
 * Writes: docs/agents/MOBILE_AGENT_TAP_MAP_v294.md
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.PAIDIA_QA_BASE || 'http://127.0.0.1:5173';
const pins = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/marketing/.local-auth/pins.json'), 'utf8'),
);
const OUT_SHOT = path.join(ROOT, '.qa-screens', 'agent-tap-map-v294');
const REPORT = path.join(ROOT, 'docs/agents/MOBILE_AGENT_TAP_MAP_v294.md');
fs.mkdirSync(OUT_SHOT, { recursive: true });

const rows = [];

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
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function goTab(page, tab, extra = {}) {
  await page.evaluate(({ tab, extra }) => {
    state.tab = tab;
    Object.assign(state, extra);
    if (typeof render === 'function') render();
    window.scrollTo(0, 0);
  }, { tab, extra });
  await page.waitForTimeout(350);
  await page.evaluate(() => window.scrollTo(0, 0));
}

/**
 * Hit-test one or more selectors. Prefer first visible match.
 * For dock-owned controls, expectedHitDock=true means hitting dock is OK.
 * pick: 'first' | 'last' | 'lastInView' (last with center inside viewport)
 */
async function hitTest(page, { control, sels, dockSel = 'nav.dock', expectedHitDock = false, pick = 'first' }) {
  const result = await page.evaluate(
    ({ sels, dockSel, pick }) => {
      const isVis = (el) => {
        if (!el) return false;
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
        const r = el.getBoundingClientRect();
        return r.width > 2 && r.height > 2;
      };
      const inView = (el) => {
        const r = el.getBoundingClientRect();
        const cy = (r.top + r.bottom) / 2;
        return cy >= 0 && cy <= innerHeight && r.left < innerWidth && r.right > 0;
      };
      const dock =
        document.querySelector(dockSel) ||
        document.querySelector('nav.kid-dock') ||
        document.querySelector('#bottomPanel');
      const dockTop = dock ? Math.round(dock.getBoundingClientRect().top) : Math.round(innerHeight);
      const dockMatch = `${dockSel}, nav.kid-dock, #bottomPanel`;

      let el = null;
      let usedSel = null;
      const candidates = [];
      for (const sel of sels) {
        document.querySelectorAll(sel).forEach((node) => {
          if (isVis(node)) candidates.push({ node, sel });
        });
      }
      if (!candidates.length) {
        return { missing: true, dockTop, scrollY: Math.round(scrollY) };
      }
      if (pick === 'lastInView') {
        const inv = candidates.filter((c) => inView(c.node));
        if (!inv.length) return { missing: true, dockTop, scrollY: Math.round(scrollY), reason: 'none in view' };
        ({ node: el, sel: usedSel } = inv[inv.length - 1]);
      } else if (pick === 'last') {
        ({ node: el, sel: usedSel } = candidates[candidates.length - 1]);
      } else {
        ({ node: el, sel: usedSel } = candidates[0]);
      }

      const r = el.getBoundingClientRect();
      const cx = (r.left + r.right) / 2;
      const cy = (r.top + r.bottom) / 2;
      // Clamp for hit-test only when center is outside viewport (still report raw bottom)
      const cxHit = Math.min(Math.max(cx, 0), innerWidth - 1);
      const cyHit = Math.min(Math.max(cy, 0), innerHeight - 1);
      const hit = document.elementFromPoint(cxHit, cyHit);
      const hitDock = !!(hit && hit.closest(dockMatch));
      const clear = r.bottom < dockTop - 4;
      const hitSelf = !!(hit && (hit === el || el.contains(hit) || hit.closest?.(usedSel.split(',')[0].trim())));
      return {
        missing: false,
        usedSel,
        bottom: Math.round(r.bottom),
        top: Math.round(r.top),
        dockTop,
        clear,
        hitDock,
        hitSelf,
        scrollY: Math.round(scrollY),
        offscreen: cy < 0 || cy > innerHeight,
        hitTag: hit
          ? `${hit.tagName.toLowerCase()}${hit.id ? '#' + hit.id : ''}.${(hit.className || '')
              .toString()
              .split(/\s+/)
              .slice(0, 2)
              .join('.')}`
          : null,
        text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 36),
      };
    },
    { sels, dockSel, pick },
  );

  let notes = [];
  let pass = false;
  if (result.missing) {
    notes.push('not present / not visible');
    pass = null; // N/A — does not hurt score
  } else if (expectedHitDock) {
    // Dock items: must hit dock (themselves)
    pass = !!result.hitDock || !!result.hitSelf;
    if (!pass) notes.push(`dock miss → ${result.hitTag || '?'}`);
    else notes.push('dock self-hit OK');
  } else {
    pass = result.clear && !result.hitDock;
    if (result.hitDock) notes.push(`tap stolen → ${result.hitTag || 'dock'}`);
    else if (!result.clear) notes.push(`bottom≥dock−4 (overlap geometry)`);
    else if (!result.hitSelf) notes.push(`clear geom; hit=${result.hitTag || '?'} (not self)`);
    else notes.push('clear');
    if (result.offscreen) notes.push('center offscreen @scroll0');
  }
  if (!result.missing && result.scrollY !== 0) notes.push(`scrollY=${result.scrollY}`);

  const row = {
    control,
    clear: result.missing ? '—' : result.clear,
    hitDock: result.missing ? '—' : result.hitDock,
    bottom: result.missing ? '—' : result.bottom,
    dockTop: result.dockTop ?? '—',
    notes: notes.join('; '),
    pass,
    expectedHitDock,
    raw: result,
  };
  rows.push(row);
  console.log(
    JSON.stringify({
      control,
      clear: row.clear,
      hitDock: row.hitDock,
      bottom: row.bottom,
      dockTop: row.dockTop,
      notes: row.notes,
      pass,
    }),
  );
  return row;
}

function scoreRows(list) {
  const judged = list.filter((r) => r.pass !== null);
  if (!judged.length) return { score: 0, pass: 0, fail: 0, na: list.length };
  const pass = judged.filter((r) => r.pass).length;
  const fail = judged.length - pass;
  // 10 = all pass; each fail −1.1 capped; missing N/A ignored
  const raw = 10 * (pass / judged.length);
  const score = Math.max(0, Math.min(10, Math.round(raw * 10) / 10));
  return { score, pass, fail, na: list.length - judged.length, judged: judged.length };
}

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
  localStorage.setItem('paidia.onboardingDone', '1');
});

// ── Staff ──────────────────────────────────────────────────────────────
await login(ctx, 'e4', 'staff');
await boot(page);
await goTab(page, 'home');
await page.screenshot({ path: path.join(OUT_SHOT, 'staff-home.png') });

await hitTest(page, {
  control: 'staff home .home-bento-tile',
  sels: ['.home-bento-tile', '#view .home-bento-m2 .home-bento-tile'],
});
await hitTest(page, {
  control: 'staff home .m-cta .m-primary',
  sels: ['.m-cta .m-primary', '.m-cta .btn.m-primary', '#view .m-cta button.m-primary'],
});

await goTab(page, 'book');
await page.screenshot({ path: path.join(OUT_SHOT, 'staff-book.png') });
await hitTest(page, {
  control: 'staff book #shiftNoteSave',
  sels: ['#shiftNoteSave'],
});

await goTab(page, 'talk');
await page.waitForTimeout(400);
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: path.join(OUT_SHOT, 'staff-talk.png') });
await hitTest(page, {
  control: 'staff talk compose',
  sels: ['.talk-compose', '.chat-compose', '#view .m-talk .talk-compose', '#view textarea'],
});

await goTab(page, 'shop');
await page.screenshot({ path: path.join(OUT_SHOT, 'staff-shop.png') });
await hitTest(page, {
  control: 'staff shop sticky/progress',
  sels: [
    '.store-finish.bottom-dock',
    '.store-finish',
    '#confirmBatch',
    '#btnReceipt',
    '.m-sticky',
    '.sticky-bar',
    '[data-sticky-chrome]',
    '.shop-progress',
  ],
});

await goTab(page, 'stock');
await page.screenshot({ path: path.join(OUT_SHOT, 'staff-stock.png') });
await hitTest(page, {
  control: 'staff stock last +/-',
  sels: ['.lager-step-btn', '.stock-step', '.stock-stepper button', '.lager-stepper button'],
  pick: 'lastInView',
});

// ── Kid ────────────────────────────────────────────────────────────────
await login(ctx, 'k1', 'child');
await boot(page);
await page.screenshot({ path: path.join(OUT_SHOT, 'kid-home.png') });

const kidDockCount = await page.evaluate(
  () => document.querySelectorAll('nav.kid-dock button, .kid-dock button').length,
);
for (let i = 0; i < Math.max(kidDockCount, 1); i++) {
  await hitTest(page, {
    control: `kid dock item[${i}]`,
    sels: [`nav.kid-dock button:nth-of-type(${i + 1})`, `.kid-dock button:nth-of-type(${i + 1})`],
    dockSel: 'nav.kid-dock',
    expectedHitDock: true,
  });
}

await hitTest(page, {
  control: 'kid home bonus tile',
  sels: [
    '.kid-home-cta-tile[data-child-view="bonus"]',
    '[data-child-view="bonus"].kid-home-cta-tile',
    '#view .kid-home-cta-tile[data-child-view="bonus"]',
  ],
  dockSel: 'nav.kid-dock',
});
await hitTest(page, {
  control: 'kid home pocket tile',
  sels: [
    '.kid-home-cta-tile[data-child-view="pocket"]',
    '[data-child-view="pocket"].kid-home-cta-tile',
    '#view .kid-home-cta-tile[data-child-view="pocket"]',
  ],
  dockSel: 'nav.kid-dock',
});

// ── Aria labels at 320px ───────────────────────────────────────────────
await page.setViewportSize({ width: 320, height: 568 });
await page.evaluate(() => {
  if (typeof render === 'function') render();
  window.scrollTo(0, 0);
});
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT_SHOT, 'kid-dock-320.png') });

const ariaKid = await page.evaluate(() => {
  const shell = document.body.classList.contains('shell-m');
  const btns = [...document.querySelectorAll('nav.kid-dock button, nav.dock button')].filter((b) => {
    const r = b.getBoundingClientRect();
    return r.width > 4 && r.height > 4;
  });
  return {
    shell,
    count: btns.length,
    items: btns.map((b) => ({
      text: (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 24),
      aria: (b.getAttribute('aria-label') || '').trim(),
      hasAria: !!(b.getAttribute('aria-label') || '').trim(),
    })),
  };
});

// Also check staff dock at 320
await login(ctx, 'e4', 'staff');
await boot(page);
await page.setViewportSize({ width: 320, height: 568 });
await page.evaluate(() => {
  state.tab = 'home';
  if (typeof render === 'function') render();
  window.scrollTo(0, 0);
});
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT_SHOT, 'staff-dock-320.png') });

const ariaStaff = await page.evaluate(() => {
  const shell = document.body.classList.contains('shell-m');
  const btns = [...document.querySelectorAll('nav.dock button')].filter((b) => {
    const r = b.getBoundingClientRect();
    return r.width > 4 && r.height > 4;
  });
  return {
    shell,
    count: btns.length,
    items: btns.map((b) => ({
      text: (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 24),
      aria: (b.getAttribute('aria-label') || '').trim(),
      hasAria: !!(b.getAttribute('aria-label') || '').trim(),
    })),
  };
});

await browser.close();

const scoring = scoreRows(rows);
const ariaStaffOk = ariaStaff.shell && ariaStaff.count > 0 && ariaStaff.items.every((i) => i.hasAria);
const ariaKidOk = ariaKid.shell && ariaKid.count > 0 && ariaKid.items.every((i) => i.hasAria);
const ariaOk = ariaStaffOk && ariaKidOk;

// Soft: if aria fails, −0.5 from score (still report)
let finalScore = scoring.score;
if (!ariaOk) finalScore = Math.max(0, Math.round((finalScore - 0.5) * 10) / 10);

const ts = new Date().toISOString();
const md = [];
md.push('# Mobile agent tap map — v294');
md.push('');
md.push(`**Generated:** ${ts}`);
md.push(`**Base:** ${BASE}/m/ · **Pins:** e4 staff / k1 kid · **Device:** Chromium + iPhone 15 Pro **390×844**`);
md.push(`**Method:** \`scrollY=0\` · control center via \`document.elementFromPoint\` vs \`nav.dock\` / \`nav.kid-dock\``);
md.push(`**Shots:** \`.qa-screens/agent-tap-map-v294/\``);
md.push('');
md.push(`## Overall tap score: **${finalScore} / 10**`);
md.push('');
md.push(
  `Judged ${scoring.judged} controls → ${scoring.pass} pass / ${scoring.fail} fail · ${scoring.na} N/A (missing). ` +
    `Aria @320: staff ${ariaStaffOk ? 'OK' : 'FAIL'} · kid ${ariaKidOk ? 'OK' : 'FAIL'}.`,
);
md.push('');
md.push('| control | clear | hitDock | bottom | dockTop | notes |');
md.push('|---------|:-----:|:-------:|-------:|--------:|-------|');
for (const r of rows) {
  const clear = r.clear === '—' ? '—' : r.clear ? 'yes' : 'no';
  const hd = r.hitDock === '—' ? '—' : r.hitDock ? 'yes' : 'no';
  md.push(`| ${r.control} | ${clear} | ${hd} | ${r.bottom} | ${r.dockTop} | ${r.notes} |`);
}
md.push('');
md.push('## Aria labels @ viewport 320 (`body.shell-m`)');
md.push('');
md.push('### Staff `nav.dock`');
md.push(`- shell-m: **${ariaStaff.shell}** · visible buttons: **${ariaStaff.count}** · all have aria-label: **${ariaStaffOk}**`);
for (const i of ariaStaff.items) {
  md.push(`  - \`${i.text || '(icon)'}\` → aria="${i.aria || 'MISSING'}"`);
}
md.push('');
md.push('### Kid `nav.kid-dock` / dock');
md.push(`- shell-m: **${ariaKid.shell}** · visible buttons: **${ariaKid.count}** · all have aria-label: **${ariaKidOk}**`);
for (const i of ariaKid.items) {
  md.push(`  - \`${i.text || '(icon)'}\` → aria="${i.aria || 'MISSING'}"`);
}
md.push('');
md.push('## Scoring');
md.push('');
md.push('- Pass = geometry clear of dock (`bottom < dockTop − 4`) **and** `elementFromPoint` does not land in dock (content controls).');
md.push('- Dock items: pass if hit lands in dock (self).');
md.push('- Missing / not visible = N/A (excluded from denominator).');
md.push('- Aria miss @320 subtracts 0.5.');
md.push('');
md.push('```json');
md.push(JSON.stringify({ score: finalScore, scoring, ariaStaff, ariaKid, rows }, null, 2));
md.push('```');
md.push('');

fs.writeFileSync(REPORT, md.join('\n'), 'utf8');
fs.writeFileSync(path.join(OUT_SHOT, 'report.json'), JSON.stringify({ score: finalScore, scoring, rows, ariaStaff, ariaKid }, null, 2));
console.log('\n=== TAP SCORE ===', finalScore, '/10');
console.log('Wrote', REPORT);
process.exit(scoring.fail > 0 || !ariaOk ? 1 : 0);
