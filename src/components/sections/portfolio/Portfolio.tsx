"use client";

/*
 * Секція Portfolio (кейси). Figma: «Look & Feel 13» (node 12364:229), 1920×1080, тло --color-night.
 * Посередині — галерея кейсів FlexCarousel (WebGL, ogl): обкладинки з назвою кейсу під ними.
 * Унизу праворуч — тарганка з намистом (фраза на наведенні). Поява таргана — коли секція повністю в екрані.
 * Колесо миші галерея не перехоплює (інакше сторінка застрягала б): гортають перетягуванням, стрілками, кліком.
 */

import { useRef } from "react";
import dynamic from "next/dynamic";
import type { StaticImageData } from "next/image";
import { portfolio } from "@/content/portfolio";
import { RoachNote } from "@/components/ui/RoachNote";
import { useRoachReveal } from "./portfolio.motion";
import roachBeads from "@/assets/portfolio/roach-beads.png";
import sixSenses from "@/assets/portfolio/6-senses.webp";
import bossBeauties from "@/assets/portfolio/boss-beauties.webp";
import cloudStone from "@/assets/portfolio/cloud-stone-studio.webp";
import laurenMartin from "@/assets/portfolio/lauren-martin-studio.webp";

// WebGL-галерея — лише в браузері й окремим шматком
const FlexCarousel = dynamic(() => import("@/components/effects/FlexCarousel"), { ssr: false });

const covers: Record<string, StaticImageData> = {
  "6-senses": sixSenses,
  "boss-beauties": bossBeauties,
  "cloud-stone-studio": cloudStone,
  "lauren-martin-studio": laurenMartin,
};
const items = portfolio.cases.map((c) => ({ src: covers[c.image].src, title: c.title, alt: portfolio.coverAlt(c.title) }));

// Тарганка в Figma: 156.465×235.8 на (1720, 811)
const ROACH = { x: 1720, y: 811, w: 156.465, h: 235.8 };

export function Portfolio() {
  const sectionRef = useRef<HTMLElement>(null);
  useRoachReveal(sectionRef);

  return (
    <section
      ref={sectionRef}
      id="portfolio"
      aria-labelledby="portfolio-heading"
      data-nav-theme="dark"
      className="relative h-svh overflow-hidden bg-night text-cream [--spacing:var(--u)] [--u:var(--s)] max-md:[--u:calc(var(--page-w,100vw)/1920)]"
    >
      <h2 id="portfolio-heading" className="sr-only">
        {portfolio.heading}
      </h2>
      <ul className="sr-only">
        {portfolio.cases.map((c) => (
          <li key={c.image}>{c.title}</li>
        ))}
      </ul>

      <div className="absolute inset-0" aria-label={portfolio.galleryLabel} role="group">
        <FlexCarousel items={items} intro="rise" cardHeight={0.5} gap={24} captureWheel={false} />
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
    </section>
  );
}
