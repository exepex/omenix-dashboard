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
