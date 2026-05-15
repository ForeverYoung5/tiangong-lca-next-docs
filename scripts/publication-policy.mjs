import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(scriptDir, '..');
export const defaultSiteUrl = 'https://docs.tiangong.earth';
export const llmsPath = path.join(repoRoot, 'static', 'llms.txt');

export const publicDocSources = [
  {
    locale: 'zh-CN',
    label: 'Chinese',
    root: 'docs',
    routePrefix: '',
  },
  {
    locale: 'en',
    label: 'English',
    root: 'i18n/en/docusaurus-plugin-content-docs/current',
    routePrefix: '/en',
  },
];

const deniedPathPatterns = [
  /(^|\/)_docs(\/|$)/,
  /(^|\/)_docs\/plans(\/|$)/,
  /(^|\/)_docs\/incidents(\/|$)/,
  /(^|\/)_docs\/runbooks(\/|$)/,
  /(^|\/)\.agents(\/|$)/,
  /(^|\/)\.docpact\/runs(\/|$)/,
  /(^|\/)docs\/agents(\/|$)/,
  /(^|\/)AGENTS\.md$/,
  /(^|\/)TODO(?:\.|$)/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)build(\/|$)/,
  /(^|\/)\.docusaurus(\/|$)/,
];

const deniedOutputFragments = [
  '_docs/',
  '.agents/',
  '.docpact/runs/',
  'docs/agents/',
  'AGENTS.md',
  'TODO.docs-system-gaps',
  'not-for-publication',
  'agent-runbook',
];

const deniedFrontmatterValues = new Set([
  'draft',
  'internal',
  'incident',
  'plan',
  'private',
  'not-for-publication',
  'agent-runbook',
]);

export function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

export function relativeToRepo(filePath) {
  return toPosix(path.relative(repoRoot, filePath));
}

export function getGitCommit() {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA;
  }

  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

export function isDeniedPath(relativePath) {
  return deniedPathPatterns.some((pattern) => pattern.test(relativePath));
}

export function assertNoDeniedOutput(text, label) {
  const hits = deniedOutputFragments.filter((fragment) => text.includes(fragment));

  if (hits.length > 0) {
    throw new Error(`${label} contains denied publication fragments: ${hits.join(', ')}`);
  }
}

export function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return {};
  }

  const end = content.indexOf('\n---', 4);
  if (end === -1) {
    return {};
  }

  const frontmatter = {};
  const body = content.slice(4, end);

  for (const line of body.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    frontmatter[key] = rawValue.trim().replace(/^['"]|['"]$/g, '');
  }

  return frontmatter;
}

export function stripFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return content;
  }

  const end = content.indexOf('\n---', 4);
  if (end === -1) {
    return content;
  }

  return content.slice(end + 4).trimStart();
}

export function assertPublishableFrontmatter(frontmatter, relativePath) {
  const blockedKeys = ['draft', 'internal', 'private', 'not-for-publication'];

  for (const key of blockedKeys) {
    const value = String(frontmatter[key] ?? '').toLowerCase();
    if (value === 'true' || value === 'yes' || value === '1') {
      throw new Error(`${relativePath} is marked ${key} and cannot be published`);
    }
  }

  for (const key of ['status', 'docType', 'publication', 'visibility']) {
    const value = String(frontmatter[key] ?? '').toLowerCase();
    if (deniedFrontmatterValues.has(value)) {
      throw new Error(`${relativePath} has denied ${key}: ${frontmatter[key]}`);
    }
  }
}

export function listFilesRecursive(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const entries = fs.readdirSync(rootDir, {withFileTypes: true});
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(entryPath));
    } else {
      files.push(entryPath);
    }
  }

  return files;
}

function isMarkdownDoc(filePath) {
  return /\.(md|mdx)$/.test(filePath) && !path.basename(filePath).startsWith('_');
}

function normalizeSlug(slug) {
  if (!slug) {
    return null;
  }

  const withLeadingSlash = slug.startsWith('/') ? slug : `/${slug}`;
  return withLeadingSlash.replace(/\/+/g, '/');
}

function routeFromPath(source, sourceRelativePath) {
  let routePath = sourceRelativePath.replace(/\.(md|mdx)$/, '');

  if (routePath === 'intro') {
    routePath = '';
  } else if (routePath.endsWith('/index')) {
    routePath = routePath.slice(0, -'/index'.length);
  }

  return normalizeSlug(`${source.routePrefix}/${routePath}`);
}

