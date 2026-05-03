---
title: next-docs Validation Guide
docType: guide
scope: repo
status: active
authoritative: true
owner: next-docs
language: en
whenToUse:
  - when validating public docs, site structure, bilingual mirror, screenshot, or documentation-governance changes
  - when selecting proof for a next-docs PR
whenToUpdate:
  - when Docusaurus validation commands change
  - when bilingual mirror or product/docs drift proof expectations change
  - when docpact governance rules or CI behavior change
checkPaths:
  - AGENTS.md
  - .docpact/config.yaml
  - .github/workflows/ai-doc-lint.yml
  - package.json
  - sidebars.ts
  - docusaurus.config.ts
  - docs/**
  - i18n/en/docusaurus-plugin-content-docs/current/**
  - TODO.docs-system-gaps.md
lastReviewedAt: 2026-05-03
lastReviewedCommit: f98057b9104556ba4fa7a79f5409565e6aed24a8
related:
  - AGENTS.md
  - .docpact/config.yaml
  - docs/agents/repo-architecture.md
---

# next-docs Validation Guide

The canonical local commands are:

```bash
npm run lint
npm run build
npm run typecheck
```

Use the narrowest command set that proves the touched area.

## Required Validation Shape

- Public docs changes require checking the Chinese source and English mirror together.
- Navigation or site-config changes require at least typecheck and build when feasible.
- Product-behavior documentation changes require checking `../tiangong-lca-next` when behavior is ambiguous.
- Partial fixes to product/docs drift must update `TODO.docs-system-gaps.md`.
- Documentation-governance changes require docpact validation.

## Docpact Validation

Run these commands for governance changes:

```bash
docpact validate-config --root . --strict
docpact lint --root . --base origin/main --head HEAD --mode enforce
```

The repository PR workflow runs the same docpact config validation and PR-shaped lint gate.
