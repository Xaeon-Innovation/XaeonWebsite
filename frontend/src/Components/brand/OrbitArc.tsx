import { useId } from "react";

const ARC = "M 40 330 C 40 150, 260 30, 520 60";
const STAR = "M0 -14 L3.5 -3.5 L14 0 L3.5 3.5 L0 14 L-3.5 3.5 L-14 0 L-3.5 -3.5 Z";
const MOTION = { keyPoints: "0;0.85;0.85", keyTimes: "0;0.8;1", calcMode: "spline" as const, keySplines: "0.45 0 0.25 1;0 0 1 1" };

/**
 * The Xaeon logo's orbit with the star travelling it in a loop (same motif as xaeons.com).
 * The moving star is hidden under reduced motion via the .orbit-moving/.orbit-static classes.
 */
export default function OrbitArc({ className = "" }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const fade = `oa-fade-${uid}`;
  const glow = `oa-glow-${uid}`;
  const path = `oa-path-${uid}`;
  return (
    <svg viewBox="0 0 560 380" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={fade} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#72c04f" stopOpacity="0" />
          <stop offset="0.55" stopColor="#72c04f" stopOpacity="0.55" />
          <stop offset="1" stopColor="#72c04f" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="#8fd06b" stopOpacity="0.85" />
          <stop offset="1" stopColor="#8fd06b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path id={path} d={ARC} stroke={`url(#${fade})`} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 70 360 C 90 190, 300 80, 548 110" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <g className="orbit-moving" opacity="0">
        <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.1;0.68;0.8;1" dur="7s" repeatCount="indefinite" />
        {[0.24, 0.16, 0.08].map((lag, i) => (
          <circle key={lag} r={5 + i * 2} fill={`url(#${glow})`} opacity={0.3 + i * 0.15}>
            <animateMotion dur="7s" begin={`-${lag}s`} repeatCount="indefinite" {...MOTION}>
              <mpath href={`#${path}`} />
            </animateMotion>
          </circle>
        ))}
        <g>
          <circle r="26" fill={`url(#${glow})`} opacity="0.6" />
          <path d={STAR} fill="#72c04f" />
          <animateMotion dur="7s" repeatCount="indefinite" {...MOTION}>
            <mpath href={`#${path}`} />
          </animateMotion>
        </g>
      </g>
      <g className="orbit-static" transform="translate(113 167)">
        <circle r="26" fill={`url(#${glow})`} opacity="0.6" />
        <path d={STAR} fill="#72c04f" />
      </g>
    </svg>
  );
}
