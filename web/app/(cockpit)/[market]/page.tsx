// Home (story W9, design/mockups/31-dashboard): the market's home page. `_home/` holds its server sections, each
// reading its own blocks through the HomeData interface.
import type { Metadata } from "next";
import type { Market } from "../../../lib/data/constants.ts";
import { HomePage } from "./_home/home-page.tsx";

export const metadata: Metadata = { title: "Home" };

export default async function Page({ params }: { params: Promise<{ market: string }> }) {
  return <HomePage market={(await params).market as Market} />;
}
