# 30-shell: rationale

Mockup order item 1 of `design/PLATFORM_DESIGN.md` section 9 ("00-shell"; numbered **30** because 00-12 collide with
the existing mockups, which the web tests read, and 13-22 were proposed by `UNIFIED_DASHBOARD.md`). The platform
mockups are 30 shell, 31 dashboard, 32 option chain, 33 strategy builder, 34 stock page, 35 portfolio, 36 orders,
37 order window, 38 screener, 39 markets, 40 reports. Status: **for the owner's review** (12 Oct 2026).

Files: `data.json` (Mock), `template.html`, `build.py` (deterministic; uses `design/mockups/_platform/`),
`page.html`, `notes.md`, screenshots from `node design/system/check_page.js` (no console errors, no external
requests, no horizontal overflow at 1280 and 390 px): `shot-1280-full`, `shot-390-full`, `shot-390-viewport`
(default: India, light), `shot-dark-*` (dark), `shot-us-*` (US: every F&O element absent), and state views
`shot-<state>-1280-viewport` / `-390-viewport` for order (F&O passing), stock-order, blocked (short call over the
loss limit), refused (no executable quote), palette, hovercard, menu, flyout, notifications, more (phone: all screens).
Each state is a link: `page.html#drawer=order:NIFTY-24800CE-OCT:buy`, `#pal=nifty%2024500`, `#theme=dark`, `#m=us`...

## What it is
The frame every screen sits in, drawn as a real, working page: the content area shows each shell part with a button
that opens it. Desktop: app bar (brand, global search with `/`, India · US, index strip with as-of on hover, bell,
watchlist toggle, theme, profile), dark navy navigation rail (Material rail: icon over label; hover or focus opens
the group's screens; pinned screens; compact icons-only option), Kite-style watchlist panel (5 lists mixing stocks,
F&O underlyings and contracts; price, change, as-of; hover for B, S, Chart, Chain, More; drag to reorder), the page
(breadcrumb, title, as-of, actions), and a right drawer for the Paper order window and quick views. Phone: search on
top, index row under it, bottom tabs Home · Watchlist · Orders · Portfolio · More, the drawer as a bottom sheet.

## Owner feedback, 13 Oct 2026 (applied)
> "I do not understand what is the purpose of giving informational blocks on top ... user should be able to navigate
> to a company stock FNO by a quick search ... place a buy and sell order even from the quick search ... elegant,
> sharp corners and more materialized."

- The informational band at the top of this page is gone; Paper and Mock stay as small tags, explanations sit in
  help tooltips.
- Global search results now carry **B** and **S** on every tradable stock or contract: one click opens the Paper
  order window (`shot-palette-*`). Home gets its own quick-search block (31-dashboard).
- Sharp corners across the design system: cards, panels, buttons, chips, tabs and search fields 4 px (were 8-12 px
  and pills); icon buttons, badges and avatars stay round.

## Decisions (and why)
- **Rail with labels under icons (84 px), not a 256 px sidebar.** At 1280 px the watchlist (300 px) and a labelled
  sidebar would leave the page 700 px; the Material rail keeps labels (the design asks "icons with labels") and
  leaves about 900 px. Groups open flyouts, so seven groups reach 25 screens in one hover. Reasoning only.
- **Buy green, Sell red, always with the word or the letter.** Matches Groww and Dhan; the letter B/S and the word
  "Paper buy" carry the meaning, so colour is never alone.
- **The order window is honest before it is convenient.** It shows the price basis (last price as-of, or the 3 pm
  snapshot's ask/bid), quantity, value, charge estimate with its breakdown, F&O maximum loss and margin estimate,
  cash after, every limit check with pass/fail glyph and word, and "Paper order: no real order is placed". A failed
  check or a missing quote disables the button and says why; nothing is recorded until every check passes.
- **Strategy books appear in the account list but are disabled** ("not traded by hand"), so the owner sees the rule
  rather than wondering where they are.
- **State in the URL hash** (market, theme, list, density, rail, drawer, palette, hover card, menu): Back and
  bookmarks work, and every screenshot state is reproducible.
- **Light by default; dark from `tokens-dark.css`** (inlined via the new `inline_system(..., dark=True)`); the profile
  menu also offers "follow the system".
- **Alerts say they follow data updates, not ticks** (bell footer, notification text).

## Design-system additions (components.css "Platform shell", style guide section "Platform shell")
`.mb-pf`, `.mb-appbar` (+ brand, name, `.mb-gsearch`, `.mb-kbd`, `.mb-idx-strip`/`.mb-idx`, `.mb-me`, `.mb-badged`),
`.mb-navrail` (+ `.mb-rail-grp/-item/-fly/-sep/-pin`), `.mb-wl` (+ head, find, meta, list, row, acts, foot), `.mb-bs`,
`.md-btn.buy/.sell`, `.mb-crumbs`, `.mb-pagehead`, `.mb-asof`, `.mb-drawer` (+ head, body, foot, `.mb-sheet-grip`),
`.mb-veil`, order parts (`.mb-order-side`, `.mb-field`, `.mb-field-row`, `.mb-input`, `.mb-order-sum`, `.mb-checks`,
`.mb-alert.paper`), `.mb-hcard`, `.mb-modal` (+ `.mb-pal-group/-item`, `.mb-keys`), `.mb-menu`, `.mb-snack`, compact
density; 5 layout tokens; 47 Material Symbols (copied unchanged). Phone tabs reuse `.mb-navbar`. `.mb-delta` no longer
breaks between sign and number.

## Deviations and limits
- Screens whose mockups are not drawn yet are listed in the rail and search with "soon" and a tooltip; clicking says so.
- Drag to reorder is pointer-only in the mockup; the app needs a keyboard path (move up / down in the row menu).
- The watchlist "Search and add" field filters the list and hands the query to global search on Enter; adding is not
  simulated.
- Watchlist and rail are viewport-tall sticky panels, so full-page screenshots show them only in the first 900 px.

## Supersedes
Nothing yet: 01-12 stay as they are (the web app and its tests read them). 31-dashboard supersedes 01-home's layout
once approved; 01-home's rationale is marked then.
