import { useId } from "react";

const ARC = "M 40 330 C 40 150, 260 30, 520 60";
const STAR = "M0 -14 L3.5 -3.5 L14 0 L3.5 3.5 L0 14 L-3.5 3.5 L-14 0 L-3.5 -3.5 Z";
const LOOP = "7s";
// Travel the lower three-quarters of the arc (the part that stays inside cropped cards), then rest.
const MOTION = { keyPoints: "0;0.75;0.75", keyTimes: "0;0.8;1", calcMode: "spline" as const, keySplines: "0.45 0 0.25 1;0 0 1 1" };

/**
 * The orbit arc and four-point star from the Xaeon logo, the site's signature motif.
 * The star keeps orbiting: it fades in, rises along the arc with a glow and short trail,
 * fades out and repeats. SMIL keeps it in the SVG's own coordinates (scales with the art).
 * Under reduced motion a still star rests on the visible part of the arc.
 */
export default function Orbit({ className = "" }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = { fade: `orbit-fade-${uid}`, glow: `orbit-glow-${uid}`, path: `orbit-path-${uid}` };
  return (
    <svg viewBox="0 0 560 380" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={ids.fade} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#72c04f" stopOpacity="0" />
          <stop offset="0.55" stopColor="#72c04f" stopOpacity="0.55" />
          <stop offset="1" stopColor="#72c04f" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id={ids.glow}>
          <stop offset="0" stopColor="#8fd06b" stopOpacity="0.85" />
          <stop offset="1" stopColor="#8fd06b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path id={ids.path} d={ARC} stroke={`url(#${ids.fade})`} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 70 360 C 90 190, 300 80, 548 110" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      <g className="orbit-moving" opacity="0">
        <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.1;0.66;0.8;1" dur={LOOP} repeatCount="indefinite" />
        {/* Trail: smaller glows a moment behind the star. */}
        {[0.24, 0.16, 0.08].map((lag, i) => (
          <circle key={lag} r={5 + i * 2} fill={`url(#${ids.glow})`} opacity={0.3 + i * 0.15}>
            <animateMotion dur={LOOP} begin={`-${lag}s`} repeatCount="indefinite" {...MOTION}>
              <mpath href={`#${ids.path}`} />
            </animateMotion>
          </circle>
        ))}
        <g>
          <circle r="26" fill={`url(#${ids.glow})`} opacity="0.6" />
          <path d={STAR} fill="#72c04f" />
          <animateMotion dur={LOOP} repeatCount="indefinite" {...MOTION}>
            <mpath href={`#${ids.path}`} />
          </animateMotion>
        </g>
      </g>

      {/* Still star (reduced motion): a point on the arc that stays inside cropped cards. */}
      <g className="orbit-static" transform="translate(113 167)">
        <circle r="26" fill={`url(#${ids.glow})`} opacity="0.6" />
        <path d={STAR} fill="#72c04f" />
      </g>
    </svg>
  );
}
