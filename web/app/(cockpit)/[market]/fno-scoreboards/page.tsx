// The F&O scoreboards (story W3h, design/mockups/42-scoreboards): India only; in the US the page does not exist
// (absent, not empty): it is built for India alone and any other market is a real 404. The stock tool's scoreboard
// (Rule vs AI) is its own page and never merged with these.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScoreboardsPage } from "./_parts/scoreboards-page.tsx";

export const metadata: Metadata = { title: "F&O scoreboards" };

export function generateStaticParams() {
  return [{ market: "india" }];
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ market: string }> }) {
  if ((await params).market !== "india") notFound();
  return <ScoreboardsPage />;
}
