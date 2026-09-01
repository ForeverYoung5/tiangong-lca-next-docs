import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const locales = ['', '.en', '.de', '.fr'];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

const cliPages = locales.map((locale) => `content/docs/integration/cli${locale}.mdx`);
const mcpPages = locales.map((locale) => `content/docs/integration/mcp-lca-remote${locale}.mdx`);
const accountPages = locales.map(
  (locale) => `content/docs/user-guide/account-profile${locale}.mdx`,
);
const importPages = locales.map(
  (locale) => `content/docs/openapi/tidas-package-import${locale}.mdx`,
);
const authPages = [...cliPages, ...mcpPages, ...accountPages, ...importPages];
const forbiddenCredentialSetup =
  /TIANGONG_LCA_API_KEY\s*=|USER_API_KEY|oauth\/demo|Generate\s+(?:an?\s+)?API[- ]?Key|生成\s*API[- ]?Key|API[- ]?Key\s*生成|API[- ]?(?:Key|Schlüssel)\s+generieren|G[eé]n[eé]rer\s+(?:une\s+)?cl[eé]\s+API|Authorization.*Bearer XXX|Exchange Authorization Code|Exchange for tokens/iu;

test('forbidden API-key generation fixtures are rejected in every locale', () => {
  for (const [locale, fixture] of [
    ['en', 'Generate API Key'],
    ['zh', '生成 API Key'],
    ['de', 'API-Key generieren'],
    ['fr', 'Générer une clé API'],
  ]) {
    assert.match(fixture, forbiddenCredentialSetup, locale);
  }
});

test('LCA auth pages contain no password-equivalent setup path', () => {
  for (const relativePath of authPages) {
    assert.doesNotMatch(read(relativePath), forbiddenCredentialSetup, relativePath);
  }
  for (const relativePath of [
    'public/assets/docs/861a547c/11.png',
    'public/assets/docs/47aed1f7/10.png',
    'public/assets/docs/916b64ab/account-api-key-tab.png',
    'public/assets/docs/78a6dc92/account-profile-1.png',
    'public/assets/docs/b56ae1db/15.png',
    'public/assets/docs/ef53e152/17.png',
  ]) {
    assert.equal(existsSync(path.join(root, relativePath)), false, relativePath);
  }
});

test('every CLI locale documents browser login, local status, live doctor, and headless limits', () => {
  for (const relativePath of cliPages) {
    const text = read(relativePath);
    assert.match(text, /TIANGONG_LCA_OAUTH_CLIENT_ID/u, relativePath);
    assert.match(text, /tiangong-lca auth status --json/u, relativePath);
    assert.match(text, /tiangong-lca auth login/u, relativePath);
    assert.match(text, /tiangong-lca auth doctor-auth --json/u, relativePath);
    assert.match(text, /TIANGONG_LCA_ACCESS_TOKEN/u, relativePath);
    assert.match(text, /client-credentials/iu, relativePath);
  }
});

test('every remote MCP locale documents discovery, PKCE, token separation, and revocation', () => {
  for (const relativePath of mcpPages) {
    const text = read(relativePath);
    assert.match(text, /oauth-protected-resource\/mcp/u, relativePath);
    assert.match(text, /S256/u, relativePath);
    assert.match(text, /Dynamic Client Registration/u, relativePath);
    assert.match(
      text,
      /Connected applications|已连接应用|Verbundene Anwendungen|applications connectées/iu,
      relativePath,
    );
    assert.match(text, /Supabase session|Supabase-Sitzung|session Supabase/iu, relativePath);
  }
});

test('account and OpenAPI locale families expose connected-app and registered-client contracts', () => {
  for (const relativePath of accountPages) {
    const text = read(relativePath);
    assert.match(
      text,
      /Connected applications|已连接应用|Verbundene Anwendungen|Applications connectées/iu,
      relativePath,
    );
    assert.match(text, /auth login/u, relativePath);
    assert.match(text, /refresh|rafraîch|aktualis/iu, relativePath);
  }
  for (const relativePath of importPages) {
    const text = read(relativePath);
    assert.match(text, /OAUTH_ACCESS_TOKEN/u, relativePath);
    assert.match(text, /PKCE/u, relativePath);
    assert.match(text, /client-credentials/iu, relativePath);
  }
});
