// The Screener (story W12, design/mockups/33-screener, signed off 13 Oct 2026; its notes.md is the frozen contract):
// the URL's search parameters are the view; `_parts/` holds its server loaders, each reading only its W11 blocks.
import type { Metadata } from "next";
import type { Market } from "../../../../lib/data/constants.ts";
import { readState } from "../../../../lib/screener/state.ts";
import { ScreenerPage } from "./_parts/screener-page.tsx";

export const metadata: Metadata = { title: "Screener" };

export default async function Page({ params, searchParams }: { params: Promise<{ market: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const market = (await params).market as Market;
  return <ScreenerPage market={market} state={readState(await searchParams, market)} />;
}
