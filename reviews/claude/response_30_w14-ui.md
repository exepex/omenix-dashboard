# Response 30 · W14 builder claims: the owner's UI feedback (loading, buttons and links, side menu, chart zoom)

Story W14, the owner's feedback of 13 Oct 2026 on the deployed app. Built design system first (`design/system/`),
then the app (`web/`, copies kept in sync by `web/tools/sync-design.mjs`). Not deployed. Evidence: the audit tables
`w14/audit-before.md` and `w14/audit-after.md`, before/after screenshots in `w14/`, the UI harness (`web/tests/ui`).

## Verdict in one line

All four reported problems are fixed in the app and checked by tests: the measured look findings went from **808
(1,036 elements) to 0** over 17 pages × 2 widths, and the side-menu flyout went from **staying open on 17 of 17 pages
to closing on 17 of 17**. Strong evidence (automated, before and after on the same fixtures). What is not done is
listed at the end; read it.

## How it was measured

- `web/tests/ui/affordance.mjs` runs in the browser and flags (1) a clickable link or button with no border, no
  underline and no fill of its own, (2) a disabled control without a border or with a pointer cursor, (3) a plain label
  that looks clickable (pointer cursor, or a chip with a solid button border). Not audited, each for a stated reason:
  the rail, flyouts, phone tabs and menus (recognised by place, own hover/current states), the logo, the skip link, and
  a chart's SVG hit areas.
- `web/tests/ui/w14-audit.mjs` runs that audit on 17 pages at 1280 and 390 px, clicks a rail group with a flyout and
  checks whether the flyout is still open after the new page shows, and counts charts with zoom. It ran on the build of
  `1e6e576` (before, a side worktree) and on this change (after), same fixtures.
- `web/tests/ui/cases/w14.mjs`: 24 harness cases that **fail** on any of the problems (below).

## Claims per item

### 1. Loading states — done (strong evidence)

- **Page loader:** `app/(cockpit)/[market]/loading.tsx` (Next.js loading UI) shows a thin bar under the app bar and grey
  card shapes inside the frame, on the first load and on every move to another screen. Rail, app bar and picks panel
  stay usable. Screenshot: `w14/after-move-to-markets-slow-answer.png`. Before: `w14/before-move-to-markets-slow-answer.png`
  shows the old page with no sign that anything is happening.
- **Block loader:** the Screener and Markets parts are now `Part` blocks (`components/blocks/part.tsx`), each a
  `PendingBlock` (`components/ui/pending.tsx`). Their controls move through `useBlockTransition()`. During a slow
  answer only the block whose chip or button was clicked fades and shows "Loading today in one look…". Nothing else is
  blocked. Screenshot: `w14/after-screener-chip-click-slow-answer.png` (before: nothing visible for 3 s).
- **Accessible:** `aria-busy="true"` on the busy block or page; a polite `role="status"`; a visually hidden
  "Loading the page…" on the page loader.
- **No flicker:** every loader carries `.mb-delayed` and appears only after `--mb-loader-delay` (250 ms, `tokens.css`).
  This is pure CSS, so it also works on server-rendered loading UI.
- **Tests:** `w14-block-loader` (1280, 390) checks four things:
  - one busy block right after the click, and it is the clicked one;
  - its loader is invisible at 60 ms and visible at 760 ms;
  - no page loader appears;
  - the block clears when the answer lands.

  `w14-page-loader` checks the bar and grey shapes during a slow move, with the frame still present. The existing
  `state-loading` case still passes.
- **Client-fetched blocks were already block-level:** Paper portfolios' "finished on" chips show grey shapes inside
  their card. They now also wait for the delay.

### 2. Buttons and links — done (strong evidence)

- **Design system (`components.css`, "Interaction, loading, chart zoom" section):**
  - Links, `summary` and `.md-btn.text` are underlined.
  - `.md-icon-btn`, `.mb-idx` (app-bar index tiles) and button or link chips have a border.
  - Hover and focus strengthen all of these.
