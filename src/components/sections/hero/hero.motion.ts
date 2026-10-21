import { gsap } from "gsap";
import { DESIGNER_TYPE_SECONDS, type GlyphTechHandle } from "./GlyphTech";

/** скільки триває друк OF VISUAL SENSES, с */
export const SENSES_TYPE_SECONDS = 1;
/** скільки триває друк абзацу в правому нижньому куті, с */
export const INTRO_TYPE_SECONDS = 1.8;

/*
 * Рух hero. Верстка — Hero.tsx, тут тільки анімація.
 * Сценарій:
 *  1. піксельне відео грає один раз → проявляється чисте фото;
 *  2. «Kateryna Smiian» проявляється по літерах маскою зліва направо з м'яким краєм;
 *  3. DESIGNER друкується по літерах (рамка виділення біжить по літері);
 *  4. одразу за ним так само друкується OF VISUAL SENSES;
 *  5. тарган і меню, кнопки;
 *  6. абзац у правому нижньому куті друкується (TechText).
 */

type Options = {
  /** true — без руху: одразу фінальний стан (prefers-reduced-motion) */
  instant: boolean;
  designer: GlyphTechHandle | null;
  senses: GlyphTechHandle | null;
  intro: GlyphTechHandle | null;
};

export function playHeroReveal(root: HTMLElement, { instant, designer, senses, intro }: Options) {
  const q = gsap.utils.selector(root);
  const video = q("[data-hero-video]");
  const nameWipes = q("[data-name-wipe]");

  if (instant) {
    gsap.set(video, { autoAlpha: 0 });
    gsap.set(q("[data-reveal]"), { opacity: 1 });
    gsap.set(nameWipes, { attr: { transform: "matrix(1 0 0 1 0 0)" } });
    designer?.showAll();
    senses?.showAll();
    intro?.showAll();
    return null;
  }

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  // 1. відео → фото
  tl.to(video, { autoAlpha: 0, duration: 0.9, ease: "power2.inOut" })
    .set(q('[data-reveal="cutout"]'), { opacity: 1 });

  // 2. ім'я: кожна літера відкривається маскою зліва направо, наступна стартує, поки попередня ще йде
  const write = tl.duration();
  tl.set(q('[data-reveal="name"]'), { opacity: 1 }, write);
  const per = 0.55;
  const stagger = 0.13;
  nameWipes.forEach((rect, i) => {
    const x0 = Number(rect.getAttribute("data-x0"));
    const scale = { v: 0 };
    tl.to(
      scale,
      {
        v: 1,
        duration: per,
        ease: "power2.inOut",
        onUpdate: () => rect.setAttribute("transform", `matrix(${scale.v} 0 0 1 ${x0 * (1 - scale.v)} 0)`),
      },
      write + i * stagger,
    );
  });
  const nameDone = write + (nameWipes.length - 1) * stagger + per;

  // 3. DESIGNER друкується
  tl.call(() => void designer?.play(), undefined, nameDone - 0.2);
  const typed = nameDone - 0.2 + DESIGNER_TYPE_SECONDS;

  // 4. OF VISUAL SENSES — одразу за DESIGNER, теж по літерах (рамка біжить по літері)
  tl.call(() => void senses?.play(), undefined, typed);
  const sensesDone = typed + SENSES_TYPE_SECONDS;

  // 5. тарган і меню
  tl.fromTo(
    q('[data-reveal="roach"]'),
    { opacity: 0, scale: 0.2, rotation: -30 },
    { opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(2.2)" },
    sensesDone,
  ).fromTo(
    q('[data-reveal="nav"]'),
    { opacity: 0, yPercent: 60 },
    { opacity: 1, yPercent: 0, duration: 0.6, stagger: 0.04 },
    sensesDone - 0.3,
  );

  // 6. абзац у правому нижньому куті друкується, поки з'являється меню
  tl.call(() => void intro?.play(), undefined, sensesDone);

  return tl;
}
