# 44 Data health (F&O): data used, where it comes from, the contract

**Status:** first draft for the owner (16 Oct 2026), story W3e (exepex/trading `docs/stories/W3-fno-screens.md`;
the screen is built by the W3 builder in `web/`, the page by P2). India only, F&O only: absent in the US market.

## Data used

| State (URL `#s=`) | Case | Source |
|---|---|---|
| `india_ok` (default) | positive: every source up to date; publish and health check passed | `api/examples/fno-screens.json`, `getFnoDataHealth_india_ok` |
| `india_problems` | negative: two sources behind, the publish failed, three problems | `api/examples/fno-screens.json`, `getFnoDataHealth_india_problems` |
| `india_none` | empty: nothing run yet | `api/examples/fno-screens.json`, `getFnoDataHealth_india_none` |

**Every state is Mock: made-up numbers on a future date (16 Nov 2026).** `data.json` is built from the catalog
(`_platform/catalog_data.py`), one copy of the data.

**Real data today (exepex/trading, 16 Oct):** 33 manifest CSVs (57,178 lines; 17,910 data rows in the 19 top-level files), the VIX and global-cue check files and the publish run status exist today; O8's health check has not committed a run yet.

## Contract

FnoDataHealth (`api/schemas/fno-data-health.yaml`), page `data_health`, contract 2.8.0; field table in `api/catalog/fno-screens.md`.

## Things the owner should know (brutally honest)

1. **Only dates, counts and statuses**, never a data value (a close, a quote or an open interest).
2. **A failed publish keeps yesterday's pages**: the screen says so instead of showing half-written data.
3. **The stock side's data health is a separate section later**, never mixed into this one.
