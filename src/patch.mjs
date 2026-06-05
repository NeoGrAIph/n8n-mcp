import { ToolError } from './errors.mjs';

export function applyUnifiedPatch(content, patch) {
  const lines = String(patch || '').split(/\r?\n/);
  if (lines.some(line => /^(diff --git|--- |\+\+\+ |new file mode|deleted file mode|rename from|rename to)/.test(line))) {
    throw new ToolError('Patch must contain hunks only; file headers/create/delete/rename are rejected', 'PATCH_FORMAT_REJECTED');
  }
  const original = String(content).split('\n');
  const output = [];
  let sourceIndex = 0;
  let i = 0;
  while (i < lines.length) {
    if (!lines[i]) {
      i += 1;
      continue;
    }
    const header = lines[i].match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (!header) throw new ToolError('Patch must contain only unified diff hunks', 'PATCH_FORMAT_REJECTED');
    const start = Number.parseInt(header[1], 10) - 1;
    while (sourceIndex < start) output.push(original[sourceIndex++]);
    i += 1;
    while (i < lines.length && !lines[i].startsWith('@@ ')) {
      const line = lines[i];
      if (line === '\\ No newline at end of file') {
        i += 1;
        continue;
      }
      const op = line[0];
      const text = line.slice(1);
      if (op === ' ') {
        if (original[sourceIndex] !== text) throw new ToolError('Patch context does not match current content', 'PATCH_CONTEXT_MISMATCH', 409);
        output.push(original[sourceIndex++]);
      } else if (op === '-') {
        if (original[sourceIndex] !== text) throw new ToolError('Patch removal does not match current content', 'PATCH_CONTEXT_MISMATCH', 409);
        sourceIndex += 1;
      } else if (op === '+') {
        output.push(text);
      } else if (line !== '') {
        throw new ToolError('Unsupported patch line', 'PATCH_FORMAT_REJECTED');
      }
      i += 1;
    }
  }
  while (sourceIndex < original.length) output.push(original[sourceIndex++]);
  return output.join('\n');
}