- **Disabled controls** (`.md-btn`, `.md-icon-btn`, `.mb-bs`, `.md-chip`, `.mb-idx` with `:disabled` or
  `aria-disabled`; disabled links):
  - a **dashed** border on a quiet tile, with the `not-allowed` cursor and no hover layer;
  - visibly an action, never a label (see the dashed Buy/Sell in `w14/after-home-buttons-1280.png` and the zoom-out
    button in `w14/after-stock-price-chart.png`);
  - never clickable: native `disabled`. Where the reason is known, it is the tooltip: the market-closed Buy/Sell
    pair carries the lock reason.
- **Rail screens not built yet ("soon"):** these were clickable links that opened a "not built yet" snack. They are now
  disabled: no address, no action, out of the Tab order, with the reason as a tooltip (`nav-rail.tsx`). The mockup
  runtime does the same (`_platform/js/2-frame.js`).
- **Plain labels:** a `span.md-chip` (for example "Closed for today", "Energy · NSE", "₹1,00,000 per paper trade") had
  the same solid border as a filter chip. It is now a borderless tile with no pointer cursor. 90 findings → 0.
- **Root causes of the rest:** page-local rules removed the underline, so links looked like plain text:
  - `text-decoration:none` on `.tk`, `.go`, `.pick`, the crumbs, news titles, `a.t` and `.mb-apcard-go`;
  - `all:unset` on sort headers and `button.sel`;
  - a page-local ⓘ button (`.pp-info`) duplicating `.md-icon-btn`.

  These were fixed at the shared source (`_shared/shell.css`, `components.css`, `app.css`). The duplicate `.pp-info`
  was deleted and the shared `.md-icon-btn` is used instead.
- **Tests:**
  - `w14-look-*`: 18 cases, the 7 signed-off views plus 11 other pages each in its own page case's set-up, at 1280 and
    390 px. They fail on any audit finding.
  - `w14-disabled`: a locked Buy/Sell has a dashed border and the not-allowed cursor, is disabled, carries a reason,
    and a forced click opens nothing.

### 3. Side menu flyout — done (strong evidence)

- **Root cause:** after a client-side move, the clicked rail link kept keyboard focus, so CSS `:focus-within` (and
  `:hover` while the pointer stayed there) held the flyout open until a click elsewhere moved the focus.
- **Fix:** `components/frame/use-flyouts.ts` puts the group in a `.shut` state in three cases:
  - on every route change;
  - on Escape, with focus returning to the group's rail item;
  - on a pointer-down outside the rail.

  The flyout opens again when the pointer comes back, when keyboard focus enters the group from outside, or on
  ArrowDown on the rail item. If focus was inside the closing flyout, it moves to the group's rail item, so it is never
  lost to the page body.
- **Test:** `w14-flyout` checks, in order:
  - hover opens the flyout;
  - a click and the move close it;
  - it does not reopen by itself;
  - keyboard focus opens another group's flyout;
  - Escape closes it and focus is on the rail item;
  - ArrowDown reopens it;
  - an outside click closes it.

  Audit: 17/17 pages before had it stay open, 0/17 after. Screenshots: `w14/before-` and
  `w14/after-flyout-after-rail-click.png`.

### 4. Charts — done for every price chart on the built pages (strong evidence)

- **One shared implementation:** `lib/ui/chart-view.ts` (pure window logic, 7 unit tests) and
  `components/charts/zoom.tsx`:
  - `useChartZoom`: Ctrl or ⌘ + wheel and trackpad pinch, two-finger pinch on touch, drag to pan, keys `+ − 0`;
  - `ZoomBar`: zoom in, zoom out, reset, plus "Showing 27 of 60 sessions · drag to move";
  - `Crosshair`: date and price tags on the axes.
- **Company / stock page, "Price with today's targets and ranges":**
  - Zoom and pan over the sessions; the price scale refits to the window.
  - The phone opens on the last 30 sessions, as before, and can now zoom out to all of them.
  - Today's fan and targets show while the newest day is in view. Otherwise a line says they show when it is.
  - The crosshair follows hover or tap. Month labels no longer collide when zoomed (test added).
  - Screenshot: `w14/after-stock-price-chart.png`.
- **Markets (34):** the index chart and the India VIX chart use the same component (`ZoomLine`). The axis words follow
  the window ("40 sessions ago … today").
