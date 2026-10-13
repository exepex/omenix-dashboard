# omenix-dashboard

The owner's private web dashboard, shared by two research backends:
- **Stock prediction** (`contactexepex/agentic-stock-prediction`): screens under `/india` and `/us`.
- **F&O** (`exepex/trading`): screens under `/fno` (to be built; stories W2-W4 in that repository's plan).

Each backend only publishes its data; this repository only reads it and shows it. Neither backend writes here.
Design and migration plan: `exepex/trading`, `docs/DESK_DESIGN.md` section 13 and `docs/MIGRATION_PLAN.md`.

## Where this came from

Extracted on 12 Oct 2026 from `agentic-stock-prediction` with `git filter-repo`, history kept (298 commits): `web/`
(the Next.js app), `api/` (its OpenAPI contract), `.github/workflows/web-tests.yml`, and the files the app's tests and
design-sync tool read: `design/system/`, `design/mockups/`, `config/warehouse.yaml` and the vendored
`scripts/marketbrief/presentation/dashboard/vendor/lightweight-charts.standalone.production.js`. Nothing was changed:
the copies are byte-identical to the source at commit `0435bd1`; typecheck, all 303 tests and the production build
pass.

**Until the cutover** (migration plan phase 6) the live dashboard still deploys from the stock repository's `web/`.
Changes to the dashboard should be made in only one place at a time; see the migration plan.

## Layout

| Path | What |
|---|---|
| `web/` | Next.js 15 app (TypeScript, React 19); the Vercel projects use `web` as root directory |
| `api/` | OpenAPI 3.1 contract of the app's `/api/v1` |
| `design/system/`, `design/mockups/` | design system and approved page mockups (the tests check the app against them) |
| `config/warehouse.yaml` | the stock backend's warehouse settings (one test reads its `app_url`) |

## Run and test

```
cd web
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
```

## Deployment

One app, two Vercel projects: the dashboard (owner-only Vercel Authentication) and the gateway (`MB_GATEWAY=1`;
serves only `/slack/*`, `/mcp`, the MCP OAuth routes, the public daily brief and the public pages `/` (= `/about`),
`/privacy` and `/terms`). Automatic deployments are off (`web/vercel.json`); deploy by hand from Vercel. Secrets live
only in Vercel's environment variables, never in this repository.

### Public pages for Google's OAuth consent screen (Drive uploader)

The dashboard project (`omenix-dashboard.vercel.app`) is behind Vercel Authentication, so Google can only reach the
**gateway** project, `https://omenix-gateway.vercel.app` (public; on 13 Oct 2026 it still ran a build without these pages).

**Owner's decision first:** deploying the gateway from this repository's `main` also moves its Slack and MCP code here
before the cutover (a partial cutover). Check that Settings → Git names `exepex/omenix-dashboard` with root `web` and
that its Slack and MCP environment variables are set. Steps:

1. In Google Search Console add a **URL prefix** property `https://omenix-gateway.vercel.app/`, choose the
   **HTML tag** method and copy its `content` value. Then, in the gateway project's environment variables, set
   `MB_GOOGLE_SITE_VERIFICATION` to that value and `MB_CONTACT_EMAIL` to the contact shown on the pages. Both are read
   when the app is built (the pages are static), so set them **before** deploying.
2. Deploy the gateway project from this repository's `main` (`web/`). Until the cutover, the production
   *dashboard* still deploys from the stock repository's frozen `web/` (CLAUDE.md); the gateway pages need only
   this repository.
3. In Google Cloud Console (OAuth consent screen, Branding): home page `https://omenix-gateway.vercel.app/`, privacy policy
   `https://omenix-gateway.vercel.app/privacy`, terms of service `https://omenix-gateway.vercel.app/terms`, authorised domain
   `omenix-gateway.vercel.app`, app logo `design/brand/google-cloud/oauth-app-logo-120.png`.
4. Press **Verify** in Search Console (the tag is on the deployed home page), then wait 24 hours before resubmitting.

Text and look: `design/mockups/36-legal` (`data.json`, `build.py`); copied into the app by `web/tools/sync-design.mjs`.
