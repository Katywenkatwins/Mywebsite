import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site } from "@/content/site";
import { CursorPixels } from "@/components/effects/CursorPixels";
import { SiteChrome } from "@/components/layout/SiteChrome";
import "./globals.css";

const dmMono = localFont({
  src: [
    { path: "../fonts/DMMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/DMMono-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-dm-mono",
  display: "swap",
});

// DM Mono не має кирилиці — для українських літер у тому ж стилі беремо IBM Plex Mono (лише кирилиця)
const plexCyrillic = localFont({
  src: [
    { path: "../fonts/IBMPlexMono-Cyrillic.woff2", weight: "400", style: "normal" },
    { path: "../fonts/IBMPlexMono-Cyrillic-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-cyr",
  display: "swap",
});

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  // Проміжна версія: не показуємо пошуковикам. Коли сайт буде готовий — прибрати (і robots.ts теж).
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#9f9f9f",
};

/*
 * Пише в CSS точну ширину сторінки без скролбара і висоту вікна,
 * щоб 1920 пікселів макета = рівно ширина вікна. Виконується до першого малювання.
 */
const pageSizeScript = `(function(){var r=document.documentElement;function s(){r.style.setProperty('--page-w',r.clientWidth+'px');r.style.setProperty('--page-h',window.innerHeight+'px')}s();addEventListener('resize',s);if(window.ResizeObserver){new ResizeObserver(s).observe(r)}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmMono.variable} ${plexCyrillic.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: pageSizeScript }} />
      </head>
      <body>
        {children}
        <SiteChrome />
        <CursorPixels />
      </body>
    </html>
  );
}
