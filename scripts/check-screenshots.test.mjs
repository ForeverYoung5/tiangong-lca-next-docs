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
  'public/assets/docs/1781bb8c/output-3.png',
);
const DOCS = [
  ['zh', 'content/docs/user-guide/visual-proof.mdx'],
  ['en', 'content/docs/user-guide/visual-proof.en.mdx'],
  ['de', 'content/docs/user-guide/visual-proof.de.mdx'],
  ['fr', 'content/docs/user-guide/visual-proof.fr.mdx'],
];

function runGit(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

function digest(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function dimensions(buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function changedPng(buffer) {
  const chunk = Buffer.alloc(13);
  chunk.writeUInt32BE(1, 0);
  chunk.write('tEXt', 4, 'ascii');
  chunk[8] = 120;
  return Buffer.concat([buffer.subarray(0, -12), chunk, buffer.subarray(-12)]);
}

function assetPath(buffer, fileName) {
  return 'public/assets/docs/' + digest(buffer).slice(0, 8) + '/' + fileName;
}

function writeFile(root, relative, contents) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function writeAsset(root, asset, buffer) {
  writeFile(root, asset, buffer);
}

function assetUrl(asset) {
  return '/' + asset.slice('public/'.length);
}

function writeDocs(root, asset, options = {}) {
  const omittedLocale = options.omittedLocale;
  const genericLocale = options.genericLocale;
  for (const [locale, doc] of DOCS) {
    const alt = locale === genericLocale ? 'image' : 'LCIA evidence status panel';
    const image = locale === omittedLocale
      ? ''
      : '\n\n![' + alt + '](' + assetUrl(asset) + ')\n';
    writeFile(
      root,
      doc,
      '# Visual proof\n\nThis paragraph explains how readers interpret the evidence status.' + image,
    );
  }
}

function writeBaselineDocs(root) {
  for (const [, doc] of DOCS) {
    writeFile(root, doc, '# Visual proof\n\nBaseline public guidance without a screenshot.\n');
  }
}

function initRepository(root) {
  runGit(root, ['init', '-b', 'main']);
  runGit(root, ['config', 'user.email', 'screenshots@example.invalid']);
  runGit(root, ['config', 'user.name', 'Screenshot Validator Test']);
}

function baseCapture(action, asset, buffer) {
  const size = dimensions(buffer);
  return {
    id: 'visual-proof-panel',
    groupId: 'visual-proof',
    action,
    asset,
    documentBindings: DOCS.map(([locale, requiredDoc]) => ({ locale, requiredDoc })),
    sourceRepo: 'linancn/tiangong-lca-next',
    sourceCommit: 'a'.repeat(40),
    sourcePullRequests: ['linancn/tiangong-lca-next#1'],
    captureMode: 'local-candidate',
    routePattern: '/process-analysis',
    uiState: 'evidence panel open',
    locale: 'en-US',
    viewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    compositionClass: 'wide-workspace',
    outputPixels: size,
    aspectRatio: size.width / size.height,
    dpi: 144,
    callouts: [],
    privacyReview: {
      syntheticOrPublicData: true,
      opaqueMasksApplied: [],
      secretsAbsent: true,
      reviewed: true,
    },
    sha256: digest(buffer),
  };
}

function manifest(capture) {
  return {
    schemaVersion: 'docs-impact-visual-result.v1',
    assetContract: 'fumadocs-shared-v1',
    docsImpactIssue: 'tiangong-lca/workspace#1',
    stage: 'mapped',
    captures: capture ? [capture] : [],
    blockedCaptures: [],
  };
}

function fixture(action = 'add') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fumadocs-screenshots-'));
  initRepository(root);
  const oldBuffer = fs.readFileSync(PNG_FIXTURE);
  const newBuffer = changedPng(oldBuffer);
  const oldAsset = assetPath(oldBuffer, 'visual-proof.png');
  const newAsset = assetPath(newBuffer, 'visual-proof.png');

  if (action === 'add') {
    writeBaselineDocs(root);
    writeAsset(root, oldAsset, oldBuffer);
    runGit(root, ['add', '.']);
    runGit(root, ['commit', '-m', 'baseline']);
    writeDocs(root, newAsset);
    writeAsset(root, newAsset, newBuffer);
    const capture = baseCapture('add', newAsset, newBuffer);
    capture.compositionReference = oldAsset;
    const diffText = DOCS.map(([, doc]) => 'M\t' + doc).join('\n') +
      '\nA\t' + newAsset + '\n';
    return { root, capture, manifest: manifest(capture), diffText, baseRef: 'HEAD', oldAsset, newAsset };
  }

  writeDocs(root, oldAsset);
  writeAsset(root, oldAsset, oldBuffer);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'baseline']);
  if (action === 'reuse') {
    const capture = baseCapture('reuse', oldAsset, oldBuffer);
    return {
      root,
      capture,
      manifest: manifest(capture),
      diffText: '',
      baseRef: 'HEAD',
      oldAsset,
      newAsset,
    };
  }

  writeDocs(root, newAsset);
  writeAsset(root, newAsset, newBuffer);
  fs.unlinkSync(path.join(root, oldAsset));
  const capture = baseCapture('replace', newAsset, newBuffer);
  capture.previousAsset = oldAsset;
  const diffText = DOCS.map(([, doc]) => 'M\t' + doc).join('\n') +
    '\nD\t' + oldAsset + '\nA\t' + newAsset + '\n';
  return { root, capture, manifest: manifest(capture), diffText, baseRef: 'HEAD', oldAsset, newAsset };
}

function cleanup(value) {
  fs.rmSync(value.root, { recursive: true, force: true });
}

