# 42 Scoreboards (F&O): data used, where it comes from, the contract

**Status:** first draft for the owner (16 Oct 2026), story W3h (exepex/trading `docs/stories/W3-fno-screens.md`;
the screen is built by the W3 builder in `web/`, the page by P2). India only, F&O only: absent in the US market.

## Data used

| State (URL `#s=`) | Case | Source |
|---|---|---|
| `india_ahead` (default) | positive: both boards ran; Rule-based leads; too few trades for the do-nothing test | `api/examples/fno-screens.json`, `getFnoScoreboards_india_ahead` |
| `india_behind` | negative: board B, every book behind doing nothing; board A still a pilot | `api/examples/fno-screens.json`, `getFnoScoreboards_india_behind` |
| `india_none` | empty: no scoreboard has run | `api/examples/fno-screens.json`, `getFnoScoreboards_india_none` |

**Every state is Mock: made-up numbers on a future date (16 Nov 2026).** `data.json` is built from the catalog
(`_platform/catalog_data.py`), one copy of the data.

**Real data today (exepex/trading, 16 Oct):** S2 (board B) is built and S3 (board A) is merging, but no workflow runs either yet and their files are kept in Drive; the screen will show the empty case until they run.

## Contract

FnoScoreboards (`api/schemas/fno-scoreboards.yaml`), page `scoreboards`, contract 2.8.0; field table in `api/catalog/fno-screens.md`.

## Things the owner should know (brutally honest)

1. **The two boards never become one number.** B answers which whole system made the most money; A answers whose decisions were better on the same opportunities. A combined figure would mix the questions.
2. **"Beats doing nothing" uses S1's frozen test**, so early on every book shows "Not enough trades yet"; a pilot shows no verdict at all.
3. **After all costs** includes the AI cost allocated to the books, so the AI books carry their own price.
