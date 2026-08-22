#!/usr/bin/env node
/**
 * P2 content-check（v4 §8.2）：37+37 源页面的正文吸收验证。
 * 校验：目标文件存在、旧正文行（归一化后）全部被新页面吸收、
 * 旧语法零残留、媒体引用完整、产物计数精确。
 * 不比较旧/新 URL 或锚点（greenfield 契约：锚点由新页面重新生成）。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const load = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const inventory = load('manifests/p0b/inventory.json');
const mediaManifest = load('manifests/p0b/media.json');
const matrix = load('manifests/p0b/page-locale-matrix.json');

const errors = [];
const checked = [];

function normalizeLine(line) {
  return line
    .replace(/^(\s*)```([A-Za-z][\w+-]*)$/, (m, i, l) => {
      const n = l.toLowerCase();
      return `${i}\`\`\`${n === 'env' ? 'dotenv' : n}`;
    }) // 围栏语言归一化
    .replace(/\s*\{#[^}]+\}\s*$/, '') // 显式 heading ID
    .replace(/(!?\[[^\]]*\]\()[^)]*(\))/g, '$1URL$2') // 链接/图片 URL → 占位
    .replace(/\s+/g, ' ')
    .trim();
}

function contentLines(text) {
  const noFm = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  return noFm
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    // 跳过结构性元素：JSX/iframe 块（由 iframe-to-videoembed 变换吸收，另有专项断言）
    .filter((l) => (!l.startsWith('<') && !l.startsWith('src=') && !/^(scrolling|border|frameborder|framespacing|allowfullscreen)=/.test(l)) || l.startsWith('<VideoEmbed'))
    .filter((l) => !/^#\s/.test(l)) // H1 → title frontmatter（合法迁移）
    .filter((l) => !/^[a-zA-Z-]+:\s*['"]?[^'"]*['"]?[,]?$/.test(l)) // JSX 样式属性行（含数字值）
    .filter((l) => !/^}+[,]?$/.test(l) && l !== 'style={{') // JSX 结束括号/样式开头
    .map(normalizeLine)
    .filter((l) => l.length > 0);
}

for (const page of inventory.pages) {
  for (const [locale, suffix] of [['zh', '.mdx'], ['en', '.en.mdx']]) {
    const src = page[locale];
    if (!src) continue;
    const target = path.join(ROOT, 'content/docs', `${page.newPath}${suffix}`);
    if (!fs.existsSync(target)) {
      errors.push(`${locale} target missing: content/docs/${page.newPath}${suffix}`);
      continue;
    }
    const oldText = fs.readFileSync(path.join(ROOT, src.sourcePath), 'utf8');
    const newText = fs.readFileSync(target, 'utf8');
    const newNorm = contentLines(newText).join('\n');

    let absorbed = 0;
    let total = 0;
    for (const line of contentLines(oldText)) {
      total += 1;
      if (newNorm.includes(line)) absorbed += 1;
      else if (errors.length < 20) errors.push(`line not absorbed [${page.id}.${locale}]: ${line.slice(0, 80)}`);
    }
    checked.push({ id: page.id, locale, total, absorbed });
  }
}

// 旧语法零残留
const syntaxChecks = [
  [/\{#[^}]+\}/, 'explicit heading id'],
  [/^sidebar_position:/m, 'sidebar_position frontmatter'],
  [/<iframe[\s>]/, 'raw iframe'],
  [/\]\(\.\/?img\//, 'relative img ref'],
];
const allMdx = [];
function walk(dir) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel);
    else if (e.name.endsWith('.mdx')) allMdx.push(rel);
  }
}
walk('content/docs');
for (const file of allMdx) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const [pattern, label] of syntaxChecks) {
    if (pattern.test(text)) errors.push(`legacy syntax (${label}) remains in ${file}`);
  }
  if (/title: undefined/.test(text)) errors.push(`undefined title in ${file}`);
}

// 媒体：引用到的资产必须存在；orphan 不得出现
const assetFiles = new Set(
  (function walkAssets(dir) {
    const out = [];
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return out;
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) out.push(...walkAssets(rel));
      else out.push(rel.replace(/^public\//, ''));
    }
    return out;
  })('public/assets/docs'),
);
for (const m of mediaManifest.media) {
  const expected = m.referencedBy.length > 0;
  const present = assetFiles.has(m.targetAssetPath.replace(/^\//, ''));
  if (expected && !present) errors.push(`referenced media missing: ${m.targetAssetPath}`);
  if (!expected && present) errors.push(`orphan media present: ${m.targetAssetPath}`);
}
const orphanCount = mediaManifest.media.filter((m) => m.referencedBy.length === 0).length;
const referencedCount = mediaManifest.media.length - orphanCount;
if (assetFiles.size !== referencedCount) {
  errors.push(`asset count ${assetFiles.size} != referenced media ${referencedCount}`);
}

// 计数：98 mdx（37 zh + 37 en + 10×2 分类 + 4 首页）
const zh = allMdx.filter((f) => !/\.(en|de|fr)\.mdx$/.test(f)).length;
const en = allMdx.filter((f) => /\.en\.mdx$/.test(f)).length;
const de = allMdx.filter((f) => /\.de\.mdx$/.test(f)).length;
const fr = allMdx.filter((f) => /\.fr\.mdx$/.test(f)).length;
if (zh !== 48) errors.push(`zh mdx = ${zh}, expected 48 (37 pages + 10 categories + 1 index)`);
if (en !== 48) errors.push(`en mdx = ${en}, expected 48`);
if (de !== 1 || fr !== 1) errors.push(`de/fr mdx = ${de}/${fr}, expected 1/1`);

const totalLines = checked.reduce((a, c) => a + c.total, 0);
const absorbedLines = checked.reduce((a, c) => a + c.absorbed, 0);
console.log(
  `[content-check] pages=${checked.length} proseLines=${totalLines} absorbed=${absorbedLines} mdx(zh/en/de/fr)=${zh}/${en}/${de}/${fr} assets=${assetFiles.size} orphans=${orphanCount}`,
);
if (errors.length > 0) {
  console.error(`[content-check] ${errors.length} FAILURES:`);
  for (const e of errors.slice(0, 25)) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('[content-check] ALL GREEN');
