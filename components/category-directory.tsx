import Link from 'next/link';
import { findParent, type Item } from 'fumadocs-core/page-tree';
import { source } from '@/lib/source';

type Language = 'zh' | 'en' | 'de' | 'fr';

interface CategoryDirectoryProps {
  lang: string;
  category: string;
}

const directoryCopy: Record<Language, { label: string; singular: string; plural: string }> = {
  zh: { label: '内容目录', singular: '个主题', plural: '个主题' },
  en: { label: 'In this section', singular: 'topic', plural: 'topics' },
  de: { label: 'In diesem Abschnitt', singular: 'Thema', plural: 'Themen' },
  fr: { label: 'Dans cette section', singular: 'rubrique', plural: 'rubriques' },
};

function Arrow() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 20 20" width="16">
      <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function canonicalUrl(url: string) {
  return url.endsWith('/') ? url : `${url}/`;
}

function pageSlugs(url: string, language: Language) {
  const prefix = `/${language}/docs/`;
  if (!url.startsWith(prefix)) return [];
  return url.slice(prefix.length).replace(/\/$/, '').split('/').filter(Boolean);
}

function cleanSummary(value: string) {
  return value
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstSentence(value: string) {
  const cleaned = cleanSummary(value);
  const sentenceEnd = cleaned.slice(0, 181).search(/[。！？.!?](?:\s|$)/);
  if (sentenceEnd >= 0) return cleaned.slice(0, sentenceEnd + 1);
  if (cleaned.length <= 160) return cleaned;

  const candidate = cleaned.slice(0, 157);
  const wordBreak = candidate.lastIndexOf(' ');
  return `${candidate.slice(0, wordBreak > 96 ? wordBreak : candidate.length).trimEnd()}…`;
}

function summaryFor(item: Item, language: Language) {
  const page = source.getPage(pageSlugs(item.url, language), language);
  const description = page?.data.description?.trim();
  if (description) return description;

  const firstContent = page?.data.structuredData?.contents.find((entry) => entry.content.trim().length > 0)?.content;
  if (firstContent) return firstSentence(firstContent);
  return '';
}

export function CategoryDirectory({ lang, category }: CategoryDirectoryProps) {
  const language: Language = lang in directoryCopy ? (lang as Language) : 'en';
  const tree = source.getPageTree(language);
  const categorySlugs = category.split('/').filter(Boolean);
  const categoryPage = source.getPage(categorySlugs, language);
  const categoryUrl = categoryPage?.url ?? `/${language}/docs/${category}`;
  const folder = findParent(tree, categoryUrl);
  const items = (folder?.children ?? []).flatMap((node) => {
    if (node.type === 'page') return [node];
    if (node.type === 'folder') {
      const index = node.index ?? node.children.find((child): child is Item => child.type === 'page');
      return index ? [index] : [];
    }
    return [];
  }).filter((item) => item.url !== categoryUrl);
  const copy = directoryCopy[language];
  const countLabel = language === 'zh'
    ? `${items.length} ${copy.plural}`
    : `${items.length} ${items.length === 1 ? copy.singular : copy.plural}`;
  const columnClass = items.length > 8 ? 'grid-cols-2 max-[48rem]:grid-cols-1' : 'grid-cols-1';

  return (
    <section className="not-prose mt-8 pb-3" data-category-directory={category} data-category-count={items.length}>
      <header className="mb-3 flex items-center justify-between gap-4 border-b border-fd-border pb-3">
        <h2 className="m-0 text-sm font-semibold tracking-[-0.01em]">{copy.label}</h2>
        <span className="shrink-0 text-xs text-fd-muted-foreground">{countLabel}</span>
      </header>
      <ul className={`m-0 grid list-none gap-[2px] overflow-hidden rounded-[2px] border-2 border-fd-border bg-fd-border p-0 ${columnClass}`}>
        {items.map((item, index) => {
          const summary = summaryFor(item, language);
          const fillLastRow = items.length > 8 && items.length % 2 === 1 && index === items.length - 1;

          return (
            <li className={`m-0 min-w-0 bg-fd-background p-0 ${fillLastRow ? 'col-span-2 max-[48rem]:col-span-1' : ''}`} data-category-item key={item.url}>
              <Link
                className="grid min-h-24 grid-cols-[minmax(0,1fr)_auto] content-center items-center gap-4 p-4 text-fd-foreground no-underline transition-colors duration-100 hover:bg-fd-accent"
                href={canonicalUrl(item.url)}
              >
                <span className="grid min-w-0 gap-1">
                  <strong className="text-[0.9375rem] leading-5 font-semibold">{item.name}</strong>
                  {summary ? <span className="text-sm leading-5 text-fd-muted-foreground" data-category-summary>{summary}</span> : null}
                </span>
                <span className="text-fd-primary">
                  <Arrow />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
