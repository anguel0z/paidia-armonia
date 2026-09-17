# Mobile aspect-ratio audit — full matrix v294

**When:** 2026-09-16  
**Base:** `http://127.0.0.1:5173/m/`  
**Auth:** e4 staff / k1 kid (`docs/marketing/.local-auth/pins.json`)  
**Evidence:** `.qa-screens/agent-aspects-full-v294/`  
**Drivers:** `PAIDIA_QA_OUT=agent-aspects-full-v294 node scripts/qa-mobile-ui-stress-bounds.mjs` + supplemental chrome/CTA probe (`chrome-matrix.json`)  
**Scope:** staff **home** + **shop** (+ dock chrome) on all 12 viewports; **kid today** on **280×653** and **390×844** only. No product edits.

## Rating rules

| Axis | Pass | Warn | Fail |
|------|------|------|------|
| **chrome** | Header + dock icons/labels readable | Dock labels crushed/ellipsis (icons OK); shop uses store header instead of `app-chrome` | Header or dock unusable |
| **no H-overflow** | `doc.scrollWidth ≤ vw+2` | Rail peeks only (intentional) | Page-level horizontal scroll |
| **primary CTA tap honesty** | Primary control hit-tests itself | Cramped but still hittable | Hit stolen / finish overlaps dock / illegible primary |
| **intentional full-bleed** | `#view` fills width; shop has `store-fullscreen` | fills width but shop missing FS | View narrower than viewport without intent |

**Overall** = worst axis for that viewport (home+shop; kid notes folded into 280/390).

## Recheck 2026-09-16 (post `.store-finish` dock fix)

Playwright hit-test after `m-ui.css` finish bar above `--m-dock-h`:

| Viewport | finish clear of dock | notes |
|----------|:--------------------:|-------|
| 280×653 | **yes** (overlap −13) | finH 88 · readable |
| 667×375 | **yes** (overlap −13) | landscape cleared |
| 844×390 | **yes** (overlap −13) | landscape cleared |

Matrix Fail rows below were **pre-fix**. Residual Warn: dock label crush ≤360; landscape content band still short (chrome density P1).

## Matrix

| Viewport | Overall | chrome | no H-overflow | CTA honesty | full-bleed | Notes / shots |
|----------|---------|--------|---------------|-------------|------------|---------------|
| **280×653** | **Fail** | Warn | Pass | **Fail** | Pass | Dock labels crushed (icon-only). Shop `.store-finish` scan row illegible (vertical text crush). Kid today OK (icon dock). `280x653__staff-{home,shop}.png`, `280x653__kid-today.png` |
| **320×900** | **Warn** | Warn | Pass | Pass | Pass | Staff dock labels truncated. Home CTA honest. Shop FS + fills W. `320x900__staff-*.png` |
| **360×800** | **Warn** | Warn | Pass | Pass | Pass | Same dock-label crush pattern as 320. `360x800__staff-*.png` |
| **375×667** | **Pass** | Pass | Pass | Pass | Pass | Clean home + shop FS. `375x667__staff-*.png` |
| **390×844** | **Pass** | Pass | Pass | Pass | Pass | Kid today Pass. `390x844__staff-*.png`, `390x844__kid-today.png` |
| **412×915** | **Pass** | Pass | Pass | Pass | Pass | `412x915__staff-*.png` |
| **430×932** | **Pass** | Pass | Pass | Pass | Pass | `430x932__staff-*.png` |
| **667×375** | **Fail** | Pass | Pass | **Fail** | Pass | Landscape: `.store-finish` bottom **below** dock top (`finishBottom > dockTop`); primary finish CTA `elementFromPoint` dishonest. Content band tiny under tall shop header. `667x375__staff-*.png` |
| **844×390** | **Fail** | Pass | Pass | **Fail** | Pass | Same landscape shop finish/dock collision as 667×375. Home chrome fine. `844x390__staff-*.png` |
| **600×600** | **Pass** | Pass | Pass | Pass | Pass | Square-ish: home+shop OK; FS on. `600x600__staff-*.png` |
| **768×1024** | **Pass** | Pass | Pass | Pass | Pass | iPad portrait clean. `768x1024__staff-*.png` |
| **1024×768** | **Warn** | Warn | Pass | Pass | Pass | Wider dock shows more tabs; mild label trunc (`Πρόγραμμα`). Shop FS OK. `1024x768__staff-*.png` |

### Scoreboard

| Result | Count | Viewports |
|--------|------:|-----------|
| Pass | 6 | 375×667, 390×844, 412×915, 430×932, 600×600, 768×1024 |
| Warn | 3 | 320×900, 360×800, 1024×768 |
| Fail | 3 | **280×653**, **667×375**, **844×390** |

**H-overflow:** 0 page-level overflows on home/shop across all 12 sizes.  
**Full-bleed:** every sampled home/shop had `viewFillsWidth=true`; every shop had `store-fullscreen=true`.

## Worst 5 viewports

1. **667×375 (SE landscape) — Fail**  
   Shop finish bar overlaps dock; primary CTA hit-test fails. Header eats ~half the height; list almost unusable.

2. **844×390 (phone landscape) — Fail**  
   Same finish/dock collision (`finishBottom` 459 vs `dockTop` 326). Home Pass; shop drives overall Fail.

3. **280×653 (Fold cover) — Fail**  
   Dock forced icon-only (Warn). Shop `.store-finish` “Σάρωση απόδειξης” column-wraps into garbage; primary shopping chrome not honest. Kid today otherwise Pass/Warn.

4. **320×900 (tall narrow) — Warn**  
   Staff dock labels truncated/crushed; no H-overflow; CTAs and bleed Pass.

5. **360×800 (Android compact) — Warn**  
   Same dock-label pattern as 320; otherwise healthy home/shop.

*(Honorable mention: **1024×768** Warn — expanded dock truncates one label.)*

## Kid today (280 + 390 only)

| Viewport | chrome | H-overflow | CTA | bleed | Note |
|----------|--------|------------|-----|-------|------|
| 280×653 | Warn | Pass | Pass | Pass | Icon dock; welcome CTA readable |
| 390×844 | Pass | Pass | Pass | Pass | Clean |

## Out-of-scope stress noise (not in matrix)

`qa-mobile-ui-stress-bounds.mjs` also walked stock/book/talk/admin and logged many P0 **overlap-dock** / talk compose OOB. Those screens were **not** part of this aspect brief. Treat as follow-ups, not matrix Fail drivers:

- `journal-write-actions` vs dock (book) — every device  
- `chat-compose` slight x=-3 / dock overlap (talk)  
- House-rail chip peeks (`Valeria+Lea`, etc.) — intentional rails (P1)

Shop list “tap stolen by overlay” in stress often means a **list row** under `.store-finish`, not the finish primary itself. Landscape Fail above is the honest primary-CTA failure.

## Artifact index

```
.qa-screens/agent-aspects-full-v294/
  REPORT.md / report.json          # stress bounds raw
  chrome-matrix.json               # home/shop/kid chrome+CTA probe
  {WxH}__staff-home.png
  {WxH}__staff-shop.png
  280x653__kid-today.png
  390x844__kid-today.png
  (+ device-id aliases from stress: fold-cover__, landscape-15__, …)
```
