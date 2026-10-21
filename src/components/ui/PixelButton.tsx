"use client";

/*
 * Прямокутна кнопка, що на наведенні заливається піксельним візерунком «хвилею» зліва направо.
 *  - primary:   рожева без обведення; заливка — білі напівпрозорі пікселі;
 *  - secondary: обведення нашим чорним (--color-ink-warm); заливка — рожеві пікселі.
 * Пікселі 3 px з проміжком 1 px. Хвиля трохи «рвана»: кожна клітинка має свій поріг, тож край не рівний.
 * Кольори — токени з globals.css. При «менше руху» заливка з'являється одразу.
 */

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  href: string;
  variant: "primary" | "secondary";
  children: ReactNode;
  className?: string;
  /** для анімації появи в hero */
  "data-reveal"?: string;
};

const CELL = 4; // крок сітки, px
const DOT = 3; // розмір пікселя, px
const IN_MS = 450;
const OUT_MS = 320;

export function PixelButton({ href, variant, children, className = "", ...rest }: Props) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const link = linkRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!link || !canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let thresholds: Float32Array = new Float32Array(0);
    let cols = 0;
    let rows = 0;
    let progress = 0;
    let target = 0;
    let raf = 0;
    let last = 0;

    const color = () => {
      const cs = getComputedStyle(link);
      return variant === "primary"
        ? { fill: cs.getPropertyValue("--color-paper").trim(), alpha: 0.5 }
        : { fill: cs.getPropertyValue("--color-pink").trim(), alpha: 1 };
    };

    const layout = () => {
      w = link.clientWidth;
      h = link.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      thresholds = new Float32Array(cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // хвиля зліва направо + трохи шуму, щоб край був «піксельний»
          thresholds[r * cols + c] = (c / Math.max(1, cols - 1)) * 0.78 + Math.random() * 0.22;
        }
      }
      draw();
    };

    const draw = () => {
      const { fill, alpha } = color();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (progress <= 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fill;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (thresholds[r * cols + c] < progress) ctx.fillRect(c * CELL, r * CELL, DOT, DOT);
        }
      }
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = last ? now - last : 16;
      last = now;
      const step = dt / (target > progress ? IN_MS : OUT_MS);
      progress = target > progress ? Math.min(target, progress + step) : Math.max(target, progress - step);
      draw();
      if (progress !== target) raf = requestAnimationFrame(tick);
    };

    const go = (to: number) => {
      target = to;
      if (reduced) {
        progress = to;
        draw();
        return;
      }
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    const enter = () => go(1);
    const leave = () => go(0);

    const ro = new ResizeObserver(layout);
    ro.observe(link);
    link.addEventListener("pointerenter", enter);
    link.addEventListener("pointerleave", leave);
    link.addEventListener("focus", enter);
    link.addEventListener("blur", leave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      link.removeEventListener("pointerenter", enter);
      link.removeEventListener("pointerleave", leave);
      link.removeEventListener("focus", enter);
      link.removeEventListener("blur", leave);
    };
  }, [variant]);

  const look =
    variant === "primary" ? "bg-pink text-ink-warm" : "border border-ink-warm text-ink-warm bg-transparent";

  return (
    <a ref={linkRef} href={href} {...rest} className={`relative inline-flex items-center justify-center overflow-hidden ${look} ${className}`}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />
      <span className="relative">{children}</span>
    </a>
  );
}
