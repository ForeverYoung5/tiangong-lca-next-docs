---
title: TianGong LCA Docs README
docType: guide
scope: repo
status: active
authoritative: true
owner: next-docs
language: en
whenToUse:
  - when setting up or maintaining the public Docusaurus docs repository
  - when choosing local validation commands for public docs, llms.txt, or publication-scope work
whenToUpdate:
  - when docs repo setup, validation, publication, or AI-consumption commands change
checkPaths:
  - README.md
  - package.json
  - .github/workflows/publish-docs.yml
  - scripts/generate-llms-txt.mjs
  - scripts/check-publication-scope.mjs
  - scripts/publication-policy.mjs
  - scripts/check-screenshots.mjs
  - context7.json
  - static/llms.txt
lastReviewedAt: 2026-08-19
lastReviewedCommit: df90f04ec0069bee5f09fb988747bdb3a3cf9f2d
lastReviewedNote: "Reviewed for docs-impact Issue #603: lockfile-free install, docs:llms, publication-scope, screenshot, lint, typecheck, and build workflow remain current."
related:
  - AGENTS.md
  - docs/agents/repo-validation.md
  - docs/dev/dev-env.md
---

## TianGong LCA Docs

This repository contains the public Docusaurus site for TianGong LCA.

## Source of truth

- Chinese public-doc source: `docs/**`
- English mirror: `i18n/en/docusaurus-plugin-content-docs/current/**`
- Product behaviour source: `../tiangong-lca-next`

The English tree is a maintained mirror, not a fire-and-forget translation dump. If a public page
changes in Chinese, update the English mirror in the same change.

## Environment

- Docs repo runtime: `package.json` currently allows `node >=18.0`
- Recommended workspace baseline: **Node 24**

If you are working across both docs and `../tiangong-lca-next`, use Node 24 to avoid switching
versions.

## Install

```bash
nvm install 24
nvm use 24
npm install --no-package-lock
```

This repository does not currently commit a package lock, so `npm ci` cannot
bootstrap a clean checkout. Keep local installation lockfile-free unless a
separate dependency-governance change intentionally introduces one.

## Common commands

```bash
npm run start
npm run lint
npm run lint:fix
npm run docs:llms
npm run docs:llms:check
npm run docs:publication-scope:check
npm run docs:screenshots:check
npm run typecheck
npm run build
npm run serve
```

`npm run build` runs `npm run docs:llms` through `prebuild` first, so hosted platforms that only
invoke the standard build command still publish `llms.txt` with the current build commit.

## Recommended verification

For public-doc changes, run at least:

```bash
npm run lint
npm run docs:llms:check
npm run docs:publication-scope:check
npm run build
```

When a change adds, replaces, or reuses screenshots, pass the local visual
evidence manifest:

```bash
npm run docs:screenshots:check -- \
  --manifest /tmp/docs-impact-visual-result.json \
  --diff-file /tmp/docs-impact-visual.name-status
```

Without a manifest, the command succeeds as `not_applicable` when the selected
diff has no public screenshot changes and fails if screenshot binaries changed
without declared evidence.

If navigation or page structure changes, also check:

- `sidebars.ts`
- `docs/intro.md`
- `docs/user-guide/overview.md`

## Translation scaffolding

```bash
npm run write-translations -- --locale en
```

Use scaffolding only as a starting point. Final English content should be reviewed and edited
manually.

## Docs / Product sync

For the full maintainer workflow, read:

- `docs/dev/docs-product-sync.md`
- `TODO.docs-system-gaps.md`

The default online verification target is `https://lca.tiangong.earth/`.

## Publish

Every push to `main` runs `.github/workflows/publish-docs.yml`, which regenerates `static/llms.txt`,
checks the publication scope, builds the Docusaurus site, deploys Cloudflare Pages, verifies
`/llms.txt`, and refreshes Context7 when `CONTEXT7_API_KEY` is configured.

The legacy tag-triggered release workflow remains available for version-style releases:

```bash
git tag
git tag v0.0.1
git push origin v0.0.1
```
