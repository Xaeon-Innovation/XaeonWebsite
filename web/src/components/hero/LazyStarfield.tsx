"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// The starfield is pure decoration: load its code only after the page is up and idle,
// so it never competes with the hero text, fonts or CSS.
const Starfield = dynamic(() => import("./Starfield"), { ssr: false });

export default function LazyStarfield({ className }: { className?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 2000 });
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => setReady(true), 600);
    return () => window.clearTimeout(t);
  }, []);
  return ready ? <Starfield className={className} /> : null;
}
