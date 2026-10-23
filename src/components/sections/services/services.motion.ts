"use client";

/*
 * Рух секції Services: коли секція повністю в екрані — проявляється заголовок, картки «роздаються» віялом
 * з-під центру (по черзі), з'являється кнопка, вистрибує тарган за кермом.
 * Якщо прокрутити назад так, що секція повністю зникла внизу, — усе ховається, наступного разу поява повториться.
 * При «менше руху» — одразу фінальний стан. На мобільному (ряд карток) — просто проявлення.
 */

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

export function useServicesReveal(sectionRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = gsap.utils.selector(el);
    const heading = q('[data-services="heading"]');
    const cards = q<HTMLElement>('[data-services="card"]');
    const roach = q('[data-services="roach"]');
    const cta = q('[data-services="cta"]');
    const all = [...heading, ...cards, ...roach, ...cta];
    let shown = false;
    let raf = 0;
    let tl: gsap.core.Timeline | null = null;

    const play = () => {
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      tl?.kill();
      if (reduced) {
        gsap.set(all, { opacity: 1 });
        return;
      }
      tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(heading, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 });
      if (mobile) {
        tl.fromTo(cards, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 0.2);
      } else {
        // з-під центральної картки — на свої місця віялом
        tl.fromTo(
          cards,
          {
            opacity: 0,
            xPercent: (_i: number, c: HTMLElement) => (Number(c.dataset.dx) / 366) * 100,
            yPercent: 40,
            rotation: (_i: number, c: HTMLElement) => -Number(c.dataset.dx) / 40,
          },
          { opacity: 1, xPercent: 0, yPercent: 0, rotation: 0, duration: 0.9, stagger: 0.07, ease: "back.out(1.3)" },
          0.15,
        );
      }
      tl.fromTo(cta, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, mobile ? 0.5 : 0.7);
      tl.fromTo(
        roach,
        { opacity: 0, scale: 0.2, rotation: -40 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(2.2)" },
        0.8,
      );
    };

    const check = () => {
      raf = 0;
      const top = el.getBoundingClientRect().top;
      // на мобільному секція вища за екран — показуємо, щойно верх доїхав до верхньої третини
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      const arrived = mobile ? top <= window.innerHeight * 0.35 : top <= 1;
      if (!shown && arrived) {
        shown = true;
        play();
      } else if (shown && top >= window.innerHeight) {
        shown = false;
        tl?.kill();
        gsap.set(all, { opacity: 0 });
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
  }, [sectionRef]);
}