export function routeForDoc(source, sourceRelativePath, frontmatter) {
  const slug = normalizeSlug(frontmatter.slug);
  if (slug) {
    if (!source.routePrefix) {
      return slug;
    }

    return slug === '/' ? `${source.routePrefix}/` : normalizeSlug(`${source.routePrefix}${slug}`);
  }

  return routeFromPath(source, sourceRelativePath);
}

export function absoluteDocUrl(routePath) {
  const siteUrl = (process.env.DOCS_SITE_URL || defaultSiteUrl).replace(/\/$/, '');
  return `${siteUrl}${routePath}`;
}

function firstHeading(markdownBody) {
  const heading = markdownBody.match(/^#\s+(.+)$/m);
  return heading?.[1]?.trim() || null;
}

function firstParagraph(markdownBody) {
  const bodyWithoutHeadings = markdownBody
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n')
    .trim();
  const paragraph = bodyWithoutHeadings
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .find((part) => part && !part.startsWith('```') && !part.startsWith('|'));

  return paragraph || '';
}

export function collectPublicDocs() {
  const docs = [];

  for (const source of publicDocSources) {
    const absoluteRoot = path.join(repoRoot, source.root);
    const files = listFilesRecursive(absoluteRoot).filter(isMarkdownDoc);

    for (const file of files) {
      const repoRelativePath = relativeToRepo(file);
      if (isDeniedPath(repoRelativePath)) {
        continue;
      }

      const sourceRelativePath = toPosix(path.relative(absoluteRoot, file));
      const content = fs.readFileSync(file, 'utf8');
      const frontmatter = parseFrontmatter(content);
      assertPublishableFrontmatter(frontmatter, repoRelativePath);

      const body = stripFrontmatter(content);
      const title = frontmatter.title || firstHeading(body) || sourceRelativePath.replace(/\.(md|mdx)$/, '');
      const description = frontmatter.description || firstParagraph(body);
      const routePath = routeForDoc(source, sourceRelativePath, frontmatter);

      docs.push({
        locale: source.locale,
        localeLabel: source.label,
        path: repoRelativePath,
        routePath,
        title,
        description,
        url: absoluteDocUrl(routePath),
      });
    }
  }

  return docs.sort((a, b) => {
    if (a.locale !== b.locale) {
      return a.locale.localeCompare(b.locale);
    }

    return a.routePath.localeCompare(b.routePath);
  });
}

export function validateContext7Config() {
  const configPath = path.join(repoRoot, 'context7.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('context7.json is required for Context7 publication scope control');
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const folders = new Set(config.folders || []);
  const excludeFolders = new Set(config.excludeFolders || []);
  const excludeFiles = new Set(config.excludeFiles || []);

  for (const source of publicDocSources) {
    if (!folders.has(source.root)) {
      throw new Error(`context7.json folders must include ${source.root}`);
    }
  }

  for (const folder of ['docs/agents', '.agents', '.docpact', '_docs', 'build', 'node_modules']) {
    if (!excludeFolders.has(folder)) {
      throw new Error(`context7.json excludeFolders must include ${folder}`);
    }
  }

  for (const file of ['AGENTS.md', 'README.md', 'TODO.docs-system-gaps.md']) {
    if (!excludeFiles.has(file)) {
      throw new Error(`context7.json excludeFiles must include ${file}`);
    }
  }

  return config;
}

export function validateLlmsText(text, docs) {
  assertNoDeniedOutput(text, 'static/llms.txt');

  const allowedOrigin = new URL(process.env.DOCS_SITE_URL || defaultSiteUrl).origin;
  const allowedPaths = new Set(docs.map((doc) => new URL(doc.url).pathname.replace(/\/$/, '') || '/'));
  const linkPattern = /\]\((https?:\/\/[^)]+)\)/g;
  const badLinks = [];
  let match;

  while ((match = linkPattern.exec(text)) !== null) {
    const url = new URL(match[1]);
    const normalizedPath = url.pathname.replace(/\/$/, '') || '/';
    if (url.origin !== allowedOrigin || !allowedPaths.has(normalizedPath)) {
      badLinks.push(match[1]);
    }
  }

  if (badLinks.length > 0) {
    throw new Error(`static/llms.txt contains links outside the public docs allowlist: ${badLinks.join(', ')}`);
  }
}
