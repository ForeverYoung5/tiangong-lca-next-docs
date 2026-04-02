# Docs/System Gap TODO

This file is a long-term maintenance backlog for gaps between:

- the public documentation site in `tiangong-lca-next-docs`
- the shipped product behavior in `../tiangong-lca-next`

Use it as the durable place to record documentation drift. Do not treat chat history as the source
of truth once a gap has been identified.

## How To Use This File

- Add a new item when product behavior exists in `tiangong-lca-next` but the docs site is missing,
  stale, misleading, or fragmented.
- Update the item in the same working session when a gap changes status, scope, or priority.
- Keep references concrete: point to product files, routes, and doc files.
- Prefer one durable item per gap area instead of scattered notes.
- Keep internal maintenance notes here at repo root. Do not place them under `docs/**` unless they
  are meant to be published on the site.

## Verification Notes

- Default online verification target: `https://lca.tiangong.earth/`
- Verification credentials may exist in the repo-root `.env` file as:
  - `TIANGONG_LCA_USERNAME`
  - `TIANGONG_LCA_PASSWORD`
  - `TIANGONG_LCA_API_KEY`
- Treat these as secrets. Record variable names only, never their values.
- If a gap requires live UI confirmation or refreshed screenshots, prefer Playwright over guesswork.
- When adding or replacing screenshots, follow the style of existing docs screenshots and add red
  boxes or callouts when that makes the instructional focus clearer.

## Status Legend

- `[ ]` Not started
- `[-]` Partially covered
- `[x]` Covered and verified
- `[?]` Needs product confirmation

## Active Backlog

### [ ] P0 Account Profile And API Key

Problem:
The product account page includes a dedicated `Generate API Key` tab with password verification and
one-time key display, but the public account guide only documents basic info, password change, and
email change.

System evidence:

- `../tiangong-lca-next/src/pages/Account/index.tsx`

Docs currently involved:

- `docs/user-guide/account-profile.md`
- `docs/MCP/lca_remote.md`
- `docs/openapi/tidas-package-import.md`

Needed:

- Add a dedicated API Key section to the account guide.
- Explain where the entry is, what verification is required, and that the key should be copied and
  stored securely because it is not shown again.
- Link the account guide to MCP and OpenAPI pages instead of documenting API Key generation only in
  integration docs.

### [ ] P0 TIDAS ZIP Import/Export And Task Center

Problem:
The product has global TIDAS ZIP import, global TIDAS ZIP export, and a shared task center, but the
docs site mainly covers ordinary JSON import/export plus API import. The UI flow is under-documented.

System evidence:

- `../tiangong-lca-next/src/app.tsx`
- `../tiangong-lca-next/src/components/ImportTidasPackage/index.tsx`
- `../tiangong-lca-next/src/components/ExportTidasPackage/index.tsx`
- `../tiangong-lca-next/src/components/LcaTaskCenter/index.tsx`

Docs currently involved:

- `docs/user-guide/key-functions-introduction.md`
- `docs/openapi/tidas-package-import.md`

Needed:

- Add a user-facing guide for ZIP import/export from the product UI.
- Document export scopes, asynchronous task behavior, report download, and failure-report reading.
- Extend the top-bar controls guide so users can discover these entries from the UI.

### [ ] P0 Process Analysis Workspace

Problem:
The product contains a hidden route for process analysis with LCIA profile review, process comparison,
grouped analysis, and contribution path analysis. The docs site has no dedicated page for this
workspace.

System evidence:

- `../tiangong-lca-next/config/routes.ts`
- `../tiangong-lca-next/src/pages/Processes/Analysis/index.tsx`

Docs currently involved:

- `docs/user-guide/lcia.md`
- `docs/user-guide/overview.md`

Needed:

- Add a dedicated analysis page under the user guide.
- Distinguish simple LCIA result viewing from advanced analysis workflows.
- Document the meaning of current-user, open-data, and all-data scopes where applicable.

### [ ] P0 Review Workspace For Reviewer Roles

Problem:
The docs describe the review process at a high level, but the product exposes different review
workspaces for `review-admin` and `review-member`, each with different tabs and responsibilities.

System evidence:

- `../tiangong-lca-next/src/pages/Review/index.tsx`

Docs currently involved:

- `docs/user-guide/data-review.md`

Needed:

- Add a role-based review workspace guide.
- Explain tab differences for unassigned, assigned, reviewed, pending, rejected, and member
  management views.
