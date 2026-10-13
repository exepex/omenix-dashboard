# 31-dashboard (Home): data contract (what every element needs)

**Status: signed off 13 Oct 2026 (owner), as of commit e8cd360.** This is the signed-off API contract for Home. Change
it only for a very solid reason, brought to the owner first (through the orchestrator); record each change and its
reason here.

**Data source:** `data.json` is composed by `design/mockups/_platform/home_data.py` (with `real_data.py`) from the application's own example
records (`01-home`, `03-company`, `05-strategy-lab`, `07-paper-portfolios`), with the shell's data (`30-shell/data.json`) for prices, picks
and accounts. Clock: Wed 7 Oct 2026 17:30 IST / 08:00 ET (the catalogue cut-off). Labelled examples: the Manual
account's starting cash; the F&O books' state follows the orchestrator's statement that no F&O strategy has passed
testing (Experiment 1 has not run).

| # | Element | Fields (units) | Freshness | Publisher |
|---|---|---|---|---|
| 1 | Today at a glance: your paper account | Manual account `cash`; own positions `qty`, `avg_price`, `pnl` (currency) | post-close run | stock tool own trades (`owner_trade`); Manual account (new story) |
| 1 | Today at a glance: top pick | first of `signals` (shell): `id`, `agree.buy/of`, `exp_gain_pct` (Yes above 0, No otherwise); its Buy is locked while the market is closed | pre-open run | stock tool `head_to_head_pick` + `agreement`; `market_status.session` |
| 1 | Today at a glance: needs you | count of `attention[]` | each run | dashboard (below) |
| 2 | Market band | the session line (open with closing time, or closed with the next opening); indices `last`, `chg_pct`, `chg_5d_pct` (%), `as_of`; `session.date`, `session.regime` (EVENT_HEAVY, TRENDING, ...), `session.post_close_at`; tracked companies' `chg_pct` | close; runs | stock tool `market_status` |
| 3 | Today's buy picks (inline below 1200 px) | as the shell's picks panel (30-shell/notes.md) | pre-open | stock tool; F&O tool |
| 4 | Who trades: one summary card each for You, Rule-based, Hybrid, AI team (owner, 13 Oct 2026: each group's total on Home, detail on the group's page) | You: open profit / loss (`open_profit`, green or red), account value, open count. Each group: **total profit / loss** on stocks = `total.net`, the sum of the group's own strategies' `net_pnl` (strategy scope, accuracy view, forward basis, all horizons), with `total.trades`, `total.wins`, `total.with_trades`; the AI team is one team, so its total is its own record (`pick_rule` scope until the team publishes its strategies); empty state "No strategy yet" (Hybrid). **F&O: total profit / loss** (India only) = its book's `pnl` (Book 1 rule, 2 hybrid, 3 AI team), never added to the stock total; collapsed list of each strategy's own `net` and "N more: no trade yet"; link "Open <group>" to the group's page. Baselines: one line with their own total (`total.net`). Groups are never added together; INR and USD never | post-close; 3 pm run | stock tool `scoreboard_row` (strategy and pick_rule scopes); **F&O tool** book accounts |
| 5 | Open paper trades: yours | `own[]`: `id`, `qty`, `avg`, `unrealised`, `source` (e.g. "Recorded from Slack") | post-close (price), on record (trade) | stock tool own trades |
| 5 | Open paper trades: strategies' | tabs All, Yours, Rule-based, AI-based, Hybrid (India), Baselines; `strategy_trades[]`: `id`, `family`, `strategy_id`, `strategy`, `horizon`, `qty`, `avg`, `unrealised`, `exit` (date), `amount`; grouped per stock and family on screen, P&L shown per trade, never summed | intraday check / post-close | stock tool `open_trade` |
| 5 | Needs you | `attention[]`: `icon`, `tone`, `title`, `sub`, `inst`; built from trades exiting today (`open_trade.exit_date`), the post-close run not yet done (`runs.post_close.next_at`), major events today (`events.major`), promotional or rumour news on a tracked stock (`news_item.status`) | each run | dashboard rules over stock tool records |
| 6 | Coming up | `events[]`: `date`, `title`, `kind` (rbi_policy, earnings, holiday, fno_expiry, fomc, cpi, jobs_report), `major`, `inst` | daily | stock tool event calendar (`config/events`) |
| 6 | Top news | `news[]`: `title`, `src`, `status` (verification), `at`, `tickers` | news run | stock tool `news_item` |

Not on Home any more (owner, 13 Oct 2026): a second search box, the watchlist panel, "Today's decisions", the separate
"At risk now" card (now a line in the F&O books card) and the market card at the bottom (now the band at the top).
