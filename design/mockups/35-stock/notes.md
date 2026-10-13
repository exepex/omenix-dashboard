# 35-stock: data contract (what every element needs)

**Status: for the owner's review** (13 Oct 2026). Not signed off.

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
- **F&O (India):** NSE's daily F&O files through the screener's source (`33-screener/source/fno.csv.gz`).
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
| 2 | Buy / Sell | the shell's order window; grey with the reason while the market is closed | n/a | dashboard |
| 3 | Price chart | `chart.dates`, `close` (two years), `bench` (the benchmark's closes); periods 1M, 3M, 6M, 1Y, 2Y; compare from 100 | daily | stock tool (`prices`) |
| 4 | Key figures, in words | 52-week high and low (ours); `valuation.pe` (close ÷ the sum of the last four quarters' diluted EPS) with `eps_ttm` and `eps_to`; `stats.rsi` (14), `beta` (1 year), `atr_pct` (14-day range), `vol_avg20`; delivery % (India) or days to results (US) | daily; on each filing | stock tool (`features`, `financials` / `fundamentals`, `delivery`); computed by us |
| 5 | The last quarters | `quarters[]`: `end`, `revenue`, `profit` (India), `eps` (diluted). US fourth quarter = the year minus nine months | on each filing | stock tool (`financials` from NSE XBRL; `fundamentals` from SEC) |
| 6 | What our tools think | per horizon N+1..N+5: `target_date`, `prob` (the model's chance of a rise), `buy` of `of` strategies and by family (rule-based, AI team, baselines), `lo50`, `hi50`, `lo80`, `hi80` (expected range); the session and when it was made | before the open | stock tool (`strategy_predictions`, `model_scores`, `ranges`) |
| 7 | The AI team's reading | `verdict`, `bull_case`, `bear_case`, `decision_1d`, `decision_5d`, `made_at`, quoted as recorded | before the open | stock tool (`agent_reasoning`) |
| 8 | Costs | `round_trip_pct` (market charges of a buy and sell of `amount`), `your_pct` (with your broker's) | per session | stock tool (`cost_views`) |
| 9 | Open paper trades | per strategy and buy date: `name`, `family`, horizons, `entry_date`, exits, `entry`, `last`, `ret`, `band` (inside 50% / 80% of the expected range); the record on this stock once trades settle | each price check | stock tool (`trade_checks`; settled: `cost_views.net_pnl_market`) |
| 10 | News | `title`, `outlets`, `n`, `status` (confirmed, corroborated, single source, unverified, rumour, promotional, not checked), `last`; claims (`claim_type`, `subject`, `predicate`) | each news run | stock tool (`news_clusters`, `news_verified`, `news`, `news_claims`) |
| 11 | Results | `results[]`: `date`, `estimate`, `reported`, `surprise_pct`; the next date and estimate | daily | stock tool (`earnings_estimates`, Yahoo Finance) |
| 12 | Filings (India) | promoter `pledged_pct_of_promoter`, `sdd_promoter_pct`, `period_end`; block deals (`date`, `client`, `side`, `shares`, `price`); announcements (`published_at`, `category`, `subject`); delivery % for the last sessions | daily | stock tool (NSE: `holdings`, `deals`, `announcements`, `delivery`) |
| 12 | Filings (US) | insider Form 4 (`filing_date`, `insider_name`, `role`, `shares`); short interest (`short_interest`, `change_pct`, `days_to_cover`, `settlement_date`); top five 13F holders (`name`, `period`, `shares`, `value_usd`) | on each filing | stock tool (SEC, FINRA) |
| 13 | F&O (India only) | `fut`, `fut_chg_pct`, `expiry`, `lot`, `oi`, `oi_chg_pct`, `buildup`, `iv` with `iv_lo` and `iv_hi` (3 months, 7+ days to expiry), `pcr`, `move_pct`; history of `fut` and `iv` (three months) | daily | NSE F&O files (computed the F&O tool's way) |
| 14 | Source chips | the stock tool's records; the NSE F&O close; "computed: ours"; "not live" | n/a | dashboard |

## Findings
- **No strategy trade on RELIANCE or NVDA has settled yet** in the records (`cost_views.net_pnl_market` is empty for
  both). The page says so instead of showing a record. A per-stock record appears once trades settle.
- **NVDA's 2023 quarterly EPS appears twice** in `fundamentals`, before and after the 10-for-1 split (for example 3.71
  and 0.37). The page takes the adjusted value.
- **Many NVDA news items are "not checked yet"**, mostly 13F-filing notices from MarketBeat-style sites. The status is
  shown as recorded.
