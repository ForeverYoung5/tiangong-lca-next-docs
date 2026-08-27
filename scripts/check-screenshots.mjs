#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { maskMdxCode } from './check-links.mjs';

const VISUAL_SCHEMA = 'docs-impact-visual-result.v1';
const MARKER_SCHEMA = 'docs-impact-visual-evidence:v1';
const ASSET_CONTRACT = 'fumadocs-shared-v1';
const CHECK_SCHEMA = 'docs-screenshots-check.v2';
const LOCALES = ['zh', 'en', 'de', 'fr'];
const GENERIC_ALT_TEXT = new Set([
  '',
  'alt',
  'alt text',
  'alternative text',
  'alternativer text',
  'image',
  'img',
  'picture',
  'screenshot',
  'texte alternatif',
  '图',
  '图片',
  '截图',
  '替代文字',
]);
const PNG_SIGNATURE = '89504e470d0a1a0a';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const WARN_IMAGE_BYTES = 2 * 1024 * 1024;
const FULL_SHA_PATTERN = /^[0-9a-f]{40}$/i;
const ISSUE_PATTERN = /^[^/\s]+\/[^#\s]+#\d+$/;
const ASSET_PATTERN =
  /^public\/assets\/docs\/([0-9a-f]{8})\/([a-z0-9]+(?:-[a-z0-9]+)*\.png)$/;

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
    if (argument === '--') continue;
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
  if (absolutePath !== absoluteRoot && !absolutePath.startsWith(absoluteRoot + path.sep)) {
    throw new Error('path escapes repository root: ' + repoPath);
  }
  const realRoot = fs.realpathSync(absoluteRoot);
  let ancestor = absolutePath;
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) throw new Error('cannot resolve path: ' + repoPath);
    ancestor = parent;
  }
  const realAncestor = fs.realpathSync(ancestor);
  if (realAncestor !== realRoot && !realAncestor.startsWith(realRoot + path.sep)) {
    throw new Error('path resolves outside repository root: ' + repoPath);
  }
  if (fs.existsSync(absolutePath) && fs.lstatSync(absolutePath).isSymbolicLink()) {
    throw new Error('path must not be a symbolic link: ' + repoPath);
  }
  return { normalized, absolutePath };
}

function localeOfDoc(docPath) {
  const match = normalizeRepoPath(docPath).match(/\.(en|de|fr)\.mdx$/);
  return match ? match[1] : 'zh';
}

function expectedDocumentFamily(docPath) {
  const normalized = normalizeRepoPath(docPath);
  if (!normalized.startsWith('content/docs/') || !normalized.endsWith('.mdx')) {
    throw new Error('document must be under content/docs/**/*.mdx: ' + docPath);
  }
  const canonical = normalized.replace(/\.(?:en|de|fr)\.mdx$/, '.mdx');
  const stem = canonical.slice(0, -4);
  return new Map([
    ['zh', canonical],
    ['en', stem + '.en.mdx'],
    ['de', stem + '.de.mdx'],
    ['fr', stem + '.fr.mdx'],
  ]);
}

