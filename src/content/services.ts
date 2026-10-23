// Тексти секції Services (п'ята секція головної). uk — для української версії сайту (поки не підключено).
// Ціни малюються контурами Coolvetica — після зміни price запусти: node scripts/gen-services-lettering.mjs

export type Service = {
  title: string;
  text: string;
  /** «від» перед ціною (коли ціна — нижня межа) */
  from?: boolean;
  /** ціна — великими рожевими цифрами */
  price: string;
  /** дрібний підпис після ціни, напр. «/ month» */
  per?: string;
};

export const services = {
  heading: "Services",
  priceLabel: "Price:",
  fromLabel: "from",
  cards: [
    {
      title: "Diagnostics",
      text: "1–2 sessions: we take apart what’s wrong with the brand and where to go next. Counts towards the main package.",
      price: "150–300$",
    },
    {
      title: "Brand",
      text: "The whole MOLECULE path: research, five words, pillars, strategy, moodboard and visual concept.",
      from: true,
      price: "1000$",
    },
    {
      title: "Website",
      text: "For those who already have a brand: design, development and a month of support. A site that speaks in the brand’s voice.",
      from: true,
      price: "1000$",
    },
    {
      title: "Brand + website",
      text: "One path with no gaps. A package with added value, not a discount.",
      from: true,
      price: "2000$",
    },
    {
      title: "Support",
      text: "Regular meetings, homework, support on the move.",
      price: "150–300$",
      per: "/ month",
    },
  ] satisfies Service[],
  roachLabel: "Roach at the wheel",
  // Тарган за кермом — фраза на наведенні
  roachMessage: "So, shall we go?",
  // Кнопка під картками — відкриває вікно зв'язку з уже обраною послугою (обрана картка)
  cta: "Get in touch",
  // Підказка для скрінрідера: картку можна обрати
  choose: (title: string) => `Choose: ${title}`,

  uk: {
    heading: "Послуги",
    priceLabel: "Вартість:",
    fromLabel: "від",
    cards: [
      { title: "Діагностика", text: "1–2 сесії: розбираємо, що не так з брендом, і куди рухатись. Зараховується в основний пакет.", price: "150–300$" },
      { title: "Бренд", text: "Весь шлях MOLECULE: дослідження, п'ять слів, стовпи, стратегія, мудборд і візуальна концепція.", from: true, price: "1000$" },
      { title: "Сайт", text: "Для тих, у кого вже є бренд: дизайн, розробка і місяць супроводу. Сайт, що говорить голосом бренду.", from: true, price: "1000$" },
      { title: "Бренд + сайт", text: "Єдиний шлях без розривів. Пакет з доданою цінністю, а не знижкою.", from: true, price: "2000$" },
      { title: "Супровід", text: "Регулярні зустрічі, домашні завдання, підтримка в русі.", price: "150–300$", per: "/ міс." },
    ] satisfies Service[],
    roachLabel: "Тарган за кермом",
    roachMessage: "Ну що, погнали?",
    cta: "Зв’язатися",
    choose: (title: string) => `Обрати: ${title}`,
  },
};
