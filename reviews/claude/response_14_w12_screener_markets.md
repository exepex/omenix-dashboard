# W12: the signed-off Screener (33) and Markets (34) in the real app (builder claims)

Story: `exepex/trading` `docs/stories/X-cross-repository.md`, section W12 (6 criteria, 5c5c0b4). Mockups:
`design/mockups/33-screener` (signed off as of e28b43d) and `34-markets` (as of 59b606d). Their `notes.md` files
are the frozen contracts; I did not change them. Contract: W11's blocks (`api/schemas/blocks-screener.yaml`,
`blocks-overview.yaml`; examples `api/examples/blocks-33-34.json`). I did not edit `api/` or `design/`. Paths are
under `web/` unless they say otherwise. Confidence labels: **strong evidence**, **some evidence**, **reasoning only**.

## What was built

- **Contracts.** `lib/screener/contract.ts` and `lib/overview/contract.ts` are W11's schemas as types: field names,
  units, and which fields are India only (optional).
- **Interfaces, one method per block.**
  - `lib/screener/source.ts` (`ScreenerData`): summary, stocks(query), tools, fnoSummary, fnoRows(query).
  - `lib/overview/source.ts` (`OverviewData`): session, indices, indiaSectors, usSectors, flows, rates, world, events.
  - India-only and US-only blocks take no market, so a market without them never asks.
- **Adapters and wiring.**
  - `fixture-source.ts` in each folder reads W11's examples, copied unchanged by `tools/sync-design.mjs` into
    `lib/fixtures/` and kept equal by the design-sync test.
  - A paged block answers only the query its example was taken with. Any other view rejects with `NoExample`
    (`lib/ui/no-example.ts`), and the page says "no example data for this view yet". It never shows another
    query's rows as if they matched.
  - `wiring.ts` in each folder is one line.
- **URL state.** `lib/screener/state.ts` and `lib/overview/state.ts` use the signed-off hash keys as search parameters
  (`tab`, `uni`, `pre`, `per`, `sort`, `pg`, `f`; `per`, `idx`, `br`, `sec`, `mov`, `mu`). A view is a link, and the
  server reads exactly the blocks it shows. W11's route queries (stocks, F&O rows, movers) are built from that state.
- **Pages.**
  - `app/(cockpit)/[market]/screener/` and `markets/`: server loaders, one per part, each in its own Suspense boundary.
    A failed part shows its error state; `components/blocks/block-section.tsx` is shared.
  - Client parts in `components/screener/` (7 files) and `components/markets/` (9 files). All files are under 350
    lines.
  - Both pages are registered in `lib/ui/routes.ts` and the rail (`lib/shell/nav.ts`; they were "soon").
- **Frame additions (W8 code, small).**
  - `addItems`: a page can lend the frame instruments from its own blocks. The Screener lends the followed companies
    at their close, so their B / S open the order window, as the signed-off page does.
  - `TradeUnavailable` in `components/frame/trade.tsx`: grey B / S with the reason. It sits in the one trade module,
    so the lock rule and the structure test still hold.
  - `PicksHiddenHere`: these pages start with the picks panel hidden (signed off: `PF.st.wlOff`); `#wloff=0` shows it.
- **Shared, refactored (DRY).**
  - `lib/fixtures/examples.ts`: one reader of contract examples. Home's adapter uses it too.
  - `lib/ui/sources.ts`: the source-name rule. Home's `lib/home/sources.ts` now delegates to it.
  - W10's example copy moved from `lib/home/fixture/` to `lib/fixtures/`, because the frame's session block is read by
    two features.

## Acceptance criteria

| # | Criterion | Code | Test | Evidence |
|---|---|---|---|---|
| 1 | Every gallery state W11's examples cover renders at 390-1680 px, side by side, differences listed | pages above | `tests/ui/cases/screener.mjs` (8 cases) and `markets.mjs` (10 cases), each beside `gallery/<state>-<width>.png` | Screener: stocks at 1280/1024/768/390, high, tablet, F&O at 1280/1024/390, dark, panel on, not followed (clock open), US. Markets: India at 1280/1024/768/390, year, today, 1W flows, Midcap charted, industries, panel on, dark, tablet, US. All pass; the harness performs check_page's checks (no console errors, no external requests, no overflow, contrast in dark). Uncovered states and differences below. **Strong evidence** |
| 2 | Components depend only on the W11 typed contracts; import-graph test (W8 resolver, transitive) | `lib/screener/*`, `lib/overview/*` | `lib/screener/tests/import-graph.test.ts` | Rules: components reach no adapter, wiring or data client; nothing but a wiring imports an adapter; only each page's loaders read its wiring; one line picks each. Planted breaches (alias, extensionless, dynamic, a re-export helper, a data client, a component reading the wiring) are caught. Home's own test was widened only to know the new shared folder. **Strong evidence** |
| 3 | DOM assertions compare rows and figures with their own source fields (`data-src`), incl. breadth, movers and flows; an incomplete flows period shows "—" with the coverage | `components/ui/figures.tsx` (`Num`, `Chg` require `src`), every part | `tests/ui/cases/sourced.mjs`, `screener-checks.mjs`, `markets-checks.mjs` | See "The figure check" below. **Strong evidence** |
| 4 | F&O and India-only elements absent (not empty) in the US; a harness case proves it | loaders never read F&O, flows, VIX or index options in the US; `readState` drops the F&O tab, delivery and the universes | `usScreenerChecks`, `usMarketsChecks`; unit test "the US has one universe, no F&O tab and no delivery" | US cases fail on any F&O/delivery text, the tab group, any `fnoSummary`/`fnoRows`/`flows` figure, the flows/VIX/index-options sections, or "NSE", "Nifty", "₹" on Markets. Both pass. **Strong evidence** |
| 5 | No model or vendor name on any screen; Buy/Sell only for followed companies, grey otherwise with the reason | W9 detector at every adapter (`exampleReader`); `BuySell` in `stocks-cells.tsx` | The harness gate on every case; `tradeProblems` in `screener-checks.mjs`; the W12 import test (no B / S drawn outside `trade.tsx`) | Every row checked: followed → the frame's B / S (lock reason while closed); others → grey with "Our tools do not follow …" (the lock first when closed). The display-name test now covers W11's examples too. **Strong evidence** |
| 6 | Code size, typecheck, tests, build, UI harness in CI | | | Code size ok; tsc clean; **387 tests, 387 pass**; build ok; full harness in the orchestrator report. **Strong evidence** once CI is green |

