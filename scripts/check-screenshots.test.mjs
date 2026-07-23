import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { validateScreenshotManifest } from './check-screenshots.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const PNG_FIXTURE = path.join(
  REPO_ROOT,
  'docs/user-guide/img/top-bar-controls-current.png',
);

function runGit(root, args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
}

function makeFixture({ alt = 'Notification center controls' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-screenshots-check-'));
  const requiredDoc = 'docs/user-guide/notifications.md';
  const mirrorDoc =
    'i18n/en/docusaurus-plugin-content-docs/current/user-guide/notifications.md';
  const asset = 'docs/user-guide/img/notification-center-controls.png';
  const mirrorAsset =
    'i18n/en/docusaurus-plugin-content-docs/current/user-guide/img/notification-center-controls.png';
  const compositionReference =
    'docs/user-guide/img/top-bar-controls-current.png';

  for (const directory of [
    path.dirname(path.join(root, requiredDoc)),
    path.dirname(path.join(root, mirrorDoc)),
    path.dirname(path.join(root, asset)),
    path.dirname(path.join(root, mirrorAsset)),
  ]) {
    fs.mkdirSync(directory, { recursive: true });
  }
  fs.copyFileSync(PNG_FIXTURE, path.join(root, compositionReference));
  fs.writeFileSync(
    path.join(root, requiredDoc),
    `# 通知\n\n点击顶部通知控件可查看分类后的消息。\n\n![${alt}](./img/notification-center-controls.png)\n`,
  );
  fs.writeFileSync(
    path.join(root, mirrorDoc),
    `# Notifications\n\nUse the top-bar control to open categorized notifications.\n\n![${alt}](./img/notification-center-controls.png)\n`,
  );
  runGit(root, ['init', '-b', 'main']);
  runGit(root, ['config', 'user.email', 'docs-screenshots@example.invalid']);
  runGit(root, ['config', 'user.name', 'Docs Screenshot Test']);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'baseline composition and docs']);
  fs.copyFileSync(PNG_FIXTURE, path.join(root, asset));
  fs.copyFileSync(PNG_FIXTURE, path.join(root, mirrorAsset));

  const capture = {
    id: 'grp-notifications-controls',
    groupId: 'grp-notifications',
    action: 'add',
    requiredDoc,
    mirrorDoc,
    asset,
    mirrorAsset,
    sourceRepo: 'linancn/tiangong-lca-next',
    sourceCommit: 'a'.repeat(40),
    sourcePullRequests: ['linancn/tiangong-lca-next#1'],
    captureMode: 'local-candidate',
    routePattern: '/notifications',
    uiState: 'notification center open',
    locale: 'en-US',
    viewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    compositionClass: 'control-strip',
    compositionReference,
    outputPixels: { width: 536, height: 216 },
    aspectRatio: 536 / 216,
    dpi: 144,
    callouts: [],
    privacyReview: {
      syntheticOrPublicData: true,
      opaqueMasksApplied: [],
      secretsAbsent: true,
      reviewed: true,
    },
    sha256: crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(root, asset)))
      .digest('hex'),
  };
  const manifest = {
    schemaVersion: 'docs-impact-visual-result.v1',
    docsImpactIssue: 'tiangong-lca/workspace#1',
    stage: 'mapped',
    captures: [capture],
    blockedCaptures: [],
  };
  const diffText = `A\t${asset}\nA\t${mirrorAsset}\n`;

  return { root, capture, manifest, diffText, baseRef: 'HEAD' };
}

test('accepts bilingual mirrored assets with nearby prose and no fixed figure phrase', () => {
  const fixture = makeFixture();
  try {
    const result = validateScreenshotManifest(fixture);
    assert.equal(result.valid, true, result.errors.join('\n'));
    assert.equal(result.status, 'pass');
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('rejects a missing English mirror asset', () => {
  const fixture = makeFixture();
  try {
    fs.unlinkSync(path.join(fixture.root, fixture.capture.mirrorAsset));
    const result = validateScreenshotManifest(fixture);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('mirrorAsset')));
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('rejects generic alt text', () => {
  const fixture = makeFixture({ alt: 'image' });
  try {
    const result = validateScreenshotManifest(fixture);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('generic alt text')));
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('rejects a changed screenshot that is not declared by the manifest', () => {
  const fixture = makeFixture();
  try {
    fixture.diffText +=
      'A\tdocs/user-guide/img/undeclared-screenshot.png\n';
    const result = validateScreenshotManifest(fixture);
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((error) =>
        error.includes('changed screenshot is not declared'),
      ),
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('rejects add when the selected diff does not contain both assets', () => {
  const fixture = makeFixture();
  try {
    const result = validateScreenshotManifest({
      ...fixture,
      diffText: '',
    });
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((error) =>
        error.includes('add requires both mirror assets'),
      ),
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('requires nearby explanatory prose in each language page', () => {
  const fixture = makeFixture();
  try {
    fs.writeFileSync(
      path.join(fixture.root, fixture.capture.mirrorDoc),
      '# Notifications\n\n![Notification center controls](./img/notification-center-controls.png)\n',
    );
    const result = validateScreenshotManifest(fixture);
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((error) =>
        error.includes('mirrorDoc has no nearby explanatory prose'),
      ),
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('rejects a replace whose binary hash did not change', () => {
  const fixture = makeFixture();
  try {
    fixture.capture.action = 'replace';
    delete fixture.capture.compositionReference;
    runGit(fixture.root, [
      'add',
      fixture.capture.asset,
      fixture.capture.mirrorAsset,
    ]);
    runGit(fixture.root, ['commit', '-m', 'baseline assets']);
    const diffText = `M\t${fixture.capture.asset}\nM\t${fixture.capture.mirrorAsset}\n`;
    const result = validateScreenshotManifest({
      ...fixture,
      diffText,
      baseRef: 'HEAD',
    });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('did not change')));
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});
