# 32-option-chain: data contract (what every element needs)

**Status: for the owner's review** (13 Oct 2026). Not signed off.

**Data source: real NSE data, not examples.** `source/nifty_fo.csv.gz` holds the NIFTY rows of NSE's daily F&O file
(UDiFF bhavcopy, `BhavCopy_NSE_FO_0_0_0_<YYYYMMDD>_F_0000.csv.zip`) for every trading day from 1 Jun to 12 Oct 2026
(93 days; holidays 26 Jun, 14 Sep, 2 Oct have no file). It keeps the contracts expiring 13 Oct to 31 Dec 2026 with
strikes within 10% of the 12 Oct close. `source/index.csv` holds NIFTY 50 and India VIX from NSE's daily index file
(`ind_close_all_<DDMMYYYY>.csv`). `fetch_nse.py` made both (run by hand; the build never fetches).
`_platform/chain_data.py` composes `data.json` from them. The F&O tool (`exepex/trading`) reads the same NSE files
(docs/DATA_SOURCES.md).

**The page's day is Mon 12 Oct 2026**, the latest NSE file. The other mockups use the stock catalogue's 7 Oct. The
page moves the shell's clock, NIFTY and India VIX to 12 Oct, so the market chip reads "Closed, opens Tue 13 Oct 09:15".

**What does not exist yet, and how the page says so:**
- **Bid and ask.** The F&O tool's 3 pm recording (story A4) covers the nearest two monthly expiries, strikes within 5%
  of spot. It started on 13 Oct 2026 and is not published. The page says "Bid and ask: not published yet". Buy and
  Sell stay grey with that reason, even in market hours.
- **No chain read model.** The F&O tool publishes no chain rows: its P1 pages are today, positions, risk, scoreboards,
  forecasts, ledgers, judge, evidence and health. This file is the proposed contract. The F&O tool needs a publishing
  story for it (its docs/DESK_DECISIONS.md already says screener, option-chain and market-overview publishing are
  added after PLATFORM_DESIGN.md is approved).
- **Margin** for selling. No margin source is recorded, so the page says so.

| # | Element | Fields (units) | Freshness | Publisher |
|---|---|---|---|---|
| 1 | Header | underlying `sym`; `lot` (NSE `NewBrdLotQty`, 65); the day's date | daily, after the NSE file | F&O tool (new chain page) |
| 2 | NIFTY card | `spot` (`UndrlygPric`), `chg`, `chg_pct`; daily closes `history.nifty` for 5D, 1M, 3M | daily | F&O tool (NSE index file) |
| 3 | Range priced in | per expiry `stats.straddle` (ATM call close + ATM put close, ₹ points), `stats.range` [spot − straddle, spot + straddle], `days` | daily | F&O tool (computed, `straddle_expected_move`) |
| 4 | Where traders hold positions | `stats.call_wall` (strike ≥ spot with the most call OI), `stats.put_wall` (strike ≤ spot, most put OI), `stats.call_add`, `stats.put_add` (most OI added today, same sides), `stats.max_pain` | daily | F&O tool (from NSE OI; `max_pain`) |
| 5 | Mood and fear | `stats.pcr` (put OI ÷ call OI of the expiry, strikes in the file); `history.pcr[expiry]` (daily); `vix` and `history.vix` (3-month middle = median of the last 63 closes) | daily | F&O tool (`put_call_ratio`; NSE index file) |
| 6 | Source chips | `source.eod`, `source.index`, `source.as_of`; `quotes.status` and `quotes.text`; `computed.iv`, `computed.chance`; `books` (F&O books' state) | daily | F&O tool |
| 7 | Expiry chips | per expiry `expiry` (date), `monthly` (last expiry of its month), `days` (calendar days from the day) | daily | F&O tool |
| 8 | Chain, Simple | per strike and side: `oi` (units), `close` × `lot` (₹ a lot), `close`, `chg_pct`; `stats.atm` (strike nearest spot, a tie to the lower) | daily | F&O tool (NSE `OpnIntrst`, `ClsPric`, `PrvsClsgPric`) |
| 8 | Chain, Detailed | adds `oi_chg` (NSE `ChngInOpnIntrst`), `volume` (NSE `TtlTradgVol`, units; 0 = "no trade"), `iv` (%, ours) | daily | F&O tool |
| 8 | Chain, Greeks | `greeks.delta`, `gamma`, `theta` (₹ a day), `vega` (₹ per IV point), `iv`. Blank when the contract did not trade | daily | F&O tool (`bs_greeks`) |
| 8 | Strikes | 21 nearest the money; within 5% (the 3 pm band); all in the file (within 10%) | n/a | n/a |
| 9 | Combination tray | per leg `code`, side, `close`; net ₹ a lot = Σ(sell close − buy close) × lot. At closes, not quotes; the builder (33) prices it on quotes once they exist | n/a | dashboard |
| 10 | Open interest chart | the 21 strikes' `oi` (Open now) or `oi_chg` (Added today), calls and puts | daily | F&O tool |
| 11 | IV chart | the 21 strikes' call and put `iv` | daily | F&O tool (computed) |
| 12 | Contract view | `code` (NSE symbol: `NIFTY26OCT22400CE` monthly, `NIFTY26O1322400CE` weekly), `close`, `chg_pct`, cost a lot, `breakeven` (strike ± close), `chance` (risk-neutral chance NIFTY ends past the break-even, from the contract's own IV), `oi`, `oi_chg`, `volume`, `iv`, `greeks` | daily | F&O tool (computed) |
| 12 | Contract history | `history.contracts[code]`: `from` (index into `history.dates`), daily `close` (null on days without trades) and `oi`; 5D, 1M, 3M, Life. In this mockup, kept for the 21 strikes nearest the money of each expiry | daily | F&O tool (A3 panel: `date, expiry, strike, type, close, settle, volume, open_interest, underlying`) |
| 13 | Buy / Sell | grey with the reason: market closed (`market_status`), or no bid and ask (`quotes.status`) | 3 pm, from the A4 recording | F&O tool |

**Computed the F&O tool's way** (fno/analytics.py, story B1). IV uses Black-Scholes on the day's close, only when the
contract traded. The rate is 6.5%, there is no dividend, and time is calendar days to expiry / 365. A bisection runs
between 1% and 200%, and a failure gives no value. The Greeks come from the same model. The chance is the risk-neutral
N(d2) at the break-even, labelled "not a forecast".

**Finding for the F&O tool (some evidence).** The 12 Oct ATM call and put IVs differ by about 2 points: 13.4% against
15.6% at 22,300. The method prices from spot with a 6.5% rate and no dividend, but the 27 Oct future (22,386.50 against
22,363.35 spot) implies a carry of only about 2.5% a year. Pricing from the future price (Black-76) would bring the
call and put IVs together. A retail user who sees different call and put IVs at one strike may be confused. Worth a
decision in `exepex/trading` story B1.

**Weekly expiries** are shown because NSE lists them (13 Oct, 19 Oct, 3 Nov, 9 Nov). They are marked weekly, are end of
day only, and the F&O tool does not trade them. The owner chose this on 13 Oct 2026. Long-dated expiries (2027 and
later) are not in the extract.
