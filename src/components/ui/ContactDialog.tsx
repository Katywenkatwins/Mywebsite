"use client";

/*
 * Вікно «Get in touch» — одне на весь сайт (нативний <dialog>: фокус, Esc і затемнення вже працюють).
 * Відкрити з будь-якого місця: openContact(). Саме вікно живе в SiteChrome (layout.tsx).
 * Поки форми немає (макета ще нема) — список контактів із content/site.ts → contacts.
 */

import { useEffect, useRef } from "react";
import { contacts } from "@/content/site";

const EVENT = "contact:open";

export const openContact = () => window.dispatchEvent(new Event(EVENT));

type Props = { title: string; closeLabel: string };

export function ContactDialog({ title, closeLabel }: Props) {
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
      <ul className="mt-[20px] flex flex-col gap-[10px] text-[14px] leading-[1.4]">
        {contacts.map((c) => (
          <li key={c.id} className="flex gap-[12px]">
            <span className="w-[96px] shrink-0 uppercase opacity-60">{c.label}</span>
            <a
              href={c.href}
              {...(c.href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
              className="underline decoration-pink decoration-2 underline-offset-4 hover:text-pink focus-visible:outline-2 focus-visible:outline-pink"
            >
              {c.value}
            </a>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => ref.current?.close()}
        className="mt-[28px] border border-ink px-[18px] py-[10px] text-[14px] uppercase"
      >
        {closeLabel}
      </button>
    </dialog>
  );
}
