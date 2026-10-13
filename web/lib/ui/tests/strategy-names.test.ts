// Story W9 criterion 5: the one display-name rule. Over every fixture the app renders (the old pages' mockup data,
// the UI harness's stored payloads, the frame's and Home's fixtures), no AI model name is left in any text a screen
// could show; strategy ids (keys, never shown) stay unchanged so links and lookups keep working.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { modelNameIn, namesModel, withoutModelNames } from "../model-names.ts";
import { AI_TEAM, applyDisplayNames, citedId, displayNames } from "../strategy-names.ts";

const web = join(import.meta.dirname, "..", "..", "..");
const repo = join(web, "..");
const json = (path: string) => JSON.parse(readFileSync(path, "utf8").replace(/\bNaN\b/g, "null"));
const mockups = readdirSync(join(repo, "design", "mockups")).filter((d) => /^\d\d-/.test(d)).map((d) => join(repo, "design", "mockups", d, "data.json"));
const stored = ["b16", "ux3"].flatMap((d) => readdirSync(join(web, "tests", "ui", d)).filter((f) => f.endsWith(".json")).map((f) => join(web, "tests", "ui", d, f)));
const examples = readdirSync(join(web, "lib", "fixtures")).filter((f) => f.endsWith(".json")).map((f) => join(web, "lib", "fixtures", f));
const FIXTURES = [...mockups, ...stored, ...examples];

/** Every text value a screen could show as prose: string values that are not identifiers (strategy, trade and record
 *  ids are keys; a page that shows one as text passes it through citedId, tested below). */
function texts(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => texts(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => texts(v, out));
  return out.filter((s) => /\s/.test(s) || !/[.:]/.test(s));
}

test("the fixtures really carry model names (the rule has work to do)", () => {
  assert.ok(FIXTURES.length > 15);
  assert.ok(FIXTURES.some((f) => texts(json(f)).some(namesModel)));
});

test("after the rule, no fixture text names an AI model", () => {
  for (const f of FIXTURES) {
    const left = texts(applyDisplayNames(json(f))).filter(namesModel);
    assert.deepEqual(left.slice(0, 3), [], f);
  }
});

test("AI strategies read as the AI team with their role; collisions get letters; other names stay", () => {
  const shown = displayNames(new Map([
    ["ai.combined.opus.v1", "AI combined (Opus)"],
    ["ai.combined.sonnet.v1", "AI combined (Sonnet)"],
    ["ai.news_results.sonnet.v1", "AI news & results (Sonnet)"],
    ["rule.model_news.v1", "Model + news"],
    ["base.always_up.v1", "Always buy"],
  ]));
  assert.deepEqual(Object.fromEntries(shown), {
    "rule.model_news.v1": "Model + news",
    "base.always_up.v1": "Always buy",
    "ai.combined.opus.v1": `${AI_TEAM} · combined A`,
    "ai.combined.sonnet.v1": `${AI_TEAM} · combined B`,
    "ai.news_results.sonnet.v1": `${AI_TEAM} · news & results`,
  });
});

test("names are replaced everywhere they appear, ids are kept, the input is not changed", () => {
  const payload = { strategies: { "ai.combined.opus.v1": { name: "AI combined (Opus)", family: "ai" } }, nearest: { strategy_id: "ai.combined.opus.v1", name: "AI combined (Opus)" }, line: "Closest to passing: AI combined (Opus) (AI trader)" };
  const out = applyDisplayNames(payload);
  assert.equal(out.strategies["ai.combined.opus.v1"].name, `${AI_TEAM} · combined`);
  assert.equal(out.nearest.strategy_id, "ai.combined.opus.v1");
  assert.equal(out.line, `Closest to passing: ${AI_TEAM} · combined (AI trader)`);
  assert.equal(payload.line, "Closest to passing: AI combined (Opus) (AI trader)");
});

test("clean names are kept as published, even when several AI strategies share one ('AI team')", () => {
  const payload = { trades: [{ strategy_id: "ai.combined.opus.v1", strategy: "AI team" }, { strategy_id: "ai.news_results.sonnet.v1", strategy: "AI team" }], line: "3 trades: AI team · N+5" };
  assert.deepEqual(applyDisplayNames(payload), payload);
});

// Judge 45: the rule renames strategies only. Other text is never rewritten; a model name in it is flagged by the
// detector (the UI harness's gate on every page), so a leak is seen, not hidden.
test("text outside any strategy name stays exactly as published, and a model named in it is flagged, not rewritten", () => {
  for (const note of ["Scored by GPT-4o (beta)", "Asked in the Claude app", "Model + news"]) assert.equal(applyDisplayNames({ note }).note, note);
  assert.equal(namesModel("Scored by GPT-4o (beta)"), true);
  assert.equal(namesModel("Asked in the Claude app"), true);
});

