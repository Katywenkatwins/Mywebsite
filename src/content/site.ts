// Загальні тексти сайту. Міняй тут — код чіпати не треба.
export const site = {
  name: "Kateryna Smiian",
  title: "Катерина Сміян · дизайнер візуальних сенсів",
  // TODO(Катя): підтвердь або перепиши опис для пошуковиків одним реченням.
  description: "Дизайн, за яким вас упізнають без логотипа.",
};

// Секції головної (порядок — як на сторінці, за Figma «Look & Feel 12»). id — якір секції.
// hidden: true — секцію тимчасово сховано (немає ні на сторінці, ні в меню).
export const sections = [
  { id: "molecula", label: "Molecula" },
  { id: "about", label: "About" },
  { id: "portfolio", label: "Portfolio" },
  { id: "services", label: "Services" },
  { id: "testimonials", label: "Testimonials", hidden: true },
  { id: "contact", label: "Contact" },
] as const;

// Пункти меню — видимі секції
export const navigation = sections.filter((s) => !("hidden" in s && s.hidden));

// Контакти — одні на весь сайт (іконки в About, вікно «Get in touch»)
export const contacts = [
  { id: "phone", label: "Phone", value: "+380 66 229 32 67", href: "tel:+380662293267" },
  { id: "email", label: "Email", value: "Katerynasmiian@outlook.com", href: "mailto:Katerynasmiian@outlook.com" },
  { id: "telegram", label: "Telegram", value: "@Kate_Smijan", href: "https://t.me/Kate_Smijan" },
  { id: "instagram", label: "Instagram", value: "@kateryna_smiian", href: "https://www.instagram.com/kateryna_smiian/" },
  { id: "whatsapp", label: "WhatsApp", value: "WhatsApp", href: "https://wa.me/qr/JG426JCHX46FF1" },
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
  // Форма у вікні «Get in touch». Поки без сервера: «Send» відкриває лист на Email з контактів, уже заповнений
  form: {
    service: "Service",
    name: "Your name",
    reply: "Email or Telegram",
    message: "Message",
    send: "Send",
    or: "Or write directly:",
  },
  uk: {
    contact: "Зв’язатися",
    contactClose: "Закрити",
    menuLabel: "Головне меню",
    languagesLabel: "Мова",
    soon: "скоро",
    form: {
      service: "Послуга",
      name: "Ваше ім’я",
      reply: "Email або Telegram",
      message: "Повідомлення",
      send: "Надіслати",
      or: "Або напишіть напряму:",
    },
  },
};