function resolveAssetReference(value, docPath) {
  let target = String(value || '').trim();
  try {
    target = decodeURIComponent(target);
  } catch {
    // Preserve malformed source for deterministic validation.
  }
  target = target.split(/[?#]/, 1)[0];
  if (!target || /^(?:https?:|data:|#)/i.test(target)) return undefined;
  if (target.startsWith('/')) return normalizeRepoPath('public/' + target.slice(1));
  return normalizeRepoPath(path.posix.join(path.posix.dirname(docPath), target));
}

function lineNumberAt(sourceText, offset) {
  return sourceText.slice(0, offset).split(/\r?\n/).length;
}

function markdownImageReferences(markdown, docPath) {
  const references = [];
  const masked = maskMdxCode(markdown);
  const pattern =
    /!\[([^\]]*)\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g;
  let match;
  while ((match = pattern.exec(masked)) !== null) {
    const target = resolveAssetReference(match[2] || match[3], docPath);
    if (target) {
      references.push({
        alt: match[1].trim(),
        target,
        line: lineNumberAt(markdown, match.index),
      });
    }
  }
  const jsx = /<(?:img|Image)\b[^>]*>/g;
  while ((match = jsx.exec(masked)) !== null) {
    const src = match[0].match(/\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/);
    if (!src) continue;
    const target = resolveAssetReference(src[1] || src[2], docPath);
    if (!target) continue;
    const alt = match[0].match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/);
    references.push({
      alt: (alt && (alt[1] || alt[2])) || '',
      target,
      line: lineNumberAt(markdown, match.index),
    });
  }
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

function readRegularFile(root, repoPath) {
  const file = repoFile(root, repoPath);
  if (!fs.statSync(file.absolutePath).isFile()) throw new Error('is not a regular file');
  return fs.readFileSync(file.absolutePath);
}

function allMdxFiles(root) {
  const base = path.join(root, 'content', 'docs');
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(path.relative(root, absolute).split(path.sep).join('/'));
      }
    }
  };
  if (fs.existsSync(base)) visit(base);
  return files;
}

function referencesToAsset(root, asset) {
  const references = [];
  for (const doc of allMdxFiles(root)) {
    const markdown = fs.readFileSync(repoFile(root, doc).absolutePath, 'utf8');
    for (const reference of markdownImageReferences(markdown, doc)) {
      if (reference.target === asset) references.push({ doc, line: reference.line });
    }
  }
  return references;
}

function changedStatus(status) {
  return Boolean(status && /^[AMR]/.test(status));
}

function validateBindings(root, capture, asset, diff, errors, label) {
  if (!Array.isArray(capture.documentBindings)) {
    errors.push(label + ': documentBindings must be an array');
    return [];
  }
  if (capture.documentBindings.length !== 4) {
    errors.push(label + ': documentBindings must contain zh, en, de, and fr');
  }
  const bindings = [];
  const seen = new Set();
  for (const [index, value] of capture.documentBindings.entries()) {
    const itemLabel = label + ': documentBindings[' + index + ']';
    const locale = requireString(value, 'locale', errors, itemLabel);
    const requiredDoc = requireString(value, 'requiredDoc', errors, itemLabel);
    if (!locale || !requiredDoc) continue;
    if (!LOCALES.includes(locale)) errors.push(itemLabel + ': unsupported locale ' + locale);
    if (seen.has(locale)) errors.push(label + ': duplicate locale ' + locale);
    seen.add(locale);
    try {
      const doc = normalizeRepoPath(requiredDoc);
      if (localeOfDoc(doc) !== locale) errors.push(itemLabel + ': locale does not match ' + doc);
      bindings.push({ locale, requiredDoc: doc });
    } catch (error) {
      errors.push(itemLabel + ': ' + error.message);
    }
  }
  for (const locale of LOCALES) {
    if (!seen.has(locale)) errors.push(label + ': missing locale ' + locale);
  }
  if (bindings.length > 0) {
    try {
      const expected = expectedDocumentFamily(bindings[0].requiredDoc);
      for (const binding of bindings) {
        if (expected.get(binding.locale) !== binding.requiredDoc) {
          errors.push(label + ': ' + binding.locale + ' document must be ' + expected.get(binding.locale));
        }
      }
    } catch (error) {
      errors.push(label + ': ' + error.message);
    }
  }
  for (const binding of bindings) {
    let markdown;
    try {
      markdown = fs.readFileSync(repoFile(root, binding.requiredDoc).absolutePath, 'utf8');
    } catch (error) {
      errors.push(label + ': cannot read ' + binding.requiredDoc + ': ' + error.message);
      continue;
    }
    const references = markdownImageReferences(markdown, binding.requiredDoc).filter(
      (reference) => reference.target === asset,
    );
    if (references.length === 0) {
      errors.push(label + ': ' + binding.requiredDoc + ' does not reference ' + asset);
      continue;
    }
    for (const reference of references) {
      if (!meaningfulAlt(reference.alt)) {
        errors.push(label + ': ' + binding.requiredDoc + ':' + reference.line + ' has generic alt text');
      }
    }
    if (!references.some((reference) => hasNearbyExplanation(markdown, reference.line))) {
      errors.push(label + ': ' + binding.requiredDoc + ' has no nearby explanatory prose');
    }
    if (['add', 'replace'].includes(capture.action) && !changedStatus(diff.get(binding.requiredDoc))) {
      errors.push(label + ': ' + capture.action + ' requires a change in ' + binding.requiredDoc);
    }
  }
  return bindings;
}

function validateCommonCapture(capture, errors, label) {
  const id = requireString(capture, 'id', errors, label);
  requireString(capture, 'groupId', errors, label);
  const action = requireString(capture, 'action', errors, label);
  requireString(capture, 'sourceRepo', errors, label);
  const sourceCommit = requireString(capture, 'sourceCommit', errors, label);
  requireString(capture, 'captureMode', errors, label);
  const routePattern = requireString(capture, 'routePattern', errors, label);
  requireString(capture, 'uiState', errors, label);
  requireString(capture, 'locale', errors, label);
  requireString(capture, 'compositionClass', errors, label);
  if (!['add', 'replace', 'reuse'].includes(action)) {
    errors.push(label + ': action must be add, replace, or reuse');
  }
  if (sourceCommit && !FULL_SHA_PATTERN.test(sourceCommit)) {
    errors.push(label + ': sourceCommit must be a full 40-character SHA');
  }
  if (
    !Array.isArray(capture.sourcePullRequests) ||
    capture.sourcePullRequests.length === 0 ||
    capture.sourcePullRequests.some((reference) => !ISSUE_PATTERN.test(String(reference)))
  ) {
    errors.push(label + ': sourcePullRequests must contain owner/repo#number values');
  }
  if (
    routePattern &&
    (/[?&](?:token|key|secret|email)=/i.test(routePattern) ||
      /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(routePattern) ||
      /\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/i.test(routePattern))
  ) {
    errors.push(label + ': routePattern contains an identifier or secret');
  }
  if (
    !capture.viewport ||
    !Number.isInteger(capture.viewport.width) ||
    !Number.isInteger(capture.viewport.height) ||
    Number(capture.viewport.deviceScaleFactor) < 2
  ) {
    errors.push(label + ': viewport must contain integer dimensions and deviceScaleFactor >= 2');
  }
  const privacy = capture.privacyReview;
  if (
    !privacy ||
    privacy.syntheticOrPublicData !== true ||
    privacy.secretsAbsent !== true ||
    privacy.reviewed !== true ||
    !Array.isArray(privacy.opaqueMasksApplied)
  ) {
    errors.push(label + ': privacyReview is incomplete');
  }
  return { id, action };
}

function validateCapture({ root, capture, diff, baseRef, errors, warnings }) {
  const label = 'capture ' + ((capture && capture.id) || '<missing-id>');
  if (!capture || typeof capture !== 'object' || Array.isArray(capture)) {
    errors.push(label + ': capture must be an object');
    return undefined;
  }
  const common = validateCommonCapture(capture, errors, label);
  if ((capture.assetContract || capture.manifestAssetContract) !== ASSET_CONTRACT) {
    errors.push(label + ': assetContract must be ' + ASSET_CONTRACT);
  }
  const assetValue = requireString(capture, 'asset', errors, label);
  const declaredHash = requireString(capture, 'sha256', errors, label);
  let asset;
  let metadata;
  if (assetValue) {
    try {
      asset = normalizeRepoPath(assetValue);
      const match = asset.match(ASSET_PATTERN);
      if (!match) errors.push(label + ': asset path is not a content-addressed Fumadocs PNG');
      metadata = parsePng(readRegularFile(root, asset));
      if (match && match[1] !== metadata.sha256.slice(0, 8)) {
        errors.push(label + ': asset directory must equal its SHA-256 prefix');
      }
      if (!metadata.dpi || Math.abs(metadata.dpi.x - 144) > 1 || Math.abs(metadata.dpi.y - 144) > 1) {
        errors.push(label + ': asset must contain 144 DPI metadata');
      }
      if (metadata.bytes > MAX_IMAGE_BYTES) errors.push(label + ': asset exceeds 5 MiB');
      else if (metadata.bytes > WARN_IMAGE_BYTES) warnings.push(label + ': asset exceeds 2 MiB');
      if (declaredHash && declaredHash.toLowerCase() !== metadata.sha256) {
        errors.push(label + ': sha256 does not match asset');
      }
      if (
        !capture.outputPixels ||
        capture.outputPixels.width !== metadata.width ||
        capture.outputPixels.height !== metadata.height
      ) {
        errors.push(label + ': outputPixels do not match PNG dimensions');
      }
      if (
        !Number.isFinite(Number(capture.aspectRatio)) ||
        Math.abs(Number(capture.aspectRatio) - metadata.aspectRatio) > 0.01
      ) {
        errors.push(label + ': aspectRatio does not match PNG dimensions');
      }
      if (Number(capture.dpi) !== 144) errors.push(label + ': manifest dpi must be 144');
    } catch (error) {
      errors.push(label + ': asset ' + assetValue + ' ' + error.message);
    }
  }
  const bindings = asset ? validateBindings(root, capture, asset, diff, errors, label) : [];
  if (
    Array.isArray(capture.callouts) &&
    capture.callouts.some(
      (callout) => !Number.isInteger(callout.number) || !String(callout.target || '').trim(),
    )
  ) {
    errors.push(label + ': every callout must contain a number and target');
  }
  if (!asset || !metadata || !common.action) {
    return { ...common, asset, documentBindings: bindings };
  }

  const status = diff.get(asset);
  if (common.action === 'add') {
    if (!status || !status.startsWith('A')) errors.push(label + ': add requires an added asset');
    if (gitFileAt(root, baseRef, asset)) errors.push(label + ': add overwrites an existing asset');
    const reference = requireString(capture, 'compositionReference', errors, label);
    if (reference) {
      try {
        const baseline = gitFileAt(root, baseRef, normalizeRepoPath(reference));
        if (!baseline) throw new Error('compositionReference does not exist at ' + baseRef);
        const old = parsePng(baseline);
        const delta = Math.abs(metadata.aspectRatio - old.aspectRatio) / old.aspectRatio;
        if (delta > 0.1 && !capture.aspectRatioChangeReason) {
          errors.push(label + ': add ratio differs by more than 10% without a reason');
        }
      } catch (error) {
        errors.push(label + ': ' + error.message);
      }
    }
    if (capture.previousAsset) errors.push(label + ': add must not declare previousAsset');
  } else if (common.action === 'replace') {
    const previousValue = requireString(capture, 'previousAsset', errors, label);
    if (!status || !status.startsWith('A')) errors.push(label + ': replace requires a new asset');
    if (previousValue) {
      try {
        const previous = normalizeRepoPath(previousValue);
        if (!ASSET_PATTERN.test(previous)) errors.push(label + ': previousAsset path is invalid');
        if (previous === asset) errors.push(label + ': replace must not overwrite the old path');
        const baseline = gitFileAt(root, baseRef, previous);
        if (!baseline) errors.push(label + ': previousAsset is absent at ' + baseRef);
        else {
          const old = parsePng(baseline);
          if (old.sha256 === metadata.sha256) errors.push(label + ': replace did not change hash');
          const delta = Math.abs(metadata.aspectRatio - old.aspectRatio) / old.aspectRatio;
          if (delta > 0.02 && !capture.aspectRatioChangeReason) {
            errors.push(label + ': replace ratio changed by more than 2% without a reason');
          }
          if ((metadata.width !== old.width || metadata.height !== old.height) && delta <= 0.02) {
            warnings.push(label + ': replace changed pixel dimensions');
          }
        }
        const remaining = referencesToAsset(root, previous);
        const previousStatus = diff.get(previous);
        if (remaining.length === 0 && (!previousStatus || !previousStatus.startsWith('D'))) {
          errors.push(label + ': unreferenced previousAsset must be deleted');
        }
        if (remaining.length > 0 && previousStatus && previousStatus.startsWith('D')) {
          errors.push(label + ': previousAsset remains referenced by ' +
            remaining.map((reference) => reference.doc).join(', '));
        }
      } catch (error) {
        errors.push(label + ': previousAsset ' + error.message);
      }
    }
  } else if (common.action === 'reuse') {
    if (status && /^[AMD]/.test(status)) errors.push(label + ': reuse must not change asset');
    const baseline = gitFileAt(root, baseRef, asset);
    if (!baseline) errors.push(label + ': reuse asset is absent at ' + baseRef);
    else if (sha256(baseline) !== metadata.sha256) errors.push(label + ': reuse differs from base');
    if (capture.previousAsset) errors.push(label + ': reuse must not declare previousAsset');
  }
  return {
    ...common,
    asset,
    previousAsset: capture.previousAsset,
    documentBindings: bindings,
  };
}

function changedScreenshotPaths(diff) {
  return [...diff.keys()].filter(
    (file) =>
      /\.(?:png|jpe?g|webp)$/i.test(file) &&
      file.startsWith('public/assets/docs/'),
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
  const captures = Array.isArray(manifest && manifest.captures) ? manifest.captures : [];
  const blockedCaptures = Array.isArray(manifest && manifest.blockedCaptures)
    ? manifest.blockedCaptures
    : [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    errors.push('manifest must be a JSON object');
  }
  if (
    manifest &&
    manifest.schemaVersion !== VISUAL_SCHEMA &&
    manifest.schema !== MARKER_SCHEMA
  ) {
    errors.push('manifest schema must be ' + VISUAL_SCHEMA + ' or ' + MARKER_SCHEMA);
  }
  if (!ISSUE_PATTERN.test(String(manifest && manifest.docsImpactIssue))) {
    errors.push('manifest docsImpactIssue must be owner/repo#number');
  }
  if (!['mapped', 'replay'].includes(manifest && manifest.stage)) {
    errors.push('manifest stage must be mapped or replay');
  }
  if (!Array.isArray(manifest && manifest.captures)) {
    errors.push('manifest captures must be an array');
  }
  if (!Array.isArray(manifest && manifest.blockedCaptures)) {
    errors.push('manifest blockedCaptures must be an array');
  }

  const ids = new Set();
  for (const capture of [...captures, ...blockedCaptures]) {
    if (capture && ids.has(capture.id)) errors.push('capture id is duplicated: ' + capture.id);
    if (capture) ids.add(capture.id);
  }
  const validatedCaptures = [];
  for (const capture of captures) {
    const validated = validateCapture({
      root: absoluteRoot,
      capture: { ...capture, manifestAssetContract: manifest.assetContract },
      diff,
      baseRef,
      errors,
      warnings,
    });
    if (validated) validatedCaptures.push(validated);
  }

  const declaredAssets = new Set();
  for (const capture of captures) {
    for (const candidate of [capture && capture.asset, capture && capture.previousAsset]) {
      if (!candidate) continue;
      try {
        declaredAssets.add(normalizeRepoPath(candidate));
      } catch {
        // validateCapture reports the exact path error.
      }
    }
  }
  const changedAssets = changedScreenshotPaths(diff);
  for (const changedAsset of changedAssets) {
    if (!declaredAssets.has(changedAsset)) {
      errors.push('changed screenshot is not declared by the manifest: ' + changedAsset);
    }
  }

  for (const blocked of blockedCaptures) {
    if (!blocked || typeof blocked !== 'object' || Array.isArray(blocked)) {
      errors.push('blockedCaptures entries must be objects');
      continue;
    }
    const claimed = ['asset', 'previousAsset', 'sha256', 'outputPixels', 'documentBindings'].filter(
      (field) => blocked[field],
    );
    if (claimed.length > 0) {
      errors.push(
        'blocked capture ' + (blocked.id || '<missing-id>') +
          ' must not claim ' + claimed.join(', '),
      );
    }
  }

  const status =
    errors.length > 0 ? 'fail' :
      warnings.length > 0 ? 'warning' :
        captures.length > 0 ? 'pass' : 'not_applicable';
  return {
    schemaVersion: CHECK_SCHEMA,
    assetContract: ASSET_CONTRACT,
    status,
    valid: errors.length === 0,
    root: absoluteRoot,
    baseRef,
    captureCount: captures.length,
    blockedCaptureCount: blockedCaptures.length,
    validatedCaptures,
    changedScreenshotPaths: changedAssets,
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
      schemaVersion: CHECK_SCHEMA,
      assetContract: ASSET_CONTRACT,
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
        schemaVersion: CHECK_SCHEMA,
        assetContract: ASSET_CONTRACT,
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
