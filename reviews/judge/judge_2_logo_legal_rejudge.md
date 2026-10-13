# Judge 2: logo and legal pages, re-judge of judge 1

Independent judge session, 13 Oct 2026. Re-judge of `judge_1_logo_legal.md` (FAIL: should-fix 1 to 3, minor 4 to 8)
under `docs/JUDGE.md` "Judge and builder loop". The builder's fixes are `25e453a` and `3822fd4`, diff `ed21a5a..3822fd4`
(50 text files, 517 PNGs). All builds, servers and browser checks ran on a clean worktree of `3822fd4`
(`/tmp/judge2`), not the shared working tree. The shared tree has uncommitted 35-stock edits from another session,
which I did not touch.

**Verdict: PASS.** Findings 1 to 3 are fixed, and I reproduced each fix myself. Minors 4, 5 and 7 are fixed. Minor 6 is
fixed except for one code comment. Minor 8 stays with the owner. I found six new minor findings and no blocking or
should-fix ones. One limit: the public deployment itself is not live yet. That is the owner's step.
`https://omenix-gateway.vercel.app/privacy` still answers 404 today because it runs an older build (finding 10).

## Per-criterion table (the judge 1 findings)

| # | Criterion (judge 1 finding) | Builder's claim | Judge's own evidence | Result |
|---|---|---|---|---|
| 1 | Public home page on the gateway that links /privacy and /terms; legal logo link not dead; a way to place a Search Console token | `/` rewrites to `/about` in gateway mode; `/about`, `/privacy`, `/terms` public, exact paths, GET/HEAD; token from `MB_GOOGLE_SITE_VERIFICATION` | `next start` with `MB_GATEWAY=1` (built with a test token and a test contact): GET and HEAD `/` answer 200 `text/html` with `x-middleware-rewrite: /about`, the CSP and nosniff headers. The body is byte-identical to `/about`. `?x=1` also gives 200. POST `/`, `/about`, `/privacy` and `/terms` give 404. `/About`, `/index.html` and `/favicon.ico` give 404. `/about/` gives 308 to `/about`. The page carries `<meta name="google-site-verification" content="abcDEF123_-xyzTOKEN">`, no `<script`, and links `/`, `/privacy` and `/terms` (twice each, header and footer). In Playwright: no console errors, one request only. The legal pages' logo link `/` now resolves on the gateway. The other gateway routes are unchanged: `/mcp` GET 405 and POST 503 (no config), `/oauth/authorize` GET 503, `/slack/commands` POST 401 (bad signature), `/india` and `/_next/*` 404. Dashboard mode: `/` still 307 to `/india`, and `/about` 200. Tests: `registry.test.ts:102-108` (GET/HEAD rewrite, POST 404, exact paths, dashboard as usual) and `legal.test.ts:27-35` (links, tag only for a well-formed token, an injection string refused, no marker left). | MET |
| 2 | README "Deployment" and middleware comment updated; exact steps for the owner | README steps for Google; middleware comment updated | `README.md:41-61`: gateway serves `/` (= `/about`), `/privacy`, `/terms`; set `MB_CONTACT_EMAIL` and `MB_GOOGLE_SITE_VERIFICATION` **before** deploying (pages are static); deploy the gateway from this repo's `main`; the four Google Console values and the logo file; Search Console HTML-tag method. `web/middleware.ts:5-6` lists the public pages. I confirmed the owner's failed attempt myself: `/`, `/privacy`, `/terms`, `/about` on `omenix-dashboard.vercel.app` all answer 302 to `vercel.com/sso-api`. So Google saw a login wall, as the builder says. The steps leave out the real host name and what moving the gateway to this repo means (finding 10). | MET (gaps in finding 10, minor) |
| 3 | Screenshots and galleries re-shot with the logo | All 01-12, 30-35, galleries, screens, 36-legal re-shot | 517 of 558 PNGs under `design/` changed. The 41 unchanged ones are 33 brand files (correct), 2 of the 64 `31-dashboard/screens` and 4 `design/system/styleguide-*`. The two screens show no brand area (a phone search sheet and the picks tab; viewed), so they are fine. I looked at 12 random 1280 shots and galleries across 30-35, `02-watchlist/shot-1280-full` and `31-dashboard/gallery/home-1280`: every one shows the logo tile. The 12 `30-shell` 1280 state shots each show the state their name says (blocked, refused, order, closed-order, palette-words, notifications, picks-rule, basket, hovercard, more, flyout, stock-order). The style-guide screenshots still show "OM" (finding 9). | MET for mockups (finding 9 minor) |
| 4 | 01-12 tile uses `--mb-brand-tile` | Token added to their embedded `:root` | In all twelve `page.html`: the token is defined once, used once, and `--mb-sidebar-active` no longer sits on `.mb-brand-mark`. `design/system/components.css:23` uses the same token, so a rebuild would keep it. | MET |
| 5 | Privacy wording: sign-in use, access, Drive check | Reworded | `data.json`: "used only to check that the account may enter. A refused GitHub sign-in's account name is written to the security log" (matches `app/mcp/_lib/oauth.ts:137`, checked in judge 1). "Access is limited to the owner and the people the owner invites." Drive: "to check it is a complete, valid file". All three match the code as judged in judge 1. | MET |
| 6 | "request time" corrected to build time | Corrected | `data.json` `_note`, the `build.py` docstring and `notes.md` now say build time. `build.py:28` still says "The app fills the contact at request time" (finding 11). | PARTLY (minor) |
| 7 | Legal links on every app state | Moved into the frame | `web/components/frame/frame.tsx:22,46`. Dashboard-mode `next start` without database credentials, 15 routes in Playwright (India and US Home, watchlist, companies, paper-portfolios, rule-vs-ai, track-record, news, assistant, strategy-lab, help, gallery, stock, stock strategies, US watchlist): each has exactly one visible `.mb-legal-links` with `/privacy,/terms`, including the 13 error-state pages that have no `<footer>`. 390 px Home: links sit above the tab bar, no horizontal overflow (viewed). | MET |
| 8 | lockup-dark = lockup-mono-white | For the owner | Unchanged, as stated. | Owner's call |
| — | Checks | typecheck, 372/372, build, code size, design sync, check_text 0 | Clean worktree: `npm ci`, typecheck pass. **372/372** tests pass. Build passes in both gateway and dashboard mode (`/about`, `/privacy`, `/terms` static ○). `check_code_size.mjs`: "every file within 350 lines or its listed size". `sync-design.mjs --check`: "design copies current". `check_text.js`: 0 findings on 30-35 and on 36-legal index, privacy and terms. `check_page.js`: no console errors, overflow or external requests on 36-legal index, privacy and terms, and on 01, 07, 31 and 35. Rebuilding `31-dashboard/build.py` and `36-legal/build.py` gives byte-identical output (`git status` clean). | MET |

