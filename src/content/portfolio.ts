// Тексти секції Portfolio (кейси). uk — для української версії сайту (поки не підключено).
// Обкладинки — src/assets/portfolio (з assets-for-site/cases), назва кейсу = назва файлу.

export const portfolio = {
  heading: "Portfolio",
  // Порядок кейсів у галереї. image — ім'я файлу в src/assets/portfolio (без розширення)
  cases: [
    { image: "6-senses", title: "6 Senses" },
    { image: "boss-beauties", title: "Boss Beauties" },
    { image: "cloud-stone-studio", title: "Cloud Stone Studio" },
    { image: "lauren-martin-studio", title: "Lauren Martin Studio" },
  ],
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
    galleryLabel: "Галерея кейсів. Тягни або гортай стрілками, клацни обкладинку, щоб розгорнути.",
    roach: {
      label: "Тарган із намистом",
      message: "Дивіться уважно: у кожної деталі є причина. Випадкового тут нічого, я перевіряла.",
    },
  },
};
