// F&O is India only: the US frame data carries no F&O element (absent, not empty); currencies stay apart.
import assert from "node:assert/strict";
import { test } from "node:test";
import { withoutFno } from "../view.ts";
import { frame, payload } from "./helpers.ts";

test("the US frame has no F&O instrument, state, margin or option quotes", () => {
  const us = frame("us").shell;
  assert.equal(us.fno, false);
  assert.ok(Object.values(us.items).every((i) => i.kind !== "option" && i.kind !== "future" && !i.fno));
  assert.equal("fno_state" in us, false);
  assert.equal("short_option_margin_per_lot" in us, false);
  assert.deepEqual(Object.keys(us.next_quotes), ["stock"]);
});

test("a market without F&O loses planted F&O items, and the signals and lists pointing at them", () => {
  const india = payload.markets.india;
  const planted = withoutFno({ ...india, fno: false });
  assert.ok(!("NIFTY26OCT22800CE" in planted.items));
  assert.ok(planted.signals.every((s) => s.id in planted.items));
  assert.ok(planted.indices.every((id) => id in planted.items));
  assert.ok(planted.recent.every((id) => id in planted.items));
});

test("India keeps its F&O untouched", () => {
  assert.equal(frame("india").shell, payload.markets.india);
});

test("each market has its own currency and manual account; nothing converts or merges them", () => {
  assert.equal(frame("india").shell.currency, "INR");
  assert.equal(frame("us").shell.currency, "USD");
  for (const m of ["india", "us"] as const) {
    const accounts = Object.values(frame(m).shell.accounts);
    assert.ok(accounts.every((a) => a.currency === frame(m).shell.currency), m);
    assert.equal(accounts.filter((a) => a.kind === "manual").length, 1, m);
  }
});

test("the payload is labelled example data, both market labels reach the switch", () => {
  const f = frame("india");
  assert.equal(f.example, true);
  assert.deepEqual(f.marketLabels, { india: "India", us: "US" });
});
