# 36-legal: public home page, privacy policy and terms of service

**Real text, not mock.** Owner request of 13 Oct 2026: pages for the Google Cloud Console OAuth consent screen, with
the logo, linked from every page. Not yet signed off by the owner.

- Source: `data.json` (the text); `build.py` writes `privacy.html`, `terms.html` (mockups) and `app.json` (the same
  pages with the app's links), copied to `web/lib/legal/pages.generated.json` by `web/tools/sync-design.mjs`.
- Served by the app at **GET /about** (the home page; the gateway's `/` rewrites to it), **/privacy** and **/terms**
  (`web/app/about`, `privacy`, `terms`; `web/lib/legal/legal.ts`), allowed in gateway mode (`web/lib/tools/gateway.ts`)
  so they open without sign-in on the gateway deployment. Google requires a public home page on the same domain that
  links the privacy policy (judge 1, finding 1). Deployment steps: README "Public pages for Google's OAuth consent screen".
- Domain verification: `@@VERIFY@@` becomes Search Console's meta tag from `MB_GOOGLE_SITE_VERIFICATION` at build time.
- Contact: `@@CONTACT@@` is filled from the environment variable `MB_CONTACT_EMAIL` when the deployment is built
  (no address in the repository); without it the sentence names the consent screen's developer contact.
- Links: footer of every platform mockup (30-35); in the app, the frame under every page (loading and error states too).

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

- The Google section is for the **Drive uploader** (owner's answer, 13 Oct 2026). Its scope and use are read from
  exepex/trading: `fno/constants.py` DRIVE_FULL_SCOPE, `tools/gdrive_oauth_setup.py` (owner signs in once; refresh
  token kept in the cloud environment's settings), `fno/storage/google_drive.py` and `google_drive_upload.py`. The
  code only lists, creates folders and uploads inside the research folder, and reads a file back only to compare it;
  it never deletes or shares. If that code changes, this section must change with it.
- Deletion within 30 days of access ending; telling invited users of material changes.
