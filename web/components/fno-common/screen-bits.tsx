// The F&O screens' small shared parts (story W3; mockups 37-45, their 1-base.js): a section card, the "how to read it"
// line and a quiet empty line. Design-system classes only.
import type { ReactNode } from "react";
import { Icon } from "../ui/icon.tsx";

export function Sec({ title, aria, className = "", children }: { title: ReactNode; aria: string; className?: string; children: ReactNode }) {
  return (
    <section className={`card sec${className ? " " + className : ""}`} aria-label={aria}>
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

export const Quiet = ({ children }: { children: ReactNode }) => <p className="small muted" style={{ margin: 0 }}>{children}</p>;
