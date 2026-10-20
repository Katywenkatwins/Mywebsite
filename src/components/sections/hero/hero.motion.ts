import { gsap } from "gsap";
import { DESIGNER_TYPE_SECONDS, type DesignerTechHandle } from "./DesignerTech";
import { sensesLines, sensesType } from "./lettering";

/*
 * Рух hero. Верстка — Hero.tsx, тут тільки анімація.
 * Сценарій:
 *  1. піксельне відео грає один раз → проявляється чисте фото;
 *  2. «Kateryna Smiian» проявляється по літерах маскою зліва направо з м'яким краєм;
 *  3. DESIGNER друкується по літерах (рамка виділення біжить по літері);
 *  4. одразу за ним друкується OF VISUAL SENSES з курсором;
 *  5. тарган і меню.
 */

type Options = {
  /** true — без руху: одразу фінальний стан (prefers-reduced-motion) */
  instant: boolean;
  designer: DesignerTechHandle | null;
  /** коли відео зникло і фото вже чисте (для фону PixelBlast) */
  onStage?: () => void;
};

export function playHeroReveal(root: HTMLElement, { instant, designer, onStage }: Options) {
  const q = gsap.utils.selector(root);
  const video = q("[data-hero-video]");
  const nameWipes = q("[data-name-wipe]");
  const sensesChars = q("[data-senses-char]");
  const caret = q("[data-senses-caret]");

  if (instant) {
    gsap.set(video, { autoAlpha: 0 });
    gsap.set(q("[data-reveal]"), { opacity: 1 });
    gsap.set(nameWipes, { attr: { transform: "matrix(1 0 0 1 0 0)" } });
    designer?.showAll();
    onStage?.();
    return null;
  }

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  // 1. відео → фото
  tl.to(video, { autoAlpha: 0, duration: 0.9, ease: "power2.inOut" })
    .set(q('[data-reveal="cutout"]'), { opacity: 1 })
    .call(() => onStage?.());

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

  // 4. OF VISUAL SENSES — посимвольно, з курсором
  const step = 0.065;
  let n = 0;
  sensesLines.forEach((line, li) => {
    line.forEach((glyph) => {
      const at = typed + n * step;
      const el = sensesChars[n];
      tl.set(caret, { opacity: 1, attr: { x: glyph.next + 4, y: sensesType.baselines[li] - sensesType.capHeight } }, at);
      tl.set(el, { opacity: 1 }, at);
      n++;
    });
  });
  const sensesDone = typed + n * step;
  tl.to(caret, { opacity: 0, duration: 0.01, repeat: 5, yoyo: true, repeatDelay: 0.22 }, sensesDone + 0.1).set(
    caret,
    { opacity: 0 },
  );

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

  return tl;
}
