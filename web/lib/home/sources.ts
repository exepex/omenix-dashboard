// Home's figure sources (story W9 criterion 4): the blocks a Home figure can come from (Home's own blocks and the
// frame's records, the picks), named through the shared rule of lib/ui/sources.ts. Pure.
import { resolveSource, sourceName } from "../ui/sources.ts";

export type SourceBlock = "accounts" | "positions" | "groups" | "fnoBooks" | "strategyTrades" | "shell";

/** The source name a figure carries: `src("groups", "groups[0].total.net")`. */
export const src = (block: SourceBlock, path: string) => sourceName(block, path);

export { resolveSource };