- **Tests:** `w14-chart-stock` and `w14-chart-markets` (1280 and 390 px) check:
  - the opening window (30 on a phone);
  - Zoom in;
  - Ctrl + wheel;
  - the crosshair text on hover;
  - drag;
  - Reset;
  - the + and 0 keys.

  The geometry tests also cover a zoomed window without the newest day.

### 5. Audit of the signed-off pages — findings page by page

Columns: before, as "clickable with no border or underline / disabled without a border or with a pointer cursor /
label drawn like a button", each at 1280 and 390 px. After: findings at 1280 / 390 px. Element counts.

| Page | Path | Before 1280 | Before 390 | Flyout before | After | Flyout after | Charts (with zoom) after |
|---|---|---|---|---|---|---|---|
| Home (31-dashboard) | `/india` | 31 / 25 / 0 | 29 / 25 / 0 | stays open | 0 / 0 | closes | 0 (0) |
| Home, US | `/us` | 34 / 25 / 0 | 32 / 25 / 0 | stays open | 0 / 0 | closes | 0 (0) |
| Screener (33) | `/india/screener` | 20 / 52 / 0 | 12 / 14 / 0 | stays open | 0 / 0 | closes | 0 (0) |
| Screener F&O (33) | `/india/screener?tab=fno` | 13 / 2 / 0 | 6 / 2 / 0 | stays open | 0 / 0 | closes | 0 (0) |
| Markets (34) | `/india/markets` | 17 / 0 / 1 | 15 / 0 / 1 | stays open | 0 / 0 | closes | 2 (2) |
| Company / stock page (35) | `/india/stocks/RELIANCE` | 22 / 8 / 5 | 18 / 0 / 5 | stays open | 0 / 0 | closes | 1 (1) |
| Strategy lab (38) | `/india/strategy-lab` | 26 / 8 / 12 | 22 / 0 / 12 | stays open | 0 / 0 | closes | 0 (0) |
| Stock strategies | `/india/stocks/RELIANCE/strategies` | 29 / 8 / 3 | 25 / 0 / 3 | stays open | 0 / 0 | closes | 0 (0) |
| Trade story | `/india/stocks/RELIANCE/lifecycle/…` | 8 / 8 / 0 | 4 / 0 / 0 | stays open | 0 / 0 | closes | 0 (0) |
| Paper portfolios | `/india/paper-portfolios` | 11 / 8 / 3 | 7 / 0 / 3 | stays open | 0 / 0 | closes | 0 (0) |
| Rule vs AI | `/india/rule-vs-ai` | 19 / 8 / 3 | 15 / 0 / 3 | stays open | 0 / 0 | closes | 1 profit chart, not price |
| Track record | `/india/track-record` | 10 / 8 / 3 | 6 / 0 / 3 | stays open | 0 / 0 | closes | 0 (0) |
| Watchlist | `/india/watchlist` | 19 / 8 / 3 | 14 / 0 / 3 | stays open | 0 / 0 | closes | 0 (0) |
| News | `/india/news` | 61 / 9 / 3 | 57 / 1 / 3 | stays open | 0 / 0 | closes | 0 (0) |
| Companies | `/india/companies` | 19 / 8 / 3 | 15 / 0 / 3 | stays open | 0 / 0 | closes | 0 (0) |
| Assistant | `/india/assistant` | 9 / 9 / 3 | 5 / 1 / 3 | stays open | 0 / 0 | closes | 0 (0) |
| Help | `/india/help` | 25 / 8 / 3 | 21 / 0 / 3 | stays open | 0 / 0 | closes | 0 (0) |

Every page also had the loading problem, wherever it reads data:
- **Server-rendered pages** (Home, Screener, Markets) showed nothing at all while the server answered. Now the page
  loader shows, and on Screener and Markets the block loader too.
- **Client pages** showed grey shapes only after their script loaded. Now the page loader covers the gap before that.

32-option-chain is signed off but has no app page yet. Its mockup was rebuilt with the new design system.

