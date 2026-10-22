"use client";

/*
 * Рух секції About.
 * Секція трохи вища за екран (SCREENS), сцена «прилипає»: спершу секція повністю заїжджає в екран, сцена стоїть —
 * і тоді з'являється жовтий текст із підсвіткою (LuminousText.show), вистрибує тарган із німбом, малюються іконки контактів.
 * Якщо прокрутити назад так, що секція повністю зникла внизу, — усе ховається, наступного разу поява повториться.
 */

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import type { LuminousHandle } from "@/components/effects/LuminousText";

/** висота секції в екранах: 1 — сама сцена, решта — скільки скролу сцена стоїть */
export const SCREENS = 1.5;

export function useAboutReveal(
  sectionRef: RefObject<HTMLElement | null>,
  lightRef: RefObject<LuminousHandle | null>,
  onShown: (shown: boolean) => void,
) {
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const roach = el.querySelectorAll('[data-about="roach"]');
    const icons = el.querySelectorAll('[data-about="icons"]');
    let shown = false;
    let raf = 0;

    const check = () => {
      raf = 0;
      const top = el.getBoundingClientRect().top;
      if (!shown && top <= 1) {
        shown = true;
        onShown(true);
        lightRef.current?.show();
        if (reduced) gsap.set([roach, icons], { opacity: 1 });
        else {
          gsap.fromTo(
            roach,
            { opacity: 0, scale: 0.2, rotation: -30 },
            { opacity: 1, scale: 1, rotation: 0, duration: 0.8, delay: 0.9, ease: "back.out(2.2)" },
          );
          gsap.fromTo(icons, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.4 });
        }
      } else if (shown && top >= window.innerHeight) {
        shown = false;
        onShown(false);
        lightRef.current?.hide();
        gsap.killTweensOf([roach, icons]);
        gsap.set([roach, icons], { opacity: 0 });
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
  }, [sectionRef, lightRef, onShown]);
}
