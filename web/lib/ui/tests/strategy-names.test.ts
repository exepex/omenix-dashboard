// Story W9 criterion 5: the one display-name rule. Over every fixture the app renders (the old pages' mockup data,
// the UI harness's stored payloads, the frame's and Home's fixtures), no AI model name is left in any text a screen
// could show. Since 13 Oct 2026 every strategy is also named by its fixed public label and addressed by its public id
// (strategy-labels.ts): no backend name or id is left in any text or key.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { modelNameIn, namesModel, withoutModelNames } from "../model-names.ts";
import { STRATEGY_LABELS, publicOf } from "../strategy-labels.ts";
import { AI_TEAM, applyDisplayNames, citedId, displayNames } from "../strategy-names.ts";

const web = join(import.meta.dirname, "..", "..", "..");
const repo = join(web, "..");
const json = (path: string) => JSON.parse(readFileSync(path, "utf8").replace(/\bNaN\b/g, "null"));
const mockups = readdirSync(join(repo, "design", "mockups")).filter((d) => /^\d\d-/.test(d)).map((d) => join(repo, "design", "mockups", d, "data.json"));
const stored = ["b16", "ux3"].flatMap((d) => readdirSync(join(web, "tests", "ui", d)).filter((f) => f.endsWith(".json")).map((f) => join(web, "tests", "ui", d, f)));
const examples = readdirSync(join(web, "lib", "fixtures")).filter((f) => f.endsWith(".json")).map((f) => join(web, "lib", "fixtures", f));
const FIXTURES = [...mockups, ...stored, ...examples];

/** Every text value a screen could show: string values that are not identifiers (strategy, trade and record ids are
 *  keys; a page that shows one as text passes it through citedId, tested below), each marked when it is a security's
 *  name (the rows' `n`), which the detector reads as such: a company may be called "GPT …". */
function texts(value: unknown, out: { text: string; security: boolean }[] = [], key = ""): { text: string; security: boolean }[] {
  if (typeof value === "string") out.push({ text: value, security: key === "n" });
  else if (Array.isArray(value)) value.forEach((v) => texts(v, out, key));
  else if (value && typeof value === "object") Object.entries(value).forEach(([k, v]) => texts(v, out, k));
  return out.filter(({ text }) => /\s/.test(text) || !/[.:]/.test(text));
}
const named = ({ text, security }: { text: string; security: boolean }) => namesModel(text, { security });

test("the fixtures really carry model names (the rule has work to do)", () => {
  assert.ok(FIXTURES.length > 15);
  assert.ok(FIXTURES.some((f) => texts(json(f)).some(named)));
});

test("after the rule, no fixture text names an AI model", () => {
  for (const f of FIXTURES) {
    const left = texts(applyDisplayNames(json(f))).filter(named).map(({ text }) => text);
    assert.deepEqual(left.slice(0, 3), [], f);
  }
});

test("every strategy reads as its fixed public label, whatever its backend name", () => {
  const shown = displayNames(new Map([
    ["ai.combined.opus.v1", "AI combined (Opus)"],
    ["ai.combined.sonnet.v1", "AI combined (Sonnet)"],
    ["ai.news_results.sonnet.v1", "AI news & results (Sonnet)"],
    ["rule.model_news.v1", "Model + news"],
    ["rule.model_news_strict.v1", "Model + news, 60% bar"],
    ["base.always_up.v1", "Always buy"],
    ["base.model_only.v1", "Model without news"],
  ]));
  assert.deepEqual(Object.fromEntries(shown), {
    "ai.combined.opus.v1": "AI team D", "ai.combined.sonnet.v1": "AI team C", "ai.news_results.sonnet.v1": "AI team A",
    "rule.model_news.v1": "Rule-based 1", "rule.model_news_strict.v1": "Rule-based 8", "base.always_up.v1": "Always buy", "base.model_only.v1": "Baseline 3",
  });
});

test("names and ids are replaced everywhere they appear (fields, sentences, map keys); the input is not changed", () => {
  const payload = { strategies: { "ai.combined.opus.v1": { name: "AI combined (Opus)", family: "ai" } }, nearest: { strategy_id: "ai.combined.opus.v1", name: "AI combined (Opus)" }, line: "Closest to passing: AI combined (Opus) (AI trader)" };
  const out = applyDisplayNames(payload) as unknown as { strategies: Record<string, { name: string }>; nearest: { strategy_id: string }; line: string };
  assert.deepEqual(Object.keys(out.strategies), ["ai-d"]);
  assert.equal(out.strategies["ai-d"].name, "AI team D");
  assert.equal(out.nearest.strategy_id, "ai-d");
  assert.equal(out.line, "Closest to passing: AI team D (AI trader)");
  assert.equal(payload.line, "Closest to passing: AI combined (Opus) (AI trader)");
});

