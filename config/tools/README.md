Native and MCP tools go here.

- JSON files describe MCP servers (stdio, SSE, or streamable HTTP).
- Filenames starting with `_` are ignored by the loader.
- `{ENV:VAR}` and `{ENV:VAR:-default}` are substituted at load time.
- If a required `{ENV:VAR}` is missing, the file is skipped.

The default DeepSeek chat agent does **not** receive these tools. They are
used only when a user calls `/mcp`, `/agent`, or prefixes a message with `mcp:`.

## Timeweb Cloud

`config/tools/mcp/timeweb.json` is the official Timeweb Cloud MCP client config
(HTTP `https://api.timeweb.cloud/api/v1/mcp/search`). Set `TIMEWEB_TOKEN`
(https://timeweb.cloud/my/api-keys).

The npm package from https://github.com/timeweb-cloud/mcp-server is deprecated.
A stdio fallback example is `_timeweb_stdio.example.json`.

## Extra servers

```
MCP_SERVER_URL=https://example.com/mcp
MCP_API_KEY=
MCP_SERVER_NAME=env-mcp
```

or a local stdio server:

```
MCP_SERVER_COMMAND=npx -y @modelcontextprotocol/server-filesystem /data
```
