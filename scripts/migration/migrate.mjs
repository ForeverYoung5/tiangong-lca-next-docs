#!/usr/bin/env node
/**
 * P2 内容迁移执行器（v4 §8.2 migrate + navigation）
 * 输入：docs/**（zh 源）、i18n/en/**（en 镜像）、manifests/p0b/*.json（P0B 契约）
 * 输出：content/docs/**（dot-locale 契约）、public/assets/docs/**（hash 命名空间媒体）、
 *       manifests/p2/migration-report.json（sourcePath→targetPath + transforms 证据）
 *
 * 变换：frontmatter（sidebar_* 剥离 / H1→title）、显式 heading ID 移除、
 *       iframe JSX→VideoEmbed、图片引用→/assets/docs/<hash8>/<slug>、
 *       内部链接→新 IA 路径（相对链接保持相对，绝对链接带 locale 前缀）。
 * 支持 --dry-run；目标源文件在 content-check 全绿前不删除。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry-run');

const load = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const matrix = load('manifests/p0b/page-locale-matrix.json');
const categories = load('manifests/p0b/categories.json');
const mediaManifest = load('manifests/p0b/media.json');
const inventory = load('manifests/p0b/inventory.json');

const EN_BASE = 'i18n/en/docusaurus-plugin-content-docs/current';

// 旧目标 → 新路径（doc id / slug 覆盖 / 分类 slug）
const oldIdToNew = new Map(matrix.map((m) => [m.id, m.newPath]));
const slugOverrides = new Map([
  ['/', 'overview/intro'],
  ['/docs/openapi/tidas-package-import', 'openapi/tidas-package-import'],
]);
const categorySlugToNew = new Map(categories.map((c) => [c.oldSlug, c.newBase]));

// 媒体：sourcePath → targetAssetPath（排除 orphan）
const mediaPathMap = new Map();
const orphanHashes = new Set(
  mediaManifest.summary.orphanMedia.map((o) => o.sha256 ?? o.target.split('/')[3]),
);
for (const m of mediaManifest.media) {
  if (m.referencedBy.length === 0) continue;
  for (const sp of m.sourcePaths) mediaPathMap.set(sp, m);
}

const report = { pages: [], media: [], warnings: [] };
const norm = (p) => path.posix.normalize(p);

// ---------------------------------------------------------------------------
// 单页变换
// ---------------------------------------------------------------------------
function transformPage(page, pageInfo, locale) {
  const src = pageInfo.sourcePath;
  const newPathOfPage = page.newPath;
  let text = fs.readFileSync(path.join(ROOT, src), 'utf8');
  const srcDir = path.posix.dirname(src);
  const newRel = locale === 'zh' ? `${newPathOfPage}.mdx` : `${newPathOfPage}.en.mdx`;
  const newDir = path.posix.dirname(newRel);
  const transforms = [];

  // 1. frontmatter 解析与剥离
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const fm = {};
  if (fmMatch) {
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const kv = line.match(/^([a-zA-Z_][\w-]*):\s*(.*)$/);
      if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
    }
    text = text.slice(fmMatch[0].length);
    transforms.push('strip-sidebar-frontmatter');
  }
  // sidebar_* / slug / tags 丢弃；H1 → title（无 title frontmatter 时）
  if (!fm.title) {
    const h1 = text.match(/^#\s+(.+)\r?\n?/m);
    if (h1) {
      fm.title = h1[1].trim();
      text = text.replace(h1[0], '');
      transforms.push('h1-to-title');
    }
  }

  // 1.5 代码围栏语言标签归一化（Prism 宽松，Shiki 严格；含缩进围栏）
  // 小写化 + Shiki 无 env 语法（Docusaurus/Prism 按纯文本渲染）→ dotenv
  text = text.replace(/^(\s*)```([A-Za-z][\w+-]*)/gm, (m, indent, lang) => {
    const normalized = lang.toLowerCase();
    return `${indent}\`\`\`${normalized === 'env' ? 'dotenv' : normalized}`;
  });

  // 2. 显式 heading ID 移除（锚点由新页面标题重新生成）
  text = text.replace(/(\s)\{#[^}]+\}(\s*)$/gm, '$1$2');
  transforms.push('strip-explicit-heading-ids');

  // 3. iframe JSX → VideoEmbed（demonstrations 页）
  if (/<iframe[\s>]/.test(text)) {
    const title =
      locale === 'zh' ? 'TianGong LCA 平台操作演示' : 'TianGong LCA platform demo video';
    text = text.replace(/<div[\s\S]*?<iframe[^>]*\ssrc="([^"]+)"[\s\S]*?<\/div>/g, (m, raw) => {
      const srcUrl = raw.startsWith('//') ? `https:${raw}` : raw;
      return `<VideoEmbed\n  src="${srcUrl}"\n  title="${title}"\n/>`;
    });
    transforms.push('iframe-to-videoembed');
  }

  // 4. 图片引用 → hash 命名空间绝对路径（含 %20 解码，v4 §8.2 空格文件名规范）
  text = text.replace(/(!\[[^\]]*\]\()([^)\s]+)([^)]*\))/g, (m, pre, ref, tail) => {
    if (/^(https?:)?\/\//.test(ref) || ref.startsWith('/')) return m;
    const abs = norm(path.posix.join(srcDir, decodeURIComponent(ref.split(/\s+/)[0])));
    const media = mediaPathMap.get(abs);
    if (!media) {
      report.warnings.push(`unresolved image ${ref} in ${src}`);
      return m;
    }
    media.used = true;
    return `${pre}${media.targetAssetPath}${tail}`;
  });
  text = text.replace(/<img([^>]+)src="([^"]+)"([^>]*)>/g, (m, a, ref, b) => {
    if (/^(https?:)?\/\//.test(ref)) return m;
    const abs = norm(path.posix.join(srcDir, ref));
    const media = mediaPathMap.get(abs);
    if (!media) return m;
    media.used = true;
    return `<img${a}src="${media.targetAssetPath}"${b}>`;
  });
  transforms.push('images-to-asset-namespace');

  // 5. 内部链接 → 新 IA 路径
  text = text.replace(/(?<!!)(\[[^\]]*\]\()([^)\s]+)([^)]*\))/g, (m, pre, ref, tail) => {
    if (/^(https?:|mailto:|#)/.test(ref)) return m;
    const anchorMatch = ref.match(/^(.*?)(#[^#]*)?$/);
    const target = anchorMatch[1];
    const anchor = anchorMatch[2] ?? '';
    if (!target) return m; // 纯锚点

    let newUrl = null;
    if (target.startsWith('/')) {
      // 绝对路径（en 页面含 /en 前缀）：slug 覆盖 → 分类 slug → doc id
      let t = target;
      if (locale === 'en' && (t === '/en' || t.startsWith('/en/'))) t = t.slice(3);
      let newBase = slugOverrides.get(t) ?? categorySlugToNew.get(t);
      if (!newBase && oldIdToNew.has(t.slice(1))) newBase = oldIdToNew.get(t.slice(1));
      if (newBase) newUrl = `/${locale}/docs/${newBase}/`;
    } else {
      // 相对路径：媒体文件（如图片下载链接）→ 资产命名空间
      const mediaAbs = norm(path.posix.join(path.posix.dirname(src), decodeURIComponent(target)));
      const media = mediaPathMap.get(mediaAbs);
      if (media) {
        media.used = true;
        return `${pre}${media.targetAssetPath}${anchor}${tail}`;
      }
      // 相对路径：按旧目录解析目标 id → 新路径 → 按新目录重算相对链接
      const oldTarget = norm(path.posix.join(path.posix.dirname(src), target));
      const oldId = oldTarget
        .replace(/^docs\//, '')
        .replace(/^i18n\/en\/docusaurus-plugin-content-docs\/current\//, '')
        .replace(/\.md$/, '');
      const newBase = oldIdToNew.get(oldId);
      if (newBase) {
        const rel = path.posix.relative(newDir, newBase) || path.posix.basename(newBase);
        newUrl = rel.startsWith('.') ? `${rel}/` : `./${rel}/`;
      }
    }
    if (!newUrl) {
      report.warnings.push(`unresolved link ${ref} in ${src}`);
      return m;
    }
    transforms.push('links-to-new-ia');
    return `${pre}${newUrl}${anchor}${tail}`;
  });

  // 6. 组装输出
  const outFm = [`title: ${JSON.stringify(fm.title ?? page.id)}`];
  if (fm.description) outFm.push(`description: ${JSON.stringify(fm.description)}`);
  const out = `---\n${outFm.join('\n')}\n---\n\n${text.trimStart()}`;

  report.pages.push({
    locale,
    sourcePath: src,
    targetPath: `content/docs/${newRel}`,
    sourceHash: pageInfo.sha256,
    transforms: [...new Set(transforms)],
  });

  if (!DRY) {
    fs.mkdirSync(path.join(ROOT, 'content/docs', newDir), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'content/docs', newRel), out);
  }
}

// ---------------------------------------------------------------------------
// 执行：74 个源页面
// ---------------------------------------------------------------------------
for (const page of inventory.pages) {
  if (page.zh) transformPage(page, page.zh, 'zh');
  if (page.en) transformPage(page, page.en, 'en');
}

// ---------------------------------------------------------------------------
// 媒体复制（hash 命名空间；orphan 不进入公开输出）
// ---------------------------------------------------------------------------
for (const media of mediaManifest.media) {
  if (media.referencedBy.length === 0) continue;
  const targetAbs = path.join(ROOT, 'public', media.targetAssetPath.replace(/^\//, ''));
  report.media.push({
    targetAssetPath: media.targetAssetPath,
    sourceCount: media.sourcePaths.length,
    referencedBy: media.referencedBy.length,
    sha256: media.sha256,
  });
  if (!DRY) {
    fs.mkdirSync(path.dirname(targetAbs), { recursive: true });
    fs.copyFileSync(path.join(ROOT, media.sourcePaths[0]), targetAbs);
  }
}

// ---------------------------------------------------------------------------
// 生成：docs 首页（四语言）、分类首页（zh/en）、meta.json 树
// ---------------------------------------------------------------------------
const docsIndex = {
  zh: { title: 'TianGong LCA 文档', description: 'TianGong LCA 生命周期评价平台文档', body: '欢迎阅读 TianGong LCA 文档。使用左侧导航浏览各章节：平台概览、快速开始、用户指南、数据收集、集成与扩展、OpenAPI、部署与开发、常见问题与更新日志。' },
  en: { title: 'TianGong LCA Documentation', description: 'Documentation for the TianGong LCA platform', body: 'Welcome to the TianGong LCA documentation. Use the navigation to browse sections: platform overview, quick start, user guide, data collection, integrations, OpenAPI, deployment & development, FAQ, and changelog.' },
  de: { title: 'TianGong LCA Dokumentation', description: 'Dokumentation der TianGong LCA Plattform', body: 'Willkommen bei der TianGong LCA Dokumentation. Diese Startseite ist die deutschsprachige Landing-Page; weitere Seiten folgen nach Übersetzung und Prüfung. Die vollständige Dokumentation ist auf Chinesisch und Englisch verfügbar.' },
  fr: { title: 'Documentation TianGong LCA', description: 'Documentation de la plateforme TianGong LCA', body: "Bienvenue sur la documentation de TianGong LCA. Cette page d'accueil est la landing page francophone ; les autres pages suivront après traduction et relecture. La documentation complète est disponible en chinois et en anglais." },
};
for (const [locale, c] of Object.entries(docsIndex)) {
  const name = locale === 'zh' ? 'index.mdx' : `index.${locale}.mdx`;
  const out = `---\ntitle: ${JSON.stringify(c.title)}\ndescription: ${JSON.stringify(c.description)}\n---\n\n${c.body}\n`;
  if (!DRY) fs.writeFileSync(path.join(ROOT, 'content/docs', name), out);
  report.pages.push({ locale, sourcePath: '(new)', targetPath: `content/docs/${name}`, transforms: ['generated-landing'] });
}

// 分类首页（zh/en；de/fr 不发布分类页）
for (const cat of categories) {
  for (const locale of ['zh', 'en']) {
    const title = locale === 'zh' ? cat.titleZh : cat.titleEn;
    const desc = locale === 'zh' ? cat.descriptionZh : cat.descriptionEn;
    const name = locale === 'zh' ? 'index.mdx' : 'index.en.mdx';
    const out = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(desc)}\n---\n\n${desc}\n`;
    const dir = path.join(ROOT, 'content/docs', cat.newBase);
    if (!DRY) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, name), out);
    }
    report.pages.push({
      locale,
      sourcePath: `(generated-index ${cat.oldSlug})`,
      targetPath: `content/docs/${cat.newBase}/${name}`,
      transforms: ['generated-category-index'],
    });
  }
}

// meta.json 树（按分类顺序；子分类在父分类内排列）
const catOrder = categories.filter((c) => c.depth === 0).map((c) => c.newBase);
const rootPages = ['index', ...catOrder];
const metaFiles = {
  'content/docs/meta.json': { pages: rootPages },
  'content/docs/meta.en.json': { pages: rootPages },
  'content/docs/meta.de.json': { pages: ['index'] },
  'content/docs/meta.fr.json': { pages: ['index'] },
};
for (const cat of categories) {
  const items = matrix.filter((m) => m.newPath.startsWith(`${cat.newBase}/`) &&
    !m.newPath.slice(cat.newBase.length + 1).includes('/'));
  const children = categories.filter((c) => c.parent === cat.oldSlug).map((c) => c.newBase.split('/').pop());
  const pages = ['index', ...items.map((m) => m.newPath.split('/').pop()), ...children];
  metaFiles[`content/docs/${cat.newBase}/meta.json`] = { title: cat.titleZh, pages };
  metaFiles[`content/docs/${cat.newBase}/meta.en.json`] = { title: cat.titleEn, pages };
}
for (const [file, data] of Object.entries(metaFiles)) {
  if (!DRY) fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(data, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// 报告
// ---------------------------------------------------------------------------
fs.mkdirSync(path.join(ROOT, 'manifests/p2'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, 'manifests/p2/migration-report.json'),
  `${JSON.stringify({ dryRun: DRY, pages: report.pages, media: report.media, warnings: report.warnings }, null, 2)}\n`,
);

console.log(
  `[migrate] pages=${report.pages.length} media=${report.media.length} warnings=${report.warnings.length}${DRY ? ' (dry-run)' : ''}`,
);
for (const w of report.warnings.slice(0, 12)) console.warn(`[migrate] WARN ${w}`);
if (report.warnings.length > 12) console.warn(`[migrate] ... ${report.warnings.length - 12} more warnings`);
if (report.warnings.length > 0) process.exit(1);
