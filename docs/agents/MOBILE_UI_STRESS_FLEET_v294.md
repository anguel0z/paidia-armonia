# Mobile UI stress fleet — overflows / unresponsive / aspects / fill

**Launched:** 2026-09-16  
**Scope:** `/m/` only · staff `e4` · kid `k1` · EL/pro  
**Server:** `http://127.0.0.1:5173`

## Local scripts (running)

| Script | Out tag | Covers |
|--------|---------|--------|
| `scripts/qa-mobile-ui-stress-bounds.mjs` | `.qa-screens/ui-stress-*` | 12 viewports · overflow-x · OOB · dock overlap · dead taps · intentional fill flags |
| `scripts/qa-mobile-fleet-matrix.mjs` | `.qa-screens/fleet-aspects-stress/` | Classic aspect × tab matrix |

**Viewports in stress script:** 280×653, 320×900, 360×800, 375×667, 390×844, 412×915, 430×932, 667×375, 844×390, 600×600, 768×1024, 1024×768.

## Agents

| Agent | Focus | Report |
|-------|-------|--------|
| [Overflow/OOB](e8954703-702d-4678-ae5a-fa7770e601f2) | H-overflow, out-of-bounds, rail vs bug | `MOBILE_AGENT_OVERFLOW_OOB_v294.md` |
| [Unresponsive](467a2aed-4848-440f-9739-1d273eee7a73) | Dead taps, dock/overlay steal, sheets | `MOBILE_AGENT_UNRESPONSIVE_v294.md` |
| [Aspects full](3767693a-9cb5-44c0-8eec-9270722f5021) | All aspect ratios Pass/Warn/Fail | `MOBILE_AGENT_ASPECTS_FULL_v294.md` |
| [Fullscreen fill](fdf26bba-d17b-4282-ae1a-87700b580f6a) | Intentional full-bleed vs bugs | `MOBILE_AGENT_FULLSCREEN_FILL_v294.md` |
| [UI bugs sweep](8362d3ae-cead-4e05-ab66-e15d1f73b893) | Overlaps, z-index, truncation bugs | `MOBILE_AGENT_UI_BUGS_SWEEP_v294.md` |

## Known P0 going in

Shop `.store-finish` overlaps dock ~58px (z65 vs dock z50) — see `MOBILE_AGENT_SHOP_FOLD_RATE_v294.md`.
