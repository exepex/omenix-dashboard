# 31-dashboard: changes after sign-off

The signed-off contract is `notes.md` (signed off 13 Oct 2026, as of e8cd360). Every later change and its reason is
listed here, each approved by the owner (through the orchestrator).

- **13 Oct 2026: row 5 (open paper trades, strategies'), "Hybrid (India)" → "Hybrid (both markets)".**
  - Owner's answer: "both". Hybrid is shown in both markets.
  - Reason: the row contradicted the signed-off picture. The Hybrid tab is on Home in India and in the US, and
    hybrid stock strategies are planned in both markets. The judge flagged it as minor (judge 24 and 27).
  - Nothing else changed.

- **13 Oct 2026: W14 (owner's UI feedback), look only; no data, row or contract change.**
  - The design system now owns the section head (`.sec-head`), the sortable header and the interaction rules. Links
    and "see all" links are underlined; buttons and filter chips are bordered; disabled controls are dashed; a plain
    chip is a borderless label. The page's own copies of those rules were removed.
  - Rebuilt with `build.py`. Checks: `check_page.js` (no console errors, no external requests, no overflow) and
    `check_text.js` (0 findings).
  - Claims: `reviews/claude/response_30_w14-ui.md`.

- **15 Oct 2026: the F&O books' risk limit, data only (story P1; owner "2 A"; judge C's C5 verdict).**
  - Each F&O book's `limit_max` goes from Rs 30,000 to Rs 1,50,000, the books' open-risk cap (open positions' maximum
    losses may sum to at most Rs 1,50,000). The books have no Rs 30,000 stress limit. `limit_used` is now described as
    the open positions' maximum losses (story C5).
  - Source: `_platform/home_data.py`. Rebuilt with `build.py`; `api/examples/blocks.json` regenerated (`examples.py
    --check` passes); the web fixture re-synced. Checks: `check_page.js` at 390, 768, 1024 and 1280 px.
  - **Until C5 merges, exepex/trading's main still publishes 30,000** (C2's `max_stress_loss_rs`), so the dashboard
    merges only after C5 (orchestrator, judge 102 addendum 2).
  - Claims: exepex/trading `reviews/claude/response_102_p1-data-catalog.md`.
