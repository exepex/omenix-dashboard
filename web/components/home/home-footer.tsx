"use client";
// Home's last line (31-dashboard): research and paper trading only, no real order; the data's label and as-of time.
import { when } from "../../lib/shell/clock.ts";
import { useFrame } from "../frame/frame-context.tsx";

export function HomeFooter() {
  const { data, shell } = useFrame();
  return (
    <footer>
      {"Omenix · research and paper trading only: nothing here places a real order · "}
      {data.example ? <b>Example data</b> : "data"}
      {` as of ${when(data.now, data.now, shell)}`}
    </footer>
  );
}
