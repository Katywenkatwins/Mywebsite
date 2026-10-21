"use client";

/*
 * Рух секції Molecula. Сцена всередині високої секції «прилипає» до екрана, і скрол цієї сцени ділиться на три відрізки:
 *   HOLD_IN  — сцена стоїть, крейдове тло проявляється разом зі скролом (назад — так само зникає, і лише потім секція їде вниз);
 *   картки   — по SCREENS_PER_CARD екрана на кожну наступну картку, step = номер картки за прогресом;
 *   HOLD_OUT — сцена стоїть, тло зникає зі скролом, і лише потім секція їде вгору.
 * Клік/кидок/клавіша просять наступну картку: step міняється одразу, а сторінка плавно докручується до відповідного місця
 * (поки докручується, скрол стан не перебиває). З останньої картки — назад до першої.
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export const SCREENS_PER_CARD = 0.6;
/** скільки екрана скролу тло проявляється (на вході) і зникає (на виході), поки сцена стоїть */
export const HOLD_IN = 0.5;
export const HOLD_OUT = 0.5;
/** висота секції у svh для count карток */
export const sectionScreens = (count: number) => 1 + HOLD_IN + (count - 1) * SCREENS_PER_CARD + HOLD_OUT;

/** геометрія прилиплої сцени: де починається, скільки триває, скільки пікселів в «одному екрані» розкладки */
const pinGeometry = (el: HTMLElement, count: number) => {
  const top = el.getBoundingClientRect().top + window.scrollY;
  const length = el.offsetHeight - window.innerHeight;
  const unit = length / (HOLD_IN + (count - 1) * SCREENS_PER_CARD + HOLD_OUT);
  return { top, length, unit, cardsStart: top + HOLD_IN * unit, cardsLength: (count - 1) * SCREENS_PER_CARD * unit };
};

export function useScrollSteps(sectionRef: RefObject<HTMLElement | null>, count: number) {
  const [step, setStep] = useState(0);
  const lockRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const geometry = useCallback(() => {
    const el = sectionRef.current;
    return el ? pinGeometry(el, count) : null;
  }, [sectionRef, count]);

  useEffect(() => {
    const onScroll = () => {
      if (lockRef.current) return;
      const g = geometry();
      if (!g || g.cardsLength <= 0) return;
      const progress = Math.min(1, Math.max(0, (window.scrollY - g.cardsStart) / g.cardsLength));
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
      const y = g.cardsStart + (g.cardsLength * next) / (count - 1);
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
 * Поява й зникнення.
 *  - Заїзд: секція чорна, угорі сірий піксельний шов (PixelSeam), що розчиняється на скрол.
 *  - HOLD_IN: сцена стоїть, тло проявляється зі скролом; коли тло повне — прилітає стопка карток, вистрибує тарган, кнопка.
 *    Назад: картки, тарган і кнопка швидко ховаються, тло зникає зі скролом, і лише тоді секція їде вниз до hero.
 *  - HOLD_OUT: сцена стоїть, тло зникає зі скролом, і лише тоді секція їде вгору.
 * При «менше руху» елементи з'являються одразу, тло так само слідує за скролом.
 */
export function useMoleculaReveal(sectionRef: RefObject<HTMLElement | null>, count: number) {
  useGSAP(
    () => {
      const el = sectionRef.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const chalk = q('[data-mol="chalk"]');

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
      tl.fromTo(
        q('[data-mol="cards"]'),
        { opacity: 0, yPercent: 18, rotation: -6 },
        { opacity: 1, yPercent: 0, rotation: 0, duration: 0.9, ease: "back.out(1.4)" },
      )
        .fromTo(
          q('[data-mol="roach"]'),
          { opacity: 0, scale: 0.2, rotation: -30 },
          { opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(2.2)" },
          0.5,
        )
        .fromTo(q('[data-mol="cta"]'), { opacity: 0, yPercent: 60 }, { opacity: 1, yPercent: 0, duration: 0.6 }, 0.65);

      let shown = false;
      let raf = 0;
      const check = () => {
        raf = 0;
        const g = pinGeometry(el, count);
        const s = window.scrollY - g.top; // скільки проскролено всередині прилиплої сцени
        const fadeIn = Math.min(1, Math.max(0, s / (HOLD_IN * g.unit)));
        const fadeOut = Math.min(1, Math.max(0, (g.length - s) / (HOLD_OUT * g.unit)));
        gsap.set(chalk, { opacity: Math.min(fadeIn, fadeOut) });

        if (!shown && fadeIn >= 1) {
          shown = true;
          if (reduced) tl.progress(1);
          else tl.timeScale(1).play();
        } else if (shown && fadeIn < 1) {
          shown = false;
          if (reduced) tl.progress(0);
          else tl.timeScale(2.5).reverse();
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
