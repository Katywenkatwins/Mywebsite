"use client";

/*
 * Крейдовий фон секції Molecula: поле формул і ескізів, що повільно пливе; час від часу якась формула
 * стирається й переписується наново; біля курсора крейда розступається й світлішає, натиск — сильніше.
 * Портовано з «Chalkflow Geometry» (Originkit), налаштування — як у присланому пресеті.
 * Кольори — токени: тло --color-ink, крейда --color-chalk, спалах --color-paper.
 * Мишу слухає батьківський елемент (щоб ефект працював і під картками). Поза екраном не малює.
 * При «менше руху» — нерухоме поле без реакції на курсор.
 */

import { useEffect, useRef } from "react";
import {
  CHALK_DEFAULTS,
  buildField,
  clamp,
  colorLut,
  easeInOutCubic,
  mod,
  parseColor,
  strokePart,
  TH,
  TW,
  type Field,
} from "./chalk-geometry";

// Пресет з присланого коду
const SPEED = 50;
const DIRECTION = 127;
const SCALE = 162;
const REWRITES = 20;
const STROKE = 4;
const adv = CHALK_DEFAULTS;

type Active = { t0: number; D: number };

export function ChalkField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !root || !ctx) return;

    const css = getComputedStyle(root);
    const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const bg = parseColor(token("--color-ink", "#000000")) ?? [0, 0, 0, 1];
    const lut = colorLut(token("--color-chalk", "#b2b2ff"), token("--color-paper", "#ffffff"));

    let W = 0;
    let H = 0;
    let dpr = 1;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ptr = { x: 0, y: 0, inside: false, down: false };
    let over = 0;
    let down = 0;
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
    };
    const onMove = (e: PointerEvent) => {
      local(e);
      ptr.inside = true;
    };
    const onLeave = () => {
      ptr.inside = false;
    };
    const onDown = (e: PointerEvent) => {
      local(e);
      ptr.down = true;
    };
    const onUp = () => {
      ptr.down = false;
    };

    const field: Field = buildField(adv);
    const active = new Map<number, Active>();
    let T = 0;
    let ox = 0;
    let oy = 0;
    let spawnAcc = -1;
    let last = -1;
    let raf = 0;
    let visible = false;

    const frame = (now: number) => {
      let dt = last < 0 ? 0 : (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      if (W < 2 || H < 2) return;
      const items = field.items;

      const sp = reduce ? 0 : clamp(SPEED, 0, 100) / 50;
      const dtA = dt * sp;
      T += dtA;
      const u = (H / 800) * (Math.max(10, SCALE) / 100);
      const VW = W / u;
      const VH = H / u;

      // поле пливе
      const rate = (adv.driftRate / 100) * (W / u);
      const ang = (mod(DIRECTION, 360) * Math.PI) / 180;
      ox = mod(ox - Math.cos(ang) * rate * dtA, TW);
      oy = mod(oy - Math.sin(ang) * rate * dtA, TH);

      // переписування формул
      const fade = adv.fadeMs / 1000;
      const blank = adv.blankMs / 1000;
      const settle = Math.max(0.001, adv.settleMs / 1000);
      active.forEach((A, idx) => {
        if (T - A.t0 > fade + blank + A.D + settle) active.delete(idx);
      });
      const spawnInt = Math.max(0.05, adv.spawnMs / 1000);
      const maxActive = clamp(Math.round(REWRITES), 0, 40);
      if (spawnAcc < 0) spawnAcc = spawnInt;
      spawnAcc += dtA;
      let guard = 0;
      while (sp > 0 && spawnAcc >= spawnInt && guard++ < 8) {
        spawnAcc -= spawnInt;
        if (active.size >= maxActive || field.picks.length === 0) continue;
        for (let tries = 0; tries < 40; tries++) {
          const idx = field.picks[Math.floor(Math.random() * field.picks.length)];
          if (active.has(idx)) continue;
          const it = items[idx];
          const sx = mod(it.x - ox, TW);
          const sy = mod(it.y - oy, TH);
          const m = Math.min(it.r, 40);
          const okX = VW >= TW - 1 || (sx > m && sx < VW - m);
          const okY = VH >= TH - 1 || (sy > m && sy < VH - m);
          if (!okX || !okY) continue;
          const wMin = Math.max(0.05, adv.writeMinMs / 1000);
          const wMax = Math.max(wMin, adv.writeMaxMs / 1000);
          const k = clamp(it.total / (adv.textSize * 70), 0, 1);
          active.set(idx, { t0: T, D: wMin + (wMax - wMin) * k });
          break;
        }
      }
      if (spawnAcc > spawnInt) spawnAcc = spawnInt;

      // курсор розсуває крейду
      const hov = reduce ? 0 : Math.max(0, adv.hover) / 50;
      const tin = Math.max(0.01, adv.hoverInMs / 1000) / 3;
      const tout = Math.max(0.01, adv.hoverOutMs / 1000) / 3;
      const tgt = ptr.inside ? 1 : 0;
      over += (tgt - over) * (1 - Math.exp(-dt / (tgt > over ? tin : tout)));
      const dTgt = ptr.down ? 1 : 0;
      down += (dTgt - down) * (1 - Math.exp(-dt / (dTgt > down ? tin : tout)));
      const pAmt = over * hov;
      const R = (adv.hoverRadius / 100) * VW;
      const pushMax = ((adv.hoverPush * (W / 1200)) / u) * (1 + down * (adv.pressBoost / 100 - 1));
      const mxd = ptr.x / u;
      const myd = ptr.y / u;

      const cw = canvas.width;
      const ch = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(${bg[0]},${bg[1]},${bg[2]},${bg[3]})`;
      ctx.fillRect(0, 0, cw, ch);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = (clamp(STROKE, 0.5, 8) * 0.65) / (Math.max(10, SCALE) / 100);
      const baseAlpha = clamp(adv.inkOpacity, 0, 100) / 100;
      ctx.globalAlpha = baseAlpha;
      const k = dpr * u;
      let cur = -1;

      for (let n = 0; n < items.length; n++) {
        const it = items[n];
        const A = active.get(n);
        const sx0 = mod(it.x - ox, TW);
        const sy0 = mod(it.y - oy, TH);
        for (let X = sx0 - TW; X < VW + it.r; X += TW) {
          if (X + it.r < 0) continue;
          for (let Y = sy0 - TH; Y < VH + it.r; Y += TH) {
            if (Y + it.r < 0) continue;
            let px = 0;
            let py = 0;
            let f = 0;
            if (pAmt > 0.001 && R > 0) {
              const dx = X - mxd;
              const dy = Y - myd;
              const d = Math.hypot(dx, dy);
              if (d < R) {
                const q = 1 - d / R;
                f = q * q * (3 - 2 * q) * pAmt;
                const push = (pushMax * f) / (d || 1);
                px = dx * push;
                py = dy * push;
              }
            }
            ctx.setTransform(k, 0, 0, k, (X + px) * k, (Y + py) * k);
            if (!A) {
              const li = Math.min(32, Math.round(f * 32));
              if (li !== cur) {
                ctx.strokeStyle = lut[li];
                cur = li;
              }
              ctx.stroke(it.path);
              continue;
            }
            cur = -1;
            const e = T - A.t0;
            if (e < fade) {
              ctx.globalAlpha = baseAlpha * (1 - (e / fade) ** 2);
              ctx.strokeStyle = lut[Math.min(32, Math.round(f * 32))];
              ctx.stroke(it.path);
              ctx.globalAlpha = baseAlpha;
            } else if (e >= fade + blank) {
              const tw = e - fade - blank;
              for (let s = 0; s < it.s.length; s++) {
                const sk = it.total > 0 ? (A.D * it.cum[s]) / it.total : 0;
                const dk = it.total > 0 ? (A.D * it.lens[s]) / it.total : 0;
                if (tw < sk) break;
                if (tw >= sk + dk) {
                  const b = clamp(1 - (tw - sk - dk) / settle, 0, 1);
                  ctx.strokeStyle = lut[Math.min(32, Math.round(Math.max(b, f) * 32))];
                  strokePart(ctx, it.s[s], Infinity);
                } else {
                  const pr = dk > 1e-6 ? easeInOutCubic((tw - sk) / dk) : 1;
                  ctx.strokeStyle = lut[32];
                  strokePart(ctx, it.s[s], it.lens[s] * pr);
                }
              }
            }
          }
        }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    };

    // якщо комп'ютер не встигає (кадр довший за ~20 мс), малюємо в звичайній щільності пікселів замість ретини
    let slowSum = 0;
    let slowN = 0;
    let lowRes = false;
    const loop = (now: number) => {
      raf = 0;
      const t0 = performance.now();
      frame(now);
      if (!lowRes && dpr > 1) {
        slowSum += performance.now() - t0;
        if (++slowN === 30) {
          if (slowSum / slowN > 20) {
            lowRes = true;
            resize();
          }
          slowSum = 0;
          slowN = 0;
        }
      }
      if (visible && !reduce) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf) {
        last = -1;
        raf = requestAnimationFrame(loop);
      }
    };

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      dpr = lowRes ? 1 : Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      start();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none block size-full ${className}`} />;
}
