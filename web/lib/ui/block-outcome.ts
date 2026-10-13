// What a page part shows when its blocks cannot be shown (stories W12, W2): a view the examples do not cover, a block
// with no data (with its reason and when it was checked), a payload of another contract version, or a failure. The
// words come only from these states, never from an error's message: a database driver's text can name the host and the
// user, so it never reaches the page (W2 criterion 3). Pure.
import { BlockEmpty, BlockIncompatible } from "./block-states.ts";
import { NoExample } from "./no-example.ts";

export interface BlockOutcome {
  kind: "empty" | "incompatible" | "error";
  title: string;
  detail: string;
  /** For the server log on a failure: the error's name and class (FnoUnavailable's `failure`), never its message. */
  log?: string;
}

const checked = (iso: string) => `Checked ${iso.slice(0, 16).replace("T", " ")} UTC.`;

export function outcomeOf(what: string, error: unknown): BlockOutcome {
  if (error instanceof NoExample) return { kind: "empty", title: `${what}: no example data for this view yet`, detail: "The examples cover the signed-off states only; this view shows once a backend publishes the data." };
  if (error instanceof BlockEmpty) return { kind: "empty", title: `${what}: no data`, detail: `${error.message} ${checked(error.checkedAt)}` };
  if (error instanceof BlockIncompatible) return { kind: "incompatible", title: `${what}: data in a newer format`, detail: `${error.message} The page is not drawn from it; the app needs an update to read it.` };
  const name = error instanceof Error ? error.name : typeof error;
  const failure = (error as { failure?: unknown } | null)?.failure;
  return { kind: "error", title: `${what}: data not available`, detail: "This part could not be read; the rest of the page works.", log: `${what}: ${name}${typeof failure === "string" ? ` (${failure})` : ""}` };
}

/** A block read, or the reason it has no data (the part shows the reason in its place). */
export type Part<T> = { value: T } | { missing: string };

/** Settles a read into a Part: its value, or its state's words (a failure logged by class only, never its message). */
export async function settle<T>(what: string, read: Promise<T>): Promise<Part<T>> {
  try {
    return { value: await read };
  } catch (error) {
    const o = outcomeOf(what, error);
    if (o.log) console.error(`block failed: ${o.log}`);
    return { missing: o.detail };
  }
}