test("a family name for a whole team stays ('AI team' trading as one); the strategy's id still becomes public", () => {
  const out = applyDisplayNames({ trades: [{ strategy_id: "ai.combined.opus.v1", strategy: "AI team" }], line: "3 trades: AI team · N+5" });
  assert.deepEqual(out, { trades: [{ strategy_id: "ai-d", strategy: "AI team" }], line: "3 trades: AI team · N+5" });
});

// Judge 45: the rule renames strategies only. Other text is never rewritten; a model name in it is flagged by the
// detector (the UI harness's gate on every page), so a leak is seen, not hidden.
test("text outside any strategy name stays exactly as published, and a model named in it is flagged, not rewritten", () => {
  for (const note of ["Scored by GPT-4o (beta)", "Asked in the Claude app"]) assert.equal(applyDisplayNames({ note }).note, note);
  assert.equal(applyDisplayNames({ note: "Model + news beat Always buy" }).note, "Rule-based 1 beat Always buy", "a strategy's own name is always replaced");
  assert.equal(namesModel("Scored by GPT-4o (beta)"), true);
  assert.equal(namesModel("Asked in the Claude app"), true);
});

test("security names are never touched: GPT Healthcare and GPT Infraprojects stay; a planted model in a name is caught", () => {
  const rows = [{ s: "GPTHEALTH", n: "GPT Healthcare Limited" }, { s: "GPTINFRA", n: "GPT Infraprojects Limited" }, { s: "MONEYVIEW", n: "Moneyview GPT-4o Limited" }];
  assert.deepEqual(applyDisplayNames({ rows }).rows, rows, "the rule leaves security text alone");
  assert.equal(modelNameIn("GPT Healthcare Limited", { security: true }), null);
  assert.equal(modelNameIn("GPT Infraprojects Limited", { security: true }), null);
  assert.equal(modelNameIn("Moneyview GPT-4o Limited", { security: true }), "GPT-4o", "the page gate flags it");
});

test("a quoted id reads as the strategy's public label in a sentence, as its public id in an identifier", () => {
  const out = applyDisplayNames({ line: "First settled week: rule.model_news.v1 +7.99 USD on 6 trades, ai.combined.opus.v1 -6.64 USD on 3", trade: "acc:ai.combined.opus.v1:2026-09-29-RELIANCE-3d", hash: "story=tra:acc:rule.model_news_calm.v1:2026-09-29-RELIANCE-3d" });
  assert.equal(out.line, "First settled week: Rule-based 1 +7.99 USD on 6 trades, AI team D -6.64 USD on 3");
  assert.equal(out.trade, "acc:ai-d:2026-09-29-RELIANCE-3d");
  assert.equal(out.hash, "story=tra:acc:rule-7:2026-09-29-RELIANCE-3d");
  assert.equal(namesModel(out.line), false);
});

test("the same record id maps the same way on every page, so links and lookups between pages keep working", () => {
  const a = applyDisplayNames({ rows: [{ id: "acc:ai.combined.opus.v1:2026-09-29-RELIANCE-3d" }] });
  const b = applyDisplayNames({ story: { id: "acc:ai.combined.opus.v1:2026-09-29-RELIANCE-3d" }, other: "rule.model_news.v1" });
  assert.equal(a.rows[0].id, b.story.id);
  assert.deepEqual(applyDisplayNames(a), a, "applying it twice changes nothing (the API and the client both apply it)");
});

test("a cited id shown as text reads each public id as its label, still traceable, naming no model", () => {
  const strategies = { "ai-d": { name: "AI team D" }, "rule-1": { name: "Rule-based 1" } };
  assert.equal(citedId("tra:acc:ai-d:2026-09-29-RELIANCE-3d:biggest_win", strategies), "tra:acc:[AI team D]:2026-09-29-RELIANCE-3d:biggest_win");
  assert.equal(citedId("tra:acc:ai.combined.opus.v1:2026-09-29-RELIANCE-3d", strategies), "tra:acc:[AI team D]:2026-09-29-RELIANCE-3d");
  assert.equal(citedId("rule-1", strategies), "[Rule-based 1]");
  assert.equal(namesModel(citedId("acc:ai.unknown.sonnet.v1:x", strategies)), false);
  assert.equal(citedId("news:abc123", strategies), "news:abc123");
});

