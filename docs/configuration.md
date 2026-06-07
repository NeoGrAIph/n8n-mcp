# Configuration

Runtime environment:

- `HOST`: bind host, default `0.0.0.0`.
- `PORT`: HTTP port, default `3000`.
- `N8N_WORKFLOWS_ROOT`: mounted workflow files root.
- `N8N_WORKFLOWS_DISPLAY_ROOT`: display root shown in diagnostics.
- `SYNESTRA_MCP_ENV`: `dev` or `prod`.
- `SYNESTRA_MCP_WRITE_POLICY`: must be `off`.
- `SYNESTRA_MCP_AUTH_TOKEN_FILE`: file containing the Bearer token.
- `SYNESTRA_MCP_EXPECTED_BRANCH`: optional diagnostic context for future dev-only write-smoke procedures; not used by the read-only MCP tools.

The main MCP server is read-only. Use normal filesystem tools for approved dev edits after locator/parity checks pass.
