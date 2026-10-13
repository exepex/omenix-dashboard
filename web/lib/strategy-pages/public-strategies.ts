// Strategy internals stay private (owner, 13 Oct 2026): screens and APIs show what a strategy family decided (its
// buys, holds and results), never how it decides. The stored registry entry (config/strategies.yaml) also carries its
// description, parameters, chance threshold, the setting it changes against another strategy, and whatever setting a
// later registry adds. So the projection is an allow-list: an entry leaves the server with the public fields below
// and nothing else; a new registry field stays private until it is added here on purpose. Used by
// GET /api/v1/markets/{market}/strategies (lib/data/strategy-lab.ts); the fields match the Strategy type
// (lib/strategy-pages/scoreboard.ts) and the contract's StrategyEntry required fields (api/openapi.yaml).

/** What a reader may see of a strategy: who it is, which holds it trades, whether it is in its paper test, its count. */
export const PUBLIC_KEYS = ["id", "family", "name", "horizons", "live", "live_from", "settled_trades"] as const;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** One registry entry reduced to its public fields. */
export function publicStrategy(entry: unknown): unknown {
  if (!isObject(entry)) return entry;
  return Object.fromEntries(PUBLIC_KEYS.filter((key) => key in entry).map((key) => [key, entry[key]]));
}

/** A payload whose `strategies` map (id -> entry) keeps only each strategy's public fields. */
export function withoutInternals(payload: unknown): unknown {
  if (!isObject(payload) || !isObject(payload.strategies)) return payload;
  return { ...payload, strategies: Object.fromEntries(Object.entries(payload.strategies).map(([id, entry]) => [id, publicStrategy(entry)])) };
}
