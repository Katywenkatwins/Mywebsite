"use client";

/*
 * Кнопка сайту (усі кнопки — ця): прямокутна, мінімалістична, з анімованими піксельними плямами на тлі.
 * Плями — той самий піксельний візерунок, що в курсора (квадрати 4 px за матрицею Байєра 8×8),
 * тільки густина задається повільним «шумом», тож пікселі збираються в плями, які ледь помітно перетікають.
 * На наведенні/фокусі плями розростаються. При «менше руху» плями стоять.
 *  - outline: без заливки, з обведенням кольору тексту — плями рожеві, непрозорі;
 *  - filled:  рожева заливка — плями білі, напівпрозорі.
 * Посилання (href) або кнопка (onClick). Кольори — токени.
 */

import { useEffect, useRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";

const CELL = 4; // розмір пікселя, px
const BLOB = 22; // розмір плями, px
const BASE = 0.34; // скільки тла вкрито плямами в спокої (0..1, умовно)
const HOVER = 0.62; // на наведенні
const LOOK = {
  outline: { blot: "--color-pink", alpha: 1, className: "border border-current" },
  filled: { blot: "--color-paper", alpha: 0.5, className: "bg-pink text-ink-warm" },
} as const;
const FPS = 24;

const bayer2 = (x: number, y: number) => (Math.floor(x) / 2 + Math.floor(y) * Math.floor(y) * 0.75) % 1;
const bayer8 = (x: number, y: number) => (bayer2(x / 4, y / 4) * 0.25 + bayer2(x / 2, y / 2)) * 0.25 + bayer2(x, y);

// гладкий «шум» значень на сітці
const hash = (x: number, y: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const smooth = (t: number) => t * t * (3 - 2 * t);
const noise = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
};

type Common = { variant: keyof typeof LOOK; children: ReactNode; className?: string };
type Props =
  | (Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children">)
  | (Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">);

export function BlotButton(props: Props) {
  const { variant, children, className = "", ...rest } = props;
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const btn = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!btn || !canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { blot, alpha } = LOOK[variant];
    const color = getComputedStyle(btn).getPropertyValue(blot).trim();

    let w = 0;
    let h = 0;
    let dpr = 1;
    let amount = BASE;
    let target = BASE;
    let raf = 0;
    let lastDraw = 0;
    let t = 0;
    let visible = false;

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const n = noise((c * CELL) / BLOB + t * 0.35, (r * CELL) / BLOB - t * 0.2);
          // n > (1 − amount) — пляма; ближче до центру плями — густіше
          const density = Math.min(1, Math.max(0, (n - (1 - amount)) * 3.2));
          if (density <= 0) continue;
          if (bayer8(c % 8, r % 8) < density) ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        }
      }
    };

    const loop = (now: number) => {
      raf = 0;
      if (now - lastDraw >= 1000 / FPS) {
        const dt = lastDraw ? Math.min(0.1, (now - lastDraw) / 1000) : 0;
        lastDraw = now;
        t += dt;
        amount += (target - amount) * Math.min(1, dt * 8);
        draw();
      }
      if (visible) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduced) {
        amount = target;
        draw();
        return;
      }
      if (!raf && visible) {
        lastDraw = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    const layout = () => {
      w = btn.clientWidth;
      h = btn.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      draw();
    };
    const ro = new ResizeObserver(layout);
    ro.observe(btn);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      start();
    });
    io.observe(btn);

    const enter = () => {
      target = HOVER;
      start();
    };
    const leave = () => {
      target = BASE;
      start();
    };
    btn.addEventListener("pointerenter", enter);
    btn.addEventListener("pointerleave", leave);
    btn.addEventListener("focus", enter);
    btn.addEventListener("blur", leave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      btn.removeEventListener("pointerenter", enter);
      btn.removeEventListener("pointerleave", leave);
      btn.removeEventListener("focus", enter);
      btn.removeEventListener("blur", leave);
    };
  }, [variant]);

  const cls = `relative inline-flex items-center justify-center overflow-hidden outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current ${LOOK[variant].className} ${className}`;
  const inner = (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />
      <span className="relative">{children}</span>
    </>
  );
  if (props.href !== undefined) {
    const anchor = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a ref={rootRef as React.Ref<HTMLAnchorElement>} {...anchor} className={cls}>
        {inner}
      </a>
    );
  }
  const button = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button ref={rootRef as React.Ref<HTMLButtonElement>} type="button" {...button} className={cls}>
      {inner}
    </button>
  );
}
