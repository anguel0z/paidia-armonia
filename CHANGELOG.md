# Changelog

## v175 — 2026-08-31

- **Design skill polish (Lager + Zo-Ai):** Linear-calm density on Armonia tokens — outlined Easy action tiles with icons, status-dot tide legend, product unit meta, pine selected pier chips, FAB list clearance.
- **A11y (Web Interface Guidelines):** focus-visible rings on search/compose/±/close; `overscroll-behavior: contain` on chat sheet; 48px compose targets; tabular nums on qty/%.
- Cache `paidia-v175`.

## v174 — 2026-08-31

- **Lager mobile:** compact status strip (not tall pantry hero), sticky house/search, chip zone pier, thumb-first ± rows, Easy 2×2 actions.
- **Zo-Ai crop crash:** floating panel was clipped over page heroes (`overflow` + fixed 220px log + glass). Now a solid mobile sheet (~78dvh), flex-scrolling log, dim scrim; tap outside / × closes.
- Cache `paidia-v174`.

## v173 — 2026-08-30

- **Lagercheck Easy:** open check → product cards → big **OK / Wenig / Leer** (DE) · **OK / Λίγο / Άδειο** (EL) → Speichern.
- Progress bar; in-place marks (no sheet flicker/scroll jump); attention-first order; Rest OK + Speichern.
- Entry: Easy toolbar **Lagercheck**, clear banners on Lager / Plan / Home / Buch; Pro keeps ••• entry.
- Centered desktop panel; mobile full sheet; dock stays hidden via `sheet-open`.
- Also restores accidental `||0` → version-number corruption from parallel bumps (v169+). Does not change add-product sheet or order freeze (v168). Cache `paidia-v173`.

## v172 — 2026-08-30

- **Übergabe complete (builds on v168 UI):** structured sections actually **save**; incoming taps **Gelesen**; calendar unread dots; today spotlight.
- Fixed broken save (still targeted removed `#shiftNoteText`); wired ack buttons + Pro house filter.
- Mitteilungen: inbox rows + OS notify (`handover`) when a team handoff awaits read.
- Easy = write/read/ack; Pro = archive, house chips, log/people, corrections.
- Cache `paidia-v172`.

## v171 — 2026-08-30

- **Zo-Ai chat crash:** tip scripts (`page-tips.js` / `zoai-tips.js`) 404 on Vercel before allowlist → global `error` handler toasted “unexpected” as a fake crash; open/send/close could also throw on null DOM, tip overlays, or stuck `sheet-open`.
- **Fix:** allowlist tip files (v168); harden `openChatPanel` / `mountHelpChat` / close (`panelAlive`, voice stop, clear tip overlays, dismiss stuck sheets); ignore SCRIPT/LINK resource errors in the toast handler. Cache `paidia-v171`.

## v169 — 2026-08-30

- **Kids website-style menu:** mobile **Menü** hamburger opens a large panel with all pages (Start · Spiele · Bewertung · Bonus · Notizen + Mehr). Desktop keeps the dark left side menu (`#1b2822` rail from v166).
- Bottom dock removed on phone (no confusing dock-only IA). Back chrome kept. Tour opens the site menu for `kid-nav-*` targets.
- Plain DE/EL guide copy. Staff Plan / Lager untouched. Cache `paidia-v169`.

## v168 — 2026-08-30

- **Lager add product:** faster sheet — big name, ± Menge stepper, sticky Ins Lager / Menge dazu; live dup chips; exact match locks unit/category and offers Auffüllen.
- Plain language **Foto lesen** / **Διάβασε φωτό**; list order freezes on add (scroll stays) until Liste aktualisieren / Speichern.
- **Buch Übergabe:** write → read → confirm flow with sections (Dringend / Kinder / Lager / Aufgaben / Sonstiges) and Ack.
- **Login forever-load (prod):** tip scripts allowlisted; **gate.js first** + defer tips; paint login immediately; takeover watchdog. Cache `paidia-v168`.

## v166 — 2026-08-30

- **Kids desktop left rail:** staff `ui-v110` white `--chrome` made the kid dock white-on-white — nav vanished, empty white left pane on Start.
- Restore dark kids chrome (`#1b2822`) for rail + mobile dock; labeled rail buttons; brand mark; hide redundant top chip strip on desktop (rail owns nav).
- Desktop stage gutter fixed (`--side-gutter:28px`) so kid-header no longer uses the 1180px centering bleed. Staff Plan untouched. Cache `paidia-v166`.

## v165 — 2026-08-30

- **Mobile Plan · Woche stability:** portrait stays day-focus only (no 922px Voll-Woche matrix DOM — was blanking / crushing chips under the dock).
- **Readable slots:** sticky Mo–So chips (7-col grid), compact week hero + AI bar, empty afternoon staff rows hidden.
- Landscape / desktop matrices unchanged. Cache `paidia-v165`.

## v164 — 2026-08-30

- **Zo-Ai always FAB:** bottom-right launcher stays visible for staff + kids (above dock; compact chip in matrix/store fullscreen; not Easy-hidden).
- **Capability tips:** random DE/EL bubbles from FAB (`zoai-tips.js` / `PaidiaZoAiTips`) — Plan fill, OCR, schedule, stock, kids ask — dismissible, open Zo-Ai on tap.
- **Stagger with page tips:** shared `paidiaMarkCoachShown` / `__paidiaLastCoachAt` (~28s); skips when `#tipRoot` / `paidiaPageTipVisible()`; page tips skip `#zoaiTipRoot` / `body.zoai-tip-open` / `paidiaZoAiTipVisible()`. Does not change Mitteilungen enable (v163). Cache `paidia-v164`.

## v163 — 2026-08-30

- **Mitteilungen aktivieren:** Tippen → Erlaubnis → echte Test-Mitteilung → Einstellungen bleiben an → Hinweise bei geöffneter App.
- Glocken-Menü hat jetzt auch **Aktivieren**. Wenn die Mitteilung über die App-Hilfe nicht kommt, Desktop-Fallback.
- Ehrliche Texte (DE/EL): iPhone nur nach „Zum Home-Bildschirm“, blockiert = Geräteeinstellungen, unsichere Verbindung.
- Easy: Aktivieren + Test; Pro: Kategorien / Ruhezeit / Ton. Cache `paidia-v163`.

## v162 — 2026-08-30

- **Kids Back:** every kids subpage (not Start) shows top-left **Zurück / Πίσω** (≥44px). History stack: dock/Mehr pushes prior view; Back pops (fallback Start). In-game `#gameBack` still returns to Spiele/Learn hub (OSS + native). Dock/rail kept.
- `setChildView` / `goChildView` / `childHist`; Start clears stack. Cache `paidia-v162`.

## v161 — 2026-08-30

- **Mehr menu open (staff + kids):** intentional open UX — mobile slides up as a solid bottom sheet; desktop opens a solid centered panel (not a tiny bottom pop). High-contrast rows, plain labels.
- **Easy:** fewer items, larger rows (hints hidden). **Pro:** full list with short hints on kids.
- Staff dock Mehr + kids dock/rail Mehr share `openNavMenu` / `nav-menu-*` via `openSheet(..., {kind:'nav-menu'})`. Keeps `body.sheet-open` dock hide (Schicht-check). Kids back chrome untouched.
- Cache `paidia-v161`.

## v160 — 2026-08-30

