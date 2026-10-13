// A section head (Home, Markets; one markup for both, W14): the title, a short line on what the section answers, and
// an optional "see all" link at the end (`.sec-head` in design/system/components.css).
import type { ReactNode } from "react";

export function SectionHead({ title, sub, end }: { title: string; sub?: string; end?: ReactNode }) {
  return (
    <div className="sec-head">
      <h2>{title}</h2>
      {sub ? <span className="sub">{sub}</span> : null}
      {end}
    </div>
  );
}
