import type { MetadataRoute } from "next";

// Проміжна версія сайту: просимо пошуковики не індексувати. Коли сайт буде готовий — дозволити.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
