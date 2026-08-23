#!/usr/bin/env node
/**
 * Algolia search reconciliation for the deployed source commit.
 *
 * 数据源：部署站点（或本地 out/）的 /search-records.json——不是本地构建产物，
 * 保证与 live 站点 commit 一致（v4：只有生产域暴露同一 sourceCommit 后才写索引）。
 *
 * 流程：契约校验 → replaceAllObjects（fumadocs sync）→ 等待远端完成 →
 *       写入 sourceCommit 元数据 → 按 locale smoke query（隔离断言）。
 * 失败语义（v4 §7.1）：提交前失败保持现状退出；任何失败 exit 1 由调用方标记 blocked。
 *
 * 用法：
 *   ALGOLIA_APP_ID=.. ALGOLIA_WRITE_KEY=.. ALGOLIA_INDEX_NAME=tiangong-lca-docs \
 *   EXPECTED_SHA=<40hex> node scripts/search-sync.mjs --from https://docs.tiangong.earth
 *   # 或本地产物：node scripts/search-sync.mjs --local-out（校验 EXPECTED_SHA 与文件一致）
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { algoliasearch } from 'algoliasearch';
import { sync } from 'fumadocs-core/search/algolia';

const args = process.argv.slice(2);
const fromOrigin = args.includes('--from') ? args[args.indexOf('--from') + 1] : null;
const localOut = args.includes('--local-out');

const APP_ID = process.env.ALGOLIA_APP_ID;
const WRITE_KEY = process.env.ALGOLIA_WRITE_KEY;
const INDEX_NAME = process.env.ALGOLIA_INDEX_NAME;
const EXPECTED_SHA = process.env.EXPECTED_SHA ?? null;

const problems = [];
if (!APP_ID || !WRITE_KEY) {
  console.error('[search-sync] ALGOLIA_APP_ID / ALGOLIA_WRITE_KEY required (production environment)');
  process.exit(1);
}
if (INDEX_NAME !== 'tiangong-lca-docs') {
  console.error(`[search-sync] ALGOLIA_INDEX_NAME must be 'tiangong-lca-docs', got ${JSON.stringify(INDEX_NAME)}`);
  process.exit(1);
}

// --- 1. 获取并校验 search-records 契约 ---
let sr;
if (localOut) {
  sr = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'out/search-records.json'), 'utf8'));
} else if (fromOrigin) {
  const res = await fetch(`${fromOrigin.replace(/\/$/, '')}/search-records.json`);
  if (!res.ok) {
    console.error(`[search-sync] fetch search-records.json from ${fromOrigin} -> HTTP ${res.status}`);
    process.exit(1);
  }
  sr = await res.json();
} else {
  console.error('[search-sync] need --from <origin> or --local-out');
  process.exit(1);
}

if (sr.schemaVersion !== 1) problems.push(`schemaVersion ${sr.schemaVersion}`);
const digest = `sha256:${createHash('sha256').update(JSON.stringify(sr.records)).digest('hex')}`;
if (sr.digest !== digest) problems.push('digest mismatch');
if (sr.count !== sr.records.length) problems.push('count mismatch');
if (EXPECTED_SHA && sr.sourceCommit !== EXPECTED_SHA) {
  problems.push(`sourceCommit ${sr.sourceCommit} != expected ${EXPECTED_SHA}`);
}
for (const record of sr.records) {
  if (record.tag !== String(record.url).split('/')[1]) {
    problems.push(`tag/locale mismatch: ${record._id}`);
    break;
  }
}
if (problems.length > 0) {
  console.error(`[search-sync] contract validation failed: ${problems.join('; ')}`);
  process.exit(1);
}
console.log(`[search-sync] records ok: commit=${sr.sourceCommit} count=${sr.count} counts=${JSON.stringify(sr.countsByLocale)}`);

// --- 2. replaceAllObjects（fumadocs sync，内部串行等待远端任务完成）---
const client = algoliasearch(APP_ID, WRITE_KEY);
await sync(client, {
  indexName: INDEX_NAME,
  documents: sr.records,
});
console.log(`[search-sync] replaceAllObjects done: ${sr.count} records -> ${INDEX_NAME}`);

// --- 3. sentinel 回读（v4 §7.1 第 6 条）---
// 每条 section 记录经 fumadocs toIndex 的 ...extra_data 展开携带 sourceCommit，
// 作为可回读的索引 sentinel（服务端拒绝 customSettings 设置，记录级 sentinel 更可靠）
const probe = await client.searchSingleIndex({
  indexName: INDEX_NAME,
  // 请求级覆写：fumadocs 的 attributesToRetrieve 白名单不含 sourceCommit
  searchParams: { query: '', hitsPerPage: 1, attributesToRetrieve: ['sourceCommit'] },
});
const probeHit = probe.hits?.[0] ?? probe.results?.[0]?.hits?.[0];
if (!probeHit || probeHit.sourceCommit !== sr.sourceCommit) {
  console.error(
    `[search-sync] sentinel readback failed: ${JSON.stringify(probeHit?.sourceCommit)} != ${sr.sourceCommit}`,
  );
  process.exit(1);
}
console.log(`[search-sync] sentinel ok: records carry sourceCommit=${sr.sourceCommit}`);

// --- 4. locale smoke query（隔离断言，v4 §7.2）---
// 每语言用仅存在于该语言的查询词验证不混搜（tag facet 由 fumadocs setIndexSettings 配置）
const smoke = [
  { locale: 'zh', term: '生命周期' },
  { locale: 'en', term: 'documentation' },
  { locale: 'de', term: 'Dokumentation' },
  { locale: 'fr', term: 'documentation' },
];
for (const { locale, term } of smoke) {
  const expected = sr.countsByLocale[locale] ?? 0;
  if (expected === 0) continue;
  const response = await client.searchSingleIndex({
    indexName: INDEX_NAME,
    searchParams: {
      query: term,
      facetFilters: [`tag:${locale}`],
      hitsPerPage: 50,
    },
  });
  const hits = response.hits ?? response.results?.[0]?.hits ?? [];
  const urls = hits.map((h) => h.url);
  const leaked = urls.filter((u) => !u.startsWith(`/${locale}/`));
  if (urls.length === 0) {
    console.error(`[search-sync] smoke[${locale}] "${term}" returned 0 hits`);
    process.exit(1);
  }
  if (leaked.length > 0) {
    console.error(`[search-sync] smoke[${locale}] locale leak: ${leaked.slice(0, 3).join(', ')}`);
    process.exit(1);
  }
  console.log(`[search-sync] smoke[${locale}] "${term}" -> ${urls.length} hits, all /${locale}/`);
}

console.log('[search-sync] ALL GREEN');
