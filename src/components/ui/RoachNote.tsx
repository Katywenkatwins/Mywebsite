"use client";

/*
 * Тарган-провідник із фразою: на наведенні (фокусі з клавіатури, дотику) поруч друкується його фраза —
 * DM Mono 12 px на білій підкладці, як у Фріди в hero; сам тарган коротко киває.
 * Використовується в Molecula (тарган із блокнотом) і About (тарган із німбом).
 * Позиції задає власник класами left/top/w/h з одиницею --u. Для анімації появи власник передає revealAttr
 * (атрибут на тарганові) — тарган стартує прозорим, проявляє його власник.
 */

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import type { StaticImageData } from "next/image";
import { TypedNote, typedStagger } from "@/components/ui/TypedNote";

type Props = {
  image: StaticImageData;
  /** хто це — для скрінрідера */
  label: string;
  message: string;
  /** позиція і розмір таргана */
  className: string;
  /** позиція і ширина фрази */
  noteClassName: string;
  /** атрибут для анімації появи, напр. { "data-mol": "roach" } */
  revealAttr?: Record<string, string>;
  /** позиція, якщо вона рахується в коді (замість класів) */
  style?: CSSProperties;
  noteStyle?: CSSProperties;
};

export function RoachNote({ image, label, message, className, noteClassName, revealAttr, style, noteStyle }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const el = root.current;
      if (!el || !contextSafe) return;
      const q = gsap.utils.selector(el);
      const trigger = q("[data-roach]")[0] as HTMLElement;
      const body = q("[data-roach-body]");
      const chars = q("[data-roach-char]");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let open = false;

      const show = contextSafe(() => {
        if (open) return;
        open = true;
        trigger.setAttribute("aria-expanded", "true");
        gsap.killTweensOf(chars);
        if (reduced) {
          gsap.set(chars, { opacity: 1 });
          return;
        }
        gsap.set(chars, { opacity: 0 });
        gsap.to(chars, { opacity: 1, duration: 0.01, stagger: typedStagger(0.012) });
        gsap.fromTo(
          body,
          { rotation: 0 },
          { rotation: -5, duration: 0.12, repeat: 3, yoyo: true, ease: "sine.inOut", transformOrigin: "50% 95%" },
        );
      });
      const hide = contextSafe(() => {
        if (!open) return;
        open = false;
        trigger.setAttribute("aria-expanded", "false");
        gsap.killTweensOf(chars);
        gsap.to(chars, { opacity: 0, duration: reduced ? 0 : 0.25 });
      });
      const onClick = (e: MouseEvent) => {
        if ((e as PointerEvent).pointerType === "mouse") return;
        if (open) hide();
        else show();
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
    <div ref={root} className="contents">
      <div
        data-roach
        {...revealAttr}
        role="button"
        tabIndex={0}
        aria-label={`${label}: ${message}`}
        aria-expanded="false"
        style={style}
        className={`absolute z-20 opacity-0 outline-none focus-visible:outline-2 focus-visible:outline-paper ${className}`}
      >
        <div data-roach-body className="size-full">
          <Image src={image} alt="" sizes="(max-width: 767px) 30vw, 15vw" className="block size-full" draggable={false} />
        </div>
      </div>
      <div className={`pointer-events-none absolute z-20 ${noteClassName}`} style={noteStyle}>
        <TypedNote
          text={message}
          attr="data-roach-char"
          style={{ left: 0, top: 0, width: "100%" }}
          className="max-md:text-[12px] max-md:leading-[16px] max-md:tracking-[-0.24px]"
        />
      </div>
    </div>
  );
}
