// The Strategy lab's two tabs in India (story W3d): Stocks and F&O, each its own book and never combined (owner,
// 13 Oct 2026). Absent in the US, which has stocks only. Plain links: each tab is its own page.
import Link from "next/link";
import type { Market } from "../../lib/data/constants.ts";
import { pagePath } from "../../lib/ui/routes.ts";

export function LabTabs({ market, active }: { market: Market; active: "stocks" | "fno" }) {
  if (market !== "india") return null;
  const tab = (key: "stocks" | "fno", page: string, label: string) => (
    <Link href={pagePath(market, page)} aria-current={active === key ? "page" : undefined} aria-pressed={active === key}>{label}</Link>
  );
  return (
    <nav className="md-segmented dense tabs" aria-label="Strategy lab: Stocks or F&O">
      {tab("stocks", "lab", "Stocks")}
      {tab("fno", "lab-fno", "F&O")}
    </nav>
  );
}
