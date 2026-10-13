// The fixture adapters' one reader of W10's and W11's contract examples (api/examples/*.json, copied unchanged by
// tools/sync-design.mjs): each example is an envelope whose payload is the block. Strategy names pass the display-name
// rule, as at every adapter boundary. Pure.
import { NoExample } from "../ui/no-example.ts";
import { applyDisplayNames } from "../ui/strategy-names.ts";

export type Examples = Record<string, { value: { payload: unknown } }>;

export { NoExample };

/** The reader of one examples file: `read("getGroups_india")` is that example's payload; a missing one is NoExample. */
export function exampleReader(raw: unknown) {
  const examples = raw as Examples;
  return function read<T>(operation: string): T {
    const found = examples[operation];
    if (!found) throw new NoExample(operation);
    return applyDisplayNames(found.value.payload) as T;
  };
}
