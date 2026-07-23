#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const VISUAL_SCHEMA = 'docs-impact-visual-result.v1';
const MARKER_SCHEMA = 'docs-impact-visual-evidence:v1';
const ENGLISH_DOC_PREFIX =
  'i18n/en/docusaurus-plugin-content-docs/current/';
const GENERIC_ALT_TEXT = new Set([
  '',
  'alt',
  'alt text',
  'image',
  'img',
  'picture',
  'screenshot',
  '图',
  '图片',
  '截图',
  '替代文字',
]);
const PNG_SIGNATURE = '89504e470d0a1a0a';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const WARN_IMAGE_BYTES = 2 * 1024 * 1024;
const FULL_SHA_PATTERN = /^[0-9a-f]{40}$/i;

function parseArgs(argv) {
  const options = {
    root: '.',
    manifest: process.env.DOCS_SCREENSHOT_MANIFEST,
    diffFile: undefined,
    baseRef: process.env.DOCS_SCREENSHOT_BASE_REF || 'origin/main',
    output: '-',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--root') options.root = argv[++index];
    else if (argument === '--manifest') options.manifest = argv[++index];
    else if (argument === '--diff-file') options.diffFile = argv[++index];
    else if (argument === '--base-ref') options.baseRef = argv[++index];
    else if (argument === '--output') options.output = argv[++index];
    else if (argument === '--json') {
      // JSON is the only output format. This flag makes command intent explicit.
    } else if (argument === '--help' || argument === '-h') {
      return { help: true };
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

function usage() {
  return `Usage:
  node scripts/check-screenshots.mjs [--root PATH] [--manifest PATH]
    [--diff-file PATH] [--base-ref REF] [--output PATH] [--json]

Without --manifest, the command passes only when the selected diff contains no
public documentation screenshot changes.`;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function parsePng(buffer) {
  if (
    buffer.length < 24 ||
    buffer.subarray(0, 8).toString('hex') !== PNG_SIGNATURE
  ) {
    throw new Error('file is not a readable PNG');
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width === 0 || height === 0) {
    throw new Error('PNG dimensions must be positive');
  }

  let dpi;
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > buffer.length) {
      throw new Error(`PNG chunk ${type} exceeds file length`);
    }
    if (type === 'pHYs' && length >= 9) {
      const pixelsPerMeterX = buffer.readUInt32BE(offset + 8);
      const pixelsPerMeterY = buffer.readUInt32BE(offset + 12);
      const unit = buffer[offset + 16];
      if (unit === 1) {
        dpi = {
          x: pixelsPerMeterX * 0.0254,
          y: pixelsPerMeterY * 0.0254,
        };
      }
    }
    offset = chunkEnd;
    if (type === 'IEND') break;
  }

  return {
    width,
    height,
    aspectRatio: width / height,
    dpi,
    bytes: buffer.length,
    sha256: sha256(buffer),
  };
}

function normalizeRepoPath(value) {
  const normalized = path.posix
    .normalize(String(value || '').replaceAll('\\', '/').replace(/^\.\//, ''));
  if (
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new Error(`path escapes repository root: ${value}`);
  }
  return normalized;
}

function repoFile(root, repoPath) {
  const normalized = normalizeRepoPath(repoPath);
  const absoluteRoot = path.resolve(root);
  const absolutePath = path.resolve(absoluteRoot, normalized);
  if (
    absolutePath !== absoluteRoot &&
    !absolutePath.startsWith(`${absoluteRoot}${path.sep}`)
  ) {
    throw new Error(`path escapes repository root: ${repoPath}`);
  }
  return { normalized, absolutePath };
}

function expectedMirrorDoc(requiredDoc) {
  const normalized = normalizeRepoPath(requiredDoc);
  if (!normalized.startsWith('docs/')) {
    throw new Error(`requiredDoc must be under docs/**: ${requiredDoc}`);
  }
  return `${ENGLISH_DOC_PREFIX}${normalized.slice('docs/'.length)}`;
}

function expectedImageDirectory(docPath) {
  return path.posix.join(path.posix.dirname(normalizeRepoPath(docPath)), 'img');
}

function markdownImageReferences(markdown, docPath) {
  const references = [];
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  const lines = markdown.split(/\r?\n/);

  lines.forEach((line, lineIndex) => {
    for (const match of line.matchAll(pattern)) {
      let target = match[2];
      try {
        target = decodeURIComponent(target);
      } catch {
        // Keep the original value so the later path check reports it.
      }
      if (/^(?:https?:|data:|#)/i.test(target)) continue;
      const resolved = target.startsWith('/')
        ? normalizeRepoPath(`static/${target.slice(1)}`)
        : normalizeRepoPath(
            path.posix.join(path.posix.dirname(docPath), target),
          );
      references.push({
        alt: match[1].trim(),
        target: resolved,
        line: lineIndex + 1,
      });
    }
  });

  return references;
}

function meaningfulAlt(alt) {
  const normalized = String(alt || '').trim().toLocaleLowerCase('en-US');
  return !GENERIC_ALT_TEXT.has(normalized) && normalized.length >= 3;
}

function normalizeNearbyLine(line) {
  return String(line || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*#{1,6}\s*/, '')
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '')
    .replace(/[`*_~>|[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasNearbyExplanation(markdown, lineNumber) {
  const lines = markdown.split(/\r?\n/);
  const start = Math.max(0, lineNumber - 6);
  const end = Math.min(lines.length, lineNumber + 5);
  return lines
    .slice(start, end)
    .some((line) => {
      const trimmed = line.trim();
      if (
        !trimmed ||
        /^#{1,6}\s/.test(trimmed) ||
        /^```/.test(trimmed) ||
        trimmed === '---'
      ) {
        return false;
      }
      return normalizeNearbyLine(line).replace(/\s/g, '').length >= 8;
    });
}

function parseNameStatus(text) {
  const entries = new Map();
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const fields = line.split('\t');
    if (fields.length < 2) continue;
    const status = fields[0];
    if (/^[RC]/.test(status) && fields.length >= 3) {
      entries.set(normalizeRepoPath(fields[1]), 'D');
      entries.set(normalizeRepoPath(fields[2]), 'A');
      continue;
    }
    const file = normalizeRepoPath(fields.at(-1));
    entries.set(file, status);
  }
  return entries;
}

function gitNameStatus(root, baseRef) {
  const result = spawnSync(
    'git',
    ['diff', '--name-status', `${baseRef}...HEAD`],
    { cwd: root, encoding: 'utf8' },
  );
  if (result.status !== 0) {
    return { text: '', error: result.stderr.trim() || 'git diff failed' };
  }
  return { text: result.stdout, error: undefined };
}

function gitFileAt(root, ref, repoPath) {
  const result = spawnSync('git', ['show', `${ref}:${repoPath}`], {
    cwd: root,
    encoding: null,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) return undefined;
  return result.stdout;
}

function readManifest(manifestPath) {
  const payload = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (
    payload.schemaVersion !== VISUAL_SCHEMA &&
    payload.schema !== MARKER_SCHEMA
  ) {
    throw new Error(
      `manifest schema must be ${VISUAL_SCHEMA} or contain visual evidence captures`,
    );
  }
  return payload;
}

function requireString(capture, field, errors, label) {
  const value = capture[field];
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${label}: ${field} must be a non-empty string`);
    return undefined;
  }
  return value.trim();
}

function validateCapture({
  root,
  capture,
  diff,
  baseRef,
  errors,
  warnings,
}) {
  const label = `capture ${capture.id || '<missing-id>'}`;
  const id = requireString(capture, 'id', errors, label);
  requireString(capture, 'groupId', errors, label);
  const action = requireString(capture, 'action', errors, label);
  const requiredDoc = requireString(capture, 'requiredDoc', errors, label);
  const mirrorDoc = requireString(capture, 'mirrorDoc', errors, label);
  const asset = requireString(capture, 'asset', errors, label);
  const mirrorAsset = requireString(capture, 'mirrorAsset', errors, label);
  requireString(capture, 'sourceRepo', errors, label);
  const sourceCommit = requireString(capture, 'sourceCommit', errors, label);
  const declaredSha256 = requireString(capture, 'sha256', errors, label);
  requireString(capture, 'captureMode', errors, label);
  requireString(capture, 'routePattern', errors, label);
  requireString(capture, 'uiState', errors, label);
  requireString(capture, 'locale', errors, label);
  requireString(capture, 'compositionClass', errors, label);

  if (!['add', 'replace', 'reuse'].includes(action)) {
    errors.push(`${label}: action must be add, replace, or reuse`);
  }
  if (sourceCommit && !FULL_SHA_PATTERN.test(sourceCommit)) {
    errors.push(`${label}: sourceCommit must be a full 40-character SHA`);
  }
  if (
    !Array.isArray(capture.sourcePullRequests) ||
    capture.sourcePullRequests.length === 0 ||
    capture.sourcePullRequests.some(
      (reference) => !/^[^/\s]+\/[^#\s]+#\d+$/.test(String(reference)),
    )
  ) {
    errors.push(
      `${label}: sourcePullRequests must contain owner/repo#number values`,
    );
  }
  if (
    capture.routePattern &&
    (/[?&](?:token|key|secret|email)=/i.test(capture.routePattern) ||
      /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(capture.routePattern) ||
      /\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/i.test(capture.routePattern))
  ) {
    errors.push(`${label}: routePattern contains an identifier or secret-like value`);
  }

  if (
    !capture.viewport ||
    !Number.isInteger(capture.viewport.width) ||
    !Number.isInteger(capture.viewport.height) ||
    Number(capture.viewport.deviceScaleFactor) < 2
  ) {
    errors.push(
      `${label}: viewport must include integer width/height and deviceScaleFactor >= 2`,
    );
  }

  const privacy = capture.privacyReview;
  if (
    !privacy ||
    privacy.syntheticOrPublicData !== true ||
    privacy.secretsAbsent !== true ||
    privacy.reviewed !== true ||
    !Array.isArray(privacy.opaqueMasksApplied)
  ) {
    errors.push(
      `${label}: privacyReview must confirm synthetic/public data, opaque masks, absent secrets, and completed review`,
    );
  }

  let normalizedRequiredDoc;
  let normalizedMirrorDoc;
  let normalizedAsset;
  let normalizedMirrorAsset;
  try {
    normalizedRequiredDoc = normalizeRepoPath(requiredDoc);
    normalizedMirrorDoc = normalizeRepoPath(mirrorDoc);
    normalizedAsset = normalizeRepoPath(asset);
    normalizedMirrorAsset = normalizeRepoPath(mirrorAsset);

    const expectedMirror = expectedMirrorDoc(normalizedRequiredDoc);
    if (normalizedMirrorDoc !== expectedMirror) {
      errors.push(
        `${label}: mirrorDoc must be ${expectedMirror}, got ${normalizedMirrorDoc}`,
      );
    }
    if (
      path.posix.dirname(normalizedAsset) !==
      expectedImageDirectory(normalizedRequiredDoc)
    ) {
      errors.push(
        `${label}: asset must be under ${expectedImageDirectory(normalizedRequiredDoc)}/`,
      );
    }
    if (
      path.posix.dirname(normalizedMirrorAsset) !==
      expectedImageDirectory(normalizedMirrorDoc)
    ) {
      errors.push(
        `${label}: mirrorAsset must be under ${expectedImageDirectory(normalizedMirrorDoc)}/`,
      );
    }
    if (
      path.posix.basename(normalizedAsset) !==
      path.posix.basename(normalizedMirrorAsset)
    ) {
      errors.push(`${label}: asset and mirrorAsset must use the same file name`);
    }
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/.test(
        path.posix.basename(normalizedAsset),
      )
    ) {
      errors.push(`${label}: screenshot file name must be semantic kebab-case PNG`);
    }
  } catch (error) {
    errors.push(`${label}: ${error.message}`);
  }

  if (
    !normalizedRequiredDoc ||
    !normalizedMirrorDoc ||
    !normalizedAsset ||
    !normalizedMirrorAsset
  ) {
    return;
  }

  let assetMetadata;
  let mirrorMetadata;
  for (const [kind, repoPath] of [
    ['asset', normalizedAsset],
    ['mirrorAsset', normalizedMirrorAsset],
  ]) {
    try {
      const file = repoFile(root, repoPath);
      if (!fs.statSync(file.absolutePath).isFile()) {
        throw new Error('is not a regular file');
      }
      const metadata = parsePng(fs.readFileSync(file.absolutePath));
      if (kind === 'asset') assetMetadata = metadata;
      else mirrorMetadata = metadata;

      if (
        !metadata.dpi ||
        Math.abs(metadata.dpi.x - 144) > 1 ||
        Math.abs(metadata.dpi.y - 144) > 1
      ) {
        errors.push(`${label}: ${kind} must contain 144 DPI PNG metadata`);
      }
      if (metadata.bytes > MAX_IMAGE_BYTES) {
        errors.push(`${label}: ${kind} exceeds the 5 MiB hard limit`);
      } else if (metadata.bytes > WARN_IMAGE_BYTES) {
        warnings.push(`${label}: ${kind} exceeds 2 MiB`);
      }
    } catch (error) {
      errors.push(`${label}: ${kind} ${repoPath} ${error.message}`);
    }
  }

  if (!assetMetadata || !mirrorMetadata) return;

  if (!capture.localeComparison && assetMetadata.sha256 !== mirrorMetadata.sha256) {
    errors.push(`${label}: ordinary bilingual mirror assets must have identical SHA-256`);
  }
  if (
    capture.localeComparison === true &&
    (!capture.localeComparisonReason ||
      String(capture.localeComparisonReason).trim() === '')
  ) {
    errors.push(`${label}: localeComparison requires localeComparisonReason`);
  }
  if (
    declaredSha256 &&
    declaredSha256.toLowerCase() !== assetMetadata.sha256
  ) {
    errors.push(`${label}: sha256 does not match the asset`);
  }
  if (
    !capture.outputPixels ||
    capture.outputPixels.width !== assetMetadata.width ||
    capture.outputPixels.height !== assetMetadata.height
  ) {
    errors.push(`${label}: outputPixels do not match the PNG dimensions`);
  }
  if (
    !Number.isFinite(Number(capture.aspectRatio)) ||
    Math.abs(Number(capture.aspectRatio) - assetMetadata.aspectRatio) > 0.01
  ) {
    errors.push(`${label}: aspectRatio does not match the PNG dimensions`);
  }
  if (Number(capture.dpi) !== 144) {
    errors.push(`${label}: manifest dpi must be 144`);
  }

  let requiredMarkdown;
  let mirrorMarkdown;
  try {
    requiredMarkdown = fs.readFileSync(
      repoFile(root, normalizedRequiredDoc).absolutePath,
      'utf8',
    );
  } catch (error) {
    errors.push(`${label}: requiredDoc cannot be read: ${error.message}`);
  }
  try {
    mirrorMarkdown = fs.readFileSync(
      repoFile(root, normalizedMirrorDoc).absolutePath,
      'utf8',
    );
  } catch (error) {
    errors.push(`${label}: mirrorDoc cannot be read: ${error.message}`);
  }

  const docReferences = requiredMarkdown
    ? markdownImageReferences(requiredMarkdown, normalizedRequiredDoc).filter(
        (reference) => reference.target === normalizedAsset,
      )
    : [];
  const mirrorReferences = mirrorMarkdown
    ? markdownImageReferences(mirrorMarkdown, normalizedMirrorDoc).filter(
        (reference) => reference.target === normalizedMirrorAsset,
      )
    : [];

  if (docReferences.length === 0) {
    errors.push(`${label}: requiredDoc does not reference asset`);
  }
  if (mirrorReferences.length === 0) {
    errors.push(`${label}: mirrorDoc does not reference mirrorAsset`);
  }
  for (const reference of [...docReferences, ...mirrorReferences]) {
    if (!meaningfulAlt(reference.alt)) {
      errors.push(`${label}: image reference on line ${reference.line} has generic alt text`);
    }
  }
  const requiredDocHasNearbyExplanation = docReferences.some((reference) =>
    hasNearbyExplanation(requiredMarkdown, reference.line),
  );
  const mirrorDocHasNearbyExplanation = mirrorReferences.some((reference) =>
    hasNearbyExplanation(mirrorMarkdown, reference.line),
  );
  if (docReferences.length > 0 && !requiredDocHasNearbyExplanation) {
    errors.push(
      `${label}: requiredDoc has no nearby explanatory prose for the screenshot`,
    );
  }
  if (mirrorReferences.length > 0 && !mirrorDocHasNearbyExplanation) {
    errors.push(
      `${label}: mirrorDoc has no nearby explanatory prose for the screenshot`,
    );
  }
  if (
    Array.isArray(capture.callouts) &&
    capture.callouts.some(
      (callout) =>
        !Number.isInteger(callout.number) ||
        !String(callout.target || '').trim(),
    )
  ) {
    errors.push(`${label}: every callout must include an integer number and target`);
  }

  const assetStatus = diff.get(normalizedAsset);
  const mirrorStatus = diff.get(normalizedMirrorAsset);
  if (action === 'add') {
    if (!assetStatus?.startsWith('A') || !mirrorStatus?.startsWith('A')) {
      errors.push(`${label}: add requires both mirror assets to be added in the selected diff`);
    }
    if (gitFileAt(root, baseRef, normalizedAsset)) {
      errors.push(`${label}: add would overwrite an asset that already exists at ${baseRef}`);
    }
    const reference = requireString(
      capture,
      'compositionReference',
      errors,
      label,
    );
    if (reference) {
      try {
        const normalizedReference = normalizeRepoPath(reference);
        const referenceBuffer = gitFileAt(root, baseRef, normalizedReference);
        if (!referenceBuffer) {
          throw new Error(
            `does not exist at ${baseRef}: ${normalizedReference}`,
          );
        }
        const referenceMetadata = parsePng(referenceBuffer);
        const ratioDelta =
          Math.abs(assetMetadata.aspectRatio - referenceMetadata.aspectRatio) /
          referenceMetadata.aspectRatio;
        if (ratioDelta > 0.1 && !capture.aspectRatioChangeReason) {
          errors.push(
            `${label}: add aspect ratio differs from compositionReference by more than 10% without aspectRatioChangeReason`,
          );
        }
      } catch (error) {
        errors.push(`${label}: compositionReference cannot be used: ${error.message}`);
      }
    }
  } else if (action === 'replace') {
    if (
      (!assetStatus?.startsWith('M') || !mirrorStatus?.startsWith('M'))
    ) {
      errors.push(
        `${label}: replace requires both mirror assets to be modified in the selected diff`,
      );
    }
    const baseline = gitFileAt(root, baseRef, normalizedAsset);
    if (!baseline) {
      errors.push(`${label}: replace asset does not exist at ${baseRef}`);
    } else {
      try {
        const baselineMetadata = parsePng(baseline);
        if (baselineMetadata.sha256 === assetMetadata.sha256) {
          errors.push(`${label}: replace did not change the asset hash`);
        }
        const ratioDelta =
          Math.abs(assetMetadata.aspectRatio - baselineMetadata.aspectRatio) /
          baselineMetadata.aspectRatio;
        if (ratioDelta > 0.02 && !capture.aspectRatioChangeReason) {
          errors.push(
            `${label}: replace aspect ratio changed by more than 2% without aspectRatioChangeReason`,
          );
        }
        if (
          (assetMetadata.width !== baselineMetadata.width ||
            assetMetadata.height !== baselineMetadata.height) &&
          ratioDelta <= 0.02
        ) {
          warnings.push(
            `${label}: replace preserved composition ratio but changed pixel dimensions`,
          );
        }
      } catch (error) {
        errors.push(`${label}: baseline PNG cannot be parsed: ${error.message}`);
      }
    }
  } else if (action === 'reuse') {
    if (assetStatus?.startsWith('A') || assetStatus?.startsWith('M')) {
      warnings.push(`${label}: reuse unexpectedly changes the existing asset`);
    }
  }

  return { id, action, asset: normalizedAsset, mirrorAsset: normalizedMirrorAsset };
}

function changedScreenshotPaths(diff) {
  return [...diff.keys()].filter(
    (file) =>
      /\.(?:png|jpe?g|webp)$/i.test(file) &&
      (file.startsWith('docs/') || file.startsWith(ENGLISH_DOC_PREFIX)),
  );
}

export function validateScreenshotManifest({
  root,
  manifest,
  diffText = '',
  baseRef = 'origin/main',
}) {
  const absoluteRoot = path.resolve(root);
  const errors = [];
  const warnings = [];
  const diff = parseNameStatus(diffText);
  const captures = Array.isArray(manifest?.captures) ? manifest.captures : [];
  const blockedCaptures = Array.isArray(manifest?.blockedCaptures)
    ? manifest.blockedCaptures
    : [];

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    errors.push('manifest must be a JSON object');
  }
  if (
    manifest?.schemaVersion !== VISUAL_SCHEMA &&
    manifest?.schema !== MARKER_SCHEMA
  ) {
    errors.push(
      `manifest schema must be ${VISUAL_SCHEMA} or ${MARKER_SCHEMA}`,
    );
  }
  if (!/^[^/\s]+\/[^#\s]+#\d+$/.test(String(manifest?.docsImpactIssue))) {
    errors.push('manifest docsImpactIssue must be owner/repo#number');
  }
  if (!['mapped', 'replay'].includes(manifest?.stage)) {
    errors.push('manifest stage must be mapped or replay');
  }
  if (!Array.isArray(manifest?.captures)) {
    errors.push('manifest captures must be an array');
  }
  if (!Array.isArray(manifest?.blockedCaptures)) {
    errors.push('manifest blockedCaptures must be an array');
  }

  const ids = new Set();
  const validatedCaptures = [];
  for (const capture of captures) {
    if (ids.has(capture?.id)) {
      errors.push(`capture id is duplicated: ${capture.id}`);
    }
    ids.add(capture?.id);
    const validated = validateCapture({
      root: absoluteRoot,
      capture,
      diff,
      baseRef,
      errors,
      warnings,
    });
    if (validated) validatedCaptures.push(validated);
  }

  const declaredAssets = new Set();
  for (const capture of captures) {
    for (const candidate of [capture?.asset, capture?.mirrorAsset]) {
      if (!candidate) continue;
      try {
        declaredAssets.add(normalizeRepoPath(candidate));
      } catch {
        // validateCapture already reports invalid repository paths.
      }
    }
  }
  for (const changedAsset of changedScreenshotPaths(diff)) {
    if (!declaredAssets.has(changedAsset)) {
      errors.push(`changed screenshot is not declared by the manifest: ${changedAsset}`);
    }
  }

  for (const blocked of blockedCaptures) {
    if (!blocked || typeof blocked !== 'object') {
      errors.push('blockedCaptures entries must be objects');
      continue;
    }
    if (
      blocked.asset ||
      blocked.mirrorAsset ||
      blocked.sha256 ||
      blocked.outputPixels
    ) {
      errors.push(
        `blocked capture ${blocked.id || '<missing-id>'} must not claim asset/hash completion`,
      );
    }
  }

  const status = errors.length > 0
    ? 'fail'
    : warnings.length > 0
      ? 'warning'
      : captures.length > 0
        ? 'pass'
        : 'not_applicable';

  return {
    schemaVersion: 'docs-screenshots-check.v1',
    status,
    valid: errors.length === 0,
    root: absoluteRoot,
    baseRef,
    captureCount: captures.length,
    blockedCaptureCount: blockedCaptures.length,
    validatedCaptures,
    changedScreenshotPaths: changedScreenshotPaths(diff),
    warnings,
    errors,
  };
}

function writeResult(result, output) {
  const payload = `${JSON.stringify(result, null, 2)}\n`;
  if (!output || output === '-') process.stdout.write(payload);
  else fs.writeFileSync(output, payload, { mode: 0o600 });
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  const root = path.resolve(options.root);
  let diffText = '';
  if (options.diffFile) {
    diffText = fs.readFileSync(options.diffFile, 'utf8');
  } else {
    const gitDiff = gitNameStatus(root, options.baseRef);
    if (gitDiff.error) {
      throw new Error(
        `cannot determine screenshot diff against ${options.baseRef}: ${gitDiff.error}`,
      );
    }
    diffText = gitDiff.text;
  }

  if (!options.manifest) {
    const diff = parseNameStatus(diffText);
    const changedAssets = changedScreenshotPaths(diff);
    const result = {
      schemaVersion: 'docs-screenshots-check.v1',
      status: changedAssets.length > 0 ? 'fail' : 'not_applicable',
      valid: changedAssets.length === 0,
      root,
      baseRef: options.baseRef,
      captureCount: 0,
      blockedCaptureCount: 0,
      validatedCaptures: [],
      changedScreenshotPaths: changedAssets,
      warnings: [],
      errors:
        changedAssets.length > 0
          ? [
              `screenshot changes require --manifest: ${changedAssets.join(', ')}`,
            ]
          : [],
    };
    writeResult(result, options.output);
    return result.valid ? 0 : 1;
  }

  const manifest = readManifest(options.manifest);
  const result = validateScreenshotManifest({
    root,
    manifest,
    diffText,
    baseRef: options.baseRef,
  });
  writeResult(result, options.output);
  return result.valid ? 0 : 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    process.exitCode = main();
  } catch (error) {
    writeResult(
      {
        schemaVersion: 'docs-screenshots-check.v1',
        status: 'fail',
        valid: false,
        warnings: [],
        errors: [error instanceof Error ? error.message : String(error)],
      },
      '-',
    );
    process.exitCode = 1;
  }
}
