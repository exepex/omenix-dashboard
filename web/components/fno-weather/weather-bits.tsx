// The weather screen's small shared parts (story W3a; design/mockups/40-weather 1-base.js): a section card, the
// "how to read it" line and a colour label. A colour is never shown alone: its glyph and its word go with it.
import type { ReactNode } from "react";
import type { colourLabel } from "../../lib/fno-weather/view.ts";
import { Icon } from "../ui/icon.tsx";
import { Label } from "../ui/primitives.tsx";

export function Sec({ title, aria, children }: { title: ReactNode; aria: string; children: ReactNode }) {
  return (
    <section className="card sec" aria-label={aria}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function HowTo({ children }: { children: ReactNode }) {
  return (
    <p className="mb-howto">
      <Icon name="help" />
      <span>{children}</span>
    </p>
  );
}

export const ColourLabel = ({ look }: { look: ReturnType<typeof colourLabel> }) => <Label tone={look.tone} icon={look.icon}>{look.word}</Label>;

export const Quiet = ({ children }: { children: ReactNode }) => <p className="small muted" style={{ margin: 0 }}>{children}</p>;