test("security names are never touched: GPT Healthcare and GPT Infraprojects stay; a planted model in a name is caught", () => {
  const rows = [{ s: "GPTHEALTH", n: "GPT Healthcare Limited" }, { s: "GPTINFRA", n: "GPT Infraprojects Limited" }, { s: "MONEYVIEW", n: "Moneyview GPT-4o Limited" }];
  assert.deepEqual(applyDisplayNames({ rows }).rows, rows, "the rule leaves security text alone");
  assert.equal(modelNameIn("GPT Healthcare Limited"), null);
  assert.equal(modelNameIn("GPT Infraprojects Limited"), null);
  assert.equal(modelNameIn("Moneyview GPT-4o Limited"), "GPT-4o", "the page gate flags it");
});

test("a quoted id of a strategy the payload does not name reads as its approach and role, never raw", () => {
  const out = applyDisplayNames({ line: "First settled week: rule.model_news.v1 +7.99 USD on 6 trades, ai.combined.opus.v1 -6.64 USD on 3" });
  assert.equal(out.line, `First settled week: rule.model_news.v1 +7.99 USD on 6 trades, ${AI_TEAM} · combined -6.64 USD on 3`);
  assert.equal(namesModel(out.line), false);
});

test("a strategy id quoted in a sentence reads as its display name (06's first settled week)", () => {
  const payload = { strategies: { "ai.combined.opus.v1": { name: "AI combined (Opus)" }, "rule.model_news.v1": { name: "Model + news" } }, line: "First settled week: rule.model_news.v1 -3,807.75 INR on 2 trades, ai.combined.opus.v1 -3,807.75 INR on 2" };
  assert.equal(applyDisplayNames(payload).line, `First settled week: Model + news -3,807.75 INR on 2 trades, ${AI_TEAM} · combined -3,807.75 INR on 2`);
});

test("identifiers (trade and record ids) are keys: never rewritten, so lookups by id keep working", () => {
  const ids = { trade: "acc:ai.combined.opus.v1:2026-09-29-RELIANCE-3d", hash: "story=tra:acc:ai.combined.opus.v1:2026-09-29-RELIANCE-3d", strategy: "ai.combined.opus.v1" };
  assert.deepEqual(applyDisplayNames(ids), ids);
});

test("a cited id shown as text reads each strategy id as its display name, still traceable, naming no model", () => {
  const strategies = { "ai.combined.opus.v1": { name: `${AI_TEAM} · combined A` }, "rule.model_news.v1": { name: "Model + news" } };
  assert.equal(citedId("tra:acc:ai.combined.opus.v1:2026-09-29-RELIANCE-3d:biggest_win", strategies), `tra:acc:[${AI_TEAM} · combined A]:2026-09-29-RELIANCE-3d:biggest_win`);
  assert.equal(citedId("rule.model_news.v1", strategies), "[Model + news]");
  assert.equal(namesModel(citedId("acc:ai.unknown.sonnet.v1:x", strategies)), false);
  assert.equal(citedId("news:abc123", strategies), "news:abc123");
});


// Judge 24 (W9): a fixed list of names was the wrong design. Names come from the allowlist; detection is generic.
test("names come from the allowlist: a role it knows reads as approach and role, an unknown one as the approach only", () => {
  const shown = displayNames(new Map([
    ["ai.combined.fable5.v1", "AI combined (Fable 5)"],
    ["ai.reasoning.o3.v1", "AI reasoning (o3)"],
    ["ai.pattern_mood.sonnet.v1", "AI price pattern & mood (Sonnet)"],
    ["hybrid.momentum.gpt5.v1", "Hybrid momentum (GPT-5)"],
    ["hybrid.calm.v1", "Rules + a careful reader"],
    ["rule.model_news.v1", "Model + news (claude-sonnet-5)"],
  ]));
  assert.deepEqual(Object.fromEntries(shown), {
    "ai.combined.fable5.v1": `${AI_TEAM} · combined`,
    "ai.reasoning.o3.v1": AI_TEAM,
    "ai.pattern_mood.sonnet.v1": `${AI_TEAM} · price pattern & mood`,
    "hybrid.momentum.gpt5.v1": "Hybrid B", // letters by id: hybrid.calm sorts first
    "hybrid.calm.v1": "Hybrid A",
    "rule.model_news.v1": "Rule-based",
  });
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
  assert.deepEqual(out.strategies.map((x) => x.name), [`${AI_TEAM} · combined`, AI_TEAM]);
  assert.equal(out.line, `Best: ${AI_TEAM}`);
});

test("judge 29, minor 2: a baseline named after a model never reaches the screen, in its field or in free text", () => {
  const payload = { strategies: [{ id: "base.llm_only.v1", name: "claude_opus_4 only" }, { id: "base.always_up.v1", name: "Always buy" }], line: "Beaten by claude_opus_4 only today" };
  const out = applyDisplayNames(payload);
  assert.deepEqual(out.strategies.map((x) => x.name), ["Baseline", "Always buy"]);
  assert.equal(out.line, "Beaten by Baseline today");
  assert.equal(namesModel(JSON.stringify(out)), false);
});
