"use client";

/*
 * Рух секції Molecula: картки гортаються скролом.
 * Секція висока (100svh + по SCREENS_PER_CARD екрана на кожну наступну картку), сцена всередині «прилипає» до екрана,
 * і поки ти скролиш цей відрізок, step = номер картки за прогресом.
 * Клік/кидок/клавіша просять наступну картку: step міняється одразу, а сторінка плавно докручується до відповідного місця
 * (поки докручується, скрол стан не перебиває). З останньої картки — назад до першої.
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export const SCREENS_PER_CARD = 0.6;

export function useScrollSteps(sectionRef: RefObject<HTMLElement | null>, count: number) {
  const [step, setStep] = useState(0);
  const lockRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const geometry = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return null;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const length = el.offsetHeight - window.innerHeight; // скільки скролу «прилиплої» сцени
    return { top, length };
  }, [sectionRef]);

  useEffect(() => {
    const onScroll = () => {
      if (lockRef.current) return;
      const g = geometry();
      if (!g || g.length <= 0) return;
      const progress = Math.min(1, Math.max(0, (window.scrollY - g.top) / g.length));
      setStep(Math.min(count - 1, Math.round(progress * (count - 1))));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearTimeout(lockRef.current);
    };
  }, [geometry, count]);

  const request = useCallback(
    (next: number) => {
      const g = geometry();
      setStep(next);
      if (!g || count < 2) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const y = g.top + (g.length * next) / (count - 1);
      clearTimeout(lockRef.current);
      const release = () => {
        clearTimeout(lockRef.current);
        lockRef.current = undefined;
        window.removeEventListener("scrollend", release);
      };
      // поки сторінка докручується — скрол не міняє картку (запас по часу, якщо scrollend не прийде)
      lockRef.current = setTimeout(release, 1200);
      window.addEventListener("scrollend", release);
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    },
    [geometry, count],
  );

  return [step, request] as const;
}

/*
 * Поява секції. Спершу секція — просто чорна (угорі — піксельний шов, PixelSeam, що розчиняється на скрол).
 * Коли верх секції дійшов до верху екрана: проявляється крейдове тло → прилітає стопка карток → вистрибує тарган → кнопка.
 * Якщо прокрутити назад так, що секція повністю зникла внизу, — усе ховається, і наступного разу поява повториться.
 * При «менше руху» — одразу фінальний стан.
 */
export function useMoleculaReveal(sectionRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const el = sectionRef.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
      tl.to(q('[data-mol="chalk"]'), { opacity: 1, duration: 0.9, ease: "power2.out" })
        .fromTo(
          q('[data-mol="cards"]'),
          { opacity: 0, yPercent: 18, rotation: -6 },
          { opacity: 1, yPercent: 0, rotation: 0, duration: 0.9, ease: "back.out(1.4)" },
          0.35,
        )
        .fromTo(
          q('[data-mol="roach"]'),
          { opacity: 0, scale: 0.2, rotation: -30 },
          { opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(2.2)" },
          0.85,
        )
        .fromTo(q('[data-mol="cta"]'), { opacity: 0, yPercent: 60 }, { opacity: 1, yPercent: 0, duration: 0.6 }, 1);

      let shown = false;
      let raf = 0;
      const check = () => {
        raf = 0;
        const top = el.getBoundingClientRect().top;
        if (!shown && top <= 1) {
          shown = true;
          if (reduced) tl.progress(1);
          else tl.play(0);
        } else if (shown && top >= window.innerHeight) {
          shown = false;
          tl.pause(0);
        }
      };
      const onScroll = () => {
        if (!raf) raf = requestAnimationFrame(check);
      };
      check();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    },
    { scope: sectionRef },
  );
}
