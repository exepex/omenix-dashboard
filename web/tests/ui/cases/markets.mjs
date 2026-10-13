// UI cases of the Markets overview (story W12; design/mockups/34-markets, signed off 13 Oct 2026) on the running app,
// each beside the mockup's own picture of that state (gallery/<state>-<width>.png). The states W11's examples cover:
// the whole India page at 390 to 1280, one year, today, a charted index, the industries, the US (with the yields), the
// panel shown, dark and the tablet; and the 1W flows total that is complete. Not covered: listed in the claims.
import { marketsChecks, usMarketsChecks } from "./markets-checks.mjs";

const MOCKUP = "34-markets";
const shot = (state) => (w) => `gallery/${state}-${w}.png`;
const base = { mockup: MOCKUP, waitFor: ".markets .mb-heat", check: marketsChecks };

export const cases = [
  { ...base, name: "markets-india", path: "/india/markets", widths: [1280, 1024, 768, 390], mockupShot: shot("india"), expectText: ["Is the move broad?", "What did big investors do?", "How nervous is the market?", "What is coming?"] },
  { ...base, name: "markets-year", path: "/india/markets?per=y1", widths: [1280], mockupShot: shot("year") },
  { ...base, name: "markets-today", path: "/india/markets?per=d1", widths: [1280], mockupShot: shot("today") },
  { ...base, name: "markets-week-flows", path: "/india/markets?per=w1", widths: [1280], expectText: ["Over these 5 sessions foreign investors sold ₹30,294 crore net"] },
  { ...base, name: "markets-midcap", path: "/india/markets?idx=NIFTY%20Midcap%20100&per=m3", widths: [1280], mockupShot: shot("midcap"), expectText: ["NIFTY Midcap 100"] },
  { ...base, name: "markets-industries", path: "/india/markets?sec=industry", widths: [1280], mockupShot: shot("industries") },
  { ...base, name: "markets-panel-on", path: "/india/markets#wloff=0", widths: [1280], mockupShot: shot("panel-on"), expectSelector: [".mb-pf:not(.wl-off)"] },
  { ...base, name: "markets-dark", path: "/india/markets", theme: "dark", contrast: true, widths: [1280, 390], mockupShot: shot("dark") },
  { ...base, name: "markets-tablet", path: "/india/markets", widths: [768], mockupShot: shot("tablet") },
  { ...base, name: "markets-us", path: "/us/markets", market: "us", widths: [1280, 390], mockupShot: shot("us"), check: usMarketsChecks, expectText: ["What do interest rates say?", "Benchmarks"] },
];
