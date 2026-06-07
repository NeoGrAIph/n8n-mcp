# Architecture Boundary

This repository implements the Synestra extension MCP for n8n workflow files. It is intentionally not a full n8n management MCP.

## Native n8n MCP

Native n8n MCP is the source of truth for n8n semantics and API-backed operations:

- workflow discovery, details, create/update, publish and archive;
- workflow execution, testing and execution history;
- credentials, projects, folders and data tables;
- workflow builder, node catalog, node types and SDK guidance.

Native workflow access is controlled by n8n's instance-level MCP settings, authentication and workflow-level `Available in MCP` gate.

## Synestra GitOps MCP

`synestra-n8n-gitops-mcp` owns only the file-layer gaps native n8n MCP does not cover:

- locate extracted Code and Set(raw) files through `workflows/.index`;
- return locator metadata, filesystem paths, ETags and unsafe status codes;
- validate proposed Code/Set(raw) payloads without writing them;
- observe file settle state after an external filesystem edit;
- report local mount, Git status, export and parity diagnostics.

Export diagnostics include handoff metadata for platform audits, but this server does not query Kubernetes, n8n DB, Camel K or Argo CD. Live native MCP acceptance, gateway hardening and DB-to-files parity remain platform responsibilities.

The server is read-only. It must not expose native/core n8n tools and must not expose MCP write tools.

## Filesystem Tools

Approved dev edits are performed by normal filesystem tools, not by this MCP server. A file is a local path candidate only when locator or reconcile status for the exact workflow/node is `ready`; final external-edit permission also requires the platform aggregate gate to return `filesystemToolGuard.finalExternalFilesystemEditAllowed=true`. After an edit, use read-only validation, observe or reconcile calls to verify the result.

Production writes are outside the v1 contract.

## Gateway

The platform may publish native n8n MCP and Synestra GitOps MCP through separate gateway/proxy paths. A single merged `tools/list` endpoint is not part of this server's contract.
