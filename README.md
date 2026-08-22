---
title: TianGong LCA Docs README
docType: guide
scope: repo
status: active
authoritative: true
owner: next-docs
language: en
whenToUse:
  - when setting up or maintaining the public Fumadocs documentation repository
  - when choosing local validation commands for build contract, llms.txt, or search-records work
whenToUpdate:
  - when docs repo setup, validation, publication, or AI-consumption commands change
checkPaths:
  - AGENTS.md
  - .docpact/config.yaml
  - .github/workflows/publish-docs.yml
  - .github/workflows/build.yml
  - package.json
  - next.config.ts
  - edgeone.json
  - crowdin.yml
  - context7.json
  - scripts/build.mjs
  - scripts/check-env.mjs
  - scripts/verify-out.mjs
  - content/docs/**
  - app/**
  - lib/**
  - components/**
lastReviewedAt: 2026-08-22
lastReviewedCommit: ab5e3f495827ce0ef2ea86ecc852c00d389fcf5b
lastReviewedNote: "Reviewed for P4 preparation (issue #131): orphan media deletion decision recorded (15 files user-confirmed, never published on either site); migration cutover runbook added (docs/agents/migration-cutover-runbook.md) consolidating verified operational facts from P0A-P3 and the EdgeOne/GitHub environment matrix; P3 reconciliation chain fully green."
related:
  - AGENTS.md
  - .docpact/config.yaml
  - docs/agents/repo-validation.md
---

Public documentation for the [TianGong LCA](https://lca.tiangong.earth) platform, built with
[Next.js 16](https://nextjs.org) + [Fumadocs 16](https://fumadocs.dev) + TypeScript 7 (native),
exported as a fully static site and published by [EdgeOne Makers](https://pages.edgeone.ai)
(Git integration).

## Locales

- `zh`（默认，内容源）— `/zh/docs/...`
- `en` — `/en/docs/...`
- `de` / `fr` — landing pages only; pages publish after translation review (Crowdin)

Source files follow the dot-locale convention: `page.mdx`（中文）、`page.en.mdx`、`page.de.mdx`、`page.fr.mdx`.
Pages missing a locale are simply not generated in that locale (`fallbackLanguage: null`).

## Development

Requires Node.js ≥ 24.18.0 and pnpm 11.22.0 (`packageManager` enforced).

```bash
pnpm install

# 本地开发（next dev）
pnpm dev

# 契约构建（环境契约校验 → next build → out/ 结构断言）
DEPLOY_ENV=ci \
CANONICAL_ORIGIN=http://localhost:3000 \
NEXT_PUBLIC_SEARCH_MODE=static \
pnpm build

pnpm typecheck   # next typegen && tsc --noEmit（TypeScript 7 原生）
pnpm lint        # markdownlint（md + mdx）
```

## Build contract (v4)

The build is environment-contract driven (`scripts/build.mjs`):

| 变量 | 约束 |
| --- | --- |
| `SOURCE_COMMIT` | 40 位 SHA；缺省时由 `git rev-parse HEAD` 推导 |
| `SOURCE_DATE_EPOCH` | commit 时间戳（unix 秒）；缺省由 git 推导 |
| `DEPLOY_ENV` | `ci` / `preview` / `production`（决定 noindex、robots、搜索后端） |
| `CANONICAL_ORIGIN` | 生产固定 `https://docs.tiangong.earth` |
| `NEXT_PUBLIC_SEARCH_MODE` | `static`（ci/preview）或 `algolia`（production） |

`pnpm build` 产出 `out/`（静态导出）并通过 `scripts/verify-out.mjs` 的 18 项契约断言
（site-routes manifest 全量路由、search-records/llms 的 commit 戳与计数、greenfield deny、
sitemap locale 隔离、OG 图、内部内容零泄漏）。

## Publishing

EdgeOne Makers Git integration owns build + deploy (GitHub Actions runs validation only).
See `spike/PLAN-v4.md`（spike 分支）与 [Issue #131](https://github.com/linancn/tiangong-lca-next-docs/issues/131)
for the migration program and the publication state machine.

## Repository layout

```text
app/            Next.js App Router（[lang] 四语言路由 + 系统端点）
components/     UI components（search dialog、VideoEmbed、MDX components）
content/docs/   文档源（dot-locale 契约）
lib/            i18n / source loader / 新 IA 常量
public/assets/  媒体（/assets/docs/<sha256-8>/<slug> 哈希命名空间）
manifests/      P0B 基线 manifest（site-routes / greenfield-deny / inventory）
scripts/        build.mjs / check-env.mjs / verify-out.mjs / migration/*
docs/agents/    内部治理文档（不发布）
```
