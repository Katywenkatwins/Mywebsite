"use client";

/*
 * Секція Services. Figma: «Look & Feel 14» (node 12364:282), 1920×1080, тло --color-night — орієнтовний макет:
 * у ньому 3 картки, у нас 5, тож картки розкладені віялом (центральна рівно, крайні — з нахилом і нижче).
 * Картка — як у Molecula: кремовий аркуш у рожеву лінійку, заголовок DM Mono, ціна — рожеві контури Coolvetica з нахилом.
 * Клік по картці обирає її: картка піднімається над іншими, вирівнюється й підсвічується жовтою рамкою;
 * кнопка під віялом відкриває вікно зв'язку з уже обраною послугою (openContact(title)).
 * Наведення: картка лише трохи піднімається. Тарган за кермом — фраза на наведенні (RoachNote).
 * Поява — коли секція повністю в екрані (services.motion.ts). На мобільному — ряд карток, що гортається вбік.
 */

import { useRef, useState, type CSSProperties } from "react";
import { services, type Service } from "@/content/services";
import { servicesHeading, priceGlyphs } from "./lettering";
import { useServicesReveal } from "./services.motion";
import { BlotButton } from "@/components/ui/BlotButton";
import { openContact } from "@/components/ui/ContactDialog";
import { RoachNote } from "@/components/ui/RoachNote";
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
// Кнопка — між віялом і тарганом, по центру сцени (низ центральної картки ≈ 648)
const CTA_Y = 712;

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
  const [active, setActive] = useState<number | null>(null);

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

        <ul aria-label={services.heading} className="max-md:mt-[24px] max-md:flex max-md:snap-x max-md:snap-mandatory max-md:gap-[16px] max-md:overflow-x-auto max-md:px-[16px] max-md:pb-[16px]">
          {services.cards.map((card, i) => {
            const p = fan(i, n);
            const on = active === i;
            return (
              <li
                key={card.title}
                data-services="card"
                data-dx={960 - p.cx}
                data-active={on}
                className="group absolute opacity-0 hover:z-10 data-[active=true]:z-20! max-md:relative max-md:py-[12px] max-md:top-auto! max-md:left-auto! max-md:shrink-0 max-md:snap-center"
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
                {/* нахил віяла; на наведенні картка трохи піднімається, обрана — вирівнюється, виходить наперед і світиться */}
                <div className="size-full rotate-(--r) rounded-[calc(20*var(--u))] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-16 group-data-[active=true]:-translate-y-40 group-data-[active=true]:rotate-0 group-data-[active=true]:scale-[1.06] group-data-[active=true]:shadow-[0_0_0_calc(5*var(--u))_var(--color-lemon),0_0_calc(40*var(--u))_calc(6*var(--u))_color-mix(in_srgb,var(--color-lemon)_45%,transparent)] max-md:rotate-0 max-md:group-data-[active=true]:translate-y-0 max-md:group-data-[active=true]:scale-100">
                  <Card card={card} />
                </div>
                {/* уся картка — кнопка вибору */}
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={services.choose(card.title)}
                  onClick={() => setActive(on ? null : i)}
                  className="absolute inset-0 cursor-pointer rounded-[calc(20*var(--u))] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lemon"
                />
              </li>
            );
          })}
        </ul>

        {/* кнопка під віялом: відкриває вікно зв'язку з обраною послугою */}
        <div
          data-services="cta"
          className="absolute z-30 -translate-x-1/2 opacity-0 max-md:static max-md:mt-[8px] max-md:flex max-md:translate-x-0 max-md:justify-center"
          style={{ left: u(960), top: u(CTA_Y) }}
        >
          <BlotButton
            variant="filled"
            aria-haspopup="dialog"
            onClick={() => openContact(active === null ? undefined : services.cards[active].title)}
            className="px-18 py-12 text-u-14 uppercase tracking-[calc(-0.28*var(--u))] max-md:px-[14px] max-md:py-[10px] max-md:text-[12px]"
          >
            {services.cta}
            {active !== null && <span className="sr-only">: {services.cards[active].title}</span>}
          </BlotButton>
        </div>

        {/* тарган за кермом — під кнопкою, фраза на наведенні */}
        <RoachNote
          image={roachWheel}
          label={services.roachLabel}
          message={services.roachMessage}
          revealAttr={{ "data-services": "roach" }}
          className="max-md:hidden"
          style={{ left: u(ROACH.x), top: u(ROACH.y), width: u(ROACH.w), height: u(ROACH.h) }}
          noteClassName="w-200 max-md:hidden"
          noteStyle={{ left: u(ROACH.x + ROACH.w + 12), top: u(ROACH.y + 70) }}
        />
      </div>
      <noscript>
        <style>{`[data-services]{opacity:1!important}`}</style>
      </noscript>
    </section>
  );
}
