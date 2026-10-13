// The Markets overview (story W12, design/mockups/34-markets, signed off 13 Oct 2026; its notes.md is the frozen
// contract): the URL's search parameters are the view; `_parts/` holds its server loaders, each reading only its blocks.
import type { Metadata } from "next";
import type { Market } from "../../../../lib/data/constants.ts";
import { readMarketsState } from "../../../../lib/overview/state.ts";
import { MarketsPage } from "./_parts/markets-page.tsx";

export const metadata: Metadata = { title: "Markets" };

export default async function Page({ params, searchParams }: { params: Promise<{ market: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <MarketsPage market={(await params).market as Market} state={readMarketsState(await searchParams)} />;
}
