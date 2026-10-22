"use client";

/*
 * Те, що закріплено в екрані на всьому сайті (Figma «Look & Feel 12», node 12361:167):
 *  - угорі ліворуч — підпис «kateryna smiian» (посилання нагору);
 *  - угорі праворуч — стовпчиком [ GET IN TOUCH] (відкриває вікно зв'язку), [ UA], [ EN];
 *  - внизу ліворуч — прогрес-бар і меню [MOLECULA     ].
 * Прогрес-бар: вертикальна лінія з крапками — верхня крапка для hero, далі по одній на кожен пункт меню.
 * Крапка й пункт меню активної секції — рожеві, довкола активної крапки рожеве світіння, яке переїжджає між крапками.
 * Колір кожного елемента — за тлом секції під ним: секція каже data-nav-theme="light" (темний) чи "dark" (кремовий).
 * У Molecula верх — сірий піксельний шов, тож світлим пункт стає, коли під ним уже чорне.
 * З'являється разом з меню hero (подія «chrome:show»). На мобільному поки лише правий верхній кут — меню переїде в бургер.
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { chrome, navigation } from "@/content/site";
import { BracketLabel } from "@/components/ui/BracketLabel";
import { LetterSwap } from "@/components/ui/LetterSwap";
import { ContactDialog, openContact } from "@/components/ui/ContactDialog";

const menuWidth = Math.max(...navigation.map((item) => item.label.length)) + 2;
// секції по порядку: hero + пункти меню (на них дивиться прогрес-бар)
const sectionIds = ["top", ...navigation.map((n) => n.id)];

const item =
  "pointer-events-auto opacity-0 transition-colors duration-300 focus-within:opacity-100 data-[theme=dark]:text-cream data-[theme=dark]:[text-shadow:0_0_3px_var(--color-ink),0_0_8px_var(--color-ink)]";
const trigger = "letter-swap-trigger inline-flex outline-none focus-visible:underline";
// рядок меню: 18 px висоти + 2 px проміжок = крок 20 px (у пікселях макета, при шрифті 14)
const ROW = 18;
const GAP = 2;
const PITCH = ROW + GAP;

export function SiteChrome() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // поява: hero каже «chrome:show», коли з'являється його меню; без hero — одразу
    const reveal = el.querySelectorAll<HTMLElement>('[data-reveal="chrome"]');
    const show = () => {
      const mode = document.documentElement.dataset.chrome;
      if (mode === "instant" || !document.getElementById("top")) {
        gsap.set(reveal, { opacity: 1 });
      } else {
        gsap.fromTo(
          reveal,
          { opacity: 0, yPercent: 60 },
          { opacity: 1, yPercent: 0, duration: 0.6, stagger: 0.04, ease: "power3.out" },
        );
      }
    };
    if (document.documentElement.dataset.chrome || !document.getElementById("top")) show();
    window.addEventListener("chrome:show", show);

    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-chrome-item]"));
    const steps = Array.from(el.querySelectorAll<HTMLElement>("[data-step]"));
    const glow = el.querySelector<HTMLElement>("[data-progress-glow]");
    let raf = 0;

    const themeAt = (y: number) => {
      for (const s of document.querySelectorAll<HTMLElement>("[data-nav-theme]")) {
        const r = s.getBoundingClientRect();
        if (y < r.top || y >= r.bottom) continue;
        let theme = s.dataset.navTheme ?? "light";
        const seam = s.querySelector<HTMLElement>("[data-seam]");
        if (seam && theme === "dark") {
          // поки шов ще сірий, верх секції світлий; що далі секція заїхала, то тонший світлий край
          const p = Math.min(1, Math.max(0, 1 - r.top / window.innerHeight));
          if (y < r.top + seam.offsetHeight * 0.85 * (1 - p)) theme = "light";
        }
        return theme;
      }
      return "light";
    };
    // активна секція — остання, чий верх уже вище середини екрана
    const activeIndex = () => {
      let active = 0;
      sectionIds.forEach((id, i) => {
        const s = document.getElementById(id);
        if (s && s.getBoundingClientRect().top <= window.innerHeight * 0.5) active = i;
      });
      return active;
    };
    const update = () => {
      raf = 0;
      for (const it of items) {
        const r = it.getBoundingClientRect();
        const theme = themeAt(r.top + r.height / 2);
        if (it.dataset.theme !== theme) it.dataset.theme = theme;
      }
      const active = activeIndex();
      steps.forEach((s) => {
        const on = Number(s.dataset.step) === active;
        if ((s.dataset.active === "true") !== on) s.dataset.active = String(on);
        if (on) s.setAttribute("aria-current", "true");
        else s.removeAttribute("aria-current");
      });
      if (glow) glow.style.setProperty("--step", String(active));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("chrome:show", show);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <>
      <div
        ref={root}
        className="pointer-events-none fixed inset-0 z-50 text-u-14 leading-[calc(18*var(--u))] tracking-[calc(-0.28*var(--u))] text-ink uppercase [--spacing:var(--u)] [--u:var(--s)] max-md:text-[11px] max-md:tracking-[-0.02em] max-md:[--u:calc(var(--page-w,100vw)/1920)]"
      >
        {/* Угорі ліворуч: підпис */}
        <a
          href="#top"
          data-chrome-item
          data-reveal="chrome"
          className={`${item} ${trigger} absolute top-30 left-30 max-md:top-[16px] max-md:left-[16px]`}
        >
          <LetterSwap text={chrome.signature} />
        </a>

        {/* Угорі праворуч: зв'язок і мови — стовпчиком, по правому краю */}
        <div className="absolute top-30 right-30 flex flex-col items-end gap-2 max-md:top-[16px] max-md:right-[16px] max-md:flex-row max-md:gap-[8px]">
          <button
            type="button"
            data-chrome-item
            data-reveal="chrome"
            aria-haspopup="dialog"
            onClick={openContact}
            className={`${item} ${trigger} uppercase`}
          >
            <BracketLabel label={chrome.contact} before={1} />
          </button>
          <ul aria-label={chrome.languagesLabel} className="contents">
            {chrome.languages.map((lang) => (
              <li key={lang.code} data-chrome-item data-reveal="chrome" className={item}>
                {lang.current ? (
                  <Link href="/" lang="en" aria-current="true" className={trigger}>
                    <span className="sr-only">{lang.name}</span>
                    <span aria-hidden="true" className="inline-flex">
                      <BracketLabel label={lang.code} before={1} />
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    aria-disabled="true"
                    title={`${lang.name} — ${chrome.soon}`}
                    className={`${trigger} uppercase`}
                  >
                    <span className="sr-only" lang="uk">{`${lang.name} (${chrome.soon})`}</span>
                    <span aria-hidden="true" className="inline-flex">
                      <BracketLabel label={lang.code} before={1} />
                    </span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Внизу ліворуч: прогрес-бар (x = 30) і меню (x = 48) */}
        <nav aria-label={chrome.menuLabel} className="absolute bottom-30 left-30 max-md:hidden">
          <div className="relative">
            {/* лінія від верхньої крапки до нижньої */}
            <span
              aria-hidden="true"
              data-chrome-item
              data-reveal="chrome"
              className="absolute left-[calc(4.5*var(--u))] w-px opacity-0 transition-colors duration-300 data-[theme=dark]:text-cream"
              style={{ top: `calc(${ROW / 2} * var(--u))`, bottom: `calc(${ROW / 2} * var(--u))` }}
            >
              <span className="absolute inset-0 bg-current opacity-40" />
            </span>
            {/* рожеве світіння довкола активної крапки — переїжджає між крапками */}
            <span
              aria-hidden="true"
              data-progress-glow
              data-reveal="chrome"
              className="absolute opacity-0 left-[calc(4.5*var(--u))] w-px transition-transform duration-500 ease-out [background:linear-gradient(to_bottom,transparent,var(--color-pink)_48%,transparent)]"
              style={{
                top: `calc(${ROW / 2 - 9.5} * var(--u))`,
                height: `calc(19 * var(--u))`,
                transform: `translateY(calc(var(--step, 0) * ${PITCH} * var(--u)))`,
              }}
            />
            <ul className="relative flex flex-col items-start gap-2">
              {/* верхня крапка — hero */}
              <li
                data-step={0}
                data-chrome-item
                data-reveal="chrome"
                className={`${item} group h-18`}
              >
                <a href="#top" className="flex h-full items-center outline-none" aria-label={chrome.heroLabel}>
                  <Dot />
                </a>
              </li>
              {navigation.map((nav, i) => (
                <li
                  key={nav.id}
                  data-step={i + 1}
                  data-chrome-item
                  data-reveal="chrome"
                  className={`${item} group flex items-center gap-8 data-[active=true]:text-pink!`}
                >
                  <Dot />
                  <a href={`#${nav.id}`} className={trigger}>
                    <BracketLabel label={nav.label} after={menuWidth - nav.label.length} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
      <ContactDialog title={chrome.contact} closeLabel={chrome.contactClose} />
    </>
  );
}

/** крапка прогрес-бару: світла (колір тексту), активна — рожева */
function Dot() {
  return (
    <span
      aria-hidden="true"
      className="block size-10 shrink-0 rounded-full bg-current transition-colors duration-300 group-data-[active=true]:bg-pink"
    />
  );
}
