#!/usr/bin/env node
/**
 * Validate every local href/src emitted by the static export.
 *
 * References are resolved with the WHATWG URL implementation against the
 * public route represented by each HTML file. This deliberately checks the
 * browser-visible output rather than guessing how relative MDX links compile.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://docs.invalid';

function walkHtmlFiles(root) {
  const files = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  }

  walk(root);
  return files.sort();
}

function decodeHtml(value) {
  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|(amp|apos|gt|lt|quot));/gi,
    (entity, decimal, hexadecimal, named) => {
      if (decimal) return String.fromCodePoint(Number.parseInt(decimal, 10));
      if (hexadecimal) return String.fromCodePoint(Number.parseInt(hexadecimal, 16));
      return { amp: '&', apos: "'", gt: '>', lt: '<', quot: '"' }[named.toLowerCase()];
    },
  );
}

function routeForHtml(outDir, htmlFile) {
  const relative = path.relative(outDir, htmlFile).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  return `/${relative}`;
}

function lineAndColumn(source, offset) {
  const before = source.slice(0, offset);
  const lines = before.split('\n');
  return { line: lines.length, column: lines.at(-1).length + 1 };
}

export function extractReferences(html) {
  const references = [];
  const attribute = /\b(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let match;

  while ((match = attribute.exec(html)) !== null) {
    references.push({
      attribute: match[1].toLowerCase(),
      value: decodeHtml(match[2] ?? match[3]),
      ...lineAndColumn(html, match.index),
    });
  }

  return references;
}

function decodeUrlComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function resolveOutputFile(outDir, pathname) {
  const decodedPath = decodeUrlComponent(pathname);
  if (decodedPath === null) return { error: 'invalid percent-encoding in URL path' };

  const relative = decodedPath.replace(/^\/+/, '');
  const candidates = decodedPath.endsWith('/')
    ? [path.join(relative, 'index.html')]
    : [relative, `${relative}.html`, path.join(relative, 'index.html')];

  for (const candidate of candidates) {
    const absolute = path.resolve(outDir, candidate);
    const relativeToOut = path.relative(outDir, absolute);
    if (relativeToOut.startsWith('..') || path.isAbsolute(relativeToOut)) continue;
    if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) return { absolute };
  }

  return { error: `target does not exist (${decodedPath})` };
}

function collectAnchors(html) {
  const anchors = new Set();
  const attribute = /\b(?:id|name)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let match;

  while ((match = attribute.exec(html)) !== null) {
    anchors.add(decodeHtml(match[1] ?? match[2]));
  }

  return anchors;
}

export function checkLinks({ outDir }) {
  const absoluteOut = path.resolve(outDir);
  if (!fs.existsSync(absoluteOut)) {
    return {
      checkedHtml: 0,
      checkedReferences: 0,
      skippedExternal: 0,
      issues: [{ source: '.', line: 1, column: 1, attribute: '-', value: '-', reason: 'out directory does not exist' }],
    };
  }

  const issues = [];
  const anchorCache = new Map();
  let checkedReferences = 0;
  let skippedExternal = 0;
  const htmlFiles = walkHtmlFiles(absoluteOut);

  for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const route = routeForHtml(absoluteOut, htmlFile);
    const base = new URL(route, SITE_ORIGIN);
    const source = path.relative(absoluteOut, htmlFile).split(path.sep).join('/');

    for (const reference of extractReferences(html)) {
      const { attribute, value, line, column } = reference;
      if (value === '') continue;

      let resolved;
      try {
        resolved = new URL(value, base);
      } catch {
        issues.push({ source, line, column, attribute, value, reason: 'invalid URL' });
        continue;
      }

      if (resolved.origin !== SITE_ORIGIN) {
        skippedExternal += 1;
        continue;
      }

      checkedReferences += 1;
      const target = resolveOutputFile(absoluteOut, resolved.pathname);
      if (target.error) {
        issues.push({ source, line, column, attribute, value, reason: target.error });
        continue;
      }

      if (attribute !== 'href' || resolved.hash.length <= 1 || !target.absolute.endsWith('.html')) continue;

      const fragment = decodeUrlComponent(resolved.hash.slice(1));
      if (fragment === null) {
        issues.push({ source, line, column, attribute, value, reason: 'invalid percent-encoding in URL fragment' });
        continue;
      }

      let anchors = anchorCache.get(target.absolute);
      if (!anchors) {
        anchors = collectAnchors(fs.readFileSync(target.absolute, 'utf8'));
        anchorCache.set(target.absolute, anchors);
      }
      if (!anchors.has(fragment)) {
        issues.push({
          source,
          line,
          column,
          attribute,
          value,
          reason: `fragment does not exist (#${fragment})`,
        });
      }
    }
  }

  return { checkedHtml: htmlFiles.length, checkedReferences, skippedExternal, issues };
}

export function formatReport(result) {
  const summary =
    `[check-links] checked ${result.checkedReferences} local href/src references ` +
    `across ${result.checkedHtml} HTML files (${result.skippedExternal} external skipped)`;
  if (result.issues.length === 0) return `${summary}\n[check-links] ALL GREEN`;

  const details = result.issues.map(
    ({ source, line, column, attribute, value, reason }) =>
      `  ${source}:${line}:${column} ${attribute}="${value}" — ${reason}`,
  );
  return `${summary}\n[check-links] ${result.issues.length} FAILURE(S):\n${details.join('\n')}`;
}

function main() {
  const outDir = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, '..', 'out'));
  const result = checkLinks({ outDir });
  const report = formatReport(result);
  (result.issues.length === 0 ? console.log : console.error)(report);
  if (result.issues.length > 0) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
