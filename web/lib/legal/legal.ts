// The public home page, privacy policy and terms of service (owner, 13 Oct 2026; the Google Cloud Console OAuth consent
// screen links to them and needs a public home page on the same domain). The pages are built once in design/mockups/36-legal (build.py: static HTML, the design system inlined, no
// script) and copied here by tools/sync-design.mjs; GET /privacy and /terms serve them in both deployments; the gateway
// deployment (no Vercel Authentication, lib/tools/gateway.ts) is the public address to give Google. The contact address is a setting, not text in the repo: MB_CONTACT_EMAIL fills
// the page's @@CONTACT@@ (read when the deployment is built: the routes are static); without it the sentence points to
// the consent screen's developer contact alone. MB_GOOGLE_SITE_VERIFICATION (the content of Google Search Console's
// HTML-tag method) becomes that meta tag, for proving the domain to Google; unset, no tag.
import pages from "./pages.generated.json" with { type: "json" };

export type LegalPage = keyof typeof pages;
const CONTACT_MARK = "@@CONTACT@@";
const VERIFY_MARK = "<!--@@VERIFY@@-->";
const EMAIL = /^[^\s@<>"'&]+@[^\s@<>"'&]+\.[^\s@<>"'&]+$/;
const TOKEN = /^[A-Za-z0-9_-]{10,100}$/;

export const LEGAL_HEADERS: Record<string, string> = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; " +
    "form-action 'none'; frame-ancestors 'none'",
};

/** The contact as page text: a mailto link and a comma when the setting is a plain e-mail address, else nothing. */
export function contactHtml(email: string | undefined): string {
  const value = email?.trim() ?? "";
  return EMAIL.test(value) ? `<a href="mailto:${value}">${value}</a>, ` : "";
}

/** Google Search Console's verification meta tag for a well-formed token, else nothing. */
export function verifyHtml(token: string | undefined): string {
  const value = token?.trim() ?? "";
  return TOKEN.test(value) ? `<meta name="google-site-verification" content="${value}">` : "";
}

export function legalHtml(page: LegalPage, email: string | undefined, token?: string): string {
  return pages[page].replaceAll(CONTACT_MARK, contactHtml(email)).replace(VERIFY_MARK, verifyHtml(token));
}

export function legalResponse(page: LegalPage): Response {
  return new Response(legalHtml(page, process.env.MB_CONTACT_EMAIL, process.env.MB_GOOGLE_SITE_VERIFICATION), { status: 200, headers: LEGAL_HEADERS });
}
