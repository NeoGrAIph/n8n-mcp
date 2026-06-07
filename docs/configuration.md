# Configuration

Runtime environment:

- `HOST`: bind host, default `0.0.0.0`.
- `PORT`: HTTP port, default `3000`.
- `N8N_WORKFLOWS_ROOT` or `WORKFLOWS_ROOT`: mounted workflow files root, default `/workflows`.
- `N8N_WORKFLOWS_GIT_ROOT` or `WORKFLOWS_GIT_ROOT`: Git worktree root used only for Git status diagnostics, default equals `N8N_WORKFLOWS_ROOT`.
- `N8N_WORKFLOWS_DISPLAY_ROOT` or `WORKFLOWS_DISPLAY_ROOT`: display root shown in diagnostics, default equals `N8N_WORKFLOWS_ROOT`.
- `SYNESTRA_MCP_ENV`: `dev` or `prod`, default `dev`.
- `SYNESTRA_MCP_WRITE_POLICY`: must be `off`. No other value is accepted.
- `SYNESTRA_MCP_AUTH_TOKEN_FILE`: file containing the Bearer token. Required unless `SYNESTRA_MCP_ALLOW_UNAUTHENTICATED_LOCAL=true` and `HOST` is local-only.
- `SYNESTRA_MCP_ALLOW_UNAUTHENTICATED_LOCAL`: local development escape hatch for `HOST=127.0.0.1`, `::1`, or `localhost`; never use in platform deployment.
- `SYNESTRA_MCP_ALLOW_MISSING_INDEX_READONLY`: allows startup in explicit degraded read-only mode when `workflows/.index` is missing.
- `SYNESTRA_MCP_EXPECTED_BRANCH`: optional diagnostic context for Git status output; it does not enable writes and is not used to select source-of-truth behavior.
- `SYNESTRA_MCP_MAX_FILE_BYTES`: maximum inspected workflow file size, default `262144`, clamped to `1..10485760`.
- `SYNESTRA_MCP_RESOURCE_LIST_LIMIT`: maximum resources returned by one `resources/list` page, default `200`, clamped to `1..1000`.
- `SYNESTRA_MCP_SETTLE_TIMEOUT_MS`: default observe timeout, default `15000`, clamped to `100..120000`.
- `SYNESTRA_MCP_SETTLE_STABLE_READS`: number of stable ETag reads required for observe, default `2`, clamped to `1..20`.
- `SYNESTRA_PLATFORM_DISPLAY_ROOT`: optional display path used only in production-readiness handoff commands, default `~/repo/synestra-platform`.

The main MCP server is read-only. Use normal filesystem tools for approved dev edits after locator/parity checks pass.
