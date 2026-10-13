"use client";
// The rendered width of an element, kept current on resize (changes under 3 px are ignored, so a chart drawn at the
// width does not redraw in a loop). Used by the charts that draw at their container's width.
import { useEffect, useRef, useState } from "react";

export function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setWidth((w) => (Math.abs(w - node.clientWidth) > 2 ? node.clientWidth : w));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}
