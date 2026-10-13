# 34-markets: data contract (what every element needs)

**Status: signed off 13 Oct 2026 (owner), as of commit 59b606d.** This is the signed-off API contract for the market
overview (built while the owner was offline, under the orchestrator's exception). Change it only for a very solid
reason, brought to the owner first (through the orchestrator); record each change and its reason in `changes.md` next
to it.

## Data: real, not examples (Mon 12 Oct 2026)
- `source/indices.csv`: NSE's daily index file (`ind_close_all_<DDMMYYYY>.csv`), a year, for 24 indices:
  - broad: Nifty 50, Next 50, 500, Midcap 100, Smallcap 100;
  - India VIX;
  - 18 sector indices.
  Each row has the close, the % change and NSE's own P/E, P/B and dividend yield. Made by `fetch_nse_indices.py`.
- `source/stocktool.json`: the stock tool's own published records, copied read-only by `fetch_stocktool.py` from
  `contactexepex/agentic-stock-prediction`:
  - a year of daily closes of its non-company instruments (world markets, USD/INR, Brent, gold, US 10-year yield,
    dollar index, US VIX, the S&P 500 fund and VIX, US sector funds);
  - FII/FPI and DII cash-market flows (NSE, provisional) and NSDL FPI equity flows;
  - events: results and ex-dividend;
  - its session reading (calm, trending, event-heavy) and major events (for example US CPI);
  - US Treasury par yields.
- The screener's NSE files (`33-screener/source/`, through `screener_data.py`) give breadth, sectors and movers. The
  chain's NSE file (`32-option-chain/source/`, through `chain_data.py`) gives NIFTY's expiries. One reader each, so
  nothing is read twice.
- The page's day is Mon 12 Oct 2026, after both closes (22:30 UTC).

Neither backend publishes these rows yet. This file is the proposed market-overview contract:
- NSE files: a shared NSE ingest (`platform/`, later) or the F&O tool;
- the rest: the stock tool, which already records it.

## Elements
| # | Element | Fields (units) | Freshness | Publisher |
|---|---|---|---|---|
| 1 | Header | the day; the stock tool's `regime` (calm, trending, event-heavy, unstable) and `major_event_names` | daily | stock tool (`regime`) |
| 2 | Change over | `d1`, `w1`, `m1`, `m3`, `y1`: % change on the close 1, 5, 21, 63, 250 sessions back | n/a | dashboard |
| 3 | The main index card | `name`, `close`, the period's change, the closes over the period (chart), `hi52`, `lo52`, `pe`, `pb`, `dy` (NSE's own figures, in words) | daily | NSE index file |
| 4 | Broad indices (US: benchmarks) | per index: `name`, `close`, the period's change, `pe`, the closes (spark); volatility drawn in the neutral colour | daily | NSE index file; stock tool (US) |
| 5 | Is the move broad? | `n`, `up`, `down`, `flat`; `high` and `near_high` (within 2%), `low` and `near_low`; `up_1m`. All NSE or Nifty 500 in India; our 20 companies in the US, where the reading sentence is hidden (too few to read) | daily | NSE equity file (computed) |
| 6 | Which sectors led? | sector indices: `name`, the period's change, `pe`, `hi52`, `lo52`. Nifty 500 industries (ours): `g`, `n`, the equal-weighted average change, `up`, `down`, `best`, `worst`. US: sector funds with `sectors` (our companies' sectors). Tiles shaded by size, always with sign and number | daily | NSE files; stock tool (US) |
| 7 | Who moved most? | gainers, losers, most traded (price × volume): `s`, `n`, `p`, `d1`, value traded (₹ crore / $ million), `v` ÷ `va` (× usual). Nifty 500, or all NSE with usual volume 1,00,000+ and price ₹20+ | daily | NSE equity file |
| 8 | What did big investors do? (India) | per day: FII/FPI and DII `net` (₹ crore, provisional), the period total, NSDL FPI equity net for the last day | next morning | stock tool (`flows`, `fpi`) |
| 9 | How nervous is the market? (India) | India VIX `close`, `d1`, its 3-month middle (median of 63 closes), `lo52`, `hi52`, 63+ closes (chart) | daily | NSE index file |
| 10 | What do index options say? (India) | NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY: `iv` (ATM, ours) and `ivr`, `pcr`, `mv`, `b` (build-up), nearest monthly expiry `x` | daily | NSE F&O file (computed, as on the screener) |
| 10 | What do interest rates say? (US) | Treasury par yields by maturity (`name`, `value` %, `date`); 10-year against 2-year in words | daily | stock tool (`macro`, treasury.gov) |
| 11 | World, currencies, commodities | per instrument: `name`, `close`, the period's change, `as_of` (each at its own market's close) | daily | stock tool (`prices`, Yahoo Finance) |
| 12 | What is coming? | `date`, `type` (results, ex-dividend, F&O expiry, filing, economy), `name`, `ticker`; the 12 nearest | daily | stock tool (`events`, `regime`); NSE F&O file (expiries) |
| 13 | Source chips | one per source with its description; "computed: ours"; "not live" | daily | dashboard |

## Decisions made while the owner was offline (for the morning review)
1. **Real data, the same day as the screener (12 Oct).** It is the latest day all the sources share. Reason: the
   owner's rule of real values only.
2. **Period switch 1D / 1W / 1M / 3M / 1Y**, as the owner chose for the screener, with 1M as the default.
3. **India breadth over all NSE stocks, with Nifty 500 as the second choice.** The US uses the stock tool's 20
   companies and says so.
4. **Movers default to the Nifty 500.** "All NSE" filters out illiquid and penny stocks (usual volume under 1,00,000,
   or price under ₹20), so a one-trade jump cannot top the list.
5. **Index options: only the four that trade** (NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY). NIFTYNXT50's and NIFTYFPI's
   at-the-money closes are stale (no trades), and they showed a meaningless ±11% move.
6. **No SENSEX:** it is BSE's, and these are NSE's files.
7. **World quotes keep their own dates.** Some Yahoo futures and FX quotes are stamped on a Sunday, 11 Oct.

## Findings
- **Stock tool (some evidence):** its regime record says India VIX 14.36, while NSE's file says 15.25 on 12 Oct. It
  may read an intraday value. The page uses NSE's figure.
- **KOSPI and Shanghai:** the stock tool has too few recent closes for some periods, so the page shows "—" there.
