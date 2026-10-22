"use client";

/*
 * Luminous Type — приглушений текст, який «підсвічує» м'яка пляма світла (за мотивами Luminous Type з React Bits Pro,
 * власна реалізація на SVG-масках; код Pro не використано).
 *  - текст завжди трохи видно (baseOpacity), під плямою — на повну яскравість;
 *  - центр плями — колір тексту (colorVar), край — відтінок (tintVar);
 *  - без миші пляма повільно блукає по тексту; з мишею — тягнеться за курсором, лишаючи короткий слід;
 *  - клік по секції вмикає світло на весь текст, ще клік — знову пляма;
 *  - show()/hide() — поява й зникнення (пляма розгорається з нуля), керує власник (about.motion).
 * Літери — готові контури (glyphs) у координатах сцени 1920×1080.
 * При «менше руху» — без блукання: світло одразу на весь текст.
 */

import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from "react";

export type LuminousHandle = { show: () => void; hide: () => void };

type Props = {
  glyphs: { d: string }[];
  /** межі тексту — по них блукає пляма */
  box: { x: number; y: number; w: number; h: number };
  colorVar: string;
  tintVar: string;
  baseOpacity?: number;
  /** радіус плями, пікселі макета */
  radius?: number;
  /** м'якість краю 0..1 */
  softness?: number;
  /** слід за плямою 0..1 */
  trail?: number;
  /** як швидко пляма йде за курсором 0..1 */
  follow?: number;
  driftSpeed?: number;
  className?: string;
};

const INTERACTIVE = "a, button, input, textarea, select, [role='button'], canvas";