- **Easy/Pro everywhere:** practical forks on Home, Talk, Buch, Galerie, Kids staff, child Plan — toggles + Easy hints; Pro keeps extras (stats/video/log panes/shelves/bulk).
- **Lager Easy:** visible toolbar Hinzufügen · Foto lesen · Speichern · Aktualisieren; ± glyphs; shelves/bulk stay Pro. Centered OUT reason + order freeze from v157 kept.
- **Contextual page tips:** dismissible help popups (`page-tips.js`); Easy fewer tips. Cache `paidia-v160`.

## v159 — 2026-08-30

- **Buch calendar:** month view on Schichtbuch / Übergabe — pick any day, dots mark days with entries, read & write that day’s page.
- **Easy:** calendar + day page + write. **Pro:** same calendar + range archive, log/people panes, filters/search.
- Reuses Plan month-grid helper; stone/pine/sea styling. Dock / Easy-Pro toggle / Lager-Plan siblings unchanged. Cache `paidia-v159`.

## v158 — 2026-08-30

- **Easy/Pro everywhere:** practical forks on Home, Talk, Buch, Galerie, Kids staff, child Plan — toggles + Easy hints; Pro keeps extras (stats/video/log panes/shelves/bulk).
- **Lager Easy:** visible toolbar Hinzufügen · Foto lesen · Speichern · Aktualisieren; ± glyphs; shelves/bulk stay Pro. Centered OUT reason + order freeze from v157 kept.
- **Contextual page tips:** dismissible help popups (`page-tips.js`); Easy fewer tips. Cache `paidia-v158`.

## v157 — 2026-08-30

- **Lager OUT reason:** Abgang-Grund picker is a **centered modal** (dim backdrop, large chips) — no longer a bottom dock under a long list.
- **Order freeze:** ± / qty edits keep list order frozen; re-sort only on **Liste aktualisieren** / draft Save / filter·house·search change.
- **Easy:** visible toolbar — Hinzufügen · Foto lesen · Liste aktualisieren; clear **+ / −** glyphs on every row (also while selecting).
- **Pro bulk:** IN +, OUT −, Menge…, Regal…, → Liste, Leeren. Cache `paidia-v157`.

## v156 — 2026-08-30

- **Mobile week Plan:** day-jump strip + one-day focus (swipe/jump Mo–So); readable roster cells. Dense weeks get “drehen / γύρισε οριζόντια” coach; toggle **Volle Woche** for sticky-column matrix. Desktop matrices unchanged.
- **Week switcher** (mobile + PC): prev/next week, **Diese Woche**, date pick; selected week persists (`paidia.scheduleDate`).
- **AI fill + AI remove** on week view for Easy and Pro: “Mit Text füllen / Γέμισμα με κείμενο” → Zo-Ai preview → apply; “AI leeren / Καθαρισμός AI” with confirm (only AI-tagged cells). Pro keeps Import Woche + extras.
- **Schicht-Lagercheck on mobile:** dock no longer steals sheet taps; Easy+Pro CTA outside Pro •••; larger OK/save targets.
- Cache `paidia-v156`.

## v155 — 2026-08-30

- **Device / IP audit:** successful and failed logins record UA parse (browser/OS label), optional client `deviceId`, IP (X-Forwarded-For on Vercel), profile, timestamp via existing `security_events` + `append_security_event`. No plaintext PINs.
- **APIs:** `GET /api/auth/devices` (own known devices / recent logins; kids get truncated IP); `GET /api/auth/security-events` (admin full trail with profile/day/event filters; non-admin own login events only).
- **Login UX:** Profil → Sicherheit shows known devices. Admin **Bewegungen / Κινήσεις** sheet (Easy = last 20; Pro = filters + copy list). Gate/app already send `deviceId` on PIN/passkey login (v153/v154).
- Does not change remember-me, lockouts, or gate fetch timeouts / mobile PIN sizing. Cache `paidia-v155`.

## v154 — 2026-08-30

- **Forever-load (mobile + desktop):** gate arms a 2.8s login deadline *before* awaiting `build.json`/session; fetch timeouts on build (2.5s), session (2.5–4s), PIN login (8s), `/api/ops` (8s). SW API/shell `fetchDeadline` falls back instead of hanging. No SW reload loops.
- **Crash after login:** null-safe PIN gate DOM; kid chrome/DOM guards; staff/kids `render` wrapped so throws toast instead of white-screen; collection helpers tolerate missing arrays.
- Mobile sizing from v153 kept (52px PIN keys, 2-col profiles). Easy/Pro v152 + `houseShort` unchanged. Cache `paidia-v154`.
- Client may send optional `deviceId` on login for a future device-audit sibling — server/db/api not part of this commit.

## v153 — 2026-08-30

- **Mobile login sizing:** role picker, staff/kids profiles (2-col), PIN pad ≥48–52px, remember-me label ≥44–48px hit area with ink contrast (v151 cookie logic unchanged).
- Lang / back / Forgot·Back·Other links ≥44px; safe-area bottom padding; short phones scroll instead of shrinking keys below 48px.
- Cache `paidia-v153`. Does not regress v150/v151 ghost/topbtn white fills.

## v152 — 2026-08-30

- **Easy/Pro practical behaviour** on every major staff + kids page (not only CSS density).
- **Lager:** Easy = house + search + big ± / Hinzufügen + attention/empty; Pro = shelves catalogue, ••• bulk/board/select/shift-check, OCR on quick-add, recent IN/OUT ribbon.
- **Plan:** Easy = day/week + simple add sheet; Pro = Import Woche, Zo-Ai Plan, calendar/shift/events, week notes, announce/template extras.
- **Liste:** Easy = plan/take/requests CTA; Pro = OCR, scan, import, auto-fill, bulk select, Αιτήματα filters.
- **Kids Bewertungen:** Easy = staff grades (`staffKidRatings`) view-only; Pro = optional self-rate.
- **Mitteilungen:** Easy = enable + test; Pro = categories / quiet hours / sound.
- Spotlight tour (Hilfe) kept: `data-tour` targets + Easy shorter path; Lager/Bewertung copy updated.
- Safe `houseShort()` for missing house ids (crash coordination). Cache `paidia-v152`.

### Page × Easy vs Pro

| Page | Easy | Pro |
|------|------|-----|
| Home | Tasks + signals; primary CTAs | + Mehr (overdue/events/unassigned), tutorial/calendar/gallery |
| Plan | Day/week, simple add | Import, Zo-Ai, calendar/shift/events, week notes, announce |
| Lager | ± / add / search / attention | Shelves, OCR, board, bulk, recent log |
| Liste | Cart + requests big CTA | Scan, import, auto-fill, filters, bulk |
| Talk | Chat | Stats, topic actions, video |
| Buch | Shift journal | Log + people panes, filters |
| Galerie | Share feed | Drive line, refresh |
| Kids staff | Directory + staff ratings | Attendance/HW/timetable/subjects |
| Profile | Global+page Easy/Pro, notif enable | Full notif categories, feedback inbox |
| Kid Start | Primary CTAs | Plan/Sterne extras, school chips |
| Kid Spiele | Featured | Full catalogue |
| Kid Bewertungen | Team grades only | Self-rate + things |
| Kid Bonus/Notizen | Earned / compose | How-bonus detail |

## v151 — 2026-08-30

- **Remember me / Angemeldet bleiben:** opt-in checkbox (DE + EL «Να με θυμάσαι»). Checked → 30-day HttpOnly (`Secure` on Vercel) session cookie + last profile id in localStorage (never the PIN). Unchecked → browser session cookie (no Max-Age) with 12h server TTL; last profile cleared.
- Lockouts (v140) unchanged. Accessible ink contrast on the checkbox label. Cache `paidia-v151`.

