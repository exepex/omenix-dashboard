# 36-legal: privacy policy and terms of service

**Real text, not mock.** Owner request of 13 Oct 2026: pages for the Google Cloud Console OAuth consent screen, with
the logo, linked from every page. Not yet signed off by the owner.

- Source: `data.json` (the text); `build.py` writes `privacy.html`, `terms.html` (mockups) and `app.json` (the same
  pages with the app's links), copied to `web/lib/legal/pages.generated.json` by `web/tools/sync-design.mjs`.
- Served by the app at **GET /privacy** and **GET /terms** (`web/app/privacy`, `web/app/terms`, `web/lib/legal/legal.ts`),
  allowed in gateway mode (`web/lib/tools/gateway.ts`) so they open without sign-in on the gateway deployment.
- Contact: `@@CONTACT@@` is filled from the environment variable `MB_CONTACT_EMAIL` when the deployment is built
  (no address in the repository); without it the sentence names the consent screen's developer contact.
- Links: footer of every platform mockup (30-35) and every app page footer (Home and the other pages).

## Where each statement comes from

| Statement | Evidence |
|---|---|
| research and paper only, no real orders | CLAUDE.md hard lines |
| invite only, sign-in on data pages | Vercel Authentication on the dashboard deployment; gateway allowlist (`web/lib/tools/gateway.ts`) |
| Slack command and ids | `web/app/slack/` |
| GitHub sign-in | the MCP OAuth (`web/app/mcp/oauth/`) |
| database MotherDuck, hosting Vercel | `web/lib/tools/motherduck.ts`, `web/vercel.json` |
| assistant questions go to an AI model provider | `web/lib/assistant/` |
| no analytics or tracking cookies; theme in the browser | no analytics code in `web/`; `web/lib/ui/theme.ts` |

## Promises the owner must confirm (written as commitments, not yet facts)

- Google sign-in: the app has none today. The Google section covers basic sign-in only; if the consent screen asks
  for more scopes (Drive, Gmail...), the section must name them.
- Deletion within 30 days of access ending; telling invited users of material changes.
