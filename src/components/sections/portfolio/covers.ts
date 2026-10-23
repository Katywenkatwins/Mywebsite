// Обкладинки кейсів (з assets-for-site/cases). Ключ — image з content/portfolio.ts.
import type { StaticImageData } from "next/image";
import sixSenses from "@/assets/portfolio/6-senses.webp";
import bossBeauties from "@/assets/portfolio/boss-beauties.webp";
import cloudStone from "@/assets/portfolio/cloud-stone-studio.webp";
import laurenMartin from "@/assets/portfolio/lauren-martin-studio.webp";
import nftCollection from "@/assets/portfolio/nft-collection.webp";

export const covers: Record<string, StaticImageData> = {
  "6-senses": sixSenses,
  "boss-beauties": bossBeauties,
  "cloud-stone-studio": cloudStone,
  "lauren-martin-studio": laurenMartin,
  "nft-collection": nftCollection,
};

/** куди веде кейс: Behance (нова вкладка), а без посилання — сторінка кейса */
export const caseLink = (c: { slug: string; link?: string }) =>
  c.link
    ? { href: c.link, target: "_blank", rel: "noopener noreferrer" }
    : { href: `/portfolio/${c.slug}` };
