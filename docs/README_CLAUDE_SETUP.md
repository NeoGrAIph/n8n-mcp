# Claude Desktop Configuration for n8n-MCP

This guide helps you connect n8n-MCP to Claude Desktop, giving Claude comprehensive knowledge about n8n's 525 workflow automation nodes, including 263 AI-capable tools.

> ⚠️ **Tool name changes (v2.29+)**  
> Legacy tools `list_nodes`, `get_node_info`, `get_node_essentials`, and `get_node_documentation` were consolidated into `get_node`, and `search_nodes` replaces `list_nodes` for discovery.  
> Use these mappings in current versions:
> - `list_nodes` → `search_nodes`
> - `get_node_essentials` → `get_node({detail: "standard"|"minimal", includeExamples: true})`
> - `get_node_info` → `get_node({detail: "full"})`
> - `get_node_documentation` → `get_node({mode: "docs"})`

## 🎯 Prerequisites

- Claude Desktop installed
- For local installation: Node.js (any version)
- For Docker: Docker installed (see installation instructions in main README)

## 🛠️ Configuration Methods

### Method 1: Local Installation (Recommended) 💻

1. **Install and build:**
   ```bash
   git clone https://github.com/czlonkowski/n8n-mcp.git
   cd n8n-mcp
   npm install
   npm run build
   npm run rebuild
   ```

2. **Configure Claude Desktop:**
   ```json
   {
     "mcpServers": {
       "n8n-mcp": {
         "command": "node",
         "args": ["/absolute/path/to/n8n-mcp/dist/mcp/index.js"],
         "env": {
           "NODE_ENV": "production",
           "LOG_LEVEL": "error",
           "MCP_MODE": "stdio",
           "DISABLE_CONSOLE_OUTPUT": "true"
         }
       }
     }
   }
   ```

⚠️ **Important**: 
- Use absolute paths, not relative paths
- The environment variables shown above are critical for proper stdio communication

### Method 2: Docker 🐳

