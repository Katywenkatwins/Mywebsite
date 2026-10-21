"use client";

/*
 * Напис з ефектом наведення в стилі TechText (React Bits), переписаний під наш макет
 * (DESIGNER і OF VISUAL SENSES):
 * літери — точні контури з Figma (lettering.ts), а не текст шрифтом,
 * тож позиція збігається з макетом до пікселя і шрифт не треба вантажити.
 *
 * Що вміє:
 *  - друк по літерах (play) — рамка виділення біжить по літері, що «друкується»;
 *  - наведення: літера під курсором стає пунктирним контуром, довкола рамка з підписом і «іскрами»;
 *  - літеру можна потягнути — вона пружно повертається; клік — хвиля підстрибування.
 *  - полотно велике (на всю сцену) і не ловить мишу саме — слухаємо вікно, тож літеру можна витягнути куди завгодно.
 * Кольори передаються як CSS-змінні токенів (fillVar, dashVar, accentVar, outlineVar).
 */

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { Glyph } from "./lettering";

/** «text» — перефарбувати самі літери; «highlight» — виділити маркером (прямокутник під літерою) */
export type TintMode = "text" | "highlight";

export type GlyphTechHandle = {
  /** Почати друк. Повертає тривалість у секундах. */
  play: () => number;
  /** Показати одразу без анімації */
  showAll: () => void;
  /**
   * Перефарбувати літери, починаючи з `from`, по одній у колір з CSS-змінної `colorVar`.
   * `step` — пауза між літерами, с; 0 — одразу всі.
   */
  tint: (from: number, colorVar: string, step: number, mode?: TintMode) => void;
};

type Box = { x: number; y: number; w: number; h: number };

type Props = {
  /** літери (контури з lettering.ts) */
  glyphs: Glyph[];
  /** полотно в пікселях макета */
  box: Box;
  /** розмір шрифту в макеті — для сили «підстрибування» */
  fontSize: number;
  /** CSS-змінні кольорів: заливка, пунктир наведення, рамка/підписи, обведення літер (необов'язкове) */
  fillVar: string;
  dashVar: string;
  accentVar: string;
  outlineVar?: string;
  /** обведення літер, пікселі макета */
  outlineWidth?: number;
  /** рожева тінь під білими рамками, щоб читались на світлому тлі */
  accentShadow?: boolean;
  /** «letter» — рамка на літеру під курсором; «block» — весь напис у одній рамці, тягнеться цілим */
  hover?: "letter" | "block";
  className?: string;
  style?: React.CSSProperties;
  /** тривалість друку, с */
  introDuration?: number;
};

/** скільки триває друк DESIGNER, с */
export const DESIGNER_TYPE_SECONDS = 1.3;

const SPRING = 320;
const BOUNCE = 0.4;
const KICK_DECAY = 0.62;
const SPECKS = 15;
const DASH = [4, 2];
const STROKE = 1.5;
const LABEL_FONT = "10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// Полотна не ловлять мишу самі (pointer-events: none), тож курсор-руку ставимо на весь документ.
// Кілька полотен (DESIGNER, OF VISUAL SENSES) — тому спільний реєстр.
const cursorOwners = new Map<symbol, string>();
const applyCursor = () => {
  const values = [...cursorOwners.values()];
  document.documentElement.style.cursor = values.includes("grabbing") ? "grabbing" : values.includes("grab") ? "grab" : "";
};

