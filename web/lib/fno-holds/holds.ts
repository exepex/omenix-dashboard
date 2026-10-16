// The F&O pages held back (contract 2.13.0, page `page_holds`; judge 251 on exepex/trading P11): which page is held,
// since which session, by which rule, and what its screen shows meanwhile. Each held page says so on its own screen,
// never only by its age (the owner's "say so on screen"). The card keeps its own `withheld` notice instead. Pure.
import { fmtDateYear } from "../ui/format.ts";

export interface PageHold {
  page_key: string;
  since: string;
  reason: string;
  shows: "previous_page" | "nothing";
}

export interface FnoPageHolds {
  holds: PageHold[];
}

/** The page keys' names on screen, as mockup 44's "Pages held back" table says them. */
const PAGE_NAME: Record<string, string> = {
  forecast_lab: "Forecast lab",
  paper_trades: "Paper books",
  card: "Today's card",
  today: "Picks",
  risk: "Books on Home",
  weather: "Market weather",
  weather_history: "Weather history",
  strategy_lab: "Strategy lab: F&O",
  data_health: "Data health",
  budget: "AI usage and budget",
  scoreboards: "F&O scoreboards",
};

export const pageName = (key: string) => PAGE_NAME[key] ?? key;

export interface HeldView {
  /** "<page> held back since <date>: <reason>". */
  words: string;
  /** True when the screen shows nothing, not the dated previous page. */
  nothing: boolean;
}

export const NOT_PUBLISHED = "Not published while it is held back.";

/** The hold of one page, in words; null when the page is not held (or the holds are unknown). */
export function holdOf(holds: FnoPageHolds | null, pageKey: string): HeldView | null {
  const h = holds?.holds.find((x) => x.page_key === pageKey);
  return h ? { words: `${pageName(h.page_key)} held back since ${fmtDateYear(h.since)}: ${h.reason}`, nothing: h.shows === "nothing" } : null;
}

export interface HoldRow {
  page: string;
  since: string;
  why: string;
  shows: string;
}

/** Data health's "Pages held back" table, oldest hold first as sent. */
export const holdRowsOf = (holds: FnoPageHolds): HoldRow[] =>
  holds.holds.map((h) => ({
    page: pageName(h.page_key),
    since: fmtDateYear(h.since),
    why: h.reason,
    shows: h.shows === "previous_page" ? "Its last published page, dated, under a held-back notice" : "Not published, with the notice",
  }));
