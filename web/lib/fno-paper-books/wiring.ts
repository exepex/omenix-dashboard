// The one place the paper books' adapter is chosen (story W3c): the F&O publication when the database is configured,
// else P1's examples, loaded only then (lib/data/lazy.ts).
import { lazyAdapter } from "../data/lazy.ts";
import { fnoReader } from "../fno/wiring.ts";
import { azurePaperBooksData } from "./azure-source.ts";
import type { PaperBooksData } from "./source.ts";

export const paperBooksData: PaperBooksData = fnoReader ? azurePaperBooksData(fnoReader) : lazyAdapter(() => import("./fixture-source.ts").then((m) => m.fixturePaperBooksData));

/** The books are the publication's (a database is configured), never an example: the frame's Example rule reads it. */
export const paperBooksLive = fnoReader !== null;
