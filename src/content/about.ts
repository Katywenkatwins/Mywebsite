// Тексти секції About (третя секція головної). uk — для української версії сайту (поки не підключено).
// Після зміни statement запусти: node scripts/gen-about-lettering.mjs (перебудує контури літер Coolvetica).

export const about = {
  // Великий жовтий текст посередині (на сайті — капслоком)
  statement:
    "And I’ve got a team of roaches in my head who help me get creative and keep everything in order",
  // Тарган із німбом після тексту — фраза на наведенні
  roach: {
    label: "Roach with a halo",
    message: "Don’t rush. Essence first, the rest will follow.",
  },
  // Бейдж на шнурку
  badge: {
    label: "Badge with my photo. Drag it, click to flip.",
    alt: "Kateryna Smiian",
  },
  // Підказка до тексту з підсвіткою
  lightHint: "Click the text to turn the lights on",
  // Іконки контактів праворуч унизу.
  // TODO(Катя): дай справжні посилання — поки «#» (плейсхолдер).
  contacts: [
    { id: "phone", label: "Phone", href: "#" },
    { id: "instagram", label: "Instagram", href: "#" },
    { id: "telegram", label: "Telegram", href: "#" },
    { id: "linkedin", label: "LinkedIn", href: "#" },
    { id: "email", label: "Email", href: "#" },
  ],

  uk: {
    statement: "А ще маю команду тарганчиків у своїй голові, які допомагають мені креативити та тримати все в порядку",
    roach: {
      label: "Тарган із німбом",
      message: "Не поспішайте. Спершу суть, а решта прийде сама.",
    },
    badge: {
      label: "Бейдж із моїм фото. Потягни, клацни — перевернеться.",
      alt: "Катерина Сміян",
    },
    lightHint: "Клацни по тексту, щоб увімкнути світло",
  },
};
