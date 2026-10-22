"use client";

/*
 * Рух секції Portfolio.
 * Секція вища за екран: сцена «прилипає» лише тоді, коли секція повністю в екрані (верх дійшов до верху екрана).
 * Поки сцена стоїть, скрол гортає кейси — по SCREENS_PER_CASE екрана на кейс; наприкінці ще HOLD_OUT екрана сцена стоїть
 * на останньому кейсі, і лише тоді секція їде далі.
 * Галерея з'являється (і грає свою появу) теж лише коли секція повністю в екрані; тоді ж вистрибує тарганка.
 * Якщо прокрутити назад так, що секція повністю зникла внизу, — тарганка ховається, наступного разу з'явиться знову.
 */

import { useEffect, useRef, useState, type RefObject } from "react";
import { gsap } from "gsap";
import type { FlexCarouselApi } from "@/components/effects/FlexCarousel";

export const SCREENS_PER_CASE = 0.5;
export const HOLD_OUT = 0.3;
/** висота секції в екранах */
export const sectionScreens = (count: number) => 1 + (count - 1) * SCREENS_PER_CASE + HOLD_OUT;

/** чи секція вже повністю заїжджала в екран (галерею монтуємо з цього моменту) + гортання кейсів скролом */
export function usePortfolioScroll(
  sectionRef: RefObject<HTMLElement | null>,
  count: number,
  apiRef: RefObject<FlexCarouselApi | null>,
) {
  const [arrived, setArrived] = useState(false);
  const stepRef = useRef(-1);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const roach = el.querySelectorAll('[data-portfolio="roach"]');
    let shown = false;
    let raf = 0;

    const check = () => {
      raf = 0;
      const top = el.getBoundingClientRect().top;
      // поява: секція повністю в екрані
      if (!shown && top <= 1) {
        shown = true;
        setArrived(true);
        if (reduced) gsap.set(roach, { opacity: 1 });
        else
          gsap.fromTo(
            roach,
            { opacity: 0, scale: 0.2, rotation: -30 },
            { opacity: 1, scale: 1, rotation: 0, duration: 0.8, delay: 0.3, ease: "back.out(2.2)" },
          );
      } else if (shown && top >= window.innerHeight) {
        shown = false;
        gsap.killTweensOf(roach);
        gsap.set(roach, { opacity: 0 });
      }
      // кейс за прогресом скролу прилиплої сцени
      if (count < 2) return;
      const pin = el.offsetHeight - window.innerHeight;
      const length = (pin * (count - 1) * SCREENS_PER_CASE) / ((count - 1) * SCREENS_PER_CASE + HOLD_OUT);
      const progress = Math.min(1, Math.max(0, -top / length));
      const step = Math.round(progress * (count - 1));
      const api = apiRef.current;
      if (api && top <= 1 && step !== stepRef.current) {
        stepRef.current = step;
        api.goTo(step);
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
  }, [sectionRef, count, apiRef]);

  return arrived;
}
