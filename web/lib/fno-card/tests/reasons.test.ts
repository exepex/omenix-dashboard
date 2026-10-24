// Story W3i (contract 2.14.0): the card's reasons in TypeScript are exactly the contract's, in its order, so a code
// added to one and not the other fails here. web/ has no YAML parser, so the one flow-style `enum:` line under the
// card's `reason:` is read as text; if the schema is ever written in block style, this reader fails and changes with it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { web } from "../../shell/tests/imports.ts";
import { cardExample } from "../fixture-source.ts";
import { NO_TRADE_REASONS } from "../reasons.ts";
import { headerOf } from "../view.ts";

const SCHEMA = join(web, "..", "api/schemas/fno-card.yaml");

/** The codes of FnoCard.reason's enum without null; throws when the key or its one-line enum is not where expected. */
function reasonEnum(text: string): string[] {
  const lines = text.split("\n");
  const start = lines.indexOf("    reason:");
  const end = lines.findIndex((line, i) => i > start && /^ {4}\S/.test(line));
  const body = start < 0 ? [] : lines.slice(start + 1, end < 0 ? undefined : end);
  const list = body.map((line) => /^ {6}enum: \[(.*)\]$/.exec(line)?.[1]).find((m) => m !== undefined);
  if (list === undefined) throw new Error("reason enum not found");
  return list.split(",").map((code) => code.trim()).filter((code) => code !== "null");
}

test("the TypeScript list equals the contract's reason enum, order included", () => {
  assert.deepEqual([...NO_TRADE_REASONS], reasonEnum(readFileSync(SCHEMA, "utf8")));
});

test("the three codes the backend already gives are allowed (W3i)", () => {
  for (const code of ["trade_fields_not_built", "hard_rule_breach", "step_problems"]) assert.ok((NO_TRADE_REASONS as readonly string[]).includes(code), code);
});

test("plants: the reader fails loudly, never reads half a list or nothing", () => {
  const schema = readFileSync(SCHEMA, "utf8");
  assert.throws(() => reasonEnum(schema.replace("    reason:\n", "    why:\n")), /reason enum not found/);
  const split = schema.replace(/^( {6}enum: \[no_approved_strategy,)(.*)$/m, "$1\n        $2");
  assert.throws(() => reasonEnum(split), /reason enum not found/);
  const missing = reasonEnum(schema.replace(", step_problems,", ","));
  assert.throws(() => assert.deepEqual([...NO_TRADE_REASONS], missing), /step_problems/);
});

test("no screen word depends on the code: the verdict shows the backend's sentence", () => {
  const none = cardExample("getFnoCard_india_none");
  assert.equal(headerOf({ ...none, reason: "step_problems" }).why, headerOf(none).why);
});
