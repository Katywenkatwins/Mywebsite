// Загальні тексти сайту. Міняй тут — код чіпати не треба.
export const site = {
  name: "Kateryna Smiian",
  title: "Катерина Сміян · дизайнер візуальних сенсів",
  // TODO(Катя): підтвердь або перепиши опис для пошуковиків одним реченням.
  description: "Дизайн, за яким вас упізнають без логотипа.",
};

// Пункти меню в hero (як у макеті Figma). id — якір секції на сторінці.
export const navigation = [
  { id: "molecula", label: "Molecula" },
  { id: "cases", label: "Cases" },
  { id: "testimonials", label: "Testimonials" },
  { id: "services", label: "Services" },
  { id: "about", label: "About" },
] as const;

// Фіксовані елементи по всьому сайту: правий верхній кут
export const chrome = {
  contact: "Get in touch",
  contactClose: "Close",
  menuLabel: "Main menu",
  languagesLabel: "Language",
  // code — що на кнопці; current — поточна мова сайту; soon — версії ще немає (показуємо, але не перемикаємо)
  languages: [
    { code: "UA", name: "Українська", soon: true },
    { code: "EN", name: "English", current: true },
  ],
  soon: "coming soon",
  uk: {
    contact: "Зв’язатися",
    contactClose: "Закрити",
    menuLabel: "Головне меню",
    languagesLabel: "Мова",
    soon: "скоро",
  },
};
