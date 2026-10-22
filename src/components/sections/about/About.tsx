"use client";

/*
 * Секція About. Figma: «Look & Feel 12» (node 12361:167), 1920×1080, тло --color-night.
 * Шари: жовтий текст з підсвіткою (LuminousText, контури Coolvetica з lettering.ts) → бейдж на шнурку (Lanyard, three.js;
 * у Figma на цьому місці картинка-бейдж) → тарган із німбом після тексту (фраза на наведенні) → іконки контактів унизу праворуч.
 * Поява — about.motion.ts. Усередині сцени --u = --s (1920×1080 вписується в екран).
 */

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { about } from "@/content/about";
import { contacts } from "@/content/site";
import { LuminousText, type LuminousHandle } from "@/components/effects/LuminousText";
import { RoachNote } from "@/components/ui/RoachNote";
import { aboutBox, aboutGlyphs, aboutLastLineEnd } from "./lettering";
import { contactIcons } from "./contact-icons";
import { SCREENS, useAboutReveal } from "./about.motion";
import roachHalo from "@/assets/about/roach-halo.png";

// three.js важкий — вантажимо бейдж лише в браузері й окремим шматком
const Badge = dynamic(() => import("./Badge"), { ssr: false });

// Тарган у Figma: 133×145, за 14 px після кінця останнього рядка, низ — по низу тексту
const ROACH = { w: 133, h: 145, gap: 14 };
const roachX = aboutLastLineEnd.x + ROACH.gap;
const roachY = aboutLastLineEnd.bottom - ROACH.h;

export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const lightRef = useRef<LuminousHandle>(null);
  const [shown, setShown] = useState(false);
  const onShown = useCallback((v: boolean) => setShown(v), []);
  useAboutReveal(sectionRef, lightRef, onShown);

  return (
    <section
      ref={sectionRef}
      id="about"
      aria-labelledby="about-heading"
      data-nav-theme="dark"
      className="relative bg-night"
      style={{ height: `${SCREENS * 100}svh` }}
    >
      <h2 id="about-heading" className="sr-only">
        About
      </h2>
      <p className="sr-only">{about.statement}</p>

      <div className="sticky top-0 h-svh overflow-hidden [--spacing:var(--u)] [--u:var(--s)] max-md:[--u:calc(var(--page-w,100vw)/1920)]">
        {/* Сцена 1920×1080 по центру екрана: текст і тарган */}
        <div className="absolute top-1/2 left-1/2 h-1080 w-1920 -translate-x-1/2 -translate-y-1/2">
          <LuminousText
            ref={lightRef}
            glyphs={aboutGlyphs}
            box={aboutBox}
            colorVar="--color-lemon"
            tintVar="--color-pink"
            className="absolute inset-0 size-full"
          />
        </div>

        {/* Бейдж на шнурку — на весь екран, щоб шнурок ішов від верхнього краю і бейдж міг гойдатися */}
        <div className="absolute inset-0 z-10" role="img" aria-label={about.badge.label}>
          <Badge />
        </div>

        <div className="pointer-events-none absolute top-1/2 left-1/2 z-20 h-1080 w-1920 -translate-x-1/2 -translate-y-1/2">
          <RoachNote
            image={roachHalo}
            label={about.roach.label}
            message={about.roach.message}
            revealAttr={{ "data-about": "roach" }}
            className="pointer-events-auto"
            style={{ left: `calc(${roachX} * var(--u))`, top: `calc(${roachY} * var(--u))`, width: `calc(${ROACH.w} * var(--u))`, height: `calc(${ROACH.h} * var(--u))` }}
            noteClassName="w-200"
            noteStyle={{ left: `calc(${roachX + ROACH.w + 12} * var(--u))`, top: `calc(${roachY + 40} * var(--u))` }}
          />
        </div>

        {/* Іконки контактів — унизу праворуч (як у Figma: 48 px, проміжок 22 px). Малюються при появі секції */}
        <ul
          data-about="icons"
          className="absolute right-30 bottom-30 z-20 flex gap-22 text-cream opacity-0 max-md:right-[16px] max-md:bottom-[16px] max-md:gap-[12px]"
        >
          {about.contactIcons.map((id) => contacts.find((c) => c.id === id)!).map((c) => (
            <li key={c.id}>
              <a
                href={c.href}
                aria-label={c.label}
                {...(c.href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
                className="block size-48 outline-none focus-visible:outline-2 focus-visible:outline-cream max-md:size-[28px]">
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
      </div>
    </section>
  );
}
