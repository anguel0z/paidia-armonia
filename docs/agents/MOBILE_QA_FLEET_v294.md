# Mobile QA fleet — v294

Live server: `http://127.0.0.1:5173/m/`  
Auth fixture: `docs/marketing/.local-auth/pins.json` (staff `e4`, child `k1`)

## Agents deployed

| Agent | Scope | Output |
|-------|--------|--------|
| Staff buttons | Click every staff dock/header/CTA | `.qa-screens/agent-staff-buttons/` |
| Kid buttons | Kid portal dock + views | `.qa-screens/agent-kid-buttons/` |
| Aspect ratios | 7 viewports × key screens | `.qa-screens/agent-aspects/` |
| Bug hunter | Stuck UI, traps, CSS conflicts | `.qa-screens/agent-bugs/` |
| Sheets / Mehr | Modals, More menu, close paths | `.qa-screens/agent-sheets/` |
| Anti-slop notes | Overhaul brief from screenshots | `docs/agents/MOBILE_UI_OVERHAUL_NOTES_v294.md` |

## Local matrix script

```bash
node scripts/qa-mobile-fleet-matrix.mjs
```

Writes screenshots + `NOTES.md` + `report.json` under `.qa-screens/fleet-*`.

Devices: iPhone SE, 15, 15 Pro Max, Pixel 7, Fold cover, iPad portrait, phone landscape.

## Prior audit (this session)

- `.qa-screens/m-audit-293/` — pre-fix (83 P0 overflows)
- `.qa-screens/m-audit-294/` — after v294 (0 P0 page overflow)
- `.qa-screens/m-audit-294b/` — visual verify post dock-clearance

## How to read severities

- **P0** — cannot use: overflow, missing shell, dead primary nav, trap overlay
- **P1** — content under dock, sheet close broken, clipped primary CTA
- **P2** — small taps, polish, intentional rail peek false-positives

## Aspect agent result ([Aspect ratio visual fleet](2c8f52c0-6b28-4398-bf73-136207c9e408))

- Report: `.qa-screens/agent-aspects/REPORT.md`
- **0 P0**, **29 P1** — pattern = sticky dock covering last list rows + ≤280 dock label crush
- Only **Pixel 412×915** fully PASS

## Buttons/sheets backup (limit-failed agents covered locally)

- Script: `scripts/qa-mobile-buttons-sheets.mjs`
- Output: `.qa-screens/agent-buttons-sheets/`
- Finding: `#sheetBg.on` trapped header clicks after CTA sheets — fixed via `ensureSheetChromeConsistent()` in `app.js` `render()`

## Agents that hit model limit (not run)

- Staff buttons, Kid buttons, Sheets/Mehr, Admin+Talk — replaced by the backup script above

## Anti-slop notes

- `docs/agents/MOBILE_UI_OVERHAUL_NOTES_v294.md`

## CSS follow-ups applied after aspect report

- Icon-only dock breakpoint raised **320 → 360**
- Extra bottom padding on stock/kids/pocket/plan/home/book/admin lists
- Sheet backdrop orphan cleanup in `render()`

