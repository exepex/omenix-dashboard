# 35-stock: data contract (what every element needs)

**Status: for the owner's review** (13 Oct 2026). Not signed off. Reworked the same day after the owner's feedback
(through the orchestrator): sections A to G of that brief.

## Data: real records, not examples
- `source/stock.json`: the stock tool's own published records of RELIANCE (India) and NVDA (US) up to 13 Oct 2026
  09:00 UTC. It was copied read-only by `fetch_stock.py` from `contactexepex/agentic-stock-prediction` (commit
  26721c7). It holds:
  - two years of daily prices of the stock and its benchmark (NIFTY 50, the S&P 500 fund);
  - the last price check;
  - features, model chances, expected ranges and the strategies' views for the latest session, the costs and the AI
    team's reasoning;
  - the strategies' open paper trades at the last check;
  - the 40 latest news stories of 30 days with their confirmation status and claims;
  - events, results estimates, quarterly financials (NSE) or SEC fundamentals;
  - India: delivery, announcements, block deals, promoter pledge;
  - US: insider filings, short interest, 13F holders.
- **F&O (India):** NSE's daily F&O files: the screener's source (`33-screener/source/fno.csv.gz`, three months) and the
  day's listed futures of the stock (`source/fno_expiries.csv`, copied by `fetch_fno.py` from NSE's 12 Oct file).
- **Sector index (India):** NSE's daily index file through the markets page's source (`34-markets/source/indices.csv`).
- **Your paper position** comes from the shell's own-trade record (Home's, signed off). The Manual paper account is
  not built in the backend yet.
- **The page's clock is Tue 13 Oct 2026 14:30 IST** (09:00 UTC). India's market is open, so the price is the 12 Oct
  close plus the stock tool's 14:14 IST price check. The US market is closed (its 12 Oct close).
- AI strategies appear as the one AI team, and no model is named. The fetch refuses to write a file containing a
  model name.

Neither backend publishes a stock page yet. This file is the proposed contract, and the stock tool already records
every field.

