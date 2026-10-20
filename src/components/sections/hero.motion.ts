import { gsap } from "gsap";

/*
 * Рух hero. Верстка — Hero.tsx, тут тільки анімація.
 * Сценарій: піксельне відео грає один раз → «проявляється» чисте фото →
 * DESIGNER, OF VISUAL SENSES, ім'я, тарган, меню.
 * Анімуємо лише transform і opacity.
 */

type Options = {
  /** true — без руху: одразу фінальний стан (prefers-reduced-motion, помилка відео) */
  instant: boolean;
};

export function playHeroReveal(root: HTMLElement, { instant }: Options) {
  const q = gsap.utils.selector(root);
  const video = q("[data-hero-video]");
  const all = q("[data-reveal]");

  if (instant) {
    gsap.set(video, { autoAlpha: 0 });
    gsap.set(all, { opacity: 1 });
    return null;
  }

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.to(video, { autoAlpha: 0, duration: 0.9, ease: "power2.inOut" })
    // Вирізана фігура над написами: з'являється, коли під нею вже чисте фото
    .set(q('[data-reveal="cutout"]'), { opacity: 1 })
    .fromTo(
      q('[data-reveal="designer"]'),
      { opacity: 0, yPercent: 22 },
      { opacity: 1, yPercent: 0, duration: 1.2, ease: "expo.out" },
      "-=0.15",
    )
    .fromTo(
      q('[data-reveal="senses"]'),
      { opacity: 0, xPercent: 12 },
      { opacity: 1, xPercent: 0, duration: 1, ease: "expo.out" },
      "<0.2",
    )
    .fromTo(
      q('[data-reveal="name"]'),
      { opacity: 0, yPercent: 10 },
      { opacity: 1, yPercent: 0, duration: 1.3, ease: "power2.out" },
      "<0.15",
    )
    .fromTo(
      q('[data-reveal="roach"]'),
      { opacity: 0, scale: 0.2, rotation: -30 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(2.2)" },
      "<0.5",
    )
    .fromTo(
      q('[data-reveal="nav"]'),
      { opacity: 0, yPercent: 60 },
      { opacity: 1, yPercent: 0, duration: 0.6, stagger: 0.04 },
      "<-0.2",
    );

  return tl;
}
