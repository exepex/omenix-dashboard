// The F&O read path's composition root (story W2): the database when its settings exist (lib/fno/config.ts, Vercel's
// environment variables), else none, and the pages use the fixture adapters. Partial settings stop here with the names
// of the missing variables, never a silent fallback to examples.
import { PublicationReader, type FnoBlockReader } from "./blocks.ts";
import { nseCalendar } from "./calendar.ts";
import { fnoDbSettings } from "./config.ts";
import { fnoQuery } from "./db.ts";
import type { PublicationState } from "./freshness.ts";
import { AzureFnoRowStore } from "./store.ts";

const settings = fnoDbSettings();

export const fnoReader: FnoBlockReader | null = settings ? new PublicationReader(new AzureFnoRowStore(fnoQuery(settings)), nseCalendar) : null;

/** The current publication's state, or null with no database (fixtures carry no runtime state). */
export const fnoStatus = (): Promise<PublicationState | null> => (fnoReader ? fnoReader.status() : Promise.resolve(null));
