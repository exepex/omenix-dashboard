"use client";
// The app frame every page sits in (story W8; the owner's signed-off mockup design/mockups/30-shell, 13 Oct 2026): app
// bar, navigation rail, today's buy picks panel, the page, the phone bottom tabs, and the overlays (drawer with the
// order window preview, hover card, search, menus, shortcuts, snackbar, tooltip). It receives the market's frame data
// (lib/shell/contract.ts) from the market layout, which reads it through the ShellData interface; the chat panel slot
// (B8) keeps its place.
import type { ReactNode } from "react";
import type { FrameData } from "../../lib/shell/contract.ts";
import { ChatPanelProvider } from "../shell/chat-panel.tsx";
import { TooltipLayer } from "../shell/tooltip-layer.tsx";
import { AppBar } from "./app-bar.tsx";
import { Drawer } from "./drawer.tsx";
import { FrameContext, useFrame } from "./frame-context.tsx";
import { HoverCard } from "./hover-card.tsx";
import { FrameMenu } from "./menus.tsx";
import { NavRail } from "./nav-rail.tsx";
import { Palette } from "./palette.tsx";
import { PicksPanel } from "./picks-panel.tsx";
import { KeysDialog, useShortcuts } from "./shortcuts.tsx";
import { TabBar } from "./tab-bar.tsx";
import { useFrameState } from "./use-frame-state.ts";

function Veil() {
  const { drawer, palette, keysOpen, closeTop } = useFrame();
  const on = drawer !== null || palette !== null || keysOpen;
  return <div className={`mb-veil${on ? " on" : ""}`} id="veil" onClick={closeTop} aria-hidden="true" />;
}

function Layout({ children, chat }: { children: ReactNode; chat?: ReactNode }) {
  const { density, rail, picksOff, picksOpen } = useFrame();
  useShortcuts();
  const cls = ["mb-pf", density === "compact" && "compact", rail === "icons" && "rail-compact", picksOff && "wl-off", picksOpen && "wl-on"].filter(Boolean).join(" ");
  return (
    <>
      <div className={cls} id="pf">
        <a className="mb-skip" href="#mb-main">
          Skip to the page
        </a>
        <AppBar />
        <NavRail />
        <PicksPanel />
        <main className="mb-pf-main" id="mb-main" tabIndex={-1}>
          <div className="mb-pf-inner">{children}</div>
        </main>
        <TabBar />
      </div>
      <div className="mb-chat-slot" id="mb-chat-slot">
        {chat}
      </div>
    </>
  );
}

function Snack({ text, dismiss }: { text: string | null; dismiss: () => void }) {
  return (
    <div className={`mb-snack${text ? " on" : ""}`} id="snack" role="status" aria-live="polite">
      {text ? (
        <>
          <span>{text}</span>
          <button className="md-btn text" type="button" onClick={dismiss}>
            OK
          </button>
        </>
      ) : null}
    </div>
  );
}

/** <Frame data={frameData(payload, market)} chat={chatSlot}>{page}</Frame>, rendered by app/(cockpit)/[market]/layout.tsx. */
export function Frame({ data, children, chat }: { data: FrameData; children: ReactNode; chat?: ReactNode }) {
  const { snackText, dismissSnack, ...ui } = useFrameState(data);
  return (
    <ChatPanelProvider>
      <FrameContext.Provider value={ui}>
        <TooltipLayer />
        <Layout chat={chat}>{children}</Layout>
        <Veil />
        <Drawer />
        <HoverCard />
        <Palette />
        <KeysDialog />
        <FrameMenu />
        <Snack text={snackText} dismiss={dismissSnack} />
      </FrameContext.Provider>
    </ChatPanelProvider>
  );
}
