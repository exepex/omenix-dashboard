// The privacy policy and terms of service links (lib/legal/legal.ts) under every page's footer. Plain links: the pages
// are route handlers, not app pages.
export function LegalLinks() {
  return (
    <div className="legal">
      <a href="/privacy">Privacy policy</a>
      {" · "}
      <a href="/terms">Terms of service</a>
    </div>
  );
}