## The figure check (criterion 3)

- **The rule.** Every figure from a block carries `data-src="<block>:<path>"`. The check reads the blocks from the
  app's own adapters for the page's own URL state, then, for every `[data-src]` on the page:
  - the field must exist;
  - a null field must show "—";
  - a number must equal the field at the shown decimals, with its sign (`data-abs` where the words carry the sign:
    "sold ₹30,294 crore"), scaled by `data-scale` (the model's chance, 0-1, shown as a percent).
- **Coverage asserted.** Every table row's price and change, every tile and chip count, every mover, sector tile,
  world quote and flow bar must carry a source.
- **Plants, injected into the real page on every run.** Each must be caught:
  - Screener: another universe's breadth count under this universe's field; a row price off by one cent; a field that
    does not exist.
  - Markets India: a day's FII + DII under the FII field; the five days added up under the 1M total the publisher
    leaves empty; the Nifty 500's count under all NSE.
  - Markets US: two movers' closes added under one; a breadth count off by one.
- **Flows.** The total shown is the block's published `totals.<period>`, never a sum on screen.
  - 1D and 1W are complete; the `markets-week-flows` case shows "Over these 5 sessions foreign investors sold ₹30,294
    crore net …".
  - 1M, 3M and 1Y are incomplete; the page shows "Over 1M: — (only 5 days of data for 21 sessions)", and the check
    asserts exactly that text.
- **Computed on screen, by the contract's own formulas over one row's fields.** These carry `data-derived` naming
  their inputs:
  - the 52-week position and volume × usual (33 notes row 7);
  - value traded and × usual on the movers (34 row 7);
  - "up over a month" as a share (34 row 5);
  - the VIX's 3-month middle (the median of its last 63 closes, as W11's schema defines). A unit test proves the
    example's 12.16.
- **Counted on screen.** The two tools-based chips (3+ buy, results within 7 days) count the followed companies, as
  the contract says (33 row 4). A unit test checks the definition; every other count is a summary field, proved by
  resolving each path.

## Visible differences from the mockups (and why)

- **The frame's clock and picks.** The mockups move the shell's clock to 12 Oct 22:30 UTC. The app has one frame,
  whose example clock and picks come from 30-shell (W8), so the market chip says "opens Thu 8 Oct".
  - On the Markets header, the session reading is the frame's session block (W10's example: "Event-heavy session" in
    India, "Trending market" in the US), not 12 Oct's "Calm market".
  - The session block has no `major_event_names`, so the tooltip does not list them.
  - Reasoning only: fixing this belongs to a real session block, not to these pages.
- **The theme button, the Ask icon and the footer** are the app frame's, as on every app page (W8, accepted).
- **The main index chart's left label** reads "21 sessions ago", not a date: the indices block carries closes without
  dates (W11). The US mockup already reads this way.
- **Flows sentence.** The mockup summed the five days for every period. The contract now publishes totals and forbids
  summing (judge 27), hence "—" with the coverage for 1M, 3M and 1Y.
- **The option chain.** The F&O rows' "Chain" and the Markets "NIFTY chain" say the chain is not built yet. The
  mockup linked to the 32 mockup; the app has no chain page.
- **Sorting.**
  - "Our tools" is not a sortable column: W11's stocks route has no tools sort.
  - The two tools-based screens send the companies as `symbols`, in the route's default order (value traded), not by
    strategies buying or soonest results.
  - Both would need a route change (W11), which I did not make.

## Gallery states not covered by W11's examples (not compared)

No example answers these queries, so the page shows "no example data for this view yet" for its results part:
- **Screener:** `ours`, `buy` (both `uni=ours`), `year`, `volume`, `oversold`, `picks`, `results`, `filters`,
  `fno-short`, `fno-ivhigh`, `fno-index` (the index example is the four Markets underlyings, not the screen).
- **Markets:** `losers` and `active`. The movers card keeps its switches and says so.

`stocks-top`, `breadth`, `flows`, `options`, `world`, `top` and `us-yields` are crops or scrolls of the full pages,
which are compared. The `not-followed` state's hover is not driven; its reason text is asserted per row instead.

Proposal for W11's owner (reasoning only): add those examples (`u=ours`, `screen=volume`, …, `sort=-d1`), and each
becomes a harness case with no app change.

## Doubts and limits

- **A harness hang I hit while building.** The rail linked to `/markets` before that page existed. Next's prefetch
  of the missing page never finished on the harness server, so every case timed out waiting for the network to go
  idle. It went away once the page existed. It was not a harness fault (strong evidence: `/india/markets?_rsc` was
  the only pending request). Worth knowing for any future rail entry: add the page and its nav entry together.
- **Paged views beyond the examples** (page 2, other screens and filters) prove nothing about a real backend's
  answers. The real adapter must honour W11's query semantics; the queries the app sends are unit-tested.
