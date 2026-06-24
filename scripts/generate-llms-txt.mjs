#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import {
  collectPublicDocs,
  getGitCommit,
  llmsPath,
  repoRoot,
  validateLlmsText,
} from './publication-policy.mjs';

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');

function escapeLine(text) {
  return String(text)
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function plainText(text) {
  return String(text)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text, maxLength = 180) {
  const normalized = escapeLine(plainText(text));
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function renderLlmsText(docs) {
  const commit = getGitCommit();
  const lines = [
    '# TianGong LCA Documentation',
    '',
    'Public documentation index for TianGong LCA users, integrators, and AI retrieval systems.',
    '',
    `Source site: https://docs.tiangong.earth`,
    `Source repository: https://github.com/linancn/tiangong-lca-next-docs`,
    `Source commit: ${commit}`,
    'Publication scope: public Docusaurus docs only. Internal agent, plan, incident, TODO, and governance execution records are excluded.',
    '',
  ];

  const locales = [...new Set(docs.map((doc) => doc.locale))].sort();
  for (const locale of locales) {
    const localeDocs = docs.filter((doc) => doc.locale === locale);
    const localeLabel = localeDocs[0]?.localeLabel || locale;

    lines.push(`## ${localeLabel} (${locale})`);
    lines.push('');

    for (const doc of localeDocs) {
      const description = truncate(doc.description);
      const suffix = description ? ` - ${description}` : '';
      lines.push(`- [${escapeLine(doc.title)}](${doc.url})${suffix}`);
    }

    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

function firstDifference(expected, actual) {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const maxLines = Math.max(expectedLines.length, actualLines.length);

  for (let index = 0; index < maxLines; index += 1) {
    if (expectedLines[index] !== actualLines[index]) {
      return {
        line: index + 1,
        expected: expectedLines[index] ?? '<missing>',
        actual: actualLines[index] ?? '<missing>',
      };
    }
  }

  return null;
}

function normalizeForCheck(text) {
  return text.replace(/^Source commit: .+$/m, 'Source commit: <normalized>');
}

const docs = collectPublicDocs();
const generated = renderLlmsText(docs);
validateLlmsText(generated, docs);

if (checkOnly) {
  if (!fs.existsSync(llmsPath)) {
    console.error(`Missing ${path.relative(repoRoot, llmsPath)}. Run npm run docs:llms.`);
    process.exit(1);
  }

  const current = fs.readFileSync(llmsPath, 'utf8');
  if (normalizeForCheck(current) !== normalizeForCheck(generated)) {
    const diff = firstDifference(normalizeForCheck(generated), normalizeForCheck(current));
    console.error(`${path.relative(repoRoot, llmsPath)} is out of date. Run npm run docs:llms.`);
    if (diff) {
      console.error(`First difference at line ${diff.line}:`);
      console.error(`  expected: ${diff.expected}`);
      console.error(`  actual:   ${diff.actual}`);
    }
    process.exit(1);
  }

  console.log(`${path.relative(repoRoot, llmsPath)} is up to date (${docs.length} docs).`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(llmsPath), {recursive: true});
fs.writeFileSync(llmsPath, generated);
console.log(`Generated ${path.relative(repoRoot, llmsPath)} with ${docs.length} public docs.`);
