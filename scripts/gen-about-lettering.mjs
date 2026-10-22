/*
 * Контури великого тексту секції About (Coolvetica) — як у Figma «Look & Feel 12» (node 12361:174).
 * Шрифт лежить у assets-for-site/ (не в git, ліцензований файл).
 *
 *   node scripts/gen-about-lettering.mjs
 *
 * Результат: src/components/sections/about/lettering.ts
 * Текст — src/content/about.ts → statement (на сайті капслоком).
 * Figma: Coolvetica 90 px, трекінг −2 %, висота рядка 90 % (81 px), по центру, ширина блоку 1064, блок по центру кадру.
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

const SIZE = 90;
const TRACK = -0.02;
const LH = 81;
const BOX_W = 1064;
const FRAME = { w: 1920, h: 1080 };
const scale = SIZE / cool.unitsPerEm;

const content = fs.readFileSync(path.join(root, "src/content/about.ts"), "utf8");
const text = content.match(/statement:\s*\n?\s*"([^"]+)"/)[1].toUpperCase();

// ширина рядка з трекінгом і кернінгом
const width = (s) => {
  const gs = cool.stringToGlyphs(s);
  let w = 0;
  gs.forEach((g, i) => {
    w += g.advanceWidth * scale + (i < gs.length - 1 ? TRACK * SIZE : 0);
    if (i < gs.length - 1) w += cool.getKerningValue(g, gs[i + 1]) * scale;
  });
  return w;
};

// перенос по словах у ширину блоку
const lines = [];
let cur = "";
for (const word of text.split(" ")) {
  const next = cur ? `${cur} ${word}` : word;
  if (cur && width(next) > BOX_W) {
    lines.push(cur);
    cur = word;
  } else cur = next;
}
if (cur) lines.push(cur);

const blockH = lines.length * LH;
const top = (FRAME.h - blockH) / 2;
const firstBaseline = top + (LH - 1.2 * SIZE) / 2 + 0.967 * SIZE + 0.47;

const glyphs = [];
const lineBoxes = [];
lines.forEach((line, li) => {
  const w = width(line);
  let x = (FRAME.w - w) / 2;
  const baseline = firstBaseline + li * LH;
  const gs = cool.stringToGlyphs(line);
  gs.forEach((g, i) => {
    const p = g.getPath(x, baseline, SIZE);
    const ch = line[i];
    if (ch && ch.trim()) glyphs.push({ char: ch, d: pathData(p), line: li });
    x += g.advanceWidth * scale + TRACK * SIZE;
    if (i < gs.length - 1) x += cool.getKerningValue(g, gs[i + 1]) * scale;
  });
  lineBoxes.push({ x: r((FRAME.w - w) / 2), y: r(top + li * LH), w: r(w), h: LH });
});

const last = lineBoxes[lineBoxes.length - 1];
const ts = `// Згенеровано scripts/gen-about-lettering.mjs — не редагуй вручну.
// Координати — пікселі макета 1920×1080.

export type AboutGlyph = { char: string; d: string; line: number };

/** контури літер великого тексту (Coolvetica 90, капслок) */
export const aboutGlyphs: AboutGlyph[] = ${JSON.stringify(glyphs)};
/** рядки: де лежить кожен (для підсвітки й позиції таргана) */
export const aboutLines = ${JSON.stringify(lineBoxes)};
/** блок тексту цілком */
export const aboutBox = ${JSON.stringify({ x: (FRAME.w - BOX_W) / 2, y: r(top), w: BOX_W, h: blockH })};
/** кінець останнього рядка — після нього стоїть тарган (у Figma відступ 14 px, низ — по низу тексту) */
export const aboutLastLineEnd = ${JSON.stringify({ x: r(last.x + last.w), bottom: r(top + blockH) })};
`;
fs.writeFileSync(path.join(root, "src/components/sections/about/lettering.ts"), ts);
console.log(lines, lineBoxes);