## v150 — 2026-08-30

- **Button / chip contrast:** ghost & secondary controls use solid white + ink/pine + hairline (no empty transparent fills); `.topbtn` / `.chip` ink on light header; Easy/Pro toggle solid white track.
- Plan hero actions ink-on-white; desktop Plan hero aligned to light stone (summary stats no longer white-on-white on mobile).
- Header tools ≥44×44; `.btn.in` / `.out` keep white labels on semantic fills.
- Cache `paidia-v150`.

## v149 — 2026-08-30

- **Notifications:** `PaidiaNotify.capabilities` + optional VAPID `subscribePush`; OS×browser matrix doc.
- Honest iOS Home-Screen requirement and DE/EL unsupported messaging (prefs + enable flow already on main).

## v148 — 2026-08-30

- **Kids Notizen:** own-profile CRUD; sync race fix; server `_merge_kid_notes` keeps staff notes; empty CTA Notiz schreiben (DE/EL).
- **OCR via Grok (xAI):** `POST /api/ai-shopping` image path prefers `XAI_API_KEY` / `GROK_API_KEY` via `ocr_xai.py`. Honest `503` when no OCR key.
- Purposes: `list` / `receipt` / `stock` (staff) + `request` (staff or kids). Rate limit + image size cap.
- UI: Liste import + Beleg, Lager Schnell hinzufügen OCR, Anfrage OCR fill. Docs: `docs/agents/OCR_GROK.md`.
- Cache `paidia-v148`.

## v147 — 2026-08-30

- **In-app feedback:** Bug / change / addition reports (DE/EL). Auto page context; optional screenshot note; severity for bugs.
- Persist as ops `feedbackReports` (staff `/api/ops`, kids open rows via `/api/kid-ops` with triage lock).
- Entry: Help center, Profil, staff Mehr, kids Mehr. Pro inbox triage in Profil / hub.
- Docs: `docs/agents/FEEDBACK_SYSTEM.md`. Kids dock / Zo-Ai title / Lager·Plan untouched.
- Cache `paidia-v147`.

## v146 — 2026-08-30

- **OCR via Grok (xAI):** `POST /api/ai-shopping` image path prefers `XAI_API_KEY` / `GROK_API_KEY` (OpenAI-compatible `api.x.ai`). Honest `503` when no OCR key.
- Purposes: `list` / `receipt` / `stock` (staff) + `request` (staff or kids for Anfrage/αίτημα). Rate limit + image size cap.
- UI: Liste import + Beleg, Lager Schnell hinzufügen OCR, Anfrage OCR fill. Docs: `docs/agents/OCR_GROK.md`.
- Cache `paidia-v146`.

## v145 — 2026-08-30

- **Spotlight tour:** replaces the Next/Next sheet carousel with real coach-marks (`data-tour` targets). Dim overlay + tooltip (DE/EL); advance by tapping the highlight or **Got it** (navigates to the next page). Skip + resume; Easy = shorter path, Pro = Kids/Momente/Buch. Persist `tourSeen` v3 in localStorage (+ `profilePrefs._tourSeen` in Easy). QA map: `docs/agents/TOUR_SYSTEM.md`.
- **Kids Spiele E2E:** OSS iframe paths absolute (`/kids-games/…`); score `postMessage` origin-checked; Easy featured + Pro catalogue launchable; Alle Spiele back-to-hub.
- **XP / gameStats:** child devices sync bests/plays/XP via `/api/kid-ops` (same path as ratings/notes).
- **Edu hub / PhET:** marked online-only; disabled + banner when offline.
- **Staff UI QA P0/P1:** light Easy/Pro header contrast; white labels on `.topbtn.danger`/`.ok`; mobile Home mast (no dark `#1b382e` band); Talk/Liste overview heroes match pantry/ops light language; PIN-reset gate light stone; Plan day-chips settle easing (no bounce); header tools ≥44×44.
- Chrome contract documented in `ui-v110.css` + `docs/agents/QA_STAFF_FIX_NOTES.md` (flat white mobile dock product call). Kids Start v144 / Zo-Ai title v143 untouched. Lager pantry / Αιτήματα left healthy.
- Cache `paidia-v145`.

## v144 — 2026-08-30

- **Kids Start / Αρχική overhaul:** denser dashboard with CTA grid (Spiele, Bewertung, Bonus, Notizen, Plan, Sterne), week trend, subjects peek, lessons + next-up.
- Desktop (≥900px): wider stage (~1120px) + 2-column home beside the left kid rail; tablet mid-width gets CTA/home split.
- Phone: top chip strip (backup nav) + bottom dock; rail owns nav on desktop.
- Easy mode keeps primary next steps visible (Spiele/Bewertung/Aufgaben/Sterne). DE/EL.
- QA P0/P1 from `docs/agents/QA_REPORT_KIDS_UI.md` (sparse desktop / multi-column / Easy CTAs). Zo-Ai SVG title left to v143.
- Cache `paidia-v144`.

## v143 — 2026-08-30

- **Zo-Ai panel title:** render sparkle via `innerHTML` + `esc(title)` — `textContent` was showing raw `<svg>…</svg> Zo-Ai`.
- Kids nav / dock / rail untouched. Cache `paidia-v143`.

## v142 — 2026-08-30

- **Kids navigation chrome:** dock mounts in `#bottomPanel` (not inside `#view`), so phone/tablet/desktop always show a menu.
- Primary tabs: Start · Spiele · Bewertung · Bonus · Notizen · Mehr (Plan, Lernen, Sterne, Hilfe).
- Desktop/tablet (≥900px): left kid rail instead of a stretched phone dock; mobile keeps a capped bottom pill.
- Guidance: first-run tip, “where am I / next” strip, updated So geht’s (DE/EL); Easy + Pro.
- Stroke `ui()` dock icons. Spiele OSS iframe still has back-to-hub. Staff/auth/Lager/Plan untouched.
- Cache `paidia-v142`.

## v141 — 2026-08-30

- **Lager add/remove overhaul:** one-tap ± commits immediately (no draft/save for row steppers) with undo toast.
- Sticky OUT reason dock on first −; later consumes reuse the reason until cleared.
- Primary **Schnell hinzufügen** sheet: name, qty, category, house; live duplicate detection; fills existing or creates custom product.
- Pro: bulk paste (one line per product, optional qty); stock board / bulk select stay in ••• menu.
- Easy: huge ± and Add CTA; Pro: denser steppers + tools. Delete product = two-step confirm (no fat-finger).
- Pantry walk (jars, shelves, tide) kept. DE/EL strings. Cache `paidia-v141`.

## v140 — 2026-08-30

- **Auth brute-force:** PIN (and failed passkey) login tracked by IP + profile + pair; lockout after N failures with progressive backoff (1×→2×→4× of `PAIDIA_LOGIN_LOCK_SECONDS`, default 15 min). Counters and locks clear on successful login. Security events via `append_security_event` (`login_failed`, `login_locked`, `login_ok`, …).
- Defaults unchanged for local dev: 5 attempts / 10 min window / 15 min lock (`PAIDIA_LOGIN_*`). Wrong PIN still works until the limit; wait out the lock or succeed once to reset.
- **Forgot PIN / email:** no more fake “link sent” when SMTP/Resend (or public URL on Vercel) is missing — API returns `503 reset_unavailable`; UI shows honest DE/EL “ask admin / Profil → PIN”. Real email reset still works when delivery is configured. Reset-confirm attempts rate-limited by IP.
- `/api/auth/health` now includes `pinResetReady` locally (parity with Vercel).
- Cache `paidia-v140`.