## Claims vs reality

- *"Gateway mode now rewrites GET/HEAD "/" to /about, a static public home page ... that shows the logo and links
  /privacy and /terms."* True (row 1).
- *"/about, /privacy, /terms are public in gateway mode, exact paths only."* True. `/about/` gives a 308 from Next's
  trailing-slash rule to the exact path, which is harmless.
- *"Google Search Console HTML-tag verification via env MB_GOOGLE_SITE_VERIFICATION (validated token -> meta tag,
  read at build since routes are force-static)."* True.
  - `TOKEN = /^[A-Za-z0-9_-]{10,100}$/` (`legal.ts:14`) refuses quotes and angle brackets, so nothing can be
    injected.
  - A build with the variable set served the tag. The test proves the tag is left out for an unset, short or
    injected value.
  - The tag also lands on /privacy and /terms (one `<!--@@VERIFY@@-->` in the shared template). That is harmless.
- *"Tests in web/lib/legal/tests and web/lib/tools/tests/registry.test.ts."* True. The tests test the claim: a
  rewrite target is asserted, not just "not 404".
- *"README 'Deployment' now has step-by-step for Google ...; web/middleware.ts comment updated."* True, with the gaps in
  finding 10.
- *"The owner tried https://omenix-dashboard.vercel.app and Google rejected it; every path there returns 302 to Vercel
  SSO."* Reproduced today for `/`, `/privacy`, `/terms` and `/about`. Strong evidence that Google's "not registered"
  and "insufficient content" errors came from the login wall.
  - The "logo does not uniquely identify your brand" error is not explained by the wall. Reasoning only: Google often
    raises it when the home page does not show the same logo and name. The new home page does show both. Only a new
    Google review will tell.
