// Story W8 AC4 (the rule): the market status chip and the one trade lock, from the session times of the contract.
import assert from "node:assert/strict";
import { test } from "node:test";
import { frameClock, marketState, tradeLock } from "../market.ts";
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
  assert.equal(marketState(india, at(india.status.open_utc)).open, true);
  assert.equal(marketState(india, at(india.status.close_utc)).open, false);
});

test("the example clock applies to example data only", () => {
  assert.equal(frameClock(india, payload.now, true, true), at(india.status.example_open_now ?? ""));
  assert.equal(frameClock(india, payload.now, false, true), at(payload.now), "live data never takes the example clock");
  assert.equal(frameClock(india, payload.now, true, false), at(payload.now));
});
