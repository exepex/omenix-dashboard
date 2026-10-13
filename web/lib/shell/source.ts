// The frame's data interface (story W8, design for change): every component reads the frame through this interface's
// contract types, never through an adapter or a data client. Today's adapter is the fixture (fixture-source.ts); the
// backends' read models (W2, W6) plug in as new adapters, chosen in one place (wiring.ts).
import type { ShellPayload } from "./contract.ts";

export interface ShellData {
  /** The frame payload of both markets (lib/shell/contract.ts). */
  read(): Promise<ShellPayload>;
}