// Owner, 13 Oct 2026 (after the deploy of 8893f17): the backend names state the settings, so no label and no API
// field may carry them or a settings word, for any strategy, including one the table does not know yet.
const SETTING_WORDS = /news|bar\b|%|calm|regime|global|model|confirmed|major|half|double|strict|pattern|mood|results|combined|opus|sonnet|momentum|always_up|cues/i;
test("no public label or id carries a backend name or a settings word, for every known strategy and a planted new one", () => {
  const ids = [...Object.keys(STRATEGY_LABELS), "rule.model_news_regime_80pct.v2", "ai.news_mood.gpt5.v1", "base.always_down.v1"];
  for (const id of ids) {
    const { label, id: pub } = publicOf(id);
    assert.ok(!SETTING_WORDS.test(label) && !SETTING_WORDS.test(pub), `${id} -> ${label} / ${pub}`);
    assert.ok(!label.includes(id) && !pub.includes(id));
  }
  const labels = Object.values(STRATEGY_LABELS).map((x) => x.label), pubs = Object.values(STRATEGY_LABELS).map((x) => x.id);
  assert.equal(new Set(labels).size, labels.length, "labels are unique");
  assert.equal(new Set(pubs).size, pubs.length, "public ids are unique");
  assert.match(publicOf("rule.model_news_regime_80pct.v2").label, /^Rule-based \(new [0-9a-f]{4}\)$/);
});

test("labels are fixed per strategy: a page with two strategies shows the same labels as the page with all of them", () => {
  const few = applyDisplayNames({ picks: [{ strategy_id: "rule.model_news_calm.v1", strategy: "Model + news, calm markets only" }, { strategy_id: "ai.pattern_mood.sonnet.v1", strategy: "AI price pattern & mood (Sonnet)" }] });
  assert.deepEqual(few.picks.map((x) => [x.strategy_id, x.strategy]), [["rule-7", "Rule-based 7"], ["ai-b", "AI team B"]]);
});

test("after the rule, no fixture carries a backend strategy name or id, in any text or key", () => {
  const backendNames = new Set<string>();
  const gather = (v: unknown): void => {
    if (Array.isArray(v)) return v.forEach(gather);
    if (!v || typeof v !== "object") return;
    const o = v as Record<string, unknown>;
    if (typeof o.id === "string" && /^(rule|base|ai)\./.test(o.id) && typeof o.name === "string" && !/^(AI team|Rule-based|Always buy|Follow yesterday)$/.test(o.name)) backendNames.add(o.name);
    Object.values(o).forEach(gather);
  };
  for (const f of FIXTURES) gather(json(f));
  assert.ok(backendNames.has("Model + news, 60% bar"), "the fixtures carry the backend names (the rule has work to do)");
  for (const f of FIXTURES) {
    const out = JSON.stringify(applyDisplayNames(json(f)));
    assert.equal(out.match(/\b(?:rule|base|ai)\.[a-z0-9_]+(?:\.[a-z0-9_]+)*\.v\d+\b/)?.[0], undefined, `${f} keeps a backend id`);
    for (const name of backendNames) assert.ok(!out.includes(JSON.stringify(name)), `${f} keeps "${name}"`);
  }
});

test("the detector knows families and id shapes, not a list: each of these is one whole model token", () => {
  for (const [text, token] of [
    ["AI combined (Fable 5)", "Fable 5"],
    ["AI reasoning (o3)", "o3"],
    ["picked by claude-sonnet-5 today", "claude-sonnet-5"],
    ["claude-3-5-haiku", "claude-3-5-haiku"],
    ["GPT-4o-mini scored it", "GPT-4o-mini"],
    ["gpt-4.1", "gpt-4.1"],
    ["gemini-2.5-pro", "gemini-2.5-pro"],
    ["Llama-3.1 and Qwen", "Llama-3.1"],
    ["o4-mini", "o4-mini"],
    ["DeepSeek-R1", "DeepSeek-R1"],
    ["the Claude app", "Claude"],
    ["on the claude API", "claude"],
    ["set in the Anthropic console", "Anthropic"],
    ["an OpenAI key", "OpenAI"],
  ]) assert.equal(modelNameIn(text), token, text);
  for (const clean of ["Model + news", "a fable about markets", "claude_app", "Hybrid", "O2 margin", "Model + news, 60% bar"]) assert.equal(modelNameIn(clean), null, clean);
});

