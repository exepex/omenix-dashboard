// The one place that picks the frame's data adapter (story W8). Swapping it is this one line; components never import
// an adapter (lib/shell/tests/import-graph.test.ts enforces it). Only the market layout reads it.
import { fixtureShellData } from "./fixture-source.ts";
import type { ShellData } from "./source.ts";

export const shellData: ShellData = fixtureShellData;
