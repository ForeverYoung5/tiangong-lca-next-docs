import { source } from '@/lib/source';
import { isCategoryIndex } from '@/lib/ia';
import { i18n } from '@/lib/i18n';

export const revalidate = false;

const ORIGIN = process.env.CANONICAL_ORIGIN ?? 'https://docs.tiangong.earth';
const SECTION_TITLES: Record<string, string> = {
  zh: 'Chinese (zh)',
  en: 'English (en)',
  de: 'Deutsch (de)',
  fr: 'Français (fr)',
};

/**
 * v4 §3.3/§2：llms.txt 暴露构建 commit（post-deploy 回读契约），
 * 只列真实公开正文与首页（分类页 llms:false）。
 * 格式与旧 Docusaurus 产物保持兼容（locale 分节 + 绝对 URL + 描述）。
 */
export function GET() {
  const commit = process.env.SOURCE_COMMIT ?? 'unknown';
  const lines: string[] = [
    '# TianGong LCA Documentation',
    '',
    'Public documentation index for TianGong LCA users, integrators, and AI retrieval systems.',
    '',
    `Source site: ${ORIGIN}`,
    'Source repository: https://github.com/linancn/tiangong-lca-next-docs',
    `Source commit: ${commit}`,
    'Publication scope: public docs only (zh/en full pages, de/fr reviewed landing); internal agent, plan, incident, TODO, and governance execution records are excluded.',
  ];

  for (const lang of i18n.languages) {
    const pages = source
      .getPages(lang)
      .filter((page) => !isCategoryIndex(page.slugs));
    if (pages.length === 0) continue;

    lines.push('', `## ${SECTION_TITLES[lang] ?? lang}`, '');
    for (const page of pages) {
      const url = `${ORIGIN}${page.url}${page.url.endsWith('/') ? '' : '/'}`;
      const title = page.data.title;
      const desc = (page.data.description ?? title).replace(/\s+/g, ' ').trim();
      const truncated = desc.length > 160 ? `${desc.slice(0, 157)}...` : desc;
      lines.push(`- [${title}](${url}) - ${truncated}`);
    }
  }

  return new Response(`${lines.join('\n')}\n`);
}
