import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { toolDefinitions } from '../src/tools.mjs';

const repoRoot = new URL('..', import.meta.url);
const toolsDir = new URL('../docs/reference/tools/', import.meta.url);

test('tool reference docs match runtime tools/list catalog', async () => {
  const runtimeNames = toolDefinitions.map(tool => tool.name).sort();
  const docFiles = (await fs.readdir(toolsDir))
    .filter(name => name !== 'README.md' && name.endsWith('.md'))
    .map(name => path.basename(name, '.md'))
    .sort();

  assert.deepEqual(docFiles, runtimeNames);

  const index = await fs.readFile(new URL('../docs/reference/tools/README.md', import.meta.url), 'utf8');
  for (const tool of toolDefinitions) {
    assert.equal(index.includes(`[\`${tool.name}\`](./${tool.name}.md)`), true);
    const page = await fs.readFile(new URL(`../docs/reference/tools/${tool.name}.md`, import.meta.url), 'utf8');
    assert.match(page, new RegExp(`# .*${tool.name}`));
    assert.match(page, /## Safety/);
    assert.equal(tool.annotations?.readOnlyHint, true);
    assert.equal(tool.annotations?.destructiveHint, false);
    assert.equal(tool.annotations?.openWorldHint, false);
  }
});

test('top-level README documents every runtime tool and no write tools', async () => {
  const readme = await fs.readFile(new URL('../README.md', import.meta.url), 'utf8');
  for (const tool of toolDefinitions) {
    assert.match(readme, new RegExp(`\\b${tool.name}\\b`));
  }
  assert.doesNotMatch(readme, /\bsynestra_workflow_file_(patch|replace|write)\b/);
  assert.doesNotMatch(readme, /\b(update_workflow|create_workflow|get_workflow_details|search_workflows)\b.*Synestra/i);
  assert.equal(await fs.stat(repoRoot).then(stat => stat.isDirectory()), true);
});
