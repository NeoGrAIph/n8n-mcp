#!/bin/sh
set -eu

IMAGE="${1:-synestra-n8n-gitops-mcp:local}"
RUN_ID="synestra-n8n-gitops-mcp-smoke-$$"

cleanup() {
  docker rm -f "$RUN_ID" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker run -d --name "$RUN_ID" \
  -p 127.0.0.1::3000 \
  -e N8N_WORKFLOWS_ROOT=/tmp/workflows \
  -e SYNESTRA_MCP_AUTH_TOKEN_FILE=/tmp/synestra-mcp-token \
  -e SYNESTRA_MCP_WRITE_POLICY=off \
  "$IMAGE" \
  sh -c "mkdir -p /tmp/workflows/.index && printf 'test-token\n' > /tmp/synestra-mcp-token && exec node src/index.mjs" >/dev/null

PORT="$(docker port "$RUN_ID" 3000/tcp | awk -F: '{print $NF}')"

for _ in $(seq 1 30); do
  if docker exec "$RUN_ID" node -e "fetch('http://127.0.0.1:3000/health').then(r => process.exit(r.status === 200 ? 0 : 1)).catch(() => process.exit(1))"; then
    break
  fi
  if [ "$(docker inspect -f '{{.State.Running}}' "$RUN_ID" 2>/dev/null || true)" != "true" ]; then
    docker logs "$RUN_ID" >&2 || true
    exit 1
  fi
  sleep 1
done

docker exec "$RUN_ID" node -e "fetch('http://127.0.0.1:3000/health').then(r => r.json()).then(j => { if (j.status !== 'ok') process.exit(1) }).catch(() => process.exit(1))"

STATUS="$(docker exec "$RUN_ID" node -e "fetch('http://127.0.0.1:3000/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) }).then(r => console.log(r.status)).catch(() => process.exit(1))")"
if [ "$STATUS" != "401" ]; then
  echo "expected unauthenticated tools/list to get 401, got $STATUS" >&2
  exit 1
fi

docker exec "$RUN_ID" node <<'NODE'
const expected = [
  'synestra_workflow_files_status',
  'synestra_workflow_files_list',
  'synestra_workflow_file_read',
  'synestra_workflow_file_validate',
  'synestra_workflow_reconcile_status',
  'synestra_workflow_sync_observe',
  'synestra_workflow_mount_diagnostics',
  'synestra_workflow_export_diagnostics'
];

fetch('http://127.0.0.1:3000/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
}).then(async r => {
  const j = await r.json();
  if (r.status !== 200) throw new Error(`expected 200, got ${r.status}`);
  const tools = j.result.tools;
  const names = tools.map(t => t.name).sort();
  const expectedNames = [...expected].sort();
  if (JSON.stringify(names) !== JSON.stringify(expectedNames)) {
    throw new Error(`unexpected tools: ${names.join(',')}`);
  }
  for (const tool of tools) {
    if (!tool.annotations?.readOnlyHint) throw new Error(`${tool.name} is not marked read-only`);
    if (tool.annotations?.destructiveHint) throw new Error(`${tool.name} is marked destructive`);
    if (/^(n8n_|native_|workflow_)/.test(tool.name)) throw new Error(`${tool.name} uses a forbidden core/native prefix`);
    if (/(patch|replace|write|create|update|delete)/.test(tool.name)) throw new Error(`${tool.name} looks like a write tool`);
  }
}).catch(error => {
  console.error(error.message);
  process.exit(1);
});
NODE

if docker logs "$RUN_ID" 2>&1 | grep -q 'test-token'; then
  echo "auth token leaked into server logs" >&2
  exit 1
fi

echo "synestra-n8n-gitops-mcp smoke ok on 127.0.0.1:$PORT"
