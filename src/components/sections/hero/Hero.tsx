"use client";

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { hero } from "@/content/hero";
import { LetterSwap } from "@/components/ui/LetterSwap";
import { PixelButton } from "@/components/ui/PixelButton";
import { GlyphTech, type GlyphTechHandle } from "./GlyphTech";
import { Frida, type FridaHandle } from "./Frida";
import { designerGlyphs, introArea, introBox, introGlyphs, letteringArea, nameGlyphs, sensesGlyphs } from "./lettering";
import { INTRO_TYPE_SECONDS, playHeroReveal, SENSES_TYPE_SECONDS } from "./hero.motion";

import photo from "@/assets/hero/photo.png";
import photoCutout from "@/assets/hero/photo-cutout.png";
import stipple from "@/assets/hero/stipple.png";


gsap.registerPlugin(useGSAP);

/*
 * Figma: «Look & Feel 8» (node 6373:2521), 1920×1080.
 * Усі числа — пікселі макета. Усередині hero одиниця --u = --s, тобто сцена вписується в екран цілком.
 * Шари знизу вгору: фото → відео → DESIGNER, OF VISUAL SENSES, ім'я → тарган → крапки → ти (вирізка)
 *                  → меню → абзац і кнопки (правий нижній кут).
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
  const introRef = useRef<GlyphTechHandle>(null);
  const fridaRef = useRef<FridaHandle>(null);

  useGSAP(
    () => {
      const el = root.current;
      const video = videoRef.current;
      if (!el || !video) return;

      let revealed = false;
      const reveal = (instant: boolean) => {
        if (revealed) return;
        revealed = true;
        playHeroReveal(el, {
          instant,
          designer: designerRef.current,
          senses: sensesRef.current,
          intro: introRef.current,
          frida: fridaRef.current,
        });
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
      data-nav-theme="light"
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
        className="pointer-events-none absolute top-1/2 left-1/2 h-1080 w-1920 -translate-x-1/2 -translate-y-1/2 select-none max-md:top-[19svh] max-md:translate-y-0"
      >
        {/* DESIGNER — полотно з ефектом наведення; ім'я вирізане маскою, як у Figma */}
        <GlyphTech
          ref={designerRef}
          glyphs={designerGlyphs}
          box={letteringArea}
          fontSize={346.887}
          fillVar="--color-pink"
          dashVar="--color-pink"
          accentVar="--color-paper"
          accentShadow
          className="absolute [mask-image:url(/hero/name-knockout.svg)] [mask-size:100%_100%] [mask-repeat:no-repeat]"
          style={box(letteringArea.x, letteringArea.y, letteringArea.w, letteringArea.h)}
        />

        {/* OF VISUAL SENSES — той самий ефект: рожеві рамки з підписами */}
        <GlyphTech
          ref={sensesRef}
          glyphs={sensesGlyphs}
          box={letteringArea}
          fontSize={90}
          fillVar="--color-lemon"
          dashVar="--color-pink"
          accentVar="--color-pink"
          outlineVar="--color-ink-warm"
          outlineWidth={1}
          introDuration={SENSES_TYPE_SECONDS}
          className="absolute [mask-image:url(/hero/name-knockout.svg)] [mask-size:100%_100%] [mask-repeat:no-repeat]"
          style={box(letteringArea.x, letteringArea.y, letteringArea.w, letteringArea.h)}
        />

        <svg aria-hidden="true" viewBox="0 0 1920 1080" className="absolute inset-0 size-full overflow-visible">
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

        {/* Фріда: «Псс…» раз на кілька секунд, повідомлення на наведенні */}
        <Frida ref={fridaRef} />
      </div>

      {/* 4. Крапкова фактура — під тобою, щоб крапки не лягали на тебе */}
      <Image src={stipple} alt="" sizes="100vw" className={fullBleed} />

      {/* 5. Ти — над написами й фактурою (вирізана фігура з того ж фото) */}
      <Image src={photoCutout} alt="" sizes="100vw" data-reveal="cutout" className={`${fullBleed} opacity-0`} />

      {/* 6. Підпис угорі ліворуч. Меню, «get in touch» і мови закріплені в екрані на всьому сайті — layout/SiteChrome */}
      <header className="pointer-events-none text-u-14 tracking-[calc(-0.28*var(--u))] absolute top-30 left-30 leading-[normal] text-ink uppercase max-md:top-[16px] max-md:left-[16px] max-md:text-[11px] max-md:tracking-[-0.02em]">
        <a data-reveal="nav" href="#top" className="letter-swap-trigger pointer-events-auto opacity-0">
          <LetterSwap text={hero.signature} />
        </a>
      </header>

      {/* 7. Правий нижній кут: для кого і як допомагаю + дві кнопки */}
      <div className="absolute right-30 bottom-30 flex flex-col items-start gap-16 max-md:inset-x-[16px] max-md:bottom-[16px] max-md:items-stretch max-md:gap-[12px]">
        <p className="sr-only">{hero.intro}</p>
        {/* Абзац — контури DM Mono з ефектом TechText; полотно ширше за абзац, щоб влізли рамки й підписи */}
        <div
          aria-hidden="true"
          className="relative max-md:!w-full"
          style={{ width: u(introBox.w), aspectRatio: `${introBox.w} / ${introBox.h}` }}
        >
          <GlyphTech
            ref={introRef}
            glyphs={introGlyphs}
            box={introArea}
            fontSize={14}
            fillVar="--color-ink"
            dashVar="--color-pink"
            accentVar="--color-pink"
            introDuration={INTRO_TYPE_SECONDS}
            hover="block"
            className="absolute"
            style={{
              left: `${(introArea.x / introBox.w) * 100}%`,
              top: `${(introArea.y / introBox.h) * 100}%`,
              width: `${(introArea.w / introBox.w) * 100}%`,
              height: `${(introArea.h / introBox.h) * 100}%`,
            }}
          />
        </div>
        <div className="text-u-14 tracking-[calc(-0.28*var(--u))] flex gap-8 leading-[normal] uppercase max-md:gap-[8px] max-md:text-[12px] max-md:tracking-[-0.02em]">
          <PixelButton
            data-reveal="nav"
            href={hero.primaryCta.href}
            variant="primary"
            className="px-18 py-12 opacity-0 max-md:flex-1 max-md:px-[12px] max-md:py-[10px]"
          >
            {hero.primaryCta.label}
          </PixelButton>
          <PixelButton
            data-reveal="nav"
            href={hero.secondaryCta.href}
            variant="secondary"
            className="px-18 py-12 opacity-0 max-md:flex-1 max-md:px-[12px] max-md:py-[10px]"
          >
            {hero.secondaryCta.label}
          </PixelButton>
        </div>
      </div>

      <noscript>
        <style>{`[data-reveal]{opacity:1!important}[data-name-wipe]{transform:none}[data-hero-video]{display:none}`}</style>
      </noscript>
    </section>
  );
}