export const LuminousText = forwardRef<LuminousHandle, Props>(function LuminousText(
  {
    glyphs,
    box,
    colorVar,
    tintVar,
    baseOpacity = 0.16,
    radius = 270,
    softness = 0.6,
    trail = 0.5,
    follow = 0.5,
    driftSpeed = 1,
    className = "",
  },
  ref,
) {
  const id = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const api = useRef<LuminousHandle>({ show: () => {}, hide: () => {} });
  useImperativeHandle(ref, () => ({ show: () => api.current.show(), hide: () => api.current.hide() }));

  useEffect(() => {
    const svg = svgRef.current;
    const section = svg?.closest("section");
    if (!svg || !section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = <T extends Element>(s: string) => svg.querySelector<T>(s)!;
    const base = q<SVGGElement>("[data-lum-base]");
    const lights = Array.from(svg.querySelectorAll<SVGCircleElement>("[data-lum-light]"));
    const trails = Array.from(svg.querySelectorAll<SVGCircleElement>("[data-lum-trail]"));
    const fulls = Array.from(svg.querySelectorAll<SVGRectElement>("[data-lum-full]"));

    const center = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    const light = { ...center };
    const after = { ...center };
    const target = { ...center };
    let pointerAt = 0; // коли востаннє рухалась миша (с)
    let pointerIn = false;
    let shown = false;
    let intensity = 0; // 0..1 — розмір плями
    let appear = 0; // 0..1 — видимість приглушеного тексту
    let full = 0; // 0..1 — світло на весь текст
    let fullTarget = 0;
    let t = 0;
    let last = 0;
    let raf = 0;
    let visible = false;

    const apply = () => {
      base.setAttribute("opacity", String(baseOpacity * appear));
      const r = radius * intensity;
      lights.forEach((c) => {
        const k = Number(c.dataset.scale);
        c.setAttribute("cx", String(light.x));
        c.setAttribute("cy", String(light.y));
        c.setAttribute("r", String(Math.max(0.01, r * k)));
      });
      trails.forEach((c) => {
        const k = Number(c.dataset.scale);
        c.setAttribute("cx", String(after.x));
        c.setAttribute("cy", String(after.y));
        c.setAttribute("r", String(Math.max(0.01, r * k * 0.8)));
        c.setAttribute("opacity", String(trail * 0.7));
      });
      fulls.forEach((f) => f.setAttribute("opacity", String(full * appear)));
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      t += dt;
      const ease = (speed: number) => 1 - Math.exp(-dt * speed);
      // блукання без миші (або коли миша давно стоїть поза текстом)
      if (!pointerIn || t - pointerAt > 3) {
        target.x = center.x + Math.sin(t * 0.37 * driftSpeed) * box.w * 0.42;
        target.y = center.y + Math.sin(t * 0.61 * driftSpeed + 1.3) * box.h * 0.38;
      }
      light.x += (target.x - light.x) * ease(2 + follow * 16);
      light.y += (target.y - light.y) * ease(2 + follow * 16);
      after.x += (light.x - after.x) * ease(2.5);
      after.y += (light.y - after.y) * ease(2.5);
      intensity += ((shown ? 1 : 0) - intensity) * ease(shown ? 2.2 : 5);
      appear += ((shown ? 1 : 0) - appear) * ease(shown ? 3 : 6);
      full += (fullTarget - full) * ease(5);
      apply();
      const settled = !shown && appear < 0.001;
      if (visible && !settled) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && visible) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    api.current.show = () => {
      shown = true;
      if (reduced) {
        appear = 1;
        intensity = 1;
        full = fullTarget = 1;
        apply();
        return;
      }
      // пляма розгорається на початку тексту
      light.x = after.x = target.x = box.x + box.w * 0.15;
      light.y = after.y = target.y = box.y + box.h * 0.3;
      t = 0;
      start();
    };
    api.current.hide = () => {
      shown = false;
      fullTarget = 0;
      if (reduced) {
        appear = intensity = full = 0;
        apply();
        return;
      }
      start();
    };

    const toScene = (e: PointerEvent) => {
      const m = svg.getScreenCTM();
      if (!m) return null;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return p;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !shown) return;
      const p = toScene(e);
      if (!p) return;
      pointerIn = true;
      pointerAt = t;
      target.x = p.x;
      target.y = p.y;
      start();
    };
    const onLeave = () => {
      pointerIn = false;
    };
    const onClick = (e: MouseEvent) => {
      if (!shown) return;
      const el = e.target as HTMLElement;
      // клік по бейджу (полотно під курсором-рукою) чи по кнопці — не наш
      if (el.closest(INTERACTIVE) && !(el instanceof HTMLCanvasElement && !el.style.cursor)) return;
      fullTarget = fullTarget ? 0 : 1;
      start();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(svg);
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    section.addEventListener("click", onClick);
    apply();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      section.removeEventListener("click", onClick);
    };
  }, [box, baseOpacity, radius, trail, follow, driftSpeed]);

  // м'який край: суцільно до (1 − softness), далі згасає
  const solid = Math.max(0, Math.min(0.95, 1 - softness));
  const paths = glyphs.map((g, i) => <path key={i} d={g.d} />);
  const mask = (name: string, scale: number) => (
    <mask id={`${id}-${name}`} maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
      <circle data-lum-light data-scale={scale} cx="0" cy="0" r="0.01" fill={`url(#${id}-grad)`} />
      <circle data-lum-trail data-scale={scale} cx="0" cy="0" r="0.01" fill={`url(#${id}-grad)`} opacity="0" />
      <rect data-lum-full x="0" y="0" width="1920" height="1080" fill="white" opacity="0" />
    </mask>
  );

  return (
    <svg ref={svgRef} aria-hidden="true" viewBox="0 0 1920 1080" className={`overflow-visible ${className}`}>
      <defs>
        <radialGradient id={`${id}-grad`}>
          <stop offset="0" stopColor="white" />
          <stop offset={solid} stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {mask("tint", 1)}
        {mask("core", 0.6)}
      </defs>
      {/* приглушений текст */}
      <g data-lum-base opacity="0" style={{ fill: `var(${colorVar})` }}>
        {paths}
      </g>
      {/* край світла — відтінок */}
      <g mask={`url(#${id}-tint)`} style={{ fill: `var(${tintVar})` }}>
        {paths}
      </g>
      {/* серцевина світла — колір тексту на повну */}
      <g mask={`url(#${id}-core)`} style={{ fill: `var(${colorVar})` }}>
        {paths}
      </g>
    </svg>
  );
});
