// How current a page's F&O data is (story W2; ChatGPT review 28's runtime states): up to date, being updated (the last
// complete day is shown), out of date (the last complete day, with the reason) or unknown. Words and an icon, never
// colour alone. Absent with the fixtures, which carry no runtime state. Server-side.
import type { PublicationState } from "../../lib/fno/freshness.ts";
import { Icon } from "../ui/icon.tsx";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const TITLE = {
  publishing: (d: string) => `Updating: showing the NSE close of ${d} until today’s update arrives`,
  stale: (d: string) => `Out of date: showing the NSE close of ${d}`,
  unknown: (d: string) => `Showing the NSE close of ${d}; how current it is cannot be told`,
};

export function FreshnessNote({ status }: { status: PublicationState | null }) {
  if (!status) return null;
  const { state, reason } = status.freshness;
  const d = day(status.as_of);
  if (state === "fresh") return <p className="mb-asof" role="note" data-freshness="fresh"><Icon name="check" />{`F&O data: NSE close of ${d}, up to date`}</p>;
  return (
    <section className={`mb-alert${state === "publishing" ? " info" : ""}`} role="note" aria-label="How current the data is" data-freshness={state}>
      <Icon name={state === "publishing" ? "pending" : "warning"} />
      <div>
        <b className="t">{TITLE[state](d)}</b>
        <div className="s">{reason}</div>
      </div>
    </section>
  );
}
