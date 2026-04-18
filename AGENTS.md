---
title: next-docs AI Working Guide
docType: contract
scope: repo
status: active
authoritative: true
owner: next-docs
language: en
whenToUse:
  - when a task may change public Docusaurus documentation, site navigation, screenshots, or docs-product drift tracking
  - when deciding whether work belongs in this repository, in tiangong-lca-next, or in lca-workspace
  - when routing from the workspace root into tiangong-lca-next-docs
whenToUpdate:
  - when product/docs ownership boundaries change
  - when the bilingual public-doc workflow changes
  - when the repo-local AI bootstrap docs under ai/ change
checkPaths:
  - AGENTS.md
  - README.md
  - TODO.docs-system-gaps.md
  - ai/**/*.yaml
  - docs/**
  - i18n/en/docusaurus-plugin-content-docs/current/**
  - sidebars.ts
  - docusaurus.config.ts
  - src/**
  - static/**
  - package.json
lastReviewedAt: 2026-04-18
lastReviewedCommit: 5c945a72f0847e9c27f56a38eb9aca7389f69fa9
related:
  - ai/repo.yaml
  - ai/doc-impact.yaml
  - README.md
  - TODO.docs-system-gaps.md
---

## Repo Contract

`tiangong-lca-next-docs` owns the public TianGong LCA documentation site built with Docusaurus. Start here when the task may change published docs pages, navigation, screenshots, or the durable backlog that tracks docs drift against the product.

## AI Load Order

Load docs in this order:

1. `AGENTS.md`
2. `ai/repo.yaml`
3. `ai/doc-impact.yaml`
4. `README.md` for maintainer workflow details
5. `TODO.docs-system-gaps.md` when the task is part of an existing drift item
6. the target page under `docs/**` and its English mirror under `i18n/en/docusaurus-plugin-content-docs/current/**`

Do not start by guessing product behavior from the docs repo alone.

## Repo Ownership

This repo owns:

- `docs/**` as the canonical Chinese public-doc source
- `i18n/en/docusaurus-plugin-content-docs/current/**` as the maintained English mirror
- `sidebars.ts`, `docusaurus.config.ts`, `src/**`, and `static/**` for docs-site structure and presentation
- `TODO.docs-system-gaps.md` for durable tracking of product/docs drift

This repo does not own:

- shipped product behavior
- product routes, API semantics, or hidden-role UI logic
- workspace integration state after merge

Route those tasks to:

- `tiangong-lca-next` for shipped product behavior and UI truth
- `lca-workspace` for root integration after merge

## Runtime Facts

- Chinese docs are the source of truth for this site; English pages are maintained mirrors and must be updated in the same change
- The canonical local commands are `npm run lint`, `npm run build`, and `npm run typecheck`
- Use Playwright or equivalent product verification only when text inspection of `../tiangong-lca-next` is not enough to confirm the current UI flow or screenshot target
- If a page is only partially fixed, update `TODO.docs-system-gaps.md` in the same working session

## Hard Boundaries

- Do not document product behavior here without checking `../tiangong-lca-next`
- Do not update a Chinese page without updating the paired English mirror in the same change
- Do not leave durable drift notes only in chat when `TODO.docs-system-gaps.md` should be updated
- Do not treat a merged repo PR here as workspace-delivery complete if the root repo still needs a submodule bump

## Workspace Integration

A merged PR in `tiangong-lca-next-docs` is repo-complete, not delivery-complete.

If the docs change must ship through the workspace:

1. merge the child PR into `tiangong-lca-next-docs`
2. update the `lca-workspace` submodule pointer deliberately
3. complete any later workspace-level validation that depends on the updated docs snapshot
