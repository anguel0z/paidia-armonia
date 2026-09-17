# Mobile agent — unresponsive / dead-tap hunt (v294)

**Generated:** 2026-09-15T23:01:16.276Z · spot-confirmed 2026-09-15T23:05Z  
**Base:** http://127.0.0.1:5173/m/ · **Pins:** e4 staff / k1 kid  
**Viewports:** 390×844 (iPhone 14/15) · 280×653 (Fold cover) · 375×667 (iPhone SE)  
**Method:** Playwright Chromium · `scrollY=0` · control center via `document.elementFromPoint` vs `nav.dock` / `nav.kid-dock` / `.store-finish` / `#sheetBg` / null  
**Shots:** `.qa-screens/agent-unresponsive-v294/` · runner: `scripts/qa-mobile-agent-unresponsive.mjs`

## Unresponsive honesty score: **5.5 / 10**

10 = all primary taps honest. Deduct for distinct dead-tap families (stock stepper, talk compose, book save bar, kid CTA on short VP). Sheets + shop `.store-finish` are clean.

| Family | Sev | Verdict |
|--------|:---:|---------|
| Shop `.store-finish` vs dock (known 58px candidate) | — | **CLEARED** — overlap 0px; center + bottom-edge hit `.store-finish` (store-fullscreen; bar bottom ~766 / dockTop ~780 @390) |
| `#sheetBg` orphan after notifs / Άλλα | — | **CLEARED** — all 3 VPs × staff+kid; `on=false`, `pointer-events:none` after close |
| Stock last `+/-` under dock | **P0** | Center hits `nav.dock` @ all 3 VPs (overlap ~24–84px) |
| Talk `.talk-compose` | **P0** | `position:fixed` but laid out **below viewport** (e.g. top≈1124 on 844h); clamp hit → dock |
| Book `.journal-write-actions` / `#shiftNoteSave` | **P0** | Same pattern — fixed bar offscreen below dock; clamp hit → dock |
| Kid home CTA tiles @ 375×667 | **P0** | Bonus tile center in dock band (overlap ~73–82px) → dock steals tap |
| Kid CTAs @ 280×653 | **P1** | Tiles below fold at scroll0 (not dock-steal at center; unreachable without scroll) |
| Home / schedule / admin / mid-viewport | OK | No null / `#sheetBg` mid hits; home shift CTAs clear |

## P0 list

1. **staff-stock last `.lager-stepper button`** — dock steals center tap @ `390×844` (54px), `280×653` (84px), `375×667` (24–51px).
2. **staff-talk `.talk-compose`** — fixed bar offscreen under dock @ all 3 VPs; `elementFromPoint` → `nav.dock`.
3. **staff-book `.journal-write-actions`** (and `#shiftNoteSave`) — same offscreen-fixed / dock-steal @ all 3 VPs.
4. **kid-today/games/rate `.kid-home-cta-tile` / `[data-child-view=bonus]`** — dock steals @ `375×667` only (clear @ `390×844`).

**Not P0 (cleared / N/A):** `.store-finish` overlap; orphan `#sheetBg`; frozen mid-viewport null.

## Hit-test table