- *"All screenshots ... re-shot with the logo."* True for the mockups. Not for the style guide's own four PNGs, which
  were not claimed (finding 9).
- *"01-12 pages now use --mb-brand-tile."* True.
- *"Privacy wording fixed."* True.
- *"'request time' corrected to build time."* True except `build.py:28` (finding 11).
- *"Legal links moved into the app frame ...; removed from HomeFooter/PageFooter."* True. The links are removed from
  `page-head.tsx` and `home-footer.tsx`, and no page shows them twice (one `.mb-legal-links` per route). The
  mockups keep the links inside the footer (`_platform/js/2-frame.js:62`). That looks the same and only renames the
  class, consistently in `shell.css` and `page.css`.
- *"Checks: typecheck, 372/372 tests, build, code size, design sync, check_text 0 findings."* All reproduced.

## Project-rule check

- **Tokens only:** met. The new `.mb-legal-links` rule uses `--md-sys-*` roles only.
- **350-line limit:** met. `gateway.ts`, `legal.ts`, `frame.tsx` and `build.py` (90 lines) are all small.
- **SOLID, DRY, KISS:** met. One source (`36-legal/data.json`) feeds the mockup and the app. One `legalResponse`
  serves all three routes. The gateway rule is one line plus a test. No dead code: the old `footer .legal` rule is
  removed.
- **Hard lines:** met. No secrets, no e-mail address and no token in the repository; the test values are dummies.
  Nothing touches orders.
- **Mockup folder rule (36-legal):** met. It has `data.json`, `template.html`, a deterministic `build.py` (verified),
  `notes.md`, `rationale.md`, and shots at 390, 768 and 1280 for all three pages.
- **Conversation log:** updated. The owner's Google errors are quoted and the reply is condensed.
- **Builder's proof in the repository:** there is no `reviews/claude/response_<n>_*.md` for this round. The proof
  sits in the commit messages and the conversation log. That is acceptable for `JUDGE.md` step 2, but weaker than the
  CLAUDE.md "everything for the other AI goes in the repository" habit (finding 13).

## Findings

Judge 1 findings: 1, 2, 3, 4, 5 and 7 are **accepted as fixed**. 6 is accepted except one comment, now finding 11.
8 is left to the owner.

New findings, all minor:

9. **Minor: the style guide's screenshots still show "OM".**
   - Affected: `design/system/styleguide-1280-full.png`, `styleguide-390-full.png` and `styleguide-390-viewport.png`,
     last changed in `a976886`; I viewed the 1280 crop.
   - `styleguide.html` itself has the logo (line 1185). The PNGs also predate the rail layout, so this staleness is
     older than this story.
   - `design/system/README.md:12` names them as the style guide's screenshots.
   - Fix: re-shoot the three PNGs from `styleguide.html`. Check whether `styleguide-dark-home-390.png` also needs it.
