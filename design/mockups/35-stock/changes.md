# 35-stock: changes after sign-off

The signed-off contract is `notes.md` (signed off 13 Oct 2026, as of 7b10cc0). Every later change and its reason is
listed here, each approved by the owner.

- **13 Oct 2026: judge 50 (FAIL, one should-fix), fixed; a unit correction and a contract clean-up, no new owner
  sign-off needed (orchestrator).**
  1. **Currency.** The forecast line under the chart hard-coded ₹, so the US page read "middle ₹229.09". Every amount
     on the page now goes through the market's money format (`cur`: ₹ for India, $ for the US). The same fix applies
     to the F&O and financials text. New check: `node design/system/check_currency.js design/mockups/35-stock/page.html
     <US states> -- <India states>` fails on a ₹ in a US state or a $ amount in an India state. It passes on 9 US and
     7 India states, and it fails on the version before the fix.
  2. **Display names only.** The payload no longer carries the strategies' internal ids (the `tools.names` map of id
     to display name, unused on screen). Strategies are served by family and display name only.

- **13 Oct 2026: W14 (owner's UI feedback), look only; no data, row or contract change.**
  - The design system now owns the section head (`.sec-head`), the sortable header and the interaction rules. Links
    and "see all" links are underlined; buttons and filter chips are bordered; disabled controls are dashed; a plain
    chip is a borderless label. The page's own copies of those rules were removed.
  - Rebuilt with `build.py`. Checks: `check_page.js` (no console errors, no external requests, no overflow) and
    `check_text.js` (0 findings).
  - Claims: `reviews/claude/response_30_w14-ui.md`.
