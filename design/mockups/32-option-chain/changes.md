# 32-option-chain: changes after sign-off

The signed-off contract is `notes.md` (signed off 13 Oct 2026, as of 9d9c401). Every later change and its reason is
listed here.

- **13 Oct 2026: W14 (owner's UI feedback), look only; no data, row or contract change.**
  - The design system now owns the section head (`.sec-head`), the sortable header and the interaction rules. Links
    are underlined; buttons and filter chips are bordered; disabled controls are dashed; a plain chip is a borderless
    label. The page's own copies of the section-head rules were removed.
  - Rebuilt with `build.py`. Checks: `check_page.js` (no console errors, no external requests, no overflow) and
    `check_text.js` (0 findings).
  - Claims: `reviews/claude/response_30_w14-ui.md`.
