"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synestraCamelKDebeziumMcpN8nDevGuide = void 0;
exports.synestraCamelKDebeziumMcpN8nDevGuide = {
    name: 'synestra_camelk_debezium_mcp_n8n_dev_guide',
    category: 'guides',
    essentials: {
        description: 'Synestra dev guide: how Camel K + Debezium, n8n-sync-controller, and mcp-n8n work together, what each component does, and how to safely iterate on workflow files with MCP tools.',
        keyParameters: [],
        example: 'Use n8n_tools_documentation({topic: "synestra_camelk_debezium_mcp_n8n_dev_guide"}) to access this guide',
        performance: 'N/A - Documentation only',
        tips: [
            'Use this guide only if your deployment includes Camel K + Debezium and n8n-sync-controller (Synestra dev)',
            'Expect eventual consistency: file writes may be normalized by a controller shortly after the tool returns',
            'After any write/patch, always resources/read again and use the new ETag for follow-up edits',
            'When files "move", re-run resources/list (Debezium-driven folder moves change paths/URIs)'
        ]
    },
    full: {
        description: `# Synestra dev: Camel K + Debezium + mcp-n8n (how they fit together)

This guide is **deployment-specific** (Synestra dev). It explains the responsibilities and interactions between:

- **Camel K + Debezium** (CDC-driven file operations)
- **n8n-sync-controller** (watcher/normalizer that syncs workflow files with n8n API)
- **mcp-n8n** (MCP server exposing workflow files + n8n API tools to agents)

If your n8n-mcp deployment does not include these components, treat this guide as non-applicable.

## 1) What each component does

### mcp-n8n (agent-facing)
- Exposes **workflow file access** via MCP Resources (URIs like \`n8n-workflows:///code/{workflowId}/{nodeId}.py\`).
- Exposes **n8n API tools** (\`n8n_workflow_get\`, \`n8n_workflows_list\`, etc.) when API credentials are configured.
- Intended usage for agents:
  - Code/Set edits via file layer (resources/*, \`n8n_*_file_*\`).
  - Workflow structure edits via \`n8n_workflow_update_partial\` (only when needed).

### Camel K + Debezium (CDC-driven file operations)
In Synestra dev, Camel K + Debezium is used to react to database changes (CDC) and keep the file-based workflow tree consistent with n8n folder changes.

Typical responsibilities:
- React to folder rename/move events (CDC from Postgres via Debezium).
- Move workflow JSON and \`code_nodes_<workflowId>\` directories to the correct filesystem path.
- Maintain an index (e.g. \`.index/<workflowId>.path\`) so other components can resolve workflow paths.

### n8n-sync-controller (watcher / normalizer)
- Watches \`/workflows\` and syncs changes into n8n API (dev).
- May also **rewrite/normalize** files after API reconciliation (formatting/newlines/serialization, hash files).
- Uses a per-file hash state (e.g. \`.hash\`) to decide what changed and to avoid loops.

## 2) Why they are synergistic (when configured correctly)

The key idea is: each component operates on a different "layer" and they reinforce each other:

- Camel K + Debezium keeps the **filesystem tree structure** aligned with n8n folders (move/rename correctness).
- n8n-sync-controller keeps **file contents and n8n API** aligned (eventual consistency).
- mcp-n8n gives agents a safe, typed interface to:
  - discover files (\`resources/list\`)
  - read/update files with concurrency control (ETag)
  - verify in n8n API (\`n8n_workflow_get\`, \`n8n_workflow_validate\`)

## 3) Important interaction: ETag can change after a successful write/patch

In Synestra dev, even after \`n8n_code_file_write\` / \`n8n_set_file_write\` / \`n8n_workflow_file_patch\` returns success, **a controller may still rewrite/normalize the file** shortly afterwards.

Practical consequence for agents:

1. \`resources/read\` (capture current ETag)
2. apply write/patch (pass \`expectedEtag\`)
3. **always** \`resources/read\` again and use the new ETag before the next edit

RU note: после успешного write/patch всегда делай resources/read и бери новый etag, т.к. контроллер может переписать файл.

## 4) Recommended agent workflow (safe + efficient)

### For changing Code/Set contents
1. \`resources/list\` (discover valid URIs)
2. \`resources/read\` (get content + ETag)
3. Prefer \`n8n_workflow_file_patch\` for small, local changes (smaller diffs = fewer conflicts)
4. After success: \`resources/read\` again (ETag may change after normalization)
5. Optional: verify in API with \`n8n_workflow_get\` (mode=full) and/or \`n8n_workflow_validate\`

### When files "disappear" or paths change
If a Code/Set URI you used earlier stops resolving:
- Re-run \`resources/list\`.
- Assume Camel K + Debezium moved the workflow tree due to folder changes.

## 5) Operational sanity checks (read-only)

These checks help confirm the components are not "fighting" each other:

- All pods are on the same node / share the same PV/PVC mount for \`/workflows\`.
- mcp-n8n, n8n-sync-controller, and Camel K Integration see the same filesystem (no split-brain).
- Controller logs do not show repeated oscillation (write-loop).

Example checks (cluster read-only):
\`\`\`bash
argocd app get mcp-n8n --grpc-web
kubectl -n svc-n8n-dev get pods -o wide
kubectl -n svc-n8n-dev get pvc,pv
\`\`\`

## 6) Write-smoke criterion (dev)

A minimal write-smoke that demonstrates synergy:
- Patch a single Code node file via \`n8n_workflow_file_patch\`.
- Confirm the change appears in \`n8n_workflow_get\` and that the filesystem ETag stabilizes after normalization.
- Clean up by reverting the patch.

If the change is consistently overwritten or never appears in the API, treat it as "not synergistic" and debug scheduling/mounts/controller logs.`,
        parameters: {
            topic: {
                type: 'string',
                description: 'Use "synestra_camelk_debezium_mcp_n8n_dev_guide" for this guide.',
                required: false
            },
            depth: { type: 'string', description: 'Use "essentials" or "full".', required: false }
        },
        returns: 'Markdown guide describing how Synestra dev runs Camel K + Debezium alongside mcp-n8n, with safe agent workflows and operational checks.',
        examples: [
            'n8n_tools_documentation({topic: "synestra_camelk_debezium_mcp_n8n_dev_guide"})'
        ],
        useCases: [
            'Teach an agent how to iterate on workflow files safely in Synestra dev',
            'Explain why ETag can change after successful writes/patches',
            'Reduce confusion when workflow files move due to Debezium-driven folder changes'
        ],
        performance: 'Instant (static content)',
        bestPractices: [
            'Treat file changes as eventually consistent (allow time for controller normalization)',
            'After any successful write/patch, always resources/read again and use the new ETag',
            'Prefer small patches over full rewrites for reliability'
        ],
        pitfalls: [
            'Assuming tool-returned ETag is stable (it may change after normalization)',
            'Using stale URIs after folder moves (re-run resources/list)',
            'Split-brain mounts (pods on different nodes with hostPath-based PV)'
        ],
        relatedTools: [
            'n8n_tools_documentation',
            'resources/list',
            'resources/read',
            'n8n_workflow_file_patch',
            'n8n_code_file_write',
            'n8n_set_file_write',
            'n8n_workflow_get'
        ]
    }
};
//# sourceMappingURL=synestra-camelk-debezium-mcp-n8n-dev-guide.js.map