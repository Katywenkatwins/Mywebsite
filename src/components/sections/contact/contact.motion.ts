"use client";

/*
 * Рух секції Contact: коли секція повністю в екрані (на мобільному — коли верх доїхав до верхньої третини),
 * знизу виїжджає заголовок (DESIGNER → OF VISUAL SENSES → ім'я), потім по черзі вистрибують іконки й «малюються».
 * Якщо прокрутити назад так, що секція повністю зникла внизу, — усе ховається, наступного разу поява повториться.
 * При «менше руху» — одразу фінальний стан.
 */

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

export function useContactReveal(sectionRef: RefObject<HTMLElement | null>, onShown: (v: boolean) => void) {
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = gsap.utils.selector(el);
    const heading = [...q('[data-contact="designer"]'), ...q('[data-contact="senses"]'), ...q('[data-contact="name"]')];
    const icons = q('[data-contact="icon"]');
    const all = [...heading, ...icons];
    let shown = false;
    let raf = 0;
    let tl: gsap.core.Timeline | null = null;

    const play = () => {
      tl?.kill();
      onShown(true);
      if (reduced) {
        gsap.set(all, { opacity: 1 });
        return;
      }
      tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(heading, { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.15 });
      tl.fromTo(
        icons,
        { opacity: 0, scale: 0.3, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "back.out(2)" },
        0.35,
      );
    };

    const check = () => {
      raf = 0;
      const top = el.getBoundingClientRect().top;
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      const arrived = top <= (mobile ? window.innerHeight * 0.35 : 2);
      if (!shown && arrived) {
        shown = true;
        play();
      } else if (shown && top >= window.innerHeight) {
        shown = false;
        tl?.kill();
        gsap.set(all, { opacity: 0 });
        onShown(false);
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
      tl?.kill();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sectionRef, onShown]);
}
