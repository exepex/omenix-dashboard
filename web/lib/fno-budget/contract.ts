// The AI usage and budget read model (story W3g; contract FnoBudget, api/schemas/fno-budget.yaml, 2.8.0): what the page
// `budget` of exepex/trading's F&O publication carries. Minutes, never rupees; never an AI model's name, a session id
// or a prompt (the contract's x-never-sent). Types only.

export type BudgetLevel = "ok" | "alert" | "stop" | "unknown";
export type WorkGroup = "ai_books" | "ai_roles" | "post_mortem" | "data_routines" | "development";

export interface FnoBudget {
  month: string;
  level: BudgetLevel;
  books_and_roles_minutes: number;
  basis_minutes: number;
  cap_minutes: number;
  pct_of_cap: number | null;
  basis: "measured" | "plan";
  note: string;
  groups: { group: WorkGroup; minutes: number; runs: number }[];
}
