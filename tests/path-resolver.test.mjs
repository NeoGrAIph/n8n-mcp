import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { parseResourceUri, resolveTargetFile } from '../src/path-resolver.mjs';
import { createWorkflowFixture } from './fixtures.mjs';

test('parses Synestra workflow resource URI', () => {
  const parsed = parseResourceUri('synestra-n8n-workflows:///code/6Us3YRUh4tkTEqvCiN12M/33ddbc44-7e74-4edb-aa4d-05790de9b5eb.py');
  assert.equal(parsed.kind, 'code');
  assert.equal(parsed.ext, 'py');
});

test('rejects encoded slash URI traversal', () => {
  assert.throws(() => parseResourceUri('synestra-n8n-workflows:///code/6Us3YRUh4tkTEqvCiN12M/33ddbc44-7e74-4edb-aa4d-05790de9b5eb%2f.py'), /Invalid resource URI/);
});

test('rejects archived targets by default', async () => {
  const fixture = await createWorkflowFixture();
  await fs.mkdir(path.join(fixture.root, '.archived'), { recursive: true });
  await fs.writeFile(path.join(fixture.root, '.index', `${fixture.workflowId}.path`), '.archived\n');
  await assert.rejects(() => resolveTargetFile(fixture.config, fixture.codeUri), /Archived workflow path/);
});
