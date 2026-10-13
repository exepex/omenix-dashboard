// UI cases of the app frame (story W8, design/mockups/30-shell, signed off 13 Oct 2026), on the running app:
//   - frame-page-*: every page of the app inside the frame at 390, 768, 1280 and 1680 px (AC1), reusing each page
//     session's own case (fixtures, texts, checks) and adding the frame's checks;
//   - frame-search-*: the one search box by name, ticker and NSE option code; none of F&O in the US (AC3);
//   - frame-lock / frame-open: every manual Buy and Sell disabled with the reason while the market is closed, enabled
//     on the labelled example clock during the session (AC4); the order window's preview (AC6);
//   - frame-compare-*: the frame beside the mockup's screenshots for the default, dark, US, open and closed-order
//     states at 1280 and 390 px (AC2; review images, never a failure by themselves).
import { cases as assistant } from "./assistant.mjs";
import { cases as companies } from "./companies.mjs";
import { cases as company } from "./company.mjs";
import { cases as help } from "./help.mjs";
import { cases as home } from "./home.mjs";
import { cases as news } from "./news.mjs";
import { cases as portfolios } from "./paper-portfolios.mjs";
import { cases as ruleVsAi } from "./rule-vs-ai.mjs";
import { cases as shell } from "./shell.mjs";
import { cases as lab } from "./strategy-lab.mjs";
import { cases as markets } from "./markets.mjs";
import { cases as screener } from "./screener.mjs";
import { cases as track } from "./track-record.mjs";
import { cases as watchlist } from "./watchlist.mjs";
import { frameChecks, lockChecks, openChecks, orderChecks, searchChecks, usChecks } from "./frame-checks.mjs";

const ALL = [...assistant, ...companies, ...company, ...help, ...home, ...news, ...portfolios, ...ruleVsAi, ...shell, ...lab, ...track, ...watchlist, ...screener, ...markets];
const PAGE_CASES = [
  "home-india", "home-us", "watchlist-india", "news-india", "companies-india", "company-reliance", "company-aapl", "lifecycle-reliance",
  "strategies-reliance", "strategy-lab-india", "rule-vs-ai-india", "paper-portfolio-v3-india", "track-record-india", "help-india",
  "assistant-india", "gallery", "screener-stocks", "screener-us", "markets-india", "markets-us",
];
const WIDTHS = [390, 768, 1280, 1680];

function inFrame(name) {
  const page = ALL.find((c) => c.name === name);
  if (!page) throw new Error(`frame.mjs: no page case named ${name}`);
  const { mockup: _oldMockup, check, ...rest } = page;
  return {
    ...rest,
    name: `frame-page-${name}`,
    widths: WIDTHS,
    check: async (p, ctx) => [...(await frameChecks(p, ctx)), ...((check && (await check(p, ctx))) ?? [])],
  };
}

const MOCKUP = "30-shell";
const PAGE = "/india/watchlist";
const compare = (name, path, shot, extra = {}) => ({ name: `frame-compare-${name}`, path, mockup: MOCKUP, mockupShot: shot, widths: [1280, 390], waitFor: ".mb-appbar", keyboard: false, ...extra });

export const cases = [
  ...PAGE_CASES.map(inFrame),
  { name: "frame-search-india", path: PAGE, widths: [1280, 390], waitFor: ".mb-appbar", keyboard: false, check: searchChecks },
  { name: "frame-us", path: "/us/watchlist", market: "us", widths: [1280, 390], waitFor: ".mb-appbar", keyboard: false, check: usChecks },
  { name: "frame-lock", path: PAGE, widths: [1280, 390], waitFor: ".mb-appbar", keyboard: false, check: lockChecks },
  { name: "frame-open", path: `${PAGE}#clock=open`, widths: [1280, 390], waitFor: ".mb-mkt.open", keyboard: false, check: openChecks },
  { name: "frame-order", path: `${PAGE}#clock=open`, widths: [1280], waitFor: ".mb-mkt.open", keyboard: false, check: orderChecks },
  compare("default", PAGE, (w) => `shot-${w}-full.png`),
  compare("dark", PAGE, (w) => `shot-dark-${w}-full.png`, { theme: "dark", contrast: true }),
  compare("us", "/us/watchlist", (w) => `shot-us-${w}-full.png`, { market: "us" }),
  compare("open", `${PAGE}#clock=open`, (w) => `shot-open-${w}-full.png`, { waitFor: ".mb-mkt.open" }),
  compare("closed-order", `${PAGE}#drawer=order:RELIANCE:buy`, (w) => `shot-closed-order-${w}-viewport.png`, { waitFor: ".mb-drawer.open" }),
  compare("order", `${PAGE}#clock=open&drawer=order:NIFTY26OCT23300CE:buy`, (w) => `shot-order-${w}-viewport.png`, { waitFor: ".mb-drawer.open" }),
  compare("palette-code", `${PAGE}#pal=NIFTY26OCT22800CE`, (w) => `shot-palette-code-${w}-viewport.png`, { waitFor: ".mb-modal.palette.on" }),
];
