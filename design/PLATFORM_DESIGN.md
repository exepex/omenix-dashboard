# Omenix platform design: a professional broker-style experience

Status: **proposed 12 Oct 2026, for the owner's approval**; supersedes the navigation of `UNIFIED_DASHBOARD.md`
(whose principles on accounts, currencies, India-only F&O and the shared portfolio contract stay valid).

## 0. What the owner asked for

> "A professional stockbroker platform like experience ... when a user logs in ... they see their dashboard, their
> investments, their strategies, their profit and loss, a high level market overview ... screeners ... seamless
> navigation ... a modern materialized look ... not as a test project anymore."

Owner's choices (12 Oct 2026):
- **Look:** a mix: Kite's always-visible watchlist and speed, Dhan's options pages, Groww's clean cards, in our
  modern Material look.
- **Paper orders:** yes, a paper Buy/Sell window for the owner's own manual paper trades.
- **Devices:** desktop and phone equally.
- **Theme:** light by default, with dark available.

## 1. Honest frame (what is real, what is not)

| A broker platform has | Omenix has | Design consequence |
|---|---|---|
| Streaming live prices | End-of-day NSE files; the 3 pm NIFTY option quotes; the stock tool's prices and runs several times a day | Every price carries its **as-of time**; stale data is greyed and says so. A live feed would be a separate, priced decision |
| Real orders | **Paper only, never real** (hard line) | The order window records **paper** trades; the buttons say **Buy** and **Sell** only (owner, 13 Oct 2026), and the brand ("Paper only") and the order window ("No real order is placed") say it once |
| Market depth (order book levels) | Best bid/ask only (and only in 3 pm snapshots) | No market-depth widget; the quote card shows bid/ask with its time |
| Mutual funds, IPOs, bonds | Not in scope | Not shown |

## 2. The shell (every screen)

**Desktop (1280 px and wider):**

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ OM Omenix │ ⌕ Search stocks, F&O, screens... (/)  │ India ▾ │ NIFTY 24,512 ▲0.4% · VIX 13.2 │ 🔔 ☾ ◉ │
├──────┬──────────────────┬───────────────────────────────────────────────────────────────┤
│ Nav  │ Watchlist        │ Page                                                          │
│ rail │ (Kite-style,     │ breadcrumb · title · as-of · actions                          │
│ (ic- │  always visible, │                                                               │
│ ons +│  tabs 1-5,       │ cards, tables, charts                                          │
│ lab- │  hover: B S chart│                                                               │
│ els) │  chain news)     │                                                               │
└──────┴──────────────────┴───────────────────────────────────────────────────────────────┘
                                        right drawer (slides in): Paper order window · quick view
