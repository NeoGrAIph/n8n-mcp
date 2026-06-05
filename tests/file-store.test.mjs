import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { listWorkflowFiles, patchWorkflowFile, readWorkflowFile, validateWorkflowFile } from '../src/file-store.mjs';
import { createWorkflowFixture } from './fixtures.mjs';

test('lists and reads Code and Set(raw) files with ETags', async () => {
  const fixture = await createWorkflowFixture();
  const files = await listWorkflowFiles(fixture.config, fixture.workflowId);
  assert.equal(files.length, 2);
  const code = await readWorkflowFile(fixture.config, fixture.codeUri);
  assert.equal(code.kind, 'code');
  assert.equal(code.language, 'python');
  assert.match(code.etag, /^[a-f0-9]{64}$/);
});

test('patch requires matching expectedEtag and clean target', async () => {
  const fixture = await createWorkflowFixture();
  const read = await readWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, fixture.codeUri);
  const result = await patchWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, {
    uri: fixture.codeUri,
    expectedEtag: read.etag,
    patch: '@@ -1 +1 @@\n-print("before")\n+print("after")'
  });
  assert.match(result.etag, /^[a-f0-9]{64}$/);
  const reread = await readWorkflowFile(fixture.config, fixture.codeUri);
  assert.equal(reread.content, 'print("after")\n');
});

test('concurrent writes to the same target cannot both use the same ETag', async () => {
  const fixture = await createWorkflowFixture();
  const read = await readWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, fixture.codeUri);
  const first = patchWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, {
    uri: fixture.codeUri,
    expectedEtag: read.etag,
    patch: '@@ -1 +1 @@\n-print("before")\n+print("first")'
  });
  const second = patchWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, {
    uri: fixture.codeUri,
    expectedEtag: read.etag,
    patch: '@@ -1 +1 @@\n-print("before")\n+print("second")'
  });
  const results = await Promise.allSettled([first, second]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  const rejected = results.find(result => result.status === 'rejected');
  assert.match(rejected.reason.message, /ETag mismatch|worktree is dirty/);
});

test('patch rejects dirty worktree and concurrent target changes', async () => {
  const fixture = await createWorkflowFixture();
  const read = await readWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, fixture.codeUri);
  await fs.writeFile(path.join(fixture.root, 'development', 'unrelated.txt'), 'dirty\n');
  await assert.rejects(() => patchWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, {
    uri: fixture.codeUri,
    expectedEtag: read.etag,
    patch: '@@ -1 +1 @@\n-print("before")\n+print("after")'
  }), /worktree is dirty/);

  await fs.unlink(path.join(fixture.root, 'development', 'unrelated.txt'));
  await assert.rejects(() => patchWorkflowFile({
    ...fixture.config,
    writePolicy: 'patch',
    beforeRenameForTest: async filePath => fs.writeFile(filePath, 'print("raced")\n')
  }, {
    uri: fixture.codeUri,
    expectedEtag: read.etag,
    patch: '@@ -1 +1 @@\n-print("before")\n+print("after")'
  }), /changed before atomic rename/);
});

test('patch rejects missing expectedEtag, skipped settle and Set(raw) invalid JSON', async () => {
  const fixture = await createWorkflowFixture();
  await assert.rejects(() => patchWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, {
    uri: fixture.codeUri,
    patch: '@@ -1 +1 @@\n-print("before")\n+print("after")'
  }), /expectedEtag is mandatory/);
  const codeRead = await readWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, fixture.codeUri);
  await assert.rejects(() => patchWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, {
    uri: fixture.codeUri,
    expectedEtag: codeRead.etag,
    waitForSettle: false,
    patch: '@@ -1 +1 @@\n-print("before")\n+print("after")'
  }), /waitForSettle=false is not allowed/);
  const setRead = await readWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, fixture.setUri);
  await assert.rejects(() => patchWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, {
    uri: fixture.setUri,
    expectedEtag: setRead.etag,
    patch: '@@ -1 +1 @@\n-{"ok":true}\n+{bad'
  }), /Set\(raw\) JSON is invalid/);
});

test('patch rejects read-after-write rollback or normalization', async () => {
  const fixture = await createWorkflowFixture();
  const read = await readWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, fixture.codeUri);
  await assert.rejects(() => patchWorkflowFile({
    ...fixture.config,
    writePolicy: 'patch',
    afterRenameForTest: async filePath => fs.writeFile(filePath, 'print("rolled back")\n')
  }, {
    uri: fixture.codeUri,
    expectedEtag: read.etag,
    patch: '@@ -1 +1 @@\n-print("before")\n+print("after")'
  }), /did not settle to the written content/);
});

test('canonical .index mapping rejects duplicate code directories for mutation', async () => {
  const fixture = await createWorkflowFixture();
  await fs.mkdir(path.join(fixture.root, 'other', `code_nodes_${fixture.workflowId}`), { recursive: true });
  const read = await readWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, fixture.codeUri);
  await assert.rejects(() => patchWorkflowFile({ ...fixture.config, writePolicy: 'patch' }, {
    uri: fixture.codeUri,
    expectedEtag: read.etag,
    patch: '@@ -1 +1 @@\n-print("before")\n+print("after")'
  }), /Duplicate workflow code directories/);
});

test('validates Set(raw) JSON content', async () => {
  const fixture = await createWorkflowFixture();
  const valid = await validateWorkflowFile(fixture.config, { uri: fixture.setUri });
  assert.equal(valid.valid, true);
  const invalid = await validateWorkflowFile(fixture.config, { uri: fixture.setUri, content: '{bad' });
  assert.equal(invalid.valid, false);
});
