// The fixture adapters' one reader of W10's and W11's contract examples (api/examples/*.json, copied unchanged by
// tools/sync-design.mjs): each example is an envelope whose payload is the block. Blocks that carry strategy names pass
// the display-name rule (`strategies: true`, as at every adapter boundary of such blocks); blocks of securities and
// market data do not, so a company's name is never touched (judge 45). Pure.
import { NoExample } from "../ui/no-example.ts";
import { publicView } from "../ui/public-view.ts";

export type Examples = Record<string, { value: { payload: unknown } }>;

export { NoExample };

/** The reader of one examples file: `read("getGroups_india")` is that example's payload; a missing one is NoExample. */
export function exampleReader(raw: unknown, { strategies }: { strategies: boolean }) {
  const examples = raw as Examples;
  return function read<T>(operation: string): T {
    const found = examples[operation];
    if (!found) throw new NoExample(operation);
    return (strategies ? publicView(found.value.payload) : found.value.payload) as T;
  };
}
