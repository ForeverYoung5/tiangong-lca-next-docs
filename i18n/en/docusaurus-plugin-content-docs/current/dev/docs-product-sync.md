---
description: Explain how maintainers should keep the docs site aligned with the tiangong-lca-next product repo, including source boundaries, verification workflow, and screenshot rules.
---

# Docs / Product Sync Guide

This page is for maintainers and contributors working on `tiangong-lca-next-docs` alongside the
adjacent product repo at `../tiangong-lca-next`.

## Core source boundaries

Keep these three content sources clearly separated:

### 1. Chinese public-doc source

- `docs/**`

This is the primary source for published Chinese documentation.

### 2. English mirror

- `i18n/en/docusaurus-plugin-content-docs/current/**`

This is not an automatically correct translation output. It is a manually maintained English mirror.
Whenever the Chinese source changes, the English mirror should be updated in the same change.

### 3. Real product behaviour

- `../tiangong-lca-next`

Whenever the question is about entry points, button labels, role-gated visibility, data scopes,
hidden routes, or import/export flow, treat the product repo as the source of truth rather than the
old docs.

## Default verification target

Default online verification target:

- `https://lca.tiangong.earth/`

`../tiangong-lca-next` is currently published directly from commits on `main`, so documentation work
normally does not need a separate “is production consistent with `main`?” verification step. The
default approach is:

- treat the `main` branch implementation in `../tiangong-lca-next` as the product source of truth
- open the live system only when you need screenshots, need to confirm role-gated or hidden UI, or
  have reason to suspect deployment drift, caching issues, or an online incident

## Secrets and verification variables

The docs repo root `.env` file may contain:

- `TIANGONG_LCA_USERNAME`
- `TIANGONG_LCA_PASSWORD`
- `TIANGONG_LCA_API_KEY`

Only two rules matter:

- Record variable names only, never values
- Never place actual values in docs, screenshot notes, commit messages, or summaries

## Recommended maintenance workflow

### 1. Start from the backlog

Check the root file:

- `TODO.docs-system-gaps.md`

If you discover new drift, record it there before or during the same editing session.

### 2. Check the product before editing docs

Common product hotspots include:

- `config/routes.ts`
- `src/app.tsx`
- `src/components/RightContent/**`
- `src/components/ImportTidasPackage/**`
- `src/components/ExportTidasPackage/**`
- `src/components/LcaTaskCenter/**`
- `src/pages/Account/**`
- `src/pages/Processes/Analysis/**`
- `src/pages/Review/**`
- `src/pages/ManageSystem/**`

These are the places where doc drift tends to appear first.

### 3. Update Chinese and English together

For public-site content, the default expectation is to update both in one pass:

- Chinese `docs/**`
- English `i18n/en/**`

Do not update only one side and leave the other for later.

### 4. Update discovery paths when navigation changes

If you add, rename, or reorganise pages, also check:

- `sidebars.ts`
- `docs/intro.md`
- `docs/user-guide/overview.md`
- The matching English mirror pages

### 5. Update the TODO after each resolved gap

`TODO.docs-system-gaps.md` is a long-term maintenance record, not a one-off checklist.

When a gap is resolved, re-scoped, or clarified, update the file in the same work session.

## Screenshot and Playwright policy

When screenshots need to be added or refreshed:

- Prefer Playwright for login and capture rather than memory-based description
- Keep the screenshot style aligned with the rest of the project
- Unless the screenshot is specifically meant to explain locale differences, use the **English UI**
  for screenshots even when the surrounding documentation page is Chinese
- If only a local area is needed, do not force a full `1920x1080` composition. Prefer a tighter
  crop with higher capture density and output quality that matches the repo's existing screenshots
- Add **red boxes or callouts** when an entry point or field needs emphasis

Annotation rules:

- Prefer **numbered callouts** instead of drawing full sentence labels directly onto the screenshot.
- Explain the numbers in the surrounding Markdown text rather than placing long Chinese or English
  phrases inside the image.
- Keep the actual UI readable. Labels, badges, and boxes should not cover the icon, field, button,
  or text the reader needs to inspect.
- Place number badges outside the target region whenever possible. Use leader lines, extra padding,
  or a wider crop instead of stacking labels directly on top of the UI.
- If one area is too dense, widen the crop, increase the scale, or split the explanation into
  multiple focused screenshots instead of forcing overlapping annotations.
- If text must appear inside the image, keep it short, clean, and visually secondary to the real UI.
- For local screenshots, prefer higher sampling density such as `deviceScaleFactor >= 2`, and keep
  PNG density metadata aligned with the repo's existing assets (many current screenshots are around
  144 DPI).

Documentation goal and screenshot tradeoff:

- This site is primarily for **human readers**, so screenshots should be added when they materially
  improve understanding of entry points, control placement, or multi-step UI flows.
- Do not force screenshots onto every page. Prefer a smaller number of high-value images over
  repetitive image-heavy documentation.
- If text plus accurate UI labels is already clear enough, text-only documentation is acceptable.
- Prioritise screenshots for:
  - global top-bar controls or hidden entry points
  - multi-step modal workflows
  - role-dependent workspaces
  - pages whose existing screenshots are clearly stale

Screenshots are especially useful when:

- top-bar controls move or change significantly
- hidden entry points such as Review or System Management are hard to explain with text alone
- existing screenshots are clearly out of date

If the docs can be updated accurately from code inspection and the screenshot toolchain is unstable,
complete the text sync first and add screenshots in a later pass; however, if a page is primarily a
human task guide and the missing screenshot would materially hurt comprehension, treat screenshot
completion as a high-priority follow-up.

## Minimum verification

After public-doc changes, run at least:

```bash
npm run lint
npm run build
```

If the sync also changes information architecture, manually inspect the local site and verify:

- new pages appear in the sidebar
- Chinese and English links still correspond
- intro and user-guide navigation pages expose the new content
