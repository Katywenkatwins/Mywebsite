"use client";

/*
 * Секція Molecula. Figma: «Look & Feel 11» (node 12352:7619), 1920×1080; картка — node 12352:7662.
 * Шари: крейдове тло (ChalkField) → стопка карток (CardStack) → тарган із блокнотом → кнопка.
 * Картки гортаються скролом (сцена прилипає до екрана) або кліком/перетягуванням/клавішами — molecula.motion.ts.
 * Усі числа — пікселі макета; усередині сцени --u = --s (вписуємо 1920×1080 в екран).
 * Позиції рахуємо від центру екрана: left = 50% + (x − 960)·u, top = 50% + (y − 540)·u.
 */

import { useRef, type CSSProperties } from "react";
import { molecula, type MoleculaCard } from "@/content/molecula";
import { ChalkField } from "@/components/effects/ChalkField";
import { CardStack } from "@/components/ui/CardStack";
import { BlotButton } from "@/components/ui/BlotButton";
import { ContactDialog } from "@/components/ui/ContactDialog";
import { NotesRoach } from "./NotesRoach";
import { SCREENS_PER_CARD, useScrollSteps } from "./molecula.motion";

const u = (n: number) => `calc(${n} * var(--u))`;
const fromCenter = (x: number, y: number): CSSProperties => ({
  left: `calc(50% + ${u(x - 960)})`,
  top: `calc(50% + ${u(y - 540)})`,
});

// Картка в макеті: 628×387 на (623, 365)
const CARD = { x: 623, y: 365, w: 628, h: 387 };

// Колір картки й лінійок — по черзі карток (токени з globals.css)
const cardColors = [
  { bg: "bg-cream", text: "text-ink", rule: "var(--color-pink)" }, // як у макеті
  { bg: "bg-pink", text: "text-ink", rule: "var(--color-paper)" },
  { bg: "bg-lemon", text: "text-ink", rule: "var(--color-pink)" },
  { bg: "bg-chalk", text: "text-ink", rule: "var(--color-paper)" },
  { bg: "bg-paper", text: "text-ink", rule: "var(--color-pink)" },
  { bg: "bg-studio", text: "text-ink", rule: "var(--color-lemon)" },
];

function Card({ card, index }: { card: MoleculaCard; index: number }) {
  const c = cardColors[index % cardColors.length];
  return (
    <article className={`relative size-full ${c.bg} ${c.text}`}>
      {/* лінійки: 12 ліній по 2 px через кожні 30 px, перша на y = 29 */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          left: u(51),
          top: u(28),
          width: u(521),
          height: u(332),
          backgroundImage: `repeating-linear-gradient(to bottom, ${c.rule} 0 ${u(2)}, transparent ${u(2)} ${u(30)})`,
        }}
      />
      <h3 className="absolute left-51 top-25 text-u-30 font-medium uppercase leading-[calc(39*var(--u))] tracking-[calc(-0.6*var(--u))] whitespace-nowrap">
        {card.title}
      </h3>
      <p className="absolute left-51 top-119 w-412 text-u-20 leading-[calc(30*var(--u))]">
        <strong className="font-semibold">{card.leadBold}</strong> {card.lead}
      </p>
      {/* абзац тримається низу картки, щоб останній рядок лягав на останню лінійку */}
      <p className="absolute bottom-28 left-51 w-556 text-u-20 leading-[calc(30*var(--u))]">{card.body}</p>
    </article>
  );
}

export function Molecula() {
  const sectionRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const count = molecula.cards.length;
  const [step, request] = useScrollSteps(sectionRef, count);

  return (
    <section
      ref={sectionRef}
      id="molecula"
      aria-labelledby="molecula-heading"
      className="relative bg-ink"
      style={{ height: `calc(100svh + ${(count - 1) * SCREENS_PER_CARD * 100}svh)` }}
    >
      <h2 id="molecula-heading" className="sr-only">
        {molecula.heading}
      </h2>
      <div className="sticky top-0 h-svh overflow-hidden [--spacing:var(--u)] [--u:var(--s)] max-md:[--u:calc(var(--page-w,100vw)/700)]">
        <ChalkField className="absolute inset-0" />

        <div className="absolute" style={{ ...fromCenter(CARD.x, CARD.y), width: u(CARD.w), height: u(CARD.h) }}>
          <CardStack
            className="size-full"
            label={molecula.heading}
            cards={molecula.cards.map((card, i) => (
              <Card key={card.title} card={card} index={i} />
            ))}
            step={step}
            onRequest={request}
          />
          <p className="sr-only" aria-live="polite">
            {`${step + 1} / ${count}. ${molecula.hint}`}
          </p>

          {/* тарган — біля лівого нижнього кута картки */}
          <NotesRoach
            className="-left-153 top-235 h-255 w-189 max-md:top-300 max-md:left-470 max-md:h-204 max-md:w-151"
            noteClassName="-left-363 top-275 w-200 max-md:-top-150 max-md:left-300 max-md:w-380"
          />
        </div>

        <div className="absolute -translate-x-1/2" style={fromCenter(CARD.x + CARD.w / 2, 812)}>
          <BlotButton
            className="px-18 py-12 text-u-14 uppercase tracking-[calc(-0.28*var(--u))] max-md:px-[14px] max-md:py-[10px] max-md:text-[12px]"
            aria-haspopup="dialog"
            onClick={() => dialogRef.current?.showModal()}
          >
            {molecula.cta}
          </BlotButton>
        </div>
      </div>
      <ContactDialog ref={dialogRef} title={molecula.cta} />
    </section>
  );
}
