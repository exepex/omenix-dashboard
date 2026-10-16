// Today's card (story W3f, design/mockups/39-trade-card): India only; in the US the page does not exist (absent, not
// empty): it is built for India alone and any other market is a real 404.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardPage } from "./_parts/card-page.tsx";

export const metadata: Metadata = { title: "Today's card" };

export function generateStaticParams() {
  return [{ market: "india" }];
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ market: string }> }) {
  if ((await params).market !== "india") notFound();
  return <CardPage />;
}