## v139 — 2026-08-30

- **Plan default = Woche:** staff Plan opens on the weekly roster (not Tag); Easy invalid views fall back to week; session remembers last sub-tab when leaving Plan.
- **Import Woche:** copy date-specific overrides from a source week into the current week with preview; default merge, gaps-only, Pro replace; optional week notes; PIN confirm.
- **Zo-Ai Plan:** paste WhatsApp/notes/bullets → `/api/ai-schedule` proposes matrix cells → review → PIN apply (local parser fallback).
- DE/EL strings for import + AI schedule; week hero actions; roster tables unchanged.
- Cache `paidia-v139`.

## v138 — 2026-08-30

- **Lager / pantry walk:** replaced dark teal “health ring” with stone/sea glass hero + horizontal tide fill (Vorratssicherheit).
- Tactile **jar meters** on stock rows (fill vs soft full = 4× low threshold); pine-settle ± steppers with stroke icons.
- **Category shelf islands** with stone rail, empty/low badges; search aliases; zone pier filters (Easy: attention/empty; Pro: shelves + recent moves ribbon from `DB.log`).
- Easy density: larger steppers; Pro: bulk/more menu, tiles toggle, shift check, recent IN/OUT ribbon.
- DE/EL strings: `stockTideLabel`, `stockShelves`, `stockRecentMoves`, `stockJarAria`, …
- **Kids Spiele:** five offline OSS HTML5 games in `kids-games/` (2048, Snake, Breakout, 15-Puzzle, Himmel-Hüpfer) — MIT + `kids-games/README.md` attribution; sandboxed iframe launcher; Easy featured rail + Pro full catalogue; scores via `postMessage` → `gameStats`.
- Static allowlist `kids-games/` in `server.py` / `api/index.py`; SW caches `/kids-games/`.
- **Liste Αιτήματα / Anfragen:** `listRequests` ops key (open → accepted → bought / rejected); accept promotes into Friday `listEntries`.
- Kids create proposals only via `/api/kid-ops` (staff-locked non-open rows); staff Easy CTA + Pro filters/bulk accept.
- Light notification hook for open requests (`shopping` prefs, `list-req-*`).
- Cache `paidia-v138`.

## v137 — 2026-08-30

- Easy/Pro mode system: topbar + page toggles; `body.mode-easy` / `body.mode-pro` (+ `data-density`); global default in `paidia.uiMode` / `profilePrefs._uiMode`, per-page in `paidia.uiModePages`; honors `.pro-only` / `.mode-pro-block` / `.easy-only`.
- Kids/staff ratings use German school grades **1–6** (1 = sehr gut … 6 = ungenügend) with DE/EL labels.
- Expanded weekly categories: Alltag (Schule, Zuhause, Freunde, Gefühl) plus Verhalten, Mitarbeit, Aktivitäten.
- Important things (`thing:<choreId>`) rate daily/marked chores; Easy/Pro-friendly `.mode-easy-block` / `.mode-pro-block` sections.
- Reminder hooks: `paidia:kid-rating-due` event, `paidia.notif` flags (`kidRatingsDue`, `ratingHooks`), `window.PaidiaKidRatings`; notifications collect `kind:'rating'`.
- Notifications module aligned to `paidia.notif` (legacy `paidia.notifPrefs` migrate); quiet hours as HH:MM; rating/activity categories; reuse gate SW registration; server accepts grades 1–6, Verhalten/Mitarbeit/Aktivitäten, and `thing:<choreId>`.
- Subject grades and staff summaries follow the same 1–6 scale; legacy 1–5 stars migrate once.
- Visual feast polish within Armonia design system v2: heroes, empty states, arcade lobby.
- Replaced teal/cyan neon Spiele hero with sea-deep stone gradient; tokenised arcade mode controls.
- Icon pass: entry-sheet, house/group chips, notif bell, presence, journal type pills, import/history chrome → `#uiSprite` stroke icons.
- Animation feast: tide-line reveal on ops/kids/arcade/plan/book/gal/talk heroes; handover ribbon on task lists, kid directory, stock priority, home signals.
- Easy/Pro density hooks (`.mode-easy` / `.mode-pro`) plus preserved markers for `.notif-bell`, `.table-plan`, staff ratings.
- Plan week + shift views restored as real roster tables (house×day / person×day) with sticky headers and tap-to-add cells.
- Mobile week uses a stacked tabular day layout (not toy accordion cards); Pro mode can show the scroll matrix.
- Easy/Pro density hooks on roster matrices (`data-density`, `.mode-easy` / `.mode-pro`).
- Cache `paidia-v137`.

## v136 — 2026-08-25

- Rebuilt the active supermarket screen around one-handed, high-speed item decisions rather than a cramped icon grid.
- Added a focused progress header with house, Friday, remaining count, percentage, search, and secondary controls in one safe menu.
- Replaced ambiguous icon-only product actions with three explicit translated choices: bought, unavailable, and too expensive.
- Reworked product rows with category context, product icon, quantity, note, large touch targets, and clear selected-result states.
- Added a persistent completion surface with receipt access, progress feedback, and confirmation locked until every item is decided.
- Added responsive layouts for desktop, narrow phones, short landscape screens, bulk selection, and completed-item review.
- Cache `paidia-v136`.

## v131 — 2026-08-25

- Rebuilt Talk as a focused team workspace with a clear channel header, live status, and useful message/topic counts.
- Replaced generic chat bubbles with readable author, avatar, timestamp, date-divider, and message grouping treatment.
- Made mobile chat-first with a dedicated Messages/Meeting switch instead of forcing staff through the agenda before reaching chat.
- Reworked the meeting agenda with clear completion controls, responsive topic entry, suggestions, and completed-topic cleanup.
- Moved the real video-room and Zo-Ai actions into the channel header and kept the composer visible and usable across device sizes.
- Added auto-growing message input, narrow-screen action fitting, reduced-motion support, and short landscape handling.
- Cache `paidia-v131`.

## v127 — 2026-08-25

- Rebuilt Shopping as a clear flow: house, Friday, Plan/Take mode, then item entry.
- Added a dedicated shopping overview with open, low-stock, and bought counts.
- Kept scan, import, history, and bulk selection reachable at every responsive size through one secondary-actions menu.
- Replaced the icon-only quick-add action with an explicit translated label and restored purposeful empty-state actions.
- Added app-wide runtime overflow detection for every textual button label; controls tighten or wrap only when their actual content does not fit.
- Reworked shopping controls and item rows for desktop, tablet, narrow mobile, and supermarket mode.
- Cache `paidia-v127`.

## v124 — 2026-08-25

- Rebuilt Storage around a priority queue: empty items first, then low stock, with the full catalogue available only when requested.
- Replaced the crowded toolbar with one search field, one primary stock-movement action, and a compact secondary-actions menu.
- Removed the repeated per-product shopping buttons; shopping remains available through product details and the bulk low-stock action.
- Added a responsive health overview, explicit status tabs, two-column desktop queue/catalogue, and a single-column mobile flow.
- Kept direct quantity steppers, drafts, bulk selection, shift checks, multi-house comparison, search, and catalogue editing.
- Cache `paidia-v124`.

