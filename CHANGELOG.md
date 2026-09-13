## v248 · 2026-09-13

True mobile site rebuild (staff + kids) per plan.

- `/m/` layout authority: new `mobile/m-ui.css` (wired last via shell builder).
- Dedicated `renderMobile*` dispatch in `app.js` for every staff tab + kid view when `shell-m`.
- Home is always the phone stack on `/m/` (not viewport-width gated).
- Shell auto-correct: phones stay on `/m/` unless PC override is set.
- Cache `paidia-v248`.

## v247 · 2026-09-08

iPhone Playwright critique pass (`.qa-screens/v246-iphone/` + `CRITIQUE.md`).
New stylesheet `ui-v247.css` — beat `mobile.css` !important that kept Plan
Agenda/Tabelle + week switcher open after v246.

- Plan: hide Agenda/Tabelle, week switcher, AI fill row on phone; stop Tag/Woche sticky overlap; selected day chips readable (near-white on brand).
- Pocket: truncate kid rail text; hide illegible calendar amount labels on phone.
- Kinder: metric value/label stack (no `0%Anwesenheit`); compact 44×44 edit/remove.
- Kid Spiele/Start: arcade rail owns overflow; XP contrast; dock clearance; first-run padding.
- Lager: tighter pantry hero so shelves can reach the fold.
- Cache `paidia-v247`.

## v246 · 2026-09-08

Ship-today Plan A slices from `docs/agents/redesign/*` — concrete page fixes,
not full Plan B restructures. New stylesheet `ui-v246.css`. Notes index:
[docs/agents/redesign/INDEX.md](docs/agents/redesign/INDEX.md).

- Lager: `has-draft` rows visible again (beat the `!important` stepper rule).
- Kinder: attendance colours restored on phone; excused gets its own ink.
- Home: mobile inbox from `staffInboxItems()`; Überfällig opens the inbox, not today's plan.
- Liste: Mitnehmen segment is the door into `Im Supermarkt` store mode.
- Plan: phone chrome trimmed (~229px); ··· opens Dienst/Events (was dead behind a hidden wrap); week summary labels tell the truth; week swipe on agenda board (±7 days).
- Kid Plan: empty day offers jump to next day with entries.
- Taschengeld: horizontal kid rail; Verlauf before Schnellbeträge.
- Buch: duty → incoming → write first; calendar moved under secondary.
- Admin: attention block first; phone hides the 4.6-screen desk dump.
- Momente: full-width gallery grid on desktop; hide duplicate Feed picker on phone.
- Kid: honest Notizen kicker; truthful Bewertung CTAs; Bonus missions in Easy; fresh zero-star Start; Weiter from `lastGameId`; empty Sterne collapses; dock-duplicate CTAs hidden in Easy; Learn/Games continue; eyebrow contrast; desktop kid FAB hidden.
- Lagercheck follows the lit house chip (`shiftStockHouseId()`).
- Audit harness: `rewards` not `stars` for Sterne captures.
- Cache `paidia-v246`.

## v245 · 2026-09-07

Audited by driving the **real gate login** on an iPhone (mode card → profile →
pinpad → app → dock walk) rather than jumping in via the API. New flow script
`scripts/qa-iphone-login-flow.mjs`; notes in
[docs/agents/UI_AUDIT_V245.md](docs/agents/UI_AUDIT_V245.md). 16 P1 → 3 P1, and
**zero findings on the phone** across 20 phone pages.

