/*
 * Генерує контури літер для hero з файлів шрифтів — точно як у Figma.
 * Шрифти лежать в assets-for-site/ (не в git, бо це твої ліцензовані файли).
 *
 *   node scripts/gen-hero-lettering.mjs
 *
 * Результат:
 *   src/components/sections/hero/lettering.ts   — контури DESIGNER, OF VISUAL SENSES, Kateryna Smiian
 *   public/hero/name-knockout.svg                — маска «вирізу» імені з DESIGNER і OF VISUAL SENSES
 *
 * Числа нижче — з Figma (вузли 12288:22413, 12289:22422, 12288:22415, група 12288:22417 на 14,96).
 * Дрібні зсуви (dy) звірені з absoluteRenderBounds у Figma.
 */
import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const load = (file) => opentype.parse(fs.readFileSync(path.join(root, "assets-for-site", file)).buffer);
const astrum = load("AstrumScriptCyrillic_Regular.ttf");
const cool = load("coolvetica rg.otf");
const r = (n) => Math.round(n * 100) / 100;

function line(font, text, x0, baseline, size, tracking) {
  const scale = size / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(text);
  let x = x0;
  const out = [];
  glyphs.forEach((g, i) => {
    const ch = text[i];
    const p = g.getPath(x, baseline, size);
    const bb = p.getBoundingBox();
    if (ch.trim()) {
      out.push({ char: ch, d: p.toPathData(2), box: [r(bb.x1), r(bb.y1), r(bb.x2), r(bb.y2)], next: 0 });
    }
    let adv = g.advanceWidth * scale + tracking * size;
    if (i < glyphs.length - 1) adv += font.getKerningValue(g, glyphs[i + 1]) * scale;
    x += adv;
    if (out.length && ch.trim()) out[out.length - 1].next = r(x);
  });
  return out;
}

const G = { x: 14, y: 96 };

// DESIGNER — Coolvetica 346.887 px, трекінг −2 %, висота рядка AUTO (1.2 em), базова лінія = верх + ascender
const dSize = 346.8873596191406;
const designer = line(cool, "DESIGNER", G.x - 7.977818773477338, G.y - 97.35932546854019 + 0.967 * dSize - 0.44, dSize, -0.02);

// Kateryna Smiian — Astrum 289.073 px, lineGap ділиться навпіл
const nSize = 289.0727844238281;
const name = line(astrum, "Kateryna Smiian", G.x + 18.48388671875, G.y + 109.6575927734375 + ((494 / 2 + 594) / 1000) * nSize - 0.11, nSize, 0);

// OF VISUAL SENSES — Coolvetica 90 px, висота рядка 90 % (81 px), трекінг −2 %
const sSize = 90;
const lh = 81;
const firstBaseline = G.y + (lh - 1.2 * sSize) / 2 + 0.967 * sSize + 0.47;
const senses = ["OF", "VISUAL", "SENSES"].map((t, i) => line(cool, t, G.x + 1435, firstBaseline + i * lh, sSize, -0.02));

// Полотна ефекту наведення — на всю сцену з запасом, щоб літеру можна було витягнути далеко
const area = { x: -120, y: -120, w: 2160, h: 1320 };

// Маска «вирізу» імені (у Figma — ім'я з обведенням 5 px назовні, відняте від написів).
// Працює за прозорістю: усе непрозоре, крім імені з обведенням (там «дірка»).
const kb = area;
const knockout = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${kb.x} ${kb.y} ${kb.w} ${kb.h}" preserveAspectRatio="none"><defs><mask id="k" maskUnits="userSpaceOnUse" x="${kb.x}" y="${kb.y}" width="${kb.w}" height="${kb.h}"><rect x="${kb.x}" y="${kb.y}" width="${kb.w}" height="${kb.h}" fill="#fff"/><g fill="#000" stroke="#000" stroke-width="10" stroke-linejoin="round">${name.map((g) => `<path d="${g.d}"/>`).join("")}</g></mask></defs><rect x="${kb.x}" y="${kb.y}" width="${kb.w}" height="${kb.h}" fill="#000" mask="url(#k)"/></svg>`;
fs.writeFileSync(path.join(root, "public/hero/name-knockout.svg"), knockout);

const ts = `// Згенеровано scripts/gen-hero-lettering.mjs — не редагуй вручну.
// Координати — пікселі макета 1920×1080.

export type Glyph = {
  char: string;
  /** контур літери (SVG path) */
  d: string;
  /** межі контуру: x1, y1, x2, y2 */
  box: [number, number, number, number];
  /** x, де починається наступна літера (для курсора друку) */
  next: number;
};

export const designerGlyphs: Glyph[] = ${JSON.stringify(designer)};

/** Полотно написів з ефектом наведення (вся сцена з запасом) */
export const letteringArea = ${JSON.stringify(area)};

export const nameGlyphs: Glyph[] = ${JSON.stringify(name)};

export const sensesLines: Glyph[][] = ${JSON.stringify(senses)};

/** OF VISUAL SENSES одним списком (для полотна з ефектом наведення) */
export const sensesGlyphs: Glyph[] = sensesLines.flat();

/** Розмір і висота великих літер OF VISUAL SENSES — для курсора друку */
export const sensesType = { size: ${sSize}, capHeight: ${r(0.664 * sSize)}, lineHeight: ${lh}, baselines: ${JSON.stringify([0, 1, 2].map((i) => r(firstBaseline + i * lh)))} };
`;
fs.writeFileSync(path.join(root, "src/components/sections/hero/lettering.ts"), ts);
console.log("designer", designer.length, "name", name.length, "senses", senses.map((l) => l.length).join("/"));
