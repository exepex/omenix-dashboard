// Finds AI model names in text (owner rule: no screen names an AI model; story W9 criterion 5). It matches model-like
// shapes, not a list of today's names: a family followed by its version, size or variant in any case and with any of
// "-", "_", "." or a space ("Fable 5", "fable-5", "FABLE 5.1", "claude_opus_4", "GPT-4o-mini", "o3"), also inside a
// dotted id ("ai.combined.opus.v1"). A family that is also an ordinary word (opus, sonnet, haiku, fable, gemini, ...)
// counts only in such a shape or as a bracketed aside naming it alone ("AI combined (Opus)"), so "magnum opus" stays.
// Brand names that are no ordinary word count alone, "Claude" among them, and so do the AI vendors' names (owner
// decisions, 13 Oct 2026: no model or vendor name on any screen). Pure.

/** Names that are no ordinary word: a model or an AI vendor on their own. */
const BRANDS = ["anthropic", "openai", "claude", "chatgpt", "deepseek", "qwen", "mixtral", "codestral", "ministral", "command-r"];
/** Names that are also ordinary words: a model only with a version or size after them, or alone in brackets. "GPT" is
 *  one of them only in a security's name ("GPT Healthcare Limited" is a company); in prose a bare "GPT" is a model. */
const WORDS = ["gpt", "opus", "sonnet", "haiku", "fable", "gemini", "gemma", "llama", "mistral", "grok", "phi", "bard", "kimi", "glm"];
const VARIANTS = ["mini", "nano", "pro", "turbo", "flash", "lite", "ultra", "preview", "instant", "latest", "coder", "vision", "oss"];
/** What may follow a family: a version or size ("-4o", " 5", ".1", "_4", "-r1", "70b"), a variant joined by a
 *  separator ("-mini"), or another family word ("claude_opus", "Claude Opus"). */
const PART = String.raw`(?:[-_.]?\s?[a-z]?\d[a-z0-9]*|[-_.](?:${VARIANTS.join("|")})|[-_.\s](?:${WORDS.join("|")}))`;
const CANDIDATE = new RegExp(String.raw`(?<![a-z0-9])(?:(${BRANDS.join("|")})|(${WORDS.join("|")})|(o[1-9]))((?:${PART})*)(?![\w-])`, "gi");

/** Where a text sits: prose (sentences, labels, tooltips), or a security's name, where a company may be called "GPT …". */
export interface Where {
  security?: boolean;
}

/** A candidate is a model name when it is a brand, a lower-case o-series name ("o3", not "O2"), a bare "GPT" in prose,
 *  or a word family with a number after it or alone in brackets. */
function isModel(m: RegExpMatchArray, text: string, where: Where): boolean {
  const [whole, brand, word, oSeries, tail] = m;
  if (brand) return true;
  if (!where.security && word?.toLowerCase() === "gpt") return true;
  if (oSeries) return whole.startsWith("o");
  const at = m.index ?? 0;
  return /\d/.test(tail) || (word === whole && text[at - 1] === "(" && text[at + whole.length] === ")");
}

const models = (text: string, where: Where = {}) => [...text.matchAll(CANDIDATE)].filter((m) => isModel(m, text, where));

/** The first model name in a text (prose unless `where.security`), or null. */
export function modelNameIn(text: string, where: Where = {}): string | null {
  return models(text, where)[0]?.[0] ?? null;
}

export const namesModel = (text: string, where: Where = {}) => modelNameIn(text, where) !== null;

/** True when the whole text is one model name ("claude-sonnet-5", "gpt-4.1"): text, not an identifier. */
export const isModelName = (text: string) => modelNameIn(text) === text.trim();

const ASIDE = /\s*\([^()]*\)/g;

/** The text without model names: an aside in brackets that names one is dropped ("AI combined (Opus)" -> "AI
 *  combined"); any other mention is replaced, whole token, by `replacement`. */
export function withoutModelNames(text: string, replacement: string): string {
  if (!namesModel(text)) return text;
  const t = text.replace(ASIDE, (aside) => (namesModel(aside) ? "" : aside));
  let out = "";
  let from = 0;
  for (const m of models(t)) {
    out += t.slice(from, m.index) + replacement;
    from = (m.index ?? 0) + m[0].length;
  }
  return out + t.slice(from);
}
