---
title: next-docs Repository Architecture
docType: reference
scope: repo
status: active
authoritative: true
owner: next-docs
language: en
whenToUse:
  - when changing routing, locale behavior, content loading, search, metadata, or the documentation presentation
  - when checking boundaries between public documentation and shipped product behavior
whenToUpdate:
  - when public-site structure, locale policy, publishing, or output contracts change
checkPaths:
  - AGENTS.md
  - .docpact/config.yaml
  - app/**
  - components/**
  - lib/**
  - content/docs/**
  - public/**
  - manifests/p0b/categories.json
  - manifests/p0b/site-routes.json
  - manifests/p0b/greenfield-deny.json
  - scripts/build.mjs
  - scripts/verify-out.mjs
  - scripts/check-links.mjs
  - package.json
  - next.config.ts
  - edgeone.json
  - context7.json
  - .github/workflows/**
lastReviewedAt: 2026-08-23
lastReviewedCommit: aad45c9512df83636131439b6b6bff3d535c928e
lastReviewedNote: "Reviewed for Issue #140 after the landing moved to Fumadocs Neutral primitives, a flat shared shell, and a Next-specific LCA concept map."
related:
  - AGENTS.md
  - .docpact/config.yaml
  - docs/agents/repo-validation.md
---

## Architecture

## Runtime and routes

The site uses Next.js App Router with Fumadocs and exports static files to `out/`.

- `app/(entry)/**` owns `/`, the `x-default` entry that renders the full Chinese home without a redirect.
- `app/(locale)/[lang]/**` owns `/{lang}/` and `/{lang}/docs/**` for `zh`, `en`, `de`, and `fr`.
- `lib/source.ts` loads dot-locale MDX from `content/docs/**` with no locale fallback.
- `app/llms.txt`, `app/search-records.json`, `app/api/search`, `app/robots.ts`, `app/sitemap.ts`, and `app/og/**` are generated public endpoints.
- Canonical URLs, language alternatives, `x-default`, and Open Graph images are produced by the layouts, document metadata, and `lib/metadata.ts`.

Retired paths are intentionally absent. No application or hosting configuration may introduce redirects, rewrites, or compatibility copies.

## Presentation

`components/SiteBrand` and `components/DocsHome` are the shared shell entry points. `lib/layout.shared.tsx` supplies the same brand, search, theme, language, documentation, and repository controls to `HomeLayout` and `DocsLayout`. The landing reuses Fumadocs `buttonVariants`, `Card`, and `Cards`; it does not maintain parallel button or card primitives.

`app/global.css` owns the shared contract:

- an explicit centered 72rem shell and responsive gutters;
- neutral Carbon-style layers with the original TianGong plum retained as a solid interaction color;
- light/dark behavior and visible keyboard focus;
- logo plus `TianGong LCA / Documentation` brand lockup;
- low-radius, border-defined controls without gradients, glow, shadow, or lift animation;
- mobile-safe document pagination.

`components/lca-concept-map.tsx` owns the TianGong LCA hero signature. Its abstract reference-data → process-relations → product-system → LCIA-results topology is intentionally different from the TIDAS data-system/schema signature. The `data-hero-signature="lca-concept-map"` marker makes that distinction testable while shell widths, control placement, brand treatment, and accessibility behavior remain aligned between the sites.

## Content and locales

Chinese is the canonical authoring source. The same logical page uses:

```text
page.mdx
page.en.mdx
page.de.mdx
page.fr.mdx
```

All four variants must change together when structure, links, examples, or user-visible facts change. Locale metadata files follow the same suffix convention.

## Build and publication

`scripts/build.mjs` performs this fail-closed sequence:

1. validate environment and source identity;
2. run `next build` static export;
3. validate deterministic routes, endpoints, search records, AI index, SEO files, and greenfield deny paths;
4. run adversarial link-checker tests, then validate source-locale link topology and every generated local page, fragment, and asset reference with browser URL semantics.

The three retained `manifests/p0b/*.json` files are immutable build contracts for information architecture, expected routes, and retired-path denial. One-time rewrite inventories and executors were removed after cutover; Git history remains the audit source.

EdgeOne Makers builds and deploys from Git. GitHub workflows validate pull requests and first reconcile any allowlisted deployment against its source SHA and environment-specific indexing policy. Preview stays `noindex` and canonicalizes to production. Only the production origin can start the separate production-environment job that replaces Algolia data and refreshes Context7; preview reconciliation is validation-only.

## Ownership boundaries

- `tiangong-lca-next` owns product behavior, route truth, API semantics, and user-interface behavior.
- `tiangong-lca-next-docs` owns the public explanation and site implementation.
- `lca-workspace` owns the integrated child commit and completion state.