// Judge 29 (W9 rejudge), minor 1: model names in model-like shapes only, in any case and with any separator.
test("the detector finds model-like shapes in any case and with -, _, . or a space, also inside dotted ids", () => {
  for (const [text, token] of [
    ["picked by fable-5", "fable-5"],
    ["FABLE 5.1 scored", "FABLE 5.1"],
    ["claude_opus_4 only", "claude_opus_4"],
    ["Claude Opus 4", "Claude Opus 4"],
    ["acc:ai.combined.claude_opus_4.v1:x", "claude_opus_4.v1"],
    ["ai.combined.opus.v1", "opus.v1"],
    ["llama3-70b", "llama3-70b"],
    ["AI combined (Opus)", "Opus"],
  ]) assert.equal(modelNameIn(text), token, text);
});

test("ordinary words stay: sonnet, opus, haiku, fable alone are not models", () => {
  for (const clean of ["a magnum opus of a quarter", "Shakespeare's sonnet", "a haiku on rates", "Opus and Sonnet without a version", "the fable of the ant", "(magnum opus)", "Gemini sign"]) assert.equal(modelNameIn(clean), null, clean);
  assert.equal(applyDisplayNames({ headline: "Tata's magnum opus: a new plant" }).headline, "Tata's magnum opus: a new plant");
});

test("model ids are replaced as whole tokens where the rule replaces (cited ids): no 'claude--5', no 'claude-AI team-4'", () => {
  assert.equal(withoutModelNames("picked by claude-sonnet-5 today", AI_TEAM), `picked by ${AI_TEAM} today`);
  assert.equal(withoutModelNames("Reviewed by claude-haiku-4 overnight", AI_TEAM), `Reviewed by ${AI_TEAM} overnight`);
  assert.equal(withoutModelNames("AI reasoning (o3) and AI combined (Fable 5)", AI_TEAM), "AI reasoning and AI combined");
  const payload = { strategies: [{ id: "ai.combined.fable5.v1", name: "AI combined (Fable 5)" }, { id: "ai.reasoning.o3.v1", name: "AI reasoning (o3)" }], line: "Best: AI reasoning (o3)" };
  const out = applyDisplayNames(payload);
  assert.deepEqual(out.strategies.map((x) => x.name), [publicOf("ai.combined.fable5.v1").label, publicOf("ai.reasoning.o3.v1").label]);
  assert.equal(out.line, `Best: ${publicOf("ai.reasoning.o3.v1").label}`);
  assert.equal(namesModel(JSON.stringify(out)), false);
});

test("judge 29, minor 2: a baseline named after a model never reaches the screen, in its field or in free text", () => {
  const payload = { strategies: [{ id: "base.llm_only.v1", name: "claude_opus_4 only" }, { id: "base.always_up.v1", name: "Always buy" }], line: "Beaten by claude_opus_4 only today" };
  const out = applyDisplayNames(payload);
  assert.deepEqual(out.strategies.map((x) => x.name), [publicOf("base.llm_only.v1").label, "Always buy"]);
  assert.equal(out.line, `Beaten by ${publicOf("base.llm_only.v1").label} today`);
  assert.equal(namesModel(JSON.stringify(out)), false);
});

// Follow-up to judge round 3: a bare "GPT" in prose and open-weight names ("gpt-oss-120b") are models; a security's
// name keeps "GPT Healthcare" unflagged, while a versioned model in a name is still caught.
test("prose flags a bare GPT and gpt-oss names; a security's name flags only a versioned model", () => {
  for (const [text, token] of [["Scored by GPT today", "GPT"], ["the gpt-oss-120b run", "gpt-oss-120b"], ["GPT-OSS-20B", "GPT-OSS-20B"], ["GPT Healthcare Limited", "GPT"]]) assert.equal(modelNameIn(text), token, text);
  assert.equal(modelNameIn("GPT Healthcare Limited", { security: true }), null);
  assert.equal(modelNameIn("GPT Infraprojects Limited", { security: true }), null);
  assert.equal(modelNameIn("Moneyview GPT-4o Limited", { security: true }), "GPT-4o");
  assert.equal(modelNameIn("Acme gpt-oss-120b Limited", { security: true }), "gpt-oss-120b");
  assert.equal(modelNameIn("GPTHEALTH"), null, "a symbol is not the word");
});
