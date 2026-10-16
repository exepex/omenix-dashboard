# 45 Strategy lab, F&O tab: data used, where it comes from, the contract

**Status:** first draft for the owner (16 Oct 2026), story W3d (exepex/trading `docs/stories/W3-fno-screens.md`; the
screen is built by the W3 builder in `web/` as the Strategy lab's F&O tab, the page by P2d). It supersedes the F&O part
of 38-strategy-lab (its draft data and proposed contract); 38 keeps the stock tab. India only: the US has stocks only.

## Data used

| State (URL `#s=`) | Case | Source |
|---|---|---|
| `india_passed` (default) | positive: one strategy passed and makes money on paper | `api/examples/fno-screens.json`, `getFnoStrategyLab_india_passed` |
| `india_paused` | negative: the approved strategy lost and is paused for review | `getFnoStrategyLab_india_paused` |
| `india_none` | empty: no strategy has passed | `getFnoStrategyLab_india_none` |

**Every state is Mock: made-up numbers.** `data.json` is built from the catalog (`_platform/catalog_data.py`).

**Real data today (exepex/trading, 16 Oct):** 54 trials in `research/ledger.csv`, no passing policy, the playbook
registry empty. The screen will show the empty case: "No strategy has passed".

## Contract

`FnoStrategyLab` (`api/schemas/fno-strategy-lab.yaml`), page `strategy_lab`; field table in `api/catalog/fno-screens.md`.

## Things the owner should know (brutally honest)

1. **No strategy internals:** ideas show what they are and how far they got, never their rules or thresholds.
2. **Every idea tried is counted** with how many passes chance alone would give, so one pass among many tries is not
   mistaken for skill.
3. **Real money is never eligible from this screen**: every check plus your written approval.
4. **The stock tab and this tab are never combined**, except the one "both books together" total line you allowed
   (13 Oct, choice (a)); that line is drawn on 38's page from both, labelled as a total, and is the web screen's work.
