"use client";

/*
 * Секція Contact — остання на головній. Макета в Figma немає, зібрано за описом:
 * світле тло (--color-cream), унизу — заголовок із hero (DESIGNER, OF VISUAL SENSES і ім'я з тим самим вирізом,
 * контури з hero/lettering.ts), трохи менший, щоб не налазив на меню внизу ліворуч; над ним — великі рожеві іконки контактів
 * (посилання — content/site.ts → contacts, порядок — content/contact.ts). Іконки «малюються», коли секція з'являється.
 * Поява — contact.motion.ts. Сцена 1920×1080, --u = --s.
 */

import { useCallback, useRef, useState } from "react";
import { contact } from "@/content/contact";
import { contacts } from "@/content/site";
import { designerGlyphs, letteringArea, nameGlyphs, sensesGlyphs } from "@/components/sections/hero/lettering";
import { contactIcons } from "@/components/sections/about/contact-icons";
import { useContactReveal } from "./contact.motion";

const u = (n: number) => `calc(${n} * var(--u))`;

// Заголовок hero (рамка всіх контурів ≈ x 7…1913, y 96…590) зменшений у K разів:
// лівий край — на x 260 (правіше меню), низ — на y 1050
const K = 0.85;
const TX = 260 - 7 * K;
const TY = 1050 - 590 * K;
const AREA = letteringArea;
const areaStyle = {
  left: u(AREA.x * K + TX),
  top: u(AREA.y * K + TY),
  width: u(AREA.w * K),
  height: u(AREA.h * K),
};
const viewBox = `${AREA.x} ${AREA.y} ${AREA.w} ${AREA.h}`;
// вирізаний заголовок — та сама маска, що в hero
const knockout = "[mask-image:url(/hero/name-knockout.svg)] [mask-size:100%_100%] [mask-repeat:no-repeat]";

// Іконки: 120 px, проміжок 64 px, рядок по центру над заголовком
const ICON = 120;
const ICONS_Y = 400;

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const onShown = useCallback((v: boolean) => setShown(v), []);
  useContactReveal(sectionRef, onShown);
  const items = contact.icons.map((id) => contacts.find((c) => c.id === id)!);

  return (
    <section
      ref={sectionRef}
      id="contact"
      aria-labelledby="contact-heading"
      data-nav-theme="light"
      className="relative h-svh overflow-hidden bg-cream [--spacing:var(--u)] [--u:var(--s)] max-md:[--u:calc(var(--page-w,100vw)/1920)]"
    >
      <h2 id="contact-heading" className="sr-only">
        {contact.heading}
      </h2>

      <div className="absolute top-1/2 left-1/2 h-1080 w-1920 -translate-x-1/2 -translate-y-1/2 max-md:top-auto max-md:bottom-[24px] max-md:translate-y-0">
        {/* Іконки контактів */}
        <ul
          className="absolute left-1/2 flex -translate-x-1/2 gap-64 text-pink max-md:-translate-y-[40px] max-md:gap-[20px]"
          style={{ top: u(ICONS_Y) }}
        >
          {items.map((c) => (
            <li key={c.id} data-contact="icon" className="opacity-0">
              <a
                href={c.href}
                aria-label={c.label}
                {...(c.href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
                className="block outline-none transition-[transform,color] duration-300 ease-out hover:-translate-y-12 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-ink max-md:size-[48px]!"
                style={{ width: u(ICON), height: u(ICON) }}
              >
                {shown && (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="size-full"
                    dangerouslySetInnerHTML={{ __html: contactIcons[c.id] }}
                  />
                )}
              </a>
            </li>
          ))}
        </ul>

        {/* Заголовок із hero: DESIGNER і OF VISUAL SENSES з вирізом під ім'я, зверху ім'я */}
        <div aria-hidden="true" className="pointer-events-none absolute" style={areaStyle}>
          <svg viewBox={viewBox} preserveAspectRatio="none" className={`absolute inset-0 size-full ${knockout}`}>
            <g data-contact="designer" className="fill-pink opacity-0">
              {designerGlyphs.map((g, i) => (
                <path key={i} d={g.d} />
              ))}
            </g>
            <g data-contact="senses" className="fill-lemon stroke-ink-warm opacity-0" strokeWidth={1}>
              {sensesGlyphs.map((g, i) => (
                <path key={i} d={g.d} />
              ))}
            </g>
          </svg>
          <svg viewBox={viewBox} preserveAspectRatio="none" className="absolute inset-0 size-full">
            <g data-contact="name" className="fill-ink-warm opacity-0">
              {nameGlyphs.map((g, i) => (
                <path key={i} d={g.d} />
              ))}
            </g>
          </svg>
        </div>
      </div>
      <noscript>
        <style>{`[data-contact]{opacity:1!important}`}</style>
      </noscript>
    </section>
  );
}
