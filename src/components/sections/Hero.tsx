"use client";

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { hero } from "@/content/hero";
import { navigation } from "@/content/site";
import { playHeroReveal } from "./hero.motion";

import photo from "@/assets/hero/photo.png";
import photoCutout from "@/assets/hero/photo-cutout.png";
import designer from "@/assets/hero/designer.png";
import ofVisualSenses from "@/assets/hero/of-visual-senses.png";
import roach from "@/assets/hero/roach.png";
import stipple from "@/assets/hero/stipple.png";

gsap.registerPlugin(useGSAP);

/*
 * Figma: «Look & Feel 8» (node 6373:2521), 1920×1080.
 * Усі числа нижче — пікселі макета. Усередині hero одиниця --u = --s,
 * тобто сцена вписується в екран цілком.
 */
const u = (n: number) => `calc(${n} * var(--u))`;

/** Абсолютна позиція шару в пікселях макета */
const box = (left: number, top: number, width?: number, height?: number): CSSProperties => ({
  left: u(left),
  top: u(top),
  ...(width !== undefined && { width: u(width) }),
  ...(height !== undefined && { height: u(height) }),
});

// Повноекранні фото: тягнуться на весь екран і зберігають пропорцію (як у Figma на 16:9)
const fullBleed = "pointer-events-none absolute inset-0 size-full object-cover select-none";

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      const video = videoRef.current;
      if (!el || !video) return;

      let revealed = false;
      const reveal = (instant: boolean) => {
        if (revealed) return;
        revealed = true;
        playHeroReveal(el, { instant });
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
      // Жоден формат не підійшов або файл не завантажився
      const onSourceError = () => {
        if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) reveal(false);
      };
      const sources = Array.from(video.querySelectorAll("source"));

      video.addEventListener("ended", onEnded);
      video.addEventListener("playing", onPlaying);
      video.addEventListener("error", onEnded);
      sources.forEach((s) => s.addEventListener("error", onSourceError));

      // Автовідтворення заблоковане (режим енергозбереження тощо) — одразу фінал
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
        <div data-reveal="designer" className="absolute opacity-0" style={box(14, 95.68, 1412.489, 245.943)}>
          <Image src={designer} alt="" className="block size-full" />
        </div>

        <div data-reveal="senses" className="absolute opacity-0" style={box(1448.57, 107.76, 292.0, 226.8)}>
          <Image src={ofVisualSenses} alt="" className="block size-full" />
        </div>

        <p
          data-reveal="name"
          className="absolute font-script leading-[normal] whitespace-nowrap text-ink-warm opacity-0"
          style={{ ...box(32.48, 205.66), fontSize: u(289.073) }}
        >
          {hero.name}
        </p>

        <div data-reveal="roach" className="absolute opacity-0" style={box(693, 201, 93.757, 101.459)}>
          <Image src={roach} alt="" className="block size-full" />
        </div>
      </div>

      {/* 4. Ти — над написами (вирізана фігура з того ж фото) */}
      <Image
        src={photoCutout}
        alt=""
        sizes="100vw"
        data-reveal="cutout"
        className={`${fullBleed} opacity-0`}
      />

      {/* 5. Крапкова фактура поверх усього */}
      <Image src={stipple} alt="" sizes="100vw" className={fullBleed} />

      {/* 6. Навігація по кутах */}
      <header className="text-u-20 tracking-[calc(-0.4*var(--u))] absolute inset-x-0 top-30 flex items-start justify-between px-30 leading-[normal] text-ink uppercase max-md:top-[16px] max-md:px-[16px] max-md:text-[12px] max-md:tracking-[-0.02em]">
        <a data-reveal="nav" href="#top" className="opacity-0 transition-opacity hover:opacity-60 focus-visible:opacity-100">
          {hero.signature}
        </a>
        <nav aria-label="Головне меню">
          <ul className="flex flex-col items-end gap-10 max-md:gap-[8px]">
            {navigation.map((item) => (
              <li key={item.id} data-reveal="nav" className="opacity-0 focus-within:opacity-100">
                <a href={`#${item.id}`} className="transition-opacity hover:opacity-60">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Дзеркальне меню внизу — декоративний повтор для миші, скрінрідер його пропускає */}
      <div
        aria-hidden="true"
        className="text-u-20 tracking-[calc(-0.4*var(--u))] absolute inset-x-0 bottom-30 flex items-end justify-between px-30 leading-[normal] text-ink uppercase max-md:hidden"
      >
        <ul className="flex flex-col items-start gap-10">
          {navigation.map((item) => (
            <li key={item.id} data-reveal="nav" className="opacity-0">
              <a href={`#${item.id}`} tabIndex={-1} className="transition-opacity hover:opacity-60">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <p data-reveal="nav" className="opacity-0">
          {hero.signature}
        </p>
      </div>

      <noscript>
        <style>{`[data-reveal]{opacity:1!important}[data-hero-video]{display:none}`}</style>
      </noscript>
      <style>{`@media (prefers-reduced-motion: reduce){[data-reveal]{opacity:1!important}}`}</style>
    </section>
  );
}
