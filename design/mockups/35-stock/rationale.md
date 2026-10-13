# 35-stock: rationale

Screen 4 of `design/PLATFORM_DESIGN.md` section 4, the stock page; every signed-off screen links to it. Built on 13 Oct
2026 at the orchestrator's request. Status: **for the owner's review**.

**Files:**
- `data.json`, built from real records;
- `template.html`, `build.py`, `page.html`;
- `fetch_stock.py`, `source/`;
- `states.json`, `gallery/`, `gallery.html`;
- `screens/`: 21 numbered plain pictures.

**Checks:**
- `check_page.js`: no console errors, no external requests, no overflow;
- `check_text.js`: twelve widths and ten states, 0 findings;
- `shoot_states.js`: 15 states, 25 shots, no problems.

**Which stocks:** RELIANCE (India: followed, F&O, results in 3 days, news busy with the Jio IPO) and NVDA (US:
followed, the most traded). Both are real cases with something to show.

## Questions a retail user asks, and where the page answers them
1. **What is it worth now, and is that fresh?**
   - The 12 Oct close, 1,158.90 (−0.97%).
   - The stock tool's price check at 14:14 IST: 1,159.70 (+0.07%), marked "not live".
2. **What do I hold?**
   - Your paper position: 50 shares at 1,182.00, −₹1,115.00 at the last price.
   - Buy and Sell open the order window at that price.
3. **Is something coming?** "Results in 3 days".
4. **How has it moved?**
   - The chart over 1M to 2Y, with "−15.77% over 1Y".
   - Compare with NIFTY 50 from 100.
5. **Is it expensive?**
   - P/E 21.0 in words ("price is 21.0 times the last four quarters' earnings, ₹55.22 a share").
   - The last four quarters' revenue, profit and EPS.
6. **Is it stretched? How much does it swing?** RSI, beta, its usual day's range, average volume, delivery, each in
   words.
7. **What do our tools think, and how sure are they?**
   - For each of the next 5 sessions: the model's chance of a rise (47%), how many strategies buy (1 of 12; by
     family), and where the price should end, with 50% and 80% ranges drawn against today's price.
8. **Why?**
   - The AI team's reading, quoted as recorded: verdict "Abstain", the case for a rise, the case against.
9. **What would a trade cost?**
   - About 0.46% in market charges for a ₹1,00,000 round trip, so a trade must gain more than that.
10. **Who already holds it?**
    - Our strategies' open paper trades (here only the "Always buy" baseline), with whether each sits inside the
      expected range.
    - The page says no trade has settled yet, so there is no record on this stock.
11. **What is being said? Is it true?**
    - The latest stories, each labelled confirmed, single source, unverified, rumour or promotional.
12. **How did results go before?**
    - The last four results against the estimate (beat or missed, by how much) and the next date with its estimate.
13. **Anything from the exchange or the SEC?**
    - India: promoter pledge, block deals, announcements, delivery.
    - US: insider filing, short interest, top holders.
14. **F&O (India only):**
    - The future and its build-up (short build-up: new sellers), IV against its 3-month range, put-call ratio, the
      move priced in by expiry, the lot (500).
    - Three months of the future and IV.

## Choices and why
- **Five tabs:** Overview, Our strategies, News, Results and filings, F&O. The price, the position, results-soon and
  Buy/Sell stay above them, so a user acts without hunting.
- **India is shown during market hours (14:30 IST)**, the most common time to look. The US is shown closed, which
  also shows the grey Buy and Sell.
- **The strategies' trades are grouped** by strategy and buy date. The raw records repeat one baseline five times,
  once per horizon.
- **On phones**, tables become stacked rows, each value with its label.

## What I am not sure of
- **The AI team's text is quoted as written**, including evidence ids such as `a1d5d8e84f685de4`. It is honest, but
  the ids mean nothing to a user. Linking them to the news items would be better and needs the news ids on the page.
  Reasoning only.
- **The option chain button** on an Indian stock opens a note for now. The chain mockup shows NIFTY, and the same page
  serves stocks.

## Rework after the owner's feedback (13 Oct 2026, through the orchestrator)
- **A. Our strategies.**
  - The chance and the expected range are shown once as **the model's view, shared by all strategies**. No family has
    its own range, so the page no longer suggests one.
  - One row per family says how it decides in one line, with its votes per exit as small stacked bars (filled = buys).
    The AI team shows "out" where it recorded no view. Hybrid shows "none built yet".
  - "Strategies holding RELIANCE now (1 of 12)" lists only the holder, each trade's paper result in money and % as a
    bar.
  - "Which family is winning here" says "No settled trades yet" and links to the scoreboard: one stock has too few
    trades to name a winner.
- **B. Header.** One grey line: "Our tools today: 1 of 12 strategies buy · model 47% (not proven) · AI team: stays
  out". It stays grey because nothing is proven. Today the model gives every company about the same chance, so a
  green or red signal would mislead.
- **C. Price chart.**
  - Crosshair with the date, price and the comparisons.
  - Drag (or pinch on a phone) to zoom; double-click or "Reset zoom" to go back.
  - A 5D period.
  - NIFTY 50 and the stock's NSE sector index (Nifty Oil & Gas for RELIANCE, from its Nifty 500 industry), all from 100.
  - The model's 50% and 80% range for N+1..N+5 as a fan past the last close, which keeps 14% of the width so it
    stays visible at every period.
  - The paper buys marked as rings.
