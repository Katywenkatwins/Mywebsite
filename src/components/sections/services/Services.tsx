"use client";

/*
 * Секція Services. Figma: «Look & Feel 14» (node 12364:282), 1920×1080, тло --color-night — орієнтовний макет:
 * у ньому 3 картки, у нас 5, тож картки розкладені віялом (центральна рівно, крайні — з нахилом і нижче).
 * Картка — як у Molecula: кремовий аркуш у рожеву лінійку, заголовок DM Mono, ціна — рожеві контури Coolvetica з нахилом.
 * Наведення: картка виходить наперед, вирівнюється й трохи піднімається.
 * Поява — коли секція повністю в екрані (services.motion.ts). На мобільному — ряд карток, що гортається вбік.
 */

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import { services, type Service } from "@/content/services";
import { servicesHeading, priceGlyphs } from "./lettering";
import { useServicesReveal } from "./services.motion";
import roachWheel from "@/assets/services/roach-wheel.png";

const u = (n: number) => `calc(${n} * var(--u))`;

// Картка в Figma: 366×387
const CARD = { w: 366, h: 387 };
// Віяло з 5 карток: центр картки по x, по y і нахил (центральна — як у Figma, (938, 437.5))
const fan = (i: number, n: number) => {
  const d = i - (n - 1) / 2;
  return { cx: 960 + d * 300, cy: 455 + d * d * 22, rot: d * 7 };
};
// найширша ціна, що вміщується праворуч від «Price:» (пікселі макета)
const PRICE_MAX = 170;
// Тарган за кермом у Figma: блок 251×251 на (808, 788)
const ROACH = { x: 808, y: 788, w: 251.116, h: 251.018 };

function Price({ card }: { card: Service }) {
  const g = priceGlyphs[card.price];
  if (!g) return null;
  // ширина ціни — не більше PRICE_MAX, інакше пропорційно зменшуємо
  const k = Math.min(1, PRICE_MAX / (g.w + 4));
  // ціна праворуч на картці, базова лінія ≈ y 350, нахил 3.7° як у Figma
  return (
    <div className="absolute right-41 top-286 flex flex-col items-end">
      <div className="flex items-end gap-10">
        {card.from && (
          <span className="mb-6 text-u-16 leading-[calc(20*var(--u))] lowercase">{services.fromLabel}</span>
        )}
        <svg
          aria-hidden="true"
          viewBox={`-2 -46 ${g.w + 4} 60`}
          className="block rotate-[3.7deg] overflow-visible fill-pink"
          style={{ width: u((g.w + 4) * k), height: u(60 * k) }}
        >
          <path d={g.d} />
        </svg>
      </div>
      {card.per && <span className="mt-2 text-u-14 leading-[calc(18*var(--u))] lowercase">{card.per}</span>}
    </div>
  );
}

function Card({ card }: { card: Service }) {
  return (
    <article className="relative size-full rounded-[calc(20*var(--u))] bg-cream text-ink shadow-[0_14px_34px_-10px_rgba(0,0,0,0.45)]">
      {/* лінійки: 12 ліній по 2 px через кожні 30 px, перша на y = 29 (як у Figma) */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          left: u(51),
          top: u(28),
          width: u(264),
          height: u(332),
          backgroundImage: `repeating-linear-gradient(to bottom, var(--color-pink) 0 ${u(2)}, transparent ${u(2)} ${u(30)})`,
        }}
      />
      <h3 className="absolute left-51 top-29 w-218 text-u-30 font-medium uppercase leading-[calc(30*var(--u))] tracking-[calc(-0.6*var(--u))]">
        {card.title}
      </h3>
      <p className="absolute left-51 top-119 w-264 text-u-15 leading-[calc(30*var(--u))]">{card.text}</p>
      <p className="absolute left-51 top-298 text-u-16 font-semibold leading-[calc(30*var(--u))]">{services.priceLabel}</p>
      <p className="sr-only">
        {card.from ? `${services.fromLabel} ` : ""}
        {card.price}
        {card.per ? ` ${card.per}` : ""}
      </p>
      <div aria-hidden="true">
        <Price card={card} />
      </div>
    </article>
  );
}

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  useServicesReveal(sectionRef);
  const n = services.cards.length;

  return (
    <section
      ref={sectionRef}
      id="services"
      aria-labelledby="services-heading"
      data-nav-theme="dark"
      className="relative h-svh overflow-hidden bg-night [--spacing:var(--u)] [--u:var(--s)] max-md:h-auto max-md:min-h-svh max-md:[--u:calc(var(--page-w,100vw)/420)]"
    >
      <h2 id="services-heading" className="sr-only">
        {services.heading}
      </h2>

      {/* Сцена 1920×1080 по центру екрана */}
      <div className="absolute top-1/2 left-1/2 h-1080 w-1920 -translate-x-1/2 -translate-y-1/2 max-md:static max-md:h-auto max-md:w-full max-md:translate-x-0 max-md:translate-y-0 max-md:pt-[96px] max-md:pb-[48px]">
        {/* SERVICES — контури Coolvetica 90 px (на мобільному — та сама літера, обрізана по заголовку) */}
        <div data-services="heading" className="pointer-events-none absolute inset-0 opacity-0 max-md:static">
          <svg
            aria-hidden="true"
            viewBox="0 0 1920 1080"
            className="pointer-events-none absolute inset-0 size-full fill-lemon max-md:hidden"
          >
            <path d={servicesHeading.d} />
          </svg>
          <svg aria-hidden="true" viewBox="30 102 360 81" className="ml-[16px] block w-[60vw] fill-lemon md:hidden">
            <path d={servicesHeading.d} />
          </svg>
        </div>

        <ul className="max-md:mt-[24px] max-md:flex max-md:snap-x max-md:snap-mandatory max-md:gap-[16px] max-md:overflow-x-auto max-md:px-[16px] max-md:pb-[16px]">
          {services.cards.map((card, i) => {
            const p = fan(i, n);
            return (
              <li
                key={card.title}
                data-services="card"
                data-dx={960 - p.cx}
                className="group absolute opacity-0 hover:z-10 max-md:relative max-md:top-auto! max-md:left-auto! max-md:shrink-0 max-md:snap-center"
                style={
                  {
                    left: u(p.cx - CARD.w / 2),
                    top: u(p.cy - CARD.h / 2),
                    width: u(CARD.w),
                    height: u(CARD.h),
                    "--r": `${p.rot}deg`,
                    zIndex: i < (n - 1) / 2 ? i : n - i,
                  } as CSSProperties
                }
              >
                {/* нахил віяла; на наведенні картка вирівнюється й піднімається */}
                <div className="size-full rotate-(--r) transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-30 group-hover:rotate-0 group-hover:scale-[1.04] max-md:rotate-0">
                  <Card card={card} />
                </div>
              </li>
            );
          })}
        </ul>

        {/* тарган за кермом — під віялом */}
        <Image
          data-services="roach"
          src={roachWheel}
          alt={services.roachLabel}
          sizes="15vw"
          className="pointer-events-none absolute opacity-0 max-md:hidden"
          style={{ left: u(ROACH.x), top: u(ROACH.y), width: u(ROACH.w), height: u(ROACH.h) }}
        />
      </div>
      <noscript>
        <style>{`[data-services]{opacity:1!important}`}</style>
      </noscript>
    </section>
  );
}
