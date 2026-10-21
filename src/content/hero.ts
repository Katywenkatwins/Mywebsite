// Тексти першої секції (hero).
export const hero = {
  // Рукописне ім'я поверх DESIGNER
  name: "Kateryna Smiian",
  // Підпис у куті (верх-ліво)
  signature: "kateryna smiian",
  // Що читає скрінрідер і пошуковик замість графічних написів DESIGNER / OF VISUAL SENSES
  headingForScreenReaders: "Kateryna Smiian — designer of visual senses",
  // Абзац у правому нижньому куті: для кого і як допомагаю. На сайті — великими літерами.
  // Після зміни тексту запусти: node scripts/gen-hero-lettering.mjs (він перебудує контури літер)
  intro: "For brands that already mean something but don’t stand out yet. I find the essence and turn it into colour, type and rhythm.",
  // З якого місця абзац після появи перефарбовується в рожевий, літера за літерою
  introHighlightFrom: "I find",
  // Фріда (тарган біля DESIGNER): «Psst…» друкується раз на кілька секунд, повне повідомлення — на наведенні
  frida: {
    teaser: "Psst…",
    message: "I’m Frida, the artist roach. See the pink? I spilled it. Everything here is alive, so hover and drag anything you like.",
    // Для української версії сайту (поки не підключено)
    uk: {
      teaser: "Псс…",
      message: "Я Фріда, тарган-митець. Бачиш рожевий? Це я розлила. Тут усе живе, наводь і тягни куди хочеш.",
    },
  },
  // Кнопки під абзацом
  primaryCta: { label: "Find your essence", href: "#contact" },
  secondaryCta: { label: "How it works", href: "#molecula" },
};
