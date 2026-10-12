# 31-dashboard: data used and where it comes from

**All data is Mock** (`data.json`, `"_mock": true`), consistent with `30-shell/data.json` (prices, watchlists,
search, accounts, limits, charges), on the same fixed clock (Mon 12 Oct 2026, 15:40 IST). Positions' unrealised
and day P&L, the Manual accounts' values, and the basket economics are computed from those prices, so every number
agrees with the watchlist and the order window.

| Payload key (per market) | What | Published by |
|---|---|---|
| `session` | the exchange session line | dashboard (NSE and NYSE calendars) |
| `accounts` | one tile per paper account: value, day P&L, cash, a short state; India: Manual, stock tool portfolio, F&O Books 1-3; US: Manual, stock tool portfolio | Manual: new account story in both tools; stock tool portfolio: `contactexepex/agentic-stock-prediction`; Books: `exepex/trading`. Shape: the shared portfolio contract (`UNIFIED_DASHBOARD.md` section 5) |
| `positions` | open positions (stocks with exit date, target, stop; F&O structures with legs, maximum loss, days left, exit rule) | same, per account |
| `attention` | items needing action: near a stop, results ahead for a held stock, a fired alert | dashboard alerts + both backends' checks |
| `at_risk` | per account: sum of maximum losses of open F&O structures against the Rs 30,000 limit (India only) | `exepex/trading` (C2 limits, Risk read model) |
| `stock_ideas` | the day's top buy candidates: score, strategies agreeing, chance of a rise and horizon, target after market costs, 80% range, one line why | stock tool (agreement, probabilities, ranges: rm.home of 01-home) |
| `fno_ideas` | NIFTY monthly structures from the F&O tool's 3 pm decisions and forecasts (legs, credit or debit, maximum loss, breakevens, risk-neutral probability of profit, margin estimate) and a "no trade" decision with its reason | `exepex/trading` (books' decision records, forecasts, 3 pm snapshot) |
| `decisions` | today's decision of the stock tool and of each F&O book | both backends' decision records |
| `breadth` | advances, declines, unchanged | NSE end-of-day file (India), stock tool universe (US) |
| `events`, `news` | the week's events; the top three news items with their verification status | stock tool news analyst; NSE calendar; F&O event filter |
| `score_note`, `proof` | how the 0-100 score is made; how far the strategies are from proven (16 of about 300 settled trades) | dashboard text; stock tool scoreboard (`go_live`) |

**Score (new, needs backend agreement):** stocks: half from the share of strategies agreeing, half from the buyers'
average chance of a rise, both after costs; F&O: probability of profit and reward to risk. It is a ranking aid, not
a proven edge; the formula belongs in the stock tool's and the F&O tool's read models, not in the dashboard.

## Owner-changeable defaults
1. Manual paper account Rs 5 lakh with the F&O books' limits (Rs 10,000 a trade, 3 structures, Rs 30,000 at risk);
   US Manual $6,000 (my assumption).
2. "At risk now" is a small card on Home linking to Risk, per account, never summed.
