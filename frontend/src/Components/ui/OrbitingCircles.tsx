import * as React from "react";
import { cn } from "../../lib/cn";
import styles from "./OrbitingCircles.module.css";

export interface OrbitingCirclesProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  iconSize?: number;
  speed?: number;
  /** When true, orbit animation freezes (e.g. while hovering a tech icon). */
  paused?: boolean;
  /** Labels for each child, same order as children - enables hover → pause + label callback. */
  itemNames?: string[];
  onHoveredItemChange?: (name: string | null) => void;
}

export function OrbitingCircles({
  className,
  children,
  reverse,
  duration = 20,
  delay,
  radius = 160,
  path = true,
  iconSize = 30,
  speed = 1,
  paused = false,
  itemNames,
  onHoveredItemChange,
  ...props
}: OrbitingCirclesProps) {
  const calculatedDuration = duration / speed;
  const count = React.Children.count(children);

  return (
    <div
      className={cn(
        styles.root,
        className,
        paused && styles.paused,
        itemNames && onHoveredItemChange && styles.interactive
      )}
      {...props}
    >
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className={styles.pathSvg}
          aria-hidden
        >
          <circle
            className={styles.pathCircle}
            cx="50%"
            cy="50%"
            r={radius}
          />
        </svg>
      )}
      {React.Children.map(children, (child, index) => {
        const angle = count > 0 ? (360 / count) * index : 0;
        return (
          <div
            key={index}
            style={
              {
                "--duration": calculatedDuration,
                "--radius": radius,
                "--angle": angle,
                "--delay": delay ?? 0,
                "--icon-size": `${iconSize}px`,
              } as React.CSSProperties
            }
            className={cn(styles.orbitItem, reverse && styles.orbitItemReverse)}
          >
            <div
              className={styles.iconShell}
              onMouseEnter={() => {
                const label = itemNames?.[index];
                if (label != null && onHoveredItemChange) onHoveredItemChange(label);
              }}
              onMouseLeave={() => {
                if (itemNames?.[index] != null && onHoveredItemChange) {
                  onHoveredItemChange(null);
                }
              }}
            >
              {child}
            </div>
          </div>
        );
      })}
    </div>
  );
}
