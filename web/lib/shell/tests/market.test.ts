// Story W8 AC4 (the rule): the market status chip and the one trade lock, from the session times of the contract.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { frameClock, marketState, marketTip, tradeLock } from "../market.ts";
import { frame, payload } from "./helpers.ts";

const india = frame("india").shell;
const us = frame("us").shell;
const at = (iso: string) => Date.parse(iso);

test("India at the fixture's clock (17:30 IST) is closed and opens Thu 8 Oct 09:15 IST", () => {
  const s = marketState(india, at(payload.now));
  assert.deepEqual(s, { open: false, word: "Closed", text: "opens Thu 8 Oct 09:15 IST" });
  assert.match(tradeLock(s) ?? "", /^Market closed: you can buy and sell again when it opens Thu 8 Oct 09:15 IST\./);
});

test("the US before its open (08:00 ET) is closed and opens today 09:30 ET", () => {
  assert.deepEqual(marketState(us, at(payload.now)), { open: false, word: "Closed", text: "opens today 09:30 ET" });
});

test("during the session the market is open, says its close, and nothing is locked", () => {
  const s = marketState(india, at("2026-10-07T05:43:00Z"));
  assert.deepEqual(s, { open: true, word: "Open", text: "closes 15:30 IST" });
  assert.equal(tradeLock(s), null);
});

test("the open instant is open, the close instant is closed", () => {
  assert.equal(marketState(india, at(india.status.open_utc!)).open, true);
  assert.equal(marketState(india, at(india.status.close_utc!)).open, false);
});

test("the example clock applies to example data only", () => {
  assert.equal(frameClock(india, payload.now, true, true), at(india.status.example_open_now ?? ""));
  assert.equal(frameClock(india, payload.now, false, true), at(payload.now), "live data never takes the example clock");
  assert.equal(frameClock(india, payload.now, true, false), at(payload.now));
});

// Contract 2.6: a session announced without its hours (the 8 Nov 2026 muhurat before NSE's timings circular) is said as
// such in plain words, never "market closed"; Buy and Sell wait for the hours and the open.
test("a session whose hours are not issued: \"Special session on Sun 8 Nov; hours not announced yet\", never closed", () => {
  const pending = { ...india, status: { session_date: "2026-11-08", open_utc: null, close_utc: null, next_open_utc: null, hours_status: "not_issued" as const } };
  const state = marketState(pending, Date.parse("2026-11-07T15:00:00Z"));
  assert.equal(`${state.word} ${state.text}`, "Special session on Sun 8 Nov; hours not announced yet");
  assert.equal(state.open, false);
  assert.equal(state.pending, true);
  const lock = tradeLock(state) ?? "";
  const tip = marketTip(pending, state, false);
  for (const words of [`${state.word} ${state.text}`, lock, tip]) assert.doesNotMatch(words, /closed/i, words);
  assert.match(lock, /^Special session on Sun 8 Nov; hours not announced yet: you can buy and sell once NSE announces the hours/);
  assert.match(tip, /special session on Sun 8 Nov; hours not announced yet/);
});

test("the example state of the contract renders the same through the frame's F&O overlay", async () => {
  const { withFnoParts } = await import("../fno-overlay.ts");
  const { fixtureShellData } = await import("../fixture-source.ts");
  const examples = JSON.parse(readFileSync(join(import.meta.dirname, "..", "..", "..", "..", "api/examples/blocks.json"), "utf8"));
  const pendingSession = examples.getSessionIndia_india_hours_not_issued.value.payload;
  const base = await fixtureShellData.read();
  const shell = withFnoParts(base, { session: { value: pendingSession }, indices: { missing: "-" }, picks: { missing: "-" } }, "2026-11-07T15:00:00Z", base.markets.india.status).markets.india;
  assert.equal(shell.status.hours_status, "not_issued");
  const state = marketState(shell, Date.parse("2026-11-07T15:00:00Z"));
  assert.equal(`${state.word} ${state.text}`, "Special session on Sun 8 Nov; hours not announced yet");
});