const approach = (cur: number, target: number, dt: number, s: number) => cur + (target - cur) * (1 - Math.exp(-dt / s));
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const noise = (...values: number[]) => {
  let h = 2166136261;
  for (const v of values) {
    h = Math.imul(h ^ (v | 0), 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
};
const signed = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : "0");

type GlyphState = {
  char: string;
  path: Path2D;
  box: [number, number, number, number];
  offset: { x: number; y: number };
  velocity: { x: number; y: number };
  outline: number;
  shown: number;
};

export const GlyphTech = forwardRef<GlyphTechHandle, Props>(function GlyphTech(
  {
    glyphs: glyphData,
    box: area,
    fontSize,
    fillVar,
    dashVar,
    accentVar,
    outlineVar,
    outlineWidth = 1,
    accentShadow = false,
    hover = "letter",
    className,
    style,
    introDuration = DESIGNER_TYPE_SECONDS,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Команда могла прийти раніше, ніж полотно готове (useGSAP батька — це layout-ефект) — запам'ятовуємо її
  const pending = useRef<"play" | "show" | null>(null);
  const pendingTint = useRef<[number, string, number, TintMode?] | null>(null);
  const api = useRef<GlyphTechHandle>({
    play: () => {
      pending.current = "play";
      return introDuration;
    },
    showAll: () => {
      pending.current = "show";
    },
    tint: (from, colorVar, step, mode) => {
      pendingTint.current = [from, colorVar, step, mode];
    },
  });

  useImperativeHandle(ref, () => ({
    play: () => api.current.play(),
    showAll: () => api.current.showAll(),
    tint: (from, colorVar, step, mode) => api.current.tint(from, colorVar, step, mode),
  }));

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const scratch = document.createElement("canvas");
    const sctx = scratch.getContext("2d");
    if (!container || !canvas || !ctx || !sctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const glyphs: GlyphState[] = glyphData.map((g) => ({
      char: g.char,
      path: new Path2D(g.d),
      box: g.box,
      offset: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      outline: 0,
      shown: 0,
    }));

    let cssW = 1;
    let k = 1; // CSS-пікселів на піксель макета
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let alive = true;
    let visible = true;
    let pulse = 0;
    let dragging = -1;
    // перефарбування літер по черзі
    const tintState = { from: -1, colorVar: "", mode: "text" as TintMode, step: 0, start: 0 };
    const cells = glyphData.map((g) => g.cell ?? g.box);
    // «Блок» — уявна літера з номером glyphs.length: увесь напис як одне ціле
    const BLOCK = glyphs.length;
    const blockMode = hover === "block";
    const blockBox: [number, number, number, number] = [
      Math.min(...glyphs.map((g) => g.box[0])),
      Math.min(...glyphs.map((g) => g.box[1])),
      Math.max(...glyphs.map((g) => g.box[2])),
      Math.max(...glyphs.map((g) => g.box[3])),
    ];
    const target = (i: number) =>
      i === BLOCK ? { char: "¶", box: blockBox, offset: glyphs[0].offset } : glyphs[i];
    let cursor = "";
    const cursorId = Symbol("glyph-tech");
    let intro: "hidden" | "typing" | "done" = "hidden";
    let introClock = 0;
    const kicks: { index: number; at: number; velocity: number }[] = [];
    const pointer = { x: 0, y: 0, inside: false };
    const grab = { x: 0, y: 0 };
    const press = { x: 0, y: 0, time: 0, index: -1 };
    const frame = { x1: 0, y1: 0, x2: 0, y2: 0, alpha: 0, index: -1 };

    const colors = () => {
      const cs = getComputedStyle(container);
      return {
        ink: cs.getPropertyValue(fillVar).trim(),
        dash: cs.getPropertyValue(dashVar).trim(),
        accent: cs.getPropertyValue(accentVar).trim(),
        outline: outlineVar ? cs.getPropertyValue(outlineVar).trim() : "",
      };
    };

    // макет → CSS-пікселі полотна
    const cx = (x: number) => (x - area.x) * k;
    const cy = (y: number) => (y - area.y) * k;

    // Найближча літера до курсора (працює і для кількох рядків)
    const glyphAt = (x: number, y: number) => {
      let best = -1;
      let bestD = Infinity;
      glyphs.forEach((g, i) => {
        const x1 = g.box[0] + g.offset.x;
        const x2 = g.box[2] + g.offset.x;
        const y1 = g.box[1] + g.offset.y;
        const y2 = g.box[3] + g.offset.y;
        const dx = x < x1 ? x1 - x : x > x2 ? x - x2 : 0;
        const dy = y < y1 ? y1 - y : y > y2 ? y - y2 : 0;
        const d = Math.hypot(dx, dy);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return bestD < 24 / k ? best : -1;
    };

    // Що під курсором: літера, весь блок або нічого
    const pick = (x: number, y: number) => {
      if (!blockMode) return glyphAt(x, y);
      const o = glyphs[0].offset;
      const slack = 8 / k;
      return x >= blockBox[0] + o.x - slack &&
        x <= blockBox[2] + o.x + slack &&
        y >= blockBox[1] + o.y - slack &&
        y <= blockBox[3] + o.y + slack
        ? BLOCK
        : -1;
    };

    const designTransform = (c: CanvasRenderingContext2D, ox = 0, oy = 0) =>
      c.setTransform(dpr * k, 0, 0, dpr * k, (-area.x + ox) * dpr * k, (-area.y + oy) * dpr * k);

    const drawDashes = (g: GlyphState, ink: string, alpha: number) => {
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.clearRect(0, 0, scratch.width, scratch.height);
      designTransform(sctx, g.offset.x, g.offset.y);
      sctx.lineJoin = "round";
      sctx.lineWidth = (STROKE * 2) / k;
      sctx.strokeStyle = ink;
      sctx.setLineDash(DASH.map((v) => v / k));
      sctx.stroke(g.path);
      sctx.setLineDash([]);
      sctx.globalCompositeOperation = "destination-out";
      sctx.fill(g.path);
      sctx.globalCompositeOperation = "source-over";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = alpha;
      ctx.drawImage(scratch, 0, 0);
      ctx.globalAlpha = 1;
    };

    const perimeterPoint = (distance: number, w: number, h: number): [number, number, number, number] => {
      let d = ((distance % (2 * (w + h))) + 2 * (w + h)) % (2 * (w + h));
      if (d < w) return [frame.x1 + d, frame.y1, 0, -1];
      d -= w;
      if (d < h) return [frame.x2, frame.y1 + d, 1, 0];
      d -= h;
      if (d < w) return [frame.x2 - d, frame.y2, 0, 1];
      d -= w;
      return [frame.x1, frame.y2 - d, -1, 0];
    };

    // Рамка, «іскри» й підпис — у CSS-пікселях, щоб були тонкими на будь-якому масштабі
    const drawFrame = (ink: string, accent: string) => {
      if (frame.index < 0 || frame.alpha < 0.01) return;
      const g = target(frame.index);
      const a = frame.alpha;
      const crisp = (v: number) => (Math.round(v * dpr) + 0.5) / dpr;
      const x1 = crisp(frame.x1);
      const y1 = crisp(frame.y1);
      const x2 = crisp(frame.x2);
      const y2 = crisp(frame.y2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = accent;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      // білий на світлому тлі губиться — даємо йому тонку рожеву тінь
      if (accentShadow) {
        ctx.shadowColor = ink;
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
      }

      const moved = Math.hypot(g.offset.x, g.offset.y) * k;
      if (moved > 1) {
        const hx = cx((g.box[0] + g.box[2]) / 2);
        const hy = cy((g.box[1] + g.box[3]) / 2);
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + g.offset.x * k, hy + g.offset.y * k);
        ctx.setLineDash([3, 4]);
        ctx.globalAlpha = 0.45 * a;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.7 * a;
        ctx.fillRect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 4);
      }

      ctx.beginPath();
      ctx.rect(x1, y1, x2 - x1, y2 - y1);
      ctx.globalAlpha = 0.5 * a;
      ctx.stroke();
      ctx.beginPath();
      for (const [px, py] of [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ]) {
        ctx.rect(Math.round(px) - 2, Math.round(py) - 2, 5, 5);
      }
      ctx.globalAlpha = 0.95 * a;
      ctx.fill();

      // «іскри» по периметру
      const w = frame.x2 - frame.x1;
      const h = frame.y2 - frame.y1;
      const perimeter = 2 * (w + h);
      const seed = frame.index + 1;
      const grid = 3;
      for (let s = 0; s < SPECKS; s++) {
        const period = 0.5 + noise(seed, s, 11) * 1.2;
        const t = pulse / period + noise(seed, s, 17);
        const cycle = Math.floor(t);
        const life = t - cycle;
        if (life > 0.7) continue;
        const [px, py, nx, ny] = perimeterPoint(noise(seed, s, cycle) * perimeter, w, h);
        const pick = noise(seed, s, cycle, 2);
        const size = pick < 0.46 ? 2 : pick < 0.7 ? 3 : pick < 0.84 ? 5 : pick < 0.94 ? 8 : 11;
        const large = size >= 8;
        const out = (large ? 9 : 4) + Math.floor(noise(seed, s, cycle, 1) * 5) * grid;
        const x = frame.x1 + Math.round((px + nx * out - frame.x1) / grid) * grid;
        const y = frame.y1 + Math.round((py + ny * out - frame.y1) / grid) * grid;
        const tone = noise(seed, s, cycle, 3);
        const blink = life < 0.06 || (life > 0.32 && life < 0.36) ? 0.35 : 1;
        ctx.globalAlpha = a * (large ? 0.3 + 0.4 * tone : 0.3 + 0.6 * tone) * blink;
        const left = Math.round(x - size / 2);
        const top = Math.round(y - size / 2);
        if (tone < 0.26 || (large && tone < 0.78)) {
          ctx.strokeRect(left + 0.5, top + 0.5, size, size);
          if (large && tone > 0.5) ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
        } else {
          ctx.fillRect(left, top, size, size);
        }
      }
      for (let j = 0; j < 2; j++) {
        const head = (pulse * 0.42 + j * 0.5) * perimeter;
        for (let i = 0; i < 4; i++) {
          const [x, y] = perimeterPoint(head - i * 6, w, h);
          const size = i === 0 ? 3 : 2;
          ctx.globalAlpha = a * [0.95, 0.55, 0.32, 0.16][i];
          ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
        }
      }

      ctx.font = LABEL_FONT;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.globalAlpha = 0.75 * a;
      const label =
        moved > 1
          ? `${signed(Math.round(g.offset.x))}, ${signed(Math.round(-g.offset.y))}`
          : `${g.char}  ${Math.round(g.box[2] - g.box[0])} × ${Math.round(g.box[3] - g.box[1])}`;
      ctx.fillText(label, Math.round(frame.x1), Math.round(frame.y1) - 7);
      ctx.globalAlpha = 1;
      ctx.shadowColor = "transparent";
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    };

    const kick = (index: number) => {
      const strength = fontSize * 11;
      kicks.push({ index, at: pulse, velocity: strength });
      for (let d = 1; d < glyphs.length; d++) {
        const velocity = strength * Math.pow(KICK_DECAY, d);
        if (velocity < 30) break;
        for (const j of [index - d, index + d]) {
          if (j >= 0 && j < glyphs.length) kicks.push({ index: j, at: pulse + d * 0.055, velocity });
        }
      }
      wake();
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      pulse += dt;
      const { ink, dash, accent, outline } = colors();
      const tintColor = tintState.colorVar ? getComputedStyle(container).getPropertyValue(tintState.colorVar).trim() : "";
      let tinting = false;
      // скільки «перефарбована» літера i (0..1)
      const tintAt = (i: number) => {
        if (tintState.from < 0 || i < tintState.from) return 0;
        if (tintState.step <= 0) return 1;
        const t = clamp01((pulse - tintState.start - (i - tintState.from) * tintState.step) / 0.12);
        if (t < 1) tinting = true;
        return t;
      };
      const damping = 2 * Math.sqrt(SPRING) * (1 - BOUNCE * 0.96);

      // друк
      let typing = -1;
      if (intro === "typing") {
        introClock += dt;
        const progress = clamp01((introClock - 0.05) / introDuration);
        const step = 0.86 / glyphs.length;
        const at = Math.min(glyphs.length - 1, Math.floor(progress / step));
        typing = progress < 0.93 ? at : -1;
        glyphs.forEach((g, i) => {
          g.shown = i < at ? 1 : i === at ? smoothstep(0, step * 0.3, progress - i * step) : 0;
        });
        if (progress >= 1) {
          intro = "done";
          glyphs.forEach((g) => (g.shown = 1));
        }
      }
      const introducing = intro === "typing";
      const ready = intro === "done";

      for (let i = kicks.length - 1; i >= 0; i--) {
        if (kicks[i].at > pulse) continue;
        const g = glyphs[kicks[i].index];
        if (g) g.velocity.y -= kicks[i].velocity;
        kicks.splice(i, 1);
      }

      let moving = false;
      glyphs.forEach((g, i) => {
        if (i === dragging || dragging === BLOCK) {
          g.offset.x = approach(g.offset.x, pointer.x - grab.x, dt, 0.03);
          g.offset.y = approach(g.offset.y, pointer.y - grab.y, dt, 0.03);
          g.velocity.x = 0;
          g.velocity.y = 0;
          moving = true;
          return;
        }
        const { offset, velocity } = g;
        if (Math.abs(offset.x) < 0.05 && Math.abs(offset.y) < 0.05 && Math.hypot(velocity.x, velocity.y) < 0.5) {
          offset.x = offset.y = velocity.x = velocity.y = 0;
          return;
        }
        velocity.x += (-SPRING * offset.x - damping * velocity.x) * dt;
        velocity.y += (-SPRING * offset.y - damping * velocity.y) * dt;
        offset.x += velocity.x * dt;
        offset.y += velocity.y * dt;
        moving = true;
      });

      const active = ready && (pointer.inside || dragging >= 0);
      const focus = introducing ? typing : dragging >= 0 ? dragging : active ? pick(pointer.x, pointer.y) : -1;
      if (focus >= 0) {
        const g = target(focus);
        const bx1 = cx(g.box[0] + g.offset.x) - 6;
        const by1 = cy(g.box[1] + g.offset.y) - 6;
        const bx2 = cx(g.box[2] + g.offset.x) + 6;
        const by2 = cy(g.box[3] + g.offset.y) + 6;
        if (frame.index < 0 || frame.alpha < 0.02) {
          frame.x1 = bx1;
          frame.y1 = by1;
          frame.x2 = bx2;
          frame.y2 = by2;
        }
        const glide = focus === dragging ? 0.02 : 0.08;
        frame.x1 = approach(frame.x1, bx1, dt, glide);
        frame.y1 = approach(frame.y1, by1, dt, glide);
        frame.x2 = approach(frame.x2, bx2, dt, glide);
        frame.y2 = approach(frame.y2, by2, dt, glide);
        frame.index = focus;
      }
      frame.alpha = approach(frame.alpha, focus >= 0 ? 1 : 0, dt, 0.1);

      glyphs.forEach((g, i) => {
        const target = introducing ? (i === typing ? 1 : 0) : i === focus && i !== dragging ? 1 : 0;
        if (introducing && g.shown === 0) g.outline = target;
        g.outline = approach(g.outline, target, dt, 0.09);
        if (Math.abs(g.outline - target) > 0.002) moving = true;
        else g.outline = target;
      });

      const hovering = ready && focus >= 0 && pointer.inside;
      const nextCursor = dragging >= 0 ? "grabbing" : hovering ? "grab" : "";
      if (nextCursor !== cursor) {
        cursor = nextCursor;
        if (nextCursor) cursorOwners.set(cursorId, nextCursor);
        else cursorOwners.delete(cursorId);
        applyCursor();
      }

      // малювання
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = ink;
      for (const g of glyphs) {
        const moved = Math.hypot(g.offset.x, g.offset.y) * k;
        if (moved > 1) drawDashes(g, dash, Math.min(1, moved / 24) * 0.55);
      }
      // виділення маркером: прямокутник під кожною літерою (разом із пробілом перед нею), по черзі
      if (tintState.mode === "highlight" && tintState.from >= 0) {
        ctx.fillStyle = tintColor;
        glyphs.forEach((g, i) => {
          const t = tintAt(i);
          if (t <= 0 || g.shown < 0.001) return;
          const [x1, y1, x2, y2] = cells[i];
          designTransform(ctx, g.offset.x, g.offset.y);
          ctx.globalAlpha = t * g.shown;
          // +1 CSS-піксель, щоб сусідні клітинки злипались без тонких швів
          ctx.fillRect(x1, y1 + 1, x2 - x1 + 1 / k, y2 - y1 - 1);
        });
        ctx.globalAlpha = 1;
      }
      for (const g of glyphs) {
        if (g.shown < 0.001) continue;
        if (g.outline < 0.999) {
          designTransform(ctx, g.offset.x, g.offset.y);
          ctx.globalAlpha = (1 - g.outline) * g.shown;
          if (outline) {
            ctx.strokeStyle = outline;
            ctx.lineWidth = outlineWidth;
            ctx.lineJoin = "round";
            ctx.stroke(g.path);
          }
          // перефарбування самих літер: основний колір перетікає в новий, літера за літерою
          const gi = glyphs.indexOf(g);
          const t = tintState.mode === "text" ? tintAt(gi) : 0;
          const base = (1 - g.outline) * g.shown;
          if (t < 1) {
            ctx.globalAlpha = base * (1 - t);
            ctx.fillStyle = ink;
            ctx.fill(g.path);
          }
          if (t > 0) {
            ctx.globalAlpha = base * t;
            ctx.fillStyle = tintColor;
            ctx.fill(g.path);
          }
          ctx.globalAlpha = 1;
        }
        if (g.outline > 0.001) drawDashes(g, dash, g.outline * g.shown);
      }
      drawFrame(ink, accent);

      const settling =
        moving || introducing || tinting || kicks.length > 0 || (frame.alpha > 0.01 && frame.alpha < 0.99);
      if ((active || settling || frame.alpha > 0.01) && visible && alive) raf = requestAnimationFrame(tick);
    };

    function wake() {
      if (raf || !visible || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    api.current = {
      play: () => {
        if (reduced) {
          intro = "done";
          glyphs.forEach((g) => (g.shown = 1));
          wake();
          return 0;
        }
        intro = "typing";
        introClock = 0;
        wake();
        return introDuration;
      },
      showAll: () => {
        intro = "done";
        glyphs.forEach((g) => (g.shown = 1));
        wake();
      },
      tint: (from, colorVar, step, mode = "text") => {
        tintState.from = from;
        tintState.colorVar = colorVar;
        tintState.mode = mode;
        tintState.step = reduced ? 0 : step;
        tintState.start = pulse;
        wake();
      },
    };

    const resize = () => {
      cssW = Math.max(1, container.clientWidth);
      k = cssW / area.w;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(Math.max(1, container.clientHeight) * dpr);
      scratch.width = canvas.width;
      scratch.height = canvas.height;
      frame.alpha = 0;
      wake();
    };

    // Слухаємо мишу на всьому вікні: полотно велике й «прозоре» для кліків,
    // щоб літеру можна було витягнути далеко за межі напису і нічого під полотном не перекривалось.
    const locate = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = area.x + (e.clientX - rect.left) / k;
      pointer.y = area.y + (e.clientY - rect.top) / k;
    };
    // курсор над посиланням/кнопкою — це не наша літера
    const overControl = (e: PointerEvent) =>
      e.target instanceof Element &&
      !!e.target.closest("a[href], button, input, select, textarea, [role='button'], [data-tech-ignore]");
    const onMove = (e: PointerEvent) => {
      locate(e);
      const was = pointer.inside;
      pointer.inside = dragging >= 0 || (!overControl(e) && pick(pointer.x, pointer.y) >= 0);
      if (pointer.inside || was) wake();
    };
    const onLeave = () => {
      if (dragging >= 0) return;
      pointer.inside = false;
      wake();
    };
    const onDown = (e: PointerEvent) => {
      if (overControl(e)) return;
      locate(e);
      const primary = e.pointerType !== "mouse" || e.button === 0;
      const index = intro !== "done" || !primary ? -1 : pick(pointer.x, pointer.y);
      if (index < 0) return;
      pointer.inside = true;
      press.x = e.clientX;
      press.y = e.clientY;
      press.time = performance.now();
      press.index = index;
      // тягнути можна мишею й пером; на сенсорному екрані — лише «підстрибування» від дотику, щоб не заважати скролу
      if (e.pointerType !== "touch") {
        e.preventDefault(); // без виділення тексту під час перетягування
        dragging = index;
        grab.x = pointer.x - target(index).offset.x;
        grab.y = pointer.y - target(index).offset.y;
      }
      wake();
    };
    const onUp = (e: PointerEvent) => {
      if (dragging >= 0) {
        dragging = -1;
        locate(e);
        pointer.inside = pick(pointer.x, pointer.y) >= 0;
      }
      if (
        e.type === "pointerup" &&
        press.index >= 0 &&
        !reduced &&
        performance.now() - press.time < 450 &&
        Math.hypot(e.clientX - press.x, e.clientY - press.y) < 6
      ) {
        // у режимі блоку хвиля стартує з літери під курсором
        kick(press.index === BLOCK ? Math.max(0, glyphAt(pointer.x, pointer.y)) : press.index);
      }
      press.index = -1;
      wake();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave, { passive: true });
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(container);
    resize();
    if (pending.current === "play") api.current.play();
    if (pending.current === "show") api.current.showAll();
    pending.current = null;
    if (pendingTint.current) api.current.tint(...pendingTint.current);
    pendingTint.current = null;

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      cursorOwners.delete(cursorId);
      applyCursor();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [introDuration, glyphData, area, fontSize, fillVar, dashVar, accentVar, outlineVar, outlineWidth, accentShadow, hover]);

  return (
    <div ref={containerRef} className={className} style={style} aria-hidden="true">
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  );
});
