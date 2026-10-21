"use client";

/*
 * Те, що закріплено в екрані на всьому сайті:
 *  - внизу ліворуч — головне меню у форматі [MOLECULA     ];
 *  - угорі праворуч — [    GET IN TOUCH ] (відкриває вікно зв'язку) і мови [  UA] [  EN].
 * Колір кожного пункту — за тлом секції під ним: секція каже data-nav-theme="light" (темний текст) чи "dark" (білий).
 * У Molecula верх — сірий піксельний шов, тож білим пункт стає, коли під ним уже чорне.
 * З'являється разом з меню hero (hero.motion → [data-reveal="chrome"]). На мобільному поки лише правий верхній кут:
 * меню переїде в бургер, коли буде приклад.
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { chrome, navigation } from "@/content/site";
import { BracketLabel } from "@/components/ui/BracketLabel";
import { ContactDialog, openContact } from "@/components/ui/ContactDialog";

const menuWidth = Math.max(...navigation.map((item) => item.label.length)) + 2;
const item =
  "pointer-events-auto opacity-0 transition-colors duration-300 data-[theme=dark]:text-paper data-[theme=dark]:[text-shadow:0_0_3px_var(--color-ink),0_0_8px_var(--color-ink)] focus-within:opacity-100";
const trigger =
  "letter-swap-trigger inline-flex outline-none focus-visible:underline";

export function SiteChrome() {
  const root = useRef<HTMLDivElement>(null);

  // колір пунктів за тлом секції під кожним із них
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
    const items = Array.from(
      el.querySelectorAll<HTMLElement>("[data-chrome-item]"),
    );
    let raf = 0;

    const themeAt = (y: number) => {
      for (const s of document.querySelectorAll<HTMLElement>(
        "[data-nav-theme]",
      )) {
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
    const update = () => {
      raf = 0;
      for (const it of items) {
        const r = it.getBoundingClientRect();
        const theme = themeAt(r.top + r.height / 2);
        if (it.dataset.theme !== theme) it.dataset.theme = theme;
      }
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
        className="pointer-events-none fixed inset-0 z-50 text-u-14 leading-[normal] tracking-[calc(-0.28*var(--u))] text-ink uppercase [--spacing:var(--u)] [--u:var(--s)] max-md:text-[11px] max-md:tracking-[-0.02em] max-md:[--u:calc(var(--page-w,100vw)/1920)]"
      >
        {/* Угорі праворуч: зв'язок і мови */}
        <div className="absolute top-30 right-30 flex items-start gap-16 max-md:top-[16px] max-md:right-[16px] max-md:gap-[8px]">
          <button
            type="button"
            data-chrome-item
            data-reveal="chrome"
            aria-haspopup="dialog"
            onClick={openContact}
            className={`${item} ${trigger} uppercase`}
          >
            <BracketLabel label={chrome.contact} before={4} after={1} />
          </button>
          <ul
            aria-label={chrome.languagesLabel}
            className="flex gap-8 max-md:gap-[6px]"
          >
            {chrome.languages.map((lang) => (
              <li
                key={lang.code}
                data-chrome-item
                data-reveal="chrome"
                className={item}
              >
                {lang.current ? (
                  <Link
                    href="/"
                    lang="en"
                    aria-current="true"
                    className={trigger}
                  >
                    <span className="sr-only">{lang.name}</span>
                    <span aria-hidden="true" className="inline-flex">
                      <BracketLabel label={lang.code} before={2} />
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    aria-disabled="true"
                    title={`${lang.name} — ${chrome.soon}`}
                    className={`${trigger} uppercase`}
                  >
                    <span
                      className="sr-only"
                      lang="uk"
                    >{`${lang.name} (${chrome.soon})`}</span>
                    <span aria-hidden="true" className="inline-flex">
                      <BracketLabel label={lang.code} before={2} />
                    </span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Внизу ліворуч: головне меню */}
        <nav
          aria-label={chrome.menuLabel}
          className="absolute bottom-30 left-30 max-md:hidden"
        >
          <ul className="flex flex-col items-start gap-2">
            {navigation.map((nav) => (
              <li
                key={nav.id}
                data-chrome-item
                data-reveal="chrome"
                className={item}
              >
                <a href={`#${nav.id}`} className={trigger}>
                  <BracketLabel
                    label={nav.label}
                    after={menuWidth - nav.label.length}
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <ContactDialog title={chrome.contact} closeLabel={chrome.contactClose} />
    </>
  );
}