- Clarify which actions belong to authors, reviewers, team admins, and review admins.

### [ ] P0 System Management Workspace

Problem:
The product contains a hidden system-management page for system-level teams and members, but the docs
site has no public or maintainer-facing explanation of this capability.

System evidence:

- `../tiangong-lca-next/config/routes.ts`
- `../tiangong-lca-next/src/pages/ManageSystem/index.tsx`

Docs currently involved:

- none

Needed:

- Decide whether this should be public documentation, restricted maintainer documentation, or remain
  undocumented.
- If documented, explain roles, member operations, and intended audience.
- If intentionally undocumented, record the decision here and avoid accidental public mentions.

### [ ] P1 Global Top Bar Control Map

Problem:
The current control guide documents dark mode, language, docs entry, and notifications, but not the
global package import/export actions or the task center that now live in the same top bar.

System evidence:

- `../tiangong-lca-next/src/app.tsx`
- `../tiangong-lca-next/src/components/RightContent/index.tsx`

Docs currently involved:

- `docs/user-guide/key-functions-introduction.md`

Needed:

- Expand the top-bar section into a complete control map.
- Keep screenshots and labels current with the real header layout.

### [ ] P1 Permissions And Data-Space Matrix

Problem:
Permission boundaries are currently spread across multiple pages. Users must piece together behavior
for Open Data, Commercial Data, My Data, Team Data, review roles, and system roles.

System evidence:

- `../tiangong-lca-next/config/routes.ts`
- `../tiangong-lca-next/src/pages/Review/index.tsx`
- `../tiangong-lca-next/src/pages/ManageSystem/index.tsx`

Docs currently involved:

- `docs/user-guide/data.md`
- `docs/user-guide/team-function.md`
- `docs/user-guide/data-review.md`

Needed:

- Add one consolidated permissions matrix or a dedicated page.
- Cover view, copy, edit, contribute, import, export, submit-for-review, and admin actions.

### [ ] P1 Contributor Guide For The Docs/Product Sync Model

Problem:
The public docs repo has only a thin development page. It does not explain that this site is manually
synchronized with the product repo, where drift is likely to appear, or how contributors should check
the product before editing docs.

System evidence:

- `../tiangong-lca-next/AGENTS.md`
- `docusaurus.config.ts`
- `sidebars.ts`

Docs currently involved:

- `docs/dev/dev-env.md`
- `README.md`

Needed:

- Add a maintainer or contributor guide for docs/product synchronization.
- Explain source-of-truth boundaries between `docs/**`, `i18n/en/**`, and `../tiangong-lca-next`.
- Document which product files are common drift hotspots.

### [ ] P1 Chinese/English LCIA Parity

Problem:
The English LCIA page already covers both process-level and model-level calculation, while the Chinese
page is still narrower and does not fully match the shipped behavior.

System evidence:

- `../tiangong-lca-next/src/pages/Processes/Components/*`
- `../tiangong-lca-next/src/pages/LifeCycleModels/Components/*`

Docs currently involved:

- `docs/user-guide/lcia.md`
- `i18n/en/docusaurus-plugin-content-docs/current/user-guide/lcia.md`

Needed:

- Reconcile the Chinese and English pages.
- Decide whether the Chinese page is the source and update English, or vice versa, then keep both in
  sync in the same change.

### [ ] P1 Dev Environment Baseline Drift

Problem:
The docs repo still tells readers to use Node 22 for development, while the product-side engineering
baseline currently states Node 24.

System evidence:

- `../tiangong-lca-next/AGENTS.md`

Docs currently involved:

- `docs/dev/dev-env.md`

Needed:

- Re-verify the intended docs-repo and product-repo Node baselines.
- Update the developer guide to distinguish docs-site runtime requirements from product runtime
  requirements if they intentionally differ.

### [ ] P2 English-Orphan Page Cleanup

Problem:
There is at least one English-only page without a matching Chinese source page, which makes long-term
maintenance harder and obscures the intended source-of-truth workflow.

System evidence:

- `i18n/en/docusaurus-plugin-content-docs/current/user-guide/tiangong-data.md`

Docs currently involved:

- `i18n/en/docusaurus-plugin-content-docs/current/user-guide/tiangong-data.md`

Needed:

- Decide whether to restore a Chinese source page, merge the page into an existing document, or
  delete it if obsolete.
- Record the decision here when resolved.

## Completed

- None yet.
