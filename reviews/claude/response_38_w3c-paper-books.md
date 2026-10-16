# Response 38: story W3c, the F&O paper books screen (claims for the judge)

Branch `story/w3c-paper-books`, from main 1972241 (contract 2.8.0). Mockup `design/mockups/41-paper-books`, contract
`FnoPaperTrades` (page `paper_trades`). Builder session 0134MoC6.

## What it adds

- **Data, the W12 pattern:** `lib/fno-paper-books/` has the contract types, one interface (`PaperBooksData.trades()`),
  the Azure adapter (page `paper_trades` through `lib/fno`'s reader; no page yet is the empty state with its reason,
  never an example), the fixture adapter (P1's three examples, only without a database), one wiring with
  `paperBooksLive` for the frame's Example rule, and two pure views (`view.ts`: books and shadows; `trades-view.ts`:
  open and closed). `FNO_PAGES.getFnoPaperTrades = "paper_trades"`, removed from the not-read list; the integration
  test's page record has it.
- **Page:** `/india/paper-books`, India only (static params, `dynamicParams = false`, the US is a 404); route
  `paper-books` (mockup 41, endpoint fno/paper-books, nav true); nav item "Paper books (F&O)" in India's Portfolio
  group (story W3 answer (a)), absent in the US.
- **What it shows, as mockup 41:** one card per book (value at the marks, up or down since its opening with sign,
  glyph and word, cash, open positions, open risk, distance to its pause as a bar and words); shadow tests in their
  own section (B0 "Measurement"); open positions with legs and today's monitor alerts (time in IST and text); closed
  trades before costs, costs, after costs, the result, how it closed, and the 5/30/60-minute fills (a missed fill says
  why; a trade from before E8 says "Before owner-timing fills", never a made-up fill). Paper on every money section.
- **CSS:** the bar track (`.cap .bar`, `.cap .bar i`) moved from weather.css to the shared fno-screen.css (both
  screens draw it); the page's own rules are in `paper-books.css`.

## Rules and how they are held

- **Never summed across books:** the views map each account on its own; a test checks no three-book total appears.
- **Strategy internals:** the screen shows the payload's display names and structure words only; the contract never
  sends rules.
- **Owner-only fields (legs, alerts):** shown only on the dashboard, which is behind Vercel Authentication. The public
  gateway never reaches this screen: the gateway import test covers every `lib/fno-*`, `components/fno-*` and W3 page
  (the new ones included, found by pattern), and still passes.
- **Judge 222's tightening, done:** `screens-import-graph.test.ts` now requires every reader of a screen's wiring to be
  a loader of that screen's own routes (endpoint `fno/<screen>` or `fno/<screen>-<part>`), and each screen to have
  such a route. New planted cases: another screen's loader reading the weather's wiring is caught; the weather
  history's own loader passes.

## Open, honest

- **The open-risk cap bar is not drawn.** Mockup 41 draws "open risk of its Rs 1,50,000 cap" with the cap written into
  the mockup; the contract does not send the cap. Copying the owner's number into the screen would make a second copy
  of a config value (C5) that silently goes wrong when the cap changes, so the screen shows the open risk alone
  ("Open risk ₹3,984 (the open positions' maximum losses)"). I asked the screens lead to add the cap as a field (e.g.
  `open_max_loss_cap` per account) in contract 2.9; the bar comes with it. Reasoning only; the owner or judge may
  prefer the mockup's constant.
- **The monitor's mode and `alerts_today` are not shown** (mockup 41 does not draw them); the alerts list is.
- **Real data today:** three books at Rs 20 lakh, no trade. With the database set, the screen shows "not published"
  until P2c's page lands.

## Gates on this tree

- check_code_size, check_contract, check_fno_screens and the design copies pass; typecheck passes; `npm test`
  511/511 with 0 skipped; build passes.
- Screenshots at 1280 and 390 px show no horizontal overflow and no console errors; `/us/paper-books` gives 404.
