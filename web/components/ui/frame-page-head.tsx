// A frame page's head (the signed-off pages' `pagehead`, design/mockups/_platform/js): breadcrumbs, the title, the
// meta tags (data source and day, readings) and the actions.
import type { ReactNode } from "react";

export function FramePageHead({ crumbs, title, meta, actions }: { crumbs: string[]; title: string; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-pagehead">
      <ol className="mb-crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => <li key={c}>{i === crumbs.length - 1 ? <span aria-current="page">{c}</span> : <a href="#">{c}</a>}</li>)}
      </ol>
      <div style={{ minWidth: 0 }}><h1>{title}</h1></div>
      <div className="mb-pagehead-meta">{meta}</div>
      <div className="mb-pagehead-actions">{actions}</div>
    </div>
  );
}
