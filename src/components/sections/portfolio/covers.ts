// Обкладинки кейсів (з assets-for-site/cases). Ключ — image з content/portfolio.ts.
import type { StaticImageData } from "next/image";
import sixSenses from "@/assets/portfolio/6-senses.webp";
import bossBeauties from "@/assets/portfolio/boss-beauties.webp";
import cloudStone from "@/assets/portfolio/cloud-stone-studio.webp";
import laurenMartin from "@/assets/portfolio/lauren-martin-studio.webp";

export const covers: Record<string, StaticImageData> = {
  "6-senses": sixSenses,
  "boss-beauties": bossBeauties,
  "cloud-stone-studio": cloudStone,
  "lauren-martin-studio": laurenMartin,
};
