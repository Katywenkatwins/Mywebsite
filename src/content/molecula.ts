// Тексти секції Molecula (друга секція головної): картки методології, тарган, кнопка.
// Картка: title — заголовок капслоком, lead — жирний початок до двокрапки + продовження, body — абзац.
// Картки йдуть у такому порядку, як тут. Колір кожної — у Molecula.tsx (cardColors).
// uk — для української версії сайту (поки не підключено).

export type MoleculaCard = { title: string; leadBold: string; lead: string; body: string };

export const molecula = {
  // Для скрінрідера: заголовок секції (на екрані його роль грає перша картка)
  heading: "Methodology Molecula",
  cards: [
    {
      title: "Methodology Molecula",
      leadBold: "Brand methodology:",
      lead: "break it into molecules, build it into a system.",
      body: "A brand is made of molecules: meanings that already live in a person or business but lie scattered. I take them apart, find the links and put them back together as a system.",
    },
    {
      title: "How it works",
      leadBold: "Three steps:",
      lead: "take apart, connect, assemble.",
      body: "First I look at what’s really in the brand, with no templates or pretty words. Then I find the meanings that hold up the rest. And I build a visual language and a website from them.",
    },
    {
      title: "Six stages",
      leadBold: "Six stages:",
      lead: "each gives an answer and a result the next one stands on.",
      body: "Research, essence, architecture, strategy, moodboard, visual concept. In order, no skipping: I only reach for references once we understand the essence.",
    },
    {
      title: "Who it’s for",
      leadBold: "Who it’s for:",
      lead: "creators who already exist but haven’t shown up yet.",
      body: "Brands, experts and creative authors online. It fits if it feels like someone else is speaking from your screen, you want a partner, not a contractor, and you’re ready to look at yourself honestly.",
    },
    {
      title: "What you get",
      leadBold: "What you get:",
      lead: "five words with meaning and a system people know without a logo.",
      body: "Plus brand pillars, strategy, a moodboard and rules for your visuals on Instagram, your website and in decks. And above all, the moment someone says: “oh, that’s them”.",
    },
    {
      title: "Where to start",
      leadBold: "Where to start:",
      lead: "the “no logo” test. I take 10 of your posts and remove the logo.",
      body: "If the brand isn’t recognisable, there’s no visual voice yet. Next comes a diagnostic of one or two sessions, and it counts towards the main package.",
    },
  ] satisfies MoleculaCard[],
  // Тарган біля карток: фраза на наведенні
  roach: {
    label: "Roach with a notebook",
    message: "First we break it into molecules, then we build a system. The other way round doesn’t work. I checked.",
  },
  // Кнопка під картками — відкриває форму зворотного зв'язку
  cta: "Break it into molecules",
  // Підказка для скрінрідера і клавіатури
  hint: "Scroll or click the card to see the next one",

  uk: {
    heading: "Методологія Molecula",
    cards: [
      {
        title: "Methodology Molecula",
        leadBold: "Методологія бренду:",
        lead: "розібрати на молекули, зібрати в систему.",
        body: "Бренд складається з молекул: окремих смислів, які вже є в людині чи бізнесі, але лежать розсипом. Я розбираю їх, знаходжу зв’язки і збираю назад у систему.",
      },
      {
        title: "How it works",
        leadBold: "Три кроки:",
        lead: "розібрати, зв'язати, зібрати.",
        body: "Спершу я дивлюсь, що в бренді є насправді, без шаблонів і красивих слів. Потім знаходжу, які смисли тримають решту. І збираю з них візуальну мову та сайт.",
      },
      {
        title: "Six stages",
        leadBold: "Шість етапів:",
        lead: "кожен дає відповідь і результат, на який спирається наступний.",
        body: "Дослідження, суть, архітектура, стратегія, мудборд, візуальна концепція. Йдемо по порядку, без пропусків: референси я беру лише тоді, коли вже зрозуміли суть.",
      },
      {
        title: "Who it’s for",
        leadBold: "Для кого:",
        lead: "для творців, які вже є, але ще не проявились.",
        body: "Бренди, експерти й креативні автори в онлайні. Підходить, якщо ви відчуваєте, що з екрана говорите не ви, шукаєте партнера, а не виконавця, і готові дивитись на себе чесно.",
      },
      {
        title: "What you get",
        leadBold: "На виході:",
        lead: "п'ять слів із поясненням і система, яку впізнають без логотипа.",
        body: "Ще стовпи бренду, стратегія, мудборд і правила, як користуватись візуалом в Instagram, на сайті й у презентаціях. А головне момент, коли людина каже: «о, це вони».",
      },
      {
        title: "Where to start",
        leadBold: "З чого почати:",
        lead: "з тесту «без логотипа». Беру 10 ваших постів і прибираю лого.",
        body: "Якщо бренд не впізнається, візуального голосу ще немає. Далі діагностика на одну-дві сесії, і вона зараховується в основний пакет.",
      },
    ] satisfies MoleculaCard[],
    roach: {
      label: "Тарган із блокнотом",
      message: "Спершу розберемо на молекули, потім складемо в систему. Навпаки не працює, я перевіряв.",
    },
    cta: "Розібрати на молекули",
    hint: "Гортай або клацни картку, щоб побачити наступну",
  },
};
