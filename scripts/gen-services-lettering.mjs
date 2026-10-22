/*
 * Контури Coolvetica для секції Services: заголовок SERVICES і ціни на картках (Figma «Look & Feel 14», node 12364:282).
 * Шрифт — assets-for-site/ (не в git). Запуск: node scripts/gen-services-lettering.mjs
 * Результат: src/components/sections/services/lettering.ts
 *  - заголовок: Coolvetica 90 px, трекінг −2 %, капслок, верх блоку на (30, 102) — координати сцени 1920×1080;
 *  - ціни: Coolvetica 60 px, від базової лінії 0, x від 0 — кожна окремо (картка ставить її сама).
 */
import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const cool = opentype.parse(fs.readFileSync(path.join(root, "assets-for-site", "coolvetica rg.otf")).buffer);
const r = (n) => Math.round(n * 100) / 100;
const f2 = (n) => String(r(n));
const pathData = (p) =>
  p.commands
    .map((c) => {
      if (c.type === "M" || c.type === "L") return `${c.type}${f2(c.x)} ${f2(c.y)}`;
      if (c.type === "Q") return `Q${f2(c.x1)} ${f2(c.y1)} ${f2(c.x)} ${f2(c.y)}`;
      if (c.type === "C") return `C${f2(c.x1)} ${f2(c.y1)} ${f2(c.x2)} ${f2(c.y2)} ${f2(c.x)} ${f2(c.y)}`;
      return "Z";
    })
    .join("");

// один рядок у контур; повертає шлях і ширину
function line(text, x0, baseline, size, track) {
  const scale = size / cool.unitsPerEm;
  const gs = cool.stringToGlyphs(text);
  let x = x0;
  let d = "";
  gs.forEach((g, i) => {
    d += pathData(g.getPath(x, baseline, size));
    x += g.advanceWidth * scale + (i < gs.length - 1 ? track * size : 0);
    if (i < gs.length - 1) x += cool.getKerningValue(g, gs[i + 1]) * scale;
  });
  return { d, w: r(x - x0) };
}

// Заголовок: як великі написи hero — базова лінія = верх + (висота рядка − 1.2em)/2 + 0.967em
const H = 90;
const LH = 81;
const heading = line("SERVICES", 30, 102 + (LH - 1.2 * H) / 2 + 0.967 * H + 0.47, H, -0.02);

const content = fs.readFileSync(path.join(root, "src/content/services.ts"), "utf8");
const enBlock = content.slice(0, content.indexOf("uk: {"));
const prices = [...new Set([...content.matchAll(/price:\s*"([^"]+)"/g)].map((m) => m[1]))];
const priceGlyphs = Object.fromEntries(prices.map((p) => [p, line(p, 0, 0, 60, 0)]));
void enBlock;

const ts = `// Згенеровано scripts/gen-services-lettering.mjs — не редагуй вручну.

/** SERVICES — у координатах сцени 1920×1080 */
export const servicesHeading = ${JSON.stringify(heading)};
/** ціни Coolvetica 60 px: базова лінія y = 0, x від 0; w — ширина */
export const priceGlyphs: Record<string, { d: string; w: number }> = ${JSON.stringify(priceGlyphs)};
/** висота великих літер Coolvetica 60 px (для вирівнювання) */
export const PRICE_CAP = ${r(0.664 * 60)};
`;
fs.writeFileSync(path.join(root, "src/components/sections/services/lettering.ts"), ts);
console.log(heading.w, Object.fromEntries(Object.entries(priceGlyphs).map(([k, v]) => [k, v.w])));
