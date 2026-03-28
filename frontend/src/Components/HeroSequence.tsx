import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ChevronDown } from "lucide-react";

import { TypingAnimation } from "./ui/TypingAnimation";
import styles from "./HeroSequence.module.css";

const VIDEO_SRC = "/assets/videos/hero2.mp4";

/** Length of the segment to repeat after the first full playthrough. */
const TAIL_LOOP_DURATION_SEC = 1.7;
/**
 * Jump back this far before the true end so playback never hits `ended` again
 * and the rewind stays inside decoded frames (feels continuous).
 */
const TAIL_LOOP_EDGE_SEC = 0.04;

/**
 * After the first `ended`, keep playing the final `TAIL_LOOP_DURATION_SEC` in a
 * seamless loop: real decode/playback, not stepped seeks.
 */
function startTailPlaybackLoop(video: HTMLVideoElement): () => void {
  const d = video.duration;
  if (!Number.isFinite(d) || d <= 0) {
    return () => {};
  }

  const loopStart = Math.max(0, d - TAIL_LOOP_DURATION_SEC);
  let cancelled = false;
  let vfcHandle: number | null = null;
  let intervalId: number | null = null;

  const rewindIfNearFileEnd = () => {
    if (cancelled || !Number.isFinite(video.duration)) return;
    if (video.currentTime >= video.duration - TAIL_LOOP_EDGE_SEC) {
      video.currentTime = loopStart;
    }
  };

  const onVideoFrame = () => {
    if (cancelled) return;
    rewindIfNearFileEnd();
    if (!cancelled && typeof video.requestVideoFrameCallback === "function") {
      vfcHandle = video.requestVideoFrameCallback(onVideoFrame) as number;
    }
  };

  video.currentTime = loopStart;
  void video.play().catch(() => {});

  if (typeof video.requestVideoFrameCallback === "function") {
    vfcHandle = video.requestVideoFrameCallback(onVideoFrame) as number;
  } else {
    intervalId = window.setInterval(rewindIfNearFileEnd, 32);
  }

  return () => {
    cancelled = true;
    if (
      vfcHandle !== null &&
      typeof video.cancelVideoFrameCallback === "function"
    ) {
      video.cancelVideoFrameCallback(vfcHandle);
    }
    if (intervalId !== null) {
      window.clearInterval(intervalId);
    }
  };
}

export function HeroSequence() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sloganRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLParagraphElement>(null);
  const line2Ref = useRef<HTMLParagraphElement>(null);
  const sublineRef = useRef<HTMLButtonElement>(null);

  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [videoEnded, setVideoEnded] = useState(false);
  const [sloganFloatOn, setSloganFloatOn] = useState(false);
  const floatDelayRef = useRef<gsap.core.Tween | null>(null);
  const endFrameLoopCleanupRef = useRef<(() => void) | null>(null);
  const sloganRevealDoneRef = useRef(false);

  const runSloganReveal = useCallback(() => {
    if (sloganRevealDoneRef.current) return;
    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    const subline = sublineRef.current;
    const slogan = sloganRef.current;
    if (!line1 || !line2 || !subline || !slogan) return;

    sloganRevealDoneRef.current = true;
    setSloganFloatOn(false);

    gsap.set([line1, line2, subline], { opacity: 0, y: 20 });

    const tl = gsap.timeline({
      onComplete: () => {
        floatDelayRef.current?.kill();
        floatDelayRef.current = gsap.delayedCall(1.5, () => {
          floatDelayRef.current = null;
          setSloganFloatOn(true);
        });
      },
    });

    tl.fromTo(
      line1,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1.4, ease: "power3.out" }
    )
      .fromTo(
        line2,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.4, ease: "power3.out" },
        0.3
      )
      .fromTo(
        subline,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.95, ease: "power3.out" },
        "-=0.55"
      );
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* Reduced motion: show slogan immediately, static first frame */
  useEffect(() => {
    if (!reducedMotion) return;
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
    setVideoEnded(true);
    sloganRevealDoneRef.current = true;
    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    const subline = sublineRef.current;
    if (line1 && line2 && subline) {
      gsap.set([line1, line2, subline], { opacity: 1, y: 0 });
    }
  }, [reducedMotion]);

  const scrollToCta = useCallback(() => {
    const el = document.getElementById("cta");
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  const handleVideoEnded = useCallback(() => {
    if (reducedMotion) return;
    const v = videoRef.current;
    if (v) {
      endFrameLoopCleanupRef.current?.();
      endFrameLoopCleanupRef.current = startTailPlaybackLoop(v);
    }
    setVideoEnded(true);
    runSloganReveal();
  }, [reducedMotion, runSloganReveal]);

  useEffect(() => {
    return () => {
      endFrameLoopCleanupRef.current?.();
      endFrameLoopCleanupRef.current = null;
      floatDelayRef.current?.kill();
      gsap.killTweensOf([
        line1Ref.current,
        line2Ref.current,
        sublineRef.current,
        sloganRef.current,
      ]);
    };
  }, []);

  return (
    <section className={styles.section} aria-label="Hero">
      <video
        ref={videoRef}
        className={styles.video}
        src={VIDEO_SRC}
        autoPlay={!reducedMotion}
        muted
        playsInline
        preload="auto"
        aria-hidden
        onEnded={handleVideoEnded}
      />

      <div
        className={`${styles.vignette} ${
          videoEnded ? styles.vignetteEnded : ""
        }`}
        aria-hidden
      />

      <div
        className={`${styles.scrollIndicator} ${
          videoEnded ? styles.scrollIndicatorHidden : ""
        }`}
        aria-hidden
      >
        <ChevronDown className={styles.scrollIcon} strokeWidth={2} />
      </div>

      <div className={styles.overlay}>
        <div
          className={`${styles.sloganLift} ${
            sloganFloatOn && !reducedMotion ? styles.sloganLiftFloating : ""
          }`}
        >
          <div
            ref={sloganRef}
            className={`${styles.slogan} ${
              reducedMotion ? styles.sloganStatic : ""
            }`}
          >
            <p ref={line1Ref} className={styles.headlineRow}>
              <span className={styles.wordWhite}>Beyond </span>
              {reducedMotion ? (
                <span className={styles.wordGreen}>Time.</span>
              ) : videoEnded ? (
                <TypingAnimation
                  as="span"
                  className={styles.wordGreen}
                  typeSpeed={110}
                  startOnView={false}
                  showCursor
                  blinkCursor
                  cursorClassName={styles.typedCursor}
                >
                  Time.
                </TypingAnimation>
              ) : (
                <span className={styles.wordGreen} aria-hidden />
              )}
            </p>
            <p ref={line2Ref} className={styles.headlineRow}>
              <span className={styles.wordWhite}>Beyond </span>
              {reducedMotion ? (
                <span className={styles.wordGreen}>Limits.</span>
              ) : videoEnded ? (
                <TypingAnimation
                  as="span"
                  className={styles.wordGreen}
                  typeSpeed={110}
                  startOnView={false}
                  delay={450}
                  showCursor
                  blinkCursor
                  cursorClassName={styles.typedCursor}
                >
                  Limits.
                </TypingAnimation>
              ) : (
                <span className={styles.wordGreen} aria-hidden />
              )}
            </p>
            <button
              ref={sublineRef}
              type="button"
              className={styles.subline}
              onClick={scrollToCta}
              aria-label="Let's work together — scroll to contact section"
            >
              Let&apos;s work together
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
