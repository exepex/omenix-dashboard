# 33-screener: data contract (what every element needs)

**Status: for the owner's review** (13 Oct 2026). Not signed off.

## Data: real, not examples
- **India stocks**: NSE's own daily files. `source/equity.csv` has one row per stock that traded on Mon 12 Oct 2026
  (2,924, EQ and BE series). It is reduced from a year of NSE's daily equity file
  (`BhavCopy_NSE_CM_0_0_0_<YYYYMMDD>_F_0000.csv.zip`, 251 sessions). `source/delivery.csv` comes from NSE's
  security-wise file (`sec_bhavdata_full_<DDMMYYYY>.csv`). `source/names.csv` comes from `EQUITY_L.csv` (names) and
  `ind_nifty500list.csv` (industries; only Nifty 500 stocks have one in NSE's files). Made by `fetch_nse.py`.
- **India F&O**: `source/fno.csv.gz` has every F&O underlying (219: 213 stocks, 6 indices) for 66 sessions,
  9 Jul to 12 Oct 2026. It holds the nearest monthly expiry's future and the at-the-money call and put, from NSE's
  daily F&O file. Made by `fetch_nse.py`.
- **The tools' view** (20 companies per market): `source/tracked.json`, copied by `fetch_tracked.py` from the stock
  tool's own published records (`contactexepex/agentic-stock-prediction` `data/<market>/`, read only):
  - strategy views for the 12 Oct session, made before the open (N+5);
  - model chances;
  - features (RSI 14, beta, days to results);
  - results dates;
  - in the US, short interest and one year of the stock tool's daily prices.
  AI model names never leave the fetch: strategies are counted by family.
- **US**: only the stock tool's 20 companies. There is no free whole-market US file (owner's choice, 13 Oct 2026).
- The page's day is Mon 12 Oct 2026 (after both closes). The shell's clock, the next price check and the followed
  companies' prices move to it.

Neither backend publishes screener rows yet. This file is the proposed contract:
- **India stocks and F&O**: one daily publication from the F&O tool, or from a shared NSE ingest (`platform/`, later).
- **The tools' columns**: the stock tool.
`exepex/trading` docs/DESK_DECISIONS.md already lists "F&O screener rows need a new publishing story".

## Elements
| # | Element | Fields (units) | Freshness | Publisher |
|---|---|---|---|---|
| 1 | Header | the day; market | daily | dashboard |
| 2 | Tabs | Stocks (count), F&O (count; India only, absent in the US) | daily | dashboard |
| 3 | Today: up and down | count of stocks with `d1` > 0, < 0, = 0 in the chosen universe | daily | NSE ingest |
| 3 | Near 52-week high / low, Volume 3× usual | counts of the screens below | daily | NSE ingest |
| 4 | Ready-made screens (chips with counts) | near 52-week high: `p` ≥ 0.98 × `h`; near low: `p` ≤ 1.02 × `l`; big moves: abs(`d1`) ≥ 5%; volume 3× usual: `v` ≥ 3 × `va` and `va` ≥ 50,000; up / down 10%+ in a month: `m1`; high delivery: `dl` ≥ 70% and `va` ≥ 1,00,000; RSI under 30: `r`; our strategies 3+ buy: `strategies.buy`; results within 7 days: `days_to_results` | daily | NSE ingest; stock tool |
| 5 | Which stocks | `u`: `n500` (Nifty 500 list), `fno` (has F&O), `ours` (followed by the stock tool) | daily | NSE ingest; stock tool |
| 5 | Change over | `d1`, `w1`, `m1`, `m3`, `y1`: % change on the close 1, 5, 21, 63 and 250 sessions back (null when listed later) | daily | NSE ingest |
| 6 | Your filters | price from and to (`p`); change in the chosen period at least; volume × usual at least (`v` ÷ `va`); delivery at least (`dl`, India); RSI at most (`r`) | n/a | dashboard |
| 7 | Results table | `s` symbol, `n` name, `g` industry (Nifty 500 only), `p` close, the chosen period's change, 52-week position (`p` − `l`) ÷ (`h` − `l`) with `h` and `l` the 52-week high and low, `v` volume and `va` its 20-day average, `dl` delivery %, `r` RSI 14 (Wilder, over the year's closes), the tools' view | daily | NSE ingest (computed) |
| 7 | Our tools (followed companies) | `strategies.buy` of `strategies.of` (and by family: rule-based, AI team, baselines) for the next 5 sessions; `prob_up` (the model's chance of a rise); `days_to_results`. "No view today" when the stock tool recorded none | before the open | stock tool (`strategy_predictions`, `model_scores`, `features`) |
| 7 | Buy / Sell | followed companies: the shell's order window (the stock tool's next price check). Others: grey, with "our tools do not follow it: no price checks to fill a paper order" | n/a | dashboard |
| 8 | Sort | value traded (`p` × `v`, the default), or any column; ascending and descending | n/a | dashboard |
| 9 | F&O: build-up tiles | count per `b`: long build-up (future up, OI up), short build-up (down, up), short covering (up, down), long unwinding (down, down) | daily | NSE ingest (computed) |
| 10 | F&O screens | the four build-ups; IV near its 3-month high (`ivr` ≥ 80) or low (`ivr` ≤ 20); open interest up 5%+ (`oc`); indices (`kind`) | daily | NSE ingest |
| 11 | F&O table | `s`, `n`, `kind`; `fut` (nearest monthly future's close) and `fc` (% change); `oc` (futures OI change %) and `oi` (units); `b`; `iv` (ATM IV %, ours) with `ivl`, `ivh` (3-month low and high, counting only days with 7+ days to expiry) and `ivr` (its position, %); `pcr` (put OI ÷ call OI, nearest monthly); `mv` (ATM call + put closes ÷ price, %) by `x` (expiry); `lot` | daily | NSE ingest (computed the F&O tool's way) |
| 11 | Chain | NIFTY: the option chain (32); other underlyings: the same page, later | n/a | dashboard |
| 12 | Source chips | the files and the day; "computed: ours"; "our tools: followed companies only"; "not live" | daily | dashboard |

## Findings for the backends (from these real records)
- **Stock tool (strong evidence).** On 12 Oct the model gives every India company the same N+5 chance of a rise
  (0.4659). The `model_scores` records show every feature contribution as zero, so the model has fallen back to its
  base rate. The screener shows the number as recorded; the stock tool should find out why.
- **Stock tool (strong evidence).** US `options` records from yfinance carry impossible IVs, for example JPM ATM IV
  0.0156 (1.6%) on 12 Oct. They are not used here.
- **Stock tool (some evidence).** `financials` hold 2 quarters for 7 of 20 India companies, so no P/E can be computed.
  Valuation (P/E, market cap) is therefore absent from the screener, not shown as blank columns.
- JPM has no strategy view for 12 Oct (results due), and the page says "No view today".
