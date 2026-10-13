# 32-option-chain: rationale

Mockup order item 3 of `design/PLATFORM_DESIGN.md` section 9 (screen 6, option chain). Status: **signed off 13 Oct 2026 (owner)**,
second version, as of commit 9d9c401; its notes.md is the frozen contract.

Files:
- `data.json`, built from real NSE files (notes.md);
- `template.html`, `build.py`, `page.html`;
- `fetch_nse.py` and `source/`;
- `states.json`, `gallery/`, `gallery.html`;
- `screens/`: 30 numbered plain pictures.

Checks:
- `check_page.js`: no console errors, no external requests, no overflow;
- `check_text.js`: twelve widths and six states, 0 findings;
- `shoot_states.js`: 21 states, 30 shots, no problems.

## First version, rejected by the owner (13 Oct 2026)
The first version used generated example prices and showed one table with a row of figures.

The owner asked whether these graphs are enough for a normal retail user. They asked what the strategy-builder button
is for. They asked for real labels and values, not mock data. They asked how much history to give (3 days, a week, a
month). The verdict: "not sufficient".

All four points were right:
- The first version answered "what are the numbers", not "what should I understand".
- It used made-up prices, although NSE's files were reachable all along.
- The header button "Strategy builder" was unexplained.
- It had no history at all.

## Questions a retail user asks, and where the page answers them
1. **Where is NIFTY, and where has it been?**
   - NIFTY card: the close and the day's change.
   - A line chart over 5 days, 1 month or 3 months, with "one month before: 23,431.50 (−4.56%)".
2. **How much do the options expect NIFTY to move by expiry?**
   - "Range priced in" card: ±524 (±2.3%), NIFTY between 21,840 and 22,887 on 27 Oct.
   - It is the ATM straddle, explained in words.
3. **Where are other traders positioned?**
   - "Where traders hold positions": most calls above NIFTY at 23,500, most puts below at 22,000.
   - What was added most today, and max pain.
   - Said to be "a crowd reading, not a forecast".
4. **Is the mood fearful or calm? Are options dear?**
   - Put-call ratio, with its last month.
   - India VIX against its 3-month middle: "options cost more than usual".
5. **Which expiry, and how long is left?**
   - Every NSE expiry (owner's choice), marked weekly or monthly with days left.
   - The 27 Oct monthly expiry opens by default.
6. **What does an option cost me?**
   - The Simple view (the default) shows "1 lot costs" in rupees next to every price.
   - The lot (65) is in the header.
7. **Which side do I need?**
   - The column headers say it: "Calls · gain if NIFTY rises", "Puts · gain if NIFTY falls".
   - The legend explains "in the money" and "ATM" in words.
8. **If I buy or sell this one option, what happens?** Tap a price for the contract view:
   - If you buy 1 lot, you pay ₹16,452, the most you can lose; you gain if NIFTY ends above 22,653.10 (+1.30%).
   - The chance is about 35% (risk-neutral, not a forecast).
   - If you sell, your loss has no limit, and margin is needed.
9. **How did this option move?**
   - The contract's price and open interest over 5D, 1M, 3M or its whole life.
   - Days without trades are skipped.
10. **What do OI, IV, delta and theta mean?**
    - "The numbers, in words": for example, "about ₹0.52 for a 1-point NIFTY move", "about ₹10.07 lost a day as time
      passes" (the 27 Oct 22,400 call).
    - Column headers carry tips.
11. **Can I trade it now? If not, why not?**
    - Buy and Sell are grey and say why: the market is closed, or the 3 pm bid and ask are not published yet.
12. **How do I combine options (a spread)?**
    - "+" (Combine) adds a contract to "Your combination".
    - The combination shows what you receive or pay a lot at the closes.
    - "See profit and loss" opens the strategy builder (screen 33): the joint profit and loss at expiry, the most you
      can lose and gain, and the break-evens.
    - This replaces the unexplained header button.
13. **Is any of this live? Where is it from?**
    - One line of chips: the NSE close of Mon 12 Oct; bid and ask not published yet; IV, Greeks and chances are ours;
      not live; our F&O books hold no position.
14. **Who else is in this?**
    - "Our F&O books: no position (no approved strategy yet)".

## Choices and why
- **Simple, Detailed, Greeks.**
  - A retail user starts with OI, the cost of a lot and the price.
  - Detailed adds OI change, volume and IV; Greeks is for those who want it.
  - Three columns a side on phones: price, change and OI.
- **History 5D / 1M / 3M / Life** (owner's choice).
  - 1 month by default: a monthly contract's own life is about 3 months.
  - Weekly contracts live for days.
- **The picks panel starts hidden here.** The chain needs the width; the top-bar button shows the panel. The table
  then drops columns by its own width (a size container), never by the window.
- **Real NSE data of 12 Oct** (owner's choice), with the clock moved to it. Weekly expiries are shown (owner's choice)
  but marked "end of day only; the F&O tool does not trade weeklies".

## What I am not sure of
- **The four cards might be too much for a daily user.** They could fold into one line after the first visit. I kept
  them because the owner asked for a retail user's view. Reasoning only.
- **The call/put IV gap** (notes.md finding) comes from the F&O tool's method, not from the page. I show it as computed
  and flag it to the F&O tool instead of hiding it.
- **"Where traders hold positions"** uses the common ceiling and floor reading. It is a widely used heuristic with weak
  evidence, so the page says "a crowd reading, not a forecast".
