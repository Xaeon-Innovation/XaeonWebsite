import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/cn";
import styles from "./AnimatedCircularProgressBar.module.css";

export interface AnimatedCircularProgressBarProps {
  max?: number;
  min?: number;
  value: number;
  gaugePrimaryColor: string;
  gaugeSecondaryColor: string;
  className?: string;
  /** Pixel width/height of the gauge (overrides default responsive size). */
  circleSizePx?: number;
  /**
   * Degrees of empty gap on the ring (rest is the active arc). 90° gap → 270° arc, gap at bottom.
   * Rotation is tuned for the default 90° gap.
   * @default 90
   */
  gapDegrees?: number;
  /** Replaces the centered percentage when set (e.g. logo). */
  center?: ReactNode;
  /** When `center` is set, show the numeric value in the bottom gap of the arc. */
  showPercentInGap?: boolean;
}

const R = 45;
const CX = 50;
const CY = 50;

/**
 * Circular gauge with an optional angular gap (default: 90° at bottom → 270° arc).
 * Progress 0–100% fills only along that arc.
 */
export function AnimatedCircularProgressBar({
  max = 100,
  min = 0,
  value = 0,
  gaugePrimaryColor,
  gaugeSecondaryColor,
  className,
  circleSizePx,
  gapDegrees = 90,
  center,
  showPercentInGap = false,
}: AnimatedCircularProgressBarProps) {
  const circumference = 2 * Math.PI * R;
  const t = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100)
  );
  const displayPercent = Math.round(t);

  const arcDegrees = Math.min(359.99, Math.max(1, 360 - gapDegrees));
  const arcLength = (arcDegrees / 360) * circumference;
  const primaryDash = (t / 100) * arcLength;

  const sizePx = circleSizePx ?? 100;
  const rootStyle = {
    "--circle-size": `${sizePx}px`,
    transform: "translateZ(0)",
    ...(circleSizePx != null
      ? { width: `${circleSizePx}px`, height: `${circleSizePx}px` }
      : {}),
  } as CSSProperties;

  /** Positions the 90° gap at the bottom; arc sweeps through the top (270°). */
  const groupTransform = `rotate(135 ${CX} ${CY})`;

  const trackStyle = {
    stroke: gaugeSecondaryColor,
    strokeDasharray: `${arcLength} ${circumference}`,
    strokeDashoffset: 0,
  } as CSSProperties;

  const primaryStyle = {
    stroke: gaugePrimaryColor,
    strokeDasharray: `${primaryDash} ${circumference}`,
    strokeDashoffset: 0,
    transition: "stroke-dasharray 0.35s ease, stroke 0.35s ease",
  } as CSSProperties;

  return (
    <div
      className={cn(styles.root, className)}
      style={rootStyle}
      aria-hidden
    >
      <svg
        fill="none"
        className={styles.svg}
        strokeWidth="2"
        viewBox="0 0 100 100"
      >
        <g transform={groupTransform}>
          <circle
            cx={CX}
            cy={CY}
            r={R}
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.circle}
            style={trackStyle}
          />
          <circle
            cx={CX}
            cy={CY}
            r={R}
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.circle}
            style={primaryStyle}
          />
        </g>
      </svg>
      {center != null ? (
        <div
          className={cn(
            styles.center,
            showPercentInGap && styles.centerWithGap
          )}
        >
          {center}
        </div>
      ) : (
        <span className={styles.value} data-current-value={displayPercent}>
          {displayPercent}
        </span>
      )}
      {center != null && showPercentInGap ? (
        <span className={styles.gapPercent} data-gap-percent={displayPercent}>
          {displayPercent}%
        </span>
      ) : null}
    </div>
  );
}
