"use client";
// Home section 3 (story W9): today's buy picks in the page on tablets and phones (below 1200 px); on wider screens the
// frame's left panel shows them, never both at once (home.css).
import { PicksBody } from "../frame/picks-panel.tsx";

export function HomePicks() {
  return (
    <section className="sec card home-sig" aria-label="Today’s buy picks">
      <PicksBody where="home" />
    </section>
  );
}
