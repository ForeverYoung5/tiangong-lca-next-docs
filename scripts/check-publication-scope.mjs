#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import {
  assertNoDeniedOutput,
  collectPublicDocs,
  llmsPath,
  repoRoot,
  validateContext7Config,
  validateLlmsText,
} from './publication-policy.mjs';

const errors = [];

function check(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    errors.push(`${name}: ${error.message}`);
    console.error(`not ok - ${name}: ${error.message}`);
  }
}

let docs = [];

check('public docs allowlist', () => {
  docs = collectPublicDocs();
  if (docs.length === 0) {
    throw new Error('no public docs were discovered');
  }
});

check('static/llms.txt scope', () => {
  if (!fs.existsSync(llmsPath)) {
    throw new Error('static/llms.txt is missing; run npm run docs:llms');
  }

  validateLlmsText(fs.readFileSync(llmsPath, 'utf8'), docs);
});

check('Docusaurus sidebar scope', () => {
  const sidebarPath = path.join(repoRoot, 'sidebars.ts');
  assertNoDeniedOutput(fs.readFileSync(sidebarPath, 'utf8'), 'sidebars.ts');
});

check('Context7 source scope', () => {
  validateContext7Config();
});

check('build output scope when present', () => {
  const buildDir = path.join(repoRoot, 'build');
  if (!fs.existsSync(buildDir)) {
    console.log('skip - build output is not present yet');
    return;
  }

  const buildLlmsPath = path.join(buildDir, 'llms.txt');
  if (!fs.existsSync(buildLlmsPath)) {
    throw new Error('build/llms.txt is missing after build');
  }

  validateLlmsText(fs.readFileSync(buildLlmsPath, 'utf8'), docs);
});

if (errors.length > 0) {
  console.error('\nPublication scope check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Publication scope check passed for ${docs.length} public docs.`);
