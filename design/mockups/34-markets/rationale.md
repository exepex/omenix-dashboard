# 34-markets: rationale

Screen 2 of `design/PLATFORM_DESIGN.md` section 4, the market overview. It was built on 13 Oct 2026 while the owner
was offline, under the orchestrator's exception (go on after the screener without waiting for its sign-off).
Status: **for the owner's review**. Its decisions are listed in notes.md.

**Files:**
- `data.json`, built from real records;
- `template.html`, `build.py`, `page.html`;
- `fetch_nse_indices.py`, `fetch_stocktool.py`, `source/`;
- `states.json`, `gallery/`, `gallery.html`;
- `screens/`: 31 numbered plain pictures.

**Checks:**
- `check_page.js`: no console errors, no external requests, no overflow;
- `check_text.js`: twelve widths and five states, 0 findings;
- `shoot_states.js`: 17 states, 28 shots, no problems.

## Questions a retail user asks, and where the page answers them
1. **How did the market do?**
   - NIFTY 50 at 22,363.35, −4.56% over the month, with its chart, low and high, and the 52-week range.
   - Any period from 1D to 1Y; tap any broad index to chart it.
2. **Is the market expensive?**
   - NSE's own P/E 19.12, P/B 2.75 and dividend yield 1.53%, each in words ("price is 19.1 times a year's
     earnings").
3. **Is the move broad or just a few big names?**
   - 1,405 up and 1,476 down today.
   - New 52-week highs and lows, and the share of stocks up over the month.
   - A plain sentence when near-lows outnumber near-highs: "a weak market underneath".
4. **Which sectors led?**
   - NSE's sector indices as a heat map (best first, sign and number on every tile).
   - Or the Nifty 500 grouped by industry (ours).
5. **Who moved most?**
   - Gainers, losers, most traded, with value traded and volume against its usual.
   - From the Nifty 500 or all NSE (liquid stocks only).
6. **What are the big investors doing?**
   - FII/FPI and DII net buying or selling per day, as bars with ₹ crore values.
   - The 5-day totals in a sentence, marked provisional.
7. **How nervous is the market? What do options say?**
   - India VIX against its 3-month middle.
   - For each index option: IV against its 3-month range, put-call ratio, move priced in, futures build-up.
   - A link to the NIFTY chain.
8. **What happened abroad, and to the rupee, oil and gold?**
   - World markets, USD/INR, Brent, gold, the US 10-year yield, each with its own close date.
9. **What is coming?**
   - Results, ex-dividend dates and NIFTY expiries, nearest first.
   - In the US, also the economy (US CPI on 13 Oct, from the stock tool's session reading).
10. **US:**
    - The S&P 500 fund and VIX, our 20 companies, US sector funds, the Treasury yield curve in words
      (normal or inverted), world, what is coming.
    - No flows (no source) and no F&O (India only).

## Choices and why
- **One period switch for the whole page**, so the index list, the sector tiles and the world tiles always compare the
  same span.
- **Volatility is drawn in the neutral chart colour.** A rising VIX is not "good", so it is not green.
- **Heat tiles never rely on colour:** the sign and number are always there. The shade only adds strength, with
  thresholds by period: 1% / 2% for a day, 2% / 4% for a week, 4% / 8% for longer.
- **The picks panel starts hidden** here, as on the chain and the screener. The page needs the width; the top-bar
  button shows the panel.

## What I am not sure of
- **Ten sections may be long on a phone** (nine phone screens). A "jump to" row of chips could help. I did not add
  one, so as not to invent a pattern without the owner. Reasoning only.
- **The industry view** averages each Nifty 500 industry's stocks equally. A market-cap weighting needs share counts,
  which NSE's daily files do not have, so equal weighting is what the data allows. The page says so.