```

- **Top bar:**
  - Omenix mark;
  - **global search** (`/` or Ctrl+K): stocks, F&O underlyings, contracts, screens, strategies, news;
  - **market switch** India · US;
  - **index strip**: NIFTY 50, BANKNIFTY and India VIX for India; S&P 500, Nasdaq and VIX for US. Each shows its
    as-of time on hover;
  - notifications, theme switch, profile.
- **Navigation rail:** dark navy, icons with labels; collapses to icons only.
- **Watchlist panel:**
  - always visible on desktop, collapsible;
  - up to 5 named lists, each holding stocks, F&O underlyings and contracts together;
  - each row shows the price, change and as-of time;
  - hovering a row gives quick actions: **B** (paper buy), **S** (paper sell), Chart, Option chain, News, Details;
  - lists can be reordered by dragging.
- **Right drawer:** the Paper order window and quick views open here without leaving the page.

**Phone (390 px):**
- Bottom tabs: **Home · Watchlist · Orders · Portfolio · More**.
- Search sits at the top of every screen.
- The order window becomes a bottom sheet; tables become cards; charts are full-width.

## 3. Navigation model (seamless by design)

1. **Every thing is a link.** Each entity has its own page or panel, reachable from anywhere it appears: stock,
   F&O underlying, contract, structure, strategy, paper account, news item, event. Hovering any ticker or contract
   shows a **hover card** with price, change, as-of time, position held, and buttons for Chart, Chain, Buy and
   Sell.
2. **Breadcrumbs** on every page, for example Markets › NIFTY › Option chain › 26 Nov.
3. **The URL holds the state** (filters, tabs, selected expiry, chart range). Back and forward always work, and any
   view can be bookmarked.
4. **Context actions on every row:** the same small menu everywhere (Chart, Option chain, Buy or sell, Add to
   watchlist, News, Open details).
5. **Keyboard shortcuts:**
   - `/` search; `B` and `S` paper order for the focused row; `Esc` closes the drawer;
   - `g` then `h` Home, `g` then `p` Portfolio, `g` then `o` Orders, `g` then `s` Screener;
   - `?` lists all shortcuts.
6. **Recently viewed** (search box and Home), and **pinned** screens in the navigation rail.
7. **Cross-links by question:**
   - "Why did this strategy trade?" goes from the position to its decision record and evidence.
   - "What else moves this stock?" goes from the position to the stock's news and events.
   - "What do the options say?" goes from the stock or index to its option chain, IV history and events.

## 4. Screens

Groups in the navigation rail: **Dashboard · Markets · Trade · Portfolio · Strategies · Research · Control**, plus
Assistant, Help and Settings.

| # | Screen | What the user needs there | Key components | Links to |
|---|---|---|---|---|
| 1 | **Dashboard** (home after login) | "How am I doing, what changed, what needs attention?" | Portfolio value and day P&L per paper account (no cross-currency sum); allocation donut (stocks, F&O, cash); open positions top 5; today's decisions (strategies and books); market overview strip; alerts; top news; events today and this week | everything below |
| 2 | **Markets overview** | "What is the market doing?" | Indices with sparklines; top gainers, losers and most active; sector heatmap; advance/decline breadth; India VIX; FII/DII flows (after A8); events calendar; F&O: PCR, max-pain, IV levels (India) | stock pages, option chains, News, Calendar |
| 3 | **Watchlists** (full page) | Manage lists, compare at a glance | Five tabs, columns chosen by the user, sparkline column, bulk add from the screener | stock pages, chain, Paper order |
| 4 | **Stock page** | Everything about one stock | Header (price, change, as-of, Buy and Sell); tabs: Overview (chart, key stats, 52-week range), Signals (models' agreement, probability, horizon picks), Strategies (rule vs AI on this stock), News, Events (results dates), Your positions; **F&O tab** if it has derivatives (India) | chart, chain, Screener, News |
| 5 | **Chart** (full screen) | Study price | Candles, line or area; ranges 1M to 5Y; moving averages and volume; event markers (results, RBI, Budget, expiries); our trades marked on the chart | stock page, Paper order |
| 6 | **Option chain** (India, Dhan-style) | Read options for an underlying and expiry | Calls and puts around the money, centred on spot; per strike: OI and change, volume, last price (EOD), IV, Greeks (computed by us, labelled), bid/ask with time where recorded (NIFTY 3 pm); PCR, max pain, IV smile; expiry chips; "Add legs to builder" | Strategy builder, Paper order, IV history |
| 7 | **Strategy builder and payoff** (India F&O) | Build and check a multi-leg paper trade before placing it | Pick legs from the chain or a template (iron fly, condor, spreads, strangle); payoff at expiry and today; maximum profit and loss; breakevens; margin estimate (from our recorded margin source, labelled); probability of profit (risk-neutral, labelled as such); **checks against the owner's limits before placing** | Paper order (basket), chain |
| 8 | **Screener** | Find candidates | Tabs Stocks and F&O (India); filter builder; saved screens; chosen columns; results open in hover cards; "Add all to watchlist" | stock pages, chains, watchlist |
| 9 | **Orders** (paper) | "What did I or the strategies ask for, and what happened?" | Tabs: Open (pending to the next valid quotes), Executed, Rejected (with the reason, e.g. limit or no valid quote), Baskets | Positions, decision records |
| 10 | **Portfolio** | What I hold | Tabs **Positions** (open: stocks and F&O structures with legs), **Holdings** (longer-term stock positions of paper portfolios), **Accounts and funds** (each paper account: cash, margin used, equity curve, brake distance) | stock pages, chain, Orders, Reports |
| 11 | **Reports** (Console-style) | "How did I do?" | P&L by day, month and year per account; realised vs unrealised; charges breakdown; **tax P&L** (31.2% assumed scenario, labelled); trade book export (CSV) | Portfolio, Orders |
| 12 | **Strategies** | How the machines are doing | Tabs: Strategy lab and Track record (stocks); **Scoreboards** (stock Rule vs AI; F&O A and B, all three books, every detail); Forecasts (F&O); my manual account shown beside them, never merged | decision records, evidence |
| 13 | **News** | What is said | Feed with filters (market, stock, F&O, event type, importance); clustered stories; links to the stocks named | stock pages |
| 14 | **Calendar** | What is coming | Results dates, RBI, Budget, elections, F&O expiries, holidays (NSE calendar) | stock pages, chain |
| 15 | **Alerts** | Tell me when | Price-crossing alerts and "position near its stop or target"; evaluated on each data update (not tick by tick, stated); delivered in the bell and in Slack #fno-desk or the stock channel | the alerted item |
| 16 | **Risk** (Control) | Am I inside the limits? | Per account: each limit used vs allowed, stress table, exposure | Portfolio, Strategies |
| 17 | **Judge and evidence** (Control) | Can I trust this decision? | Judge results, overrides, drill-down to hashes and commits | decision records |
| 18 | **Data health** (Control) | Is the data fresh? | Each backend's runs and publications, failures with reasons | — |
| 19 | **Assistant** | Ask in plain words | Chat over the app's own data, with sources | anything it cites |
| 20 | **Help, Settings** | Learn, adjust | Glossary (every term on the screens), shortcuts; Settings: theme, density (comfortable or compact), default market, watchlist columns | — |

## 5. The Paper order window

- **Opens from:** any B or S button, any hover card, the strategy builder (as a basket), or a keyboard shortcut.
  It slides in from the right on desktop and is a bottom sheet on the phone.
- **Fields:**
  - account: **Manual (paper)**, the owner's own account. Strategy books cannot be traded by hand;
  - instrument and side (Buy or Sell);
  - quantity (stocks) or lots (F&O);
  - order type: **Market**, filled at the next valid quotes by the shared fill rules, or **Limit**, filled only if the
    next valid quotes reach the limit;
  - validity: day, or until cancelled (good till cancelled, GTC);
  - optional stop-loss and target (bracket).
- **Shows before confirming:**
  - estimated charges (C1);
  - for F&O, maximum loss and margin estimate;
  - **checks against the account's limits** (C2): a breach blocks the order with the reason;
  - and the words "Paper order: no real order is placed".
- **How it is filled:**
  - the order goes to the dashboard's own inbox (W7 pattern), and the backend that owns the instrument imports it;
  - it is filled **only from valid quotes by the same fill model the strategies use** (E4 for F&O; the stock tool's
    rules for stocks);
  - it is never filled from a guessed price;
  - an instrument with no executable quotes in our data (any F&O contract outside the recorded NIFTY monthly
    snapshots) is **refused with that reason**, not filled.
- **The Manual account:**
  - its own paper account per market (India and US), shown beside the strategy books;
  - **never** part of scoreboards A and B;
  - its starting capital and limits are the owner's choice (proposed: the same as the books, Rs 5 lakh, Rs 10,000
    maximum loss per trade, 3 open F&O structures).

## 6. Look and feel

- **Visual style:** the existing Material "modern admin light" design system (dark navy rail, white cards with a
  faint shadow, one indigo accent, pill tabs, icon tiles, gradient area charts), with dark mode from the same tokens.
- **Density:** comfortable by default, compact in Settings (tables gain about 30% more rows).
- **Tables:** sticky headers, sortable columns, a column chooser, row hover actions, right-aligned numbers with
  tabular figures, and the sign shown on every change.
- **Colours:** green for up and red for down, always with an arrow and sign (never colour alone); Paper badges on all
  money.
- **Motion:** quick (150-200 ms), and reduced when the system asks for it.
- **Phone:** bottom tabs, swipeable tabs, sticky action bar (Paper Buy and Sell) on instrument pages.
- **Accessibility:** WCAG AA contrast (already true of the tokens), visible focus, a keyboard path to every action.

## 7. Features: now, needs data, excluded

| Feature | Status |
|---|---|
| Dashboard, portfolio, orders, reports, P&L, tax P&L (paper) | **Now** (from the backends' records) |
| Watchlists, global search, hover cards, shortcuts, deep links | **Now** (dashboard work) |
| Screener stocks | **Now**, using the stock tool's data. **Check needed:** which company figures (valuation, results) the stock tool actually has |
| Screener F&O, option chain, IV history, Greeks | **Now** at end of day from NSE files; computed values labelled |
| Strategy builder and payoff, paper baskets | **Now** (our pricing and charges code) |
| Paper order window, Manual account | **Needs backend stories** in both tools (inbox import, fill, account) |
| Price alerts | **Now**, evaluated on each data update (not live) |
| FII/DII flows | After story A8 |
| Live streaming prices, intraday charts, market depth | **Needs a live data feed** (separate decision and cost) |
| Real orders, mutual funds, IPOs | **Excluded** |

## 8. What this changes in the plans (after approval)

- **Dashboard repository:** a new story set, starting with the shell and navigation (search, rail, watchlist panel,
  drawer, URL state, shortcuts), then each screen, the order window and the shared portfolio contract.
- **`exepex/trading`:**
  - a **Manual paper account** for F&O, outside the three-book comparison (affects E1, E4, C2 and the design's
    section 12 fairness rules: the Manual account never enters scoreboards A or B);
  - order import from the dashboard inbox;
  - publishing rows for the screener, option chain and market overview from the daily files;
  - design section 13.2 rewritten for the shared screens.
- **The stock tool:** the same for stocks (Manual account, order import, screener and market-overview rows),
  planned in its own repository.

## 9. Mockup order (after approval)

1. **00-shell:** top bar, rail, watchlist panel, drawer, search, hover card. The frame every page sits in;
   desktop and phone.
2. **01-dashboard**
3. **06-option-chain**, then **07-strategy-builder**
4. **04-stock-page**
5. **10-portfolio** and **09-orders**
6. **The Paper order window**
7. **08-screener**
8. **02-markets**
9. **11-reports**
10. The rest.

**Built so far** (folders in `design/mockups/`, numbered from 30 in the order built; the owner moved the screener and
markets ahead on 13 Oct 2026). A signed-off screen's `notes.md` is its frozen API contract; later changes, with their
reasons, go in its `changes.md`.

| Folder | Screen | Status |
|---|---|---|
| `30-shell` | the app frame (00-shell) | signed off 13 Oct 2026, as of cadf1d2 |
| `31-dashboard` | Home (01-dashboard) | signed off 13 Oct 2026, as of e8cd360 |
| `32-option-chain` | NIFTY option chain (06-option-chain), real NSE data | signed off 13 Oct 2026, as of 9d9c401 |
| `33-screener` | Screener (08-screener), real NSE data | signed off 13 Oct 2026, as of e28b43d |
| `34-markets` | Markets overview (02-markets), real NSE data | signed off 13 Oct 2026, as of 59b606d |
| `35-stock` | Stock page (04-stock-page), the stock tool's real records | signed off 13 Oct 2026 (7b10cc0) |
| `37-forecasts` | Forecast lab (slice 2 of exepex/trading `docs/BUILD_MAP.md`), India F&O only; real state empty, labelled Examples | draft for sign-off, 13 Oct 2026 |
| `38-strategy-lab` | Strategy lab (owner's brief of 13 Oct 2026): which family makes money on paper and whether it is ready for real money; stocks, F&O and both; real settled trades and labelled Examples | signed off 13 Oct 2026, as of 32ad873 |
