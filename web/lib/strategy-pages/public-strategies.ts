// Strategy internals stay private (owner, 13 Oct 2026): screens and APIs show what a strategy family decided (its
// buys, holds and results), never how it decides. The stock tool's read models carry the registry (description,
// parameters, chance threshold, the setting a strategy changes against another, and whatever setting a later registry
// adds) and, on some rows, a strategy's own chance threshold. Every /api/v1 page answer passes through
// withoutInternals (lib/data/handler.ts) before it leaves the server:
//   - a registry entry (any value of a `strategies` map) keeps only its public fields: an allow-list, so a new
//     registry field stays private until it is added here on purpose;
//   - a setting carried on any other object (a prediction's threshold, …) is dropped wherever it appears;
//   - the signal model's back-test sweep (track record) keeps its rows apart by a neutral variant letter instead of the
//     threshold that tells them apart (publicVariants);
//   - a forecast run (the stock page's forecast history) keeps what it forecast and what changed, never how it was
//     made: no score points, drivers or inputs, no range model's inputs, calibration or spread, and its list of what
//     changed names none of them.

/** What a reader may see of a strategy: who it is, which holds it trades, whether it is in its paper test, its count. */
export const PUBLIC_KEYS = ["id", "family", "name", "horizons", "live", "live_from", "settled_trades"] as const;

/** Settings a strategy decides with, and how an AI trader's chance was made (the model's score it started from and
 *  its adjustment), dropped from every object that carries them outside the registry. */
export const SETTING_KEYS = ["threshold", "bar", "parameters", "differs_in", "compared_to", "model_prob", "agent_adjustment", "adjustment_reason"] as const;

/** How a forecast run was made, by the list it sits in (rm.stock forecast_history): dropped from each run. */
const HOW_MADE: Readonly<Record<string, readonly string[]>> = {
  scores: ["groups", "drivers_up", "drivers_down", "base_rate", "prob_model", "news_score"],
  ranges: ["inputs", "notes", "calibration_id", "sigma_h", "center"],
};

type Json = unknown;
const isObject = (value: Json): value is Record<string, Json> => typeof value === "object" && value !== null && !Array.isArray(value);

/** One registry entry reduced to its public fields. */
export function publicStrategy(entry: Json): Json {
  if (!isObject(entry)) return entry;
  return Object.fromEntries(PUBLIC_KEYS.filter((key) => key in entry).map((key) => [key, entry[key]]));
}

/** Rows that differ only by a threshold (the back-test sweep) keep a neutral letter in its place: A for the lowest. */
function publicVariants(rows: Json[]): Json[] {
  const levels = [...new Set(rows.filter(isObject).map((r) => r.threshold).filter((t) => t !== undefined && t !== null).map(Number))].sort((a, b) => a - b);
  if (levels.length < 2 || !rows.every((r) => isObject(r) && "baseline" in r)) return rows;
  return rows.map((r) => (isObject(r) && r.threshold != null ? { ...r, variant: String.fromCharCode(65 + levels.indexOf(Number(r.threshold))) } : r));
}

/** The payload with every strategy internal removed (see the header). Returns a new value. */
export function withoutInternals(payload: Json): Json {
  const walk = (v: Json, key?: string, list?: string): Json => {
    if (Array.isArray(v)) return publicVariants(v).map((x) => walk(x, undefined, key));
    if (!isObject(v)) return v;
    if (key === "strategies") return Object.fromEntries(Object.entries(v).map(([id, entry]) => [id, isObject(entry) && ("family" in entry || "name" in entry) ? publicStrategy(entry) : walk(entry)]));
    const drop = [...SETTING_KEYS, ...(list && Object.hasOwn(HOW_MADE, list) ? HOW_MADE[list] : [])] as readonly string[];
    const run = list && Object.hasOwn(HOW_MADE, list) ? list : undefined;
    const part = (k: string, x: Json): Json => (!run ? walk(x, k) : k === "change" ? walk(x, k, run) : k === "changed" && Array.isArray(x) ? x.filter((f) => !drop.includes(String(f))) : walk(x, k));
    return Object.fromEntries(Object.entries(v).filter(([k]) => !drop.includes(k)).map(([k, x]) => [k, part(k, x)]));
  };
  return walk(payload);
}
