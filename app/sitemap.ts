import type { MetadataRoute } from 'next';

const BASE_URL = 'https://hoanglonghomestay.vn';
const LOCALES  = ['vi', 'en', 'zh', 'ko', 'ja'] as const;
const ROUTES   = [
  { path: '',         changeFrequency: 'weekly'  as const, priority: 1.0 },
  { path: '/rooms',   changeFrequency: 'monthly' as const, priority: 0.85 },
  { path: '/booking', changeFrequency: 'monthly' as const, priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      entries.push({
        url:             `${BASE_URL}/${locale}${route.path}`,
        lastModified:    now,
        changeFrequency: route.changeFrequency,
        priority:        route.priority,
      });
    }
  }

  return entries;
}
