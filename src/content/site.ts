// Загальні тексти сайту. Міняй тут — код чіпати не треба.
export const site = {
  name: "Kateryna Smiian",
  title: "Катерина Сміян · дизайнер візуальних сенсів",
  // TODO(Катя): підтвердь або перепиши опис для пошуковиків одним реченням.
  description: "Дизайн, за яким вас упізнають без логотипа.",
};

// Пункти меню (порядок — як секції на сторінці, за Figma «Look & Feel 12»). id — якір секції.
export const navigation = [
  { id: "molecula", label: "Molecula" },
  { id: "about", label: "About" },
  { id: "cases", label: "Cases" },
  { id: "services", label: "Services" },
  { id: "testimonials", label: "Testimonials" },
] as const;

// Фіксовані елементи по всьому сайту: правий верхній кут
export const chrome = {
  // підпис угорі ліворуч — посилання нагору сторінки
  signature: "kateryna smiian",
  contact: "Get in touch",
  contactClose: "Close",
  menuLabel: "Main menu",
  // підказка для скрінрідера до прогрес-бару біля меню
  progressLabel: "Page sections",
  heroLabel: "Top",
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
