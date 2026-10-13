# W9: the signed-off Home screen in the real app (builder claims)

Story: `exepex/trading` `docs/stories/X-cross-repository.md`, section W9 (6 criteria, including criterion 5 added on 13
Oct 2026). Mockup: `design/mockups/31-dashboard`, signed off as of `e8cd360`; its `notes.md` is the frozen contract and
I did not change it. W10 per-block alignment folded in, as the orchestrator asked. Paths are under `web/` unless they
say otherwise. Confidence labels: **strong evidence**, **some evidence**, **reasoning only**.

## What was built

- **Contract, `lib/home/contract.ts`.** One type per Home block of W10's contract (`api/schemas/blocks-home.yaml`,
  `blocks-frame.yaml`): Groups (StockGroup, GroupTotal, StrategyResult), FnoBooks, StrategyTrades, Attention, Events,
  TopNews, TrackedMoves, Accounts, Positions and Session. Field names and units are W10's (percent points, market
  currency, UTC).
- **Interface, `lib/home/source.ts`.** `HomeData` has one method per block, so each section loads on its own.
  `fnoBooks()` takes no market: F&O exists for India only.
- **Fixture adapter, `lib/home/fixture-source.ts`.** It reads W10's own validated examples (`api/examples/blocks.json`,
  taken from the 30 and 31 records), copied unchanged by `tools/sync-design.mjs` into
  `lib/home/fixture/blocks.generated.json` and kept equal by the design-sync test.
- **Wiring, `lib/home/wiring.ts`.** One line picks the adapter.
- **Server loaders, `app/(cockpit)/[market]/_home/blocks.tsx`.** One per section, each in its own Suspense boundary
  (`_home/home-page.tsx`). A failed block shows that section's error state; the rest of Home works. The US never
  reads the F&O books.
