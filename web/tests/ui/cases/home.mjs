// UI cases of Home (story W9; design/mockups/31-dashboard, signed off 13 Oct 2026) on the running app, at the gallery's
// widths, each beside the mockup's own picture of that state (gallery/<state>-<width>.png). The states the fixture
// covers: the whole page (India at 390 to 1680, during the session, dark, the US) and the open-trades tabs.
import { indiaChecks, openChecks, usChecks } from "./home-checks.mjs";

const MOCKUP = "31-dashboard";
const shot = (state) => (w) => `gallery/${state}-${w}.png`;
const base = { mockup: MOCKUP, waitFor: ".home .mb-apcard" };
const TEXTS = ["Your paper account · open profit", "Top pick · 13 of 15 strategies buy", "Who trades, and how it is going", "Open paper trades", "Needs you", "Coming up", "Top news"];

export const cases = [
  { ...base, name: "home-india", path: "/india", widths: [1680, 1280, 1024, 768, 390], mockupShot: shot("home"), expectText: [...TEXTS, "Stocks: total profit / loss", "F&O: total profit / loss", "No strategy yet"], check: indiaChecks },
  { ...base, name: "home-us", path: "/us", market: "us", widths: [1280, 390], mockupShot: shot("home-us"), expectText: ["Total profit / loss", "Who trades, and how it is going"], check: usChecks },
  { ...base, name: "home-open", path: "/india#clock=open", widths: [1280, 390], mockupShot: shot("home-open"), waitFor: ".mb-mkt.open", check: openChecks },
  { ...base, name: "home-dark", path: "/india", theme: "dark", contrast: true, widths: [1280, 390], mockupShot: shot("home-dark") },
  { ...base, name: "home-trades-ai", path: "/india#own=ai", widths: [1280, 390], mockupShot: shot("trades-ai") },
  { ...base, name: "home-trades-hybrid", path: "/india#own=hybrid", widths: [1280, 390], mockupShot: shot("trades-hybrid"), expectText: ["Nothing open here."] },
  { ...base, name: "home-trades-baselines", path: "/india#own=baseline", widths: [1280, 390], mockupShot: shot("trades-baselines") },
];
