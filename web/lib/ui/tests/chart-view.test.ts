import assert from "node:assert/strict";
import { test } from "node:test";
import { MIN_POINTS, canZoomIn, clampWindow, indexAt, initialWindow, isWhole, panWindow, pinchFactor, showsNewest, wheelFactor, zoomWindow } from "../chart-view.ts";

test("a chart opens on the whole series, or on its last points when asked (the phone's 30 sessions)", () => {
  assert.deepEqual(initialWindow(120), { start: 0, end: 120 });
  assert.deepEqual(initialWindow(120, 30), { start: 90, end: 120 });
  assert.deepEqual(initialWindow(20, 30), { start: 0, end: 20 });
  assert.deepEqual(initialWindow(0), { start: 0, end: 0 });
});

test("zoom in keeps the point under the pointer in place; zoom out returns to the whole series", () => {
  const whole = { start: 0, end: 120 };
  const right = zoomWindow(whole, 120, 2, 1);
  assert.deepEqual(right, { start: 60, end: 120 }, "zooming at the right edge keeps the newest day in view");
  const middle = zoomWindow(whole, 120, 2, 0.5);
  assert.deepEqual(middle, { start: 30, end: 90 });
  assert.deepEqual(zoomWindow(middle, 120, 0.5), whole);
  assert.ok(isWhole(zoomWindow(right, 120, 1 / 100), 120), "zoom out stops at the whole series");
});

test("zoom in stops at the minimum span; a short series cannot zoom in", () => {
  let w = { start: 0, end: 120 };
  for (let i = 0; i < 30; i++) w = zoomWindow(w, 120, 2, 0.3);
  assert.equal(w.end - w.start, MIN_POINTS);
  assert.equal(canZoomIn(w, 120), false);
  assert.equal(canZoomIn({ start: 0, end: 4 }, 4), false);
});

test("pan moves the window and stops at either end with its span kept", () => {
  const w = { start: 30, end: 90 };
  assert.deepEqual(panWindow(w, 120, 10), { start: 40, end: 100 });
  assert.deepEqual(panWindow(w, 120, 100), { start: 60, end: 120 });
  assert.deepEqual(panWindow(w, 120, -100), { start: 0, end: 60 });
  assert.equal(showsNewest(panWindow(w, 120, 100), 120), true);
});

test("clamping repairs a window outside the series or too narrow", () => {
  assert.deepEqual(clampWindow({ start: -5, end: -3 }, 50), { start: 0, end: MIN_POINTS });
  assert.deepEqual(clampWindow({ start: -5, end: 3 }, 50), { start: 0, end: 8 }, "a window past the start slides back in whole");
  assert.deepEqual(clampWindow({ start: 40, end: 200 }, 50), { start: 0, end: 50 });
});

test("the point under the pointer is inside the window", () => {
  const w = { start: 10, end: 20 };
  assert.equal(indexAt(w, 0), 10);
  assert.equal(indexAt(w, 0.55), 15);
  assert.equal(indexAt(w, 1), 19);
  assert.equal(indexAt(w, -1), 10);
});

test("wheel and pinch factors: a notch up zooms in one step, a pinch apart zooms in", () => {
  assert.ok(Math.abs(wheelFactor(-100) - 1.5) < 1e-9);
  assert.ok(Math.abs(wheelFactor(100) - 1 / 1.5) < 1e-9);
  assert.ok(wheelFactor(-10000) <= Math.pow(1.5, 3) + 1e-9, "a fast flick is capped");
  assert.equal(pinchFactor(100, 150), 1.5);
  assert.equal(pinchFactor(0, 150), 1);
});
