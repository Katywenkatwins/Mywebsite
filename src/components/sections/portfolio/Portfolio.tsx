"use client";

/*
 * Секція Portfolio (кейси). Figma: «Look & Feel 13» (node 12364:229), 1920×1080, тло --color-night.
 * Посередині — галерея кейсів FlexCarousel (WebGL, ogl): обкладинки з назвою кейсу під ними.
 * Сцена прилипає, лише коли секція повністю в екрані; тоді ж з'являється галерея, і скрол гортає кейси (portfolio.motion.ts).
 * Клік по обкладинці відкриває кейс — під ним з'являється кнопка «Open project»: поки на Behance (content/portfolio.ts → link),
 * без посилання — на сторінку кейса /portfolio/<slug>.
 * Унизу праворуч — тарганка з намистом (фраза на наведенні).
 */

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { portfolio } from "@/content/portfolio";
import { RoachNote } from "@/components/ui/RoachNote";
import { BlotButton } from "@/components/ui/BlotButton";
import type { FlexCarouselApi } from "@/components/effects/FlexCarousel";
import { caseLink, covers } from "./covers";
import { sectionScreens, usePortfolioScroll } from "./portfolio.motion";
import roachBeads from "@/assets/portfolio/roach-beads.png";

// WebGL-галерея — лише в браузері й окремим шматком
const FlexCarousel = dynamic(() => import("@/components/effects/FlexCarousel"), { ssr: false });

const items = portfolio.cases.map((c) => ({ src: covers[c.image].src, title: c.title, alt: portfolio.coverAlt(c.title) }));
const count = portfolio.cases.length;

// Тарганка в Figma: 156.465×235.8 на (1720, 811)
const ROACH = { x: 1720, y: 811, w: 156.465, h: 235.8 };

export function Portfolio() {
  const sectionRef = useRef<HTMLElement>(null);
  const apiRef = useRef<FlexCarouselApi | null>(null);
  const arrived = usePortfolioScroll(sectionRef, count, apiRef);
  // відкритий кейс (клік по обкладинці) — під ним кнопка «Open project»
  const [opened, setOpened] = useState<number | null>(null);
  const openedCase = opened === null ? null : portfolio.cases[opened];
  // браузер без WebGL — замість галереї прості обкладинки з посиланнями
  const [noWebgl, setNoWebgl] = useState(false);

  return (
    <section
      ref={sectionRef}
      id="portfolio"
      aria-labelledby="portfolio-heading"
      data-nav-theme="dark"
      className="relative bg-night text-cream"
      style={{ height: `${sectionScreens(count) * 100}svh` }}
    >
      <h2 id="portfolio-heading" className="sr-only">
        {portfolio.heading}
      </h2>
      {/* для скрінрідера й клавіатури — прямі посилання на кейси */}
      <ul className="sr-only">
        {portfolio.cases.map((c) => (
          <li key={c.slug}>
            <a {...caseLink(c)}>{c.title}</a>
          </li>
        ))}
      </ul>

      <div className="sticky top-0 h-svh overflow-hidden [--spacing:var(--u)] [--u:var(--s)] max-md:[--u:calc(var(--page-w,100vw)/1920)]">
        <div className="absolute inset-0" aria-label={portfolio.galleryLabel} role="group">
          {arrived && noWebgl && (
            <ul className="flex size-full items-center justify-center gap-24 px-120">
              {portfolio.cases.map((c) => (
                <li key={c.slug} className="w-360">
                  <a {...caseLink(c)} className="block text-center">
                    <Image src={covers[c.image]} alt={portfolio.coverAlt(c.title)} sizes="20vw" className="h-auto w-full" />
                    <span className="mt-12 block text-u-15">{c.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {arrived && !noWebgl && (
            <FlexCarousel
              onUnsupported={() => setNoWebgl(true)}
              items={items}
              intro="rise"
              cardHeight={0.5}
              gap={24}
              captureWheel={false}
              apiRef={apiRef}
              onFocusChange={(open, index) => setOpened(open ? index : null)}
            />
          )}
        </div>

        {/* кнопка під відкритим кейсом */}
        <div
          className={`absolute bottom-120 left-1/2 z-20 -translate-x-1/2 transition-[opacity,translate] duration-500 ${
            openedCase ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-16 opacity-0"
          }`}
          aria-hidden={openedCase ? undefined : true}
        >
          <BlotButton
            variant="filled"
            {...caseLink(openedCase ?? portfolio.cases[0])}
            tabIndex={openedCase ? undefined : -1}
            className="px-18 py-12 text-u-14 uppercase tracking-[calc(-0.28*var(--u))] max-md:px-[14px] max-md:py-[10px] max-md:text-[12px]"
          >
            {portfolio.openProject}
            {openedCase && <span className="sr-only">: {openedCase.title}</span>}
          </BlotButton>
        </div>

        {/* тарганка — у правому нижньому куті сцени 1920×1080 */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-20 h-1080 w-1920 -translate-x-1/2 -translate-y-1/2">
          <RoachNote
            image={roachBeads}
            label={portfolio.roach.label}
            message={portfolio.roach.message}
            revealAttr={{ "data-portfolio": "roach" }}
            className="pointer-events-auto"
            style={{
              left: `calc(${ROACH.x} * var(--u))`,
              top: `calc(${ROACH.y} * var(--u))`,
              width: `calc(${ROACH.w} * var(--u))`,
              height: `calc(${ROACH.h} * var(--u))`,
            }}
            noteClassName="w-220"
            noteStyle={{ left: `calc(${ROACH.x - 236} * var(--u))`, top: `calc(${ROACH.y + 30} * var(--u))` }}
          />
        </div>
      </div>
    </section>
  );
}
