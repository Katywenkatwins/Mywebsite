"use client";

/*
 * Бейдж на шнурку для About: Lanyard (three.js) з фото-бейджем із Figma і рожевим шнурком із монограмою KS.
 * Вантажиться лише в браузері (About підключає через next/dynamic, ssr: false), тож кольори токенів читаємо одразу.
 */

import { useState } from "react";
import Lanyard from "@/components/effects/Lanyard";
import badgeFront from "@/assets/about/badge-front.jpg";
import strap from "@/assets/about/strap.jpg";

export default function Badge() {
  const [colors] = useState(() => {
    const css = getComputedStyle(document.documentElement);
    return { strap: css.getPropertyValue("--color-pink").trim(), card: css.getPropertyValue("--color-paper").trim() };
  });
  return (
    <Lanyard
      frontImage={badgeFront.src}
      strapImage={strap.src}
      strapColor={colors.strap}
      cardColor={colors.card}
      finish="glossy"
      cornerRadius={0.04}
      size={0.5}
      strapLength={0.4}
      anchor="center"
      metal="silver"
      breeze={0.2}
      damping={0.6}
    />
  );
}