test('accepts no captures and no changed screenshots as not applicable', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fumadocs-screenshots-none-'));
  try {
    const result = validateScreenshotManifest({
      root,
      manifest: manifest(undefined),
      diffText: 'M\tcontent/docs/user-guide/lcia.mdx\n',
      baseRef: 'HEAD',
    });
    assert.equal(result.valid, true, result.errors.join('\n'));
    assert.equal(result.status, 'not_applicable');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('accepts an added content-addressed screenshot bound to four locales', () => {
  const value = fixture('add');
  try {
    const result = validateScreenshotManifest(value);
    assert.equal(result.valid, true, result.errors.join('\n'));
    assert.equal(result.status, 'pass');
  } finally {
    cleanup(value);
  }
});

test('rejects a missing locale binding or reference', () => {
  const value = fixture('add');
  try {
    value.capture.documentBindings.pop();
    writeDocs(value.root, value.newAsset, { omittedLocale: 'fr' });
    const result = validateScreenshotManifest(value);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('missing locale fr')));
  } finally {
    cleanup(value);
  }
});

test('rejects generic alt text in any locale', () => {
  const value = fixture('add');
  try {
    writeDocs(value.root, value.newAsset, { genericLocale: 'de' });
    const result = validateScreenshotManifest(value);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('generic alt text')));
  } finally {
    cleanup(value);
  }
});

test('rejects undeclared public screenshot changes', () => {
  const value = fixture('add');
  try {
    value.diffText += 'A\tpublic/assets/docs/12345678/undeclared.png\n';
    const result = validateScreenshotManifest(value);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('not declared')));
  } finally {
    cleanup(value);
  }
});

test('accepts replacement with a new hash path and safe old-asset deletion', () => {
  const value = fixture('replace');
  try {
    const result = validateScreenshotManifest(value);
    assert.equal(result.valid, true, result.errors.join('\n'));
  } finally {
    cleanup(value);
  }
});

test('requires deleting an unreferenced previous asset', () => {
  const value = fixture('replace');
  try {
    writeAsset(value.root, value.oldAsset, fs.readFileSync(PNG_FIXTURE));
    value.diffText = value.diffText.replace('D\t' + value.oldAsset + '\n', '');
    const result = validateScreenshotManifest(value);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('must be deleted')));
  } finally {
    cleanup(value);
  }
});

test('rejects deletion when another document still references the previous asset', () => {
  const value = fixture('replace');
  try {
    writeFile(
      value.root,
      'content/docs/other.mdx',
      '# Other\n\nThis page still explains the prior screenshot.\n\n![Prior visual](' +
        assetUrl(value.oldAsset) + ')\n',
    );
    const result = validateScreenshotManifest(value);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('remains referenced')));
  } finally {
    cleanup(value);
  }
});

test('rejects replacement whose binary hash did not change', () => {
  const value = fixture('replace');
  try {
    const oldBuffer = fs.readFileSync(PNG_FIXTURE);
    const sameAsset = assetPath(oldBuffer, 'visual-proof-copy.png');
    writeAsset(value.root, sameAsset, oldBuffer);
    writeDocs(value.root, sameAsset);
    value.capture.asset = sameAsset;
    value.capture.sha256 = digest(oldBuffer);
    value.capture.outputPixels = dimensions(oldBuffer);
    value.capture.aspectRatio =
      value.capture.outputPixels.width / value.capture.outputPixels.height;
    value.diffText = DOCS.map(([, doc]) => 'M\t' + doc).join('\n') +
      '\nD\t' + value.oldAsset + '\nA\t' + sameAsset + '\n';
    const result = validateScreenshotManifest(value);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('did not change hash')));
  } finally {
    cleanup(value);
  }
});

test('accepts reuse and rejects an unexpected asset mutation', () => {
  const value = fixture('reuse');
  try {
    const pass = validateScreenshotManifest(value);
    assert.equal(pass.valid, true, pass.errors.join('\n'));
    value.diffText = 'M\t' + value.oldAsset + '\n';
    const fail = validateScreenshotManifest(value);
    assert.equal(fail.valid, false);
    assert.ok(fail.errors.some((error) => error.includes('reuse must not change')));
  } finally {
    cleanup(value);
  }
});

test('rejects retired bilingual capture fields for Fumadocs', () => {
  const value = fixture('add');
  try {
    delete value.manifest.assetContract;
    const result = validateScreenshotManifest(value);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('assetContract')));
  } finally {
    cleanup(value);
  }
});

test('rejects repository-escaping asset paths', () => {
  const value = fixture('add');
  try {
    value.capture.asset = '../outside.png';
    const result = validateScreenshotManifest(value);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('escapes repository root')));
  } finally {
    cleanup(value);
  }
});

test('CLI emits the stable JSON result contract', () => {
  const value = fixture('add');
  try {
    const manifestPath = path.join(value.root, 'visual-result.json');
    const diffPath = path.join(value.root, 'name-status.txt');
    fs.writeFileSync(manifestPath, JSON.stringify(value.manifest));
    fs.writeFileSync(diffPath, value.diffText);
    const result = spawnSync(
      process.execPath,
      [
        path.join(REPO_ROOT, 'scripts/check-screenshots.mjs'),
        '--',
        '--root',
        value.root,
        '--manifest',
        manifestPath,
        '--diff-file',
        diffPath,
        '--base-ref',
        value.baseRef,
        '--json',
      ],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.schemaVersion, 'docs-screenshots-check.v2');
    assert.equal(payload.assetContract, 'fumadocs-shared-v1');
    assert.equal(payload.status, 'pass');
    assert.equal(payload.valid, true);
  } finally {
    cleanup(value);
  }
});
