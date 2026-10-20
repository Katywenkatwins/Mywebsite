"use client";

/*
 * Рожеві пікселі за курсором по всьому сайту.
 *  - над звичайним місцем — велика м'яка піксельна пляма зі слідом (PixelBlast з React Bits);
 *  - над активним елементом (посилання, кнопка, літера DESIGNER/OF VISUAL SENSES, будь-що з курсором-рукою) —
 *    пляма гасне, і під курсором лишається маленький квадратик 20×20 px із дрібних пікселів (3 px з проміжком 1 px)
 *    з коротким слідом, що розсипається.
 * Поки миша стоїть, нічого не перемальовується. Не вмикається на сенсорних екранах і при «менше руху».
 */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const PixelBlast = dynamic(() => import("./PixelBlast"), { ssr: false });

const ACTIVE_CURSORS = new Set(["pointer", "grab", "grabbing"]);
const ACTIVE_SELECTOR = "a[href], button, [role='button'], summary, label[for], select, [data-cursor='active']";

const SQUARE = 20; // розмір квадратика, px
const PIXEL = 4; // розмір «пікселя» всередині, px
const TRAIL_SECONDS = 0.35; // скільки живе слід
// 5×5 матриця Байєра (порядок «гасіння» пікселів), значення 0..1
const DITHER = [0, 12, 3, 15, 6, 8, 4, 11, 7, 19, 2, 14, 1, 13, 22, 10, 18, 9, 17, 5, 24, 16, 21, 20, 23].map(
  (v) => v / 25,
);

const isActive = (el: Element | null) => {
  if (!el) return false;
  if (el.closest(ACTIVE_SELECTOR)) return true;
  return ACTIVE_CURSORS.has(getComputedStyle(el).cursor);
};

export function CursorPixels() {
  const [color, setColor] = useState("");
  const [active, setActive] = useState(false);
  const squareRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(false);

  // Чи є курсор взагалі, і над чим він зараз
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    const pink = getComputedStyle(document.documentElement).getPropertyValue("--color-pink").trim();

    let raf = 0;
    let target: Element | null = null;
    const onMove = (e: PointerEvent) => {
      setColor((c) => c || pink); // вмикаємо після першого руху миші
      target = e.target instanceof Element ? e.target : null;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const next = isActive(target);
        activeRef.current = next;
        setActive(next);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Маленький квадратик зі слідом
  useEffect(() => {
    const canvas = squareRef.current;
    const ctx = canvas?.getContext("2d");
    if (!color || !canvas || !ctx) return;

    const stamps: { x: number; y: number; t: number }[] = [];
    let dpr = 1;
    let raf = 0;
    let last = { x: -1, y: -1 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      wake();
    };

    const draw = (now: number) => {
      raf = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = color;
      for (let i = stamps.length - 1; i >= 0; i--) {
        const age = (now - stamps[i].t) / 1000 / TRAIL_SECONDS;
        if (age >= 1) {
          stamps.splice(i, 1);
          continue;
        }
        // слід розсипається по матриці Байєра
        const keep = 1 - age;
        const n = SQUARE / PIXEL;
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            if (DITHER[r * n + c] >= keep) continue;
            ctx.fillRect(stamps[i].x + c * PIXEL, stamps[i].y + r * PIXEL, PIXEL - 1, PIXEL - 1);
          }
        }
      }
      // поточна позиція — повний квадратик, поки курсор над активним елементом (навіть якщо миша стоїть)
      if (activeRef.current && last.x >= 0) {
        const n = SQUARE / PIXEL;
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) ctx.fillRect(last.x + c * PIXEL, last.y + r * PIXEL, PIXEL - 1, PIXEL - 1);
        }
      }
      if (stamps.length) raf = requestAnimationFrame(draw);
    };

    function wake() {
      if (!raf) raf = requestAnimationFrame(draw);
    }

    const onMove = (e: PointerEvent) => {
      if (!activeRef.current) return;
      // прив'язка до сітки 4 px — пікселі не «пливуть»
      const x = Math.round((e.clientX - SQUARE / 2) / PIXEL) * PIXEL;
      const y = Math.round((e.clientY - SQUARE / 2) / PIXEL) * PIXEL;
      if (x === last.x && y === last.y) return;
      last = { x, y };
      stamps.push({ x, y, t: performance.now() });
      if (stamps.length > 60) stamps.shift();
      wake();
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [color]);

  if (!color) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 opacity-60">
      {/* велика пляма — над «порожніми» місцями */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${active ? "opacity-0" : "opacity-100"}`}>
        <PixelBlast
          color={color}
          pixelSize={4}
          patternScale={2.5}
          patternDensity={-1}
          intro={false}
          speed={0}
          drift={0}
          twinkle={0}
          glow={0.3}
          edgeFade={0}
          enableRipples={false}
          hoverEffect="reveal"
          hoverRadius={150}
        />
      </div>
      {/* квадратик 20×20 — над активними елементами */}
      <canvas
        ref={squareRef}
        className={`absolute inset-0 size-full transition-opacity duration-150 ${active ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