## v123 — 2026-08-25

- Removed the three-zone mental model from Daily and Weekly Plan; blocks remain only as internal form data for compatibility.
- Daily Plan is now one chronological agenda showing time, activity, staff, house, children, and notes in one readable flow.
- Weekly Plan is now seven day agendas on desktop and a single-open-day accordion on mobile, instead of three separate matrices.
- Empty schedules now show one purposeful add action per day rather than repeated empty morning, afternoon, and evening containers.
- Preserved entry creation, editing, deletion, house filtering, week navigation, validation, and weekly notes.
- Cache `paidia-v123`.

## v122 — 2026-08-25

- Rebuilt Daily and Weekly Plan as one responsive planning system with direct Day/Week navigation on mobile.
- Replaced the oversized Daily hero/calendar area with a compact operational header, useful counters, and three clear time-zone columns on desktop.
- Converted the mobile Weekly Plan from seven fully expanded days into compact day accordions, opening only the relevant day by default.
- Added immediate mobile house filtering while keeping Calendar, Shifts, and Events available in the secondary planning menu.
- Reduced empty-state height and matrix density while preserving entry creation, editing, removal, house filtering, full-screen tables, validation, and notes.
- Cache `paidia-v122`.

## v121 — 2026-08-25

- Rebuilt the staff Start page around one operational hierarchy: current shift, next required action, personal tasks, then supporting information.
- Added a full-width desktop command mast with integrated day signals and a quieter two-column work area instead of equal-weight card subdivisions.
- Added a dedicated mobile composition with a real greeting, compact status rail, focused task area, and three direct work destinations.
- Preserved shift presence, stock check, journal, task completion, notifications, children, calendar, gallery, tutorial, and end-of-shift actions.
- Cache `paidia-v121`.

## v120 — 2026-08-25

- Rebuilt login as a true full-screen doorway with a strong Armonia identity panel on desktop and a compact branded header on mobile.
- Entrance, profile selection, PIN, passkey, and PIN-reset states now stay inside one viewport without page scrolling.
- Replaced the narrow desktop login card with a balanced split layout and converted profile selection to a responsive compact grid.
- Condensed the mobile PIN flow while preserving 40–44px touch targets, biometric login, build information, and recovery controls.
- Cache `paidia-v120`.

## v119 — 2026-08-24

- Kids is now a first-class mobile destination in the bottom navigation instead of being hidden behind More.
- The mobile Kids directory uses one-row filters, compact overview counters, and three readable signals per child instead of squeezing six desktop metrics into every card.
- Opening a child, changing a Kids section, or returning to the directory reliably resets the view to the top.
- Child profiles prioritize the anonymous weekly team evaluation, use touch-sized rating controls, and remove redundant mobile schedule clutter.
- Installed and long-lived PWA sessions detect a newer release manifest before app boot and perform one safe cache-busted refresh.
- Cache `paidia-v119`.

## v118 — 2026-08-24

- Child sessions never receive raw staff-evaluation records or evaluator identifiers; the server returns only anonymous weekly aggregates for the signed-in child.
- Staff sessions retain the full evaluator-owned records required to update the equal-weight weekly average.
- Child clients purge any raw v117 staff-rating cache and render exclusively from the anonymous server summary.
- Cache `paidia-v118`.

## v117 — 2026-08-24

- Every staff member can submit one weekly four-area evaluation for each child without overwriting the child's self-rating.
- Each child's weekly team score averages every participating staff member equally and shows the number of evaluators plus per-area averages.
- The shared weekly result is visible in the staff directory, child profile, child home, and the child's four-week evaluation trend.
- Cache `paidia-v117`.

## v116 — 2026-08-24

- Rebuilt the staff Kids directory around useful signals: grade average, weekly attendance, open homework, XP/level, and game wins.
- Child profiles now combine editable subject grades, attendance, homework, badges, self-ratings, and synchronized game progress in one dashboard.
- The child home screen now shows a school snapshot and a personalized next-game challenge alongside the existing 13-game arcade and rewards system.
- Game launches and personal bests are persisted per child in shared data, allowing staff and children to see the same progress across devices.
- Cache `paidia-v116`.

## v115 — 2026-08-24

- Closing the Profile sheet while its security and passkey cards are still loading no longer throws an async null-handler error or shows the generic crash toast.
- Includes the v114 calendar, next-shift handoff, late-alert, and truthful notification-delivery fixes.
- Cache `paidia-v115`.

## v114 — 2026-08-24

- The main Apple / `.ics` profile action now downloads the complete eight-week calendar immediately; Google and Outlook remain in the detailed calendar view.
- Shift end now identifies the next scheduled team member, includes that lookup in the Talk handoff, and automatically resumes after the required journal note is saved.
- Late check-ins create persistent admin inbox alerts with the employee, shift, time, and stated reason.
- Notification setup and testing now report actual delivery failure instead of showing a false enabled state.
- Cache `paidia-v114`.

## v113 — 2026-08-24

- Flattened the desktop Lager controls into a full-width toolbar with wrapping actions and no overlap.
- Fixed shift calendar lookup, Athens timezone metadata and `.ics` generation.
- Migrated granted notification permissions into the active preference store and retry failed deliveries.
- Made notification delivery await the service worker before marking alerts as sent.
- Added overnight shift lookup and reliable late-arrival prompts.
- Added confirmed automatic handoff summaries to Team Talk at shift end.
- Cache `paidia-v113`.

## v112 — 2026-08-24

- Restored a solid, labeled desktop navigation rail with readable contrast.
- Replaced the narrow shopping control rail with one centered toolbar and list flow.
- Removed duplicate shopping summaries and empty-state actions from the desktop page.
- Let text-bearing header controls size to their labels instead of clipping.
- Cache `paidia-v112`.

## v111 — 2026-08-24

- Rebuilt the mobile Home composition around one action, one checklist and one task list.
- Removed mobile dashboard summaries, secondary toolbars and decorative empty-state panels.
- Flattened Plan, Lager, Liste and Buch into section headers and work rows.
- Constrained all mobile actions and controls to the viewport to eliminate overlap.
- Cache `paidia-v111`.

## v110 — 2026-08-24

- Replaced the staff UI's layered glass/prototype styling with one flat operational design system.
- Converted plan, stock, shopping and logbook surfaces from decorative card stacks to compact work lists.
- Standardized typography, spacing, controls, navigation, states and responsive desktop/mobile chrome.
- Added `ui-v110.css` as a versioned final presentation layer so the overhaul is isolated and reversible.
- Cache `paidia-v110`.

## v109 — 2026-08-23
- Mobile UX reset: flat warm gate, scannable profile rows, calm solid work surfaces
- One-handed five-item dock; Momente, Kinder, Talk and Buch moved into a clear “Mehr” sheet
- Mobile Home hierarchy tightened: compact chrome, stronger primary action, four-column status strip
- Removed prototype styling on phones: decorative glass, floating cards and the content-obscuring Zo-Ai bubble
- Accessibility retained: 40–54px controls, visible focus states, semantic dialog/navigation labels
- Cache `paidia-v109`

## v108 — 2026-08-23
- Mobile Glass 2026 (Figma `07`): light frosted staff header on phone/tablet
- Ink-on-glass topbar buttons (bell, lang, profile) — matches browser frames
- Cache `paidia-v108`

