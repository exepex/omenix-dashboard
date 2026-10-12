# Omenix: one dashboard for stocks and F&O, screen structure (proposal)

Status: **proposed 12 Oct 2026, for the owner's approval**, before any mockup is drawn. Owner's direction: "when a
user logs in to any brokerage account ... they see their positions open, whether it's stocks or whether it's future
and options ... future and options we are tracking only for India." Later the same day: "we would be creating screener for both
future and options and stocks ... We are building the application as a professional stockbroker tool ... even if it
is a research tool", and the app is named **Omenix** (renamed from "Market brief" on 12 Oct 2026). This replaces the separate `/fno` screens of
`exepex/trading` design section 13.2 (that section is updated once this proposal is approved).

## 1. Principles

1. **Portfolio first, like a broker app.** You land on what you hold and what happened today, across stocks and F&O.
2. **One market switch, as today:** **India** (stocks and F&O) and **US** (stocks only). In the US market every F&O
   element is absent.
3. **One filter chip row on portfolio screens:** All · Stocks · F&O (India only).
4. **Everything is paper** and labelled Paper.
5. **Separate experiments stay separate.**
   - Each paper account is shown on its own: the stock tool's paper portfolios, and F&O Book 1, Book 2 and Book 3
     (Rs 5 lakh each).
   - A market total may be shown only as "sum of separate paper accounts", and never across currencies.
   - Scoreboards are never merged across the two tools, and F&O's scoreboards A and B are never merged with each
     other.
6. **Each section shows its own freshness**, because two backends publish at different times: the stock tool
   several times a day, F&O once after its 3 pm run.

## 2. Navigation (sidebar groups)

| Group | Screen | Stocks | F&O (India) | Status |
|---|---|---|---|---|
| Overview | **Home** | yes | yes | redesign of 01-home |
| Portfolio | **Positions** | open paper trades | open structures per book, legs expandable | **new** (absorbs open trades from 07) |
| | **Accounts** | paper portfolios | Book 1, 2, 3: cash, margin, equity curve, brake distance | **new** (absorbs 07's account view) |
| | **Activity** | picks, entries, exits, settlements | daily decisions (including "no trade" and its reasons), fills, exits, pending exits | **new** |
| Research | **Watchlist**, **Companies**, **Company** pages | yes | (not applicable) | existing |
| | **Screener** | filter the stock universe (price, change, volume, sector, size, the models' agreement and probability, news) | filter F&O underlyings and contracts (implied volatility and its rank, open interest and its change, put-call ratio, futures basis, volume, days to expiry, events) | **new**, tabs Stocks · F&O (F&O tab India only) |
| | **Options desk** | (not applicable) | NIFTY chain snapshot, implied vs realised volatility, India VIX, events calendar, 3 pm spreads | **new** |
| | **News** | yes | market-wide items tagged for F&O | existing, filter added |
| Strategies | **Strategy lab**, **Track record** | yes | (stock-only) | existing |
| | **Scoreboards** | Rule vs AI (stock) | Scoreboard B (whole systems) and Scoreboard A (matched decisions), all three books, every detail | 06 becomes one tab |
| | **Forecasts** | (not applicable) | five daily questions, scores against baselines | **new** |
| Control | **Risk** | exposure of open paper trades | per book: every owner limit used, stress, brake | **new** |
| | **Judge and evidence** | judgments | judge results, overrides, drill-down to hashes | **new** |
| | **Data health** | runs and freshness | publication status, failed runs | **new** |
| | **Assistant**, **Help** | yes | yes | existing, help text extended |

## 3. Home (India), top to bottom

1. **Market strip:** NIFTY 50, India VIX, session state, and each backend's freshness.
2. **KPI cards:**
   - open positions (stocks and F&O counts);
   - today's unrealised P&L per account (no cross-currency sum);
   - "at risk now" for F&O (sum of maximum losses of open structures against the Rs 30,000 limit, per book);
   - alerts.
3. **Positions snapshot:** the top open positions, both kinds, with "View all" to Positions.
4. **Today's decisions:** stock picks, and each F&O book's 3 pm decision with one line of reason.
5. **Accounts strip:** one tile per paper account (equity, change, brake distance for F&O books).
6. **News** (existing card).

US Home: the same layout without any F&O element.

## 4. Positions (the broker-style screen)

- **One table**, filter chips All · Stocks · F&O, grouped by account.
- **Stock row:** ticker, quantity, entry price, last price, unrealised P&L (amount and %), target and range, exit
  date, strategy.
- **F&O row:** the structure name (for example "NIFTY 26 Nov short iron fly 24000 ±300"), the book, net entry
  credit or debit, current mark, unrealised P&L, maximum loss, margin, days left, exit rule, and flags
  (pending exit, protection unverified). It expands to show its legs (strike, CE/PE, buy/sell, lots, entry, mark).
- Phone: the table becomes cards; legs fold under each F&O card.

## 4a. Screener

- **One screen with two tabs:** Stocks, and F&O (India only).
- **Saved screens:** for example "high IV rank, rising open interest", or "models agree 4 of 5, volume up".
- **Columns are chosen by the owner** from the list, and sorting works on any column. Each result row links to its
  Company page (stocks) or to the Options desk (F&O).

**Honest limits (reasoning from the data we have):**
- **F&O data is end of day.** It comes from NSE's daily F&O files, which cover every F&O underlying, not only NIFTY,
  and are updated after the close.
- **Quotes exist only for NIFTY.** The 3 pm bid/ask quotes are recorded only for NIFTY monthly options.
- **No live screener yet.** A screener refreshing during market hours needs a live data feed and its rate limits,
  which is a separate decision.
- **Screener results are research, not trades.** The approved F&O design trades only NIFTY monthly structures, so a
  stock-option or BANKNIFTY result does not open a paper trade unless a tested strategy for it is approved through
  the research loop.

**Backend work this needs:**
- The stock tool publishes its screener universe rows.
- The F&O tool publishes F&O screener rows from the daily files: a new story in `exepex/trading`'s plan, plus an
  "IV rank" history built from the files.

## 5. Data contract for mixed screens

Each backend keeps its own read models. Mixed screens (Home, Positions, Accounts, Activity, Risk, Data health) need
one shape for the shared parts, so this repository will own a small **shared portfolio contract**
(`contracts/portfolio/v1`): a position (with optional legs), an account, an activity event, a freshness record. Both
backends publish rows in that shape alongside their own pages. Each backend owns the rest of its pages. This adds one
story to each backend's publisher (in `exepex/trading`, P1-P2) and to the stock tool's publisher.

## 6. Mockups to draw after approval (fake data, labelled Mock)

`01-home` (redesigned, India and US), `13-positions`, `14-accounts`, `15-activity`, `16-options-desk`,
`17-scoreboards` (stock Rule vs AI tab plus F&O A and B tabs), `18-forecasts`, `19-risk`, `20-judge-evidence`,
`21-data-health`, `22-screener` (Stocks and F&O tabs). Existing stock mockups stay as they are except for the navigation and the News filter.

## 7. Questions for the owner

1. Approve this navigation and screen list, or name changes.
2. Is "at risk now" (the sum of maximum losses of open F&O structures) a number you want on Home, or too alarming
   for a front page?
