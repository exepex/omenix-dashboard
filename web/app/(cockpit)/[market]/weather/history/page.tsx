// The weather history (story W3a part 2, design/mockups/46-weather-history): India only; in the US the page does not
// exist (absent, not empty): it is built for India alone and any other market is a real 404.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WeatherHistoryPage } from "./_parts/weather-history-page.tsx";

export const metadata: Metadata = { title: "Weather history" };

export function generateStaticParams() {
  return [{ market: "india" }];
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ market: string }> }) {
  if ((await params).market !== "india") notFound();
  return <WeatherHistoryPage />;
}
