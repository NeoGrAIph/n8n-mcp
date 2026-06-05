# Configuration

Runtime environment:

- `HOST`: bind host, default `0.0.0.0`.
- `PORT`: HTTP port, default `3000`.
- `N8N_WORKFLOWS_ROOT`: mounted workflow files root.
- `N8N_WORKFLOWS_DISPLAY_ROOT`: display root shown in diagnostics.
- `SYNESTRA_MCP_ENV`: `dev` or `prod`.
- `SYNESTRA_MCP_WRITE_POLICY`: `off`, `patch`, or `patch_replace`.
- `SYNESTRA_MCP_AUTH_TOKEN_FILE`: file containing the Bearer token.
- `SYNESTRA_MCP_EXPECTED_BRANCH`: required branch for writes.

Use `off` unless a disposable dev workflow write-smoke has an explicit revert path.