## Elements
| # | Element | Fields (units) | Freshness | Publisher |
|---|---|---|---|---|
| 1 | Header | `ticker`, `name`, `exchange`, `sector`, F&O (India: has NSE derivatives), followed by our tools | daily | stock tool (`company_meta`); NSE |
| 2 | Price | `quote.close`, `chg`, `chg_pct`, `date`; `quote.check` (`at`, `price`, `chg_pct`) when a price check of today's session exists | close; each price check | stock tool (`prices`, `intraday_checks`) |
| 2 | Results soon | `stats.days_to_results` (shown within 14 days) | daily | stock tool (`features`) |
| 2 | Your paper position | `held.qty`, `held.avg`; P&L at the last price (Paper) | on each trade | dashboard (Manual paper account, planned) |
| 2 | Our tools today (one grey line) | N+1: strategies buying (sum of `families[].votes[0].buy`) of all strategies (`families[].n`), the model's chance `tools.horizons[0].prob` marked "not proven", the AI team's `decision_1d`; grey until the evidence is proven (owner, 13 Oct 2026) | before the open | stock tool (`strategy_predictions`, `model_scores`, `agent_reasoning`) |
| 2 | Buy / Sell | the shell's order window; grey with the reason while the market is closed | n/a | dashboard |
| 3 | Price chart | `chart.dates`, `close` (two years), `bench` (NIFTY 50 / S&P 500 fund), `sector` (India: the NSE sector index of the stock's Nifty 500 industry, `name`, `close`, `from`; one year, from the markets page's NSE index file); periods 5D, 1M, 3M, 6M, 1Y, 2Y; compare from 100; crosshair (date, price, comparisons); drag or pinch to zoom, double-click to reset; the model's fan `tools.horizons[].lo50/hi50/lo80/hi80` for N+1..N+5 past the last close; paper buys `trades[].entry_date`, `entry` | daily | stock tool (`prices`, `ranges`, `trade_checks`); NSE (`ind_close_all`) |
| 4 | Key numbers, explained ("Where the stock stands today. Not a forecast.") | 52-week high and low (ours) as a range bar with today's position; `stats.rsi` (14) as a dial marking 30 and 70; `risk.beta` (1 year), `risk.vol` and `risk.bench_vol` (one year's annualised volatility of the stock and its index, ours) as bars; `valuation.pe` with `eps_ttm`; `atr_pct`; `vol_avg20`; delivery % (India) or days to results (US) | daily; on each filing | stock tool (`features`, `prices`, `financials` / `fundamentals`, `delivery`); computed by us |
| 5 | Results | `results.quarters[]` and `results.years[]`: `end`, `revenue`, `profit` (net), `margin` (ours), `rev_yoy`, `profit_yoy` (ours: against the same period a year earlier), India also `pbt` (profit before tax) and `owners` (profit to owners); bars of revenue and net profit with the net-margin line; Quarters / Years toggle; debt, cash flow and a 3-year history "not recorded yet" | on each filing | stock tool (`financials` from NSE XBRL; `fundamentals` from SEC: revenue, net income) |
| 6 | The model's view, shared by all strategies | per horizon N+1..N+5: `target_date`, `prob`, `peers` (over every tracked company that day: `lo`, `hi`, `common`, `common_n`, `same`, `n`, calibration `slope`; shown as "all 20: 47.0%–47.3% · not proven"), `lo50`, `hi50`, `lo80`, `hi80` labelled "Model's expected range (shared by all strategies)" | before the open | stock tool (`model_scores` of every company, `model_versions` `platt_slope`, `ranges`) |
| 6 | How each family decides | `families[]`: `family` (rule, hybrid, ai, baseline), `n` (its strategies), `thinks` (one line), `votes[]` per horizon (`buy` of `of`) as small stacked bars; "out" where a strategy recorded no view; hybrid "none built yet" | before the open | stock tool (`strategy_predictions`) |
| 7 | The AI team's reading | `verdict`, `bull_case`, `bear_case`, `decision_1d`, `decision_5d`, `made_at`, quoted as recorded | before the open | stock tool (`agent_reasoning`) |
| 8 | Costs | `round_trip_pct` (market charges of a buy and sell of `amount`), `your_pct` (with your broker's) | per session | stock tool (`cost_views`) |
| 9 | Strategies holding the stock now (k of n) | `holders.holding` of `holders.of`; per strategy and buy date: `name`, `family`, horizons, `entry_date`, `entry`, `ret`, paper result = `amount` × `ret` per exit (Paper) as a bar | each price check | stock tool (`trade_checks`; `amount` from `strategy_predictions`) |
| 9 | Which family is winning here | "No settled trades yet"; one line per family for this stock once trades settle; a link to the strategies scoreboard (the comparison across stocks lives there) | on each settlement | stock tool (`cost_views.net_pnl_market`) |
| 10 | News | `title`, `outlets`, `n`, `status` (confirmed, corroborated, single source, unverified, rumour, promotional, not checked), `last`; claims (`claim_type`, `subject`, `predicate`) | each news run | stock tool (`news_clusters`, `news_verified`, `news`, `news_claims`) |
| 11 | Results (estimates) | `corporate.results[]`: `date`, `estimate`, `reported`, `surprise_pct`; the next date and estimate | daily | stock tool (`earnings_estimates`, Yahoo Finance) |
| 12 | Filings (India) | promoter `pledged_pct_of_promoter`, `sdd_promoter_pct`, `period_end`; block deals (`date`, `client`, `side`, `shares`, `price`); announcements (`published_at`, `category`, `subject`); delivery % for the last sessions | daily | stock tool (NSE: `holdings`, `deals`, `announcements`, `delivery`) |
| 12 | Filings (US) | insider Form 4 (`filing_date`, `insider_name`, `role`, `shares`); short interest (`short_interest`, `change_pct`, `days_to_cover`, `settlement_date`); top five 13F holders (`name`, `period`, `shares`, `value_usd`) | on each filing | stock tool (SEC, FINRA) |
| 13 | F&O (India only; market data, not your position) | `expiries[]` (the 3 listed monthly futures: `expiry`, `fut`, `chg_pct`, `oi`, `oi_chg_pct`, `buildup`); `lot`, `pcr`, `move_pct`; `history.fut` with `history.oi` (all futures' OI, three months) as a line over bars; `iv` in its 3-month range `iv_lo`..`iv_hi` as a gauge; your own paper F&O (the Manual account's `open_structures`) on its own line | daily | NSE F&O files (`fetch_fno.py`: `source/fno_expiries.csv`; the screener's `fno.csv.gz`), computed the F&O tool's way |
| 14 | Source chips | the stock tool's records; the NSE F&O close; "computed: ours"; "not live" | n/a | dashboard |

## Findings
- **No strategy trade on RELIANCE or NVDA has settled yet** in the records (`cost_views.net_pnl_market` is empty for
  both). The page says so instead of showing a record. A per-stock record appears once trades settle.
- **NVDA's 2023 quarterly EPS appears twice** in `fundamentals`, before and after the 10-for-1 split (for example 3.71
  and 0.37). The page takes the adjusted value.
- **Many NVDA news items are "not checked yet"**, mostly 13F-filing notices from MarketBeat-style sites. The status is
  shown as recorded.

## Honesty note on the model's chance (13 Oct 2026, orchestrator's request)

On 12 Oct the model gave every tracked company nearly the same chance: India 46.5%–47.3% over all horizons, with 16 of 20 at
exactly 47.1% for N+1; US 51.6%–54.9%, with 19 of 20 at 53.0% for N+2. Root cause, from the stock tool's own records:
the model versions in use (`logit-v1`, trained to 1 Oct) have a calibration slope (`platt_slope`) of 0 for India N+1, N+3,
N+4 and N+5 and US N+2, so calibration flattens every chart and price signal and only the base rate and news move the number.
The other slopes are small (0.05 to 0.18). The model has no settled track record (the range calibration shows `n_live` 0).
The page therefore shows the range over all companies under each chance, marked "not proven". RELIANCE is not in the
identical group (47.3% vs 47.1%), so "same for N of 20" would have been misleading for this company; the range is honest.

## Data gaps (for the stock tool, later)
Shown on the page as "not recorded yet":
- **Debt and the balance sheet:** not in the stock tool's `financials` (NSE) or the copied SEC concepts.
- **Cash flow:** not recorded.
- **A three-year history of results:** the records hold 6 quarters and 2 years (India) and 8 quarters and 3 years (US).
- **Settled strategy trades on this stock:** none has closed yet, so there is no per-stock record.
- **Hybrid strategies:** none built yet (0 in `strategy_predictions`).
- **India: the sector index before 6 Oct 2025.** The markets page records one year, so the 2Y comparison shows the
  sector line for the last year only.
- **US: a sector fund to compare with.** The stock tool records only the S&P 500 fund (SPY) next to NVDA.
- **US: profit before tax and profit to owners.** These are not among the SEC concepts the fetch copies.
