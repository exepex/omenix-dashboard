# 41 Paper books (F&O): data used, where it comes from, the contract

**Status:** first draft for the owner (16 Oct 2026), story W3c (exepex/trading `docs/stories/W3-fno-screens.md`; the
screen is built by the W3 builder in `web/`, the page by P2c). India only, F&O only: absent in the US market.

## Data used

| State (URL `#s=`) | Case | Source |
|---|---|---|
| `india_won` (default) | positive: Book 1 has a winning closed trade and one open position; books 2 and 3 untouched | `api/examples/fno-screens.json`, `getFnoPaperTrades_india_won` |
| `india_lost` | negative: two losing trades, one fill missed at 60 minutes because the price moved | `getFnoPaperTrades_india_lost` |
| `india_none` | empty: no paper trade yet; every book at its opening Rs 20 lakh | `getFnoPaperTrades_india_none` |

**Every state is Mock: made-up numbers on a future date (16 Nov 2026).** Contracts are fictional (`MOCKNIFTY...`).
`data.json` is built from the catalog (`_platform/catalog_data.py`), one copy of the data.

**Real data today (exepex/trading, 16 Oct):** three books, each at Rs 20 lakh, 0 open trades, 0 closed trades
(`journal/<book>/daily_totals.csv`; the accounts themselves are in Drive, E2c). The screen will show the empty case.

## Contract

`FnoPaperTrades` (`api/schemas/fno-paper-trades.yaml`), page `paper_trades`; field table in `api/catalog/fno-screens.md`.

## Elements

| Element | Fields |
|---|---|
| One card per book (never summed) | `accounts[].family`, `value`, `opening_value`, `cash`, `open_trades`, `open_max_loss`, `as_of`, `brake` |
| Shadow tests | `shadows[]` |
| Open positions | `open[]`: `family`, `strategy`, `structure`, `legs` and `alerts` (owner only), `opened_on`, `max_loss`, `unrealised`, `days_to_expiry` |
| Closed trades | `closed[]`: `family`, `strategy`, `exit`, `opened_on`, `closed_on`, `result`, `gross`, `costs`, `net`, `fills[]` |

## Things the owner should know (brutally honest)

1. **Legs are owner only.** They are published to the private database and shown only on the signed-in dashboard,
   never in a public repository; the strategy shows its display name, never its rules.
2. **The open-risk cap is sent (contract 2.10.0, `accounts[].open_risk_cap`, Rs 1,50,000 from C5's config):** the
   mockup drew a copied 1,50,000 before; the W3 builder pointed out that a copy goes silently wrong when the config
   changes, so the bar now reads the payload, like the pause limit.
3. **Added in contract 2.8.0 and drawn:** shadow test accounts in their own section, never part of a book (B0 is the
   measurement account); each book's distance to its pause (its loss from its high against the published Rs 1,20,000
   limit, never a strategy's threshold); the monitor's alerts on an open position, text and time only, owner only.
4. **The three fills (5, 30, 60 minutes) are one decision seen three ways**, never three trades; the verdict uses 60.
