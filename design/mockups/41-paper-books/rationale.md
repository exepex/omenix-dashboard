# 41 Paper books (F&O): why it looks like this

- **Three cards side by side, one per book, never a total.** The owner's rule: each paper account is its own
  experiment; currencies and books are never added. On a phone the cards stack.
- **Value first, then the change since the opening value with its sign, glyph and word** (never colour alone), then
  cash, open positions and the open risk against the cap as a bar, so a beginner sees how much of the risk budget is in
  use.
- **Open positions before closed trades:** what can still move matters first. Legs carry a lock and "owner only".
- **Closed trades show before costs, costs and after costs**, then the three owner-timing fills as labels, so the cost
  of acting late is visible on every trade.
- **Every money figure says Paper**; every state is labelled Mock; the source line names the catalog operation.
- Checks: `check_page.js` per state at 1280 and 390 px (no console errors, no external requests, no overflow);
  `check_text.js`: 0 findings. Screenshots: `shot-<state>-1280-full`, `-390-full`, `-390-viewport`.
