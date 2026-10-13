// Fixture adapter of the frame (story W8): the signed-off mockup's example records (design/mockups/30-shell/data.json,
// copied unchanged into fixture/shell.generated.json by tools/sync-design.mjs), labelled as example data on screen.
// Backends do not publish the frame's read models yet (W2, W6); a real adapter replaces this one in wiring.ts.
import raw from "./fixture/shell.generated.json" with { type: "json" };
import { applyDisplayNames } from "../ui/strategy-names.ts";
import type { ShellPayload } from "./contract.ts";
import type { ShellData } from "./source.ts";

type Raw = Omit<ShellPayload, "example"> & { _mock?: boolean };

/** The mockup's payload as the contract: keys starting with "_" are the mockup's notes; `_mock` becomes `example`;
 *  strategy names pass the display-name rule. */
export function fromMockup(data: Raw): ShellPayload {
  const kept = Object.fromEntries(Object.entries(data).filter(([key]) => !key.startsWith("_"))) as Omit<ShellPayload, "example">;
  return applyDisplayNames({ ...kept, example: data._mock !== false });
}

export const fixtureShellData: ShellData = {
  read: async () => fromMockup(raw as unknown as Raw),
};
