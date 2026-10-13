# Response 5: findings in the stock tool's published records (for the owner to pass to the stock tool's sessions)

Found while building the screener (33) and the market overview (34) from real data, 13 Oct 2026. The repository
`contactexepex/agentic-stock-prediction` is read-only for this one; nothing there was changed. All evidence comes from
its `main` at commit `5ed8da0` (12 Oct 2026 22:35 UTC). Paths are relative to that repository. Each finding is marked
strong evidence, some evidence or reasoning only.

## 1. The India model's N+5 chance is the same for almost every company: its features contribute nothing (strong evidence)
- **File:** `data/india/model_scores/2026/10/2026-10-12.jsonl`, the 20 rows with `as_of_date` 2026-10-12 and
  `horizon_days` 5.
- **Values:**
  - `prob_up` is 0.4659 for 15 of 20 companies. The other five are 0.4658, 0.4649, 0.4672, 0.4669 and 0.4660.
  - `base_rate` is 0.4866 in every row.
  - In `contributions.logit_items` the only non-zero items are `baseline` (−0.0829 in every row) and, in 6 rows,
    `news`. Every other item is exactly 0.0: `ret_1d`, `ret_5d`, `ret_20d`, `rsi_14`, `ema_ratio`, `atr_pct`,
    `realized_vol_10d`, `volume_ratio_20d`, `beta_1y`, `rel_sector_5d`, `bench_ret_5d`, the regime items and the rest.
- **The same on 9 Oct:** 29 rows with `as_of_date` 2026-10-09; 20 of them are 0.4659; non-zero items are `baseline`
  (29) and `news` (9).
- **Meaning:** the price and technical features carry no weight, so the "model's chance" is a constant plus news. The
  N+5 strategies built on it (`data/india/strategy_predictions/2026/10/2026-10-12.jsonl`, `model_prob`) inherit
  that.
- **To check in the stock tool:** whether the trained weights are zero (a training or loading failure), or whether the
  features reach the scorer as zeros.
- **Correction to my own earlier wording** (33-screener notes, 13 Oct): I wrote "all feature contributions zero". To
  be exact, the constant term is not zero and news moves six rows. The conclusion stands.

## 2. Impossible US implied volatilities from yfinance (strong evidence)
- **File:** `data/us/options/2026/10/2026-10-12.jsonl` (78 rows; `source` "yfinance"; `atm_iv`, `call_iv`, `put_iv`
  are fractions).
- **Values:**
  - JPM: `atm_iv` 0.015635 (1.6%) for the expiries 2026-10-16, 2026-10-23 and 2026-11-06, while its own `straddle_pct`
    is 0.0357 to 0.0585 (a 3.6–5.9% move priced in, which needs an IV near 20–30%).
  - NVDA: `atm_iv` 0.03126 and 0.039886 (3–4%).
  - The same file also holds values up to 2.24 (224%).
- **Meaning:** these IVs cannot be used; the straddle prices in the same rows are the usable figure.
- **To check in the stock tool:** yfinance's `impliedVolatility` field is unreliable for stale or zero-bid options.
  Computing IV from the straddle or the mid price, or rejecting values below a floor, would avoid this.
- The dashboard does not use these values.

## 3. Financials: complete enough for a trailing P/E for 15 of 20 India companies, not 7 (correction of my own claim)
- **What I wrote earlier (33-screener notes, 13 Oct):** "financials hold 2 quarters for 7 of 20 India companies, so
  no P/E". **This was wrong:** I read only the latest daily file.
- **Files:** `data/india/financials/2026/10/2026-10-0{6,7,8,9}.jsonl` and `2026-10-12.jsonl`, 310 distinct records
  for 20 companies, the latest `period_end` 2026-09-30 (TCS).
- **Consolidated quarterly `eps_diluted`:**
  - four or more consecutive quarters to 2026-06-30 for 15 companies (ADANIPORTS, DRREDDY, HDFCBANK, HDFCLIFE,
    HINDALCO, ICICIBANK, INDIGO, ITC, M&M, MARUTI, ONGC, RELIANCE, SUNPHARMA, TATASTEEL, ULTRACEMCO);
  - TCS to 2026-09-30;
  - only two quarters for HINDUNILVR, INFY and LT;
  - none for SBILIFE.
- **Meaning:** a trailing-twelve-month P/E is possible for the followed companies except four. The screener can show
  it (ours, from consolidated diluted EPS) once the owner wants it.
- **To check in the stock tool:** the missing quarters for HINDUNILVR, INFY, LT and SBILIFE.

## 4. India VIX in the regime record differs from NSE's close (some evidence)
- **File:** `data/india/regime/2026/10/2026-10-12.jsonl`: `vol_level` 14.3575 (`computed_at` 2026-10-12T21:34:34Z).
- **Against:**
  - the stock tool's own `data/india/prices/2026/10/2026-10-12.csv`, INDIAVIX `close` 15.2525;
  - NSE's daily index file `ind_close_all_12102026.csv`, India VIX close 15.25.
  The regime's 14.3575 equals neither; it sits between that day's open (14.375) and low (13.14).
- **Meaning:** the regime may use another price (an average, or a stale or intraday value). If it is meant to be the
  close, the "calm" reading of 12 Oct may be based on the wrong level: `config/markets/india.yaml` has `calm_vol` 14
  and `event_vol` 17. 14.36 is closer to "calm" than 15.25.
- **To check in the stock tool:** how `vol_level` is taken.

## 5. The model gives almost every company the same chance: calibration slope 0 (strong evidence; update 13 Oct 2026)
- **Files:** `data/<market>/model_versions/2026/10/2026-10-07.jsonl` and `2026-10-08.jsonl` (versions
  `<market>-<h>d-…-logit-v1-2026-10-01`, trained to 1 Oct), field `platt_slope`:

  | Horizon | India `platt_slope` (`platt_offset`) | US `platt_slope` (`platt_offset`) |
  |---|---|---|
  | N+1 | **0.0** (-0.1159) | 0.0868 (0.0779) |
  | N+2 | 0.0552 (-0.1118) | **0.0** (0.1203) |
  | N+3 | **0.0** (-0.1285) | 0.0489 (0.1453) |
  | N+4 | **0.0** (-0.1184) | 0.1764 (0.1132) |
  | N+5 | **0.0** (-0.1366) | 0.0990 (0.1654) |

- **Effect, `data/<market>/model_scores/` of 12 Oct (`as_of_date` 2026-10-12, 20 companies each):**
  - India: N+1 13 of 20 at exactly 0.4711, N+3 12 of 20 at 0.4679, N+4 12 of 20 at 0.4704, N+5 13 of 20 at 0.4659.
    All 20 lie within 46.5%–47.3% over every horizon.
  - US: N+2 16 of 20 at 0.5300. At the other horizons the values are spread a little (51.6%–54.9%).
  - The horizons with slope 0 are exactly the ones where most companies share one value.
- **Meaning:** a Platt slope of 0 multiplies the model's score by zero. Every chart and price signal is erased, and
  the chance is the calibration offset plus the news adjustment (the `contributions` show `news` and `baseline` as the
  only non-zero groups). The other slopes are small (0.05–0.18), so even there the signals barely move the chance.
  The dashboard now marks the chance "not proven" and shows the range over all companies (page 35).
- **To check in the stock tool:**
  - why the Platt fit returns slope 0 on 6,100–6,660 rows. Possibly the raw scores carry no information on the
    calibration sample, or a regularisation or clipping in the fit;
  - whether the model should be used before its slope is positive and checked on settled outcomes.