No installation needed - runs directly from Docker:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "MCP_MODE=stdio",
        "-e", "LOG_LEVEL=error",
        "-e", "DISABLE_CONSOLE_OUTPUT=true",
        "ghcr.io/czlonkowski/n8n-mcp:latest"
      ]
    }
  }
}
```

✨ **Benefits**: No setup required, always up-to-date, isolated environment.

### Method 3: Remote Server Connection (Advanced)

⚠️ **Note**: Remote connections are complex and may have compatibility issues. Consider using local installation instead.

For production deployments with multiple users:

1. **Deploy server with HTTP mode** (see [HTTP Deployment Guide](./HTTP_DEPLOYMENT.md))

2. **Connect using custom HTTP client:**
   ```json
   {
     "mcpServers": {
       "n8n-remote": {
         "command": "node",
         "args": [
           "/path/to/n8n-mcp/scripts/mcp-http-client.js",
           "http://your-server.com:3000/mcp"
         ],
         "env": {
           "MCP_AUTH_TOKEN": "your-auth-token"
         }
       }
     }
   }
   ```

📝 **Note**: Native remote MCP support is available in Claude Pro/Team/Enterprise via Settings > Integrations.

## 📁 Configuration File Locations

Find your `claude_desktop_config.json` file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

🔄 **Important**: After editing, restart Claude Desktop (Cmd/Ctrl+R or quit and reopen).

## ✅ Verify Installation

After restarting Claude Desktop:

1. Look for "n8n-docker" or "n8n-documentation" in the MCP servers list
2. Try asking Claude: "What n8n nodes are available for working with Slack?"
3. Or use a tool directly: "Use the search_nodes tool to show me trigger nodes"

## 🔧 Available Tools

### Core Tools
- **`tools_documentation`** - Get documentation for any MCP tool (start here)
- **`search_nodes`** - Full-text search across all nodes
- **`get_node`** - Unified node info (info/docs/search_properties/versions)
- **`validate_node`** - Validate node configuration (minimal/full)
- **`validate_workflow`** - Full workflow validation
- **`search_templates`** - Search workflow templates
- **`get_template`** - Get template details by ID

### n8n Management Tools (Requires API Configuration)
- **`n8n_create_workflow`** - Create new workflows
- **`n8n_get_workflow`** - Get workflow by ID (full/details/structure/minimal)
- **`n8n_update_full_workflow`** - Replace entire workflow
- **`n8n_update_partial_workflow`** - Diff-based updates
- **`n8n_delete_workflow`** - Delete workflows
- **`n8n_list_workflows`** - List workflows
- **`n8n_validate_workflow`** - Validate workflows in n8n by ID
- **`n8n_autofix_workflow`** - Auto-fix common workflow errors
- **`n8n_deploy_template`** - Deploy templates from n8n.io
- **`n8n_test_workflow`** - Trigger workflow execution
- **`n8n_executions_get`** - Get execution details
- **`n8n_executions_list`** - List executions
- **`n8n_executions_delete`** - Delete execution records
- **`n8n_health_check`** - Check n8n connectivity
- **`n8n_workflow_versions_list`** - List workflow versions
- **`n8n_workflow_versions_get`** - Get workflow version
- **`n8n_workflow_versions_rollback`** - Roll back to a version
- **`n8n_workflow_versions_delete`** - Delete workflow versions
- **`n8n_workflow_versions_prune`** - Prune old versions
- **`n8n_workflow_versions_truncate`** - Truncate ALL versions

### Legacy (kept for backwards compatibility)
- **`n8n_executions`** - Unified execution management via action (deprecated)
- **`n8n_workflow_versions`** - Unified version management via mode (deprecated)
- **`validate_node_minimal`** - Quick validation for just required fields
- **`validate_workflow`** - Complete workflow validation (validates AI tool connections)
- **`validate_workflow_connections`** - Check workflow structure
- **`validate_workflow_expressions`** - Validate n8n expressions including $fromAI()
- **`get_property_dependencies`** - Analyze property visibility conditions

### Example Questions to Ask Claude:
- "Show me all n8n nodes for working with databases"
- "How do I use the HTTP Request node?"
- "Get the Slack node essentials" (uses get_node with detail: standard)
- "How can I use Google Sheets as an AI tool?"
- "Validate my workflow before deployment"
- "Find templates for webhook automation"

## 🔍 Troubleshooting

### Server Not Appearing in Claude

1. **Check JSON syntax**: 
   ```bash
   # Validate your config file
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
   ```

2. **Verify paths are absolute** (not relative)

3. **Restart Claude Desktop completely** (quit and reopen)

### Remote Connection Issues

**"TransformStream is not defined" error:**
- Cause: Node.js version < 18
- Fix: Update Node.js to v18 or newer
  ```bash
  node --version  # Should be v18.0.0 or higher
  ```

**"Server disconnected" error:**
- Check AUTH_TOKEN matches between server and client
- Verify server is running: `curl https://your-server.com/health`
- Check for VPN interference

### Docker Issues

**"Cannot find image" error:**
```bash
# Pull the latest image
docker pull ghcr.io/czlonkowski/n8n-mcp:latest
```

**Permission denied:**
```bash
# Ensure Docker is running
docker ps
```

### Common Issues

**"Expected ',' or ']' after array element" errors in logs:**
- Cause: Console output interfering with stdio communication
- Fix: Ensure all required environment variables are set:
  - `MCP_MODE=stdio`
  - `LOG_LEVEL=error`
  - `DISABLE_CONSOLE_OUTPUT=true`

**"NODE_MODULE_VERSION mismatch" warnings:**
- Not a problem! The server automatically falls back to a pure JavaScript implementation
- The warnings are suppressed with proper environment variables

**Server appears but tools don't work:**
- Check that you've built the project: `npm run build`
- Verify the database exists: `npm run rebuild`
- Restart Claude Desktop completely (quit and reopen)

### Quick Fixes

- 🔄 **Always restart Claude** after config changes
- 📋 **Copy example configs exactly** (watch for typos)
- 📂 **Use absolute paths** (/Users/... not ~/...)
- 🔍 **Check logs**: View > Developer > Logs in Claude Desktop
- 🛑 **Set all environment variables** shown in the examples

For more help, see [Troubleshooting Guide](./TROUBLESHOOTING.md)
