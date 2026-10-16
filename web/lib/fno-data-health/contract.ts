// The F&O data health's read model (story W3e; contract FnoDataHealth, api/schemas/fno-data-health.yaml, 2.8.0): what
// the page `data_health` of exepex/trading's F&O publication carries. Dates, counts and statuses only, never a data
// value (the contract's x-never-sent). Types only.

export type SourceStatus = "ok" | "stale" | "gaps" | "missing";

export interface DataSource {
  source: string;
  plain: string;
  last_day: string | null;
  rows: number;
  gaps: number;
  status: SourceStatus;
}

export interface PublishRun {
  status: "published" | "failed" | "publishing" | "not_run";
  run_on: string | null;
  reason: string | null;
}

export interface HealthCheck {
  status: "ok" | "problems" | "not_run";
  run_on: string | null;
  problems: number;
}

export interface FnoDataHealth {
  as_of: string;
  sources: DataSource[];
  publish: PublishRun;
  health_check: HealthCheck;
}