- "Nicht gespeichert" only warns about real changes: opening the Taschengeld form and leaving no longer triggers a native confirm, stale list-removal ids are pruned instead of counted, and float noise in the stock draft no longer registers. Locked in by `scripts/qa-unsaved-guard.mjs`.
- Kid bottom chrome: the install bar sized itself off the staff dock token and rendered under the kid dock; the Zo-Ai FAB covered its dismiss button. Zo-Ai moved into the Mehr sheet, where the kid dock already suppresses it — a fixed FAB always covered the right-hand column of the kid calendars.
- Desktop Zo-Ai FAB removed: the sidebar already carries a full-width Zo-Ai row, and the floating duplicate covered the Buch calendar's last date cells.
- Less chrome before content on the kid views: the welcome banner is scoped to Start (and its copy now points at the dock, not a menu that is hidden on phones), the back row is limited to Mehr-only views, hero cards are actually compact, and empty month calendars collapse. First game moved from y≈791 to y≈250.
- Kid Spiele in Easy mode stacks the games as a list instead of a filmstrip that put four of five off-screen.
- Staff Plan shows the week above the fold: the Lagercheck prompt no longer repeats on a third tab, the disabled Zo-Ai clear is hidden, and "+ Eintrag" is the single filled primary. "Diese Woche" reads as current state instead of a dead grey button.
- Staff dock icons switched to the same stroke set as the rest of the app; Liste no longer shows two identical "Foto → Liste" buttons; the "wer?" stat caption is now "Ohne Person"; active chips in horizontal rails scroll into view.
- Cache `paidia-v245`, new stylesheet `ui-v245.css`.

## v244 · 2026-09-07

Full UI audit of both surfaces (PC 1440x900 + iPhone 393x852) across all staff
tabs and kid views. New auditor `scripts/qa-ui-audit-2026.mjs`; notes in
[docs/agents/UI_AUDIT_V244.md](docs/agents/UI_AUDIT_V244.md). 60 P0 / 132 P1 → 0 P0 / 16 P1.

- Invisible text fixed: the kid "Als Nächstes" label and its chip rendered at 1.00:1 and 1.05:1 (sea on sea) on every kid view; the desktop Home greeting and kicker rendered dark on the dark hero.
- Icon boxes: `#view svg { height:auto }` outranked every `.ui-ico` height, so icons laid out 150px tall and kept every icon button stuck in `ui-fit-tight` with shrunken labels.
- Type scale: the small end is pinned in px, so desktop's 14px root no longer collapses caption/eyebrow/micro to 11.4/9.6/8.75px.
- Contrast: muted ink darkened to clear WCAG AA on white and on tinted cards; sun accent darkened where used as label text.
- Unclickable controls: Taschengeld's sticky action bar covered its own chip rails; Liste's three-way segmented control spilled under the ••• trigger.
- Phone chrome: kid header no longer clips the title, kid dock no longer cuts "Taschengeld", Zo-Ai FAB no longer blocks a shortcut tile.
- Phone layout: empty planner card removed, Home reads as one card column, 44px touch floor across rails and segmented controls, tile grids no longer end on a lone tile.
- Cache `paidia-v244`, new stylesheet `ui-v244.css`.

## v243 · 2026-09-07

- Mobile fill + density: single 10px gutter, cards full-width, 44px controls (less chunky empty space).
- Cache `paidia-v243`.

## v242 · 2026-09-07

- Mobile tutorial: pin coach card top/bottom above dock; cap spotlight hole so page targets no longer float randomly.
- Page tips use the same phone sheet placement.
- Cache `paidia-v242`.

## v241 · 2026-09-07

- Mobile `/m/` iPhone layout containment: stock/home no longer expand to ~560px or clip CTAs.
- Full-width Lager “+ Hinzufügen”; stacked Home shift-step rows; week chrome nav fits without overlap.
- Horizontal house/chip rails scroll inside the viewport (page scrollWidth stays phone-width).
- Cache `paidia-v241`.

## v240 · 2026-09-07

- Anti-spam notifications: quieter category defaults; one-shot migrate existing installs (`antiSpam239`).
- No double OS toasts (`syncFromContext` badge-only); max 1 non-critical toast per sweep + ~12m cooldown.
- 60s tick = badge only; full OS sweep every 15m; wake throttled ~5m; enable no longer dumps all due items.
- Badge counts today’s open work (not 7-day backlog); low-stock once per day.
- Cache `paidia-v240`.

## v239 · 2026-09-07 · local verification

- Atomic attendance commands and bulk preview; unrecorded attendance is distinct from absent and excluded from attendance percentages.
- Child ops responses are allowlisted and scoped; other children's money, staff notes, inventory and unknown collections are excluded. Older child caches are reset.
- Persist school lesson notes and important dates; reject unknown shared collections instead of silently discarding them.
- Preserve server command audit records through compatibility snapshots; validate receipt units, stock references and initial counts.
- Raised literal sub-12px UI text to 12px. Updated behavioral privacy/notification checks and corrupt-data normalization.
- Full redesign release gates remain open in docs/agents/redesign/IMPLEMENTATION.md. No release publication in this task. Cache paidia-v239.

