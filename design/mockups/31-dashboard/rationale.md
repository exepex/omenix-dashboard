# 31-dashboard: rationale

Mockup order item 2 of `design/PLATFORM_DESIGN.md` section 9 (screen 1, "Dashboard, home after login"), redesigned
from the owner's feedback of 13 Oct 2026. Supersedes the layout of `01-home` (kept unchanged: the web app and its
tests read it). Status: **for the owner's review**.

Files: `data.json` (Mock), `template.html`, `build.py` (deterministic, `design/mockups/_platform/`), `page.html`,
`notes.md`; screenshots from `node design/system/check_page.js` (no console errors, no external requests, no
horizontal overflow): `shot-1280-full`, `shot-390-full`, `shot-390-viewport` (India, light), `shot-dark-*`,
`shot-us-*` (no F&O element anywhere), and states `shot-quicksearch-*` (`#qs=nifty%2024`), `shot-us-quicksearch-*`,
`shot-basket-*` (iron fly, credit), `shot-basket-debit-*` (bull call spread), `shot-idea-order-*` (Paper buy from an
idea card).

## The owner's ask
> "Quick search ... buy and sell order even from the quick search ... key information which is relevant ... high
> potential trades or high potential FNOs where user can quickly buy them right from the screen ... a slider or a
> small section of stocks and a small section of FNOs ... elegant, sharp corners and more materialized ... think
> from a user usage and user journey point of view." And: no informational blocks on top.

## The journey, top to bottom (each section answers one question)
1. **Where am I?** One line: "Dashboard", the session (NSE closed at 15:30, next session 09:15), "Updated 15:40
   IST", Paper and Mock tags. No banner.
2. **I know what I want.** The quick-search block: type "reliance" or "nifty 24800 ce", see price, change and as-of,
   press **B** or **S** on the result (or Enter for the quick view). Tabs All · Stocks · F&O. Recent chips under it.
   (Kite's search-and-trade, Groww's prominent search.)
3. **How am I doing?** One tile per paper account with value and today's change; never summed, INR and USD never
   mixed. On a phone the tiles swipe.
4. **What could I do?** "Top stock ideas" and "Top F&O ideas" (India): swipeable cards with a 0-100 score ring, the
   signal in words ("Buy signal: 12 of 15 strategies buy at N+3"), chance of a rise, target after costs, 80% range,
   and one big **Paper buy** (stocks) or **Paper basket** (F&O: all legs in one paper order with the same limit
   checks). A "No trade" decision stays in the F&O row in red with its reason, because "do nothing" is advice too.
5. **What needs me?** Open positions with B and S and their P&L; "Needs attention" (near a stop, results ahead, a
   fired alert); "At risk now" per account, linking to Risk.
6. **What happened today?** Each tool's decision (tick, cross or dash plus the word) and a compact market card
   (indices with sparklines, top gainers and losers, breadth).
7. **What is coming?** The week's events (results, RBI, expiry) and three top news items with their verification.

## Decisions (and why)
- **Ideas say "Not proven yet · 16 of ~300 trades" in the section head, not a banner.** The owner's rule since
  01-home: no signal is shown as strong until a strategy is proven, so every idea uses the lighter "okay" green
  (YES-ok), never the dark "strong" green. Strong evidence: this is the stock tool's go-live bar.
- **F&O ideas are NIFTY monthly structures only,** because paper F&O orders fill only from the recorded NIFTY
  monthly 3 pm snapshot. The probability of profit says "RN" (risk-neutral: what prices imply, not our forecast).
- **Ideas fit the limits.** Each F&O idea is sized to 1 lot inside the Rs 10,000 maximum loss; the basket checks
  again with charges before it can be placed.
- **B and S everywhere they help:** quick search, global search, positions, watchlist, hover card. Strategy books
  are never traded by hand; B and S always trade the Manual account.
- **Sharp 4 px corners, white cards on a grey page, coloured top or left rules** for idea cards and account tiles:
  the "elegant, sharper, more Material" ask, without new colours (tokens only).
- **Allocation donut left out (deviation from PLATFORM_DESIGN.md screen 1).** Per account it is mostly cash today,
  and a market-wide donut would merge separate accounts; it belongs on Portfolio › Accounts and funds. Reasoning only.
- **Market overview kept small** (three indices, movers, breadth): the full view is the Markets screen (39).

## Open points for the owner
- The 0-100 score's formula (notes.md) needs agreement and has to be published by the backends.
- Should "Top ideas" also show sell (avoid) candidates? Today it shows buys, plus F&O "no trade" decisions.