10. **Minor, with an owner decision: the README steps omit two facts the owner needs.**
    - (a) The real gateway host is fixed in code as `https://omenix-gateway.vercel.app` (`web/app/mcp/_lib/config.ts:2`,
      `GATEWAY_URL`). I checked it today: it is public and serves this middleware's 404 for `/`, `/about`, `/privacy`
      and `/terms`, and 405 for GET `/mcp`. So it runs a build without these pages. The README says only
      `<gateway-host>`; it should name this host.
    - (b) "Deploy the gateway project from this repository's `main`" moves the gateway's Slack, `/mcp` and OAuth code
      to this repository's `main` before the cutover. CLAUDE.md says production still deploys from the stock
      repository's `web/`.
      - Reasoning only: this repository has no gateway setup docs (`docs/ws/b5.md`, cited in `config.ts:1`, is not
        here), so the gateway project most likely deploys from the stock repository today.
      - This is a partial cutover. The README should say so, along with the Vercel step it needs (the project's Git
        repository and root directory `web`). The owner should decide it knowingly.
    - (c) Step order: the Search Console token exists only after the property is added in Search Console. The real
      order is: add the property and copy the token, set both variables, deploy, then press Verify. Step 4's "then
      redeploy" is not needed if step 1 is done first.
    - Evidence: curl results above; `README.md:50-61`.
11. **Minor: one stale "request time" comment.**
    - Where: `design/mockups/36-legal/build.py:28`, "The app fills the contact at request time".
    - The routes are `force-static`, so the contact is filled when the deployment is built.
    - Fix: change the comment to "when the deployment is built".
12. **Minor: home page wording.**
    - The lead says "run by one person, its owner, for their own use", while "Who can use it" says "the owner and
      people the owner invites". The privacy policy's lead says "for their own use and for the few people they
      invite".
    - Fix: use the privacy lead's wording on the home page.
    - Also check that the page's name "Omenix" (title "About Omenix · Omenix") matches the app name on the Google
      consent screen, because Google compares them. This is the owner's check: the consent screen is not in the
      repository.
13. **Minor (process): no builder response file for this round.**
    - The fixes and the pushback-free answers live only in the commit messages and in `conversations/2026-10-13.md`.
    - Fix: add `reviews/claude/response_<n>_logo_legal.md` mapping each judge 1 finding to its commit and proof.
14. **Minor, pre-existing, not introduced here: three 30-shell phone state shots are the plain page.**
    - Affected: `shot-hovercard-390-viewport.png`, `shot-picks-rule-390-viewport.png` and
      `shot-picks-hybrid-390-viewport.png`. Each is byte-identical (md5 `e994dd03…`) to `shot-390-viewport.png`, and
      was identical at `ed21a5a` too.
    - Their names promise states that the phone layout does not open this way: no hover, and the picks are a tab
      there.
    - Fix: drop these three files, or shoot the phone equivalents. The picks tab already exists as
      `31-dashboard/screens/42-picks-phone-tab-phone.png`.

### Note for the owner (not a finding against this story; reasoning and some evidence)

- **The Drive uploader asks for Google's full `drive` scope** (`exepex/trading` `fno/constants.py:77`, checked in
  judge 1).
  - Google lists `auth/drive` as a **restricted** scope. Some evidence: Google's OAuth scope documentation, not
    re-fetched today.
  - Publishing an app with a restricted scope needs, beyond the brand check these pages serve, a restricted-scope
    review and possibly a yearly third-party security assessment.
  - The uploader only lists, creates and uploads in its own folder, and reads back files it made. That fits the
    non-sensitive `drive.file` scope (reasoning only; it needs a test in `exepex/trading`, for example whether files
    uploaded before the switch stay visible).
  - Alternative: for personal use, keep the app in "Testing" or unverified with the owner as the only user.
- **The 01-12 `build.py` scripts cannot run on a clean copy.** They fail with `FileNotFoundError: design/catalogue/
  market_status.json`, which is not in the repository. So the hand edits to their `page.html` cannot be reproduced
  from `build.py`. This is older than this story. Their shared CSS source (`components.css`) already carries the same
  token.

Re-judge: none needed for a PASS. Findings 9 to 14 are optional cleanups. Finding 10 (b) is a decision for the owner
before deploying the gateway from this repository.
