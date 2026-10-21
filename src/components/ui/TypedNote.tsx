/*
 * Друкований напис на білій підкладці (як у Фріди): кожна літера — окремий span, що з'являється по черзі.
 * Два однакові шари: нижній — лише підкладки під літерами (з «падінгом» через тінь-розтяжку, щоб не зсувати літери),
 * верхній — самі літери. Обидва друкуються синхронно: затримку кожної літери задає data-i (див. typedStagger).
 * Анімацію запускає власник: шукає [attr] і робить gsap.to(..., { opacity: 1, stagger: typedStagger(крок) }).
 */

import type { CSSProperties } from "react";

const textClass =
  "text-u-12 tracking-[calc(-0.24*var(--u))] pointer-events-none absolute leading-[calc(16*var(--u))]";

export function TypedNote({
  text,
  attr,
  style,
  className = "",
}: {
  text: string;
  attr: string;
  style: CSSProperties;
  /** дописати класи (напр. інший розмір на мобільному) */
  className?: string;
}) {
  const spans = (layer: "bg" | "fg") =>
    Array.from(text).map((ch, i) => (
      <span
        key={i}
        data-i={i}
        {...{ [attr]: "" }}
        className={
          layer === "bg" ? "bg-paper opacity-0 shadow-[0_0_0_calc(3*var(--u))_var(--color-paper)]" : "opacity-0"
        }
      >
        {ch}
      </span>
    ));
  return (
    <>
      <p aria-hidden="true" className={`${textClass} text-transparent ${className}`} style={style}>
        {spans("bg")}
      </p>
      <p aria-hidden="true" className={`${textClass} text-ink ${className}`} style={style}>
        {spans("fg")}
      </p>
    </>
  );
}

/** затримка літери за її номером у тексті (підкладка й літера з'являються разом) */
export const typedStagger = (step: number) => (_i: number, el: Element) =>
  Number((el as HTMLElement).dataset.i) * step;
