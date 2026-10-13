# 33-screener: rationale

Screen 8 of `design/PLATFORM_DESIGN.md` section 4. The owner moved the screener ahead of the option chain (32, paused)
on 13 Oct 2026. Status: **for the owner's review**.

**Owner's decisions (13 Oct 2026):**
- the whole market, with the tools' signals where they follow a company;
- history 1D / 1W / 1M / 3M / 1Y;
- real data only.

**Files:**
- `data.json`, built from real records (notes.md);
- `template.html`, `build.py`, `page.html`;
- `fetch_nse.py`, `fetch_tracked.py`, `source/`;
- `states.json`, `gallery/`, `gallery.html`;
- `screens/`: 32 numbered plain pictures.

**Checks:**
- `check_page.js`: no console errors, no external requests, no overflow;
- `check_text.js`: twelve widths and six states, 0 findings;
- `shoot_states.js`: 20 states, 33 shots, no problems.

## Questions a retail user asks, and where the page answers them
1. **Is the market up or down today?**
   - "Today: up and down": 1,405 up, 1,476 down, 43 unchanged, of 2,924, with a bar.
2. **What is breaking out, what is breaking down?**
   - Near 52-week high (50), near 52-week low (254), volume 3× usual (64).
   - Each tile applies its screen.
3. **Give me a list to start from.**
   - Ten ready-made screens, each with its count and a one-line meaning in its tip.
   - Examples: up 10%+ in a month, high delivery, RSI under 30, our strategies 3+ buy, results within 7 days.
4. **Over which period?**
   - 1D, 1W, 1M (default), 3M or 1Y changes the change column and the "change at least" filter.
5. **Only the stocks I care about.**
   - All NSE, Nifty 500, F&O stocks, or the 20 our tools follow.
   - Filters: price, change, volume × usual, delivery, RSI.
6. **Is this move real or thin?**
   - Volume against its 20-day average, and delivery % (shares taken for keeping, not traded within the day).
7. **Where is it in its year?**
   - The 52-week range bar: 0% at the low, 100% at the high.
8. **What do our own tools think?**
   - For followed companies: how many strategies buy for the next 5 sessions, and the model's chance.
   - Results within 14 days are shown instead of the chance.
   - For others: "—", with the reason.
9. **Can I trade it?**
   - Followed companies: Buy and Sell open the order window.
   - Others: grey, and the button says why (no price checks to fill a paper order).
10. **F&O: who is building positions?**
    - Four build-up tiles, each with its meaning in words: price and open interest up = new buyers, and so on.
11. **F&O: are options cheap or dear here?**
    - ATM IV against its own 3-month range, as a bar and a percentage.
12. **F&O: how big a move is priced in by expiry? What is the lot?**
    - "Move priced in" (±% by 27 Oct) and the lot from NSE.
13. **Is this live? Where is it from?**
    - Chips: the close of Mon 12 Oct; sectors from the Nifty 500 list; computed by us; our tools for followed
      companies only; not live.

## Choices and why
- **The default sort is value traded today** (price × volume), so the most active, liquid stocks come first, not the
  alphabet.
- **The picks panel starts hidden** here, as on the chain: results need the width. The table drops low-priority
  columns by its own width (delivery and RSI; put-call ratio and lot in F&O), then turns into cards below 760 px.
- **No valuation columns yet.** P/E and market cap are not in NSE's daily files, so the whole-market list cannot
  have them. For the followed companies a trailing P/E is possible from the stock tool's financials (15 of 20; notes.md,
  corrected). It is a candidate for the owner's review rather than added unasked.
- **Sectors only for the Nifty 500.** NSE's files give no industry for the other 2,400 stocks, so the page says
  where sectors come from.

## What I am not sure of
- **10 ready-made screens may be too many on a phone.** They wrap to three rows. A "More screens" fold is the
  alternative. Reasoning only.
- **The thresholds are common retail conventions, not tested values:** within 2% of the 52-week high, volume 3× usual,
  delivery 70%+. They are in notes.md, so they can be changed in one place.
- **The build-up labels** (long build-up and the others) are the standard Indian broker reading of price and open
  interest. They are a description, not a forecast, and the tips say so.
