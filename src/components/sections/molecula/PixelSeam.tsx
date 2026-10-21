"use client";

/*
 * Піксельний шов між hero і Molecula: угорі секції — сірі квадрати кольору низу hero.
 * У самому верху вони суцільні, нижче рідшають і утворюють нерівний край, далі — чорний.
 * Поки секція заїжджає в екран, квадрати по одному розчиняються (кожен у свій момент);
 * коли верх секції дійшов до верху екрана — шву вже немає.
 * Колір кожного стовпчика береться з нижнього рядка фото hero (з тим самим кадруванням, що й у hero),
 * тож шов продовжує фото без стику.
 */

import { useEffect, useRef } from "react";
import heroPhoto from "@/assets/hero/photo.png";

const ROWS = 12; // висота шву в квадратах
const CELL = 30; // розмір квадрата, пікселі макета
const SOLID_ROWS = 2; // скільки верхніх рядів суцільні
const LIGHTER = 0.18; // частка трохи світліших квадратів (два тони, як на референсі)

// детермінований «випадок» для клітинки
const rand = (a: number, b: number, k: number) => {
  const v = Math.sin(a * 127.1 + b * 311.7 + k * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** висота шву в пікселях макета — щоб меню знало, де починається чорне */
export const SEAM_HEIGHT = ROWS * CELL;

export function PixelSeam() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const section = canvas?.closest("section");
    if (!canvas || !ctx || !section) return;

    const fallback = getComputedStyle(canvas).getPropertyValue("--color-studio").trim() || "#9f9f9f";
    // нижній рядок фото hero: 1920 значень RGB
    let edge: Uint8ClampedArray | null = null;
    const img = new Image();
    img.src = heroPhoto.src;
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = 6;
      const cx = c.getContext("2d", { willReadFrequently: true });
      if (!cx) return;
      cx.drawImage(img, 0, img.naturalHeight - 6, img.naturalWidth, 6, 0, 0, img.naturalWidth, 6);
      const data = cx.getImageData(0, 0, img.naturalWidth, 6).data;
      edge = new Uint8ClampedArray(img.naturalWidth * 3);
      for (let x = 0; x < img.naturalWidth; x++) {
        for (let k = 0; k < 3; k++) {
          let s = 0;
          for (let y = 0; y < 6; y++) s += data[(y * img.naturalWidth + x) * 4 + k];
          edge[x * 3 + k] = s / 6;
        }
      }
      draw(true);
    };

    let w = 0;
    let h = 0;
    let dpr = 1;
    let lastP = -1;
    let raf = 0;
    let colors: string[] = [];
    let lighter: string[] = [];

    // колір стовпчика: фото в hero лежить як object-cover на весь екран
    const columnColors = (cols: number, cell: number) => {
      colors = [];
      lighter = [];
      const vw = w;
      const vh = window.innerHeight;
      const iw = img.naturalWidth || 1920;
      const ih = img.naturalHeight || 1080;
      const scale = Math.max(vw / iw, vh / ih);
      const ox = (vw - iw * scale) / 2;
      for (let c = 0; c < cols; c++) {
        if (!edge) {
          colors.push(fallback);
          lighter.push(fallback);
          continue;
        }
        const x0 = Math.max(0, Math.floor((c * cell - ox) / scale));
        const x1 = Math.min(iw - 1, Math.ceil(((c + 1) * cell - ox) / scale));
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let x = x0; x <= x1; x++) {
          r += edge[x * 3];
          g += edge[x * 3 + 1];
          b += edge[x * 3 + 2];
          n++;
        }
        n = Math.max(1, n);
        const R = r / n;
        const G = g / n;
        const B = b / n;
        colors.push(`rgb(${R | 0},${G | 0},${B | 0})`);
        const L = (v: number) => (v + (255 - v) * 0.08) | 0;
        lighter.push(`rgb(${L(R)},${L(G)},${L(B)})`);
      }
    };

    const progress = () => {
      const top = section.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, 1 - top / window.innerHeight));
    };

    const draw = (force = false) => {
      const p = progress();
      if (!force && p === lastP) return;
      lastP = p;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (p >= 1) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cell = h / ROWS;
      const cols = Math.ceil(w / cell);
      if (colors.length !== cols || force) columnColors(cols, cell);
      for (let c = 0; c < cols; c++) {
        // нерівний край: кожен стовпчик закінчується трохи вище чи нижче
        const jitter = (rand(c, 0, 1) - 0.5) * 3 + Math.sin(c * 0.45) * 1.2;
        for (let r = 0; r < ROWS; r++) {
          const cover = r < SOLID_ROWS ? 1 : Math.pow(Math.min(1, Math.max(0, 1 - (r - SOLID_ROWS + jitter) / (ROWS - SOLID_ROWS))), 1.4);
          if (rand(c, r, 2) >= cover) continue;
          // кожен квадрат розчиняється у свій момент; до кінця заїзду — усі
          const order = 0.1 + rand(c, r, 3) * 0.6;
          const a = 1 - smoothstep(order, order + 0.3, p);
          if (a <= 0) continue;
          ctx.globalAlpha = a;
          ctx.fillStyle = rand(c, r, 4) < LIGHTER ? lighter[c] : colors[c];
          ctx.fillRect(Math.floor(c * cell), Math.floor(r * cell), Math.ceil(cell), Math.ceil(cell));
        }
      }
      ctx.globalAlpha = 1;
    };

    const layout = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      draw(true);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        draw();
      });
    };
    const ro = new ResizeObserver(layout);
    ro.observe(canvas);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      img.onload = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-seam
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-30 block w-full"
      style={{ height: `calc(${SEAM_HEIGHT} * var(--u))` }}
    />
  );
}
