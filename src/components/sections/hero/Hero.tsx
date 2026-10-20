"use client";

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { hero } from "@/content/hero";
import { navigation } from "@/content/site";
import { LetterSwap } from "@/components/ui/LetterSwap";
import { GlyphTech, type GlyphTechHandle } from "./GlyphTech";
import { designerBox, designerGlyphs, nameGlyphs, sensesBox, sensesGlyphs } from "./lettering";
import { playHeroReveal, SENSES_TYPE_SECONDS } from "./hero.motion";

import photo from "@/assets/hero/photo.png";
import photoCutout from "@/assets/hero/photo-cutout.png";
import roach from "@/assets/hero/roach.png";
import stipple from "@/assets/hero/stipple.png";


gsap.registerPlugin(useGSAP);

/*
 * Figma: «Look & Feel 8» (node 6373:2521), 1920×1080.
 * Усі числа — пікселі макета. Усередині hero одиниця --u = --s, тобто сцена вписується в екран цілком.
 * Шари знизу вгору: фото → відео → DESIGNER, OF VISUAL SENSES, ім'я → тарган → крапки → ти (вирізка)
 *                  → меню.
 */
const u = (n: number) => `calc(${n} * var(--u))`;
const box = (left: number, top: number, width?: number, height?: number): CSSProperties => ({
  left: u(left),
  top: u(top),
  ...(width !== undefined && { width: u(width) }),
  ...(height !== undefined && { height: u(height) }),
});

const fullBleed = "pointer-events-none absolute inset-0 size-full object-cover select-none";

