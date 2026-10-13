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
