"use client";

/*
 * Вікно зворотного зв'язку — одне на весь сайт (нативний <dialog>: фокус, Esc і затемнення вже працюють).
 * Відкрити з будь-якого місця: openContact(). Саме вікно живе в SiteChrome (layout.tsx).
 * TODO(Катя): форми ще немає в макеті — поки помітний плейсхолдер. Поля й відправку додамо, коли буде макет.
 */

import { useEffect, useRef } from "react";

const EVENT = "contact:open";

export const openContact = () => window.dispatchEvent(new Event(EVENT));

export function ContactDialog({ title, closeLabel }: { title: string; closeLabel: string }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const open = () => ref.current?.showModal();
    window.addEventListener(EVENT, open);
    return () => window.removeEventListener(EVENT, open);
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="contact-dialog-title"
      className="m-auto w-[min(560px,calc(100vw-32px))] border border-ink bg-cream p-[32px] text-ink backdrop:bg-ink/70"
      onClick={(e) => {
        // клік по затемненню закриває
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <h2 id="contact-dialog-title" className="text-[20px] font-medium uppercase tracking-[-0.4px]">
        {title}
      </h2>
      <p className="mt-[16px] border border-dashed border-pink bg-paper p-[16px] text-[14px] leading-[1.5]">
        [Плейсхолдер] Тут буде форма зворотного зв’язку — макету форми ще немає.
      </p>
      <button
        type="button"
        onClick={() => ref.current?.close()}
        className="mt-[24px] border border-ink px-[18px] py-[10px] text-[14px] uppercase"
      >
        {closeLabel}
      </button>
    </dialog>
  );
}
