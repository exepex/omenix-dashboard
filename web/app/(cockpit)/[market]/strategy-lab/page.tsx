// Page 05, Strategy lab (design/mockups/05-strategy-lab/), owned by B16: the server component sets the title and
// renders the client page, which reads GET /api/v1/markets/{market}/strategies. In India the Stocks and F&O tabs sit
// above it (story W3d; the F&O tab is strategy-lab/fno); in the US there is no tab bar.
import type { Metadata } from "next";
import "../../../../components/fno-common/fno-screen.css";
import type { Market } from "../../../../lib/data/constants.ts";
import { LabTabs } from "../../../../components/fno-common/lab-tabs.tsx";
import { StrategyLabPage } from "./_parts/strategy-lab-page.tsx";

export const metadata: Metadata = { title: "Strategy lab" };

export default async function Page({ params }: { params: Promise<{ market: string }> }) {
  const market = (await params).market as Market;
  return (
    <>
      <div className="fno-screen"><LabTabs market={market} active="stocks" /></div>
      <StrategyLabPage market={market} />
    </>
  );
}