## v238 · 2026-09-07

- Desk Liste: force single-column plan board (no sticky side command rail); keep dense thin product rows.
- Cache `paidia-v238`.

## v237 · 2026-09-07

- Desk Liste (`#shop/plan`): full-width dense board — compact overview/KPI strip, thin command chrome, small product lines (~30px steppers).
- Cache `paidia-v237`.

## v236 · 2026-09-07

- Desk Kids: full-width dense directory, compact KPI strip, pencil/trash icon actions instead of long edit labels.
- Staff overview label fixed (`mit Noten` instead of child-facing `Meine Noten`); empty attendance shows `kein Eintrag` (not “offen/unsaved”).
- Cache `paidia-v236`.

## v235 · 2026-09-07

- Zo-Ai child isolation: kid-only knowledge pack (`child-overview` / `child-safety`), UI context whitelist, anti-injection prompt, reply leak filter, untrusted `<user_message>` wrapping.
- Session role always wins over client spoof; child never receives inventory / opsSnapshot / staff topic map.
- Tests: `tests/test_zoai_child_security.py` (prompt-injection corpus, no live LLM).
- Cache `paidia-v235`.

## v234 · 2026-09-07

- Desk login: auth gate fully covers app/rail (fixes blank white main stage when chrome leaked through).
- Page enter animations no longer use fill-mode `both` that could leave content at opacity 0.
- Cache `paidia-v234`.

## v233 · 2026-09-07

- Nested Moments (`#gallery/*`) and Account (`#account/*`) with section shell (desk sidebar / mobile subnav).
- Liste: Remove-all opens reason sheet immediately; pending confirm dock is viewport-fixed.
- Stock: dense full-width rows, centered house+search bar, clearer icons, icon picker, type-in qty.
- Plan week: single week chrome (no giant period hero); AI/Import in compact toolbar.
- Pocket: thin kid rail so every kid (incl. last) is easy to reach.
- Cache `paidia-v233`.

## v232 · 2026-09-07

- Master Tutorial (`?`) in the top bar on PC and mobile: explain this page (spotlight per control) or full app tour.
- Cache `paidia-v232`.

## v231 · 2026-09-07

- Admin hub: change any profile PIN/email; send access emails with info + App buttons; broadcast CTAs.
- Cache `paidia-v231`.

## v230 · 2026-09-07

- iOS notifications audit notes; live still needs VAPID env for background push.
- Book + Plan calendars: multi-dot markers + shared day ops detail; important dates CRUD.
- Staff `#personnel` hub; School Moodle Armonia (`#school` + `/school/`) with lesson notes.
- Cache `paidia-v230`.

## v229 · 2026-09-07

- Schedule snaps a past `paidia.scheduleDate` to today on boot and when opening Plan; day view gets a Today jump.
- Cache `paidia-v229`.

# Changelog

## v228 · 2026-09-07
- CEO critique fixes: conflict banner-first (lang-locked, dock-safe); chrome hit targets ≥44; hide empty Home pulse; horizontal rail fade peeks; gate changelog 2-line clamp; kids Zo tips disabled; Kids entfernen demoted; Easy tip height capped.
- Cache `paidia-v228`.

## v227 · 2026-09-07
- Critique ship: presence is banner-first (no auto sheet); late CTA copy cleaned; desk Home hero late-aware primary + max 2 pulse tiles; kids Zo closes on nav / no tip session; bell badge contrast; dock secondary hide aligned; reduced-motion for gallery; dead-host gate warn; QA click re-query.
- Cache `paidia-v227`.

