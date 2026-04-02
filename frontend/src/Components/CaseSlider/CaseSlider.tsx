import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./CaseSlider.module.css";

export type CaseSlide = {
  id: string;
  imageSrc: string;
  logoSrc?: string;
  title: string;
  subtitle: string;
  description: string;
  exploreLabel?: string;
  exploreHref?: string;
};

function wrap(n: number, max: number) {
  return (n + max) % max;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

class Vec2 {
  x: number;
  y: number;
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  lerp(v: Vec2, t: number) {
    this.x = lerp(this.x, v.x, t);
    this.y = lerp(this.y, v.y, t);
  }
}

type TiltTargets = HTMLElement[];

function attachTilt(trigger: HTMLElement, targets: TiltTargets) {
  let lerpAmount = 0.06;
  const rotDeg = { current: new Vec2(), target: new Vec2() };
  const bgPos = { current: new Vec2(), target: new Vec2() };

  let rafId: number | null = null;

  const tick = () => {
    rotDeg.current.lerp(rotDeg.target, lerpAmount);
    bgPos.current.lerp(bgPos.target, lerpAmount);

    for (const el of targets) {
      // Avoid 3D-rotating images: browsers often rasterize transformed layers
      // during pointer movement, which can look like a quality drop.
      el.style.setProperty("--rotX", `0deg`);
      el.style.setProperty("--rotY", `0deg`);
      el.style.setProperty("--bgPosX", `${bgPos.current.x.toFixed(2)}%`);
      el.style.setProperty("--bgPosY", `${bgPos.current.y.toFixed(2)}%`);
    }

    rafId = window.requestAnimationFrame(tick);
  };

  const onMouseMove = (e: MouseEvent) => {
    lerpAmount = 0.1;
    const { offsetX, offsetY } = e as unknown as { offsetX: number; offsetY: number };

    for (const el of targets) {
      // Smaller tilt/parallax keeps thumbnails crisper (less GPU resampling).
      const ox = (offsetX - el.clientWidth * 0.5) / (Math.PI * 4.4);
      const oy = -(offsetY - el.clientHeight * 0.5) / (Math.PI * 5.6);
      bgPos.target.set(-ox * 0.16, oy * 0.16);
    }
  };

  const onMouseLeave = () => {
    lerpAmount = 0.06;
    rotDeg.target.set(0, 0);
    bgPos.target.set(0, 0);
  };

  trigger.addEventListener("mousemove", onMouseMove);
  trigger.addEventListener("mouseleave", onMouseLeave);
  rafId = window.requestAnimationFrame(tick);

  return () => {
    trigger.removeEventListener("mousemove", onMouseMove);
    trigger.removeEventListener("mouseleave", onMouseLeave);
    if (rafId !== null) window.cancelAnimationFrame(rafId);
  };
}

async function decodeImage(img: HTMLImageElement): Promise<void> {
  // If already complete, decode() can still be useful to ensure render-ready.
  // Fallback to load/error events when decode isn't supported.
  const anyImg = img as HTMLImageElement & { decode?: () => Promise<void> };
  if (typeof anyImg.decode === "function") {
    try {
      await anyImg.decode();
      return;
    } catch {
      // ignore and fall back
    }
  }

  await new Promise<void>((resolve) => {
    if (img.complete && img.naturalWidth > 0) {
      resolve();
      return;
    }
    const done = () => {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
      resolve();
    };
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  });
}

function dominantColorFromImage(img: HTMLImageElement): string | null {
  const w = 24;
  const h = 24;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  try {
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3] ?? 0;
      if (a < 32) continue;
      r += data[i] ?? 0;
      g += data[i + 1] ?? 0;
      b += data[i + 2] ?? 0;
      count++;
    }
    if (!count) return null;
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    return `rgb(${r} ${g} ${b})`;
  } catch {
    return null;
  }
}

