// The F&O data health (story W3e, design/mockups/44-data-health): India only; in the US the page does not exist
// (absent, not empty): it is built for India alone and any other market is a real 404. The stock side's data health
// is a separate section later, never mixed into this one.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DataHealthPage } from "./_parts/data-health-page.tsx";

export const metadata: Metadata = { title: "Data health" };

export function generateStaticParams() {
  return [{ market: "india" }];
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ market: string }> }) {
  if ((await params).market !== "india") notFound();
  return <DataHealthPage />;
}
