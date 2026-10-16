// The Strategy lab's F&O tab (story W3d, design/mockups/45-strategy-lab-fno): India only; in the US the page does not
// exist (absent, not empty): it is built for India alone and any other market is a real 404.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StrategyLabFnoPage } from "./_parts/strategy-lab-fno-page.tsx";

export const metadata: Metadata = { title: "Strategy lab: F&O" };

export function generateStaticParams() {
  return [{ market: "india" }];
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ market: string }> }) {
  if ((await params).market !== "india") notFound();
  return <StrategyLabFnoPage />;
}
