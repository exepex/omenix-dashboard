// The one place the F&O scoreboards' adapter is chosen (story W3h): the F&O publication when the database is configured,
// else P1's examples, loaded only then (lib/data/lazy.ts).
import { lazyAdapter } from "../data/lazy.ts";
import { fnoReader } from "../fno/wiring.ts";
import { azureScoreboardsData } from "./azure-source.ts";
import type { ScoreboardsData } from "./source.ts";

export const scoreboardsData: ScoreboardsData = fnoReader ? azureScoreboardsData(fnoReader) : lazyAdapter(() => import("./fixture-source.ts").then((m) => m.fixtureScoreboardsData));

/** The boards are the publication's (a database is configured), never an example: the frame's Example rule reads it. */
export const scoreboardsLive = fnoReader !== null;