## v226 · 2026-09-07
- Full Playwright sweep notes: `docs/agents/APPLE_UI_CRITIQUE_FULL_V226.md` (65 pages, 778 taps, live gate + iOS Simulator).
- UI rescan + critique fixes: Talk 44×44, stock search wrap, desk stock ≤48, week AI/empty compact, gate landmark/lang/changelog, Home Anwesenheit, chrome gap 12px, Easy/Pro compact slabs locked to 36×36, Liste Foto + Momente Neu ≤52px, dock secondary (Kids/Pocket/Gallery) under Mehr on phone.
- Money entries, presets, allowances and reversals await durable command confirmation; repeated taps cannot create duplicate in-flight payments.
- Stock draft adjustments commit atomically; unrecorded stock requires an explicit initial count. Shopping confirmation validates entries and commits stock, trip, requests and audit together.
- Account changes clear the previous operational cache; embedded-game messages must originate from the active iframe.
- Five primary mobile destinations, larger touch controls, and responsive admin sections.
- Shell app URLs now derive their build from the shared-core script version; removes the hardcoded v219 bundle request.
- Database configuration loads before adapters. Dedicated local QA launcher isolates SQLite and avoids the project environment.
- Full redesign release gates remain open; see docs/agents/redesign/IMPLEMENTATION.md. Cache: `paidia-v226`.

## v225 · 2026-09-07
- UI audit fixes: horizontal rail peek padding, Talk compose no longer covers tabs, CTA max-height, Kids double-count copy, Pocket stats alignment, stock 3-col grid, Plan day chips, PWA install duplicate text, desk Home CTAs, gate redundancy.
- Cache `paidia-v225`.

## v224 · 2026-09-07
- Durable ops workspace: `POST /api/operations` with atomic `state.commit` / stock / pocket commands, idempotency, revision conflicts.
- Client `PaidiaWorkspace` status bar + reconcile; Admin section hub (supplies, school, review, finance, audit, communications, automations, system).
- `db.update_json_atomic` for cross-process safe ops writes; `durable: true` on successful commits.
- Cache `paidia-v224`.

## v223 · 2026-09-06
- Desktop `/desk/`: compact single-band chrome, denser rail + stage, Admin hero contrast, Kids rows with inline actions, Plan week matrix, stock/shop house chips, Pocket 3-col rhythm.
- Cache `paidia-v223`.

## v222 · 2026-09-06
- iPhone: Plan focus tabs (Tag/Woche/Kal) single-line; house chips height fixed; schedule bottom padding restored.
- Cache `paidia-v222`.

## v221 · 2026-09-06
- iPhone sitewide layout: tighter stage padding, readable dock labels, contained horizontal strips (Kids/Pocket/Plan), stock legend row, Admin teal hero contrast + full Ops/Team tabs, compact PWA install bar above dock.
- Cache `paidia-v221`.

## v220 · 2026-09-06
- iPhone topbar: single row (title | bell · lang · avatar); stop wrap that put the profile icon on a second line.
- Mobile shell assets use absolute `/mobile/*` paths so `/m/` no longer 404s CSS/JS.
- Cache `paidia-v220`.

## v219 · 2026-09-06
- Auto-route by device type: phones/tablets → `/m/`, desktop/laptop → `/desk/` (UA + pointer); wrong shell auto-corrects. Manual PC/Phone override still sticky.
- Cache `paidia-v219`.

## v218 · 2026-09-06
- Dual websites: `/m/` mobile-only shell + `/desk/` desktop/PC shell; shared core under `shared/`.
- Root `/` is login + router (after auth → correct shell). Override via localStorage `paidia.shell` or PC/Phone button.
- Cache `paidia-v218`.

## v217 · 2026-09-06
- Kid PIN: do not auto-submit after the 4th digit (kids use 6-digit codes; early submit cleared the pad).
- Cache `paidia-v217`.

## v216 · 2026-09-06
- Unsaved leave guard: warn + block tab/hash/house/logout/browser close for Lager draft, Liste pending remove, Pocket compose.
- Cache `paidia-v216`.

## v215 · 2026-09-06

- **Desktop UI polish (Playwright audit):** week matrix contained (no page-level X overflow); denser Home pulse; Admin/Pocket button spacing; detail stats labels wrapped.
- Cache `paidia-v215`.

## v214 · 2026-09-06

