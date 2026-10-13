"use client";
// A page that needs the width starts with the picks panel hidden (the signed-off 33 and 34: `PF.st.wlOff`), unless its
// link says `#wloff=0`; the app bar's button still shows it. Leaving the page puts the frame's default back.
import { useEffect } from "react";
import { useFrame } from "./frame-context.tsx";

export function PicksHiddenHere() {
  const { setPicksOff } = useFrame();
  useEffect(() => {
    setPicksOff(new URLSearchParams(window.location.hash.slice(1)).get("wloff") !== "0");
    return () => setPicksOff(false);
  }, [setPicksOff]);
  return null;
}
