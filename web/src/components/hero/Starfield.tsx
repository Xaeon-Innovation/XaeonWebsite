"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; z: number; r: number; tw: number; sage: boolean };

/**
 * Slow-drifting, twinkling starfield with gentle mouse parallax for the hero.
 * Draws one still frame under reduced motion, and pauses when off-screen or in a hidden tab.
 */
export default function Starfield({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let raf = 0;
    let visible = true;
    let last = performance.now();
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    const seed = () => {
      const count = Math.min(240, Math.round((width * height) / 7000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(), // 0 = far, 1 = near
        r: 0.4 + Math.random() * 1.1,
        tw: Math.random() * Math.PI * 2,
        sage: Math.random() < 0.12,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced) draw(0);
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, width, height);
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      for (const s of stars) {
        // Near stars drift faster: a quiet sense of travel.
        s.x -= (0.004 + s.z * 0.018) * dt;
        s.y += (0.002 + s.z * 0.006) * dt;
        if (s.x < -4) s.x = width + 4;
        if (s.y > height + 4) s.y = -4;
        s.tw += dt * 0.002;
        const px = s.x + mouse.x * (6 + s.z * 22);
        const py = s.y + mouse.y * (4 + s.z * 14);
        const alpha = (0.25 + s.z * 0.55) * (0.65 + 0.35 * Math.sin(s.tw));
        ctx.beginPath();
        ctx.fillStyle = s.sage ? `rgba(143, 208, 107, ${alpha})` : `rgba(235, 241, 236, ${alpha})`;
        ctx.arc(px, py, s.r * (0.6 + s.z * 0.8), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduced || raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth - 0.5;
      mouse.ty = e.clientY / window.innerHeight - 0.5;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