- **Overflow fix:** paidia calendar day cells clip euro labels (`minmax(0,1fr)`, compact `+50€`); pocket/staff/admin text containment.
- Cache `paidia-v214`.

## v213 · 2026-09-06

- **Lager − batch:** minus only stages into draft; reason modal opens once on Save (never per tap).
- **Visual overhaul:** multipage spacing/color layer (`ui-v213.css`), richer Home/Lager/Liste/Plan surfaces, safe touch targets, overflow guards.
- **PWA native feel:** manifest shortcuts + display_override, Apple/Android meta, install bar (A2HS / iOS tip), standalone safe-areas.
- **Admin Ops:** denser Tageslage tiles, live Bewegungen feed, Team shortcuts; clearer DE/EL copy.
- **Kids:** narrow-phone grids (Stundenplan, badges, CTAs) without overflow.
- Cache `paidia-v213`.

## v212 · 2026-09-06

- **Admin sidebar:** Admin dock button for admins (`data-admin-only`); still in Mehr as backup.
- **Admin Ops | Team:** Ops cockpit (KPIs, filter feed, week rail) + Team roster with per-worker moves (log, trips, stock checks, shift notes) and range chips.
- **One page scroll:** removed nested `.stock-board-pane` / Ops feed scrollers.
- **Lager:** ± stages into draft; one OUT reason on Save (cancel keeps draft).
- **Liste:** X marks for remove; Remove all; one reason on Confirm.
- Cache `paidia-v212`.

## v211 — 2026-09-06

- **Face ID / Touch ID:** Apple WebKit-correct WebAuthn — `transports: ["internal"]`, platform-only register, proper iPhone / iPad / Mac / Android labels, show biometrics only when the platform authenticator is available.
- Cache `paidia-v211`.

## v210 — 2026-09-06

- **Lager desktop:** product list fills the stage (no empty side column); 2–3 column dense board; product names stay visible.
- Cache `paidia-v210`.

## v209 — 2026-09-06

- **Taschengeld:** multiple income sources per kid (Eltern, Programm, Geschenk, Extra…); pick source then tap ± amount; month breakdown by source; settings split income/expense categories.
- Cache `paidia-v209`.

## v208 — 2026-09-06

- **Taschengeld:** one-tap presets **＋1/2/5/10/20/50** and **−1/2/5/10/20/50** (instant book); same chips fill the amount in the compose form.
- Cache `paidia-v208`.


## v207 — 2026-09-06

- **Liste / Supermarkt:** each bought/missing tap saves immediately; **←** pauses the trip (keeps decisions) instead of wiping; resume card + explicit abort.
- Cache `paidia-v207`.


## v206 — 2026-09-06

- **Liste:** bulk **Entfernen** opens the shared reason sheet (one reason for all selected); cancel leaves items on the list.
- Cache `paidia-v206`.


## v205 — 2026-09-06

- **Deploy:** remove Vercel `crons` from `vercel.json` (Hobby blocks deploys; `/api/notify/tick` remains for `PAIDIA_CRON_SECRET` / admin / external cron).
- Cache `paidia-v205` (ship label only; unblocks production after v199–v204 cron failures).


## v204 — 2026-09-06

- **Admin/Ops:** sticky session admin (PIN flows no longer drop Ops); Ops in Mehr + profile sheet.
- **Shift notifications:** real iOS still needs Home Screen PWA; Chromium/iOS-sim no longer false-blocked; sweep on focus/visibility.
- **Profile (iOS):** avatar button CSS fix; photo picker without `hidden`/`capture` traps; directory names filled when auth JSON omits them.
- Cache `paidia-v204`.


## v203 — 2026-09-06

- **Lager:** pencil **Bearbeiten / Επεξεργασία** on each product row (opens product edit).
- Cache `paidia-v203`.


## v202 — 2026-09-06

- **Lager:** − / bulk exit always asks for one shared reason; cancel resets (no qty change) and reminds to pick a reason; pending rows highlighted.
- Cache `paidia-v202`.


## v201 — 2026-09-06

- **iPhone / landscape PIN:** stop pinpad collapsing to hairlines; keep ≥44px keys; on very short height hide pad and use field + sticky Anmelden; pin links stay in viewport.
- Cache `paidia-v201`.


