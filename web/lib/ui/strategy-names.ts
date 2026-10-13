// The dashboard's one display-name rule for strategies (owner rule: no screen names an AI model; story W9 criterion
// 5). Backends may publish names such as "AI combined (Opus)"; the screen shows the approach instead: an AI strategy
// reads "AI team · combined", with a letter only where two AI strategies would otherwise read the same. Applied once
// at every adapter boundary (the page read client, the frame's and Home's adapters), so no component has to remember
// it. Pure.

/** Names of AI models that must never reach a screen. "Claude" alone is left out on purpose: it also names the
 *  vendor's app and API, which the assistant and companies pages mention as a channel and a cost source; the models
 *  (Opus, Sonnet, Haiku, and other makers' GPT, Gemini, ...) are what strategy names carried. */
export const MODEL_NAME = /\b(Opus|Sonnet|Haiku|ChatGPT|GPT(?:-?\d[\w.]*)?|Gemini|Llama|Mistral|Mixtral|Grok|DeepSeek|Qwen)\b/i;
const MODEL_WORDS = new RegExp(MODEL_NAME.source, "gi");
const MODEL_ASIDE = new RegExp(`\\s*\\([^()]*${MODEL_NAME.source}[^()]*\\)`, "gi");

export const AI_TEAM = "AI team";

const isAi = (id: string) => id.startsWith("ai.");
/** A strategy id ("ai.combined.opus.v1"). */
const STRATEGY_ID = /^[a-z]+\.[\w.]+$/;
/** An identifier (a strategy, trade or record id: no spaces, with "." or ":"): a key for links and lookups, never
 *  rewritten here; a page that shows one as text uses citedId(). */
const IDENTIFIER = (s: string) => !/\s/.test(s) && /[.:]/.test(s);

/** What an AI strategy does, without its model: "AI combined (Opus)" -> "combined". */
function role(name: string): string {
  return name.replace(MODEL_ASIDE, "").replace(MODEL_WORDS, "").replace(/^\s*AI\b\s*/i, "").replace(/\s{2,}/g, " ").trim();
}

/** Display names for a set of strategies (id -> backend name): a name that names a model becomes the AI team with its
 *  role (letters A, B, ... by id where two roles would read the same); every other name is kept as published. */
export function displayNames(names: ReadonlyMap<string, string>): Map<string, string> {
  const out = new Map<string, string>();
  const roles = new Map<string, string[]>();
  for (const [id, name] of names) {
    // a name without a model is already what the screen shows ("Model + news", "AI team"): kept as published
    if (!MODEL_NAME.test(name)) out.set(id, name);
    else if (!isAi(id)) out.set(id, name.replace(MODEL_ASIDE, "").replace(MODEL_WORDS, AI_TEAM).trim());
    else {
      const r = role(name);
      roles.set(r, [...(roles.get(r) ?? []), id]);
    }
  }
  for (const [r, ids] of roles) {
    const base = r && r.toLowerCase() !== "team" ? `${AI_TEAM} · ${r}` : AI_TEAM;
    ids.sort().forEach((id, i) => out.set(id, ids.length > 1 ? `${base} ${String.fromCharCode(65 + i)}` : base));
  }
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

/** The payload with the rule applied: every strategy name replaced by its display name, wherever it appears (a field,
 *  a sentence), and any model mention left in free text removed. Returns a new value; the input is not changed. */
export function applyDisplayNames<T>(payload: T): T {
  const pairs = new Map<string, string>();
  collect(payload, pairs);
  const shown = displayNames(pairs);
  const renames = [...pairs].map(([id, from]) => [from, shown.get(id) ?? from] as const).filter(([from, to]) => from !== to).sort((a, b) => b[0].length - a[0].length);
  const fix = (s: string) => {
    if (IDENTIFIER(s)) return s;
    let t = s;
    for (const [from, to] of renames) t = t.split(from).join(to);
    return MODEL_NAME.test(t) ? t.replace(MODEL_ASIDE, "").replace(MODEL_WORDS, AI_TEAM) : t;
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
  return MODEL_NAME.test(t) ? t.replace(MODEL_WORDS, AI_TEAM) : t;
}

