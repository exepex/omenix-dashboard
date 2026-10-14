// The public label and public id of every stock strategy (owner, 13 Oct 2026: screens and APIs show what a strategy
// decided, never how it decides). The backend's names ("Model + news, 60% bar") and ids ("rule.model_news_calm.v1")
// state its settings, so neither leaves the dashboard: each strategy is shown by a neutral label and addressed by a
// neutral id, fixed per backend id in the table below (the stock repository is read-only, so the mapping lives here).
// The table is stable: a label never moves to another strategy. A strategy the table does not know yet gets a neutral
// label and id from a hash of its backend id (stable too), never its backend name. Pure.

export interface PublicStrategy {
  /** Shown on every screen and in every API answer. */
  label: string;
  /** Used in links, URL hashes and keys instead of the backend id. */
  id: string;
}

/** The registry of 13 Oct 2026 (config/strategies.yaml of the stock tool), in its order. */
export const STRATEGY_LABELS: Readonly<Record<string, PublicStrategy>> = {
  "rule.model_news.v1": { label: "Rule-based 1", id: "rule-1" },
  "rule.model_news_half.v1": { label: "Rule-based 2", id: "rule-2" },
  "rule.model_news_double.v1": { label: "Rule-based 3", id: "rule-3" },
  "rule.model_news_confirmed.v1": { label: "Rule-based 4", id: "rule-4" },
  "rule.model_news_high.v1": { label: "Rule-based 5", id: "rule-5" },
  "rule.model_news_global.v1": { label: "Rule-based 6", id: "rule-6" },
  "rule.model_news_calm.v1": { label: "Rule-based 7", id: "rule-7" },
  "rule.model_news_strict.v1": { label: "Rule-based 8", id: "rule-8" },
  "base.always_up.v1": { label: "Always buy", id: "base-1" },
  "base.momentum.v1": { label: "Follow yesterday", id: "base-2" },
  "base.model_only.v1": { label: "Baseline 3", id: "base-3" },
  "ai.news_results.sonnet.v1": { label: "AI team A", id: "ai-a" },
  "ai.pattern_mood.sonnet.v1": { label: "AI team B", id: "ai-b" },
  "ai.combined.sonnet.v1": { label: "AI team C", id: "ai-c" },
  "ai.combined.opus.v1": { label: "AI team D", id: "ai-d" },
};

/** The registry's names of 13 Oct 2026, for text that names a strategy without its id (e.g. the search list). */
export const BACKEND_NAMES: Readonly<Record<string, string>> = {
  "Model + news": "rule.model_news.v1", "Model + half news": "rule.model_news_half.v1", "Model + double news": "rule.model_news_double.v1",
  "Model + confirmed news only": "rule.model_news_confirmed.v1", "Model + major news only": "rule.model_news_high.v1",
  "Model + news + global cues": "rule.model_news_global.v1", "Model + news, calm markets only": "rule.model_news_calm.v1",
  "Model + news, 60% bar": "rule.model_news_strict.v1", "Model without news": "base.model_only.v1",
  "AI news & results (Sonnet)": "ai.news_results.sonnet.v1", "AI price pattern & mood (Sonnet)": "ai.pattern_mood.sonnet.v1",
  "AI combined (Sonnet)": "ai.combined.sonnet.v1", "AI combined (Opus)": "ai.combined.opus.v1",
};

/** The approach a backend id's family shows when the table does not know the id yet. */
const APPROACH: Readonly<Record<string, [label: string, id: string]>> = {
  rule: ["Rule-based", "rule"], base: ["Baseline", "base"], ai: ["AI team", "ai"], hybrid: ["Hybrid", "hybrid"],
};

/** A short stable code of a backend id (FNV-1a, 4 hex digits): neutral, the same on every page and every run. */
function code(id: string): string {
  let h = 0x811c9dc5;
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return (h & 0xffff).toString(16).padStart(4, "0");
}

/** A backend strategy id ("rule.model_news_calm.v1": a family, then dotted parts ending in a version). */
export const BACKEND_ID = /\b(?:rule|base|ai|hybrid)\.[a-z0-9_]+(?:\.[a-z0-9_]+)*\.v\d+\b/g;
export const isBackendId = (s: string): boolean => new RegExp(`^${BACKEND_ID.source}$`).test(s);

/** The public label and id of a backend strategy id. */
export function publicOf(backendId: string): PublicStrategy {
  if (Object.hasOwn(STRATEGY_LABELS, backendId)) return STRATEGY_LABELS[backendId];
  const [label, id] = APPROACH[backendId.split(".")[0]] ?? ["Strategy", "strategy"];
  const c = code(backendId);
  return { label: `${label} (new ${c})`, id: `${id}-${c}` };
}

/** A text or key with every backend strategy id in it replaced by the public id. */
export const withPublicIds = (s: string): string => s.replace(BACKEND_ID, (id) => publicOf(id).id);
