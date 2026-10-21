"use client";

/*
 * Прямокутна кнопка, що на наведенні заливається піксельним візерунком «хвилею» зліва направо.
 *  - primary:   рожева без обведення; заливка — білі напівпрозорі пікселі;
 *  - secondary: обведення нашим чорним (--color-ink-warm); заливка — рожеві пікселі.
 * Візерунок той самий, що в плямі курсора (PixelBlast): квадрати 4 px, розкидані матрицею Байєра 8×8.
 * На фронті хвилі пікселів рідко, позаду — густо, як край плями; у кінці зліва густіше, праворуч — шахівниця.
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

const CELL = 4; // розмір пікселя, px (як pixelSize у плямі курсора)
const FRONT = 0.35; // ширина розмитого фронту хвилі (частка ширини кнопки)
// Кінцева густина: зліва густіше, праворуч рідше (як край плями курсора — від «майже суцільно» до шахівниці)
const DENSITY_LEFT = 0.78;
const DENSITY_RIGHT = 0.46;
const SOFT = 0.07; // клітинки біля порогу малюються меншим квадратиком (як м'який край у PixelBlast)

// Матриця Байєра 8×8 — та сама, що в шейдері PixelBlast
const bayer2 = (x: number, y: number) => (Math.floor(x) / 2 + Math.floor(y) * Math.floor(y) * 0.75) % 1;
const bayer8 = (x: number, y: number) => (bayer2(x / 4, y / 4) * 0.25 + bayer2(x / 2, y / 2)) * 0.25 + bayer2(x, y);
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
        : { fill: cs.getPropertyValue("--color-pink").trim(), alpha: 0.6 }; // як прозорість плями курсора
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
        for (let c = 0; c < cols; c++) thresholds[r * cols + c] = bayer8(c % 8, r % 8);
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
      // фронт іде зліва направо; густина = як далеко клітинка позаду фронту
      const head = progress * (1 + FRONT);
      for (let c = 0; c < cols; c++) {
        const behind = (head - c / Math.max(1, cols - 1)) / FRONT;
        const along = c / Math.max(1, cols - 1);
        const density = Math.min(1, Math.max(0, behind)) * (DENSITY_LEFT + (DENSITY_RIGHT - DENSITY_LEFT) * along);
        if (density <= 0) continue;
        for (let r = 0; r < rows; r++) {
          const t = thresholds[r * cols + c];
          if (t < density - SOFT) {
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
          } else if (t < density) {
            // на межі — маленький квадратик у центрі клітинки
            const side = Math.max(1, Math.round(CELL * 0.5));
            const o = (CELL - side) / 2;
            ctx.fillRect(c * CELL + o, r * CELL + o, side, side);
          }
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
