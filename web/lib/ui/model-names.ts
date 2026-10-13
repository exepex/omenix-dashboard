// Finds AI model names in text (owner rule: no screen names an AI model; story W9 criterion 5). Generic on purpose: it
// knows the model families and the shapes of their ids and versions, not a list of today's names, so "Fable 5",
// "o3", "claude-sonnet-5" and "GPT-4o-mini" are all caught, each as one whole token. "Claude" alone is a model name
// too (owner decision, 13 Oct 2026): no screen names it, not even as the vendor's app or API. Pure.

/** A version or variant after a family name: "-4o", " 5", "-3.5", "-R1", "-mini", " Pro". */
const SUFFIX = String.raw`(?:[-_ ]?(?:[a-z]?\d+(?:\.\d+)*[a-z]*|mini|nano|pro|turbo|flash|lite|ultra|preview|instant|latest|coder|vision)\b)*`;
/** Families whose names are not ordinary words: matched in any case, with their id forms (claude-sonnet-5,
 *  claude-3-5-haiku). A key such as `claude_app` is not a word and is not matched. */
const ANY_CASE = ["claude(?:-[a-z0-9]+)*(?:\\.\\d+)*", "opus", "sonnet", "haiku", "chatgpt", "gpt", "gemini", "gemma", "bard", "llama", "mistral", "mixtral", "codestral", "ministral", "grok", "deepseek", "qwen", "phi-?\\d", "command-r", "kimi", "glm"];
/** Families whose names are also ordinary words or symbols: matched only as the makers write them ("Fable", "o3"). */
const EXACT_CASE = ["Fable", "o[1-9]"];

const token = (families: readonly string[], flags: string) => new RegExp(String.raw`(?<![\w-])(?:${families.join("|")})${SUFFIX}(?![\w-])`, flags);
const MATCHERS = [token(ANY_CASE, "gi"), token(EXACT_CASE, "g")];
const ASIDE = /\s*\([^()]*\)/g;

/** The first model name in a text, or null. */
export function modelNameIn(text: string): string | null {
  for (const m of MATCHERS) {
    m.lastIndex = 0;
    const found = m.exec(text);
    if (found) return found[0];
  }
  return null;
}

export const namesModel = (text: string) => modelNameIn(text) !== null;

/** True when the whole text is one model name ("claude-sonnet-5", "gpt-4.1"): text, not an identifier. */
export const isModelName = (text: string) => modelNameIn(text)?.trim() === text.trim();

/** The text without model names: an aside in brackets that names one is dropped ("AI combined (Opus)" -> "AI
 *  combined"); any other mention is replaced, whole token, by `replacement`. */
export function withoutModelNames(text: string, replacement: string): string {
  if (!namesModel(text)) return text;
  const t = text.replace(ASIDE, (aside) => (namesModel(aside) ? "" : aside));
  return MATCHERS.reduce((s, m) => s.replace(m, replacement), t);
}
