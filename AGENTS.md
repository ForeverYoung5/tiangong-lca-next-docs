---
title: next-docs AI Working Guide
docType: contract
scope: repo
status: active
authoritative: true
owner: next-docs
language: en
whenToUse:
  - when changing public TianGong LCA documentation, navigation, search, screenshots, or site presentation
  - when deciding whether work belongs in next-docs, tiangong-lca-next, or lca-workspace
  - when routing from the workspace root into tiangong-lca-next-docs
whenToUpdate:
  - when public-site architecture, locale policy, validation, or ownership changes
  - when repo-local Docpact governance or publication behavior changes
checkPaths:
  - AGENTS.md
  - README.md
  - TODO.docs-system-gaps.md
  - .docpact/config.yaml
  - docs/agents/**
  - app/**
  - components/**
  - lib/**
  - content/docs/**
  - public/**
  - manifests/p0b/categories.json
  - manifests/p0b/site-routes.json
  - manifests/p0b/greenfield-deny.json
  - scripts/**
  - package.json
  - next.config.ts
  - edgeone.json
  - crowdin.yml
  - context7.json
  - .github/workflows/**
  - .githooks/**
lastReviewedAt: "2026-08-23"
lastReviewedCommit: d4f91b9c1d5a1e37f212da006a7ee75a1555c456
lastReviewedNote: "Reviewed for Issue #136 after the Data Atlas UI, four-locale link repair, metadata, and permanent generated-output link gate were implemented."
related:
  - .docpact/config.yaml
  - docs/agents/repo-architecture.md
  - docs/agents/repo-validation.md
  - README.md
  - TODO.docs-system-gaps.md
---

## Repository contract

`tiangong-lca-next-docs` owns the public TianGong LCA documentation site. It is a Next.js 16 App Router application using Fumadocs UI/MDX, TypeScript 7, pnpm, and fully static export. EdgeOne Makers owns build and deployment from Git.

## Load order

1. Read this contract.
2. Read `.docpact/config.yaml`.
3. Route intended paths with `scripts/docpact route --root <absolute-repo-root> --paths <paths> --format json`.
4. Read `docs/agents/repo-architecture.md` and `docs/agents/repo-validation.md` when site structure or validation is involved.
5. Read `README.md` for maintainer commands.
6. Read `TODO.docs-system-gaps.md` when product/documentation drift is involved.
7. Read every locale variant of a changed public page.

## Ownership

This repository owns:

- `content/docs/**` as public content using dot-locale files: Chinese `page.mdx`, then `page.en.mdx`, `page.de.mdx`, and `page.fr.mdx`;
- `app/**`, `components/**`, `lib/**`, and `app/global.css` for routing, metadata, the shared Data Atlas presentation, search, and MDX rendering;
- `public/**` for public media and brand assets;
- `scripts/build.mjs`, `scripts/verify-out.mjs`, and `scripts/check-links.mjs` for the static output contract;
- `TODO.docs-system-gaps.md` for durable product/documentation drift.

This repository does not own shipped product behavior, route truth, API semantics, or root integration state. Verify ambiguous behavior in `../tiangong-lca-next`; integrate the resulting child commit in `lca-workspace` separately.

## Runtime facts

- Supported locales are `zh`, `en`, `de`, and `fr`; every public page currently exists in all four.
- `/` renders the complete Chinese home as the `x-default` entry without redirecting. Locale homes remain `/{lang}/`; documents remain `/{lang}/docs/**`.
- Retired paths have no redirect or rewrite compatibility and must remain 404. `manifests/p0b/greenfield-deny.json` is a negative build contract, not a mapping table.
- The shared `SiteBrand` and `DocsHome` components plus `app/global.css` define the Data Atlas visual contract. Keep both documentation sites aligned with its shell widths, brand lockup, color tokens, focus treatment, dark mode, and responsive behavior.
- `next.config.ts` sets `agentRules: false` because this governed file, not generated development-server text, is authoritative.
- Public AI retrieval is derived at build time through `/llms.txt` and `/search-records.json`; internal governance files remain excluded by `context7.json`.

## Required commands

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm check:links
DEPLOY_ENV=ci CANONICAL_ORIGIN=http://localhost:3000 NEXT_PUBLIC_SEARCH_MODE=static pnpm build
```

`pnpm build` runs environment validation, static export, output-contract verification, and generated HTML link/fragment/asset validation. For visual changes, also inspect light and dark themes at 390px, 1440px, and an ultra-wide viewport using a real browser.

## Hard boundaries

- Keep all four locale variants aligned in the same change.
- Do not add redirects, rewrites, or compatibility copies for retired routes.
- Do not expose internal agent, plan, incident, TODO, or governance documents through public AI indexes.
- Do not treat a successful child merge as workspace delivery completion while the root gitlink remains stale.
- Record partial product/documentation drift in `TODO.docs-system-gaps.md` during the same session.
- Run strict Docpact validation and lint for governance changes.

## Workspace integration

A merged PR here is repository-complete only. Delivery completes after the exact eligible child commit is deliberately pinned and validated in the workspace root.

## Local Docpact push gate

Install the versioned hook once per checkout:

```bash
./scripts/install-git-hooks.sh
```

The pre-push hook delegates to `scripts/docpact-gate.sh`, validates configuration strictly, and lints against `origin/main` unless an explicit base is supplied.
