"use client";

/*
 * Вікно «Get in touch» — одне на весь сайт (нативний <dialog>: фокус, Esc і затемнення вже працюють).
 * Відкрити з будь-якого місця: openContact(), або openContact("Brand") — тоді в формі вже обрана ця послуга
 * (так робить кнопка в Services для обраної картки). Саме вікно живе в SiteChrome (layout.tsx).
 * Форма: послуга (картки з content/services.ts), ім'я, як відповісти, повідомлення. Сервера поки немає —
 * «Send» відкриває поштову програму з уже заповненим листом на Email з content/site.ts → contacts.
 * Нижче — усі контакти списком.
 */

import { useEffect, useRef, useState, type FormEvent } from "react";
import { chrome, contacts } from "@/content/site";
import { services } from "@/content/services";

const EVENT = "contact:open";

/** відкрити вікно; рядок — назва послуги, яку одразу обрати (подію кліку ігноруємо — openContact можна давати в onClick) */
export const openContact = (service?: unknown) =>
  window.dispatchEvent(new CustomEvent(EVENT, { detail: typeof service === "string" ? service : undefined }));

type Props = { title: string; closeLabel: string };

const field =
  "mt-[6px] w-full border border-ink bg-paper px-[12px] py-[9px] text-[14px] outline-none focus-visible:border-pink focus-visible:outline-2 focus-visible:outline-pink";
const label = "block text-[12px] uppercase tracking-[-0.24px] opacity-60";

export function ContactDialog({ title, closeLabel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [service, setService] = useState<string>("");
  const email = contacts.find((c) => c.id === "email")!;
  const t = chrome.form;

  useEffect(() => {
    const open = (e: Event) => {
      const s = (e as CustomEvent<string | undefined>).detail;
      if (s) setService(s);
      ref.current?.showModal();
    };
    window.addEventListener(EVENT, open);
    return () => window.removeEventListener(EVENT, open);
  }, []);

  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const reply = String(data.get("reply") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = [service, name].filter(Boolean).join(" · ") || title;
    const body = [
      service && `${t.service}: ${service}`,
      name && `${t.name}: ${name}`,
      reply && `${t.reply}: ${reply}`,
      message && `\n${message}`,
    ]
      .filter(Boolean)
      .join("\n");
    window.open(`${email.href}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_self");
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="contact-dialog-title"
      className="m-auto max-h-[calc(100svh-32px)] w-[min(600px,calc(100vw-32px))] overflow-y-auto border border-ink bg-cream p-[32px] text-ink backdrop:bg-ink/70 max-md:p-[20px]"
      onClick={(e) => {
        // клік по затемненню закриває
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <h2 id="contact-dialog-title" className="text-[20px] font-medium uppercase tracking-[-0.4px]">
        {title}
      </h2>

      <form onSubmit={send} className="mt-[20px] flex flex-col gap-[16px]">
        <fieldset>
          <legend className={label}>{t.service}</legend>
          <div className="mt-[8px] flex flex-wrap gap-[8px]">
            {services.cards.map((c) => (
              <label key={c.title} className="cursor-pointer">
                <input
                  type="radio"
                  name="service"
                  value={c.title}
                  checked={service === c.title}
                  onChange={() => setService(c.title)}
                  className="peer sr-only"
                />
                <span className="block border border-ink px-[12px] py-[7px] text-[13px] uppercase tracking-[-0.26px] transition-colors peer-checked:border-pink peer-checked:bg-pink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-pink hover:bg-paper peer-checked:hover:bg-pink">
                  {c.title}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-[12px] max-md:grid-cols-1">
          <label>
            <span className={label}>{t.name}</span>
            <input name="name" autoComplete="name" className={field} />
          </label>
          <label>
            <span className={label}>{t.reply}</span>
            <input name="reply" required autoComplete="email" className={field} />
          </label>
        </div>
        <label>
          <span className={label}>{t.message}</span>
          <textarea name="message" rows={4} className={`${field} resize-y`} />
        </label>
        <div className="flex gap-[12px]">
          <button
            type="submit"
            className="border border-ink bg-ink px-[18px] py-[10px] text-[14px] uppercase text-cream transition-colors hover:border-pink hover:bg-pink hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
          >
            {t.send}
          </button>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="border border-ink px-[18px] py-[10px] text-[14px] uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
          >
            {closeLabel}
          </button>
        </div>
      </form>

      <p className={`${label} mt-[28px]`}>{t.or}</p>
      <ul className="mt-[10px] flex flex-col gap-[8px] text-[14px] leading-[1.4]">
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
    </dialog>
  );
}
