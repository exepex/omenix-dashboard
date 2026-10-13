// A block's runtime states besides real data (story W2; exepex/trading BUILD_MAP rule 2, ChatGPT review 28). Real data
// comes back as the block; stale data is real data with its freshness (lib/fno/freshness.ts); these two are raised
// instead, and each page part shows them as such, never as a broken page. "Example" is not a runtime state. Pure.

/** Machine-readable reasons a block has no data. */
export type EmptyReason = "not_published" | "page_missing" | "no_producer";

const EMPTY_WORDS: Record<EmptyReason, string> = {
  not_published: "Nothing has been published for this market yet.",
  page_missing: "The current publication has no page for this part.",
  no_producer: "No backend publishes this part yet.",
};

/** No data, with its reason code and the moment it was checked (UTC). */
export class BlockEmpty extends Error {
  readonly reason: EmptyReason;
  readonly checkedAt: string;
  constructor(reason: EmptyReason, checkedAt: string) {
    super(EMPTY_WORDS[reason]);
    this.name = "BlockEmpty";
    this.reason = reason;
    this.checkedAt = checkedAt;
  }
}

/** A payload whose contract major version this app does not read: shown as such, never parsed. */
export class BlockIncompatible extends Error {
  readonly found: string;
  readonly supported: number;
  constructor(found: string, supported: number) {
    super(`Incompatible data version: the data is version ${found}; this app reads version ${supported}.x.`);
    this.name = "BlockIncompatible";
    this.found = found;
    this.supported = supported;
  }
}

/** A block no backend publishes yet, checked now. */
export const noProducer = (): Promise<never> => Promise.reject(new BlockEmpty("no_producer", new Date().toISOString()));

/** A block a part can do without: its empty state reads as absent (null); anything else stays a failure. */
export const orAbsent = <T>(read: Promise<T>): Promise<T | null> => read.catch((e) => (e instanceof BlockEmpty ? null : Promise.reject(e)));
