"use client";
// Loading indicators (story W14, owner's feedback of 13 Oct 2026): the page loader shows on the first load and on
// every move to another screen (app/(cockpit)/[market]/loading.tsx); a block's loader shows only inside the block whose
// link or button asked for data, never over the whole screen. A block is a <PendingBlock>: its controls move through
// useBlockTransition() (a URL change the server answers), and the block shows "Loading…" on top of its old content
// until the answer is drawn. Every loader waits --mb-loader-delay (design/system/tokens.css) before it shows, so a
// quick answer never flickers; it says "Loading…" to screen readers and sets aria-busy.
import { createContext, useContext, useTransition, type ReactNode, type TransitionStartFunction } from "react";
import { BlockLoader } from "./loading.tsx";

const BlockContext = createContext<TransitionStartFunction | null>(null);

/** A block that shows its own loader while a control inside it waits for data. */
export function PendingBlock({ label, children }: { label?: string; children: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  return (
    <BlockContext.Provider value={startTransition}>
      <div className="mb-block" aria-busy={isPending ? "true" : undefined}>
        {children}
        {isPending ? <BlockLoader label={label ? `Loading ${label}…` : undefined} /> : null}
      </div>
    </BlockContext.Provider>
  );
}

/** Start a navigation (router.push) as the nearest block's transition: that block shows its loader until it lands.
 *  Outside a block it is a plain transition. */
export function useBlockTransition(): TransitionStartFunction {
  const block = useContext(BlockContext);
  const [, start] = useTransition();
  return block ?? start;
}
