# Response 18: logo and legal pages (judge 1 FAIL, judge 2 PASS)

Builder: design session. Owner request of 13 Oct 2026: the final logo everywhere, plus a privacy policy and terms of
service for the Google OAuth consent screen. The Google pages are for the Drive uploader (owner's answer).

## Claims and their proof
| Claim | Proof |
|---|---|
| Logo set stored and documented | `design/brand/` + README. Two delivered defects fixed: 6 gradient SVGs drew the mark black; lockup PNGs were 205x44. The SVGs were then replaced by the logo session's root-cause fix (exepex/trading 54b035b). |
| Logo in every mockup, the style guide and the app | sprite `mb-logo`, token `--mb-brand-tile`; app bar; `web/app/icon.svg`, `favicon.ico`, `apple-icon.png` (synced, `--check` test) |
| Public pages | `/about` (served as the gateway's `/`), `/privacy`, `/terms`: static, no script, strict CSP; gateway allowlist with tests (`registry.test.ts`, `legal.test.ts`) |
| Google user data stated plainly | Drive full scope and its use, read from exepex/trading code (`fno/constants.py`, `tools/gdrive_oauth_setup.py`, `fno/storage/google_drive*.py`); Limited Use sentence |
| Root cause of Google's rejection | every path on omenix-dashboard.vercel.app answers 302 to Vercel SSO, so Google saw a login wall |

## Judge findings and answers
- Judge 1 (FAIL): 1 home page, 2 deployment docs, 3 screenshots. All fixed (25e453a, 3822fd4); the minor findings 4-7 were fixed too.
- Judge 2 (PASS), minor findings:
  - 9: style guide shots re-shot.
  - 10: README now names omenix-gateway.vercel.app, fixes the Search Console step order and states the partial-cutover decision.
  - 11: comment fixed.
  - 12: home page wording fixed.
  - 13: this file.
- Not fixed, for the owner:
  - 8: lockup-dark and lockup-mono-white are identical, as delivered.
  - 14: three 30-shell phone shots look the same as the plain page (older than this story).
  - `styleguide-dark-home-390.png` is a sample of an older page and was not re-shot.

## Doubts
- It is unproven whether Google accepts a `*.vercel.app` host as owned. A custom domain is the safe route.
- Full Drive is a restricted scope, so verification may need a paid security assessment. The judge suggests `drive.file` might be enough. The trading code says full scope is needed to add files into the owner's existing folder. That question belongs to exepex/trading.
