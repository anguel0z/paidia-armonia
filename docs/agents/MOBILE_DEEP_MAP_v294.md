# Mobile deep map — brand + anti-slop rating (v294)

**Scope:** `/m/` only · **Profile:** staff `e4`, child `k1` · **Viewport:** 390×844 · **Locale:** EL / pro  
**Evidence:** `.qa-screens/live-check-2026-09-15-22-41/` (full tab walk), `.qa-screens/deep-slop/` (fresh Playwright subset), `.qa-screens/agent-aspects-v294b/`, `.qa-screens/m-audit-294/` (0 page-overflow P0), consolidated QA in `MOBILE_QA_CONSOLIDATED_v294.md`  
**Brand bar:** pine `#2a6b52`, mineral stone, **Fraunces** display + **Outfit** UI — flag purple / warm cream / editorial “newspaper” stacks

---

## Overall score: **7.6 / 10** *(retest 2026-09-16 after dock-collision pass)*

Staff shell is on-brand and shippable at 390×844: home bento + book save + talk compose clear the dock; kid idle next-up gone; EL units via `unitLabel()`. Residual drag is still **Λίστα** sticky chrome and a few editorial / cream surfaces — not tap theft on core CTAs.

| Axis | Score | One-line read |
|------|------:|---------------|
| **Brand** | **7.5** | Pine/mineral/fonts land on most staff surfaces; pink avatar disks, peach stock badges, shop cream field, and kid cream bonus tile still drift. |
| **Hierarchy** | **7.2** | Home now shift → bento → CTA (bento above fold); stock/book still stack cards; shop overlap remains the worst scan break. |
| **Density** | **7.0** | Compacted shift card + early bento; book/plan still multi-surface; pocket/admin breathe. |
| **Tap honesty** | **8.6** | Live-check CTAs clear dock; [buttons/sheets](66091a8d-c644-46f4-bbdc-52cd86f54b1a) **10/10** interaction (0 dead, sheets clean); residual under-dock is list tails at scroll 0 + shop sticky. |
| **Consistency** | **7.2** | Staff 4+Άλλα / kid 3+Άλλα hold with aria-labels; shop shopping-mode chrome still a second design system. |
| **Anti-slop** | **6.7** | [Slop/kid](f75e978f-ec79-4a83-9707-f53ce183601f): purple/DE/tab bars Pass; cream + newspaper Watch; shop sticky **Fail**. |

---

## Screen map (390×844, EL/pro)

Screenshots: `live-check-2026-09-15-22-41/02-staff-*.png`, `04-kid-home.png`, `deep-slop/*.png`

| Screen | Route / tab | Visual grade | Brand slop flags | Layout / tap | Primary evidence |
|--------|-------------|:------------:|------------------|--------------|------------------|
| **Home** | `tab=home` | **7.8** | Mineral OK; pink profile | Shift owns fold; mixed CTA weights P2 | [Staff rate](d2047fdb-5c8a-450c-b4e3-3cb866288617) |
| **Plan** | `schedule` | **8.2** | Pine day chip + gold rim | Cleanest staff surface; empty-week zeros P2 | same |
| **Stock** | `stock` | **7.6** | Real product photos ✓ | Stepper hit P1; double H1 P2 | same |
| **Shop** | `shop` | **6.5** | Cream shopping chrome | Finish bar clears dock (post-fix); brand drift remains | [Tap map](95b90dbe-cdaa-479a-8ca2-676567b0d582) + fix |
| **Kids** | `kids` | **7.1** | Pastel letter tiles OK | Last-row under-dock P1 at scroll 0 | same |
| **Pocket** | `pocket` | **7.7** | Dark pine hero on-brand | Chip grid clear | same |
| **Book** | `book` | **7.3** | Fraunces date ✓ | Save fixed above dock; newspaper card Watch | same |
| **Admin** | `admin` (ops) | **7.0** | Cream hero watch | Desk stats hidden; attention stack | same |
| **Kid portal** | child `/m/` | **7.5** | Pine welcome + cream **Μπόνους** tile | Idle next-up removed; dock 3+Άλλα; welcome still owns fold | `04-kid-home.png` |

