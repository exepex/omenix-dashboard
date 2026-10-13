// UI cases of the Screener (story W12; design/mockups/33-screener, signed off 13 Oct 2026) on the running app, each
// beside the mockup's own picture of that state (gallery/<state>-<width>.png). The states W11's examples cover: every
// NSE stock by value traded, near the 52-week high, the F&O tab, the US, the panel shown, dark and the tablet; a
// followed company's Buy during the session. Not covered (no example answers the query): listed in the claims.
import { screenerChecks, usScreenerChecks } from "./screener-checks.mjs";

const MOCKUP = "33-screener";
const shot = (state) => (w) => `gallery/${state}-${w}.png`;
const base = { mockup: MOCKUP, waitFor: ".screener .count", check: screenerChecks };

export const cases = [
  { ...base, name: "screener-stocks", path: "/india/screener", widths: [1280, 1024, 768, 390], mockupShot: shot("stocks"), expectText: ["Today: up and down", "Ready-made screens", "2,924 stocks"] },
  { ...base, name: "screener-high", path: "/india/screener?pre=high", widths: [1280, 390], mockupShot: shot("high"), expectText: ["sorted by closest to the 52-week high"] },
  { ...base, name: "screener-tablet", path: "/india/screener?pre=high", widths: [768], mockupShot: shot("tablet") },
  { ...base, name: "screener-fno", path: "/india/screener?tab=fno", widths: [1280, 1024, 390], mockupShot: shot("fno"), expectText: ["Long build-up", "219 underlyings"] },
  { ...base, name: "screener-dark", path: "/india/screener?tab=fno", theme: "dark", contrast: true, widths: [1280, 390], mockupShot: shot("dark") },
  { ...base, name: "screener-panel-on", path: "/india/screener#wloff=0", widths: [1280], mockupShot: shot("panel-on"), expectSelector: [".mb-pf:not(.wl-off)"] },
  { ...base, name: "screener-not-followed", path: "/india/screener#clock=open", widths: [1280], mockupShot: shot("not-followed"), waitFor: ".mb-mkt.open" },
  { ...base, name: "screener-us", path: "/us/screener", market: "us", widths: [1280, 390], mockupShot: shot("us"), check: usScreenerChecks, expectText: ["The 20 companies our tools follow"] },
];
