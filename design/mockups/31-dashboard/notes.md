# 31-dashboard (Home): data contract (what every element needs)

**Data source:** `data.json` is composed by `design/mockups/_platform/real_data.py` from the application's own example
records (`01-home`, `03-company`, `07-paper-portfolios`), with the shell's data (`30-shell/data.json`) for prices, picks
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
| 4 | Who trades: You | `lines[]`: `label`, `value` (money), `pnl` (money), `pnl_label`, `sub` | post-close | Manual account (new story) |
| 4 | Who trades: Rule-based, AI-based | stocks: head-to-head portfolio `net_pnl`, `trades`, `sample_badge` per family (`scoreboard_row` scope pick_rule, horizon all); yesterday `eod.results.<family>.{trades, wins, net_pnl}`; open trades count. India: the F&O book of that approach (Book 1 rule, Book 3 AI): `value` (₹5,00,000 capital), `pnl`, state, loss limit used of ₹30,000 | post-close; 3 pm run | stock tool `scoreboard_row`, `eod_analysis`; **F&O tool** book accounts and Risk |
| 4 | Who trades: Hybrid | stocks: the hybrid stock family's head-to-head and yesterday lines as for rule and AI (empty state "no hybrid stock strategy yet" until the stock tool publishes it); India: F&O Book 2 as above | post-close; 3 pm run | stock tool (planned `hybrid` family); **F&O tool** |
| 4 | Who trades: Baselines (comparison line) | `eod.results.baseline`; open trades count | post-close | stock tool |
| 5 | Open paper trades: yours | `own[]`: `id`, `qty`, `avg`, `unrealised`, `source` (e.g. "Recorded from Slack") | post-close (price), on record (trade) | stock tool own trades |
| 5 | Open paper trades: strategies' | tabs All, Yours, Rule-based, AI-based, Hybrid (India), Baselines; `strategy_trades[]`: `id`, `family`, `strategy_id`, `strategy`, `horizon`, `qty`, `avg`, `unrealised`, `exit` (date), `amount`; grouped per stock and family on screen, P&L shown per trade, never summed | intraday check / post-close | stock tool `open_trade` |
| 5 | Needs you | `attention[]`: `icon`, `tone`, `title`, `sub`, `inst`; built from trades exiting today (`open_trade.exit_date`), the post-close run not yet done (`runs.post_close.next_at`), major events today (`events.major`), promotional or rumour news on a tracked stock (`news_item.status`) | each run | dashboard rules over stock tool records |
| 6 | Coming up | `events[]`: `date`, `title`, `kind` (rbi_policy, earnings, holiday, fno_expiry, fomc, cpi, jobs_report), `major`, `inst` | daily | stock tool event calendar (`config/events`) |
| 6 | Top news | `news[]`: `title`, `src`, `status` (verification), `at`, `tickers` | news run | stock tool `news_item` |

Not on Home any more (owner, 13 Oct 2026): a second search box, the watchlist panel, "Today's decisions", the separate
"At risk now" card (now a line in the F&O books card) and the market card at the bottom (now the band at the top).
