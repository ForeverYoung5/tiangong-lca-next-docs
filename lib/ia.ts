/**
 * v4 §5.2 新信息架构：10 组分类语义。
 * 单一来源为 manifests/p0b/categories.json；此处硬编码副本由
 * verify-out（site-routes 计数断言）保证与 manifest 一致。
 *
 * 分类首页默认 llms:false / search:false（v4 §2）。
 */
export const categoryBases: readonly string[] = [
  'overview',
  'quick-start',
  'user-guide',
  'data-collection',
  'data-collection/case-introduction',
  'integration',
  'openapi',
  'deploy-and-dev',
  'faq',
  'changelog',
];

export function isCategoryIndex(slugs: string[]): boolean {
  return categoryBases.includes(slugs.join('/'));
}
