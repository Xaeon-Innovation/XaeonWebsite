import { type CSSProperties, type HTMLAttributes } from "react";
import { motion, type MotionProps } from "framer-motion";
import { cn } from "../../lib/cn";
import styles from "./LineShadowText.module.css";

type MotionAs = "div" | "span" | "h1" | "h2" | "h3" | "p" | "section" | "article";

type Props = Omit<HTMLAttributes<HTMLElement>, keyof MotionProps> &
  MotionProps & {
    children: string;
    shadowColor?: string;
    as?: MotionAs;
  };

export function LineShadowText({
  children,
  shadowColor = "black",
  className,
  as: Component = "span",
  ...props
}: Props) {
  const MotionComponent = (motion as unknown as Record<MotionAs, React.ElementType>)[
    Component
  ];

  return (
    <MotionComponent
      style={{ ["--shadow-color" as string]: shadowColor } as CSSProperties}
      className={cn(styles.root, className)}
      data-text={children}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

