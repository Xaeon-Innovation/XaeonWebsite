import { useId, type CSSProperties } from "react";

/**
 * The orbit arc and four-point star from the Xaeon logo, used as the site's signature motif.
 * The star travels along the arc; with reduced motion it rests at the end of the arc.
 */
export default function Orbit({ className = "" }: { className?: string }) {
  const path = "M 40 330 C 40 150, 260 30, 520 60";
  const gradientId = `orbit-fade-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 560 380" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#72c04f" stopOpacity="0" />
          <stop offset="0.55" stopColor="#72c04f" stopOpacity="0.55" />
          <stop offset="1" stopColor="#72c04f" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path d={path} stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 70 360 C 90 190, 300 80, 548 110" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <g className="orbit-star" style={{ offsetPath: `path("${path}")` } as CSSProperties}>
        <path d="M0 -14 L3.5 -3.5 L14 0 L3.5 3.5 L0 14 L-3.5 3.5 L-14 0 L-3.5 -3.5 Z" fill="#72c04f" />
      </g>
    </svg>
  );
}