| control | viewport | clear | hit | notes |
|---------|----------|:-----:|-----|-------|
| staff-home #homeShiftJournal | 390x844 | yes | `self` | clear |
| staff-home #homeShiftStock | 390x844 | yes | `self` | clear |
| staff-home .home-bento-tile | 390x844 | yes | `self` | clear |
| staff-home .m-cta .m-primary | 390x844 | yes | `self` | clear |
| staff-home mid-viewport | 390x844 | yes | `div.home-shift-step` | mid OK |
| staff-schedule mid-viewport | 390x844 | yes | `header.plan-week-chrome` | mid OK |
| staff-stock last .lager-stepper button ❌ | 390x844 | no | `dock` | tap stolen → span.nav-ico.dock-more-glyph |
| staff-shop .store-finish | 390x844 | yes | `store-finish` | clear |
| staff-shop .store-finish GEOMETRY | 390x844 | yes | `geom` | overlap=0px; z=48 vs dock |
| staff-shop .store-finish EDGE | 390x844 | yes | `store-finish` | bottom-4px hits FINISH |
| staff-book .journal-write-actions ❌ | 390x844 | no | `dock` | fixed offscreen; clamp → dock |
| staff-talk .talk-compose ❌ | 390x844 | no | `dock` | fixed offscreen; clamp → dock |
| staff-admin mid-viewport | 390x844 | yes | `div.admin-ops` | mid OK |
| kid-today .kid-home-cta-tile | 390x844 | yes | `self` | clear |
| kid dock:Αρχή / Παιχνίδια / Βαθμοί | 390x844 | no | `dock` | dock self-hit OK |
| staff-home #homeShiftJournal | 280x653 | yes | `self` | clear |
| staff-home .m-cta .m-primary | 280x653 | no | `self` | ~7px geom kiss; center still self |
| staff-stock last .lager-stepper button ❌ | 280x653 | no | `dock` | tap stolen by dock |
| staff-shop .store-finish | 280x653 | yes | `store-finish` | clear; overlap=0 |
| staff-shop .store-finish EDGE | 280x653 | yes | `store-finish` | edge FINISH |
| staff-book .journal-write-actions ❌ | 280x653 | no | `dock` | fixed offscreen → dock |
| staff-talk .talk-compose ❌ | 280x653 | no | `dock` | fixed offscreen → dock |
| kid-today CTAs | 280x653 | — | offscreen | tiles below fold @ scroll0 (P1) |
| staff-home #homeShiftJournal | 375x667 | yes | `self` | clear |
| staff-stock last .lager-stepper button ❌ | 375x667 | no | `dock` | tap stolen by dock |
| staff-shop .store-finish | 375x667 | yes | `store-finish` | clear; overlap=0 |
| staff-shop .store-finish EDGE | 375x667 | yes | `store-finish` | edge FINISH |
| staff-book .journal-write-actions ❌ | 375x667 | no | `dock` | fixed offscreen → dock |
| staff-talk .talk-compose ❌ | 375x667 | no | `dock` | fixed offscreen → dock |
| kid-today .kid-home-cta-tile ❌ | 375x667 | no | `dock` | bonus center under kid-dock |
| kid-today [data-child-view=bonus] ❌ | 375x667 | no | `dock` | same |
| kid-games / kid-rate CTA tiles ❌ | 375x667 | no | `dock` | same home tiles still in DOM |
| sheet:notifs | 390 / 280 / 375 | yes | content | open→close; no orphan #sheetBg |
| sheet:alla-more (staff) | 390 / 280 / 375 | yes | content | closed pe=none |
| sheet:kid-alla-more | 390 / 280 / 375 | yes | content | closed pe=none |

## Scoring rules

- **Honest** = center `elementFromPoint` lands on the intended control (or dock self for dock items), not dock / `#sheetBg` / null.
- **`.store-finish`** = P0 if geometry overlap vs dock ≥ 40px **or** center/edge tap stolen by dock.
- **Sheets** = P0 if after close `#sheetBg.on` still blocks pointer events or mid-viewport hits `#sheetBg`.
- Talk/book fixed bars with `top > vh` count as dishonest (invisible + clamp hits dock).

## Coverage

- Staff tabs: `home`, `schedule`, `stock`, `shop`, `book`, `talk`, `admin`
- Kid views: `today`, `games`, `rate` (+ dock items + Άλλα sheet)
- Re-run: `node scripts/qa-mobile-agent-unresponsive.mjs`

```json
{
  "score": 5.5,
  "storeFinishCleared": true,
  "sheetOrphanCleared": true,
  "p0Families": [
    "staff-stock last lager-stepper → dock",
    "staff-talk .talk-compose fixed offscreen → dock",
    "staff-book .journal-write-actions fixed offscreen → dock",
    "kid CTA under dock @ 375x667"
  ]
}
```
