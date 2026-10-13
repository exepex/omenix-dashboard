// Strategy internals stay private (owner, 13 Oct 2026): screens and APIs show what a strategy family decided (its
// buys, holds and results), never how it decides. The stored registry entry (config/strategies.yaml) also carries its
// description, parameters, chance threshold and the one setting it changes against another strategy; this projection
// drops them before a payload leaves the server. Used by GET /api/v1/markets/{market}/strategies (lib/data/strategy-lab.ts).

/** The registry fields that say how a strategy decides. */
export const INTERNAL_KEYS = ["description", "parameters", "threshold", "differs_in", "compared_to"] as const;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** One registry entry without its internals. */
export function publicStrategy(entry: unknown): unknown {
  if (!isObject(entry)) return entry;
  return Object.fromEntries(Object.entries(entry).filter(([key]) => !(INTERNAL_KEYS as readonly string[]).includes(key)));
}

/** A payload whose `strategies` map (id -> entry) keeps only what a strategy decided and how it did. */
export function withoutInternals(payload: unknown): unknown {
  if (!isObject(payload) || !isObject(payload.strategies)) return payload;
  return { ...payload, strategies: Object.fromEntries(Object.entries(payload.strategies).map(([id, entry]) => [id, publicStrategy(entry)])) };
}