## v200 — 2026-09-06

- **PIN login:** auto-submit after 4–6 digits (debounce); short entry no longer shows “Falsche PIN”.
- **Hydrate:** login/session return name/color; client creates missing staff/kid directory rows so first login doesn’t bounce.
- **Mobile:** sticky Anmelden on short screens; longer app-load watchdog + soft reload instead of wiping a good session.
- Cache `paidia-v200`.

## v199 — 2026-09-06

- **Overflow:** clip `100vw` bleed; `min-width:0` on shell/#view; mobile dock/FAB clearance; stock/shop/schedule/kids/admin grids stack or inner-scroll.
- **Buch:** calm shift diary — one primary job; calendar/archive/howto behind secondary toggle.
- **Regeln / Κανόνες:** shared `houseRules` tab — staff/admin edit, kids read-only; categorized DE/EL.
- **Profile:** birth date → age, bio, nickname/color/emoji/photo on staff + kids.
- **Haus:** Valeria + Lea merged to shopping house `h4` (migrate legacy `h5`).
- **Kids ratings:** Mon–Sun week chrome; editable 1–6 + μέσος όρος; optional daily strip; admin badge prefs; chore proof + Zo-Ai transcript review.
- **PWA / Push:** install sheet (iOS A2HS + Android); `POST /api/notify/push` + hourly `/api/notify/tick` (pywebpush).
- Cache `paidia-v199`.

## v198 — 2026-09-06

- **Admin kids:** add / edit / remove children (synced ops + login PIN via `/api/auth/admin/child`); gate directory picks up new kids.
- **Profile photo** in header avatar (Profil → Aussehen); opens security sheet.
- **UI calm:** ops poll no longer re-triggers list/hero animations; skip identical shared payloads; poll every 8s.
- **Buttons:** text wraps / shrinks so DE+EL labels fit.
- Cache `paidia-v198`.

## v197 — 2026-09-06

- **Lager desktop:** attention/empty views no longer collapse into a 200px column (rail grid track only when the shelf nav is present). Priority items use a responsive multi-column grid; shell width up to 1280px.
- Cache `paidia-v197`.

## v196 — 2026-09-06

- **Liste:** responsibility ack removed; store mode uses checkboxes — done items sink to bottom, stay visible with strikethrough.
- **Lagercheck:** Verantwortung / ευθύνη required before Speichern (persisted on stock-check).
- **DE→EL:** `/api/translate` auto-fills Greek labels for free-text list adds.
- **Ops emails:** meaningful list/stock/shop/Lagercheck saves notify `zoimert@gmail.com` (`PAIDIA_OPS_ALERT_EMAIL` override).
- **Admin Ops cockpit** (`#admin`): timeline, pocket, storages, schedule, charts + Lego filters; Zo-Ai gets ops snapshot for day/kid questions.
- Cache `paidia-v196`.

## v195 — 2026-09-06

- **Kids ratings:** children only *see* staff team averages — no self-grade UI, client write blocked, `kidRatings` removed from kid-ops sync.
- **Kids mobile sim layout:** restore dock bottom clearance (was zeroed), clip horizontal bleed, align hero to stage pad, keep Zo-Ai FAB above dock.
- Cache `paidia-v195`.

## v194 — 2026-09-06

- **Kids tissue:** one Armonia sea/pine system across Start / Rate / Bonus / Notes / Games / Pocket — shared hero, surfaces, CTAs; coral/candy + neon arcade eras retired.
- Mobile dock: frosted light pill + sea active; desktop rail stays dark pine.
- Cache `paidia-v194`.

## v193 — 2026-09-06

- **Page tips + Zo-Ai tips:** spotlight hole + arrow on `data-tour` targets; tip card placed near the control (fallback bottom card if missing).
- **Bilingual copy:** every tip/tour string rewritten in plain spoken DE and EL; language follows app switch with `refreshLang` + `localStorage`/`html.lang` fallback. AI humanization QA gate passed (no jargon leftovers).
- Cache `paidia-v193`.

## v192 — 2026-09-06

