// The dashboard's one display-name rule for strategies (owner rule: no screen names an AI model; story W9 criterion
// 5). A backend's name for a strategy that uses a model ("AI combined (Opus)") never reaches a screen: the name shown
// comes from an allowlist, the approach of the strategy's family plus, when known, its role from the id ("AI team ·
// combined"); an id whose role is not on the list shows its approach only, never the raw name. Applied once at every
// adapter boundary (the page read client, the frame's and Home's adapters), so no component has to remember it. Pure.
import { isModelName, namesModel, withoutModelNames } from "./model-names.ts";

export const AI_TEAM = "AI team";

/** The approach each id family shows (the frame's family labels). */
const APPROACH: Readonly<Record<string, string>> = { ai: AI_TEAM, hybrid: "Hybrid", rule: "Rule-based", base: "Baseline" };
const OTHER_APPROACH = "Strategy";
/** Families whose strategies use a model: their names always come from the allowlist. */
const MODEL_FAMILIES = new Set(["ai", "hybrid"]);
/** What a model-using strategy does, by the role in its id (`ai.<role>.<model>.<version>`): the allowlist. */
const ROLE: Readonly<Record<string, string>> = { combined: "combined", news_results: "news & results", pattern_mood: "price pattern & mood" };

/** A strategy id ("ai.combined.opus.v1"). */
const STRATEGY_ID = /^[a-z]+\.[\w.]+$/;
/** An identifier (a strategy, trade or record id: no spaces, with "." or ":"): a key for links and lookups, never
 *  rewritten here; a page that shows one as text uses citedId(). A bare model id ("gpt-4.1") is text, not a key. */
const IDENTIFIER = (s: string) => !/\s/.test(s) && /[.:]/.test(s) && !isModelName(s);

const own = (map: Readonly<Record<string, string>>, key: string) => (Object.hasOwn(map, key) ? map[key] : undefined);

/** The allowlisted name of one strategy, before collision letters; null when its published name is kept. */
function allowlisted(id: string, name: string): string | null {
  const [family, role] = id.split(".");
  const approach = own(APPROACH, family) ?? OTHER_APPROACH;
  if (!MODEL_FAMILIES.has(family)) return namesModel(name) ? approach : null;
  if (name === approach) return null; // the family's own name ("AI team": the team trading as one)
  const known = own(ROLE, role);
  return known ? `${approach} · ${known}` : approach;
}

/** Display names for a set of strategies (id -> backend name): model-using strategies by the allowlist, with letters
 *  A, B, ... by id where two would read the same; any other name kept as published unless it names a model. */
export function displayNames(names: ReadonlyMap<string, string>): Map<string, string> {
  const out = new Map<string, string>();
  const shared = new Map<string, string[]>();
  for (const [id, name] of names) {
    const shown = allowlisted(id, name);
    if (shown === null) out.set(id, name);
    else shared.set(shown, [...(shared.get(shown) ?? []), id]);
  }
  for (const [shown, ids] of shared) ids.sort().forEach((id, i) => out.set(id, ids.length > 1 ? `${shown} ${String.fromCharCode(65 + i)}` : shown));
  return out;
}

type Json = unknown;
const ID_KEYS = ["strategy_id", "id"];
const NAME_KEYS = ["name", "display_name", "strategy"];

/** Every (strategy id, backend name) pair a payload carries, in objects or in maps keyed by strategy id. */
function collect(value: Json, found: Map<string, string>, key?: string): void {
  if (Array.isArray(value)) return value.forEach((v) => collect(v, found));
  if (!value || typeof value !== "object") return;
  const o = value as Record<string, Json>;
  const id = ID_KEYS.map((k) => o[k]).find((v): v is string => typeof v === "string" && STRATEGY_ID.test(v)) ?? (key && STRATEGY_ID.test(key) ? key : undefined);
  const name = NAME_KEYS.map((k) => o[k]).find((v): v is string => typeof v === "string");
  if (id && name && !found.has(id)) found.set(id, name);
  for (const [k, v] of Object.entries(o)) collect(v, found, k);
}

/** The payload with the rule applied: every strategy's backend name, and its id where a sentence quotes it, replaced by
 *  its display name wherever it appears. Nothing else is touched: security names, symbols and other text stay exactly
 *  as published (a company called "GPT Healthcare" is a company), and a model name left anywhere is the UI harness's
 *  to flag, never silently rewritten (judge 45). Returns a new value; the input is not changed. */
export function applyDisplayNames<T>(payload: T): T {
  const pairs = new Map<string, string>();
  collect(payload, pairs);
  const shown = displayNames(pairs);
  const byName = [...pairs].map(([id, from]) => [from, shown.get(id) ?? from] as const).filter(([from, to]) => from !== to);
  const byId = [...pairs].map(([id]) => [id, shown.get(id) ?? id] as const);
  const renames = [...byName, ...byId].sort((a, b) => b[0].length - a[0].length);
  const fix = (s: string) => {
    if (IDENTIFIER(s)) return s;
    let t = s;
    for (const [from, to] of renames) t = t.split(from).join(to);
    return t;
  };
  const walk = (v: Json): Json => (typeof v === "string" ? fix(v) : Array.isArray(v) ? v.map(walk) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v);
  return walk(payload) as T;
}

/** A record id shown as evidence text ("tra:acc:ai.combined.opus.v1:2026-09-29-RELIANCE-3d"): each strategy id in it
 *  reads as that strategy's display name (from the page's own strategies, already through the rule), so the citation
 *  stays traceable and names no model. */
export function citedId(id: string, strategies: Readonly<Record<string, { name?: string } | undefined>>): string {
  let t = id;
  for (const [sid, s] of Object.entries(strategies).sort((a, b) => b[0].length - a[0].length)) if (s?.name && t.includes(sid)) t = t.split(sid).join(`[${s.name}]`);
  return withoutModelNames(t, AI_TEAM);
}