- **D. Results.**
  - Revenue and net profit as bars with the net margin as a labelled line.
  - A Quarters / Years toggle; growth against the same period a year earlier.
  - Profit before tax and profit to owners (India).
  - Debt, cash flow and a 3-year history marked "not recorded yet".
- **E. Key numbers, explained** ("Where the stock stands today. Not a forecast."):
  - the 52-week range bar with today's position;
  - an RSI dial marking 30 and 70;
  - one year's volatility of the stock against NIFTY 50 as bars, with beta in words.
- **F. F&O.**
  - It says first that it is market data, not your position, and that stock F&O has monthly expiries only.
  - The three listed futures in a table: price, OI and its change, build-up.
  - Three months of the future over its open interest; IV as a gauge in its 3-month range.
  - Your own paper F&O on its own line ("None").
- **Code.** The page's script is split into `js/1-base.js` to `js/9-mount.js` (one purpose each, all under 350 lines).
  The platform builder now inlines a page's own `js/` folder (`<!--@@PAGE_JS@@-->`).

## Proposed, not asked (G)
Built:
- The crosshair also names the comparison values, not only the price.
- Paper results are shown in money, not only in %, with the trade size stated (₹1,00,000 / $1,000 per exit).
- The IV gauge says in words whether options are cheap or dear for this stock.
- "out" in the votes where a strategy recorded no view, instead of a misleading "0 of 0".

Proposed for the owner to choose (reasoning only):
1. Mark the results date and the ex-dividend date on the price chart (both are recorded in `features` and `events`).
2. Arrow keys move the crosshair one session at a time, for keyboard users.
3. Turn the AI team's evidence ids into links to the matching news items.
4. "Tell me when a strategy buys this stock": a per-stock alert in the bell.
5. The option chain page for this stock (the NIFTY chain's design, for any F&O stock).
6. A small delivery-% trend line (India) next to the delivery figure.

## Second rework, the owner's own feedback (13 Oct 2026)
- **Forecast fan:** stronger fills (22% and 50%) with edge lines, so the two bands read crisply.
- **Key numbers in colour:**
  - The 52-week bar runs red (near the low), neutral, green (near the high).
  - The RSI dial is green from 30 to 70 and red outside it.
  - Volatility is green when calmer than the index and red when more jumpy.
  - Each reading has a glyph and a word next to it (the colour rule: never colour alone). These describe today; they
    are not buy or sell verdicts.
- **Financials in detail** (Results tab): one small chart per measure with a one-line takeaway (revenue, net profit,
  growth from a year earlier, margins, earnings per share). Debt and cash flow keep empty frames marked "not recorded
  yet", so the gap shows rather than hides. The overview keeps a compact results chart with a link to the detail.
- **Our price forecast, explained:** where it comes from, how to read it, and what it means today. It is one forecast
  that every family reads; it is not the rule-based, hybrid or AI team. In plain words: "it gives almost every company
  the same chance, so it says little about RELIANCE; not proven; do not decide on it alone".
- **Families without their internals** (owner): only names, counts and votes; the one-line "how it thinks" is removed
  from the screen and from the data.
- **Holders family by family:** every family has a line, even when it holds nothing.
- **Which family is winning:** today's "no settled trades yet", plus a labelled winning example (rule-based leads,
  ahead of the baselines) and a labelled losing example (no family beats the baselines). The verdict is always measured
  against the baselines.
- **What the AI team thinks:**
  - A plain summary with what could push the price up and what could pull it down.
  - It says the AI team is one of the four families and the only one that writes down why.
  - The recorded text sits behind "Read the full reasoning".
  - The plain wording is written by hand for this mockup and labelled. The AI team does not record one yet (data gap).
- **F&O for a beginner:**
  - Three things to know first.
  - What each family suggests: today none, because no F&O strategy has passed testing. A labelled example shows one
    suggestion, one refused by your loss limit and one staying out.
  - Every contract with its NSE code (RELIANCE26OCTFUT, RELIANCE26OCT1160CE) and Buy / Sell, for the future and the
    option chain near the price; the strike nearest today's price is marked, and untraded contracts are greyed.
  - Picking a strike shows its call and put, and a "what if you buy one lot" chart: the most you can lose is what you
    pay, and the price where it starts making money.
  - "Where traders hold contracts" (open contracts by strike).
  - "How big a move options expect" (IV in words).
  - The last three months, with a plain reading.
- **Owner's rules** for every screen (positive and negative cases, beginners, private strategy internals) are now in
  CLAUDE.md and design/system/README.md.

### Doubts (reasoning only)
- **Colours on RSI:** red on both sides of 30–70 marks a fast move, not good or bad. Some apps colour oversold green
  (a "buy" hint). I chose not to, because that would be advice.
- **Buy / Sell on stock contracts opens the order window, which explains that it cannot fill.** Only NIFTY's 3 pm
  snapshot is recorded today. The F&O tool would need stock option snapshots to make these tradable on paper.
- **"Built from this stock's past prices and recent news"** describes the forecast model only in general terms, so
  that nothing private is exposed. Say if even that is too much.

## Proposed, not asked (second round)
Built:
- The strike nearest today's price is marked "≈ today".
- Contracts that did not trade are greyed and say so.
- Each verdict line on the winning card compares with the baselines.

Proposed:
1. A "payoff" chart for the future as well (a straight line; loss without a limit), with the margin once it is
   recorded.
2. A glossary chip next to each term (IV, OI, build-up, strike), opening a one-line meaning.
3. A "simple / detailed" switch for the whole page: beginners see the pictures and the plain lines; detail shows the
   tables.