export default function CaseSlider({ slides }: { slides: CaseSlide[] }) {
  const [idx, setIdx] = useState(0);
  const [loaderHidden, setLoaderHidden] = useState(false);
  const [progress, setProgress] = useState({ current: 0, target: 0 });
  const [accent, setAccent] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const slideInnerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const infoInnerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tiltCleanupsRef = useRef<(() => void)[]>([]);
  const accentCacheRef = useRef<Map<string, string>>(new Map());

  const total = slides.length;
  const prevIdx = useMemo(() => wrap(idx - 1, total), [idx, total]);
  const nextIdx = useMemo(() => wrap(idx + 1, total), [idx, total]);

  const change = (direction: -1 | 1) => {
    setIdx((v) => wrap(v + direction, total));
  };

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    tiltCleanupsRef.current.forEach((fn) => fn());
    tiltCleanupsRef.current = [];

    for (let i = 0; i < slides.length; i++) {
      const trigger = slideRefs.current[i];
      const slideInner = slideInnerRefs.current[i];
      if (!trigger || !slideInner) continue;
      // Keep tilt on the visual card only. Rotating text causes subpixel blur/out-of-focus
      // rendering during pointer movement (especially with 3D transforms).
      tiltCleanupsRef.current.push(attachTilt(trigger, [slideInner]));
    }

    return () => {
      tiltCleanupsRef.current.forEach((fn) => fn());
      tiltCleanupsRef.current = [];
    };
  }, [slides.length]);

  useEffect(() => {
    let cancelled = false;
    const root = rootRef.current;
    if (!root) return;

    const loaderTick = () => {
      setProgress((p) => {
        const current = lerp(p.current, p.target, 0.06);
        return { ...p, current };
      });
      raf = requestAnimationFrame(loaderTick);
    };

    let raf = requestAnimationFrame(loaderTick);

    (async () => {
      const imgs = imagesRef.current.filter((x): x is HTMLImageElement => !!x);
      const totalImages = imgs.length;
      if (!totalImages) {
        setProgress({ current: 1, target: 1 });
        setLoaderHidden(true);
        return;
      }

      let loaded = 0;
      await Promise.all(
        imgs.map(async (img) => {
          await decodeImage(img);
          loaded++;
          if (!cancelled) {
            setProgress((p) => ({ ...p, target: loaded / totalImages }));
          }
        }),
      );

      if (!cancelled) {
        setProgress((p) => ({ ...p, target: 1 }));
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [slides]);

  useEffect(() => {
    const percent = Math.round(progress.current * 100);
    if (percent >= 100) setLoaderHidden(true);
  }, [progress]);

  useEffect(() => {
    const img = imagesRef.current[idx];
    if (!img) return;
    const key = slides[idx]?.imageSrc;
    if (!key) return;

    const cached = accentCacheRef.current.get(key);
    if (cached) {
      setAccent(cached);
      return;
    }

    const color = dominantColorFromImage(img);
    if (color) {
      accentCacheRef.current.set(key, color);
      setAccent(color);
    }
  }, [idx, slides]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (accent) {
      root.style.setProperty("--accent", accent);
    } else {
      root.style.removeProperty("--accent");
    }
  }, [accent]);

  const progressPercent = Math.round(progress.current * 100);

  return (
    <>
      <div
        className={`${styles.loader} ${loaderHidden ? styles.loaderHidden : ""}`}
      >
        <span className={styles.loaderText}>{progressPercent}%</span>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div
            ref={rootRef}
            className={`${styles.slider} ${accent ? styles.accented : ""}`}
          >
            <button
              type="button"
              className={styles.btn}
              aria-label="Previous"
              onClick={() => change(-1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <div className={styles.slidesWrapper}>
              <div className={styles.slides} aria-label="Case slides">
                {slides.map((s, i) => {
                  const isCurrent = i === idx;
                  const isPrev = i === prevIdx;
                  const isNext = i === nextIdx;

                  const slideClass = [
                    styles.slide,
                    isCurrent ? styles.slideCurrent : "",
                    isPrev ? styles.slidePrev : "",
                    isNext ? styles.slideNext : "",
                    !isCurrent ? styles.slideNotCurrent : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div
                      key={`slide-${s.id}`}
                      ref={(el) => {
                        slideRefs.current[i] = el;
                      }}
                      className={slideClass}
                      data-current={isCurrent ? "" : undefined}
                      data-next={isNext ? "" : undefined}
                      data-previous={isPrev ? "" : undefined}
                    >
                      <div
                        ref={(el) => {
                          slideInnerRefs.current[i] = el;
                        }}
                        className={styles.slideInner}
                      >
                        <div className={styles.imageWrap}>
                          <img
                            ref={(el) => {
                              imagesRef.current[i] = el;
                            }}
                            className={styles.image}
                            src={s.imageSrc}
                            alt={s.title}
                            loading={i === idx ? "eager" : "lazy"}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {slides.map((s, i) => {
                  const isCurrent = i === idx;
                  const isPrev = i === prevIdx;
                  const isNext = i === nextIdx;

                  const bgClass = [
                    styles.bg,
                    isCurrent ? styles.bgCurrent : "",
                    isPrev ? styles.bgPrev : "",
                    isNext ? styles.bgNext : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div
                      key={`bg-${s.id}`}
                      className={bgClass}
                      ref={(el) => {
                        if (!el) return;
                        el.style.setProperty("--bg", `url(${s.imageSrc})`);
                      }}
                      data-current={isCurrent ? "" : undefined}
                      data-next={isNext ? "" : undefined}
                      data-previous={isPrev ? "" : undefined}
                    />
                  );
                })}
              </div>

              <div className={styles.slidesInfos}>
                {slides.map((s, i) => {
                  const isCurrent = i === idx;
                  const isPrev = i === prevIdx;
                  const isNext = i === nextIdx;

                  const infoClass = [
                    styles.info,
                    isCurrent ? styles.infoCurrent : "",
                    isPrev ? styles.infoPrev : "",
                    isNext ? styles.infoNext : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div
                      key={`info-${s.id}`}
                      className={infoClass}
                      data-current={isCurrent ? "" : undefined}
                      data-next={isNext ? "" : undefined}
                      data-previous={isPrev ? "" : undefined}
                    >
                      <div
                        ref={(el) => {
                          infoInnerRefs.current[i] = el;
                        }}
                        className={styles.infoInner}
                      >
                        <div className={styles.textWrap}>
                          <div className={styles.infoCard}>
                            <div className={styles.logoBlock}>
                              {s.logoSrc ? (
                                <img
                                  className={styles.logoImg}
                                  src={s.logoSrc}
                                  alt=""
                                  loading="lazy"
                                />
                              ) : (
                                <div className={styles.logoPlaceholder}>
                                  <span className={styles.logoPlaceholderMark} />
                                </div>
                              )}
                            </div>

                            <div className={styles.cardTitle}>{s.title}</div>
                            <div className={styles.cardSubtitle}>{s.subtitle}</div>
                            <div className={styles.cardDesc}>{s.description}</div>

                            <a
                              className={styles.exploreLink}
                              href={s.exploreHref ?? "#"}
                              aria-label={`Explore ${s.title}`}
                            >
                              {String(s.exploreLabel ?? "Explore").toUpperCase()}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className={styles.btn}
              aria-label="Next"
              onClick={() => change(1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

