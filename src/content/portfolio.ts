// Тексти секції Portfolio (кейси). uk — для української версії сайту (поки не підключено).
// Обкладинки — src/assets/portfolio (з assets-for-site/cases), назва кейсу = назва файлу.

export const portfolio = {
  heading: "Portfolio",
  // Порядок кейсів у галереї. image — ім'я файлу в src/assets/portfolio (без розширення),
  // slug — адреса сторінки кейса: /portfolio/<slug>
  // link — поки сторінок кейсів немає, кнопка «Open project» веде сюди (Behance, нова вкладка);
  // без link — на сторінку-заглушку /portfolio/<slug>
  cases: [
    {
      slug: "6-senses",
      image: "6-senses",
      title: "6 Senses",
      link: "https://www.behance.net/gallery/207234185/MARKETING-AGENCY-6-SENSESLANDING-PAGE-WEB-DESIGN",
    },
    {
      slug: "boss-beauties",
      image: "boss-beauties",
      title: "Boss Beauties",
      link: "https://www.behance.net/gallery/235642837/NFT-WEB-30-WOMEN-comunity-WEBSITE-REDESIGN",
    },
    {
      slug: "cloud-stone-studio",
      image: "cloud-stone-studio",
      title: "Cloud Stone Studio",
      link: "https://www.behance.net/gallery/256353241/Interactive-Architecture-Interior-Website-Cloud-Stone",
    },
    // TODO(Катя): посилання на Behance для Lauren Martin Studio
    { slug: "lauren-martin-studio", image: "lauren-martin-studio", title: "Lauren Martin Studio" },
    {
      slug: "nft-collection",
      image: "nft-collection",
      title: "NFT Collection",
      link: "https://www.behance.net/gallery/211799629/Landing-page-for-NFT-COLLECTION-WEB3",
    },
  ] as { slug: string; image: string; title: string; link?: string }[],
  // Кнопка під відкритим кейсом — веде на кейс (поки Behance, див. link)
  openProject: "Open project",
  // Сторінка кейса (поки заглушка)
  backToPortfolio: "Back to portfolio",
  // TODO(Катя): сторінки кейсів ще без макета — поки помітний плейсхолдер
  casePlaceholder: "[Placeholder] The case story will be here — there is no layout for case pages yet.",
  // підпис для скрінрідера до кожної обкладинки
  coverAlt: (title: string) => `${title} case cover`,
  galleryLabel: "Case gallery. Drag or use the arrow keys, click a cover to focus it.",
  // Тарган з намистом — фраза на наведенні
  roach: {
    label: "Roach with beads",
    message: "Look closely: every detail has a reason. Nothing here is accidental. I checked.",
  },

  uk: {
    heading: "Портфоліо",
    openProject: "Відкрити проєкт",
    backToPortfolio: "Назад до портфоліо",
    galleryLabel: "Галерея кейсів. Тягни або гортай стрілками, клацни обкладинку, щоб розгорнути.",
    roach: {
      label: "Тарган із намистом",
      message: "Дивіться уважно: у кожної деталі є причина. Випадкового тут нічого, я перевіряла.",
    },
  },
};
