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
lastReviewedAt: 2026-08-24
lastReviewedCommit: 69c0b1a3bacb7cc78c8c70e626686599a0d329d4
lastReviewedNote: "Reviewed for Issue #148 after category navigation began deriving localized order, links, titles, and summaries from the Fumadocs page tree."
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

`components/SiteBrand`, `components/DocsHome`, and `components/DocsPortal` are the shared shell and entry-point components. `lib/layout.shared.tsx` supplies the same brand, search, theme, language, documentation, and repository controls to `HomeLayout` and `DocsLayout`. Landing and documentation hubs reuse Fumadocs `buttonVariants`, `Card`, and `Cards`; they do not maintain parallel button or card primitives.

`app/global.css` owns the shared contract:

- an explicit centered 72rem shell and responsive gutters;
- neutral Carbon-style layers with the original TianGong plum retained as a solid interaction color;
- light/dark behavior and visible keyboard focus;
- logo plus `TianGong LCA / Documentation` brand lockup;
- low-radius, border-defined controls without gradients, glow, shadow, or lift animation;
- mobile-safe document pagination.

`components/lca-concept-map.tsx` owns the TianGong LCA hero signature. Its abstract reference-data → process-relations → product-system → LCIA-results topology is intentionally different from the TIDAS data-system/schema signature. The `data-hero-signature="lca-concept-map"` marker makes that distinction testable while shell widths, control placement, brand treatment, and accessibility behavior remain aligned between the sites.

The four `content/docs/index*.mdx` sources render `components/docs-portal.tsx` inside the normal Fumadocs document layout. The portal deliberately keeps the document title and sidebar, then provides recommended task entry points, a five-step task route, and technical references. This keeps `/{lang}/docs/` useful without copying the marketing hero. The LCA portal exposes `data-docs-portal="lca-task-hub"` and `data-docs-portal-map="lca-task-route"`; the TIDAS site uses the same information hierarchy with a distinct system-module matrix.

The four `content/docs/quick-start/index*.mdx` sources render `components/quick-start-guide.tsx` as a category-level first-session route. It keeps the ordinary document shell, then sequences account access and an operation walkthrough before branching into a first data, authoring, or LCIA task. Completion cues make each stage testable, while account, FAQ, and support links remain a low-emphasis fallback. The `data-quick-start-guide="first-session-route"` and `data-quick-start-map="three-stage-onboarding"` markers distinguish this local onboarding path from the broader five-stage docs-root map.

The `overview`, `user-guide`, `data-collection`, `integration`, `openapi`, `deploy-and-dev`, `faq`, and `changelog` roots, plus the nested `data-collection/case-introduction` root, render `components/category-directory.tsx`. Each MDX variant supplies only its locale and category slug. The server component locates the category folder in `source.getPageTree(lang)`, preserves current `meta*.json` order, includes direct pages and folder index pages, and normalizes emitted links to locale-absolute trailing-slash URLs. Titles and descriptions are read from the child page; when description metadata is absent, a bounded first sentence is derived from `structuredData`. Future child-page additions, removals, renames, ordering changes, and copy updates therefore require no category-index edit.

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
