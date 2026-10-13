# 30-shell: changes after sign-off

The signed-off contract is `notes.md`. Every later change and its reason is listed here, for the owner (through the orchestrator).

- **13 Oct 2026: NIFTY lot 75 → 65 in the example contracts** (option and future names, basket credit and maximum loss,
  short-option margin example 1,18,000 → 1,02,000). Reason: NSE's own F&O file says 65 (`NewBrdLotQty`, every day
  checked from 1 Jun to 12 Oct 2026), and so does the F&O tool's config. The contract fields are unchanged.
- **13 Oct 2026: the hover card's IV tip** now says "computed by us from the end-of-day close". It used to say "from the
  snapshot". Reason: the F&O tool computes IV from closes only (story B1), and it keeps quote-based IV apart.
- **13 Oct 2026: page hooks for 32-option-chain**, which change no field:
  - a page can supply its own drawer (`drawer=page:<id>`);
  - a page can name its data in the footer (`dataLabel`);
  - the rail's "Option chain" opens 32, with the shortcut `g c`.
