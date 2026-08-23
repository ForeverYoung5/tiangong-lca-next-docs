import { i18n } from '@/lib/i18n';

export const siteOrigin = process.env.CANONICAL_ORIGIN ?? 'https://docs.tiangong.earth';

export const localeMetadata: Record<string, { title: string; description: string; openGraphLocale: string }> = {
  zh: {
    title: 'TianGong LCA Docs',
    description: 'TianGong LCA 生命周期评价平台文档：数据、建模、LCIA、评审、协作与开放集成。',
    openGraphLocale: 'zh_CN',
  },
  en: {
    title: 'TianGong LCA Docs',
    description: 'Documentation for TianGong LCA data, modelling, LCIA, review, collaboration, and open integrations.',
    openGraphLocale: 'en_US',
  },
  de: {
    title: 'TianGong LCA Docs',
    description: 'Dokumentation zu Daten, Modellierung, LCIA, Prüfung, Zusammenarbeit und offenen Integrationen in TianGong LCA.',
    openGraphLocale: 'de_DE',
  },
  fr: {
    title: 'TianGong LCA Docs',
    description: 'Documentation des données, de la modélisation, de la LCIA, de la révision, de la collaboration et des intégrations TianGong LCA.',
    openGraphLocale: 'fr_FR',
  },
};

export function withTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}

export function languageAlternates(path = ''): Record<string, string> {
  const suffix = path.length === 0 ? '' : `/${path.replace(/^\/+|\/+$/g, '')}`;
  return {
    'x-default': '/',
    ...Object.fromEntries(i18n.languages.map((lang) => [lang === 'zh' ? 'zh-CN' : lang, `/${lang}${suffix}/`])),
  };
}

export function pageImagePath(lang: string, slugs: string[]): string {
  return `/${['og', lang, 'docs', ...slugs, 'image.png'].filter(Boolean).join('/')}`;
}
