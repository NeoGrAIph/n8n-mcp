# synestra_workflow_export_diagnostics

Return local export diagnostics and platform readiness handoff metadata.

## Inputs

No inputs.

## Output

Returns local mount/artifact state, `mcpLocatorReadiness`, `productionReadiness.decision=requires-platform-preflight`, allowed and forbidden actions, and handoff commands for platform readiness checks.

## Safety

This tool never claims production readiness from MCP-local state. Live native n8n MCP acceptance, gateway hardening, Camel K/Debezium health and n8n DB-to-files parity are platform responsibilities in `~/repo/synestra-platform`.

## Example

```json
{}
```
