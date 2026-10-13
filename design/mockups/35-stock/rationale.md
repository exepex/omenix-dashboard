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
