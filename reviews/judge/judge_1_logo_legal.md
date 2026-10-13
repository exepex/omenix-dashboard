# Judge 1: logo everywhere, public privacy policy and terms of service

Independent judge session, 13 Oct 2026. Story: commit `fa62154` ("Logo in every mockup and the app; public privacy
policy and terms of service pages"), diff `b7a18cc..fa62154`. While I was judging, `main` moved to `ed21a5a`, which adds
three follow-ups to this story: `a7ec34d` (privacy policy Google section rewritten for the Drive uploader), `902ac84`
(all 21 brand SVGs replaced by the logo session's regenerated set) and `928ba41` (legal pages resynced into the app).
I judged the story **as it stands at `ed21a5a`**, and checked `fa62154` alone where it matters. All builds and browser
checks ran on clean `git archive` copies in my scratchpad, so neither the shared working tree nor its `.next` folder
affected them.

**Verdict: FAIL.** Three should-fix findings (1 to 3), no blocking ones. The repository work is sound: logo files,
the logo on the pages, /privacy and /terms, the gateway allowlist, the tests and the project rules all check out. The
owner's stated goal is to hand Google working public links. That goal is not met yet: the public deployment has no
home page, and the pages' own logo link leads to a 404 there. The screenshots also still show the old "OM" mark.

## Per-criterion table

| # | Criterion | Builder's claim | Judge's own evidence | Result |
|---|---|---|---|---|
| 1 | Logo files in `design/brand/` with a README naming each file's use | Set stored, README per folder | 57 files in 9 folders plus `README.md` and `render.js`; the README table names the use of every folder and file. PNG sizes read from the IHDR headers match their names (e.g. lockup 600x129 and 2048x440, oauth 120x120, favicon 16/32/48, apple 180). | MET |
| 2 | Logo replaces "OM" in every mockup page.html (01-12, 30-35), the style guide and 36-legal; no external request | Done | Every `page.html` in 01-12 and 30-35, `styleguide.html`, `privacy.html` and `terms.html` holds the `id="mb-logo"` symbol once and uses it (4 or 5 references each). No "OM" text mark is left in any HTML, JS, TS or Python source. `check_page.js` at 390/768/1280 on 30-35, both legal pages and the style guide, plus spot checks on 01, 02, 07 and 12: no console errors, no external requests, no overflow. I looked at the 1280 px renders of 36-legal, 31-dashboard and 02-watchlist: the tile shows the mark. The screenshots and galleries are stale (finding 3). | MET |
| 3 | App bar shows the logo; logo used as favicon, icon and apple-icon; old chart-line favicon gone | Done | `web/components/frame/app-bar.tsx` uses `<use href="#mb-logo">`. The `icons` data URI is removed from `web/app/layout.tsx`. `web/app/icon.svg`, `favicon.ico` and `apple-icon.png` are byte copies of `design/brand/favicon/` (`sync-design.mjs --check`: "design copies current"). In a running build (dashboard mode), Playwright sees `<link>` tags `/favicon.ico /icon.svg?... /apple-icon.png?...`, and all three answer 200 with the right content type. | MET |
| 4 | /privacy and /terms: 200 HTML with the logo, public on the gateway, linked from every app footer and every 30-35 mockup footer | Done | `next start` with `MB_GATEWAY=1`: GET and HEAD of /privacy and /terms answer 200 `text/html` with the CSP and nosniff headers; both pages carry the logo symbol and no `<script`. The gateway allowlist (`web/lib/tools/gateway.ts:42`) admits exact paths and GET/HEAD only, and the test at `registry.test.ts:102` proves it. App footers: `LegalLinks` is inside `PageFooter` and `HomeFooter`, and all 13 SPEC page components render one of the two (grep). At runtime I saw the links only on Home (`/india`, `/us`), because without database credentials the other pages show their error state, which has no footer (finding 7). Mockups 30-35: the footer comes from `_platform/js/2-frame.js:62` (rendered and seen on 31). Public reachability on a real deployment is not verified (finding 2). | MET in code; deployment open (findings 1, 2) |
| 5 | Legal text honest and consistent; no invented e-mail; adequate for the Google OAuth consent screen (Google user data, Limited Use) | Done | The research/paper-only and no-advice statements match CLAUDE.md. MotherDuck storage of assistant questions is true (`lib/assistant/sql.ts:7`). Theme in localStorage (`lib/ui/theme.ts`), no analytics. The Drive section matches exepex/trading (`fno/constants.py:77` full `drive` scope; `google_drive_upload.py` only lists, creates and uploads, never deletes or shares). The Limited Use sentence is present and tested (`legal.test.ts:27`). No e-mail address in the diff, only `owner@example.com` in tests. A few statements are imprecise (finding 5). Under Google's own rules the pages are not usable as they stand: there is no public home page on the same domain (finding 1). | PARTLY |
| 6 | Two delivered-file defects fixed; other files byte-identical to the delivered ones | Done | At `fa62154`, `cmp` against the delivered set: exactly the six named SVGs and the 11 named PNGs differ, and all 40 others are the same. The delivered `mark-gradient-1024.png` renders black, the repository copy renders the gradient (both viewed). The delivered lockup PNGs measure 205x44, the repository ones 600x129 and 2048x440. At `ed21a5a`, all 21 SVGs are byte-identical to exepex/trading `54b035b` `docs/brand/omenix-logo/`, as `902ac84` says. No `color="url(` is left. | MET |
| 7 | Tokens only; files ≤350 lines; typecheck, test, build, sync check, check_text and check_page pass | Done; 367/367 tests | Clean copy of `fa62154`: `npm ci`, typecheck and build pass (`/privacy` and `/terms` are static, ○). The tests passed 367/367 in the working tree. Clean copy of `ed21a5a`: typecheck, **371/371** tests and build pass, and `sync-design --check` passes. `node tools/check_code_size.mjs` on the repository passes, and the allowlist is untouched. `check_text.js` gives 0 findings on 30-35, privacy and terms. New CSS uses tokens (`--mb-brand-tile` in `tokens.css:59`). The literal `#fff` in the `.mb-legal-*` rules follows the design system's existing brand rules. | MET |

## Claims vs reality

- *"The logo replaces the old 'OM' text mark in every mockup page.html (01-12, 30-35), the style guide and the
  36-legal pages."* True for the HTML. Not true for the screenshots and galleries next to those pages (finding 3).
- *"Two defects in the delivered logo files were fixed."* True, and I reproduced both (table, row 6).
- *"All other files are byte-identical to the delivered ones."* True at `fa62154`. Since `902ac84` it holds only for
  the PNGs; the README says so in its added paragraph.
- *"367/367 tests pass."* True at `fa62154`; 371/371 at `ed21a5a`.
  - In the shared working tree, `npm run build` failed for me with `ENOENT .next/server/pages-manifest.json`.
  - A fresh copy builds cleanly, so this comes from a stale `.next` folder left by parallel sessions, not from the
    code.
- *"Legal pages are static HTML without script and with a strict CSP."* True. There is no `<script` in either page,
  and the CSP is `default-src 'none'; style-src 'unsafe-inline'; img-src data:; ...`, served as checked with curl.
- *"The contact e-mail comes only from env MB_CONTACT_EMAIL, read at build time; none is in the repo."* True: the
  routes are `force-static`, and no address is in the repository. `data.json` `_note` and the `build.py` docstring
  still say "at request time" (finding 6).
- *"The 01-12 page.html files were changed by an exact-match script that only swaps the brand mark."* True.
  - 03-12 have byte-identical change sets (one md5 for all ten). 02 shows the same four edits: the brand CSS rule,
    the `.mb-logo` size rule, the `mb-logo` sprite symbol, and the `icon()` prefix test plus the sidebar brand
    element.
  - 01 is the same, without the `icon()` change.
  - The 02-12 templates take the shell from `_shared/shell.js`, which got the same edit, so a later rebuild keeps
    the logo.
  - Only the 01-12 tile background was left as the old `--mb-sidebar-active` (finding 4).
- *"Reachable without sign-in on the gateway deployment."* True in a local `MB_GATEWAY=1` server. Not shown on a real
  deployment (finding 2).

## Project-rule check

- Tokens only: met. 350-line limit: met (`check_code_size.mjs` passes; the largest new source is `36-legal/build.py`
  at 86 lines). SOLID, DRY and KISS: one source (`data.json`) feeds the mockup and the app, the sync copy is tested, and
  `legal.ts` is small and single-purpose. Met.
- Hard lines: no orders, no secrets, no e-mail address. Met.
- Mockup folder rule (data.json, template, build.py, notes, rationale, screenshots): met for 36-legal. The
  screenshots of the other mockups are now out of date (finding 3).
- Conversation log: updated, owner quotes verbatim, open questions listed. Met.

## Findings

1. **Should fix: no public home page; the legal pages' logo link is a dead link on the public deployment.**
   - Evidence:
     - With `MB_GATEWAY=1`, `GET /` answers **404**.
     - Both legal pages link their logo to `/` (`36-legal/build.py` `APP_LINKS["home"] = "/"`).
     - On the dashboard deployment, `/` is behind Vercel sign-in.
   - Google's verification help (support.google.com/cloud/answer/13464321, fetched today) says: "The homepage must be
     hosted on a verified domain you own", "can not be only a login page", "You must add the link of your privacy
     policy to your homepage", and "The Privacy Policy should be hosted within the domain that hosts your homepage".
     It also asks for domain ownership through Google Search Console. On a `*.vercel.app` host that can only be done
     with an HTML file or a meta tag, and the gateway serves neither (reasoning, not tested).
   - Strong evidence for the 404 and for Google's rules.
   - Fix expected:
     - a public, static home page on the gateway (for example `/`, exact path, GET/HEAD) that describes Omenix and
       links /privacy and /terms;
     - a way to place a Search Console verification token (a setting, not a file in the repository);
     - make the legal pages' logo link point to that home page.
   - If the owner decides to stay unverified (personal use, under 100 users), say so in the docs instead. That is the
     owner's call.
2. **Should fix: the owner's "update the deployed website" request is not met, and the docs do not tell them how.**
   - Evidence:
     - `https://omenix.vercel.app/privacy` answers 302 to `vercel.com/sso-api`, so the production dashboard cannot
       serve public legal pages even after a deploy.
     - CLAUDE.md says production still deploys from the stock repository's `web/`.
     - `README.md` "Deployment" still says the gateway "serves only `/slack/*`, `/mcp` and the MCP OAuth routes". It
       does not mention /privacy, /terms, `MB_CONTACT_EMAIL` (which must be set **before** the build, because the
       routes are static) or which URL to give Google.
     - The `web/middleware.ts` header comment also omits the legal routes.
   - The builder did list "which deployment and URL go to Google?" as an open question in the conversation log, which
     is honest.
   - Fix expected:
     - update README "Deployment" and the middleware comment;
     - give the owner the exact steps: deploy the gateway project from this repository's `main`, set
       `MB_CONTACT_EMAIL` first, and use `https://<gateway-host>/privacy` and `/terms`.
   - Deploying is the owner's step, but the instructions are this story's.
3. **Should fix: the screenshots and galleries still show the old "OM" mark.**
   - Evidence:
     - No `shot-*.png` in 01-12 or 30-35 and no `31..35/gallery/*.png` changed in this story.
     - A crop of `31-dashboard/gallery/home-1280.png` shows the "OM" tile.
   - CLAUDE.md requires screenshots from `check_page.js` for every mockup, and the owner reviews the galleries.
   - Fix expected: re-shoot the 30-35 screenshots and galleries, and the 01-12 `shot-*` files.
4. **Minor: two tile colours.** The 01-12 pages still draw the tile with `--mb-sidebar-active` (a 72 degree gradient),
   while 30-35, the style guide, the legal pages and the app use the new `--mb-brand-tile` (to top right). The
   difference is small, but the mark is no longer one picture everywhere. Fix: point the 01-12 rule at
   `--mb-brand-tile`. One shared exact-match replacement does it.
5. **Minor: imprecise statements in the privacy policy.**
   - (a) "used only to let you in and to show who is signed in": the app shows a fixed "OW" avatar
     (`app-bar.tsx:142`). Sign-in data is used to check the owner's GitHub id and login, and a refused account's
     login is logged (`app/mcp/_lib/oauth.ts:137`), which the policy does not mention.
   - (b) "Security: Access is limited to the owner" contradicts "the owner and people the owner invites".
   - (c) Drive: "reads a file back only when a file with the same name is already there, to check it is identical"
     is not quite right. The librarian (`RawDataLibrarian._fill_day`) reads an existing file to check that it is a
     valid file, not that it is identical.
   - Fix: reword these three.
6. **Minor: the docs disagree on when the contact is filled.** `36-legal/data.json` `_note` and the `build.py`
   docstring say the contact is filled "at request time". `legal.ts` and `notes.md` correctly say build time
   (`force-static`). Fix the two texts.
7. **Minor: not every app screen state shows the legal links.**
   - Data pages show `PageFooter`, and so the links, only once data has loaded. Error and loading states have no
     links (observed locally: no `<footer>` on 13 routes without database credentials).
   - The component gallery (`/[market]/gallery`) has no footer at all.
   - This does not affect Google, but "every app page" is true only for loaded pages.
8. **Minor, for the owner: two lockup files are the same file.**
   - `lockup-dark` and `lockup-mono-white` (SVG, 600 and 2048 PNG) are byte-identical: both are white mark and white
     text. They were delivered that way.
   - The README describes them as two variants. Either the dark lockup was meant to keep the gradient mark, or one
     name is redundant. The logo's designer should decide.

Re-judge needs: findings 1 to 3 fixed or argued with evidence; the minor ones are optional.
