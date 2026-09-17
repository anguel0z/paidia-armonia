# Mobile agent — intentional fullscreen / fill audit v294

**Generated:** 2026-09-15T23:05:00.000Z  
**Base:** http://127.0.0.1:5173/m/ · **Pins:** e4 staff / k1 kid  
**Viewports:** 390×844, 375×667, landscape 844×390  
**Shots:** `.qa-screens/agent-fullscreen-fill-v294/`  
**Product code:** unchanged (audit only)  
**Method:** Playwright geometry + `elementFromPoint` hit tests + screenshots

## Score: **14 PASS / 5 FAIL** (19 checks)

## Verdict table

| Surface | Viewport | Result | Intentional fill? | Notes |
|---------|----------|--------|-------------------|-------|
| `body.shell-m` `#view` width fill | 390×844 | **PASS** | yes | `#view` = 390px edge-to-edge; pad L/R 10–14px; bottom ≈120–128px (dock + safe-area) |
| `body.shell-m` `#view` width fill | 375×667 | **PASS** | yes | same pattern @ 375px |
| `body.shell-m` `#view` width fill | 844×390 | **PASS** | yes | fills 844px; pad preserved in landscape |
| `body.shell-m` `#view` width fill (kid) | 390×844 | **PASS** | yes | pad L/R 14px; bottom 128px (`--kid-dock-h`) |
| `body.shell-m` `#view` width fill (kid) | 375×667 | **PASS** | yes | same |
| `body.shell-m` `#view` width fill (kid) | 844×390 | **PASS** | yes | same |
| `#sheetBg` closed | 390×844 | **PASS** | yes (must NOT fill) | `display:none`; belt in `ui-v294.css` |
| `#sheetBg` closed | 375×667 | **PASS** | yes (must NOT fill) | same |
| `#sheetBg` closed | 844×390 | **PASS** | yes (must NOT fill) | same |
| `#sheetBg` open fill | 390×844 | **PASS** | yes | fills 390×844 when sheet open |
| `#sheetBg` open fill | 375×667 | **PASS** | yes | fills 375×667 |
| `#sheetBg` open fill | 844×390 | **PASS** | yes | fills 844×390 |
| `store-fullscreen` shop + pending | 390×844 | **FAIL** | mode yes / dock no | Class intentional; `.store-finish` sits ABOVE dock (0px overlap); **dock taps stolen by `.store-page` z:60** |
| `store-fullscreen` shop + pending | 375×667 | **FAIL** | mode yes / dock no | same hit-steal pattern (finish geometry OK) |
| `store-fullscreen` shop + pending | 844×390 | **FAIL** | mode yes / dock no | finish still above dock; store-page still covers dock hits |
| Kid welcome vs content + dock | 390×844 | **FAIL** | mixed | `.kid-first-run` inset card = intentional; `.kid-hero` bleed **broken** (left 0 / right 362 of 390); dock = intentional floating pill (±10px) |
| Kid welcome vs content + dock | 375×667 | **FAIL** | mixed | same pattern |
| Kid welcome vs content + dock | 844×390 | **FAIL** | mixed | same pattern |
| Landscape compress vs break | 844×390 staff | **PASS** | yes | compresses; no overflow-x; view fills; chrome readable |
| Landscape compress vs break | 844×390 kid | **PASS** | yes | same |

*(Sheet closed checked twice per portrait staff pass — both PASS; table collapses duplicates.)*

## Recheck 2026-09-16 (post-fix)

| Issue | Result |
|-------|--------|
| `.store-page` steals dock | **PASS** — z:40, inset above dock; `#bottomPanel` z:55; `hitDock:true` @390 |
| Kid `.kid-hero` bleed | **PASS** — left 0 / right 390 @390 |

---

## Surface summary

### 1. `body.shell-m` — `#view` fill

- **Overall: PASS · intentional**
- `#view` is `width:100% / max-width:100vw` with horizontal `--m-pad` (14px staff kid / ~10px some staff routes) and bottom pad `calc(var(--m-dock-h) + safe-area + 20px)`.
- Edge-to-edge means the **stage column**, not zero padding on cards. Content cards stay inset by design.
- Shots: `390x844/01-staff-home.png`, `375x667/01-staff-home.png`, `844x390/01-staff-home.png`

### 2. `body.store-fullscreen` (tab=shop, pending list)

