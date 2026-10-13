# 36-legal: rationale

- Static HTML with no script: Google's reviewers and crawlers read it without running code; strict CSP.
- One source (`data.json`) for the mockup and the app, so the text never drifts.
- Served by route handlers, not app pages: the gateway deployment 404s `/_next/*`, so the page must be self-contained
  (design system inlined, favicon as a data URI).
- Plain words, short sections, the same Paper and no-real-order wording as the app.
- Shots: `shot-privacy-*` and `shot-terms-*` at 390, 768 and 1280 px (`check_page.js`: no console errors, no external
  requests, no overflow; `check_text.js`: 0 findings).
