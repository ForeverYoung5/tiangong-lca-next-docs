---
title: next-docs Validation Guide
docType: guide
scope: repo
status: active
authoritative: true
owner: next-docs
language: en
whenToUse:
  - when validating public content, navigation, presentation, metadata, search, publishing, or governance changes
  - when selecting proof for a next-docs pull request
whenToUpdate:
  - when package scripts, output contracts, browser coverage, or CI behavior change
checkPaths:
  - AGENTS.md
  - .docpact/config.yaml
  - package.json
  - scripts/build.mjs
  - scripts/check-env.mjs
  - scripts/verify-out.mjs
  - scripts/check-links.mjs
  - scripts/check-links.test.mjs
  - app/**
  - components/**
  - lib/**
  - content/docs/**
  - public/**
  - context7.json
  - .github/workflows/**
  - .githooks/**
lastReviewedAt: "2026-08-23"
lastReviewedCommit: d4f91b9c1d5a1e37f212da006a7ee75a1555c456
lastReviewedNote: "Reviewed for Issue #136 after permanent generated-link validation and Data Atlas browser QA were added to the delivery proof."
related:
  - AGENTS.md
  - .docpact/config.yaml
  - docs/agents/repo-architecture.md
---

## Validation guide

## Canonical commands

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
node --test scripts/check-links.test.mjs
DEPLOY_ENV=ci CANONICAL_ORIGIN=http://localhost:3000 NEXT_PUBLIC_SEARCH_MODE=static pnpm build
```

`pnpm build` already includes `check:env`, static export, `verify:out`, and `check:links`. Running the focused link unit tests separately gives faster failure diagnosis.

## Proof by change type

- Public content: update all four locale variants; run lint and the complete build.
- Links, anchors, navigation, or assets: run link unit tests and the complete build. `check:links` must report zero missing pages, fragments, or local assets.
- Layout, CSS, brand, search dialog, or responsive behavior: run typecheck and build, then inspect a real browser at 390px, 1440px, and an ultra-wide viewport in light and dark themes. Confirm keyboard focus, language switching, search, mobile menu, and zero horizontal overflow.
- Metadata or route changes: inspect generated HTML for canonical, `x-default`, all real locale alternatives, and Open Graph image metadata; confirm sitemap entries and negative 404 contracts.
- Production publishing or search reconciliation: run the complete build, verify deployed `/llms.txt` and `/search-records.json` expose the expected SHA, assert indexable robots/canonical metadata, then confirm locale-isolated Algolia search.
- Preview reconciliation: assert the same deployed SHA but require `Disallow: /`, page `noindex`, and production-origin canonical/sitemap URLs; confirm the production-state job is skipped.
- Governance: validate and lint Docpact after the implementation diff is final.

## Docpact

```bash
scripts/docpact validate-config --root . --strict --format json
scripts/docpact lint --root . --base origin/main --head HEAD --mode enforce --format json
```

Use an absolute root when invoked outside the repository. Save a report only when diagnostics need drill-down.

## Local pre-push gate

```bash
./scripts/install-git-hooks.sh
```

The hook runs strict configuration validation and enforced documentation-governance lint against `origin/main` by default.
