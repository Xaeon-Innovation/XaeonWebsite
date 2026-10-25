import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type Variant = "primary" | "secondary" | "ghost" | "dark";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors duration-150 min-h-11 whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-sage text-on-sage hover:bg-sage-strong",
  secondary: "border border-line-strong text-fog hover:border-mist hover:bg-white/5",
  ghost: "text-sage hover:text-fog px-0",
  dark: "bg-graphite text-fog hover:bg-ink",
};

export function buttonClass(variant: Variant = "primary", extra = ""): string {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

type Props = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

/** Internal link styled as a button (locale-aware). */
export default function ButtonLink({ variant = "primary", className = "", children, ...rest }: Props) {
  return (
    <Link className={buttonClass(variant, className)} {...rest}>
      {children}
    </Link>
  );
}
