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
