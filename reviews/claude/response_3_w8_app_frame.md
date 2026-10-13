# W8: the signed-off app frame in the real app (builder claims)

Story: `exepex/trading` `docs/stories/X-cross-repository.md`, section W8. Mockup: `design/mockups/30-shell` (signed off
by the owner on 13 Oct 2026; its `notes.md` is the frozen data contract). All paths below are under `web/` unless
they start with another folder. Confidence labels: **strong evidence** (command output or a test), **some evidence**,
**reasoning only**.

## What was built

- `lib/shell/contract.ts`: the types of 30's elements (instruments, sources, session, signals, accounts, limits,
  charges, notifications), plus `FrameData`, the slice of one market that the frame renders.
- `lib/shell/source.ts`: the `ShellData` interface. `lib/shell/fixture-source.ts` is the fixture adapter: the mockup's
  own `data.json`, copied unchanged into `lib/shell/fixture/shell.generated.json` by `tools/sync-design.mjs` and
  checked by `lib/ui/tests/design-sync.test.ts`. `lib/shell/wiring.ts` picks the adapter in one line. Only
  `app/(cockpit)/[market]/layout.tsx:23` reads it.
- Pure logic, unit-tested: `clock.ts` (market clock, as-of and stale), `market.ts` (status chip, **the one lock
  rule**, the example clock), `view.ts` (F&O removed from a market without F&O, by one rule), `search.ts`, `nav.ts`
  (the rail mapped onto the app's real pages; unbuilt screens say "not built yet"), `order.ts` (the order preview).
- `components/frame/`: 17 small client components. The frame (`frame.tsx`) holds the app bar, nav rail, picks panel,
  pick row, phone tabs, drawer (quick view, all screens), order window and order fields, hover card, search palette,
  menus, shortcuts, trade buttons and shared parts. The old `components/shell/app-shell.tsx` and `status-bar.tsx`
  are deleted.
- UI harness: `tests/ui/cases/frame.mjs` and `frame-checks.mjs`. The harness gained a `mockupShot` option for state
  screenshots (`tests/ui/harness.mjs:227`).

## Acceptance criteria

| # | Criterion | Code | Test | Evidence |
|---|---|---|---|---|
| 1 | Every page inside the frame at 390, 768, 1280 and 1680 px; no console errors, no external requests, no horizontal overflow | `app/(cockpit)/[market]/layout.tsx:23`, `components/frame/frame.tsx` | `tests/ui/cases/frame.mjs` `frame-page-*` (16 page cases × 4 widths, each page session's own checks plus `frameChecks`) | `node tests/ui/harness.mjs` → **147 cases, 0 failed** (report: `reviews/claude/w8/ui-report.json`, every case `"errors": []`). **Strong evidence.** See "check_page.js" below |
| 2 | Side-by-side comparison with the mockup at 1280 and 390 for default, dark, US and closed-market states; differences listed | (frame) | `frame-compare-default/-dark/-us/-open/-closed-order/-order/-palette-code` | `reviews/claude/w8/compare-<state>-<width>.jpg` (14 images, mockup left, app right). Differences are listed below. **Strong evidence** that the frame matches; the look is for the owner to judge |
| 3 | Search finds a stock by name and by ticker, an option by its NSE code; the US finds no F&O instrument | `lib/shell/search.ts:31-79`, `lib/shell/view.ts:9` | `lib/shell/tests/search.test.ts` (9 tests, including `NIFTY26OCT22800CE` whole, lower case and padded; US by code and by words); UI cases `frame-search-india` and `frame-us` | `npm test` passes; harness ok. **Strong evidence** |
| 4 | While the market is closed every manual Buy and Sell is disabled with the reason, by one rule (search results, picks, hover card, order window) | rule `lib/shell/market.ts:25`; used once at `components/frame/use-frame-state.ts:42`; every control is `components/frame/trade.tsx:22` (`disabled={lock !== null}`, reason in `aria-label` and the wrapper's tooltip `:41`); keyboard B/S `components/frame/shortcuts.tsx` (snack with the reason); order window check `lib/shell/order.ts` (`Market open` failed first) | `lib/shell/tests/market.test.ts` (rule), `lib/shell/tests/lock-rule.test.ts` (only `trade.tsx` draws Buy/Sell; palette, picks and hover card import it), UI `frame-lock` (picks, search results, hover card at 1280 / quick view at 390, keyboard B, order window: every `[data-trade]` disabled with "Market closed: …") and `frame-open` (the same controls enabled on the example clock; Buy and Sell keep distinct colours) | **Strong evidence** |
| 5 | Components import only the ShellData interface, never the fixture adapter or a data client; swapping the adapter is one line | `lib/shell/wiring.ts:6` | `lib/shell/tests/import-graph.test.ts`: frame components import no adapter, wiring, fixture, `lib/data` client (except the `Market` type), `lib/tools`, `lib/assistant`, `use-api`, `pg` or SDK; no component or page part anywhere imports the adapter or wiring; planted imports are caught (static, dynamic, JSON); the wiring is one `export const shellData` line read only by the market layout | Planting `components/frame/zz-planted.tsx` with `import { fixtureShellData } from "../../lib/shell/fixture-source.ts"` fails two tests (output: `not ok 1 … 'components/frame/zz-planted.tsx imports lib/shell/fixture-source.ts'`). **Strong evidence** |
| 6 | The order window shows estimates labelled as estimates, names the snapshot or price check the fill would use, and has no submit path (test) | `components/frame/order-window.tsx` (labels "Order value (estimate)", "Charges (estimate)", "Maximum loss (estimate)", "Cash after (estimate)"; `fillNote` `lib/shell/order.ts:132`; foot button `:114` always `disabled`, no handler, `data-submit="none"`) | `lib/shell/tests/order.test.ts` (9), `import-graph.test.ts` "AC6" (no `fetch`, XHR, beacon, socket, form, `onSubmit`, POST or `/api/` path in `components/frame` or `lib/shell`; the foot button is disabled with no `onClick`), UI `frame-order` (labels, fill basis words, quantity updates the estimate, future refused, single short call blocked, **no non-GET request** sent during the whole interaction, including a forced click on the foot button) | **Strong evidence** |
| 7 | Code size, typecheck, all existing tests (303 or more) and the build pass; no regression | n/a | `node tools/check_code_size.mjs`; `npm run typecheck`; `npm test`; `npm run build`; full UI harness | `code size: every file within 350 lines or its listed size`; typecheck clean; **346 tests, 346 pass** (303 before + 43 new); build ok; harness **147 cases, 0 failed** (all earlier page cases still pass). **Strong evidence** |

### Commands (run on the pushed head)

```
node tools/check_code_size.mjs            -> code size: every file within 350 lines or its listed size
cd web && node tools/sync-design.mjs --check -> design copies current
npm ci --ignore-scripts && npm run typecheck && npm test && npm run build
                                          -> tsc clean; # tests 346 # pass 346 # fail 0; build ok
npm run build && node tests/ui/harness.mjs -> 147 cases, 0 failed
```

## check_page.js (story text, reported to the orchestrator)

AC1 names `node design/system/check_page.js` "against the running app", but that script only takes a file. It does
`page.goto('file://' + …)` and counts any request that is not `file:` or `data:` as external
(`design/system/check_page.js:22-23`), so it cannot open a URL. I did not edit `design/`. The UI harness runs the
same checks on `next start`: console errors and warnings, page errors, any request off the app's origin, horizontal
overflow and elements past the edge. It also checks the first Tab stop and the self-hosted font.

## Visible differences from the mockup (and why)

1. **Locked Buy and Sell are grey, not faded green and red.** The design system's `components.css:386,390` turns
   disabled Buy/Sell grey. The owner's rule (30 `rationale.md:55`) says faded. The mockup's own screenshots disagree
   with each other (`shot-1280-full` grey, `shot-closed-order`/`shot-palette-code` faded colour). The app uses the
   design CSS unchanged, so this is asked of the design session (sent to the orchestrator). The fix is a design-system
   change plus `node tools/sync-design.mjs`.
2. **Theme button icon.** The app keeps the tested UX4 three-way button (System → Light → Dark; `tests/ui/cases/dark.mjs`).
   With "System" chosen it shows the contrast icon, not the mockup's moon. The profile menu also offers the three
   choices, and the button follows a choice made there (THEME_EVENT).
3. **Ask the assistant.** The app bar has one extra icon (from 600 px), and on phones Ask is the first item of More.
   B8's chat panel predates the mockup and would otherwise be unreachable (`chat-panel` UI case). Focus returns to
   Ask, or to the More tab on a phone.
4. **The order window is a preview.** Its foot button never submits. It reads "Preview only" when every check passes,
   or "Market closed" / "Blocked by a limit check" / "Refused: no executable quote". The mockup's "Buy 10 RELIANCE"
   that recorded an order is out of scope (the Manual account story).
5. **Not built in this story:** the context menu (row ⋮), the F&O example state (`#fno=example`) with its basket order,
   and bookmark hash writing (the hash is read: `#drawer=…`, `#pal=…`, `#keys=1`, `#picks=1`, `#ap=…`, `#clock=open`).
   Density and rail choices last for the session only (no storage).
6. **Navigation mapped to real pages.** Rail entries open the app's existing pages: Watchlists, Paper portfolios
   (Portfolio group, `g p`), Strategy lab, Track record, "Scoreboards (Rule vs AI)", Companies (Research), News,
   Assistant, Help. The mockup's other screens say "not built yet", as the mockup's "soon" did. The phone "Orders"
   tab says the same.
7. **The page content is the app's own pages.** The mockup's centre shows the "Platform shell" explainer page. The
   existing pages keep their own head, including their own session chip, which repeats the frame's chip until W9 and
   later rebuilds.

## Inherited defects exposed and fixed at the cause

The frame leaves the page 8 px less room at 768 px (rail 84 vs 76) and much less at 1280 px (rail plus picks panel).

- Rule vs AI, 768 px: the sentence-length cost label (`white-space: nowrap`) already overflowed its own box in the old
  frame (measured: right edge exactly at 768). It now wraps (`rule-vs-ai.css:34`).
- Company, 1280 px: the open-trades table hid its detail columns by viewport width. It now uses its own width
  (container query, `company.css:107-108`).
- Paper portfolios, 768 px: the trade tables switched to compact columns only below a 640 px viewport. They now switch
  by their own width (container query at the end of `paper-portfolios.css`). This width was never tested before.

## Doubts and honest limits

- **The clock.** The frame draws at the payload's `now` (the fixture's 7 Oct 17:30 IST), so every screen is
  deterministic. A live adapter must return its read time, and a page left open across the close does not tick the
  chip. There is no submit path, so this cannot place anything (reasoning only). Real adapters should add a tick.
- **The fixture changed under me.** Upstream `30-shell/data.json` changed the NIFTY lot from 75 to 65 (and the example
  basket values) after the sign-off, with no entry in `notes.md`. The shape is unchanged. I re-synced the copy, and one
  test now reads the lot from the data. Flagged for the orchestrator.
- **W10 block endpoints.** W10 (merged while I built) splits the frame into 23 block endpoints. `ShellPayload` here
  follows 30's `notes.md`, as the story asks. A real adapter will compose those blocks into this contract, or the
  contract can be split later behind the same interface (some evidence).
- The UI harness is not in CI (it needs Playwright). CI runs code size, typecheck, node tests and the build.
- The lock's "one rule" is proven structurally (one function, one component, source scan) and behaviourally (UI
  cases). There is no React unit test, because Node's type stripping cannot run `.tsx`.
