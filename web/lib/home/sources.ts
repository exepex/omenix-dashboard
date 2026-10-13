// Where each money figure on Home comes from (story W9 criterion 4): every rendered figure names its source field,
// `<block>:<path>` (e.g. "groups:groups[0].total.net"), and the UI check compares the figure with exactly that field.
// A figure the screen computed has no field to match, so it cannot pass. Pure.

/** The blocks a Home figure can come from: Home's own blocks and the frame's records (the picks). */
export type SourceBlock = "accounts" | "positions" | "groups" | "fnoBooks" | "strategyTrades" | "shell";

/** The source name a figure carries: `src("groups", "groups[0].total.net")`. */
export const src = (block: SourceBlock, path: string) => `${block}:${path}`;

/** The value at a source name, given the block payloads by name; undefined when the path does not exist. */
export function resolveSource(name: string, blocks: Partial<Record<SourceBlock, unknown>>): unknown {
  const at = name.indexOf(":");
  if (at < 0) return undefined;
  let v: unknown = blocks[name.slice(0, at) as SourceBlock];
  for (const key of name.slice(at + 1).match(/[^.[\]]+/g) ?? []) {
    if (v === null || typeof v !== "object") return undefined;
    v = (v as Record<string, unknown>)[key];
  }
  return v;
}