## v107 — 2026-08-23
- Desktop header glass: ink-on-light topbar buttons (was white-on-white)
- Hit targets ≥44px (topbtn, chips, btn.sm); rail width locked to 220px with labeled nav
- Dock/nav pointer-events hardened on desktop
- Figma: page `07 — Mobile Glass 2026` (WEB FIRST browsers + iOS/Android + depth screens)
- Cache `paidia-v107`

## v106 — 2026-08-23
- PC desktop shell (≥900px): fixed 220px chrome sidebar with brand + Zo-Ai, not a stretched phone dock
- Dense Home: main column + right rail (Mitteilungen, Kinder, Schichtende)
- Schichtende sheet: Buch → Tasks → Handover → Abmelden
- Mitteilungen center from topbar bell; shop ops rail docked on desktop
- Cache `paidia-v106`

## v105 — 2026-08-22

Staff expansion roadmap (visual + school + Zo-Ai), one ship:

- **v102 visual:** Home shift ring + 7-day sparkline; Plan day-load ring; Lager history sparkline when log exists; hero stone texture; pine-settle motion; tutorial Liquid Glass + `ui(...)` icons; Kids/Zo-Ai tutorial steps; desktop denser home grid
- **v103 kids/school A:** Staff dock **Kinder**; profiles (XP, ratings, notes); `DB.subjects` / `subjectGrades` (1–5 stars); admin subject CRUD; child read-only subjects; Zo-Ai `subject_grade_set`, `kid_note_add`, `open_kid`
- **v104 SIS-lite:** Attendance day grid; homework list; subject timetable; Zo-Ai `attendance_set`, `homework_add`
- **Zo-Ai reliability:** Clearer success toasts (Lager/Liste/Plan/Schule); richer help context (children + subjects); Confirm still required (+ PIN for schedule)
- Ops sync: new keys on `/api/ops`; cache `paidia-v105`

## v101 — 2026-08-22

- Staff Liquid Glass 2026 from Figma prototype: frosted cards, floating chrome dock, Zo FAB label
- Kill remaining dark home/shift heroes so stone + pine always wins
- Cache `paidia-v101`

## v100 — 2026-08-22

- Staff Home: Figma mast (brand + greeting + lede), signal tiles, glass shift card, quieter “Mehr”
- Plan / Lager / Liste shells: ops heroes, widgets, pine bulk bar; mechanics unchanged
- Galerie / Talk / Übergabe / Zo-Ai: light heroes + glass panels; confirm flow untouched
- Staff chrome: dock inverted only; page-actions glass; planner icons → `ui(...)`
- Cache `paidia-v100`

## v99 — 2026-08-22

- Spiele hub: glass-1 tiles, featured snap-rail, pine-settle stagger, XP/streak chips
- Widget catalogue: `ringHtml`, `sparklineHtml`, `statTileHtml`, `miniCalendarHtml`
- Games: stroke icons where mapped; React sparkline from last 8 attempts
- Cache `paidia-v99`

## v98 — 2026-08-22

Accept the Supabase pooler URL as issued.

With v97 pointing writes at Supabase, the connection failed on `invalid URI
query parameter: "supa"`. Supabase tags its pooler URLs with a vendor marker
(`?supa=base-pooler.x`), and libpq rejects any query parameter it does not
recognise rather than ignoring it. `db.py` now filters the query string down to
libpq's own keywords before the URL reaches psycopg, so vendor extras are
dropped and `sslmode` and friends survive.

## v97 — 2026-08-22

Save to the database that still works.

The retired Neon store is connected to the project at "All Environments", so
Vercel re-injects its `DATABASE_URL` on every deploy no matter what the
environment rows say — and that URL wins on name order, sending every write to a
project whose transfer quota is exhausted. Reachability could not break the tie:
Neon accepts the TCP connection and only then fails on quota.

`db.py` now ranks candidate URLs instead of taking the first name that matches —
a reachable non-Neon host beats a reachable Neon one, unreachable hosts sort
last, and discovery order breaks ties within a rank. `PAIDIA_DATABASE_URL`
overrides the ranking outright when a specific URL has to win.

## v96 — 2026-08-22

Find the Postgres URL whatever the integration named it.

Vercel marketplace integrations allow a custom variable prefix, and the Supabase
install landed as `A_POSTGRES_URL` rather than `POSTGRES_URL` — so a correct
setup would still have reported no database. `db.py` now falls back to any
`*_POSTGRES_URL` after trying the explicit names. `POSTGRES_URL_NON_POOLING` is
excluded by construction: it does not match the suffix, and it is the direct IPv6
host Vercel cannot reach.

Verified: a prefixed pooled URL is found and passes the pooler check, a prefixed
non-pooled one is not preferred over it, and an explicit `DATABASE_URL` still
wins over everything.

## v95 — 2026-08-22

The Redis-REST backend now accepts either env-var convention: the legacy
`KV_REST_API_URL` / `KV_REST_API_TOKEN` pair and Upstash's own
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. Marketplace integrations
inject different names for the same endpoint, and guessing wrong would have
looked like "storage still broken" after a correct setup. Verified against the
stub under the Upstash naming.

## v94 — 2026-08-22

Durable storage without Postgres, and without Neon.

`db.py` gains a Redis-REST backend (Vercel KV / Upstash). The module's whole
public surface is `get_json` / `set_json` / `has_key` / `health` — a key-value
shape — so this is a natural second backend rather than a port.