// Маска появи імені: запас довкола літери і ширина м'якого краю (пікселі макета)
const nameWipePad = 4;
const nameWipeFeather = 60;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const designerRef = useRef<GlyphTechHandle>(null);
  const sensesRef = useRef<GlyphTechHandle>(null);

  useGSAP(
    () => {
      const el = root.current;
      const video = videoRef.current;
      if (!el || !video) return;

      let revealed = false;
      const reveal = (instant: boolean) => {
        if (revealed) return;
        revealed = true;
        playHeroReveal(el, { instant, designer: designerRef.current, senses: sensesRef.current });
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        video.pause();
        reveal(true);
        return;
      }
      if (video.ended) {
        reveal(false);
        return;
      }

      // Страховка: відео не стартувало за 5 с — показуємо фінал.
      // Коли стартувало — чекаємо до кінця ролика + 2,5 с на підвисання мережі.
      let fallback = window.setTimeout(() => reveal(false), 5000);
      const armFallback = (ms: number) => {
        window.clearTimeout(fallback);
        fallback = window.setTimeout(() => reveal(false), ms);
      };
      const onEnded = () => reveal(false);
      const onPlaying = () => {
        const left = Number.isFinite(video.duration) ? video.duration - video.currentTime : 5;
        armFallback(left * 1000 + 2500);
      };
      const onSourceError = () => {
        if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) reveal(false);
      };
      const sources = Array.from(video.querySelectorAll("source"));

      video.addEventListener("ended", onEnded);
      video.addEventListener("playing", onPlaying);
      video.addEventListener("error", onEnded);
      sources.forEach((s) => s.addEventListener("error", onSourceError));
      video.play().catch(() => reveal(false));

      return () => {
        video.removeEventListener("ended", onEnded);
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("error", onEnded);
        sources.forEach((s) => s.removeEventListener("error", onSourceError));
        window.clearTimeout(fallback);
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      className="relative h-svh overflow-hidden bg-studio [--spacing:var(--u)] [--u:var(--s)] max-md:[--u:calc(var(--page-w,100vw)/1920)]"
    >
      <h1 className="sr-only">{hero.headingForScreenReaders}</h1>

      {/* 1. Фото студії (фінальний кадр) */}
      <Image src={photo} alt="" priority sizes="100vw" className={fullBleed} />

      {/* 2. Відео-вступ: грає один раз поверх фото */}
      <video
        ref={videoRef}
        data-hero-video
        className={`${fullBleed} motion-reduce:hidden`}
        autoPlay
        muted
        playsInline
        preload="auto"
        poster="/hero/hero-poster.webp"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/hero/hero-1440.mp4" type="video/mp4" media="(min-width: 2000px)" />
        <source src="/hero/hero-1080.mp4" type="video/mp4" />
        <source src="/hero/hero-1080.webm" type="video/webm" />
      </video>

      {/* 3. Сцена 1920×1080 з написами, по центру екрана */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-1080 w-1920 -translate-x-1/2 -translate-y-1/2 select-none max-md:top-[19svh] max-md:translate-y-0"
      >
        {/* DESIGNER — полотно з ефектом наведення; ім'я вирізане маскою, як у Figma */}
        <GlyphTech
          ref={designerRef}
          glyphs={designerGlyphs}
          box={designerBox}
          fontSize={346.887}
          fillVar="--color-pink"
          dashVar="--color-pink"
          accentVar="--color-paper"
          accentShadow
          className="pointer-events-auto absolute touch-pan-y [mask-image:url(/hero/designer-knockout.svg)] [mask-size:100%_100%] [mask-repeat:no-repeat]"
          style={box(designerBox.x, designerBox.y, designerBox.w, designerBox.h)}
        />

        {/* OF VISUAL SENSES — той самий ефект: рожеві рамки з підписами */}
        <GlyphTech
          ref={sensesRef}
          glyphs={sensesGlyphs}
          box={sensesBox}
          fontSize={90}
          fillVar="--color-lemon"
          dashVar="--color-pink"
          accentVar="--color-pink"
          outlineVar="--color-ink-warm"
          outlineWidth={1}
          introDuration={SENSES_TYPE_SECONDS}
          className="pointer-events-auto absolute touch-pan-y [mask-image:url(/hero/senses-knockout.svg)] [mask-size:100%_100%] [mask-repeat:no-repeat]"
          style={box(sensesBox.x, sensesBox.y, sensesBox.w, sensesBox.h)}
        />

        <svg viewBox="0 0 1920 1080" className="absolute inset-0 size-full overflow-visible">
          {/* Kateryna Smiian — кожна літера проявляється маскою зліва направо (м'який край) */}
          <defs>
            <linearGradient id="hero-name-wipe">
              <stop offset="0.7" stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity={0} />
            </linearGradient>
            {nameGlyphs.map((g, i) => {
              const [x1, y1, x2, y2] = g.box;
              const x0 = x1 - nameWipePad;
              const w = x2 - x1 + nameWipePad * 2 + nameWipeFeather;
              return (
                <mask key={i} id={`hero-name-${i}`} maskUnits="userSpaceOnUse" x={x0} y={y1 - nameWipePad} width={w} height={y2 - y1 + nameWipePad * 2}>
                  <rect
                    data-name-wipe
                    data-x0={x0}
                    x={x0}
                    y={y1 - nameWipePad}
                    width={w}
                    height={y2 - y1 + nameWipePad * 2}
                    fill="url(#hero-name-wipe)"
                    transform={`matrix(0 0 0 1 ${x0} 0)`}
                  />
                </mask>
              );
            })}
          </defs>
          <g data-reveal="name" className="fill-ink-warm opacity-0">
            {nameGlyphs.map((g, i) => (
              <path key={i} d={g.d} mask={`url(#hero-name-${i})`} />
            ))}
          </g>
        </svg>

        <div data-reveal="roach" className="absolute opacity-0" style={box(693, 201, 93.757, 101.459)}>
          <Image src={roach} alt="" className="block size-full" />
        </div>
      </div>

      {/* 4. Крапкова фактура — під тобою, щоб крапки не лягали на тебе */}
      <Image src={stipple} alt="" sizes="100vw" className={fullBleed} />

      {/* 5. Ти — над написами й фактурою (вирізана фігура з того ж фото) */}
      <Image src={photoCutout} alt="" sizes="100vw" data-reveal="cutout" className={`${fullBleed} opacity-0`} />

      {/* 6. Навігація по кутах. Самі блоки меню «прозорі» для миші (інакше вони накривали б OF і верх DESIGNER), клікаються лише посилання */}
      <header className="pointer-events-none text-u-20 tracking-[calc(-0.4*var(--u))] absolute inset-x-0 top-30 flex items-start justify-between px-30 leading-[normal] text-ink uppercase max-md:top-[16px] max-md:px-[16px] max-md:text-[12px] max-md:tracking-[-0.02em]">
        <a data-reveal="nav" href="#top" className="letter-swap-trigger pointer-events-auto opacity-0">
          <LetterSwap text={hero.signature} />
        </a>
        <nav aria-label="Головне меню">
          <ul className="flex flex-col items-end gap-10 max-md:gap-[8px]">
            {navigation.map((item) => (
              <li key={item.id} data-reveal="nav" className="opacity-0 focus-within:opacity-100">
                <a href={`#${item.id}`} className="letter-swap-trigger pointer-events-auto">
                  <LetterSwap text={item.label} />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Дзеркальне меню внизу — декоративний повтор для миші, скрінрідер його пропускає */}
      <div
        aria-hidden="true"
        className="pointer-events-none text-u-20 tracking-[calc(-0.4*var(--u))] absolute inset-x-0 bottom-30 flex items-end justify-between px-30 leading-[normal] text-ink uppercase max-md:hidden"
      >
        <ul className="flex flex-col items-start gap-10">
          {navigation.map((item) => (
            <li key={item.id} data-reveal="nav" className="opacity-0">
              <a href={`#${item.id}`} tabIndex={-1} className="letter-swap-trigger pointer-events-auto">
                <LetterSwap text={item.label} />
              </a>
            </li>
          ))}
        </ul>
        <p data-reveal="nav" className="opacity-0">
          {hero.signature}
        </p>
      </div>

      <noscript>
        <style>{`[data-reveal]{opacity:1!important}[data-name-wipe]{transform:none}[data-hero-video]{display:none}`}</style>
      </noscript>
    </section>
  );
}
