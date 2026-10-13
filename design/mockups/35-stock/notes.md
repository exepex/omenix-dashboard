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
| 3 | Price chart | `chart.dates`, `close` (two years), `bench` (NIFTY 50 / S&P 500 fund), `sector` (India: the NSE sector index of the stock's Nifty 500 industry, `name`, `close`, `from`; one year, from the markets page's NSE index file); periods 5D, 1M, 3M, 6M, 1Y, 2Y; compare from 100; crosshair (date, price, comparisons); drag or pinch to zoom, double-click to reset; the forecast fan `tools.horizons[].lo50/hi50/lo80/hi80` and `mid` (the range's centre, `base_close × e^center`) for N+1..N+5 past the last close, with the N+5 high, middle and low written on it and every day's numbers on hover; the forecast in one plain line under the chart; buy and sell marks only from a proven family (today none; the labelled example `example_marks`: `family`, `proof`, `marks[]` with `buy`, `buy_at`, `sell`, `sell_at`, `ret`); paper buys `trades[].entry_date`, `entry` | daily | stock tool (`prices`, `ranges`, `trade_checks`); NSE (`ind_close_all`) |
| 4 | Key numbers, explained ("Where the stock stands today. Not a forecast.") | 52-week high and low (ours) as a range bar coloured low (red) / middle / high (green), with today's position and a word ("near the year's low"); `stats.rsi` (14) as a dial, 30–70 green (normal), below 30 and above 70 red (fast move), with a word; `risk.vol` against `risk.bench_vol` (one year's annualised volatility, ours) as bars, coloured calmer (green) / about the same / more jumpy (red) than the index; `risk.beta` in words; `valuation.pe` with `eps_ttm`; `atr_pct`; `vol_avg20`; delivery % (India) or days to results (US). Colours describe today, never a verdict, and always come with a glyph and a word | daily; on each filing | stock tool (`features`, `prices`, `financials` / `fundamentals`, `delivery`); computed by us |
| 5 | Results (overview) and Financials in detail (Results tab) | `results.quarters[]` and `results.years[]`: `end`, `revenue`, `profit` (net), `margin` (ours), `rev_yoy`, `profit_yoy` (ours), India also `pbt` and `owners`; `quarters[].eps`. Detail: one small chart per measure with a one-line takeaway: revenue, net profit, growth from a year earlier (revenue and profit), margins (net; India also pre-tax), earnings per share; debt and cash flow keep their frames, "not recorded yet"; Quarters / Years | on each filing | stock tool (`financials` from NSE XBRL; `fundamentals` from SEC) |
| 6 | Our price forecast for the next five sessions | per horizon N+1..N+5: `target_date`, `prob` (chance up, as a bar with 50% marked, "not proven"), `lo50`, `hi50`, `lo80`, `hi80` (where the price may end, 1 in 2 and 4 in 5); `peers` (`lo`, `hi`, `n`) for "it gives almost every company the same chance". Explained in plain words: where it comes from (our forecast model, the same for every family), how to read it, what it means today | before the open | stock tool (`model_scores` of every company, `ranges`) |
| 6 | Which of our strategies buy | `families[]`: `family` (rule, hybrid, ai, baseline), `n`, `votes[]` per horizon (`buy` of `of`) as small stacked bars; "out" where a strategy recorded no view; hybrid "none built yet". How a family decides is never shown or sent (owner, 13 Oct 2026) | before the open | stock tool (`strategy_predictions`) |
| 7 | What the AI team thinks | `decision_1d`, `decision_5d` (shown as "Stays out" / buy / sell), `made_at`; a plain summary `ai_plain.summary`, `up[]`, `down[]` (**not recorded yet**: example wording written for this mockup, labelled); the recorded `verdict`, `bull_case`, `bear_case` behind "Read the full reasoning" | before the open | stock tool (`agent_reasoning`; a beginner summary is a data gap) |
| 8 | Costs | `round_trip_pct` (market charges of a buy and sell of `amount`), `your_pct` (with your broker's) | per session | stock tool (`cost_views`) |
| 9 | Strategies holding the stock now (k of n) | `holders.holding` of `holders.of`; one row per family ("not holding", "none built yet", or its trades: `name`, `entry_date`, `entry`, horizons, paper result = `amount` × `ret` per exit, as a bar, Paper) | each price check | stock tool (`trade_checks`; `amount` from `strategy_predictions`) |
| 9 | Which family is winning here | today: "No settled trades yet". Once trades settle, per family: `settled`, `wins`, `pnl` (paper, this stock), as win share and a bar, with a one-line verdict against the baselines. Shown now as labelled examples `examples.win` and `examples.lose`, each family with totals and `by_h` per exit (N+1, N+3, N+5); a link to the strategies scoreboard | on each settlement | stock tool (`cost_views.net_pnl_market` per family and stock) |
| 10 | News | `title`, `outlets`, `n`, `status` (confirmed, corroborated, single source, unverified, rumour, promotional, not checked), `last`; claims (`claim_type`, `subject`, `predicate`) | each news run | stock tool (`news_clusters`, `news_verified`, `news`, `news_claims`) |
| 11 | Results (estimates) | `corporate.results[]`: `date`, `estimate`, `reported`, `surprise_pct`; the next date and estimate | daily | stock tool (`earnings_estimates`, Yahoo Finance) |
| 12 | Filings (India) | promoter `pledged_pct_of_promoter`, `sdd_promoter_pct`, `period_end`; block deals (`date`, `client`, `side`, `shares`, `price`); announcements (`published_at`, `category`, `subject`); delivery % for the last sessions | daily | stock tool (NSE: `holdings`, `deals`, `announcements`, `delivery`) |
| 12 | Filings (US) | insider Form 4 (`filing_date`, `insider_name`, `role`, `shares`); short interest (`short_interest`, `change_pct`, `days_to_cover`, `settlement_date`); top five 13F holders (`name`, `period`, `shares`, `value_usd`) | on each filing | stock tool (SEC, FINRA) |
| 13 | F&O (India only; market data, not your position) | three things to know (future, call and put, codes); what each family suggests: per F&O book `family`, `side`, `code`, `lots`, `lot`, `price`, `max_loss`, `why`, `state` (suggested / refused by your limit / stays out) — today none (no F&O strategy has passed testing), shown as the labelled example `fno.examples.picks`; contracts per expiry: the future (`expiries[]`: `code`, `fut`, `chg_pct`, `oi`, `oi_chg_pct`, `buildup`) and the option chain within 50 of the price (`chain[].rows[]`: `strike`, `ce` / `pe` with `code`, `price`, `chg_pct`, `oi`, `oi_chg`, `contracts`, `traded`, `iv`), Buy / Sell on every contract (end-of-day prices: the order window explains it cannot fill); what buying one lot of the picked call or put makes or loses at expiry (ours); where traders hold contracts (`chain[].rows` OI by strike, `most_calls`, `most_puts`); how big a move options expect (`iv` in `iv_lo`..`iv_hi`, `move_pct`); the last three months (`history.fut`, `history.oi`, `buildup`) with a plain reading; your own paper F&O | daily | NSE F&O files (`fetch_fno.py`: `source/fno_expiries.csv`, `source/fno_options.csv`; the screener's `fno.csv.gz`), computed the F&O tool's way |
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
- **A plain summary of the AI team's view for beginners** (`ai_plain`): the page shows example wording written by hand.
- **F&O suggestions per family on this stock:** none until an F&O book's strategy passes testing; the page shows a
  labelled example.
- **Stock options' and futures' intraday quotes and the futures margin:** only NSE's end-of-day file is recorded, so
  Buy / Sell on a stock contract cannot fill (the F&O tool records NIFTY's 3 pm snapshot only).
