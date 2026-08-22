---
title: Fumadocs Migration Cutover Runbook
docType: runbook
scope: repo
status: active
authoritative: true
owner: next-docs
language: zh-CN
whenToUse:
  - when executing P4 production candidate rehearsal or the P5 DNS cutover for the Fumadocs migration (issue #131)
  - when operating the reconcile-docs workflow or diagnosing EdgeOne preview deployments
whenToUpdate:
  - when EdgeOne environment configuration, the reconcile workflow, or the F-1/F candidate procedure changes
checkPaths:
  - .github/workflows/reconcile-docs.yml
  - scripts/search-sync.mjs
  - scripts/build.mjs
  - edgeone.json
  - manifests/**
lastReviewedAt: 2026-08-23
lastReviewedCommit: e44e9b4d12197665265a88713f9ca7a5d52264f5
lastReviewedNote: "Initial P4/P5 cutover runbook consolidating verified operational facts from P0A-P3 (issue #131)."
related:
  - AGENTS.md
  - docs/agents/repo-validation.md
  - manifests/p0b/DECISIONS.md
---

# Fumadocs 迁移切换 Runbook（P4/P5）

> 方案：`spike/PLAN-v4.md`（spike 分支）§6/§10/§12 · 追踪 Issue #131
> 本文件沉淀 P0A–P3 实测验证过的运维事实；timeout/RTO 数值在 P4 演练后回填。

## 已验证的运维事实（勿重新踩坑）

1. **每次 push 自动触发 EdgeOne Preview 重建** → 部署 SHA 持续漂移。**dispatch reconcile 前必须等 EdgeOne 构建完成、用当前分支头 SHA**（轮询 `llms.txt` 的 `Source commit:` 行确认）。
2. workflow_dispatch 的 workflow 文件必须**先注册到 main**（PR #134 已完成注册）。
3. GitHub runner（westus）访问 `preview.docs.tiangong.earth` 正常；早期"卡 waiting"是 SHA 漂移，不是地域问题。
4. reconcile job 需要 `pnpm install --prod`（search-sync 依赖 algoliasearch/fumadocs-core）；runner 默认 node 22 触发 engines 警告但可运行。
5. Algolia：algoliasearch v5 扁平 API；`customSettings` 被服务端拒绝 → 记录级 sentinel（每条记录携带 `extra_data.sourceCommit`）；探针查询需请求级 `attributesToRetrieve` 覆写。
6. Context7 refresh 有 **10 天最小间隔**（too-early 为良性软跳过）。
7. Algolia 错误语义：`Method not allowed with this API key` = key 缺 ACL（Search Key 被误配为 Write Key 的典型症状）。

## 环境变量矩阵（单一事实来源）

### EdgeOne 环境管理（每环境独立配置）

| 变量 | Preview 环境 | Production 环境 | 说明 |
| --- | --- | --- | --- |
| `DEPLOY_ENV` | `preview` ✅已配 | `production` ⏳ | 构建契约 |
| `CANONICAL_ORIGIN` | `https://docs.tiangong.earth` ✅已配 | `https://docs.tiangong.earth` ⏳ | 预览页 noindex 下指向生产 canonical |
| `NEXT_PUBLIC_SEARCH_MODE` | `static` ✅已配 | `algolia` ⏳ | static 模式下三个 ALGOLIA 公共变量**必须为空**（配了反而构建失败） |
| `NEXT_PUBLIC_ALGOLIA_APP_ID` | （必须为空）✅ | ⏳ | 与 GitHub secret 同一 App ID |
| `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY` | （必须为空）✅ | ⏳ | 受限 search-only key（见下） |
| `NEXT_PUBLIC_ALGOLIA_INDEX_NAME` | （必须为空）✅ | `tiangong-lca-docs` ⏳ | 固定值 |

### GitHub（production environment secrets ✅已配齐）

`ALGOLIA_APP_ID` / `ALGOLIA_WRITE_KEY`（Admin Key）/ `CONTEXT7_API_KEY`——写密钥永不进入 EdgeOne 或 bundle（v4 §7.3）。

### Search Key 生成（P4 前置）

Algolia 控制台 → Settings → API Keys → Create API key：
- ACL：仅 `search`
- Indices：`tiangong-lca-docs`
- （可选）Referers/IPv4 限制：`docs.tiangong.earth/*`

## P4 生产候选流程（F-1 / F）

> 前置：EdgeOne Production 环境变量按上表配齐；Search Key 已生成。

1. **F-1**：评审并合并 PR #133（迁移主线）→ main push → EdgeOne Production 自动构建。
   - Production 构建走 `SEARCH_MODE=algolia`（静态 bundle 内嵌搜索配置）
   - 验收（EdgeOne 平台域或临时域）：103 路由 + 负向 404 + robots(allow+sitemap) + 无 noindex + llms/search-records commit 戳
   - 记录 deployment ID；保存该 commit 为回滚候选
2. dispatch reconcile（`verify_origin` = 生产候选域，`expected_sha` = F-1 SHA）→ 索引对齐
3. **F**：F-1 验收中的修复（若有）形成最终 commit；再次完整部署 + 验收 + 索引重建后**冻结 main**
4. go/no-go：下表数值回填 + 具名签字后进入 P5

## Go/No-Go 表（P4 演练后回填）

| 项 | 数值 | 状态 |
| --- | --- | --- |
| EdgeOne 构建 timeout / 重试 | 待定 | ⏳ |
| live SHA 稳定窗口（≥3 地域） | 待定 | ⏳ |
| 关键 URL 成功率阈值 / 5xx 阈值 | 待定 | ⏳ |
| 搜索最大滞后窗口（站点领先索引） | 待定 | ⏳ |
| DNS TTL（切换前预降） | 待定（当前值待查） | ⏳ |
| 回滚 RTO（EdgeOne 内恢复上一 deployment） | 待定 | ⏳ |
| Delivery owner 签字 | — | ⏳ |
| Platform/DNS owner 签字 | — | ⏳ |

## P5 DNS 切换（用户执行，本仓只改 docs 记录）

1. 权威 DNS 中仅将 `docs` 记录 CNAME 至 EdgeOne 提供值（不动整域 NS）
2. 多探针验证 DNS/TLS/EdgeOne identity
3. 生产域 smoke：`llms.txt` 暴露 F + 关键页 + 搜索 + 负向 404
4. dispatch reconcile（verify_origin=`https://docs.tiangong.earth`）
5. 通知主站 PR（`tiangong-lca-next` de/fr `documentationUrl` → `/de` `/fr`）与 workspace gitlink 更新（独立 PR/Issue，v4 §13 等式验收）
6. 观察期 3–7 天后清理（保留最近一个 verified deployment 作回滚点）

## 失败处置速查（v4 §12.3 摘要）

| 场景 | 动作 |
| --- | --- |
| Production 构建失败（如契约变量缺失） | 构建失败=零部署，生产保持上一版；修配置后重推 |
| reconcile 任一 phase 失败 | 标记 blocked；索引保持上一 verified 状态（提交前失败）或重放上一 artifact（替换后 smoke 失败） |
| 切流后应用级验收失败 | EdgeOne 内回滚至 F-1 deployment + 重放其索引 artifact；生成修复 commit R 重新走 F 流程 |
| DNS/TLS/平台级失败 | blocked-platform（EdgeOne-only 方案无跨平台回滚，v4 §3.2 已接受） |
