// The F&O read path's composition root (story W2): the database when its settings exist (lib/fno/config.ts, Vercel's
// environment variables), else none, and the pages use the fixture adapters. Partial settings stop here with the names
// of the missing variables, never a silent fallback to examples.
import { BlockEmpty } from "../ui/block-states.ts";
import { PublicationReader, type FnoBlockReader } from "./blocks.ts";
import { nseCalendar } from "./calendar.ts";
import { fnoDbSettings } from "./config.ts";
import { fnoQuery } from "./db.ts";
import type { PublicationState } from "./freshness.ts";
import type { FnoPageHolds } from "../fno-holds/holds.ts";
import { FNO_PAGES } from "./pages.ts";
import { AzureFnoRowStore } from "./store.ts";

const settings = fnoDbSettings();

export const fnoReader: FnoBlockReader | null = settings ? new PublicationReader(new AzureFnoRowStore(fnoQuery(settings)), nseCalendar) : null;

/** The current publication's state, or null with no database (fixtures carry no runtime state). */
export const fnoStatus = (): Promise<PublicationState | null> => (fnoReader ? fnoReader.status() : Promise.resolve(null));

/** The publication's held pages (contract 2.13.0). With no database there are none (the fixtures publish normally).
 *  A publication without the page reads as unknown (null): no notice is invented, and data health says so. */
export async function fnoPageHolds(): Promise<FnoPageHolds | null> {
  if (!fnoReader) return { holds: [] };
  try {
    return (await fnoReader.page<FnoPageHolds>(FNO_PAGES.getFnoPageHolds)).payload;
  } catch (e) {
    if (e instanceof BlockEmpty) return null;
    throw e;
  }
}
