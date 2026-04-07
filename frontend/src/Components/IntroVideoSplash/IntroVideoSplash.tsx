"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./IntroVideoSplash.module.css";

const FADE_DURATION_MS = 600;

type IntroVideoSplashProps = {
  src: string;
  className?: string;
  onComplete?: () => void;
};

export default function IntroVideoSplash({ src, className, onComplete }: IntroVideoSplashProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const completeCalled = useRef(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    if (isDone || isFading) return;
    setIsFading(true);
    // Ensure transition happens even if onAnimationEnd doesn't fire
    timeoutRef.current = setTimeout(() => {
      if (completeCalled.current) return;
      completeCalled.current = true;
      onComplete?.();
    }, FADE_DURATION_MS);
  }, [isDone, isFading, onComplete]);

  // Hard fallback: always dismiss within 8s, even if video never loads/plays.
  useEffect(() => {
    const id = setTimeout(() => finish(), 8000);
    return () => {
      clearTimeout(id);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mediaQuery?.matches) {
      finish();
      return;
    }

    const v = videoRef.current;
    if (!v) return;

    // If the video src returns 404 or can't load, fire finish immediately.
    const onLoadError = () => finish();
    v.addEventListener("error", onLoadError);

    const tryPlay = async () => {
      try {
        await v.play();
      } catch {
        // Autoplay blocked — user can click Skip, or 8s fallback will fire.
      }
    };

    tryPlay();

    return () => {
      v.removeEventListener("error", onLoadError);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isDone) return null;

  return (
    <div
      className={[
        styles.overlay,
        isFading ? styles.fadeOut : "",
        isFading ? styles.overlayHidden : "",
        className ?? "",
      ].join(" ")}
      onAnimationEnd={() => {
        if (isFading) {
          setIsDone(true);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          if (!completeCalled.current) {
            completeCalled.current = true;
            onComplete?.();
          }
        }
      }}
      aria-label="Intro animation"
    >
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
      />

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.skipButton}
          onClick={finish}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

