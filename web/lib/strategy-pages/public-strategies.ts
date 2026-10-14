// Strategy internals stay private (owner, 13 Oct 2026): screens and APIs show what a strategy decided (its buys, holds
// and results), never how it decides. Every /api/v1 answer, every assistant read and every page read passes through
// withoutInternals (via lib/ui/public-view.ts). Each kind of record keeps only its public fields (public-fields.ts, an
// allow-list: a field a backend adds later stays private until it is added on purpose):
//   - a registry entry (any value of a `strategies` map);
//   - a record of a strategy's decision or result (an object with a `strategy_id`);
//   - a row of the back-test sweep (track record `backtest.strategy`), with a neutral variant letter in place of the
//     threshold (publicVariants);
//   - a stored forecast run, whose list of what changed names only public fields.
// Any other object loses the known setting keys wherever they appear.
import { DECISION_FIELDS, REGISTRY_FIELDS, RUN_CHANGE_FIELDS, RUN_FIELDS, SETTING_KEYS, SWEEP_FIELDS } from "./public-fields.ts";

type Json = unknown;
type Obj = Record<string, Json>;
const isObject = (value: Json): value is Obj => typeof value === "object" && value !== null && !Array.isArray(value);
const only = (o: Obj, fields: readonly string[]): Obj => Object.fromEntries(Object.entries(o).filter(([k]) => fields.includes(k)));

/** One registry entry reduced to its public fields. */
export function publicStrategy(entry: Json): Json {
  return isObject(entry) ? only(entry, REGISTRY_FIELDS) : entry;
}

/** Rows that differ only by a threshold (the back-test sweep) keep a neutral letter in its place: A for the lowest. */
function publicVariants(rows: Json[]): Json[] {
  const levels = [...new Set(rows.filter(isObject).map((r) => r.threshold).filter((t) => t !== undefined && t !== null).map(Number))].sort((a, b) => a - b);
  if (levels.length < 2 || !rows.every((r) => isObject(r) && "baseline" in r)) return rows;
  return rows.map((r) => (isObject(r) && r.threshold != null ? { ...r, variant: String.fromCharCode(65 + levels.indexOf(Number(r.threshold))) } : r));
}

/** A forecast run with its public fields; its change names only public fields. */
function publicRun(run: Obj, list: "ranges" | "scores"): Obj {
  const out = only(run, RUN_FIELDS[list]);
  if (!isObject(out.change)) return out;
  const change = only(out.change, RUN_CHANGE_FIELDS[list]);
  if (Array.isArray(change.changed)) change.changed = change.changed.filter((f) => RUN_FIELDS[list].includes(String(f)));
  return { ...out, change };
}

/** The payload with every strategy internal removed (see the header). Returns a new value. */
export function withoutInternals(payload: Json): Json {
  const walk = (v: Json, key?: string, list?: string): Json => {
    if (Array.isArray(v)) return publicVariants(v).map((x) => walk(x, undefined, key));
    if (!isObject(v)) return v;
    if (key === "forecast_history") {
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, (k === "ranges" || k === "scores") && Array.isArray(x) ? x.map((r) => (isObject(r) ? publicRun(r, k) : r)) : x]));
    }
    if (key === "strategies") return Object.fromEntries(Object.entries(v).map(([id, e]) => [id, isObject(e) && ("family" in e || "name" in e) ? publicStrategy(e) : walk(e)]));
    const kept = "strategy_id" in v ? only(v, DECISION_FIELDS) : list === "strategy" && "baseline" in v ? only(v, SWEEP_FIELDS) : Object.fromEntries(Object.entries(v).filter(([k]) => !(SETTING_KEYS as readonly string[]).includes(k)));
    return Object.fromEntries(Object.entries(kept).map(([k, x]) => [k, walk(x, k)]));
  };
  return walk(payload);
}
