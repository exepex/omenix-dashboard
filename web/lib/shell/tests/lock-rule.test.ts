// Story W8 AC4 (structure): every manual Buy and Sell control of the frame is rendered by components/frame/trade.tsx,
// which disables it with the reason from the one rule (lib/shell/market.ts tradeLock); search results, picks, hover
// card and quick view use it. Its behaviour in the running app is the UI case "frame-lock" (tests/ui/cases/frame.mjs).
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const dir = join(import.meta.dirname, "..", "..", "..", "components", "frame");
const files = Object.fromEntries(readdirSync(dir).map((f) => [f, readFileSync(join(dir, f), "utf8")]));
/** Class names of a Buy or Sell trade control (not the order window's side switch, which only picks the preview's side). */
const TRADE_CONTROL = /md-btn small \$\{side\}|["'`]md-btn small (buy|sell)|["'`]mb-bs (buy|sell)|mb-bs \$\{side\}|md-btn filled buy|data-trade=/;

test("only trade.tsx draws Buy and Sell controls", () => {
  const drawers = Object.entries(files).filter(([, text]) => TRADE_CONTROL.test(text)).map(([f]) => f);
  assert.deepEqual(drawers, ["trade.tsx"]);
});

test("trade.tsx disables every control from the lock and states the reason", () => {
  const t = files["trade.tsx"];
  assert.match(t, /disabled=\{lock !== null\}/);
  assert.match(t, /aria-label=\{lock \? `\$\{label\}: \$\{lock\}` : label\}/);
  assert.match(t, /data-tip=\{lock \?\? undefined\}/, "the pair's wrapper shows the reason on hover");
  assert.match(files["frame-context.tsx"], /lock: string \| null;/);
  assert.match(files["use-frame-state.ts"], /const lock = tradeLock\(status\);/, "the lock is the one rule of lib/shell/market.ts");
});

test("search results, picks, hover card and quick view take their Buy and Sell from trade.tsx", () => {
  for (const f of ["palette.tsx", "pick-row.tsx", "hover-card.tsx"]) assert.match(files[f], /import \{ TradePair \} from "\.\/trade\.tsx";/, f);
  assert.match(files["drawer.tsx"], /InstrumentBody/, "the quick view reuses the hover card's body");
});

test("the keyboard's B and S refuse with the same reason while locked; the order window shows the lock as a failed check", () => {
  assert.match(files["shortcuts.tsx"], /if \(f\.lock\) return f\.snack\(f\.lock\);/);
  assert.match(files["order-window.tsx"], /preview\(shell, it, o, lock,/);
});
