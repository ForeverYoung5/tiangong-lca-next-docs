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
lastReviewedAt: 2026-08-24
lastReviewedCommit: 595b07795ea8333d99d2be8aa2504b39a1c6ef1f
lastReviewedNote: "Reviewed for Issue #146 after static and browser proof was extended to the four-locale guided Quick Start route and task links."
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

`pnpm build` includes `check:env`, adversarial link tests, static export, `verify:out`, and `check:links`. Running the focused link unit tests separately still gives faster failure diagnosis.

## Proof by change type

- Public content: update all four locale variants; run lint and the complete build.
- Links, anchors, navigation, or assets: run link unit tests and the complete build. `check:links` must report zero missing pages, fragments, or local assets, zero path-relative document links, zero source-locale mismatches, and identical normalized internal-document target sets across the four variants of each page.
- Layout, CSS, brand, search dialog, or responsive behavior: run typecheck and build, then inspect a real browser at 390px, 1440px, 1633px, 2048px, and 2560px in light and dark themes. Confirm keyboard focus, language switching, search, mobile menu, and zero horizontal overflow.
- Landing visual contract: assert `data-hero-signature="lca-concept-map"`, exactly one `data-primary-action`, and a single semantic HTML `main`. The primary action must compute to `background-image: none`, `box-shadow: none`, and `transform: none`; the Next signature must not match the TIDAS hero signature.
- LCA concept geometry: while the hero is in two-column mode, the rightmost rendered title glyph must remain inside `[data-hero-copy]` and at least 24px away from `[data-concept-map]`; `[data-concept-connector]` must retain a rendered stroke width of at least 1.2px.
- Documentation-root hub: all four `/{lang}/docs/` outputs must contain `[data-docs-portal="lca-task-hub"]` and `[data-docs-portal-map="lca-task-route"]`; each portal link must remain inside its locale, resolve successfully, remain visible at 390px, and produce no horizontal overflow at 390px, 1440px, 1633px, 2048px, or 2560px in light and dark themes.
- Quick-start route: all four `/{lang}/docs/quick-start/` outputs must contain `[data-quick-start-guide="first-session-route"]`, `[data-quick-start-map="three-stage-onboarding"]`, one solid application entry action, and the same canonical onboarding/task targets. Browser proof must show readable completion cues, visible keyboard focus, no fixed-height overlap in German or French, and no horizontal overflow at the standard five widths in both themes.
- Automatic category directories: all 36 localized category roots (eight top-level sections plus the nested case-introduction section, across four locales) must expose `[data-category-directory]` and a `data-category-count` equal to the non-index entries in their localized `meta*.json`. Every meta target must be emitted in order with a localized title and non-empty metadata or first-paragraph summary. Browser proof must cover the two-column User Guide and a nested-folder category, with no self-links, empty grid cells, overlap, or horizontal overflow.
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