Mockups (signed off 30, 31, 32, 33, 34, 35 and 38):
- Rebuilt with the new design system: deterministic, the only diff in each `page.html` is the CSS and JS (97 lines).
- Re-shot by `check_page.js` at the widths they had: no console errors, no external requests, no overflow.
- Their rail "soon" items are disabled the same way. Escape closes an open flyout.
- `check_text.js` (clipped, overflowing or overlapping text at 12 widths): 0 findings on all 7.

### 6. Modular CSS and HTML — partly (some evidence; read the limits)

- **New shared parts, each used by every page that needs it:**
  - `components/ui/loading.tsx`: `LoadingState`, `BlockLoader`, `PageLoading`;
  - `components/ui/pending.tsx`: `PendingBlock`, `useBlockTransition`;
  - `components/blocks/part.tsx`: the page part, replacing two copies of a page-local `Part`;
  - `components/charts/zoom.tsx`, `lib/ui/chart-view.ts`;
  - `lib/ui/use-width.ts`, moved out of the company page, now shared by three charts.

  The skeleton CSS moved from `app.css` into the design system, where it is defined once.
- **Duplication removed:** the page-local `.pp-info` button (now `.md-icon-btn`) and the text-decoration overrides
  that caused the bug.
- **Not done:** I did not move every page-local CSS file into the design system. These still remain, as page CSS:
  - three near-identical `.go` "see all" link rules (shell.css, home.css, markets.css);
  - three table sort-header rules (app.css, watchlist.css, components.css `.mb-scr`);
  - a second `useWidth` hook (`_b16/parts.tsx`, a different signature).

  Merging them touches several signed-off screens' CSS and Home (which W12 is editing in parallel). I left them for a
  separate, judged clean-up rather than mixing them into this change. Reasoning only: the risk is visual regressions on
  signed-off pages, and the harness compares against mockups only for review, not pixel-for-pixel.
- Code size: every new file is under 350 lines; `node tools/check_code_size.mjs` passes.

## What is not done, and doubts

1. **The mockups' own charts (35-stock, 34-markets) do not zoom.** Only the app's charts do. The mockups are static
   design references; the behaviour and its classes are documented in `design/system/README.md`. Say if you want the
   mockups' charts to zoom too.
2. **A plain mouse wheel scrolls the page, not the chart.** Zoom is Ctrl or ⌘ + wheel, a trackpad pinch, a touch pinch
   or the buttons. A chart that grabs the plain wheel traps the reader scrolling a long page. This is my judgement
   (reasoning only); if you prefer the plain wheel, it is one line in `zoom.tsx`.
3. **Not zoomable, because they are not price series:**
   - the Forecast-history chart (10 run dates, every point focusable);
   - the Strategy lab and Rule vs AI profit charts;
   - the Stock strategies agreement chart;
   - the gallery's vendored candlestick sample, which has its own wheel zoom; the gallery is not a signed-off page.
4. **Disabled pager arrows give no reason tooltip.** The reason is obvious: first or last page. A natively disabled
   button takes no hover, so its reason must sit on a wrapper, as the Buy/Sell pair does.
5. **The mockups' state galleries are not re-shot.** The `screens/` and `gallery.html` of 31–35 and 38 are not; the
   `shot-*.png` files are.
6. **Out of scope, but you should know (rule breach, strong evidence):** the app's Strategy lab page
   (`strategy-lab-page.tsx` line 340) shows each strategy's settings as chips: "signal: model", "news weight: 0",
   "regime filter: no", "buys when the chance of a rise is at least 55%". That is how a family decides, which the
   rule of 13 Oct 2026 ("strategy internals stay private") forbids on screens. The signed-off 38 mockup is the newer
   design; the app page predates it. I did not change it here (not W14); it needs its own story.

## Checks run

- `node tools/check_code_size.mjs`: pass.
- `cd web && npm ci --ignore-scripts && npm run typecheck && npm test && npm run build`: pass (425 tests).
- UI harness, all cases: 207 cases. After the build, 3 failed on one selector (`.pp-info`), which this change renamed.
  The test now reads the shared class, and the 4 affected cases pass. All 24 W14 cases pass.
- `check_page.js` on the 7 rebuilt signed-off mockups: no console errors, no external requests, no overflow.
  `check_text.js`: 0 findings on all 7.

## What the owner should check after the next deploy

See the summary in the session.
