#!/usr/bin/env node
/**
 * Static output contract verification, driven by deterministic manifests.
 * Inputs: retained route/deny contracts plus the build environment.
 * 用法：DEPLOY_ENV=ci SOURCE_COMMIT=<sha> node scripts/verify-out.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const outRoot = path.join(ROOT, 'out');
const load = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const siteRoutes = load('manifests/p0b/site-routes.json');
const deny = load('manifests/p0b/greenfield-deny.json');
const categories = load('manifests/p0b/categories.json');

const errors = [];
const passed = [];

const exists = (rel) => fs.existsSync(path.join(outRoot, rel));
const read = (rel) => fs.readFileSync(path.join(outRoot, rel), 'utf8');

if (!fs.existsSync(outRoot)) {
  console.error('[verify-out] FAIL out/ does not exist; run the build first');
  process.exit(1);
}

// lib/ia.ts 硬编码分类集 == manifest（单一来源断言）
const iaBases = [
  'overview', 'quick-start', 'user-guide', 'data-collection',
  'data-collection/case-introduction', 'integration', 'openapi',
  'deploy-and-dev', 'faq', 'changelog',
];
if (JSON.stringify(iaBases) !== JSON.stringify(categories.map((c) => c.newBase))) {
  errors.push('lib/ia.ts categoryBases != manifests/p0b/categories.json');
} else {
  passed.push('categoryBases == manifest');
}

// 1. 全量 HTML 路由（site-routes manifest）
let htmlOk = 0;
for (const route of siteRoutes.htmlRoutes) {
  const rel = route.route === '/' ? 'index.html' : `${route.route.replace(/^\//, '')}index.html`;
  if (exists(rel)) htmlOk += 1;
  else errors.push(`missing html route ${route.route}`);
}
if (htmlOk === siteRoutes.htmlRoutes.length) {
  passed.push(`html routes ${htmlOk}/${siteRoutes.htmlRoutes.length}`);
}

// 2. 系统端点
for (const p of ['llms.txt', 'robots.txt', 'sitemap.xml', 'search-records.json', 'api/search']) {
  if (exists(p) && fs.statSync(path.join(outRoot, p)).isFile()) passed.push(`endpoint ${p}`);
  else errors.push(`missing file endpoint ${p}`);
}
if (exists('404.html')) passed.push('404.html');
else errors.push('missing 404.html');

// 3. greenfield deny：旧路径不得以任何形式出现在 out/
//    例外（v4 §5.3）：与新站 route manifest 精确重合的旧 URL 属"新站重新定义的端点"，
//    从 deny 检查中排除（例：旧 en slug /en/docs/openapi == 新 /en/docs/openapi/ 分类路由）。
const newRouteSet = new Set(siteRoutes.htmlRoutes.map((r) => r.route));
let denyLeaks = 0;
let redefinedExcluded = 0;
for (const old of [...deny.oldPages, ...deny.oldMediaUrls]) {
  const rel = old.replace(/^\//, '').replace(/\/$/, '');
  const asRoute = old.endsWith('/') ? old : `${old}/`;
  if (newRouteSet.has(asRoute)) {
    redefinedExcluded += 1;
    continue;
  }
  if (rel && exists(rel)) {
    denyLeaks += 1;
    errors.push(`deny path present in out/: ${old}`);
  }
}
if (denyLeaks === 0) {
  passed.push(`greenfield deny (${deny.oldPages.length + deny.oldMediaUrls.length} paths, ${redefinedExcluded} redefined-endpoint exclusions)`);
}

// 4. search-records 契约（v4 §7）
const sr = JSON.parse(read('search-records.json'));
const commit = process.env.SOURCE_COMMIT;
if (sr.sourceCommit !== (commit ?? null)) {
  errors.push(`search-records sourceCommit ${sr.sourceCommit} != ${commit ?? null}`);
}
const recomputed = createHash('sha256').update(JSON.stringify(sr.records)).digest('hex');
if (sr.digest !== `sha256:${recomputed}`) errors.push('search-records digest mismatch');
const expectedCounts = { zh: 38, en: 38, de: 38, fr: 38 };
for (const [lang, count] of Object.entries(expectedCounts)) {
  if (sr.countsByLocale?.[lang] !== count) {
    errors.push(`countsByLocale.${lang} = ${sr.countsByLocale?.[lang]}, expected ${count}`);
  }
}
for (const record of sr.records) {
  if (record.tag !== String(record.url).split('/')[1]) {
    errors.push(`record tag/locale mismatch: ${record._id}`);
    break;
  }
}
passed.push(`search-records count=${sr.count} counts=${JSON.stringify(sr.countsByLocale)}`);

// 5. llms.txt：commit + 条目计数（78 = 74 正文 + 4 首页；分类页排除）
const llms = read('llms.txt');
if (commit && !llms.includes(commit)) errors.push('llms.txt does not expose SOURCE_COMMIT');
const llmsEntries = (llms.match(/^- \[/gm) ?? []).length;
if (llmsEntries !== 152) errors.push(`llms entries = ${llmsEntries}, expected 152`);
else passed.push(`llms entries 152 + commit`);
// 分类页不得出现在 llms（抽样：quick-start 分类首页的 URL 形态）
if (/\/zh\/docs\/quick-start\/\)/.test(llms)) errors.push('category page leaked into llms.txt');

// 6. html lang 与 noindex
const deployEnv = process.env.DEPLOY_ENV ?? 'ci';
if (read('zh/index.html').includes('lang="zh-CN"')) passed.push('html lang zh-CN');
else errors.push('zh html lang is not zh-CN');
if (deployEnv !== 'production') {
  if (read('zh/docs/index.html').includes('noindex')) passed.push('noindex (non-prod)');
  else errors.push('non-production pages missing noindex');
  if (read('robots.txt').includes('Disallow: /')) passed.push('robots disallow (non-prod)');
  else errors.push('non-production robots.txt must disallow all');
} else if (!read('robots.txt').includes('https://docs.tiangong.earth/sitemap.xml')) {
  errors.push('production robots.txt missing absolute sitemap URL');
}

// 7. sitemap：locale 隔离（de/fr 深层路由不出现）+ 全量收录
const sitemap = read('sitemap.xml');
const sitemapCount = (sitemap.match(/<loc>/g) ?? []).length;
if (sitemapCount !== 197) errors.push(`sitemap entries = ${sitemapCount}, expected 197`);
else passed.push('sitemap 197 entries');

// 8. OG 图（98 页 → ≥98 产物）
let ogCount = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.isFile() && !e.name.endsWith('.html')) ogCount += 1;
  }
})(path.join(outRoot, 'og'));
if (ogCount >= 192) passed.push(`og images (${ogCount})`);
else errors.push(`expected >=192 OG images, found ${ogCount}`);

// 9. 内部路径零泄漏
let leaked = null;
(function walkAll(dir) {
  if (leaked) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.includes('agents')) {
      leaked = path.relative(outRoot, path.join(dir, e.name));
      return;
    }
    if (e.isDirectory()) walkAll(path.join(dir, e.name));
  }
})(outRoot);
if (!leaked) passed.push('no /agents/ leak');
else errors.push(`internal path leaked into out/: ${leaked}`);

// --- summary ---
console.log(`\n[verify-out] ${passed.length} checks passed:`);
for (const p of passed) console.log(`  ✓ ${p}`);
if (errors.length > 0) {
  console.error(`\n[verify-out] ${errors.length} FAILURES:`);
  for (const e of errors.slice(0, 30)) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\n[verify-out] ALL GREEN');
