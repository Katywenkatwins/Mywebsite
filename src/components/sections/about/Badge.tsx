"use client";

/*
 * Бейдж на шнурку для About: Lanyard (three.js), як у шаблоні React Bits.
 * Лице — фото (assets/about/badge-front), зворот — «Про мене» (badge-back), на рожевому шнурку — монограма KS.
 * Розмір, довжина шнурка, кути й «вітерець» — як у шаблоні (значення за замовчуванням Lanyard).
 * Тягни мишею, клік — перевертає. Вантажиться лише в браузері (About підключає через next/dynamic, ssr: false),
 * тож кольори токенів читаємо одразу.
 */

import { useState } from "react";
import Lanyard from "@/components/effects/Lanyard";
import badgeFront from "@/assets/about/badge-front.webp";
import badgeBack from "@/assets/about/badge-back.webp";
import strapKs from "@/assets/about/strap-ks.png";

export default function Badge() {
  const [colors] = useState(() => {
    const css = getComputedStyle(document.documentElement);
    return { strap: css.getPropertyValue("--color-pink").trim(), card: css.getPropertyValue("--color-paper").trim() };
  });
  return (
    <Lanyard
      frontImage={badgeFront.src}
      backImage={badgeBack.src}
      strapImage={strapKs.src}
      strapColor={colors.strap}
      cardColor={colors.card}
    />
  );
}
