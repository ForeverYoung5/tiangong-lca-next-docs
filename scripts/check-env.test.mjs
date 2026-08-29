import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EXPECTED_TOOLCHAIN_VERSIONS,
  readToolchainVersions,
  validateToolchainVersions,
} from './check-env.mjs';

test('accepts the supported Node 24 range with exact pnpm and TypeScript', () => {
  for (const node of ['24.18.0', '24.19.0', '24.20.3']) {
    assert.deepEqual(
      validateToolchainVersions({
        node,
        pnpm: '11.24.0',
        typescript: '7.0.2',
      }),
      [],
      node,
    );
  }
  assert.deepEqual(EXPECTED_TOOLCHAIN_VERSIONS, {
    node: '>=24.18.0 <25',
    pnpm: '11.24.0',
    typescript: '7.0.2',
  });
});

const validToolchainVersions = {
  node: '24.19.0',
  pnpm: '11.24.0',
  typescript: '7.0.2',
};

for (const [tool, actual] of [
  ['node', '24.17.9'],
  ['node', '25.0.0'],
  ['pnpm', '11.23.0'],
  ['typescript', '6.9.0'],
  ['pnpm', 'unavailable'],
]) {
  test(`rejects ${tool} version ${actual}`, () => {
    const versions = { ...validToolchainVersions, [tool]: actual };
    assert.deepEqual(validateToolchainVersions(versions), [
      `${tool} version mismatch: expected ${EXPECTED_TOOLCHAIN_VERSIONS[tool]}, got ${actual}`,
    ]);
  });
}

test('rejects non-runtime and non-canonical Node version values', () => {
  for (const node of ['24', '24.18', '24.18.0-rc.1', '024.18.0', '24.018.0']) {
    assert.deepEqual(
      validateToolchainVersions({ ...validToolchainVersions, node }),
      [`node version mismatch: expected >=24.18.0 <25, got ${node}`],
      node,
    );
  }
  assert.deepEqual(validateToolchainVersions({ ...validToolchainVersions, node: ['24.19.0'] }), [
    'node version mismatch: expected >=24.18.0 <25, got 24.19.0',
  ]);
});

test('the installed repository toolchain satisfies the same contract', () => {
  assert.deepEqual(validateToolchainVersions(readToolchainVersions()), []);
});
