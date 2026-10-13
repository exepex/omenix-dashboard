# 30-shell: data contract (what every element needs)

**Status: signed off 13 Oct 2026 (owner), as of commit cadf1d2.** This is the signed-off API contract for the app frame
(app bar, rail, picks panel, search, order window, overlays). Change it only for a very solid reason, brought to the
owner first (through the orchestrator); record each change and its reason in `changes.md`.

**Data source of this mockup:** `data.json` is composed by `design/mockups/_platform/real_data.py` from the
application's own example records (the stock tool's catalogue examples in `01-home`, `03-company` and
`07-paper-portfolios`, the same files the web tests read): companies, prices, strategies, picks, agreement, own trades,
news. Clock: the catalogue cut-off, Wed 7 Oct 2026 17:30 IST / 08:00 ET. **Labelled examples** (not in this repository
yet): NIFTY option and future prices, bid/ask and IV (the F&O tool's read models); the Manual account's starting cash
(owner decision); charge rates.

Units: prices in the instrument's currency with 2 decimals; changes in percent; money in INR (India) or USD (US),
never converted or summed across currencies; times are UTC ISO strings shown in IST or ET.

## App bar
| Element | Fields | Freshness | Publisher |
|---|---|---|---|
| Brand, "Research · Paper only" | none (fixed text) | | dashboard |
| Search (the only search box) | per instrument: `id`, `sym`, `name`, `code` (NSE trading symbol, e.g. `NIFTY26OCT22800CE`), `kind` (stock, index, future, option), `last`, `chg_pct`, `as_of`, `source`; strategies (`id`, `name`, family); news (`title`, `source`, `tickers`); pages | per source (below) | stock tool (stocks, indices, strategies, news); F&O tool (contracts); dashboard (pages) |
| Market switch India · US | `markets.<m>.label`, `fno` (true only for India) | static | dashboard |
| Index strip (hidden on Home, which has the market band) | `indices[]` → items: `last`, `chg_pct`, `chg_5d_pct`, `as_of`, `source` | the stock tool's close | stock tool `market_status.benchmark`, `.vol_index` |
| Bell | `notifications.<m>[]`: `icon`, `title`, `sub`, `unread` | each run | dashboard alerts + both backends' run events (`market_status.runs`) |
| Theme, profile | the reader's choice (light default, dark, system); density; rail labels | local | dashboard |

## Today's buy picks panel (left on desktop ≥ 1200 px; "Picks" tab on phones; inline on Home below 1200 px)
| Element | Fields | Freshness | Publisher |
|---|---|---|---|
| Row | `signals[]`: `id` (ticker), `family` (rule, ai; hybrid only from the F&O tool), `strategy_id`, `strategy` (display name, no AI model), `pick_rules[]` (best_expected_gain, highest_probability), `horizon` (sessions), `prob_up` (0-1), `move_pct`, `loss_pct`, `costs_pct`, `exp_gain_pct` (after market costs, percent), `amount` | pre-open run (02:10 UTC India, 11:45 UTC US) | stock tool `rm.head_to_head` (`head_to_head_pick`) |
| Agreement ring "13/15" | `agree.buy`, `agree.of`, `agree.by_family.{rule,ai,baseline}.{buy,of}` at the pick's horizon | same | stock tool `agreement` |
| "Yes / No after costs" | `exp_gain_pct` > 0 is Yes (green), else No (red) with the number | same | stock tool |
| "Record here" | `record.trades`, `record.win_rate`, `record.net_pnl`, `record.badge` (too_few_to_rank under 20) | post-close run | stock tool `scoreboard_row` scope strategy_company |
| "Not proven yet · N trades to go" | `go_live.months_forward`, `go_live.trades_needed`, `proven` | post-close run | stock tool scoreboard `go_live` |
| No-pick note | `no_pick[]` (tickers with status no_candidate) | pre-open | stock tool |
| F&O note / example rows | `fno_state.approved`, `fno_state.note`; example rows: `basket`, `name`, `pop` (risk-neutral %), `max_loss`, `credit`/`debit` | 3 pm run | **F&O tool (exepex/trading)**: decision records, approved-strategy flag |
| Filter chips, pages | none (6 rows a page) | | dashboard |

## Market status chip and the trading lock (owner, 13 Oct 2026)
| Element | Fields | Publisher |
|---|---|---|
| "Open · closes 15:30 IST" / "Closed · opens Thu 8 Oct 09:15 IST" (top bar, every page) | `status.open_utc`, `status.close_utc` (today's session), `status.next_open_utc`, the exchange name, `zone` | stock tool `market_status.session` (NSE and NYSE calendars, holidays included) |
| Lock | while closed, every manual Buy and Sell (search, picks, positions, hover card, order window, basket, keyboard B and S) is disabled, faded, with the reason; the strategies keep paper trading on their own | dashboard rule over the same fields |
| Example clock | `status.example_open_now` (`#clock=open`): the same page during the session, labelled as an example | mockup only |

## Approaches (who decides; owner, 13 Oct 2026)
`families` (label, icon, long name), in this order:
1. `rule`, **Rule-based**: rules read the data, use a standard strategy or invent a new one, and predict the price.
   No AI is involved.
2. `hybrid`, **Hybrid: AI team within the rules**: the AI team does the analysis and research but acts only inside
   the rule-based limits.
3. `ai`, **AI team, fully autonomous**: agents with different roles decide on their own, using an existing strategy
   or inventing a new one.
4. `baseline`, **Baselines**: the comparison line.
5. `manual`, **You**.

Stock tool today: `rule` (8 strategies), `ai` (4 earlier strategies that compared AI models; the screens show them all
as "AI team" and never name a model), `baseline` (3); the hybrid and the AI team are being built, so a hybrid stock
line is an empty state for now. F&O tool: Book 1 rule-based, Book 2 hybrid, Book 3 AI team (exepex/trading design
section 12). The description of each approach is per market (`markets.<m>.family_text`): F&O is named only in India.

## Navigation rail, flyouts, pinned
Static structure in `platform.js` (`NAV`, `PINS`); India-only entries absent in the US. No backend data.

## Hover card, quick view
`last`, `chg_pct`, `as_of`, `source` (+ `bid`, `ask`, `iv` for snapshot options); `held` {`account`, `qty`, `avg`};
`spark` (the last 30 daily closes, `03-company` bars). Publishers as above.

## Order window (drawer; bottom sheet on phones)
| Element | Fields | Publisher |
|---|---|---|
| Account | `accounts`: `name`, `kind` (manual or strategy: strategies are listed but not tradable by hand), `capital`, `cash`, `open_structures`, `at_risk` | Manual account: new backend story (both tools) |
| Price basis | stocks `last` + `as_of`; options `bid`/`ask` of the 3 pm snapshot | stock tool; F&O tool |
| Charges (estimate) | `charges` rate table per kind | C1 charges code (F&O), `config/costs.yaml` (stock tool) |
| Limits | `limits.max_loss_per_trade` (10,000), `max_open_structures` (3), `max_at_risk` (30,000) | F&O tool C2 (owner's limits) |
| Margin estimate | `short_option_margin_per_lot`; basket `margin_per_lot` | F&O tool's margin source |
| Fill time | `next_quotes.stock`, `next_quotes.option` | backends' schedules |
| Refusal | an F&O contract is executable only with `source` = snap3pm and `bid`/`ask` present | F&O tool |
| Result | the order goes to the dashboard's inbox (W7 pattern); the owning backend imports and fills it | both |

## Freshness rules (`sources`)
`close` (the stock tool's daily close, stale after 30 h), `eod` (NSE end-of-day file, stale after 78 h: covers a
weekend), `snap3pm` (stale after 26 h). A stale value is greyed and says "stale".

## Owner-changeable defaults
Manual account Rs 5 lakh (US $5,000, owner 13 Oct 2026) with the F&O books' limits; it holds the owner's real own paper
trades (RELIANCE 50 at ₹1,182; AAPL 3 at $330.80).
