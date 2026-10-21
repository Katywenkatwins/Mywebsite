"use client";

/*
 * Вікно зворотного зв'язку (нативний <dialog>: фокус, Esc і фон уже працюють).
 * TODO(Катя): форми ще немає в макеті — поки помітний плейсхолдер. Поля й відправку додамо, коли буде макет.
 */

import { forwardRef } from "react";

type Props = { title: string };

export const ContactDialog = forwardRef<HTMLDialogElement, Props>(function ContactDialog({ title }, ref) {
  const close = (e: React.MouseEvent<HTMLElement>) => e.currentTarget.closest("dialog")?.close();
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
        onClick={close}
        className="mt-[24px] border border-ink px-[18px] py-[10px] text-[14px] uppercase"
      >
        Close
      </button>
    </dialog>
  );
});
