/*
 * Генерує контури літер для hero з файлів шрифтів — точно як у Figma.
 * Шрифти лежать в assets-for-site/ (не в git, бо це твої ліцензовані файли).
 *
 *   node scripts/gen-hero-lettering.mjs
 *
 * Результат:
 *   src/components/sections/hero/lettering.ts   — контури DESIGNER, OF VISUAL SENSES, Kateryna Smiian
 *   public/hero/designer-knockout.svg, senses-knockout.svg — маски «вирізу» імені з написів
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

const bounds = (gs) =>
  gs.reduce((a, g) => [Math.min(a[0], g.box[0]), Math.min(a[1], g.box[1]), Math.max(a[2], g.box[2]), Math.max(a[3], g.box[3])], [Infinity, Infinity, -Infinity, -Infinity]);

// Полотна з запасом під рамку виділення, підписи й «іскри» ефекту наведення
const pad = 48;
const canvasBox = (gs, padLeft = pad) => {
  const b = bounds(gs);
  return { x: r(b[0] - padLeft), y: r(b[1] - pad), w: r(b[2] - b[0] + padLeft + pad), h: r(b[3] - b[1] + pad * 2) };
};
const designerBox = canvasBox(designer);
// зліва запас менший, щоб полотно не накривало R від DESIGNER (інакше R не ловив би курсор)
const sensesBox = canvasBox(senses.flat(), 18);

// Маска «вирізу» імені (у Figma — ім'я з обведенням 5 px назовні, відняте від напису).
// Працює за прозорістю: усе непрозоре, крім імені з обведенням (там «дірка»).
const knockout = (kb) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${kb.x} ${kb.y} ${kb.w} ${kb.h}" preserveAspectRatio="none"><defs><mask id="k" maskUnits="userSpaceOnUse" x="${kb.x}" y="${kb.y}" width="${kb.w}" height="${kb.h}"><rect x="${kb.x}" y="${kb.y}" width="${kb.w}" height="${kb.h}" fill="#fff"/><g fill="#000" stroke="#000" stroke-width="10" stroke-linejoin="round">${name.map((g) => `<path d="${g.d}"/>`).join("")}</g></mask></defs><rect x="${kb.x}" y="${kb.y}" width="${kb.w}" height="${kb.h}" fill="#000" mask="url(#k)"/></svg>`;
fs.writeFileSync(path.join(root, "public/hero/designer-knockout.svg"), knockout(designerBox));
fs.writeFileSync(path.join(root, "public/hero/senses-knockout.svg"), knockout(sensesBox));

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

/** Полотно DESIGNER (із запасом під ефект наведення) */
export const designerBox = ${JSON.stringify(designerBox)};

export const nameGlyphs: Glyph[] = ${JSON.stringify(name)};

export const sensesLines: Glyph[][] = ${JSON.stringify(senses)};

/** OF VISUAL SENSES одним списком (для полотна з ефектом наведення) */
export const sensesGlyphs: Glyph[] = sensesLines.flat();

/** Полотно OF VISUAL SENSES (із запасом під ефект наведення) */
export const sensesBox = ${JSON.stringify(sensesBox)};

/** Розмір і висота великих літер OF VISUAL SENSES — для курсора друку */
export const sensesType = { size: ${sSize}, capHeight: ${r(0.664 * sSize)}, lineHeight: ${lh}, baselines: ${JSON.stringify([0, 1, 2].map((i) => r(firstBaseline + i * lh)))} };
`;
fs.writeFileSync(path.join(root, "src/components/sections/hero/lettering.ts"), ts);
console.log("designer", designer.length, "name", name.length, "senses", senses.map((l) => l.length).join("/"), "box", designerBox);
