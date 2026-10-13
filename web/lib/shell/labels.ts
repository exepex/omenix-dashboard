// When a screen says "Example" (stories W8, W9-F&O; judge 63): only on values that come from the example records
// (the fixtures, copied from the signed-off mockups), never on a value read from a backend's publication. Three labels,
// one rule each; the frame's and Home's components draw them only through these. Pure.
import type { FrameData, Instrument } from "./contract.ts";

type Labelled = Pick<FrameData, "example" | "shell">;

/** "Example data" on a view of one instrument: the frame's data is example and this value is not a publication's. */
export const exampleTagShown = (data: Labelled, item?: Pick<Instrument, "live">) => data.example && !item?.live;

/** "Example" beside a stock figure: only where the stock parts are examples and the F&O parts beside them are real. */
export const stockExampleShown = (data: Labelled) => data.example && Boolean(data.shell.fno_live);

/** The page footer's label for its data. */
export function dataLabel(data: Labelled): "data" | "Example data" | "stock figures: Example data" {
  if (!data.example) return "data";
  return data.shell.fno_live ? "stock figures: Example data" : "Example data";
}
