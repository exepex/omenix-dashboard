# 46 Weather history: why it looks like this

- **Counts first, as numbers and one bar:** a beginner sees "mostly calm" at a glance; each part of the bar is also
  named in its label (never colour alone), and "not scored" says it blocks like RED.
- **Live against rebuilt right under the counts,** with a how-to line: the most likely misreading is treating a
  rebuilt history as a track record.
- **Session by session, one strip per month:** the same tile as the weather page's "last sessions" (date, colour with
  glyph and word, "live" or "rebuilt"), so the two pages read alike.
- **No chances, no outcomes:** the chances wait for the owner (notes), and the outcomes belong to the weather page's
  scored record.
- **Every state is labelled Mock;** the source line names the catalog operation.
- Checks: `check_page.js` per state at 1280 and 390 px (no console errors, no external requests, no overflow);
  `check_text.js`: 0 findings. Screenshots: `shot-<state>-1280-full`, `-390-full`, `-390-viewport`.
