"use client";

/*
 * Рух секції Portfolio: коли секція повністю в екрані — вистрибує тарганка з намистом.
 * Якщо прокрутити назад так, що секція повністю зникла внизу, — ховається, і наступного разу з'явиться знову.
 * Галерея має власну появу (FlexCarousel, intro="rise") — стартує, коли потрапляє в екран.
 */

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

export function useRoachReveal(sectionRef: RefObject<HTMLElement | null>) {
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
      if (!shown && top <= 1) {
        shown = true;
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
  }, [sectionRef]);
}
