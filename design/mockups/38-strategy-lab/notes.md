# 38 Strategy lab: data used, where it comes from, the proposed contract

**Status:** signed off by the owner on 13 Oct 2026, as of 32ad873 ("I sign-off the design"). This file is now the frozen
contract; later changes, with their reasons, go in `changes.md`. Supersedes the stock-repository-era
`05-strategy-lab` (built on the stock tool's invented catalogue examples) as the menu's Strategies > Strategy lab.
`37-forecasts` (Forecast lab) stays as the side view on F&O predictions, linked from here.

## The owner's brief (13 Oct 2026, condensed)

"Which strategy worked very well with the number of winning trades, the number of losing trades and the percentage ...
since beginning and then for a range, and the graph changes ... one for stocks, one for F&O, and combined ... how a
professional stockbroker (Groww, Zerodha) would show it to a first-time investor and to a professional ... whether I
should trust the system with real money ... the end goal is net profitable trades." Today's picks belong on Home.

## What the screen answers, top to bottom

1. **Ready for real money?** Each family against its backend's own written bar: the stock tool's go-live bar (SPEC
   F7.2: 2 months of paper trading, about 300 trades, beats the best baseline, luck test, drawdown within 10 times the
   per-trade amount, holds in calm and volatile markets) and, for F&O, the desk's rules (DESK_DESIGN 12.1 and 12.8:
   6 months, net profit after charges, at most ₹10,000 lost on one trade, the evaluation test, calm and stormy).
2. **Who made the most, since the start:** simple cards (profit after charges, return, won/lost bar, average win and
   loss, a running line) or a detailed view (win rate, profit factor, per trade, worst fall, best and worst trade),
   with the comparison: the baselines for stocks, holding NIFTY with the same ₹20 lakh for F&O.
3. **A period you choose:** 1 week to 1 year, all, or picked dates: who won it, a table, and one chart of every family
   with the comparison line, as a running total or weekly or monthly bars.
