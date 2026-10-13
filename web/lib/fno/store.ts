// The F&O product's rows on Azure Postgres (story W2, exepex/trading P3/P6), behind the dashboard's existing RowStore
// interface. Publication-aware: a page is read only from the product's current publication, the pointer joined to the
// history table, whose primary key (product, page_key, publication_id) makes the row unique. A run in progress or a
// failed run never moves the pointer (P6 moves it last, in one transaction), so readers see the last complete
// publication and nothing in between.
import { rowFrom, type RowStore } from "../data/store.ts";
import type { StoredRow } from "../data/serve.ts";
import type { Query } from "./db.ts";

/** A stored page of a publication, with its publication's identity. */
export interface FnoRow extends StoredRow {
  product: string;
  publication_id: string;
  published_at: string | null;
}

/** The product's current publication, or none yet. */
export interface Pointer {
  publication_id: string;
  as_of: string;
  published_at: string | null;
}

// Dates are read as text: the driver turns a date into local midnight, a day early on a machine east of UTC.
const PAGE_SQL =
  "SELECT h.product, h.publication_id, h.market, h.page_key, h.as_of::text AS as_of, h.cutoff, h.built_at, h.schema_version, h.source_commit, " +
  "h.payload_sha256, h.payload, c.published_at FROM fno.current_publication c JOIN fno.pages_history h " +
  "ON h.product = c.product AND h.publication_id = c.publication_id WHERE c.product = $1 AND h.market = $2 AND h.page_key = $3";
const POINTER_SQL = "SELECT publication_id, as_of::text AS as_of, published_at FROM fno.current_publication WHERE product = $1";

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v === null || v === undefined ? null : String(v));

export class AzureFnoRowStore implements RowStore {
  readonly query: Query;

  constructor(query: Query) {
    this.query = query;
  }

  /** The page of the product's current publication (`table` names the product, "fno"), or null. Throws FnoUnavailable. */
  async read(table: string, market: string, pageKey: string): Promise<FnoRow | null> {
    const { rows } = await this.query(PAGE_SQL, [table, market, pageKey]);
    const r = rows[0];
    return r ? { ...rowFrom(r), product: String(r.product), publication_id: String(r.publication_id), published_at: iso(r.published_at) } : null;
  }

  async pointer(product: string): Promise<Pointer | null> {
    const { rows } = await this.query(POINTER_SQL, [product]);
    const r = rows[0];
    return r ? { publication_id: String(r.publication_id), as_of: String(r.as_of), published_at: iso(r.published_at) } : null;
  }
}