Activates when `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set and no
`DATABASE_URL` is present, so Postgres still wins where it is configured and the
local SQLite path is untouched. Uses stdlib `urllib` only — no new dependency.
Security events use `LPUSH` + `LTRIM` to keep the same capped-log behaviour as
the SQL backend.

Vercel Blob was considered and rejected: its objects are served over URLs, and a
leaked or logged URL would be an unauthenticated read of caregiver and child
records. KV is private and token-authenticated.

Verified against a local REST stub: PING/SET/GET/EXISTS round-trip, JSON and
non-ASCII (Greek + German) survive intact, `get_json` honours its default, the
security log caps, SQLite is unaffected when KV is unset, Postgres takes
precedence when both are set, and a bad token raises and is reported by `health`
rather than failing silently.

## v93 — 2026-08-22

Stop reporting a successful save for a write that never reached the database.

`persist_ops_state()` discarded the result of the durable write. The /tmp copy on
Vercel always succeeds and is wiped when the instance recycles, so `put_ops`
returned 200 and staff were shown success for data that was already gone. It now
returns whether the write reached durable storage, `put_ops` and `put_kid_ops`
pass that back as `durable`, and the client shows a persistent red banner plus a
toast instead of a false confirmation.

Provider note: `db.py` already accepts Supabase poolers as well as Neon, so
moving to another free Postgres is a `DATABASE_URL` swap with no code change.

## v92 — 2026-08-22

Kid data can now persist. Two gaps, both closed.

- `chores`, `choreSubmissions`, `xpLog`, `gameStats`, `kidRatings` and `kidNotes`
  were in the localStorage set but **not** in the server's `OPS_KEYS`, so they
  never reached durable storage even when the database was healthy. They are now
  part of the synced set, with row caps, and `gameStats` registered as a dict key.
- `put_ops` is staff-only by design, so a child's device had **no write path at
  all**. New `POST /api/kid-ops` (mirrored in `api/index.py`): child session
  required, and it can touch only `kidRatings` and `kidNotes`.

Ownership is taken from the session and stamped onto every row server-side, so a
forged `kidId` in the payload is ignored rather than trusted. Rows belonging to
other children are preserved on write. Verified against local SQLite: a second
child cannot overwrite the first's rows, a row claiming `kidId: "k1"` sent from
k2's session is stored as k2's, staff keys sent to the endpoint are ignored, a
staff session is refused 403, and anonymous is refused 401.

Client pushes are debounced 900ms, since ratings fire on every star tap, and fail
soft when offline — the local copy still holds and the next save retries.

## v91 — 2026-08-22

Emoji removed from the interface chrome. The design doc has listed
"emoji used as primary iconography" as a placeholder to replace since v1, and it
was the single biggest thing still making the app read as dated.

- 18 stroke icons added to the existing sprite (check, tasks, calendar, book,
  camera, cart, sparkle, alert, megaphone, person, note, receipt, plus, clock,
  leaf, search, chat, party), on the same 24-grid and `currentColor` convention
  as the nav icons, with explicit sizing.
- New `ui(id)` helper; empty states, the Zo-Ai launcher and the visible chrome
  buttons now render icons instead of emoji.
- Content emoji deliberately kept: food categories and chore glyphs are *data*,
  and outline icons for milk vs butter would be worse for staff scanning a shelf.

## v90 — 2026-08-22

Three Kids surfaces from the Figma frames, built in the app.

- **Bewertungen** — weekly self-rating across Schule / Zuhause / Freunde / Wie
  ich mich fühle, five stars each, stored per ISO week per child, with a
  four-week trend showing the computed average.
- **Bonus** — derived, never stored, so it cannot drift from the chore and XP
  data it reads: streak, plus four earn conditions with their point values.
- **Notizen** — the child's own notes with a mood picker (Gut / Geht so /
  Schwer). Deliberately local to the device: these are the child's words and are
  not part of the shared ops blob staff sync between phones.

Reachable from Start; the dock keeps five items and highlights Sterne or Start
as appropriate rather than growing to eight.

All strings added in **both** DE and EL. New `kidRatings` / `kidNotes` keys added
to the persisted set.

## v89 — 2026-08-22

Responsive layout for every aspect ratio, not just phone-or-desktop.

The app had a single binary switch at 900px. An iPad at 768px therefore got the
phone layout with a **748px-wide "floating" dock pill** stretched across the
bottom — a phone control blown up rather than a tablet one. There was no tablet
tier at all, and almost no orientation handling.

Five tiers now:

- **<=359** compact phone / folded foldable — single column, tighter gutters,
  smaller dock labels.
- **360–599** phone (unchanged default).
- **600–899** tablet portrait, previously missing — content gets a 720px measure
  instead of running full-bleed, three-column dashboard.
- **900–1279** tablet landscape / small desktop — 900px measure, three columns.
- **>=1600** large desktop — 1080px measure, four columns.

Plus: landscape phones (`max-height:500px`) compress the header and dock and
drop to a denser grid; very short viewports tighten the shift card; and the
floating dock is capped at 560px and centred at *any* width where it is not the
desktop rail, with the Zo-Ai launcher aligned to its edge.

Measured at 320, 375, 430, 600, 768, 812x375, 1024, 1280 and 1680: no horizontal
overflow at any size.

## v88 — 2026-08-22

Load and reload fix. The app was re-downloading ~1.1 MB on **every** load and
reloading itself on top of that.

- **Service worker**: v83 went network-first on everything with
  `cache: 'no-store'` to kill stale bundles. That also bypassed the browser's own
  HTTP cache, so `index.html` + `app.js` (~1 MB) were re-fetched every load, and
  `activate` wiped every cache including icons. A `?v=N` URL is immutable by
  construction — the next release changes the URL — so versioned assets are now
  cache-first, the shell and `build.json` stay network-first with a cached
  offline fallback, and activate only drops *other* builds.
- **Reload loop**: `purgeStaleShell()` unregistered the worker, which forced a
  re-register, which fired `updatefound`, whose handler called `location.reload()`
  — which re-registered again. It no longer unregisters and no longer reloads;
  `app.js` also stopped registering a second worker in a race with `gate.js`.
  There is now no `location.reload()` anywhere in `gate.js`.
- **HTTP caching**: `app.js` was served `Cache-Control: no-store` (747 KB, every
  load). Version-stamped assets now get `public, max-age=31536000, immutable` in
  both `server.py` and `api/index.py`; the shell and `build.json` stay `no-store`
  so a release still lands immediately.

Net effect: first load unchanged, every subsequent load serves the bundles from
cache instead of the network.

## v87 — 2026-08-22

- Remaining staff screens brought onto the design system.
- **Foreign palettes removed.** 210 colour uses across 141 rules were Tailwind
  rose / emerald / amber (`#dc2626`, `#ecfdf5`, `#fbbf24`, `#fecdd3` …) — none of
  them an Armonia token. Remapped onto `--out` / `--in` / `--warn` and their
  tints, mapping by luminance so light washes stay washes and accents stay
  accents, preserving every text-on-background pairing.
- **Plan, Talk, Buch, Galerie heroes**: the last pre-redesign dark gradient
  cards, now stone canvas with sea eyebrow, Fraunces ink title and muted lead —
  matching Home. Kids/arcade heroes deliberately untouched (own direction, v79–80).
- **Zo-Ai launcher** now pine, not the pale brand-mark gradient.
- **Liste layout bug**: `.friday-picker` collapsed to 0 width inside a `nowrap`
  row, so the date label overflowed on top of the stepper. Given a real minimum
  and its own line on phones.
- Gallery hero contrast: helper lines were mark-a on stone (1.61:1). Now 6.37:1.
- Verified logged in at 375px and 1280px across Home, Plan, Lager, Liste, Talk,
  Momente.

## v86 — 2026-08-22

- Staff **Home** brought onto the design system. It had kept its pre-redesign
  structure while only the tokens shipped, which is why it still read as the old UI.
- Hero: dark gradient card -> stone canvas, sea eyebrow above a Fraunces wordmark,
  muted lead, pine primary action (matches the Figma "Home" frame).
- Shift banner: was a full-bleed crimson wash built on Tailwind rose
  (`#7f1d1d` / `#fecdd3`) — colours in no Armonia token. Now glass-1 with a 3px
  semantic accent edge and a 10% tint: pine by default, terracotta when late,
  success when done. Terracotta is an accent, never a wash.
- Step rows, marks and CTAs re-tokenised; desktop caps the primary action at 360px.
- Verified on mobile (375) and desktop (1280).

## v85 — 2026-08-22

- Fix the Neon data-transfer burn that exhausted the quota and took durable
  storage offline. `/api/ops` and the gallery are polled every 2.5s and each poll
  re-read the whole blob from Postgres — roughly 17 MB/hour per open tab.
- Added a 15s in-process cache for the two hot keys (`ops`, `gallery`), dropped
  on write so an instance never serves its own stale value. Measured: 20 polls
  now cost 1 database read instead of 20.
- The security/lockout key is deliberately left uncached — a stale read there
  would widen the PIN brute-force window across instances.
- TTL is tunable via `PAIDIA_DURABLE_TTL` (seconds; 0 disables the cache).
- Corrected the Greek login banner string, which had been left on v83 text.

## v84 — 2026-08-22

- Merged the pre-redesign `main` line back in; kept `notifications.js`
  (`window.PaidiaNotify`: calendar grid, reminder scheduling, ICS export, badges)
- Wired `notifications.js` into the shell and both static allowlists — it shipped
  on the old line but was never reachable from the redesign