- **Overall: FAIL · mode intentional, dock reachability bug**
- `app.js` toggles `store-fullscreen` when Friday list has `pending` — immersive shopping is **by design**.
- `mobile/m-ui.css` keeps `#bottomPanel { display:flex !important }` and pads `.store-page` for the dock — **intent** is dock stays visible + reachable.
- Geometry: `.store-finish.bottom-dock` is `position:fixed; bottom:78px; z:48` → sits **ABOVE** dock (dock top ≈780 @844h / ≈326 @390h); overlap **0px**. Finish buttons hit-test **SELF_OK**.
- Bug: `.store-page` is `position:fixed; inset:0; z-index:60` (base CSS says 35; live computed 60) while `#bottomPanel` is z:50. `elementFromPoint` on Home dock button → **`store-page`**, not dock. Dock is painted but **not tappable**.
- Shots: `*/04-staff-shop-store-fs.png`

| Question | Answer |
|----------|--------|
| Is fullscreen intentional? | **Yes** (pending shopping mode) |
| Does `#bottomPanel`/dock remain reachable? | **No** (visible, tap-blocked by `.store-page`) |
| Does `.store-finish` sit above dock or cover it? | **Above** (good geometry); finish itself works |

### 3. Sheets / `#sheetBg`

- **Overall: PASS · intentional when open, correctly empty when closed**
- Open: `.sheet-bg.on` → `position:fixed; inset:0` fills viewport.
- Closed: `display:none` + `body.shell-m:not(.sheet-open) #sheetBg { display:none !important }` belt.
- Shots: `*/02-staff-sheet-open.png`, `*/03-staff-sheet-closed.png`

### 4. Kid portal — welcome / hero / dock

- **Overall: FAIL (hero bleed) · dock intentional non-edge**
- **Welcome** `.kid-first-run`: inset card @ left 14 / width 362 — **intentional card**, not full-bleed.
- **Hero** `.kid-header.kid-hero`: CSS intends full-bleed (`margin-inline: -14px`; `width: calc(100% + 2*stage-pad)`), but live box is **left 0, right 362, w 362** on 390 — asymmetric / incomplete bleed (**bug**). `--stage-pad-x` is empty; `--m-pad` is 14px.
- **Dock**: `#bottomPanel.is-kid-chrome` is `left:10px; right:10px` floating pill — **intentional**, not staff-style edge-to-edge. Treat “dock always edge-to-edge” as **N/A for kid** (different chrome language).
- Shots: `*/06-kid-today.png`, `844x390/07-kid-landscape.png`

### 5. Landscape 844×390

- **Overall: PASS · intentional compress**
- Staff + kid: no `overflow-x`; `#view` fills width; UI shortens vertically rather than breaking into horizontal scroll.
- Shop landscape still has the store-page/dock tap bug (counted under store-fullscreen, not landscape break).
- Shots: `844x390/05-staff-landscape-home.png`, `844x390/07-kid-landscape.png`

## Intentional vs bug criteria

| Surface | Intentional when… | Bug when… |
|---------|-------------------|-----------|
| `shell-m` `#view` | Width = viewport; horizontal pad; bottom pad = dock + safe-area | Stage narrower than viewport / desk rails / missing bottom pad |
| `store-fullscreen` | Class on pending shop; immersive list; finish above dock | Dock hidden **or** covered for hits; finish covering dock |
| `#sheetBg` | Full inset when open | Paints / captures taps when closed |
| Kid welcome | First-run card inset | Accidental full-bleed of dismissible banner |
| Kid `.kid-hero` | Full-bleed canceling stage pad | Partial bleed (one edge only) / width stuck at content column |
| Kid dock | Floating pill (±10px) | Staff full-bleed expected incorrectly |
| Landscape | Compress chrome; no overflow-x | Horizontal break / unreachable primary chrome |

## CSS / JS anchors

- `mobile/m-ui.css` — `#view` fill + pad; `store-fullscreen #bottomPanel { display:flex !important }`; store list bottom pad
- `mobile/index.html` — `.store-page{position:fixed;inset:0;z-index:35}`; `.sheet-bg{inset:0}`; kid `.kid-hero` bleed; kid `#bottomPanel` `left:10px;right:10px`
- `ui-v294.css` — closed `#sheetBg` force hide when `body:not(.sheet-open)`
- `app.js` — `classList.toggle('store-fullscreen', storeDock)` when shop has pending

## Evidence index

```
.qa-screens/agent-fullscreen-fill-v294/
  390x844/ 01-staff-home · 02-sheet-open · 03-sheet-closed · 04-shop-store-fs · 06-kid-today
  375x667/ (same set)
  844x390/ + 05-staff-landscape-home · 07-kid-landscape
  REPORT.md · verdicts.json
```

## Top fixes (audit only — not applied)

1. **Store:** lower `.store-page` below `#bottomPanel` (z &lt; 50) or clip its hit box above the dock (`pointer-events` / height short of dock).
2. **Kid hero:** make bleed use `--m-pad` (or set `--stage-pad-x`) so width reaches viewport right edge.
