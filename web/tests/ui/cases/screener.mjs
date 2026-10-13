// UI cases of the Screener (story W12; design/mockups/33-screener, signed off 13 Oct 2026) on the running app, each
// beside the mockup's own picture of that state (gallery/<state>-<width>.png). The states W11's examples cover: every
// gallery state (W11 round 2 added the examples for the followed companies, a year, volume, oversold, our strategies,
// results, the filters, a followed company's Buy, and three F&O screens).
import { screenerChecks, usScreenerChecks } from "./screener-checks.mjs";

const MOCKUP = "33-screener";
const shot = (state) => (w) => `gallery/${state}-${w}.png`;
const base = { mockup: MOCKUP, waitFor: ".screener .count", check: screenerChecks };

export const cases = [
  // judge 45: a model planted in a security's name is flagged by the page gate (the display rule never rewrites it)
  { ...base, name: "screener-stocks", path: "/india/screener", widths: [1280, 1024, 768, 390], mockupShot: shot("stocks"), expectText: ["Today: up and down", "Ready-made screens", "2,924 stocks"], modelPlant: [".mb-scr tbody tr:nth-child(2) td small", "Moneyview GPT-4o Limited"] },
  { ...base, name: "screener-high", path: "/india/screener?pre=high", widths: [1280, 390], mockupShot: shot("high"), expectText: ["sorted by closest to the 52-week high"] },
  { ...base, name: "screener-tablet", path: "/india/screener?pre=high", widths: [768], mockupShot: shot("tablet") },
  { ...base, name: "screener-fno", path: "/india/screener?tab=fno", widths: [1280, 1024, 390], mockupShot: shot("fno"), expectText: ["Long build-up", "219 underlyings"] },
  { ...base, name: "screener-dark", path: "/india/screener?tab=fno", theme: "dark", contrast: true, widths: [1280, 390], mockupShot: shot("dark") },
  { ...base, name: "screener-panel-on", path: "/india/screener#wloff=0", widths: [1280], mockupShot: shot("panel-on"), expectSelector: [".mb-pf:not(.wl-off)"] },
  { ...base, name: "screener-not-followed", path: "/india/screener#clock=open", widths: [1280], mockupShot: shot("not-followed"), waitFor: ".mb-mkt.open" },
  { ...base, name: "screener-ours", path: "/india/screener?uni=ours", widths: [1280, 390], mockupShot: shot("ours"), expectText: ["20 stocks"] },
  { ...base, name: "screener-year", path: "/india/screener?uni=n500&per=y1&sort=chg", widths: [1280], mockupShot: shot("year"), expectText: ["sorted by change in a year"] },
  { ...base, name: "screener-volume", path: "/india/screener?pre=volume", widths: [1280], mockupShot: shot("volume"), expectText: ["sorted by volume against its usual"] },
  { ...base, name: "screener-oversold", path: "/india/screener?uni=n500&pre=oversold", widths: [1280], mockupShot: shot("oversold"), expectText: ["sorted by lowest RSI"] },
  { ...base, name: "screener-picks", path: "/india/screener?pre=picks", widths: [1280], mockupShot: shot("picks"), expectText: ["sorted by strategies buying"] },
  { ...base, name: "screener-results", path: "/india/screener?pre=results", widths: [1280], mockupShot: shot("results"), expectText: ["sorted by soonest results"] },
  { ...base, name: "screener-filters", path: "/india/screener?fopen=1&f=pmin:100,cmin:5,dl:60", widths: [1280, 390], mockupShot: shot("filters"), expectText: ["Filters (3)", "Clear filters"] },
  { ...base, name: "screener-buy", path: "/india/screener?uni=ours#clock=open&drawer=order:RELIANCE:buy", widths: [1280, 390], mockupShot: shot("buy"), waitFor: ".mb-mkt.open", keyboard: false, expectSelector: [".mb-drawer.open"] },
  { ...base, name: "screener-fno-short", path: "/india/screener?tab=fno&fpre=short_buildup", widths: [1280, 390], mockupShot: shot("fno-short"), expectText: ["sorted by open interest change"] },
  { ...base, name: "screener-fno-ivhigh", path: "/india/screener?tab=fno&fpre=ivhigh", widths: [1280], mockupShot: shot("fno-ivhigh"), expectText: ["sorted by IV against its 3-month range"] },
  { ...base, name: "screener-fno-index", path: "/india/screener?tab=fno&fpre=index", widths: [1280], mockupShot: shot("fno-index"), expectText: ["6 underlyings"] },
  { ...base, name: "screener-us", path: "/us/screener", market: "us", widths: [1280, 390], mockupShot: shot("us"), check: usScreenerChecks, expectText: ["The 20 companies our tools follow"] },
];
