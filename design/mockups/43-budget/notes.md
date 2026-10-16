# 43 AI usage and budget: data used, where it comes from, the contract

**Status:** first draft for the owner (16 Oct 2026), story W3g (exepex/trading `docs/stories/W3-fno-screens.md`;
the screen is built by the W3 builder in `web/`, the page by P2). India only, F&O only: absent in the US market.

## Data used

| State (URL `#s=`) | Case | Source |
|---|---|---|
| `india_ok` (default) | positive: AI books and roles at 34% of their cap | `api/examples/fno-screens.json`, `getFnoBudget_india_ok` |
| `india_alert` | negative: 84% of the cap, past the 80% alert | `api/examples/fno-screens.json`, `getFnoBudget_india_alert` |
| `india_none` | empty: nothing measured yet, level unknown | `api/examples/fno-screens.json`, `getFnoBudget_india_none` |

**Every state is Mock: made-up numbers on a future date (16 Nov 2026).** `data.json` is built from the catalog
(`_platform/catalog_data.py`), one copy of the data.

**Real data today (exepex/trading, 16 Oct):** `accounting/ai_usage.csv` holds one row (the weekly post-mortem, 3 minutes) and no book row; no budget signal file exists yet. The real screen will show the empty case or a lower bound with its note.

## Contract

FnoBudget (`api/schemas/fno-budget.yaml`), page `budget`, contract 2.8.0; field table in `api/catalog/fno-screens.md`.

## Things the owner should know (brutally honest)

1. **Minutes, not rupees.** BG1 caps session minutes; the subscription's real cost is not a paper figure, so it is not on this screen.
2. **No AI model name and no session id** appear anywhere (exepex/trading decision: no screen names an AI model).
3. **Building the tool counts in the basis**, so the cap grows with development work; the note says when the measure is only a lower bound.

**Shares sent, never copied (contract 2.11.0; the W3 builder, 16 Oct 2026):** the cap's share of the basis (50), the
alert (80) and the stop (100) come from BG1's config as `share_pct`, `alert_pct` and `stop_pct`; the bar's alert mark
and every sentence read them, so a changed config can never leave the screen showing old numbers.
