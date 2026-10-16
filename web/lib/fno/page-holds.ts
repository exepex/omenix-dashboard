// The one read of the publication's held pages (contract 2.13.0, page `page_holds`; judge 251), shared by the F&O
// composition root (the W3 screens' HeldBlock), the frame's adapter (the picks, page `today`) and Home's (the books,
// page `risk`; judge 256). With no reader there are none (the fixtures publish normally); a publication without the
// page reads as unknown (null): no notice is invented, and data health says so.
import { BlockEmpty } from "../ui/block-states.ts";
import type { FnoPageHolds } from "../fno-holds/holds.ts";
import type { FnoBlockReader } from "./blocks.ts";
import { FNO_PAGES } from "./pages.ts";

export async function readPageHolds(reader: FnoBlockReader | null): Promise<FnoPageHolds | null> {
  if (!reader) return { holds: [] };
  try {
    return (await reader.page<FnoPageHolds>(FNO_PAGES.getFnoPageHolds)).payload;
  } catch (e) {
    if (e instanceof BlockEmpty) return null;
    throw e;
  }
}
