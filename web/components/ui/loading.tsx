// The loaders (story W14): grey card shapes for a page or a part still being read (with `bar`, the page loader's thin
// bar under the app bar too) and a block's "Loading…" chip over its old content (pending.tsx shows it). Each waits
// --mb-loader-delay (design/system/tokens.css) before it shows, so a quick answer never flickers, and each is a polite
// status with aria-busy for screen readers. Plain markup: usable from server and client components.

/** A loading placeholder: grey card shapes (with `bar`, the page loader's bar under the app bar too), announced
 *  politely to screen readers; it shows only after --mb-loader-delay, so a quick answer never flickers (W14). */
export function LoadingState({ label = "Loading the page data", cards = 3, bar = false }: { label?: string; cards?: number; bar?: boolean }) {
  return (
    <div className="mb-state loading mb-delayed" role="status" aria-live="polite" aria-busy="true">
      {bar ? <div className="mb-pageload-bar" aria-hidden="true" /> : null}
      <span className="mb-sr">{label}…</span>
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="card mb-skeleton" aria-hidden="true">
          <div className="mb-skeleton-line w40" />
          <div className="mb-skeleton-line" />
          <div className="mb-skeleton-line w70" />
        </div>
      ))}
    </div>
  );
}

/** The block's loader: its content stays in place, faded, with a "Loading…" chip on top. */
export function BlockLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="mb-block-veil mb-delayed" role="status" aria-live="polite">
      <span className="mb-loader-chip">
        <span className="mb-spinner" aria-hidden="true" />
        {label}
      </span>
    </div>
  );
}

/** The page loader: a thin bar under the app bar and grey card shapes, after the delay. */
export const PageLoading = ({ label = "Loading the page" }: { label?: string }) => <LoadingState label={label} bar />;