**Kid sub-views (spot):** games (`05-kid-games.png`) — mineral list OK; More sheet (`06-kid-more.png`) — pocket/notes correctly off primary dock.

---

## Severity heatmap (visual + slop, `/m/` only)

Legend: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low

| Screen | Brand | Hierarchy | Density | Tap | Slop | Net |
|--------|:-----:|:---------:|:-------:|:---:|:----:|:---:|
| Home | 🟢 | 🟢 | 🟢 | 🟢 | 🟡 | 🟢 |
| Plan | 🟢 | 🟢 | 🟢 | 🟢 | 🟡 | 🟢 |
| Stock | 🟢 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 |
| **Shop** | 🟡 | 🟡 | 🟠 | 🟢 | 🟡 | 🟡 |
| Kids | 🟢 | 🟢 | 🟡 | 🟡 | 🟢 | 🟡 |
| Pocket | 🟢 | 🟢 | 🟢 | 🟡 | 🟢 | 🟢 |
| Book | 🟢 | 🟡 | 🟡 | 🟢 | 🟡 | 🟢 |
| Admin | 🟡 | 🟡 | 🟢 | 🟢 | 🟠 | 🟡 |
| Kid portal | 🟢 | 🟡 | 🟡 | 🟢 | 🟡 | 🟢 |

**Cross-cutting (all tabs):** pink “A” avatar (🟡 brand); header tool cluster always four circles (🟢 consistency); no purple detected (🟢).

---

## Anti-slop inventory (pass / watch / fail)

| Pattern | Verdict | Where |
|---------|---------|--------|
| Purple / violet UI chrome | **Pass** | Not seen in v294 captures |
| Warm cream page fill + editorial hero | **Watch** | Admin ops hero; shop list background; kid bonus CTA |
| Newspaper triple-deck cards | **Watch** | Home shift start; Book handoff stack |
| Empty placeholder circles | **Pass** | Home bento uses real icons (2 tiles) |
| Duplicate page titles | **Watch** | Stock (and similar on other tabs with in-body H1) |
| DE units in EL | **Watch** | Shop row `1 Stk`; stock uses `τμχ` ✓ |
| Generic AI tab bar (6+ icons) | **Pass** | Staff 5 + kid 4 (3+Άλλα) |
| Broken sticky / floating CTA | **Fail** | Shop progress + receipt strip over list items |

---

## Top 10 fixes (ordered)

1. **Shop sticky footer / progress bar** — isolate in non-overlapping layer (`position` + `z-index` + list `padding-bottom` ≥ footer height); verify at 390×844 with 3+ open items. *Unblocks tap honesty + anti-slop.*
2. **Shop EL units** — route list quantities through `unitLabel()` (`Stk` → `τμχ`) same as stock.
3. **Shop visual mode** — reduce cream shopping canvas; align list rows with mineral `--glass` cards used in stock (keep pine header if needed, not a second design system).
4. **Admin ops hero** — replace cream Fraunces “newspaper” intro with one line + pine/mineral stat row (match pocket hero language).
5. **Book de-duplication** — hide stock-check promo on `/m/` when home shift card already surfaced today (or single deep-link from home only).
6. **Plan empty chrome** — hide week `0 / 0 / 0` triplet when all zero on `/m/` (day-first already fixed; week strip still slop).
7. **Home composition** — collapse shift card to **one** primary + two text links OR merge three green CTAs into secondary row (pick one hero, not both card + triple buttons).
8. **In-body H1 dedupe** — on `/m/`, let shell title own the name; demote `#view` H1 to sr-only or remove where chrome already shows tab label.
9. **Kid welcome banner** — auto-dismiss after first confirm; shrink to chip on repeat visits (kid home should lead with “Η μέρα σου”, not product tour).
10. **Avatar + accent cleanup** — pine/mineral ring avatars instead of pink fill; kid bonus tile mint/pine tint instead of cream peach (keep delight via icon, not warm slop).