- **Client sections, `components/home/`.** Seven files:
  - `glance.tsx`: today at a glance, and the market band;
  - `home-picks.tsx`: the inline picks below 1200 px, the frame's `PicksBody`;
  - `who-trades.tsx`: the group cards;
  - `open-trades.tsx`: tabs, pager, rows;
  - `home-lists.tsx`: needs you, coming up, top news;
  - `section-head.tsx`;
  - `home-footer.tsx`.

  They use the frame's context (prices, lock, formats), and their Buy, Sell, B and S come from the frame's one
  `TradeButton` (W8's lock rule).
- **Pure logic, unit-tested.** `lib/home/groups.ts` builds the group cards by passing block fields through.
  `lib/home/trades.ts` builds the open-trade rows, grouped per stock and family, with each trade's own figure.
- **The display-name rule, `lib/ui/strategy-names.ts`** (criterion 5). It is applied at every adapter boundary: the
  page read client (`lib/ui/api-client.ts`), the frame's adapter and Home's adapter.
- **Removed (dead after the switch).** The old Home (`_home/home-page.tsx` at 586 lines, which leaves the
  code-size allowlist), its logic `lib/market-pages/home.ts`, its tests `home-rely.test.ts` and the home part of
  `pages.test.ts`.

## Acceptance criteria

| # | Criterion | Code | Test | Evidence |
|---|---|---|---|---|
| 1 | Home renders every gallery state the fixture covers, 390-1680 px, check clean | `_home/home-page.tsx`, `components/home/*` | `tests/ui/cases/home.mjs`: India at 1680/1280/1024/768/390; US, open (example clock), dark, and the trade tabs AI team / Hybrid / Baselines at 1280 and 390. Each is compared with `gallery/<state>-<width>.png`. Plus `frame-page-home-*` (4 widths), `dark-home-*` (contrast) and `shell-home-*` | Full harness: see the run in the orchestrator report (all cases, 0 failed). The harness performs check_page's checks on the running app (W8 decision). **Strong evidence** |
| 2 | Matches the signed-off mockup, differences listed | (sections) | the comparisons above | `reviews/claude/w9/compare-*.jpg`; differences below. **Strong evidence** for the match; the look is the owner's call |
| 3 | Components depend only on `HomeData`; import-graph test | `lib/home/source.ts`, `lib/home/wiring.ts`, `_home/blocks.tsx` | `lib/home/tests/import-graph.test.ts`, on W8's one resolver (`@/` alias, extensionless, re-exports, dynamic and template imports, transitive walk). Rules: components/home reach no adapter, wiring or data client; nothing but the wiring imports the adapter; only the loaders read the wiring; the adapter is one line. Planted breaches tested. Also no Buy/Sell outside the frame's TradeButton | A real file `components/home/zz-planted.tsx` importing `../../lib/home/fixture-source` (extensionless) fails the tests; removed, they pass. **Strong evidence** |
| 4 | No figure adds across groups, markets or currencies, except the per-group totals | `lib/home/groups.ts` (pass-through only), `lib/home/trades.ts` (one trade's own value or the range, never a sum) | Node, `lib/home/tests/blocks.test.ts`: a card's total *is* the block's total, its F&O line *is* its book's figure, and row figures are trades' own values. Running app, `tests/ui/cases/home-checks.mjs`: every money figure inside Home must be a fixture value of that market, in that market's currency. It is applied to India and the US, and planted sums are caught on every run: a cross-currency sum (₹4,40,900 + $4,007.60) and a sum of two groups | Harness `home-india`, `home-us` and others: ok. **Strong evidence** |
| 5 | No screen names an AI model; one display-name rule; a test over every rendered fixture state | `lib/ui/strategy-names.ts` (`applyDisplayNames`, `displayNames`, `citedId`), applied in `lib/ui/api-client.ts:87`, `lib/shell/fixture-source.ts`, `lib/home/fixture-source.ts` | `lib/ui/tests/strategy-names.test.ts`: the fixtures really carry model names, and after the rule none is left in any prose text of every mockup data file, every stored harness payload and Home's blocks. Collisions get letters; clean names are kept; ids are kept. `tests/ui/harness.mjs`: **every case of every page** fails if the rendered text, or any `data-tip`, `aria-label` or `title`, names a model | The first full run with this check found 5 real leaks on old pages, now fixed (see below). **Strong evidence** |
| 6 | Code size, typecheck, tests, build | | `node tools/check_code_size.mjs`; `npm run typecheck`; `npm test`; `npm run build` | code size ok; tsc clean; **360 tests, 360 pass**; build ok. **Strong evidence** |

## What the every-case model-name check found on the old pages, and the fixes

1. **"AI combined (Opus)" and similar in the stock fixtures (strategy maps, sentences).** The display-name rule at the
   read client turns them into "AI team · combined A" / "B", with letters by id where two would read the same.
2. **A raw strategy id in a tooltip** (`(ai.combined.opus.v1)`, stock strategies page). Removed from the tooltip: ids
   are keys, not text.
3. **Cited evidence ids shown as text** (Rule vs AI findings and proposals, the company page's reasons), for example
   `tra:acc:ai.combined.opus.v1:…`. They now read `tra:acc:[AI team · combined A]:…` through `citedId`, so they stay
   traceable and name no model.
4. **Help copy: "Claude traders", "The Claude agent".** Now "AI traders" and "The AI agent".
5. **A regression of my own, caught by the existing story-page case.** The first version of the rule also rewrote
   "opus" inside trade ids (keys), which broke the lifecycle story's lookups ("steps: 0"). Root fix: identifiers (no
   spaces, containing `.` or `:`) are never rewritten; a page that shows one as text uses `citedId`. Tested both ways.

**Judgement call, flagged for the owner (reasoning only).** `MODEL_NAME` covers model names: Opus, Sonnet, Haiku,
GPT-…, Gemini, Llama, Mistral and others. It does not cover the word "Claude" alone, which names the vendor's app and
API. The companies page lists "the Claude app" as a command channel, and the assistant page says its costs are "on the
Claude API". These are product and channel names, not a strategy naming its model. If the owner wants "Claude" gone
from every screen too, it is one word in `MODEL_NAME` plus two copy edits.

## Visible differences from the mockup (and why)

- **The theme button and the Ask icon.** As in W8: the UX4 three-way theme button, and the B8 chat panel's Ask
  (accepted in W8).
- **Compact density** (`#density=compact` in the mockup) is not a URL state in the app. It is in the profile menu for
  the session. Not compared.
- **The Hybrid tab shows in the US too.** That follows the signed-off picture (`gallery/home-us-1280.png`, "Hybrid
  (0)") and the owner's fifth round (hybrid stock strategies in both markets). `notes.md` row 5 still says
  "Hybrid (India)"; W10 already reported that wording. I did not edit the frozen notes.
- **Gallery states not covered by the fixture are not compared**, because they belong to the frame (W8) or need
  interaction: order window, search, hover card, notifications, profile, F&O example picks, basket, order placed.
- **Empty states.** "No strategy yet" (Hybrid), "Nothing open here" (Hybrid tab) and "no approved strategy yet" (F&O
  books) are in the fixture and shown. "Nothing needs you", "Nothing scheduled" and "No news stored yet" are coded,
  but no fixture state reaches them.

## Doubts and limits

- **Fixture source.** Home's fixture is W10's example file, not 31's `data.json` directly. The examples are taken from
  31 and 30 and validated by W10's job, so field names match the contract. If W10 regenerates them, the sync test
  fails until the copy is refreshed. That is deliberate, as in W8.
- **The money check** matches each shown figure against every number of that market's fixtures, in cents or whole
  units. A planted sum that happened to equal another fixture value would pass: the group-sum plant I first chose
  equalled the Baselines total exactly. The plants used now are checked not to collide (some evidence that the check
  is strong; it is not a proof).
- **Free-text names.** The display-name rule rewrites model names in free text too. A future headline that names
  "Gemini" (also a company) would read "AI team". That is acceptable for research screens (reasoning only).
