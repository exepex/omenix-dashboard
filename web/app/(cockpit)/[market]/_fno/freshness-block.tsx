// The F&O data's runtime state line (story W2), shared by the Screener and the Markets overview in India: read through
// the F&O composition root (lib/fno/wiring.ts), absent with the fixtures, never shown in the US.
import { blockSection } from "../../../../components/blocks/block-section.tsx";
import { FreshnessNote } from "../../../../components/blocks/freshness-note.tsx";
import { fnoStatus } from "../../../../lib/fno/wiring.ts";

export const FreshnessBlock = () => blockSection("How current the data is", () => fnoStatus(), (status) => <FreshnessNote status={status} />);
