// Reading one F&O page as a block (story W2): the product's current publication, its contract version checked, its
// freshness by the session calendar. No publication yet, or no such page in it, is the empty state with its reason; a
// payload of another major version is the incompatible state. Database failures stay FnoUnavailable (a class only).
import { BlockEmpty } from "../ui/block-states.ts";
import type { SessionCalendar } from "./calendar.ts";
import { fnoFreshness, type PublicationState } from "./freshness.ts";
import type { AzureFnoRowStore } from "./store.ts";
import { checkContractVersion } from "./version.ts";

export const FNO_PRODUCT = "fno";

/** The pages P6 publishes for the Screener and Markets (fno.pages_history.page_key). */
export type FnoPageKey = "screener_summary" | "screener_stocks" | "fno_screener_summary" | "fno_screener_rows" | "overview_indices" | "overview_sectors";

export interface FnoBlock<T> extends PublicationState {
  payload: T;
}

export interface FnoBlockReader {
  page<T>(pageKey: FnoPageKey): Promise<FnoBlock<T>>;
  status(): Promise<PublicationState>;
}

export class PublicationReader implements FnoBlockReader {
  readonly store: AzureFnoRowStore;
  readonly calendar: SessionCalendar;
  readonly now: () => Date;

  constructor(store: AzureFnoRowStore, calendar: SessionCalendar, now: () => Date = () => new Date()) {
    this.store = store;
    this.calendar = calendar;
    this.now = now;
  }

  async page<T>(pageKey: FnoPageKey): Promise<FnoBlock<T>> {
    const now = this.now();
    const row = await this.store.read(FNO_PRODUCT, "india", pageKey);
    if (!row) {
      const pointer = await this.store.pointer(FNO_PRODUCT);
      throw new BlockEmpty(pointer ? "page_missing" : "not_published", now.toISOString());
    }
    checkContractVersion(row.schema_version);
    const asOf = row.as_of ?? "";
    return { payload: row.payload as T, publication_id: row.publication_id, as_of: asOf, freshness: fnoFreshness(asOf, row.built_at, now, this.calendar) };
  }

  async status(): Promise<PublicationState> {
    const now = this.now();
    const pointer = await this.store.pointer(FNO_PRODUCT);
    if (!pointer) throw new BlockEmpty("not_published", now.toISOString());
    return { publication_id: pointer.publication_id, as_of: pointer.as_of, freshness: fnoFreshness(pointer.as_of, pointer.published_at, now, this.calendar) };
  }
}

/** A reader of pages' payloads only, for adapters whose interface returns the blocks themselves. */
export const payloadsOf = (reader: FnoBlockReader) => async <T>(key: FnoPageKey): Promise<T> => (await reader.page<T>(key)).payload;
