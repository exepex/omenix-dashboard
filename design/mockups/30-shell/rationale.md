# 30-shell: rationale

Mockup order item 1 of `design/PLATFORM_DESIGN.md` section 9 ("00-shell"; numbered **30** because 00-12 are the
existing mockups, which the web tests read, and 13-22 were proposed by `UNIFIED_DASHBOARD.md`). Platform mockups:
30 shell, 31 Home, then 32 option chain, 33 strategy builder, 34 stock page, 35 portfolio, 36 orders, 37 order window,
38 screener, 39 markets, 40 reports. Status: **third round, for the owner's review** (13 Oct 2026).

Files: `data.json` (composed from the application's own example records, see notes.md), `template.html`, `build.py`
(deterministic), `page.html`, `notes.md` (the data contract), screenshots from `node design/system/check_page.js`:
`shot-<width>-full` at 390, 768, 1024, 1280 and 1680 px (phone, tablet, laptop, desktop, large), the same for
`shot-dark-*` and `shot-us-*`, and states `shot-<state>-1280-viewport` / `-390-viewport`: order (option buy that
passes), blocked (single short call over the loss limit), refused (future without quotes), stock-order,
palette-code (`NIFTY26OCT22800CE`), palette-words ("nifty 22800 call"), hovercard, flyout, notifications, more,
picks-rule, fno-example, basket. Every state is a link (`page.html#drawer=order:RELIANCE:buy`, `#m=us`,
`#theme=dark`, ...). `node design/system/check_text.js page.html m=india m=us theme=dark` reports 0 clipped,
overflowing or overlapping texts at twelve widths.

## The owner's three rounds of feedback (12-13 Oct 2026) and what changed
1. "No informational blocks on top"; quick search with buy and sell from the results; sharper, more Material:
   the banner went, 4 px corners across the design system, B and S on every search result.
2. "Three search boxes on one screen look awkward"; the watchlist bar makes little sense with many symbols, show
   strong signals there by approach; say where every idea and position comes from; the phone looked broken; every
   device size matters: one search box (top bar) that also takes exchange codes; the left bar is now **Today's
   buy picks** by strategy family with Buy and Sell on every row and pages instead of a second search; family
   badges (icon and word) everywhere; no sideways rows on phones; checked at five device widths and by
   `check_text.js` at twelve.
3. "Use real wordings, labels and examples from the application"; "call it buy and sell, not paper buy": all names,
   tickers, codes, strategies (`rule.model_news.v1` "Model + news", `ai.combined.opus.v1` "AI combined (Opus)"),
   picks, probabilities, costs and records are the stock tool's own example records; buttons say Buy and Sell; the
   order window says once, at its foot, that no real order is placed; the brand keeps "Paper only".

## Decisions (and why)
- **Real strategy families, not invented ones.** The owner asked about "rule-based, AI-based, hybrid". The stock tool
  has Rule strategies (written rules on the price model's forecast and the news: close to the owner's "hybrid"), AI
  traders and Baselines; there is no separate hybrid family, so none is shown. Strong evidence: the strategies table.
- **A pick below market costs reads "No" in red**, with the number; its Buy and Sell buttons turn plain. Today both
  India picks (RELIANCE, N+5) are below costs, and the US pick (NVDA) clears them. The owner's verdict colours (NO
  red, YES green) and "never colour alone" hold.
- **Every pick shows its evidence beside it:** how many of the 15 strategies agree, the model's chance, the gain
  after costs, and the picking strategy's own record on that stock ("1 of 3 won, −₹3,764 · too few to rank"). No
  "high probability" claim without that.
- **F&O today: "no approved strategy yet"** (orchestrator, 13 Oct 2026: Experiment 1 has not run). The filled state
  is designed and shown only as a labelled example (`#fno=example`).
- **Rail with labels under icons (84 px), not a 256 px sidebar**, so that the rail, the picks panel (300 px) and the
  page fit at 1280 px. Reasoning only.

## Honest limits of this round
- The stock tool's universe in the example records is small (3 active companies a market), so the picks panel is
  short; with a larger universe it pages (6 a page).
- F&O prices are examples until the F&O tool publishes its read models.
- The "Paper" word on buttons was removed at the owner's request; the design rules (CLAUDE.md, PLATFORM_DESIGN.md
  section 1) still say "Paper on the button": flagged to the orchestrator for the owner to settle.

## Fourth round (13 Oct 2026, owner): colours, names, market hours, the hybrid
- **Buy is always green and Sell always red** (no plain buttons); while the market is closed they are faded and locked
  with the reason in a tooltip.
- **No AI model names** on any screen: "AI combined A", not "AI combined (Opus)"; ids stay internal.
- **Market open or closed on the top bar of every page**, with the time it changes ("Closed · opens Thu 8 Oct 09:15
  IST"). **Your own buy and sell are blocked while the market is closed**; the strategies keep paper trading on
  their own (that is how the system keeps validating them). The real example clock (17:30 IST) is after the close, so
  the default screenshots show the closed state; `#clock=open` shows the same pages during the session (labelled).
- **The hybrid:** the owner compares three systems in parallel (scoreboard A: same decisions; scoreboard B: whole
  systems). They are the F&O tool's books: Book 1 rule-based, Book 2 hybrid (rule + AI), Book 3 AI-based. The stock
  tool has rule-based and AI-based strategies today, plus baselines as the comparison line; a hybrid stock strategy
  is planned (owner, 13 Oct 2026), so Hybrid is a full approach for stocks too, with an empty state until it exists. The picks panel filters
  by Rule-based, AI-based and Hybrid; every row, card and position carries its approach badge.

## Fifth round (13 Oct 2026, owner): three approaches, the AI team, the gallery
- The three approaches carry the owner's exact meanings and order: Rule-based (no AI), Hybrid (the AI team within the
  rules), AI team (fully autonomous, agents with roles). The earlier model-versus-model AI strategies are shown as
  "AI team"; no AI model is named anywhere. Hybrid applies to stocks too (empty state until it exists).
- The US paper account starts at $5,000 (owner).

## Supersedes
The shell of mockups 01-12 (each rationale says so). They stay unchanged: the web app and its tests read them.
