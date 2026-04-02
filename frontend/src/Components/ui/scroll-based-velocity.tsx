import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "../../lib/cn";

function wrap(min: number, max: number, v: number) {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

const ScrollVelocityContext = createContext<MotionValue<number> | null>(null);

/** Derive viewport scroll speed (px/s) from `scrollY` for velocity-based effects. */
function useScrollVelocity(scrollY: MotionValue<number>): MotionValue<number> {
  const raw = useMotionValue(0);
  const prevY = useRef(0);
  const initialized = useRef(false);

  useAnimationFrame((_, delta) => {
    const y = scrollY.get();
    const dt = Math.max(delta / 1000, 1 / 120);
    if (!initialized.current) {
      prevY.current = y;
      initialized.current = true;
      return;
    }
    raw.set((y - prevY.current) / dt);
    prevY.current = y;
  });

  /* Softer spring = smoother scroll-linked speed changes (less jitter). */
  return useSpring(raw, { damping: 58, stiffness: 260, mass: 0.9 });
}

export function ScrollVelocityContainer({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const { scrollY } = useScroll();
  const smoothVelocity = useScrollVelocity(scrollY);
  const velocityFactor = useTransform(smoothVelocity, (v) => {
    const sign = v < 0 ? -1 : 1;
    const magnitude = Math.min(4, (Math.abs(v) / 1200) * 4);
    return sign * magnitude;
  });

  return (
    <ScrollVelocityContext.Provider value={velocityFactor}>
      <div className={cn("relative w-full", className)} {...props}>
        {children}
      </div>
    </ScrollVelocityContext.Provider>
  );
}

export interface ScrollVelocityRowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  baseVelocity?: number;
  direction?: 1 | -1;
  scrollReactivity?: boolean;
  /** Classes for each duplicated track (e.g. larger `gap-*` for big type). */
  trackClassName?: string;
}

export function ScrollVelocityRow(props: ScrollVelocityRowProps) {
  const shared = useContext(ScrollVelocityContext);
  if (shared) {
    return <ScrollVelocityRowImpl {...props} velocityFactor={shared} />;
  }
  return <ScrollVelocityRowLocal {...props} />;
}

interface ScrollVelocityRowImplProps extends ScrollVelocityRowProps {
  velocityFactor: MotionValue<number>;
}

function ScrollVelocityRowImpl({
  children,
  baseVelocity = 5,
  direction = 1,
  className,
  velocityFactor,
  scrollReactivity = true,
  trackClassName,
  ...props
}: ScrollVelocityRowImplProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [numCopies, setNumCopies] = useState(1);

  const baseX = useMotionValue(0);
  const baseDirectionRef = useRef(direction >= 0 ? 1 : -1);
  const currentDirectionRef = useRef(direction >= 0 ? 1 : -1);
  const unitWidth = useMotionValue(0);

  const isInViewRef = useRef(true);
  const isPageVisibleRef = useRef(true);
  const prefersReducedMotionRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const block = blockRef.current;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let mq: MediaQueryList | null = null;

    const handleVisibility = () => {
      isPageVisibleRef.current = document.visibilityState === "visible";
    };

    const handlePRM = () => {
      if (mq) prefersReducedMotionRef.current = mq.matches;
    };

    if (container && block) {
      const updateSizes = () => {
        const cw = container.offsetWidth || 0;
        const bw = block.scrollWidth || 0;
        unitWidth.set(bw);
        const nextCopies = bw > 0 ? Math.max(3, Math.ceil(cw / bw) + 2) : 1;
        setNumCopies((prev) => (prev === nextCopies ? prev : nextCopies));
      };

      updateSizes();

      ro = new ResizeObserver(updateSizes);
      ro.observe(container);
      ro.observe(block);

      io = new IntersectionObserver(([entry]) => {
        isInViewRef.current = entry.isIntersecting;
      });
      io.observe(container);

      document.addEventListener("visibilitychange", handleVisibility, {
        passive: true,
      });
      handleVisibility();

      mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", handlePRM);
      handlePRM();
    }

    return () => {
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      mq?.removeEventListener("change", handlePRM);
    };
  }, [unitWidth]);

  const x = useTransform([baseX, unitWidth], ([v, bw]) => {
    const width = Number(bw) || 1;
    const offset = Number(v) || 0;
    return `${-wrap(0, width, offset)}px`;
  });

  useAnimationFrame((_, delta) => {
    if (!isInViewRef.current || !isPageVisibleRef.current) return;
    /* Cap dt for ~120Hz smooth steps; still clamp huge gaps after tab sleep */
    const dt = Math.min(Math.max(delta / 1000, 0), 1 / 120);
    const vf = scrollReactivity ? velocityFactor.get() : 0;
    const absVf = Math.min(4, Math.abs(vf));
    const speedMultiplier = prefersReducedMotionRef.current ? 1 : 1 + absVf;

    if (absVf > 0.1) {
      const scrollDirection = vf >= 0 ? 1 : -1;
      currentDirectionRef.current = baseDirectionRef.current * scrollDirection;
    }

    const bw = unitWidth.get() || 0;
    if (bw <= 0) return;
    const pixelsPerSecond = (bw * baseVelocity) / 100;
    const moveBy =
      currentDirectionRef.current * pixelsPerSecond * speedMultiplier * dt;
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden whitespace-nowrap", className)}
      {...props}
    >
      <motion.div
        className="inline-flex transform-gpu items-center will-change-transform select-none [backface-visibility:hidden] [contain:layout]"
        style={{ x }}
      >
        {Array.from({ length: numCopies }).map((_, i) => (
          <div
            key={i}
            ref={i === 0 ? blockRef : null}
            {...(i > 0 ? { "aria-hidden": "true" as const } : {})}
            className={cn(
              "inline-flex shrink-0 items-center gap-4 md:gap-5",
              trackClassName
            )}
          >
            {Children.map(children, (child, j) =>
              isValidElement(child)
                ? cloneElement(child, {
                    key: `${i}-${String(child.key ?? j)}`,
                  })
                : child
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function ScrollVelocityRowLocal(props: ScrollVelocityRowProps) {
  const { scrollY } = useScroll();
  const smoothVelocity = useScrollVelocity(scrollY);
  const localVelocityFactor = useTransform(smoothVelocity, (v) => {
    const sign = v < 0 ? -1 : 1;
    const magnitude = Math.min(4, (Math.abs(v) / 1200) * 4);
    return sign * magnitude;
  });
  return (
    <ScrollVelocityRowImpl {...props} velocityFactor={localVelocityFactor} />
  );
}