- Removed a duplicate `run_chore_verify` the merge introduced; kept the hardened
  version (clamped input, routes via `llm_completion` rather than Groq-only)
- Removed an unreachable duplicate `/api/chore-verify` route in `api/index.py`
- Kept the redesign's shell, manifest and service worker — they supersede the old
  line, including a richer `notificationclick` handler
- Cache `paidia-v84`

## v83 — 2026-08-22

- Force fresh UI: service worker no longer caches `app.js` / `gate.js` / `index.html`
- Gate purges old PWA caches once per release and re-registers SW before login
- Cache `paidia-v83`

## v82 — 2026-08-22

- Login hotfix: remember-me is opt-in (unchecked by default) so PIN works before API redeploy
- Vercel auth bridge: forward `remember`, catch handler errors as JSON (no HTML 500)
- Cache `paidia-v82`

## v81.1 — 2026-08-22

- Fix Vercel login crash: Flask auth bridge now forwards `remember` to session minting (was 500 → “Anmeldung nicht möglich”)
- Session decode preserves `remember` for sliding cookie refresh

## v81 — 2026-08-22

- Phase 3 Kids icons: chore cards, badges (earned/locked), empty states use SVG `currentColor` sprites
- Explicit width/height on inline icons (no unsized SVG viewport swallow)
- Cache `paidia-v81`

## v80 — 2026-08-21

- Remember-me: last profile skip on cold open, 30-day session when checked, sliding cookie refresh
- Faster entry: `window.__paidiaBootSession` handoff, preload `app.js` on PIN, soft Laden skeleton
- Kids: dock clearance + Zo-Ai above dock; 380/600/900 + landscape; dedicated dock SVG icons
- Start secondary chips (Events / Galerie / How-to); empty-day CTA to Plan
- Cache `paidia-v80`

## v79 — 2026-08-21

- Kids Phase 1: student-app shell matching Figma Kids frames (Start, Stundenplan, Aufgaben, Sterne, Lernen)
- Child dock: Start · Plan · Lernen · Sterne · Spiele (replaces emoji tab strip)
- Widgets: SVG progress ring, level meter, streak, badge grid, segmented quiz progress
- Sterne view: balance ring, weekly delta, 7-day streak, earned/locked badges, leaderboard
- Stundenplan terracotta now-line on the active block; Aufgaben `--out` overdue after 17:00
- Handover-ribbon stagger on lesson / plan / Aufgabe rows (capped at five)
- Cache `paidia-v79`

## v78 — 2026-08-21

- Design system v2 implemented from `design/VISUAL_MOTION_SYSTEM.md` (§2–§7)
- Full token layer: stone scale, hairline-strong, pine/amber tints, sea-deep,
  glass-rim, radius lg/pill, 4/8 space scale, type scale, motion tokens
- Elevation model: glass-1 tiles, glass-2 sheets, inverted chrome dock
- Dock is now the one dark surface — floating chrome pill, mark-a active state
- Three named motions: tide-line reveal, pine settle, handover ribbon
- Tabular numerals on all counts/times; opaque inputs; visible focus rings
- `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast` support
- Living style guide: `design/system-preview.html` (`scripts/build-style-guide.py`)
- `design/armonia.tokens.json` synced with the shipped `:root`
- Figma: [Armonia Thassos — Design System v2](https://www.figma.com/design/chWjXFxyCaFzFC6438lk4N)
  — 74 variables, 12 text styles, 3 elevation styles, motion specs
  - Material page: stone / pine / sea / courtyard / sea-gap plates + grain overlay,
    and the four-step hero treatment recipe (placeholder until real photography)
  - Widgets page: ~24 widgets — rings, streak, charts, level meter, field states,
    stepper, toggle, checklist, slider, date chips, avatars, status pills, presence,
    toast, banners, sheet, chat, media grid, dropzone, calendar, empty state
  - Screens: Login, Home, Übergabe, Plan, Lager, Liste, Galerie, Zo-Ai
  - Kids page: child mode reframed as a student app — level and star economy,
    Stundenplan with now-line, Aufgaben with progress, Belohnungen, Lernen quiz
- Cache `paidia-v78`

## v77 — 2026-08-21

- Design polish: denser Home signals/cards, glass command bars, pine bulk bar
- Figma Redesign v2 page (Armonia mast + Liste/Lager/Store) — not the Inter wireframes
- Cache `paidia-v77`

## v76 — 2026-08-21

- Multipage hash routes: `#home`, `#shop/plan|take|store`, full `#schedule/*`, `#stock`, …
- Select + sticky bulk actions on Liste, Lager, and supermarket store mode
- Compact informative Home (4 signals: due, overdue, list, stock)
- Figma: [Armonia Ops — Multipage Redesign](https://www.figma.com/design/PCNyO5gOJ1Q49WsJJkOpmu)
- Docs: `docs/agents/PUSH_ORIGIN.md` (ANGUELdad push / Cloud Agent 403)
- Cache `paidia-v76`

## v75 — 2026-08-20

- Shop hub: Plan / Mitnehmen, Auto aus Lager, take-list by aisle
- Schedule calendar month view + `#schedule/calendar` deep link + ICS export
- Kids rewards/chores (⭐ tab) with AI verify + admin Aufgaben-Zentrale
- Game win XP grants; notification quiet hours, lead time, app badge, Friday shop reminder
- Cache `paidia-v75`

## v74 — 2026-08-19

- Momente tab paints immediately (skeleton) then refreshes in the background
- Groq chat remaps retired `llama-3.3-70b-versatile` → `openai/gpt-oss-120b`; OCR stays `qwen/qwen3.6-27b`
- `/api/health` reports per-model Groq catalog status and refuses direct (IPv6) Postgres hosts
- Cache `paidia-v74`

## v69 — 2026-08-06

- UX Phase 1: Home one composition (mast + shift + signals + today; rest under “Mehr”)
- Plan/matrix day headers show full dates; mobile day chips include year
- Stock drafting pine (not blue); tutorial/help/import off indigo
- Talk stays a dedicated dock tab (label “Talk”)
- Admin Automationen panel for local notification rules (shift / stock / late / banner)
- Cache `paidia-v69`

## v68 — 2026-08-06

- Expanded agent knowledge / memory / token-reduce maps for all major code areas
- `docs/agents/BIOMETRICS.md` — iPhone Face ID + Android fingerprint setup
- Cold-boot `gate.js` Face ID / fingerprint login (primary CTA) + version chip on PIN
- Login always shows version + what changed (DE/EL)

## v67 — 2026-08-06

- Agent knowledge / memory / token-reduce maps (`docs/agents/`, `AGENTS.md`)
- Login screen shows app version + what changed (`build.json`)
- Biometrics-first gate CTA + WebAuthn env docs
- Admin broadcast HTML preview + bilingual email bodies
- Stronger notifications UX; child portal Mitteilungen + install/how-to instructions
- Admin broadcast optional in-app banner for online staff/kids; WebAuthn origin soft warning
- Zo-Ai Omni/knowledge tighten; learn/quiz/caption via same LLM helper; admin broadcast/event drafts
- Web Push deferred — see `docs/agents/WEB_PUSH_LATER.md`

## v66 — 2026-08-06

- Schichtbuch journal (append ink, duty banners)
- Home shift-start checklist + presence panel / notifications
- Per-person calendar (Apple .ics, Google, Outlook) with 30‑min alarms
