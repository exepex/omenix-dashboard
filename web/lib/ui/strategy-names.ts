// The dashboard's one naming rule for strategies (owner rules: no screen names an AI model, story W9 criterion 5; and
// screens show what a strategy decided, never how it decides, 13 Oct 2026). A backend's name ("Model + news, 60% bar",
// "AI combined (Opus)") and its id ("rule.model_news_calm.v1") both state how the strategy decides, so neither reaches
// a screen or an API answer: every strategy is named by its public label and addressed by its public id
// (strategy-labels.ts), in names, in sentences that quote it, in map keys and in record ids that contain it. The
// family names a payload uses for a whole team ("AI team", "Rule-based") are not strategy names and stay. Applied once
// at every adapter boundary (the API's read routes, the page read client, the frame's and Home's adapters), so no
// component has to remember it. Pure.
import { withoutModelNames } from "./model-names.ts";
import { BACKEND_ID, BACKEND_NAMES, isBackendId, publicOf, withPublicIds } from "./strategy-labels.ts";

export const AI_TEAM = "AI team";

/** Names a payload gives a whole family or team, never one strategy's own name: kept as they are. */
const FAMILY_NAMES = new Set([AI_TEAM, "Rule-based", "Baseline", "Baselines", "Hybrid", "AI-based"]);

type Json = unknown;
const ID_KEYS = ["strategy_id", "id"];
const NAME_KEYS = ["name", "display_name", "strategy"];

/** Every (backend strategy id, backend name) pair a payload carries, in objects or in maps keyed by strategy id. */
function collect(value: Json, found: Map<string, Set<string>>, key?: string): void {
  if (Array.isArray(value)) return value.forEach((v) => collect(v, found));
  if (!value || typeof value !== "object") return;
  const o = value as Record<string, Json>;
  const id = ID_KEYS.map((k) => o[k]).find((v): v is string => typeof v === "string" && isBackendId(v)) ?? (key && isBackendId(key) ? key : undefined);
  if (id) {
    if (!found.has(id)) found.set(id, new Set());
    for (const name of NAME_KEYS.map((k) => o[k])) if (typeof name === "string" && !FAMILY_NAMES.has(name)) found.get(id)!.add(name);
  }
  for (const [k, v] of Object.entries(o)) collect(v, found, k);
}

/** The public label of each strategy of a set (backend id -> backend name). */
export function displayNames(names: ReadonlyMap<string, string>): Map<string, string> {
  return new Map([...names.keys()].map((id) => [id, publicOf(id).label]));
}

/** The payload with the rule applied: every backend name of a strategy replaced by its public label wherever it
 *  appears; every backend id replaced by its public id in keys and identifiers, and by its public label inside a
 *  sentence. Nothing else is touched: security names, symbols and other text stay as published (a company called
 *  "GPT Healthcare" is a company), and a model name left anywhere is the UI harness's to flag (judge 45). Returns a
 *  new value; the input is not changed. */
export function applyDisplayNames<T>(payload: T): T {
  const found = new Map<string, Set<string>>();
  collect(payload, found);
  for (const [name, id] of Object.entries(BACKEND_NAMES)) found.set(id, new Set([...(found.get(id) ?? []), name]));
  const renames = [...found].flatMap(([id, names]) => [...names].map((name) => [name, publicOf(id).label] as const))
    .filter(([from, to]) => from !== to && !isBackendId(from))
    .sort((a, b) => b[0].length - a[0].length);
  const fix = (s: string) => {
    if (!/\s/.test(s)) return withPublicIds(renames.find(([from]) => from === s)?.[1] ?? s);
    let t = s;
    for (const [from, to] of renames) t = t.split(from).join(to);
    return t.replace(BACKEND_ID, (id) => publicOf(id).label);
  };
  const walk = (v: Json): Json =>
    typeof v === "string" ? fix(v)
      : Array.isArray(v) ? v.map(walk)
        : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [withPublicIds(k), walk(x)])) : v;
  return walk(payload) as T;
}

/** A record id shown as evidence text ("tra:acc:ai-d:2026-09-29-RELIANCE-3d"): each strategy's public id in it reads as
 *  that strategy's label (from the page's own strategies, already through the rule), so the citation stays traceable
 *  and says nothing of how the strategy decides. */
export function citedId(id: string, strategies: Readonly<Record<string, { name?: string } | undefined>>): string {
  let t = withPublicIds(id);
  for (const [sid, s] of Object.entries(strategies).sort((a, b) => b[0].length - a[0].length)) if (s?.name && t.includes(sid)) t = t.split(sid).join(`[${s.name}]`);
  return withoutModelNames(t, AI_TEAM);
}
