// A held F&O page says so on its own screen (contract 2.13.0, page `page_holds`; judge 251): above the dated previous
// page when its hold shows it, or in place of the page ("not published") when it shows nothing. Read through the F&O
// composition root (lib/fno/wiring.ts), shared by every F&O screen's loader except the card, which carries its own
// `withheld` notice. Data health lists every hold through HoldsBlock, the same one read. Server-side.
import type { ReactNode } from "react";
import { HeldNotice } from "../../../../components/fno-common/held-notice.tsx";
import { EmptyState } from "../../../../components/ui/states.tsx";
import { blockSection } from "../../../../components/blocks/block-section.tsx";
import { holdOf, NOT_PUBLISHED, type FnoPageHolds } from "../../../../lib/fno-holds/holds.ts";
import type { FnoPageKey } from "../../../../lib/fno/pages.ts";
import { fnoPageHolds } from "../../../../lib/fno/wiring.ts";

export async function HeldBlock({ pageKey, children }: { pageKey: FnoPageKey; children: ReactNode }) {
  const hold = holdOf(await fnoPageHolds(), pageKey);
  if (!hold) return <>{children}</>;
  return (
    <>
      <HeldNotice bold={hold.words} />
      {hold.nothing ? <EmptyState title="Not published">{NOT_PUBLISHED}</EmptyState> : children}
    </>
  );
}

/** The publication's holds for a screen that lists them (data health's "Pages held back"); null when unknown. */
export const HoldsBlock = ({ render }: { render: (holds: FnoPageHolds | null) => ReactNode }) => blockSection("Pages held back", () => fnoPageHolds(), render);
