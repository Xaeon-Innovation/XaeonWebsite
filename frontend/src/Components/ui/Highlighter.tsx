import { type ReactNode } from "react";
import { cn } from "../../lib/cn";

type AnnotationAction =
  | "highlight"
  | "underline"
  | "box"
  | "circle"
  | "strike-through"
  | "crossed-off"
  | "bracket";

export interface HighlighterProps {
  children: ReactNode;
  /** Text color (replaces rough-notation marker; former underline/highlight actions all use this). */
  color?: string;
  className?: string;
  // Legacy rough-notation props — ignored, kept so existing spreads still type-check
  action?: AnnotationAction;
  strokeWidth?: number;
  animationDuration?: number;
  iterations?: number;
  padding?: number;
  multiline?: boolean;
  isView?: boolean;
  contrastText?: boolean;
}

/**
 * Accent text: colored span only (no marker/underline animation).
 */
export function Highlighter({
  children,
  color = "var(--color-accent)",
  className,
}: HighlighterProps) {
  return (
    <span className={cn("inline", className)} style={{ color }}>
      {children}
    </span>
  );
}
