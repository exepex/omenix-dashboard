// The one place that picks the frame's data adapter (stories W8, W9-F&O): the labelled examples, and with the F&O
// database configured, India's index levels, session and F&O picks from the F&O publication over them. Components
// never import an adapter (lib/shell/tests/import-graph.test.ts enforces it). Only the market layout reads it.
import { nseCalendar } from "../fno/calendar.ts";
import { fnoReader } from "../fno/wiring.ts";
import { fnoShellData } from "./azure-source.ts";
import { fixtureShellData } from "./fixture-source.ts";
import type { ShellData } from "./source.ts";

export const shellData: ShellData = fnoReader ? fnoShellData(fnoReader, fixtureShellData, nseCalendar) : fixtureShellData;
