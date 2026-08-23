import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { checkLinks, extractReferences, formatReport } from './check-links.mjs';

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'next-docs-links-'));
  for (const [relative, contents] of Object.entries(files)) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  }
  return root;
}

test('resolves sibling and cross-category links with browser URL semantics', (t) => {
  const outDir = fixture({
    'en/docs/quick-start/login/index.html': [
      '<a href="../register/">sibling</a>',
      '<a href="../../user-guide/account/">cross category</a>',
    ].join(''),
    'en/docs/quick-start/register/index.html': '<h1>Register</h1>',
    'en/docs/user-guide/account/index.html': '<h1>Account</h1>',
  });
  t.after(() => fs.rmSync(outDir, { recursive: true, force: true }));

  assert.deepEqual(checkLinks({ outDir }).issues, []);
});

test('validates same-page and target-page hashes', (t) => {
  const outDir = fixture({
    'zh/docs/guide/index.html': [
      '<h2 id="本页">本页</h2>',
      '<a href="#%E6%9C%AC%E9%A1%B5">same page</a>',
      '<a href="../reference/#details">target page</a>',
    ].join(''),
    'zh/docs/reference/index.html': '<h2 id="details">Details</h2>',
  });
  t.after(() => fs.rmSync(outDir, { recursive: true, force: true }));

  assert.deepEqual(checkLinks({ outDir }).issues, []);
});

test('checks local assets and skips external links', (t) => {
  const outDir = fixture({
    'index.html': [
      '<img src="/assets/logo.png">',
      '<a href="https://example.com/missing/">external</a>',
      '<script src="//cdn.example.com/app.js"></script>',
      '<a href="mailto:docs@example.com">email</a>',
    ].join(''),
    'assets/logo.png': 'png',
  });
  t.after(() => fs.rmSync(outDir, { recursive: true, force: true }));

  const result = checkLinks({ outDir });
  assert.deepEqual(result.issues, []);
  assert.equal(result.checkedReferences, 1);
  assert.equal(result.skippedExternal, 3);
});

test('treats production and configured canonical origins as local routes', (t) => {
  const outDir = fixture({
    'index.html': [
      '<a href="https://docs.tiangong.earth/zh/docs/valid/">production route</a>',
      '<a href="https://preview.docs.tiangong.earth/zh/docs/valid/">configured route</a>',
      '<a href="https://docs.tiangong.earth/retired/">retired route</a>',
    ].join(''),
    'zh/docs/valid/index.html': '<h1>Valid</h1>',
  });
  t.after(() => fs.rmSync(outDir, { recursive: true, force: true }));

  const result = checkLinks({ outDir, internalOrigins: ['https://preview.docs.tiangong.earth'] });
  assert.equal(result.checkedReferences, 3);
  assert.equal(result.skippedExternal, 0);
  assert.equal(result.issues.length, 1);
  assert.match(formatReport(result), /href="https:\/\/docs\.tiangong\.earth\/retired\/"/);
});

test('reports missing pages, fragments, and assets with source locations', (t) => {
  const outDir = fixture({
    'en/docs/index.html': [
      '<a href="./missing/">missing page</a>',
      '<a href="#missing">missing fragment</a>',
      '<img src="/assets/missing.png">',
    ].join('\n'),
  });
  t.after(() => fs.rmSync(outDir, { recursive: true, force: true }));

  const result = checkLinks({ outDir });
  assert.equal(result.issues.length, 3);
  assert.match(formatReport(result), /en\/docs\/index\.html:1:4 href="\.\/missing\/"/);
  assert.match(formatReport(result), /fragment does not exist \(#missing\)/);
  assert.match(formatReport(result), /src="\/assets\/missing\.png"/);
});

test('extracts single and double quoted href/src attributes', () => {
  assert.deepEqual(extractReferences('<a href="one&amp;two"><img src=\'image.png\'></a>'), [
    { attribute: 'href', value: 'one&two', line: 1, column: 4 },
    { attribute: 'src', value: 'image.png', line: 1, column: 28 },
  ]);
});