---

## Retest checklist

```bash
# Server required
node scripts/qa-mobile-live-check.mjs
node scripts/qa-hit-dock-cta.mjs
```

Fresh subset captures (staff home/stock/book + kid home) live in `.qa-screens/deep-slop/` (Playwright, 390×844, el/pro).

**Pass gates for v294.1:** shop screenshot with zero overlap; admin hero on mineral; kid home without full welcome after dismiss; `live-check` REPORT `ok: true` retained.

---

## Agent fleet follow-up (2026-09-16) — fixes applied

| Agent | Score / finding | Fix |
|-------|-----------------|-----|
| [Deep kid](c2d2a09c-4c0e-4f1a-9ac7-bbae64612927) | P0 next-up under dock → rate | Idle `next-up` removed on `/m/` (games via dock) |
| [Book/admin/talk](e72eada6-2cb4-4aaa-9510-efdb65c37dc8) | Talk compose P0; book save P1; admin tiles P1 | Sticky talk compose above dock; `#shiftNoteSave` margin; hide `.admin-ops-desk-stats` |
| [Fold/landscape](2b0674d8-227e-409e-8dc0-7dad694594f1) | Dock a11y P0 ≤360 | `aria-label` on staff `data-tab` + kid dock buttons |
| [Aspects](042e9f98-b843-4efa-bc89-629d0ce530c3) | 0 P0, sticky-cover P1s | Tracked; 375+768 PASS |
| [Anti-slop](704582ad-ddf6-4d12-a43a-8264c2405523) | Shop Stk + sticky | `unitLabel()` on shop rows; shop pad |

**Retest signals:** kid `nextUp:false`; talk compose `aboveDock:true`; admin deskStats `display:none`; staff dock aria at 320 present.

### Pass 2026-09-16 (dock collisions)

| Check | Result |
|-------|--------|
| Home `.home-bento-tile` | `clear:true hitDock:false` (top ~427 / dock 780) — bento moved under shift; shift compacted |
| Book `#shiftNoteSave` | fixed bar above dock (`bottom:762` / dock `780`); `#view overflow-x:clip` broke sticky |
| `qa-mobile-live-check.mjs` | `ok: true`, findings `[]` → `.qa-screens/live-check-2026-09-15-22-51/` |

### Pass 2026-09-16 — [Buttons/sheets](66091a8d-c644-46f4-bbdc-52cd86f54b1a)

| Check | Result |
|-------|--------|
| Interaction | **10/10** — 28 probes, **0** dead/blocked (staff home + kid today) |
| Sheets | **4/4** clean — notifs, user→account tab, Άλλα/Mehr, stock shift-check; `#sheetBg` orphan=false |
| Harness | Probe now prefers visible `nav.kid-dock` (was filtering all kid CTAs via hidden staff dock) |
| Artifacts | `.qa-screens/deep-buttons/` (`REPORT.md`, `report.json`) |

### Pass 2026-09-16 — [Slop/kid](f75e978f-ec79-4a83-9707-f53ce183601f)

| Axis | Score |
|------|------:|
| Anti-slop | **6.7** |
| Kid portal | **7.5** |

Gates: purple / DE units / tab bars **Pass**; cream editorial + newspaper **Watch**; shop sticky **Fail**. Full notes: `MOBILE_AGENT_SLOP_KID_RATE_v294.md`.

### Pass 2026-09-16 — [Staff rate](d2047fdb-5c8a-450c-b4e3-3cb866288617)

Staff visual overall **7.2/10** (Schedule **8.2** lead · Shop **5.2** P0 sticky). Per-screen table + top fixes: `MOBILE_AGENT_STAFF_RATE_v294.md`.

