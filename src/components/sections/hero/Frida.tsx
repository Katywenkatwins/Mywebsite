"use client";

/*
 * Фріда — тарган-митець біля DESIGNER.
 *  - раз на кілька секунд поруч друкується «Psst…», а Фріда в цей момент ворушиться; потім напис зникає;
 *  - на наведенні (або дотику) друкується її повідомлення — DM Mono 12 px, звичайним регістром, на білій підкладці, вужче за абзац унизу;
 *  - курсор тут «активний» (квадратик), і TechText DESIGNER під нею не спрацьовує (data-tech-ignore).
 * Тексти — content/hero.ts → frida. Цикл вмикає hero.motion після появи таргана (start()).
 */

import { forwardRef, useImperativeHandle, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { hero } from "@/content/hero";
import roach from "@/assets/hero/roach.png";
import { TypedNote, typedStagger } from "@/components/ui/TypedNote";

export type FridaHandle = { start: () => void };

const u = (n: number) => `calc(${n} * var(--u))`;
const box = (left: number, top: number, width?: number): CSSProperties => ({
  left: u(left),
  top: u(top),
  ...(width !== undefined && { width: u(width) }),
});

// Пікселі макета 1920×1080
const ROACH = { x: 693, y: 201, w: 93.757, h: 101.459 };
const TEXT_X = ROACH.x + ROACH.w + 6; // текст праворуч від Фріди
const TEXT_Y = ROACH.y + 6;
const BUBBLE_W = 200; // вужче за абзац унизу (276)

const PAUSE_SECONDS = 4; // скільки чекати між «Psst…»

export const Frida = forwardRef<FridaHandle>(function Frida(_, ref) {
  const root = useRef<HTMLDivElement>(null);
  const api = useRef({ start: () => {} });
  useImperativeHandle(ref, () => ({ start: () => api.current.start() }));

  useGSAP(
    (_ctx, contextSafe) => {
      const el = root.current;
      if (!el || !contextSafe) return;
      const q = gsap.utils.selector(el);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const body = q("[data-frida-body]");
      const teaser = q("[data-teaser-char]");
      const message = q("[data-message-char]");
      const trigger = q("[data-frida]")[0] as HTMLElement;

      // «Psst…»: друкується, Фріда ворушиться, тримаємо, зникає; повтор через PAUSE_SECONDS
      const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: PAUSE_SECONDS });
      loop
        .set(teaser, { opacity: 0 })
        .to(teaser, { opacity: 1, duration: 0.01, stagger: typedStagger(0.14) })
        .fromTo(
          body,
          { rotation: 0, y: 0 },
          { rotation: 7, y: -3, duration: 0.09, repeat: 7, yoyo: true, ease: "sine.inOut", transformOrigin: "50% 90%" },
          0,
        )
        .set(body, { rotation: 0, y: 0 })
        .to(teaser, { opacity: 0, duration: 0.3 }, "+=1.4");

      let open = false;
      let started = false;
      let resumeCall: gsap.core.Tween | null = null;

      const show = contextSafe(() => {
        if (open) return;
        open = true;
        resumeCall?.kill();
        loop.pause();
        gsap.to(teaser, { opacity: 0, duration: 0.15 });
        gsap.set(body, { rotation: 0, y: 0 });
        trigger.setAttribute("aria-expanded", "true");
        if (reduced) gsap.set(message, { opacity: 1 });
        else {
          gsap.killTweensOf(message);
          gsap.set(message, { opacity: 0 });
          gsap.to(message, { opacity: 1, duration: 0.01, stagger: typedStagger(0.012) });
          gsap.fromTo(body, { rotation: -6 }, { rotation: 0, duration: 0.5, ease: "back.out(3)", transformOrigin: "50% 90%" });
        }
      });
      const hide = contextSafe(() => {
        if (!open) return;
        open = false;
        trigger.setAttribute("aria-expanded", "false");
        gsap.killTweensOf(message);
        gsap.to(message, { opacity: 0, duration: 0.25 });
        if (started && !reduced) resumeCall = gsap.delayedCall(2, () => loop.restart());
      });
      const toggle = () => (open ? hide() : show());

      api.current.start = () => {
        if (started) return;
        started = true;
        if (!reduced) gsap.delayedCall(1.2, () => loop.play(0));
      };

      // наведення — лише мишею; на дотик відкриваємо/закриваємо кліком нижче
      const onEnter = (e: PointerEvent) => e.pointerType === "mouse" && show();
      const onLeave = (e: PointerEvent) => e.pointerType === "mouse" && hide();
      trigger.addEventListener("pointerenter", onEnter);
      trigger.addEventListener("pointerleave", onLeave);
      // фокус з клавіатури відкриває; фокус від дотику/кліку — ні (тоді працює клік)
      const onFocus = () => trigger.matches(":focus-visible") && show();
      trigger.addEventListener("focus", onFocus);
      trigger.addEventListener("blur", hide);
      // на сенсорному екрані наведення немає — відкриваємо/закриваємо дотиком
      const onClick = (e: MouseEvent) => {
        if ((e as PointerEvent).pointerType === "mouse") return;
        toggle();
      };
      trigger.addEventListener("click", onClick);
      return () => {
        trigger.removeEventListener("pointerenter", onEnter);
        trigger.removeEventListener("pointerleave", onLeave);
        trigger.removeEventListener("focus", onFocus);
        trigger.removeEventListener("blur", hide);
        trigger.removeEventListener("click", onClick);
      };
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <div
        data-reveal="roach"
        data-frida
        data-tech-ignore
        role="button"
        tabIndex={0}
        aria-label={`Frida: ${hero.frida.teaser} ${hero.frida.message}`}
        aria-expanded="false"
        className="pointer-events-auto absolute opacity-0 outline-none"
        style={{ ...box(ROACH.x, ROACH.y, ROACH.w), height: u(ROACH.h) }}
      >
        <div data-frida-body className="size-full">
          <Image src={roach} alt="" className="block size-full" draggable={false} />
        </div>
      </div>

      {/* Текст — DM Mono 12 px, рядок 16 px, звичайним регістром, на білій підкладці */}
      <TypedNote text={hero.frida.teaser} attr="data-teaser-char" style={box(TEXT_X, TEXT_Y, BUBBLE_W)} />
      <TypedNote text={hero.frida.message} attr="data-message-char" style={box(TEXT_X, TEXT_Y, BUBBLE_W)} />
    </div>
  );
});