4. **Month by month:** a coloured cell per family and month, the total and the months up.
5. **What drove the results:** per family, one plain sentence (win rate against the size of wins and losses, the
   stormy month), what moved its trades (the market, the sector, news, the stock alone; for F&O a calm or a moving
   NIFTY, from the settled trades' reason codes), calm against stormy, and the best and worst trade as sentences.
6. **Inside each family:** its strategies (stocks) or what it traded (F&O; the AI team is one team).
7. A link to the Forecast lab (F&O predictions; a side view).

Tabs: Stocks and F&O, each its own book. In India a "Both books together: total only" block gives each family one
labelled total line in rupees (owner's choice (a), 13 Oct 2026, relayed by the orchestrator: a total line only, never a
combined leaderboard, win rate or winner; recorded as the second named exception in CLAUDE.md and
design/system/README.md). In the US market only Stocks exists (no US F&O).

## Data used

| State | Source |
|---|---|
| Real (13 Oct 2026) | `source/settled.json`, copied read-only by `fetch_trades.py` from `contactexepex/agentic-stock-prediction` `data/<market>/paper_trades_settled/` (accuracy view): 39 India trades, all by the baselines (−₹543 after market charges, 46% won); no family trade has settled; none in the US. No F&O paper trade exists (slice 3). |
| Examples `early` (30 days) and `review` (160 days) | `_platform/lab_example.py`: made-up trades on future trading dates from 2 Nov 2026 (NSE's 2026 calendar, then weekdays), a made-up NIFTY with a stormy month, and profiles chosen to show every case: a family ready (F&O Hybrid), nearly ready (stocks Rule-based fails only the stormy month), losing (AI team), break-even after giving gains back (F&O Rule-based), not running (Hybrid stocks). |

**Found while building:** the stock tool's `design/catalogue/scoreboard_row.json`, `cumulative_line.json` and
`heatmap_cell.json` are labelled EXAMPLE (invented); the earlier `05-strategy-lab`, Home's group totals and the
shell's strategy figures read them. They are not real results.

## Proposed contract (per market; the F&O part is not defined by any story yet)

```
markets.<m>: {currency, per_trade (stocks), fno_capital (India), assets: ["all", "stocks", "fno"] | ["stocks"]}
families: [{id, name}]                         # rule, hybrid, ai; "baseline" is the stocks' comparison group
state:
  kind, as_of, dates[]                         # the trading dates; trades refer to them by day number
  trades.<m>.<asset>.<family>: [[entry, exit, symbol or what was traded, net_pnl, return_pct, reason_code, strategy]]
  index.<m>: [levels] | null                   # NIFTY (or the US index) closes on `dates`, for the comparison line
  costs.<m>.<asset>.<family>: [[day, own, ai_data]] | null   # beyond the market charges in net_pnl (judge 55): the owner's
                                               # own charges of trades closed that day, and the family's AI and data
                                               # costs that day (allocated, not a bill); null when not published
  stormy: [first, last]                        # day numbers of the volatile regime (stock tool `regime`; F&O A3 panel)
  ready.<m>.<asset>.<family>: [{key, label, ok: true | false | null, value, need}]
                                               # asset: stocks | fno (no combined asset); the total line is summed on the screen
  fno_reason: str                              # the empty state's reason while no F&O trade exists
```

- Stocks: every field exists in the stock tool's settled paper trade (`entry_date`, `exit_date`, `ticker`, `family`,
  `strategy_id` shown by display name, `net_pnl` after market charges, `return_pct`, `reason_code`, `regime`). The
  go-live checks are the stock tool's `go_live` block on its strategy scoreboard rows (SPEC F7.2), today computed from
  example records only; per family they need a family-level row (proposed).
- F&O: stories S1/S2 (scoreboard B) and E2-E6 (the paper desk) must publish closed trades with net P&L after execution
  charges and a reason code (proposed codes: `calm_market`, `big_move`, `trend_right`, `trend_wrong`), and S2's per-book
  **gross, execution costs, AI and data costs (13.6 labels: allocated, not a bill), net** (DESK_DESIGN 12.5) as the
  `costs` rows, plus the readiness checks against DESK_DESIGN 12.8 and the evaluation protocol (B5).
- The screen sums trades into totals, periods, months, drivers and strategies (presentation only). At real volume the
  backends should publish daily aggregates instead of every trade (proposed; the mockup carries about 2,500 trades).
- **Every headline profit and every money check of the readiness bar is after every cost** (judge 55; DESK_DESIGN 12.8:
  "net account result after execution and operating costs"; stock tool SPEC F7.2 and decision 50: the go-live bar on
  your cost): the trades after market charges, less the owner's own charges, less the family's AI and data costs.
  Trade-level figures (win rate, average win and loss, profit factor, the strategies inside a family) stay after market
  charges and are labelled so. A figure on market charges only is labelled "market charges only" and never ticks a
  readiness check: without published costs the money checks stay "waits" (null).
- **Data gap (stock tool):** its settled paper trades carry `net_pnl` after market charges only (no `your_costs`), and it
  publishes no AI or data costs per family. Both are needed before a stock family can be called ready; until then the
  real stock figures say "after market charges only". Proposed: `your_costs` on each settled trade (the catalogue already
  defines it for B2's cost view) and a daily AI-and-data cost per family.

## Things the owner should know (brutally honest)

1. **Almost nothing real yet.** On 13 Oct 2026 the only settled paper trades are 39 baseline trades of one day. No
   family's stock trade has settled; F&O paper trading starts with slice 3. The first real verdict is at least 2 months
   away for stocks (300 trades each) and 6 months for F&O. Until then, the real screen is mostly empty, by design.
2. **Both books together is a total line only** (your choice (a)). The two books use different money (₹1 lakh a stock
   trade, a ₹20 lakh F&O account), so a combined profit says who made more rupees, not who uses money better; rankings,
   win rates and readiness stay per book.
3. **Win rate alone misleads, and costs decide.** In the Example, F&O Rule-based wins 65% of its trades but makes only
   ₹215 on them, because one loss wipes out about two wins; after its data costs it is at −₹7,785. In the US Example,
   Rule-based's trades make money but the currency fee on every trade turns it into a loss. The screen always shows the
   way from the trades' result to the profit after every cost.
4. **"Why" is told from outcomes, not methods:** what moved each trade (market, sector, news, the stock alone) and how
   the family did in calm and stormy markets. That explains results without showing how a family decides.
5. **Hybrid has no stock strategy today**, so it shows "No stock strategy yet" in Stocks, never zero.
6. The predictions (37) are now a side view, as the trading design says (forecasts never promote a book).

## Checks

- `node design/mockups/38-strategy-lab/check_totals.js`: every "Both books together" line adds up as shown (9 lines);
  it fails on the build before the judge 55 fix (−₹1,24,474 + −₹59,925 shown as −₹1,84,400).

- `node design/system/shoot_states.js design/mockups/38-strategy-lab` on all 9 states (Stocks + F&O tab replaced by the total line): no console errors, no overflow, no
  external requests; `check_text.js` on 10 states: 0 findings.
- `python3 design/mockups/38-strategy-lab/build.py` twice gives the same bytes.