### Known P0 — [Shop/fold](c4013566-da6d-4dc9-96df-20266be3adf1) → **fixed**

Was: `.store-finish` overlapped dock **58px**. Now: fixed above dock (`bottom` = `--m-dock-h+6`, `z:48`) — verified clear at 280/375/390 (`overlap:-14`).

### Pass 2026-09-16 — [Tap map](95b90dbe-cdaa-479a-8ca2-676567b0d582)

Tap score **7.5/10** (pre-shop-fix). Home/talk/kid clear; shop sticky + stock last± P1 under-dock; book `#shiftNoteSave` bottom `1481` = harness false positive (fixed bar needs layout wait — live clear). Aria @320 OK. Doc: `MOBILE_AGENT_TAP_MAP_v294.md`.

### Stress fleet launched 2026-09-16

Index: `MOBILE_UI_STRESS_FLEET_v294.md` — overflow/OOB, unresponsive, aspects, fullscreen-fill, bug sweep + `qa-mobile-ui-stress-bounds.mjs`.

### Pass 2026-09-16 — [Aspects full](3767693a-9cb5-44c0-8eec-9270722f5021)

Pre-fix: **6 Pass / 3 Warn / 3 Fail** (fails: 280, 667×375, 844×390 shop finish). **Post-fix recheck:** those three finish bars clear dock. No page H-overflow; full-bleed intentional OK. Doc: `MOBILE_AGENT_ASPECTS_FULL_v294.md`.

### Pass 2026-09-16 — [UI bugs](8362d3ae-cead-4e05-ab66-e15d1f73b893) + [Unresponsive](467a2aed-4848-440f-9739-1d273eee7a73)

| Finding | Disposition |
|---------|-------------|
| Shop finish↔dock | **Cleared** (confirmed by both agents) |
| `#pwaInstallBar` sticky wars / kid z:61 | **Fixed** — hidden on talk/book/shop/store-fs/child; z≤34 otherwise |
| Talk/book “offscreen fixed” | **Fixed** — `syncShellMFixedChrome()` teleports bars to `#mFixedChrome` on `body` (overflow-x:clip on ancestors was the CB trap); route-enter opacity-only; PWA hidden on talk/book/shop |
| Stock last ± → dock @ scroll 0 | **P1** — list-tail under sticky dock (scroll-padding added); not a dead control |
| Sheets orphan `#sheetBg` | **Cleared** |

Docs: `MOBILE_AGENT_UI_BUGS_SWEEP_v294.md`, `MOBILE_AGENT_UNRESPONSIVE_v294.md`.

### Pass 2026-09-16 — [Fullscreen fill](fdf26bba-d17b-4282-ae1a-87700b580f6a) + [Overflow/OOB](e8954703-702d-4678-ae5a-fa7770e601f2)

| Finding | Disposition |
|---------|-------------|
| `#view` / sheets fill | **PASS** — intentional |
| `.store-page` z:60 steals dock | **Fixed** — store-page z:40 + inset above dock; `#bottomPanel` z:55 (`hitDock:true`) |
| Kid `.kid-hero` asymmetric bleed | **Fixed** — `--stage-pad-x`←`--m-pad`; full width 0…390 |
| Talk/book/landscape finish P0s in OOB report | **Stale vs teleport + shop finish fixes** — recheck recommended |
| Fold finish crush / rail peeks | **P1/P2** — residual polish |

Docs: `MOBILE_AGENT_FULLSCREEN_FILL_v294.md`, `MOBILE_AGENT_OVERFLOW_OOB_v294.md`.

---

## Related docs (unchanged)

Overhaul backlog and shipped items remain in `MOBILE_UI_OVERHAUL_NOTES_v294.md`. Fleet matrices: `MOBILE_QA_CONSOLIDATED_v294.md`, `MOBILE_QA_FLEET_v294.md`.
