// A page part (stories W12, W14): one block of a server-rendered screen. It streams in on its own (Suspense, with the
// part's grey shapes while its blocks are read) and shows its own loader while a control inside it moves to a new view
// (PendingBlock), never over the whole screen. `lead` is a control bar drawn above the part's blocks, in the same block.
import { Suspense, type ReactNode } from "react";
import { PendingBlock } from "../ui/pending.tsx";
import { LoadingState } from "../ui/loading.tsx";

export function Part({ label, lead, children }: { label: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <PendingBlock label={label}>
      {lead}
      <Suspense fallback={<LoadingState label={`Loading ${label}`} cards={1} />}>{children}</Suspense>
    </PendingBlock>
  );
}
