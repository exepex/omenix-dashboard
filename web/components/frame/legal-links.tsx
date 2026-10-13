// The privacy policy and terms of service links (lib/legal/legal.ts) at the bottom of every page, in the frame, so
// loading, error and empty states show them too. Plain links: the pages are route handlers, not app pages.
export function LegalLinks() {
  return (
    <div className="mb-legal-links">
      <a href="/privacy">Privacy policy</a>
      {" · "}
      <a href="/terms">Terms of service</a>
    </div>
  );
}