- **Mobile login keyboard:** when typing, fit `#gate` to `visualViewport`; hide landmark / pinpad / passkey / links / build; keep identity + dots + field + login. On-screen pad stays default (no auto-focus); pad tap closes OS keyboard.
- Cache `paidia-v192`.

## v191 — 2026-09-06

- **Mobile login:** lock to full viewport — no page scroll; PIN pad fills leftover height; profile grid scrolls only if needed.
- Cache `paidia-v191`.

## v190 — 2026-09-06

- **Taschengeld:** centered in-page booking (no sheet popup); month calendar filter; weekly + **monthly** allowance; desktop split layout.
- **Shared calendar CSS** (`.paidia-cal`) on kids Start / Rate / Notes / Games / Pocket (+ staff pocket).
- **Lager:** rearranged workspace — top hero/command/zones, shelf rail + board column on desktop.
- Cache `paidia-v190`.

## v189 — 2026-09-06

- **Taschengeld tab (staff):** dedicated `#pocket` page — kid picker, ± / Korrektur, full searchable history, delete, weekly allowance, categories + rules (DE/EL).
- **Kids:** primary **Χαρτζιλίκι / Taschengeld** page (view-only full ledger + rules); Bonus stays XP-only; Bonus moved under Mehr.
- Ops: `pocketMoneySettings` dict; cache `paidia-v189`.

## v188 — 2026-09-06

- **Layout:** one `--chrome-bottom` on `#app` (no fighting `#view` paddings); `measureChrome` owns clearance; sheets lock body scroll.
- **Taschengeld / Χαρτζιλίκι:** clear shared panel (large balance + history) on child Bonus and staff kid profile.
- **Talk:** flex chat log (`min-height:0`) instead of fixed 570px trap.
- Scroll contract documented in `docs/agents/overhaul/CSS.md`.
- Cache `paidia-v188`.

## v187 — 2026-09-06

- **Plan Woche:** **Foto → Woche** — upload / paste / drop a week-plan screenshot; Zo-Ai (Grok OCR) proposes entries.
- Default **Nur Lücken füllen** (occupied slots stay); PIN confirm before save; text fill still available.
- `/api/ai-schedule` accepts `sourceType: "image"` (staff); same OCR stack as Liste.
- Cache `paidia-v187`.

## v186 — 2026-09-06

- **Tagesprogramm:** Vormittag / Nachmittag / Abend blocks with timed entries (not a flat list).
- **Wochenprogramm:** each day shows the three blocks; desktop 7-column board.
- **Mobile:** full Mo–So week stacked (no single-day collapse); matrix stays landscape/desktop.
- Cache `paidia-v186`.

## v185 — 2026-09-05

- **Plan calendar:** Easy + Pro; day titles on cells; house filter; Heute; mobile Kalender seg.
- **Kid rating calendar:** per-kid month grid (staff + child); tap week to focus grades.
- **Taschengeld / Χαρτζιλίκι:** `pocketMoneyTxns` ops; staff ± on kid profile; child view on Bonus.
- **Momente:** group/filter by feed/day/week/month/category/Betreuer; category on compose.
- **Liste responsibility:** mandatory ack before start, confirm batch, and receipt book (DE/EL).
- **Lager board:** richer rows (min, last move, on-list, → Liste); shelf rail + focused board pane.
- **Kids:** Meine Anfragen status sheet + open-count badge.
- Cache `paidia-v185`.

## v184 — 2026-09-05

- **Liste undo:** After fill / Foto-import / quick-add / request accept / Zo-Ai shop_add, toast shows **Rückgängig** to remove the inserted rows.
- **Foto→Liste:** Plan strip banner explains sending a photo/screenshot; CTA opens scan.
- **Hilfe!! popups:** First visit to a page each day shows a help tip with a real app screenshot (`help/*.png`); later random nudges (up to 2/session/page).
- Cache `paidia-v184`.

## v183 — 2026-09-05

- **Apple HIG skill** installed (`.cursor/skills/apple-design/` + user `~/.agents/skills/apple-design/`); map `docs/agents/APPLE_HIG_PAIDIA.md`; rule `.cursor/rules/apple-design.mdc`.
- **A11y:** global `:focus-visible` rings; stronger `prefers-reduced-motion` (HIG motion/accessibility).
- Brand stays Armonia — HIG is the interaction bar, not an iOS skin.
- Cache `paidia-v183`.

