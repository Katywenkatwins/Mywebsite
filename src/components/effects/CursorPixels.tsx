"use client";

/*
 * Рожеві пікселі за курсором по всьому сайту (на основі PixelBlast з React Bits).
 * Слід — квадратик ≈20×20 px з дрібних пікселів, що згасає за курсором.
 * Фоновий візерунок вимкнено: поки миша стоїть, нічого не малюється і WebGL засинає.
 * Не вмикається на сенсорних екранах і при «менше руху».
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const PixelBlast = dynamic(() => import("./PixelBlast"), { ssr: false });

export function CursorPixels() {
  const [color, setColor] = useState("");

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    const pink = getComputedStyle(document.documentElement).getPropertyValue("--color-pink").trim();
    // вмикаємо після першого руху миші, щоб не вантажити WebGL даремно
    const start = () => setColor(pink);
    window.addEventListener("pointermove", start, { once: true, passive: true });
    return () => window.removeEventListener("pointermove", start);
  }, []);

  if (!color) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 opacity-60">
      <PixelBlast
        color={color}
        // клітинка сліду = 8 × pixelSize = 20 px
        pixelSize={2.5}
        smoothing={0}
        softness={0.2}
        patternDensity={-1}
        intro={false}
        speed={0}
        drift={0}
        twinkle={0}
        glow={0}
        edgeFade={0}
        enableRipples={false}
        hoverEffect="reveal"
        hoverRadius={10}
      />
    </div>
  );
}
