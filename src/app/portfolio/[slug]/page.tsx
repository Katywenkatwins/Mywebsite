/*
 * Сторінка кейса: /portfolio/<slug>. Кейси — content/portfolio.ts.
 * TODO(Катя): макета сторінки кейса ще немає — поки обкладинка, назва й помітний плейсхолдер.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { portfolio } from "@/content/portfolio";
import { covers } from "@/components/sections/portfolio/covers";
import { site } from "@/content/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return portfolio.cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = portfolio.cases.find((c) => c.slug === slug);
  return { title: item ? `${item.title} · ${site.name}` : site.title };
}

export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const item = portfolio.cases.find((c) => c.slug === slug);
  if (!item) notFound();
  // поки кейс живе на Behance — стара адреса веде туди
  if (item.link) redirect(item.link);

  return (
    <main
      data-nav-theme="dark"
      className="min-h-svh bg-night px-[clamp(16px,calc(240*var(--u)),240px)] pt-[clamp(96px,calc(160*var(--u)),160px)] pb-[160px] text-cream"
    >
      <Link href="/#portfolio" className="text-[14px] uppercase tracking-[-0.02em] underline-offset-4 hover:underline">
        ← {portfolio.backToPortfolio}
      </Link>
      <h1 className="mt-[32px] text-[clamp(32px,5vw,72px)] font-medium uppercase leading-[1] tracking-[-0.02em]">
        {item.title}
      </h1>
      <Image
        src={covers[item.image]}
        alt={portfolio.coverAlt(item.title)}
        priority
        sizes="(max-width: 1440px) 100vw, 1440px"
        className="mt-[40px] h-auto w-full max-w-[1440px]"
      />
      <p className="mt-[40px] max-w-[720px] border border-dashed border-pink p-[16px] text-[14px] leading-[1.5]">
        {portfolio.casePlaceholder}
      </p>
    </main>
  );
}