## v182 — 2026-09-05

- **Overhaul QA:** Multi-OS suite covers Kids panes + Liste store; tour/contact preflight; page catalog JSON.
- **Fix:** Attendance grid kid names + Da/Fehlt/Entschuldigt chips ≥44px; kids pane tabs ≥44 mobile.
- **Assert:** Easy `#shopAutoFill` only when `.shop-easy-strip` is visible (store/requests skipped).
- Cache `paidia-v182`.

## v181 — 2026-09-05

- **Fix Easy Schule:** `normalizeUiModeSurfaces` no longer resets attendance / homework / materials / activity back to directory (only Pro panes timetable/subjects).
- **Kids routes:** hash `#kids` / `#kids/materials` (etc.) so deep links and syncLocationHash work.
- Cache `paidia-v181`.

## v180 — 2026-09-05

- **Liste Easy ↔ Lager:** Easy strip (fill from stock / start Friday / photo); live stock chips on list + store rows; requests join Friday path; post-confirm Eingebucht sheet → Lager.
- **School:** Materials checklist + compressed photo attachments; activity log (“what they did”); Easy panes for attendance/HW/materials/activity; HW/timetable delete; child school snapshot with HW/materials/timetable/activity; Zo-Ai `material_*` / `homework_done` / `school_note`; grades docs 1–6.
- Ops keys: `schoolMaterials`, `schoolMaterialMedia`, `schoolActivity`.
- Cache `paidia-v180`.

## v179 — 2026-09-05

- **A11y:** Viewport allows pinch-zoom again (removed `user-scalable=no` / `maximum-scale=1`).
- **Tap targets ≥44:** Easy/Pro header toggle, week Agenda|Tabelle + Tag öffnen, task-check, Liste ticks, Buch chips, shop steppers.
- **QA:** Multi-OS stress suite (`qa_multi_os_stress.mjs`) — iPhone / Pixel / iPad / Desktop / Galaxy landscape; UI/CSS/button-fail/edge; report in `docs/agents/QA_MULTI_OS_STRESS_REPORT.md`.
- Cache `paidia-v179`.

## v178 — 2026-09-03

- **Plan Week:** Agenda | Tabelle switch in Easy and Pro (Easy defaults Agenda, Pro defaults Matrix); preference in `paidia.weekLayout`.
- **Plan Week:** Wired 7-day agenda board (was CSS-only); Matrix keeps portrait day-focus fallback.
- **Lager Easy:** Single action strip (Add / Foto / Lagercheck / Speichern); no duplicate Add or Regale.
- **Lager Pro:** Regale open attention shelves first; stronger shelf rail + sticky headers + recent ribbon.
- Removed duplicate Easy/Pro toggles from Plan + Lager heroes (header toggle only).
- Cache `paidia-v178`.

## v177 — 2026-09-01

- **iOS P0:** Stock toast clears on tab/route change; toast z-index below compose bars (Talk send reachable).
- **iOS P0:** Staff mobile — hide floating Zo FAB (open via Mehr → Zo-Ai); no overlap on Send/calendar/arrows.
- **iOS P1:** Single Easy/Pro toggle (header only); mobile header short tab titles + context in subtitle line.
- **iOS P1:** Kids dock/FAB bottom padding; hide redundant guide banner on mobile; Easy/Pro hidden in child chrome.
- **iOS P1:** Liste hero stacks on narrow screens; Lager Regale catalogue gated to Pro (JS + CSS specificity fix).
- **iOS P1:** Mobile tap targets — plan week remove (44px), Lager product row, Buch house chips.
- Cache `paidia-v177`.

## v176 — 2026-09-01

- **Kids broken on phone:** mobile dock was never mounted (hamburger-only) — kids got lost. Dock restored as playful floating pill.
- **Kids playful 2026:** cream canvas, coral/sky/mint destination tiles, sunny hero, coral Zo FAB; Start drops duplicate Easy toggle + noisy “you are here” banner.
- Cache `paidia-v176`.


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
