// The Forecast lab (story W3b, design/mockups/37-forecasts): India only; in the US the page does not exist (absent, not
// empty): it is built for India alone and any other market is a real 404. `_parts/` holds its server loader.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ForecastLabPage } from "./_parts/forecast-lab-page.tsx";

export const metadata: Metadata = { title: "Forecast lab" };

export function generateStaticParams() {
  return [{ market: "india" }];
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ market: string }> }) {
  if ((await params).market !== "india") notFound();
  return <ForecastLabPage />;
}
