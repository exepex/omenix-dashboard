// A page part's loader shell (stories W9, W12, W2): reads the part's blocks through its data interface and renders
// them. A block that cannot be shown shows its state (lib/ui/block-outcome.ts) while the rest of the page works: no
// data, with its reason; another contract version, as such (never a broken page); a failure, without the error's text.
// Server-side.
import type { ReactNode } from "react";
import { outcomeOf } from "../../lib/ui/block-outcome.ts";
import { EmptyState, ErrorState, IncompatibleState } from "../ui/states.tsx";

export async function blockSection<T>(what: string, read: () => Promise<T>, render: (blocks: T) => ReactNode): Promise<ReactNode> {
  let blocks: T;
  try {
    blocks = await read();
  } catch (e) {
    const o = outcomeOf(what, e);
    if (o.kind === "empty") return <EmptyState title={o.title}>{o.detail}</EmptyState>;
    if (o.kind === "incompatible") return <IncompatibleState title={o.title}>{o.detail}</IncompatibleState>;
    console.error(`block failed: ${o.log}`); // the class only: an error's message can name the host and the user
    return <ErrorState problem={{ title: o.title, status: 503, detail: o.detail }} />;
  }
  return render(blocks);
}
