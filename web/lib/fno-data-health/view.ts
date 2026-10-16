// The F&O data health in words (story W3e; design/mockups/44-data-health, its 2-health.js): the last publish and the
// evening health check first (did today's data arrive?), then each source in the payload's order (worst first, as
// sent). Dates, counts and statuses only; the screen computes nothing beyond drawing. Pure.
import { DASH, fmtDateYear } from "../ui/format.ts";
import type { FnoDataHealth, HealthCheck, PublishRun, SourceStatus } from "./contract.ts";

export type Tone = "success" | "warn" | "danger" | "neutral";
export interface Look {
  tone: Tone;
  icon: string;
  word: string;
}

const PUBLISH: Record<PublishRun["status"], Look> = {
  published: { tone: "success", icon: "check", word: "Published" },
  failed: { tone: "danger", icon: "close", word: "Failed: yesterday’s pages stay" },
  publishing: { tone: "neutral", icon: "schedule", word: "Publishing" },
  not_run: { tone: "neutral", icon: "remove", word: "Not run yet" },
};

const CHECK: Record<HealthCheck["status"], Look> = {
  ok: { tone: "success", icon: "check", word: "All expected files and runs found" },
  problems: { tone: "danger", icon: "warning", word: "Problems found" },
  not_run: { tone: "neutral", icon: "remove", word: "Not run yet" },
};

const SOURCE: Record<SourceStatus, Look> = {
  ok: { tone: "success", icon: "check", word: "Up to date" },
  stale: { tone: "warn", icon: "schedule", word: "Behind" },
  gaps: { tone: "warn", icon: "warning", word: "Days missing" },
  missing: { tone: "danger", icon: "block", word: "No file" },
};

export interface RunView {
  look: Look;
  when: string;
  reason: string | null;
}

export const publishOf = (h: FnoDataHealth): RunView => ({
  look: PUBLISH[h.publish.status],
  when: h.publish.run_on ? `For the session of ${fmtDateYear(h.publish.run_on)}` : "No publish yet.",
  reason: h.publish.reason,
});

export const checkOf = (h: FnoDataHealth): RunView => ({
  look: CHECK[h.health_check.status],
  when: h.health_check.run_on ? `${fmtDateYear(h.health_check.run_on)} · ${h.health_check.problems} problem${h.health_check.problems === 1 ? "" : "s"}` : "No check yet.",
  reason: null,
});

export interface SourceRow {
  id: string;
  plain: string;
  look: Look;
  lastDay: string;
  rows: string;
  gaps: string;
}

export const sourcesOf = (h: FnoDataHealth): SourceRow[] =>
  h.sources.map((s) => ({ id: s.source, plain: s.plain, look: SOURCE[s.status], lastDay: s.last_day ? fmtDateYear(s.last_day) : DASH, rows: s.rows.toLocaleString("en-IN"), gaps: String(s.gaps) }));

export const NO_SOURCES = "No source checked yet.";
