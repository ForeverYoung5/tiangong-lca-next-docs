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
const PRODUCTION_ORIGIN = 'https://docs.tiangong.earth';

function normalizedOrigin(value) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

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

function walkMdxFiles(root) {
  const files = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && entry.name.endsWith('.mdx')) files.push(absolute);
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
  const attribute = /(?<![\w:-])\b(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
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
  const attribute = /(?<![\w:-])\b(?:id|name)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let match;

  while ((match = attribute.exec(html)) !== null) {
    anchors.add(decodeHtml(match[1] ?? match[2]));
  }

  return anchors;
}

function blankNonNewlines(value) {
  return value.replace(/[^\r\n]/g, ' ');
}

export function maskMdxCode(source) {
  let masked = source.replace(/<!--[\s\S]*?-->/g, (value) => blankNonNewlines(value));
  const lines = masked.match(/.*(?:\r?\n|$)/g) ?? [];
  let fence = null;
  masked = lines.map((line) => {
    const marker = line.match(/^[ \t]{0,3}(`{3,}|~{3,})/);
    if (!fence && marker) {
      fence = { character: marker[1][0], length: marker[1].length };
      return blankNonNewlines(line);
    }
    if (fence) {
      const closing = new RegExp(`^[ \\t]{0,3}${fence.character}{${fence.length},}[ \\t]*(?:\\r?\\n)?$`);
      if (closing.test(line)) fence = null;
      return blankNonNewlines(line);
    }
    return line;
  }).join('');
  return masked.replace(/(`+)([^`\n]*?)\1/g, (value) => blankNonNewlines(value));
}

export function extractMarkdownLinks(source) {
  const links = [];
  const masked = maskMdxCode(source);
  const pattern = /(?<!!)\[[^\]\n]+\]\(\s*/g;
  let match;
  while ((match = pattern.exec(masked)) !== null) {
    let cursor = pattern.lastIndex;
    let value = '';
    if (masked[cursor] === '<') {
      const end = masked.indexOf('>', cursor + 1);
      if (end === -1) continue;
      value = masked.slice(cursor + 1, end);
      pattern.lastIndex = end + 1;
    } else {
      let nested = 0;
      const start = cursor;
      for (; cursor < masked.length; cursor += 1) {
        const character = masked[cursor];
        if (/\s/.test(character) && nested === 0) break;
        if (character === '(' && masked[cursor - 1] !== '\\') nested += 1;
        if (character === ')' && masked[cursor - 1] !== '\\') {
          if (nested === 0) break;
          nested -= 1;
        }
      }
      value = masked.slice(start, cursor);
      pattern.lastIndex = cursor;
    }
    if (value) links.push({ value, ...lineAndColumn(source, match.index) });
  }

  const reference = /^[ \t]{0,3}\[[^\]\n]+\]:[ \t]*(?:<([^>\n]+)>|([^\s]+))/gm;
  while ((match = reference.exec(masked)) !== null) {
    links.push({ value: match[1] ?? match[2], ...lineAndColumn(source, match.index) });
  }

  const jsxHref = /(?<![\w:-])\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  while ((match = jsxHref.exec(masked)) !== null) {
    links.push({ value: match[1] ?? match[2], ...lineAndColumn(source, match.index) });
  }
  return links;
}

function localizedDocTarget(value) {
  const match = value.match(/^\/(zh|en|de|fr)(\/docs(?:\/[^?#]*)?)(?:[?#].*)?$/);
  if (!match) return null;
  return { locale: match[1], pathname: match[2], normalized: `/:lang${match[2]}` };
}

export function checkSourceLinks({ contentDir }) {
  const absoluteContent = path.resolve(contentDir);
  const files = walkMdxFiles(absoluteContent);
  const groups = new Map();
  const issues = [];

  for (const file of files) {
    const relative = path.relative(absoluteContent, file).split(path.sep).join('/');
    const match = relative.match(/^(.*?)(?:\.(en|de|fr))?\.mdx$/);
    if (!match) continue;
    const logicalPath = match[1];
    const locale = match[2] ?? 'zh';
    const source = fs.readFileSync(file, 'utf8');
    const targets = new Set();

    for (const link of extractMarkdownLinks(source)) {
      if (/^\.{1,2}\//.test(link.value)) {
        issues.push({
          source: relative,
          line: link.line,
          column: link.column,
          attribute: 'md-link',
          value: link.value,
          reason: 'path-relative internal links are forbidden; use a locale-absolute route',
        });
        continue;
      }

      const target = localizedDocTarget(link.value);
      if (!target) continue;
      if (target.locale !== locale) {
        issues.push({
          source: relative,
          line: link.line,
          column: link.column,
          attribute: 'md-link',
          value: link.value,
          reason: `locale mismatch: ${locale} source links to ${target.locale}`,
        });
      }
      if (!target.pathname.endsWith('/')) {
        issues.push({
          source: relative,
          line: link.line,
          column: link.column,
          attribute: 'md-link',
          value: link.value,
          reason: 'documentation routes must use the canonical trailing slash',
        });
      }
      targets.add(target.normalized);
    }

    const group = groups.get(logicalPath) ?? { files: new Map(), targets: new Map() };
    group.files.set(locale, relative);
    group.targets.set(locale, targets);
    groups.set(logicalPath, group);
  }

  const locales = ['zh', 'en', 'de', 'fr'];
  for (const [logicalPath, group] of groups) {
    if (!locales.every((locale) => group.files.has(locale))) continue;
    const union = new Set(locales.flatMap((locale) => [...group.targets.get(locale)]));
    for (const target of union) {
      for (const locale of locales) {
        if (group.targets.get(locale).has(target)) continue;
        issues.push({
          source: group.files.get(locale),
          line: 1,
          column: 1,
          attribute: 'md-link-set',
          value: target.replace('/:lang', `/${locale}`),
          reason: `localized link topology differs for ${logicalPath}; target is missing from ${locale}`,
        });
      }
    }
  }

  return { checkedSourceFiles: files.length, issues };
}

export function checkLinks({ outDir, internalOrigins = [] }) {
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
  const localOrigins = new Set([SITE_ORIGIN, PRODUCTION_ORIGIN]);
  for (const candidate of [process.env.CANONICAL_ORIGIN, ...internalOrigins]) {
    const origin = normalizedOrigin(candidate);
    if (origin) localOrigins.add(origin);
  }

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

      if (!localOrigins.has(resolved.origin)) {
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
    `across ${result.checkedHtml} HTML files and ${result.checkedSourceFiles ?? 0} MDX sources ` +
    `(${result.skippedExternal} external skipped)`;
  if (result.issues.length === 0) return `${summary}\n[check-links] ALL GREEN`;

  const details = result.issues.map(
    ({ source, line, column, attribute, value, reason }) =>
      `  ${source}:${line}:${column} ${attribute}="${value}" — ${reason}`,
  );
  return `${summary}\n[check-links] ${result.issues.length} FAILURE(S):\n${details.join('\n')}`;
}

function main() {
  const outDir = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, '..', 'out'));
  const contentDir = path.resolve(import.meta.dirname, '..', 'content', 'docs');
  const outputResult = checkLinks({ outDir });
  const sourceResult = checkSourceLinks({ contentDir });
  const result = {
    ...outputResult,
    checkedSourceFiles: sourceResult.checkedSourceFiles,
    issues: [...sourceResult.issues, ...outputResult.issues],
  };
  const report = formatReport(result);
  (result.issues.length === 0 ? console.log : console.error)(report);
  if (result.issues.length > 0) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
