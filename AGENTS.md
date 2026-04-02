# AGENTS - Tiangong LCA Next Docs

Use this file as the single entry point for AI agents working in this repository.

## Repo Purpose

- This repository publishes the public TianGong LCA documentation site with Docusaurus.
- The primary product counterpart is `../tiangong-lca-next`.
- This repo is manually synchronized with the product repo. There is no automatic docs generation
  from product code, routes, or UI labels.

## Runtime Baseline

- Node.js `>=18.0` per `package.json`.
- Stack: Docusaurus 3 + React 19 + TypeScript.

Core commands:

```bash
npm install
npm run start
npm run build
npm run lint
npm run typecheck
```

Notes:

- `npm run lint` runs `markdownlint-cli2` across all Markdown files in the repo.
- `npm run build` should be used when changing Docusaurus config, sidebars, MDX, routes, or locale
  structure.
- Avoid bulk translation regeneration unless explicitly needed; `write-translations` can create noisy
  diffs and does not replace manual review.

## Repo Landmarks

- `docs/**`: Chinese public docs source files.
- `i18n/en/docusaurus-plugin-content-docs/current/**`: English public docs mirror.
- `sidebars.ts`: public navigation structure.
- `docusaurus.config.ts`: site config, locales, navbar, footer, and search.
- `static/**`: site assets.
- `README.md`: maintainer-facing repo usage notes.
- `TODO.docs-system-gaps.md`: internal backlog for product/docs drift. Keep durable gap tracking here.

## Online Verification Environment

- Online system URL: `https://lca.tiangong.earth/`
- Local credentials and tokens for verification may exist in the repo-root `.env` file.
- Expected variable names:
  - `TIANGONG_LCA_USERNAME`
  - `TIANGONG_LCA_PASSWORD`
  - `TIANGONG_LCA_API_KEY`

Hard rules:

- Never paste secret values into docs, commits, PR text, or chat summaries unless the human
  explicitly asks for that.
- Do not commit `.env` or move secret values into tracked files.
- If you only need to mention credential availability, refer to the variable names, not the values.

## Playwright And Screenshot Workflow

Use Playwright when product verification needs more than static code inspection, especially when:

- a docs page depends on exact UI wording or control placement
- the current screenshots look stale or mismatched
- a hidden or role-based workflow needs confirmation in the live system
- a new how-to page would be materially clearer with a real product screenshot

When Playwright is used:

1. Prefer logging into `https://lca.tiangong.earth/` with the `.env` credentials only when the
   workflow actually requires authentication.
2. Verify the target flow before editing docs.
3. Capture screenshots that match the style of existing docs assets in this repo.
4. If the screenshot is instructional, add red boxes or clear callouts around the relevant control
   or region before using it in docs.
5. Save the asset under the nearest matching docs image directory, for example
   `docs/user-guide/img/` or `docs/MCP/img/`.
6. Add surrounding explanatory text in the doc so the screenshot supports, rather than replaces, the
   written instructions.

Screenshot hygiene:

- Avoid exposing passwords, API keys, raw tokens, or unrelated personal information.
- Keep the viewport focused on the target workflow, not the entire desktop.
- If a screenshot includes user-identifying or irrelevant noise, crop or replace it before use.

## Source Of Truth Rules

- For shipped product behavior, treat `../tiangong-lca-next` as the source of truth.
- For Chinese public docs, treat `docs/**` as the source of truth unless an explicit exception is
  documented.
- For English public docs, treat `i18n/en/docusaurus-plugin-content-docs/current/**` as the mirror
  that must stay aligned with the Chinese source.
- For internal maintenance records, use repo-root files such as `AGENTS.md` and
  `TODO.docs-system-gaps.md`. Do not put internal-only notes under `docs/**` unless they are meant
  to be published on the public site.

## Documentation Workflow

When making public documentation changes:

1. Inspect the relevant product behavior in `../tiangong-lca-next` first.
2. Update the Chinese page in `docs/**`.
3. Update the English mirror in `i18n/en/docusaurus-plugin-content-docs/current/**` in the same
   change.
4. Update `sidebars.ts`, `docs/intro.md`, `docs/user-guide/overview.md`, or `docs/changelog/*` if
   the information architecture or discovery path changed.
5. If the change closes only part of a known gap, update `TODO.docs-system-gaps.md` in the same
   session.

When adding a new public page:

1. Add the Chinese source page under `docs/**`.
2. Add the English mirror under `i18n/en/docusaurus-plugin-content-docs/current/**`.
3. Register the page in `sidebars.ts` if it should be discoverable in site navigation.
4. Ensure cross-links use site-relative doc links, not raw repository paths.

## Drift Hotspots To Check

These product areas are especially likely to drift from the docs site:

- `../tiangong-lca-next/config/routes.ts`
- `../tiangong-lca-next/src/app.tsx`
- `../tiangong-lca-next/src/components/RightContent/index.tsx`
- `../tiangong-lca-next/src/components/ImportTidasPackage/index.tsx`
- `../tiangong-lca-next/src/components/ExportTidasPackage/index.tsx`
- `../tiangong-lca-next/src/components/LcaTaskCenter/index.tsx`
- `../tiangong-lca-next/src/pages/Account/index.tsx`
- `../tiangong-lca-next/src/pages/Review/index.tsx`
- `../tiangong-lca-next/src/pages/ManageSystem/index.tsx`
- `../tiangong-lca-next/src/pages/Processes/Analysis/index.tsx`

Check these areas whenever the docs touch:

- account and authentication
- API keys
- data import/export
- task center behavior
- review workflow
- admin/system management
- advanced LCIA or analysis workflows
- top-bar controls and navigation

## Writing Rules

- Prefer updating an existing page over creating a near-duplicate page.
- Keep user-facing docs task-oriented and product-accurate.
- Distinguish public user docs from maintainer/internal guidance.
- Use concrete product labels that match the UI.
- If screenshots are outdated but text is being updated anyway, note the screenshot gap in
  `TODO.docs-system-gaps.md`.
- If a Chinese page is renamed, moved, or removed, update the English mirror and sidebar references
  in the same change.
- If you find an English-only orphan page, either restore the Chinese source, merge it, or record
  the exception in `TODO.docs-system-gaps.md`.

## Validation Expectations

- Run `npm run lint` after changing Markdown files.
- Run `npm run build` when changing site structure, navigation, MDX, config, or localization paths.
- Run `npm run typecheck` when editing TypeScript config files such as `docusaurus.config.ts` or
  `sidebars.ts`.

## Change Discipline

- Keep diffs scoped to the documentation problem being solved.
- Do not silently rewrite large sections of unrelated content.
- If you change the documentation workflow or maintenance contract for this repo, update this file
  first.
