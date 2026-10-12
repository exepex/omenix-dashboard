# 30-shell: data used and where it comes from

**All data is Mock** (`data.json`, `"_mock": true`). There is no backend catalogue for the platform screens yet, so
the payload is hand-kept, consistent with itself, and on a fixed clock (`now` = Mon 12 Oct 2026, 15:40 IST) so every
build gives the same page. The same file feeds the shell of every platform mockup (folders 30-40); each page adds its
own `data.json`.

| Payload key | What | Published by (after the backend stories of PLATFORM_DESIGN.md section 8) |
|---|---|---|
| `sources` | the four price sources and how old each may be before it reads "stale": stock tool run (4 h), NSE end-of-day file (78 h, a weekend), 3 pm option snapshot (26 h), US close (80 h) | dashboard constant, checked against each backend's run schedule |
| `markets.<m>.items` | instruments: stocks, indices, futures, options with `last`, `chg_pct`, `source`, `as_of`; options from the 3 pm snapshot add `bid`, `ask`, `iv` (computed by us); `held` is a paper position | stocks and indices: the stock tool (`contactexepex/agentic-stock-prediction`); futures and options: `exepex/trading` (EOD files, 3 pm NIFTY monthly snapshot) |
| `markets.<m>.indices` | the index strip: NIFTY 50, BANKNIFTY, India VIX (India); S&P 500, Nasdaq Composite, VIX (US) | as items |
| `markets.<m>.watchlists` | 5 named lists of item ids (list 5 empty on purpose: empty state) | the dashboard's own store (owner's lists) |
| `markets.<m>.accounts` | the Manual (paper) account (capital, cash, open structures, amount at risk) and the strategy books, which cannot be traded by hand | Manual: new backend story in both tools; books: `exepex/trading` (F&O) and the stock tool |
| `markets.india.limits` | maximum loss a trade Rs 10,000, 3 open F&O structures, Rs 30,000 at risk | `exepex/trading` C2 limits (owner's) |
| `markets.<m>.charges` | charge rates for the estimate (Mock rates) | C1 charges code (F&O), the stock tool's cost file |
| `short_option_margin_per_lot` | margin estimate of a short NIFTY option (Mock) | the F&O tool's recorded margin source |
| `next_quotes` | when the next valid quotes come (the fill time) | backends' schedules |
| `search_extra` | saved screens, strategies, news in the search index | dashboard (screens), backends (strategies, news) |
| `notifications` | the bell | dashboard alerts and both backends' run events |

Arithmetic kept consistent: Manual India cash ₹4,51,334.77 = ₹5,00,000 − 40 × ₹1,214.60 (RELIANCE fill) − ₹81.23
charges at the Mock rates; Manual US cash $4,025.40 = $6,000 − 6 × $329.10.

## Owner-changeable defaults (open questions of PLATFORM_DESIGN.md, decided here as defaults)

1. **Manual paper account:** starts at **Rs 5 lakh** with the **same limits as the F&O books** (maximum loss Rs 10,000
   a trade, 3 open F&O structures, Rs 30,000 at risk). The US Manual account starts at **$6,000** (roughly the same
   size; my assumption, the design names no US figure). Both are data, not code: change `accounts` and `limits`.
2. **"At risk now"** appears on Home as a small card linking to Risk (31-dashboard), per book, never summed across
   books.

## Honest-frame rules this mockup enforces
- Every price shows its as-of time and source; nothing claims to be live; a value older than its source allows is
  greyed and says "stale" (example: BANKNIFTY 24 Nov 52000 PE, EOD 8 Oct).
- No market depth: only best bid and ask of the 3 pm snapshot, with its time.
- Paper orders: Manual account only; F&O is refused unless the contract is in the recorded NIFTY monthly 3 pm
  snapshot (example: BANKNIFTY 27 Oct FUT is refused, NIFTY 27 Oct 24800 CE passes, a single short NIFTY call is
  blocked by the maximum-loss limit).
- US market: no F&O item, nav entry, chain button or search group exists (absent, not empty).
