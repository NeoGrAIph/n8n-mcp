import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { test } from 'node:test';
import { assertStartupConfig, loadConfig } from '../src/config.mjs';
import { createWorkflowFixture } from './fixtures.mjs';

test('runtime config refuses write policy', () => {
  assert.throws(() => loadConfig({
    SYNESTRA_MCP_ENV: 'dev',
    SYNESTRA_MCP_WRITE_POLICY: 'patch',
    SYNESTRA_MCP_AUTH_TOKEN_FILE: '/tmp/token'
  }), /Invalid SYNESTRA_MCP_WRITE_POLICY/);
});

test('network config requires token file by default', () => {
  assert.throws(() => loadConfig({ HOST: '0.0.0.0' }), /SYNESTRA_MCP_AUTH_TOKEN_FILE is required/);
});

test('startup allows missing index only in explicit read-only degraded mode', async () => {
  const fixture = await createWorkflowFixture();
  await fs.rm(`${fixture.root}/.index`, { recursive: true, force: true });
  const degraded = { ...fixture.config, writePolicy: 'off', allowMissingIndexReadOnly: true };
  assert.doesNotThrow(() => assertStartupConfig(degraded));
  const fatal = { ...fixture.config, writePolicy: 'off', allowMissingIndexReadOnly: false };
  assert.throws(() => assertStartupConfig(fatal), /Workflow index directory is missing/);
});

test('config supports separate workflow git root for planned write rollouts', () => {
  const config = loadConfig({
    HOST: '127.0.0.1',
    SYNESTRA_MCP_ALLOW_UNAUTHENTICATED_LOCAL: 'true',
    N8N_WORKFLOWS_ROOT: '/repo/workflows',
    N8N_WORKFLOWS_GIT_ROOT: '/repo'
  });
  assert.equal(config.root, '/repo/workflows');
  assert.equal(config.gitRoot, '/repo');
});
