// Where each figure on a screen comes from (stories W9 and W12): a rendered figure names its source field,
// `<block>:<path>` (e.g. "groups:groups[0].total.net"), and the UI checks compare the figure with exactly that field
// of the data the page read. A figure the screen computed has no field to match, so it cannot pass. Pure.

/** The source name a figure carries: `sourceName("groups", "groups[0].total.net")`. */
export const sourceName = <B extends string>(block: B, path: string) => `${block}:${path}`;

/** The value at a source name, given the block payloads by name; undefined when the path does not exist. */
export function resolveSource(name: string, blocks: Readonly<Record<string, unknown>>): unknown {
  const at = name.indexOf(":");
  if (at < 0) return undefined;
  let v: unknown = blocks[name.slice(0, at)];
  for (const key of name.slice(at + 1).match(/[^.[\]]+/g) ?? []) {
    if (v === null || typeof v !== "object") return undefined;
    v = (v as Record<string, unknown>)[key];
  }
  return v;
}
