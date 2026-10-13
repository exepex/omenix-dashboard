// The market layout (B7; the app frame since W8): every page lives under /{market}/... inside the signed-off app frame
// (components/frame/frame.tsx). The frame's data is read here, through the ShellData interface chosen in
// lib/shell/wiring.ts, and handed to the frame as the market's slice. An unknown market is a 404.
// `chat` is the parallel route @chat (owned by B8): the F11 chat panel, rendered into the frame's slot.
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Frame } from "../../../components/frame/frame.tsx";
import { MARKETS } from "../../../lib/data/constants.ts";
import { frameData } from "../../../lib/shell/view.ts";
import { shellData } from "../../../lib/shell/wiring.ts";
import { isMarket } from "../../../lib/ui/routes.ts";

export function generateStaticParams() {
  return MARKETS.map((market) => ({ market }));
}

export const dynamicParams = false;

export default async function MarketLayout({ children, chat, params }: { children: ReactNode; chat: ReactNode; params: Promise<{ market: string }> }) {
  const { market } = await params;
  if (!isMarket(market)) notFound();
  return (
    <Frame data={frameData(await shellData.read(), market)} chat={chat}>
      {children}
    </Frame>
  );
}
