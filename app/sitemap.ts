import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { i18n } from '@/lib/i18n';
import { withTrailingSlash } from '@/lib/metadata';

export const dynamic = 'force-static';

/**
 * v4 §5.4：只列真实存在的语言页面。fallbackLanguage 为 null，
 * de/fr 未翻译页面不生成路由，因此不会出现在 sitemap。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.CANONICAL_ORIGIN ?? 'http://localhost:3000';
  const lastModified = new Date(Number(process.env.SOURCE_DATE_EPOCH ?? 0) * 1000);

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${origin}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: {
          'x-default': `${origin}/`,
          ...Object.fromEntries(
            i18n.languages.map((candidate) => [candidate === 'zh' ? 'zh-CN' : candidate, `${origin}/${candidate}/`]),
          ),
        },
      },
    },
  ];

  for (const lang of i18n.languages) {
    entries.push({
      url: `${origin}/${lang}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: Object.fromEntries(
          i18n.languages.map((candidate) => [candidate === 'zh' ? 'zh-CN' : candidate, `${origin}/${candidate}/`]),
        ),
      },
    });

    for (const page of source.getPages(lang)) {
      const url = withTrailingSlash(page.url);
      const languages = Object.fromEntries(
        i18n.languages.flatMap((candidate) => {
          const alternate = source.getPage(page.slugs, candidate);
          if (!alternate) return [];
          return [[candidate === 'zh' ? 'zh-CN' : candidate, `${origin}${withTrailingSlash(alternate.url)}`]];
        }),
      );
      entries.push({ url: `${origin}${url}`, lastModified, priority: 0.8, alternates: { languages } });
    }
  }

  return entries;
}
