# 39 Today's card: data used, where it comes from, the contract

**Status:** first draft for the owner (15 Oct 2026), built by story P1 (exepex/trading, the F&O data catalog). Screen
proposal for W3 (slice C); the card's first real surface is Slack (story T1, slice A). India only, F&O only: in the US
market the screen is absent (the page sends the US market to Home).

## Data used

| State (URL `#s=`) | Case | Source |
|---|---|---|
| `india_trade` | positive: TRADE | `api/examples/fno-screens.json`, example `getFnoCard_india_trade` |
| `india_watch` | positive: WATCH (a shadow, never traded; the advocate did not answer in time) | `getFnoCard_india_watch` |
| `india_red` | negative: NO TRADE, weather RED | `getFnoCard_india_red` |
| `india_missing` | negative: NO TRADE, two missing inputs named | `getFnoCard_india_missing` |
| `india_none` (default) | empty: NO TRADE, no strategy has passed, as a TEST post (the shape of T1's real post of 15 Oct 2026) | `getFnoCard_india_none` |

**Every state is Mock: made-up numbers on a future date (Mon 16 Nov 2026), with clearly fictional contracts (`MOCKNIFTY...`, strikes near 10,600, far from any real level; judge 102 minor 1).** No card exists yet (T1 is not built).
`data.json` is not a second copy: `build.py` reads the catalog's examples (`_platform/catalog_data.py`) and
`python3 tools/api/check_fno_screens.py` fails if `data.json` ever differs from them.

## Contract

Addendum (orchestrator, 15 Oct 2026): T1's first real post (#fno-desk, 15 Oct) showed fields the contract lacked; added: the TEST flag, the session note, the card's valid-until time, paper trades so far per book, every question's house forecast with its live and back-fill records apart, the gaps and earlier misses, and the records used by path and SHA-256. exepex/trading tests T1's real delivery record against FnoCard.

The schema is `FnoCard` (`api/schemas/fno-card.yaml`), endpoint `GET /api/v1/markets/india/fno/card`; every field's
meaning, unit, backend record, freshness, visibility and whether the backend can fill it today is in
`api/catalog/fno-screens.md`. The screen computes nothing: every figure is the payload's.

## Elements

| Element | Fields |
|---|---|
| Verdict header (glyph, word, colour) | `status`, `reason_text`, `session` |
| The card's three times | `timing.*` |
| The position (owner only) | `trade.what`, `trade.strategy`, `trade.family`, `trade.legs[]`, `trade.entry.*`, `trade.size.*` |
| The most it can lose against the per-trade cap (Rs 10,000, sent since contract 2.11.0, never copied) | `trade.max_loss`, `trade.max_loss_cap` |
| If it goes badly | `trade.worst_cases[]` |
| How it ends, what would prove it wrong | `trade.exit_plan[]`, `trade.proves_wrong[]` |
| Costs and tax, volatility edge | `trade.costs.*`, `trade.vol_edge.*` |
| Weather | `weather.colour`, `weather.why` |
| The forecast and its record | `forecast.*` |
| Devil's advocate | `advocate.*` |
| Data checks | `data_checks.passed`, `data_checks.missing_inputs[]` |
| How far the strategy has come | `evidence.*` |
| The price of staying out | `price_of_staying_out.*` |
| If you cannot act in time | `if_you_cannot_act` |
| Records behind this card | `footer.record_hashes[]` (path and SHA-256) |
| TEST banner, session note, valid until | `test_post`, `session_note`, `valid_until` |
| Paper trades so far | `paper_trades_so_far.*` |
| If the market jumps overnight (design 6.2's daily stress line, owner only) | `stress.*` |
| Every forecast on record (live and back-fill records apart) | `forecasts_on_record.*` |
| What the card is missing | `missing[]`, `previous_misses[]` |

## Things the owner should know (brutally honest)

1. **Live card details are owner only.** Your decision of 15 Oct 2026 keeps card records in Google Drive. The legs,
   entry range and exit plan are marked `owner` in the contract: they may be shown on your signed-in dashboard but never
   committed to a public repository. P2's original design (a committed copy of every page under
   `reports/dashboard/<date>/`) would break that for the card; P2 must store the card page outside the public
   repositories or commit only its hash. Reasoning only; your decision when P2 is rewritten.
2. **The exit plan is written in plain words without the strategy's numbers in the public examples.** A take-profit
   level is a strategy threshold (your rule: internals stay private). On your own dashboard the real card may show the
   numbers; whether it should is your call.
3. **"Buy" and "Sell" on the legs are labels, not buttons.** The card never offers an order button.
4. The navigation rail has no entry for this screen yet: adding one changes the shared runtime of every signed-off
   mockup, so it waits for W3.

## Checks

- `python3 design/mockups/39-trade-card/build.py` twice gives the same bytes.
- `node design/system/check_page.js "design/mockups/39-trade-card/page.html#s=<state>" design/mockups/39-trade-card shot-<state>`
  for all five states at 1280 and 390 px: no console errors, no external requests, no overflow.
- `node design/system/check_text.js design/mockups/39-trade-card/page.html "" s=india_trade s=india_watch s=india_red s=india_missing`: 0 findings.
