"use client";
// The rendered width of an element, kept current on resize (changes under 3 px are ignored, so a chart drawn at the
// width does not redraw in a loop): one hook for every chart drawn at its container's width. A callback ref, so an
// element that appears later (e.g. a chart once its data exists) is measured too; null before the first layout. The
// element itself is returned too, for a listener that needs it (the charts' wheel zoom, components/charts/zoom.tsx).
import { useEffect, useState } from "react";

export function useWidth<T extends HTMLElement>(): [(node: T | null) => void, number | null, T | null] {
  const [node, setNode] = useState<T | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    if (!node) return;
    setWidth(node.clientWidth);
    const observer = new ResizeObserver(() => setWidth((old) => (old === null || Math.abs(old - node.clientWidth) > 2 ? node.clientWidth : old)));
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return [setNode, width, node];
}
