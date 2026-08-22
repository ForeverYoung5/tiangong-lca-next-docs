# P0B 基线与契约决策登记

> 生成时间：2026-08-22 · 基线 commit：`e44e9b4d12197665265a88713f9ca7a5d52264f5`（origin/main）
> 生成脚本：`scripts/migration/inventory.mjs`（重跑可复现，需先在基线 checkout 上 `npm run build`）
> 追踪：Issue #131 · 方案 `spike/PLAN-v4.md`（spike 分支）§10 P0B

## 实测基线计数（对 v4 §2 的修正）

| 项 | v4 计划 | 实测 | 说明 |
| --- | ---: | ---: | --- |
| 中文公开 Markdown | 37 | **37** ✓ | 含 `integration/cli`（评审时未见该页） |
| 英文公开 Markdown | 37 | **37** ✓ | 与中文 1:1 镜像，无缺页 |
| 分类语义（generated-index） | 10 | **10** ✓ | 9 顶层 + 1 嵌套（案例介绍） |
| llms.txt 条目 | 74 | **74** ✓ | 37 zh + 37 en |
| 显式 heading ID | 11 | **5** | 全部位于 `user-guide/create-my-data.md`（en 镜像同 5 处）；manifest 为准 |
| 中文 PNG | 127 | **127** ✓ | 去重后 111 个唯一 hash（zh/en 同图内容寻址合并） |
| 英文 PNG | 122 | **122** ✓ | 5 张中文独有 |
| MP4 | 3+3 | 3+3 ✓ | **全部无 Markdown 引用**（orphan，3 个唯一 hash） |
| orphan 媒体（无引用） | — | **16 个唯一 hash** | 3 MP4 + 13 PNG；待 PR 审核确认后不进入新公开输出 |

## 新 IA 决策（v4 §5.2 落地）

分类路径映射（旧 slug → 新 `content/docs/` 目录）：

| 旧 slug | 新路径 | 备注 |
| --- | --- | --- |
| `/overview` `/quick-start` `/user-guide` `/data-collection` `/data-collection/case-introduction` `/integration` `/deploy-and-dev` `/faq` `/changelog` | 同名（去掉前导斜杠） | 与旧 slug 一致 |
| `/docs/openapi` | `openapi` | 旧 slug 带 `/docs` 前缀，新 IA 修正 |

页面路径映射要点：

- `MCP/lca_local|lca_remote|KB_remote` → `integration/mcp-lca-local|mcp-lca-remote|mcp-kb-remote`（kebab-case）
- `deploy/local-deploy`、`dev/dev-env`、`dev/docs-product-sync` → `deploy-and-dev/*`（合并分类）
- `user-guide/*`、`faq/*`、`data-collection/*`、`integration/cli`、`openapi/tidas-package-import`、`changelog/function-update`、`overview/*`、`quick-start/*` → 同名迁移
- `docs/intro.md` → `overview/intro`（不作为新站 docs 首页）；新站 `/{lang}/docs/` 首页为新增落地页

## page × locale 发布矩阵

| locale | 范围 |
| --- | --- |
| zh | 37 页全量 + docs 首页 |
| en | 37 页全量 + docs 首页 |
| de | 仅 docs 首页（人工审核翻译；其余页面待 Crowdin 产出并审核后逐页开启） |
| fr | 仅 docs 首页（同上） |

## 新站路由账目

- HTML 路由 103 条：`/` 语言入口 1 + locale home 4 + docs 首页 4 + 分类页 20（仅 zh/en，`llms:false search:false`）+ 正文页 74（zh/en）
- 系统端点：`/llms.txt` `/robots.txt` `/sitemap.xml` `/search-records.json` `/api/search` `/og/[...slug]` `/404`
- llms 目标条目 = 74 基线 + 2（de/fr 首页真实翻译）= **76**

## greenfield deny（负向验收）

- 旧页面 URL **98 条**（sitemap 50 条中排除根 `/` 重定义端点 → 49 zh + 49 en 推导；含泄漏的 `/agents/*` 与旧 `/search`——二者在新站必须 404）
- 旧媒体 URL **98 条**（`build/assets/images/*` 96 条 hash 路径 + `static/img/*` 2 条站点图件）
- anchor alias 5 组（`create-my-data` 页的 5 个显式 ID；新 DOM 不得人为重建旧别名）
- 旧 `/search` 页与 `/docs/openapi` 旧 slug 均在 deny 中（新站无 `/search` 页面；OpenAPI 分类新路径为 `/openapi`）

## 待用户决策（P0B 退出余项）

- [ ] §6.5 具名 owner：Search / Docs Governance / Workspace Integration（Delivery 与 Platform/DNS 已由用户实际承担）
- [ ] 16 个 orphan 媒体的 PR 审核确认（建议全部不进入新公开输出）
- [ ] de/fr docs 首页译文的 reviewer 指派（P2 交付前）
